from fastapi import FastAPI, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uvicorn
import os
import uuid
from datetime import datetime
from twilio.rest import Client
from twilio.twiml.voice_response import VoiceResponse
from dotenv import load_dotenv
from cerebras.cloud.sdk import Cerebras

# Load environment variables
load_dotenv("config.env")

app = FastAPI(title="ConversationAI API", version="2.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class ConversationRequest(BaseModel):
    phone_number: str
    prompt: str
    conversation_id: Optional[str] = None

class ConversationResponse(BaseModel):
    conversation_id: str
    call_sid: str
    status: str
    message: str

class Conversation(BaseModel):
    id: str
    phone_number: str
    prompt: str
    status: str
    created_at: datetime
    call_sid: Optional[str] = None
    duration: Optional[int] = None
    transcript: Optional[str] = None

class ConversationUpdate(BaseModel):
    status: str
    duration: Optional[int] = None
    transcript: Optional[str] = None

# Workflow models
class WorkflowRequest(BaseModel):
    workflow_data: dict
    phone_number: Optional[str] = None

class WorkflowResponse(BaseModel):
    execution_id: str
    status: str
    message: str

class WorkflowExecuteRequest(BaseModel):
    workflow_id: str
    workflow_data: dict
    phone_number: Optional[str] = None

# Twilio configuration
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "your_account_sid")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "your_auth_token")
TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER", "your_twilio_number")

# Cerebras configuration
CEREBRAS_API_KEY = os.getenv("CEREBRAS_API_KEY")

# Initialize Twilio client
twilio_client = None
if TWILIO_ACCOUNT_SID != "your_account_sid":
    twilio_client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

# Initialize Cerebras client
cerebras_client = None
if CEREBRAS_API_KEY:
    cerebras_client = Cerebras(api_key=CEREBRAS_API_KEY)
    print("[init] Cerebras client initialized")
else:
    print("[init] Cerebras API key not set; AI responses will use fallback")

# In-memory storage (replace with database in production)
conversations_db: Dict[str, Conversation] = {}
workflows_db: Dict[str, dict] = {}
workflow_executions_db: Dict[str, dict] = {}

async def generate_ai_response(conversation_context: str, user_input: str, conversation_type: str) -> str:
    """Generate AI response using Cerebras"""
    if not cerebras_client:
        # Fallback to static responses if Cerebras is not available
        print("[ai] Cerebras client unavailable; returning fallback response")
        return "I'm here to help! How can I assist you today?"
    
    try:
        # Create a context-aware prompt for the AI
        system_prompt = f"""You are a helpful AI assistant conducting a phone conversation. 
        Conversation type: {conversation_type}
        Context: {conversation_context}
        
        The person just responded with: "{user_input}"
        
        Generate a natural, conversational response that:
        1. Acknowledges their input
        2. Provides helpful information or asks follow-up questions
        3. Keeps the conversation flowing naturally
        4. Is appropriate for a phone call (not too long)
        
        Respond as if you're speaking directly to them on the phone."""
        
        response = cerebras_client.chat.completions.create(
            model="llama-3.1-8b-instruct",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"User said: {user_input}"}
            ],
            max_tokens=150,
            temperature=0.7
        )
        
        return response.choices[0].message.content.strip()
        
    except Exception as e:
        print(f"[ai] Error generating AI response via Cerebras: {e}")
        # Fallback response
        return "I understand. Let me help you with that. What would you like to know more about?"

@app.get("/ai/test")
async def ai_test(prompt: Optional[str] = None):
    """Simple endpoint to verify Cerebras responses."""
    test_prompt = prompt or "Say a friendly one-sentence hello and include the word 'Cerebras'."
    print(f"[ai-test] Received test prompt: {test_prompt}")
    reply = await generate_ai_response(
        conversation_context="Cerebras connectivity test",
        user_input=test_prompt,
        conversation_type="general"
    )
    return {
        "provider": "cerebras" if cerebras_client else "fallback",
        "model": "llama-3.1-8b-instruct" if cerebras_client else None,
        "prompt": test_prompt,
        "reply": reply
    }

@app.get("/")
async def root():
    return {"message": "Welcome to ConversationAI API!", "version": "2.0.0"}

@app.get("/health")
async def health_check():
    return {
        "status": "healthy", 
        "twilio_configured": twilio_client is not None,
        "cerebras_configured": cerebras_client is not None
    }

# Conversation endpoints
@app.get("/conversations", response_model=List[Conversation])
async def get_conversations():
    """Get all conversations"""
    return list(conversations_db.values())

@app.get("/conversations/{conversation_id}", response_model=Conversation)
async def get_conversation(conversation_id: str):
    """Get a specific conversation"""
    if conversation_id not in conversations_db:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conversations_db[conversation_id]

@app.post("/conversations", response_model=ConversationResponse)
async def start_conversation(request: ConversationRequest):
    """Start a new AI-powered conversation call"""
    if not twilio_client:
        raise HTTPException(
            status_code=500, 
            detail="Twilio not configured. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER environment variables."
        )
    
    try:
        print(f"[convo] Starting conversation for {request.phone_number}")
        
        # Validate phone number format
        if not request.phone_number.startswith('+'):
            request.phone_number = '+1' + request.phone_number.replace('+', '').replace('-', '').replace(' ', '')
        
        # Generate conversation ID
        conversation_id = request.conversation_id or str(uuid.uuid4())
        
        # Create conversation record
        conversation = Conversation(
            id=conversation_id,
            phone_number=request.phone_number,
            prompt=request.prompt,
            status="initiating",
            created_at=datetime.now()
        )
        conversations_db[conversation_id] = conversation
        print(f"[convo] Created conversation id={conversation_id}")
        
        # Check if this is a trial account and provide helpful error message
        try:
            # Attempt to create the call
            call = twilio_client.calls.create(
                to=request.phone_number,
                from_=TWILIO_PHONE_NUMBER,
                url=f"http://localhost:8000/conversations/{conversation_id}/twiml"  # TwiML endpoint
            )
            
            conversation.call_sid = call.sid
            conversation.status = call.status
            conversations_db[conversation_id] = conversation
            
            print(f"[convo] Call initiated: {call.sid}")
            
            return ConversationResponse(
                conversation_id=conversation_id,
                call_sid=call.sid,
                status=call.status,
                message="Conversation call initiated successfully"
            )
            
        except Exception as twilio_error:
            error_message = str(twilio_error)
            if "unverified" in error_message.lower() and "trial" in error_message.lower():
                # This is a trial account verification error
                conversation.status = "failed"
                conversations_db[conversation_id] = conversation
                
                raise HTTPException(
                    status_code=400,
                    detail={
                        "error": "phone_verification_required",
                        "message": "This phone number is not verified for your Twilio trial account.",
                        "instructions": [
                            "1. Log in to your Twilio Console at https://console.twilio.com",
                            "2. Navigate to Phone Numbers > Manage > Verified Caller IDs",
                            "3. Click 'Add a new number' and verify the phone number you want to call",
                            "4. Or upgrade your account to remove trial restrictions"
                        ],
                        "phone_number": request.phone_number,
                        "twilio_error": error_message
                    }
                )
            else:
                # Other Twilio error
                conversation.status = "failed"
                conversations_db[conversation_id] = conversation
                raise HTTPException(status_code=500, detail=f"Twilio error: {error_message}")
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[convo] Failed to start conversation: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@app.get("/conversations/{conversation_id}/twiml")
async def get_conversation_twiml(conversation_id: str):
    """Generate TwiML for conversation flow"""
    if conversation_id not in conversations_db:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    conversation = conversations_db[conversation_id]
    response = VoiceResponse()
    
    # Add greeting based on prompt
    greeting = f"Hello! {conversation.prompt}"
    response.say(greeting, voice='alice')
    
    # Add conversation flow based on prompt type with Gather for responses
    if "customer service" in conversation.prompt.lower():
        response.say("I'm calling to follow up on your recent experience with us.", voice='alice')
        gather = response.gather(
            num_digits=1,
            timeout=10,
            action=f"/conversations/{conversation_id}/gather",
            method="POST"
        )
        gather.say("Press 1 if you're satisfied with our service, 2 if you have concerns, or 3 if you need help with something specific.", voice='alice')
        response.say("I didn't hear a response. Let me try again.", voice='alice')
        response.redirect(f"/conversations/{conversation_id}/gather")
        
    elif "sales" in conversation.prompt.lower():
        response.say("I'd like to share some exciting news about our latest products.", voice='alice')
        gather = response.gather(
            num_digits=1,
            timeout=10,
            action=f"/conversations/{conversation_id}/gather",
            method="POST"
        )
        gather.say("Press 1 if you're interested in learning more, 2 if you want to schedule a demo, or 3 if now is not a good time.", voice='alice')
        response.say("I didn't hear a response. Let me try again.", voice='alice')
        response.redirect(f"/conversations/{conversation_id}/gather")
        
    elif "appointment" in conversation.prompt.lower():
        response.say("This is a friendly reminder about your upcoming appointment.", voice='alice')
        gather = response.gather(
            num_digits=1,
            timeout=10,
            action=f"/conversations/{conversation_id}/gather",
            method="POST"
        )
        gather.say("Press 1 to confirm your appointment, 2 to reschedule, or 3 if you need to cancel.", voice='alice')
        response.say("I didn't hear a response. Let me try again.", voice='alice')
        response.redirect(f"/conversations/{conversation_id}/gather")
        
    else:
        response.say("I hope you're doing well. I wanted to discuss something important with you.", voice='alice')
        gather = response.gather(
            num_digits=1,
            timeout=10,
            action=f"/conversations/{conversation_id}/gather",
            method="POST"
        )
        gather.say("Press 1 if you have a moment to chat, 2 if you'd prefer to call back later, or 3 if you have questions.", voice='alice')
        response.say("I didn't hear a response. Let me try again.", voice='alice')
        response.redirect(f"/conversations/{conversation_id}/gather")
    
    return Response(content=str(response), media_type="application/xml")

@app.put("/conversations/{conversation_id}")
async def update_conversation(conversation_id: str, update: ConversationUpdate):
    """Update conversation status and details"""
    if conversation_id not in conversations_db:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    conversation = conversations_db[conversation_id]
    conversation.status = update.status
    if update.duration is not None:
        conversation.duration = update.duration
    if update.transcript is not None:
        conversation.transcript = update.transcript
    
    conversations_db[conversation_id] = conversation
    return {"message": "Conversation updated successfully"}

@app.get("/conversations/{conversation_id}/status")
async def get_conversation_status(conversation_id: str):
    """Get real-time conversation status from Twilio"""
    if conversation_id not in conversations_db:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    conversation = conversations_db[conversation_id]
    print(f"[status] Lookup for convo={conversation_id} call_sid={conversation.call_sid}")
    
    if not conversation.call_sid or not twilio_client:
        return {
            "conversation_id": conversation_id,
            "status": conversation.status,
            "message": "No active call or Twilio not configured"
        }
    
    try:
        call = twilio_client.calls(conversation.call_sid).fetch()
        
        # Update conversation status based on Twilio status
        if call.status != conversation.status:
            conversation.status = call.status
            if call.duration:
                conversation.duration = int(call.duration)
            conversations_db[conversation_id] = conversation
        
        return {
            "conversation_id": conversation_id,
            "call_sid": call.sid,
            "status": call.status,
            "direction": call.direction,
            "from": call.from_,
            "to": call.to,
            "start_time": call.start_time,
            "end_time": call.end_time,
            "duration": call.duration
        }
    except Exception as e:
        # Graceful fallback: return stored conversation status instead of 404
        print(f"[status] Twilio fetch failed for convo={conversation_id}: {e}")
        return {
            "conversation_id": conversation_id,
            "status": conversation.status,
            "message": f"Unable to fetch live call status: {str(e)}"
        }

@app.post("/conversations/{conversation_id}/gather")
async def handle_gather(conversation_id: str, Digits: str = Form("")):
    """Handle user input from Twilio Gather with AI-generated responses"""
    if conversation_id not in conversations_db:
        response = VoiceResponse()
        response.say("Sorry, I couldn't find your conversation. Goodbye.", voice='alice')
        response.hangup()
        return Response(content=str(response), media_type="application/xml")
    
    conversation = conversations_db[conversation_id]
    digits = Digits
    
    response = VoiceResponse()
    
    # Map digits to user responses for AI context
    digit_responses = {
        "1": "satisfied/yes/interested",
        "2": "concerned/no/not interested", 
        "3": "need help/have questions"
    }
    
    user_response = digit_responses.get(digits, "unclear response")
    
    # Determine conversation type from prompt
    conversation_type = "general"
    if "customer service" in conversation.prompt.lower():
        conversation_type = "customer service"
    elif "sales" in conversation.prompt.lower():
        conversation_type = "sales"
    elif "appointment" in conversation.prompt.lower():
        conversation_type = "appointment"
    
    # Generate AI response
    ai_response = await generate_ai_response(
        conversation_context=conversation.prompt,
        user_input=user_response,
        conversation_type=conversation_type
    )
    
    # Use AI response or fallback to static responses
    if ai_response and ai_response != "I'm here to help! How can I assist you today?":
        response.say(ai_response, voice='alice')
    else:
        # Fallback to static responses if AI fails
        if conversation_type == "customer service":
            if digits == "1":
                response.say("That's wonderful to hear! Is there anything else we can do to improve your experience?", voice='alice')
            elif digits == "2":
                response.say("I'm sorry to hear you have concerns. Let me connect you with our support team right away.", voice='alice')
            elif digits == "3":
                response.say("Of course! What specific help do you need today?", voice='alice')
            else:
                response.say("I didn't understand that response. Let me try again.", voice='alice')
                response.redirect(f"/conversations/{conversation_id}/gather")
        
        elif conversation_type == "sales":
            if digits == "1":
                response.say("Excellent! Our new product features advanced AI capabilities and 50% better performance. Would you like to schedule a demo?", voice='alice')
            elif digits == "2":
                response.say("Perfect! I can schedule a demo for you. What day works best this week?", voice='alice')
            elif digits == "3":
                response.say("No problem at all. When would be a better time for me to call you back?", voice='alice')
            else:
                response.say("I didn't understand that response. Let me try again.", voice='alice')
                response.redirect(f"/conversations/{conversation_id}/gather")
        
        elif conversation_type == "appointment":
            if digits == "1":
                response.say("Great! Your appointment is confirmed for tomorrow at 2 PM. See you then!", voice='alice')
            elif digits == "2":
                response.say("No problem! I'll help you reschedule. What day and time works better for you?", voice='alice')
            elif digits == "3":
                response.say("I understand. I'll cancel your appointment and you can reschedule anytime. Take care!", voice='alice')
            else:
                response.say("I didn't understand that response. Let me try again.", voice='alice')
                response.redirect(f"/conversations/{conversation_id}/gather")
        
        else:
            if digits == "1":
                response.say("Thank you! I'd like to discuss our new partnership opportunities. Are you familiar with our company?", voice='alice')
            elif digits == "2":
                response.say("Of course! When would be a better time for me to call you back?", voice='alice')
            elif digits == "3":
                response.say("I'd be happy to answer your questions. What would you like to know?", voice='alice')
            else:
                response.say("I didn't understand that response. Let me try again.", voice='alice')
                response.redirect(f"/conversations/{conversation_id}/gather")
    
    # Add follow-up gather for continued conversation
    if digits in ["1", "2", "3"]:
        gather = response.gather(
            num_digits=1,
            timeout=15,
            action=f"/conversations/{conversation_id}/followup",
            method="POST"
        )
        gather.say("Press 1 to continue the conversation, 2 to schedule a follow-up, or 3 to end the call.", voice='alice')
        response.say("I didn't hear a response. Thank you for your time. Goodbye!", voice='alice')
        response.hangup()
    
    return Response(content=str(response), media_type="application/xml")

@app.post("/conversations/{conversation_id}/followup")
async def handle_followup(conversation_id: str, Digits: str = Form("")):
    """Handle follow-up conversation with AI responses"""
    if conversation_id not in conversations_db:
        response = VoiceResponse()
        response.say("Sorry, I couldn't find your conversation. Goodbye.", voice='alice')
        response.hangup()
        return Response(content=str(response), media_type="application/xml")
    
    conversation = conversations_db[conversation_id]
    digits = Digits
    response = VoiceResponse()
    
    # Map digits to follow-up responses
    followup_responses = {
        "1": "continue conversation",
        "2": "schedule follow-up", 
        "3": "end call"
    }
    
    user_response = followup_responses.get(digits, "unclear response")
    
    # Determine conversation type
    conversation_type = "general"
    if "customer service" in conversation.prompt.lower():
        conversation_type = "customer service"
    elif "sales" in conversation.prompt.lower():
        conversation_type = "sales"
    elif "appointment" in conversation.prompt.lower():
        conversation_type = "appointment"
    
    # Generate AI response for follow-up
    ai_response = await generate_ai_response(
        conversation_context=f"Follow-up conversation. Original context: {conversation.prompt}",
        user_input=user_response,
        conversation_type=conversation_type
    )
    
    if digits == "1":
        # Use AI response or fallback
        if ai_response and ai_response != "I'm here to help! How can I assist you today?":
            response.say(ai_response, voice='alice')
        else:
            response.say("Great! Let's continue our discussion. What other questions do you have?", voice='alice')
        
        # Add another gather for continued conversation
        gather = response.gather(
            num_digits=1,
            timeout=15,
            action=f"/conversations/{conversation_id}/end",
            method="POST"
        )
        gather.say("Press 1 if you have more questions, or 2 to end the call.", voice='alice')
        response.say("Thank you for your time. Goodbye!", voice='alice')
        response.hangup()
        
    elif digits == "2":
        if ai_response and ai_response != "I'm here to help! How can I assist you today?":
            response.say(ai_response, voice='alice')
        else:
            response.say("Perfect! I'll schedule a follow-up call for next week. Thank you for your time!", voice='alice')
        response.hangup()
        
    elif digits == "3":
        if ai_response and ai_response != "I'm here to help! How can I assist you today?":
            response.say(ai_response, voice='alice')
        else:
            response.say("Thank you for your time today. Have a great day! Goodbye!", voice='alice')
        response.hangup()
        
    else:
        response.say("Thank you for your time. Goodbye!", voice='alice')
        response.hangup()
    
    return Response(content=str(response), media_type="application/xml")

@app.post("/conversations/{conversation_id}/end")
async def handle_end(conversation_id: str, Digits: str = Form("")):
    """Handle conversation end"""
    digits = Digits
    response = VoiceResponse()
    
    if digits == "1":
        response.say("I'm here to help! What else would you like to know?", voice='alice')
        # Could add more conversation logic here
        response.say("Thank you for your time. Goodbye!", voice='alice')
    else:
        response.say("Thank you for your time today. Have a great day! Goodbye!", voice='alice')
    
    response.hangup()
    return Response(content=str(response), media_type="application/xml")

@app.post("/conversations/webhook")
async def conversation_webhook(request: dict):
    """Webhook endpoint for Twilio call status updates"""
    call_sid = request.get("CallSid")
    call_status = request.get("CallStatus")
    call_duration = request.get("CallDuration")
    
    # Find conversation by call_sid
    conversation = None
    for conv in conversations_db.values():
        if conv.call_sid == call_sid:
            conversation = conv
            break
    
    if conversation:
        conversation.status = call_status
        if call_duration:
            conversation.duration = int(call_duration)
        conversations_db[conversation.id] = conversation
        
        print(f"Updated conversation {conversation.id}: {call_status}")
    
    return {"message": "Webhook received"}

@app.delete("/conversations/{conversation_id}")
async def delete_conversation(conversation_id: str):
    """Delete a conversation"""
    if conversation_id not in conversations_db:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    deleted_conversation = conversations_db.pop(conversation_id)
    return {"message": f"Conversation {conversation_id} deleted", "conversation": deleted_conversation}

# Workflow endpoints
@app.post("/workflows", response_model=dict)
async def save_workflow(workflow: dict):
    """Save a workflow"""
    try:
        workflow_id = workflow.get("id") or str(uuid.uuid4())
        workflow["id"] = workflow_id
        workflow["updated_at"] = datetime.now().isoformat()
        
        workflows_db[workflow_id] = workflow
        print(f"[workflow] Saved workflow: {workflow.get('name', 'Untitled')} (ID: {workflow_id})")
        
        return {
            "message": "Workflow saved successfully",
            "workflow_id": workflow_id,
            "workflow": workflow
        }
    except Exception as e:
        print(f"[workflow] Error saving workflow: {e}")
        raise HTTPException(status_code=400, detail=f"Failed to save workflow: {str(e)}")

@app.get("/workflows")
async def get_workflows():
    """Get all workflows"""
    return list(workflows_db.values())

@app.get("/workflows/{workflow_id}")
async def get_workflow(workflow_id: str):
    """Get a specific workflow"""
    if workflow_id not in workflows_db:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return workflows_db[workflow_id]

@app.post("/workflows/execute", response_model=dict)
async def execute_workflow(request: WorkflowExecuteRequest):
    """Execute a workflow"""
    try:
        execution_id = str(uuid.uuid4())
        execution_data = {
            "id": execution_id,
            "workflow_id": request.workflow_id,
            "workflow_data": request.workflow_data,
            "phone_number": request.phone_number,
            "status": "pending",
            "created_at": datetime.now().isoformat(),
            "logs": []
        }
        
        workflow_executions_db[execution_id] = execution_data
        
        # For demo purposes, simulate workflow execution
        print(f"[workflow-exec] Starting execution {execution_id} for workflow {request.workflow_id}")
        
        # Basic workflow execution simulation
        nodes = request.workflow_data.get("nodes", [])
        if not nodes:
            raise HTTPException(status_code=400, detail="Workflow has no nodes to execute")
        
        # Find start node
        start_nodes = [node for node in nodes if node.get("type") == "start"]
        if not start_nodes:
            raise HTTPException(status_code=400, detail="Workflow must have a start node")
        
        # Simulate execution
        execution_data["status"] = "running"
        execution_data["logs"].append({
            "timestamp": datetime.now().isoformat(),
            "message": f"Workflow execution started with {len(nodes)} nodes",
            "node_id": start_nodes[0].get("id", "unknown")
        })
        
        # For now, just mark as completed
        # In a real implementation, this would execute the actual workflow steps
        execution_data["status"] = "completed"
        execution_data["completed_at"] = datetime.now().isoformat()
        execution_data["logs"].append({
            "timestamp": datetime.now().isoformat(),
            "message": "Workflow execution completed successfully",
            "node_id": "workflow"
        })
        
        workflow_executions_db[execution_id] = execution_data
        
        return {
            "execution_id": execution_id,
            "status": "completed",
            "message": "Workflow executed successfully (simulated)",
            "execution_data": execution_data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[workflow-exec] Error executing workflow: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to execute workflow: {str(e)}")

@app.get("/workflows/executions/{execution_id}")
async def get_workflow_execution(execution_id: str):
    """Get workflow execution status"""
    if execution_id not in workflow_executions_db:
        raise HTTPException(status_code=404, detail="Workflow execution not found")
    return workflow_executions_db[execution_id]

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)