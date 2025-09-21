import { Node, Edge } from '@xyflow/react';
import { ReactNode } from 'react';

export type NodeType = 
  | 'start' 
  | 'call' 
  | 'message' 
  | 'conditional' 
  | 'input' 
  | 'delay' 
  | 'end';

export interface BaseNodeData {
  id: string;
  label: string;
  type: NodeType;
  [key: string]: unknown; // Index signature for ReactFlow compatibility
}

export interface StartNodeData extends BaseNodeData {
  type: 'start';
  phoneNumber?: string;
  initialPrompt?: string;
}

export interface CallNodeData extends BaseNodeData {
  type: 'call';
  phoneNumber: string;
  prompt: string;
  voiceSettings?: {
    voice?: string;
    speed?: number;
    pitch?: number;
  };
}

export interface MessageNodeData extends BaseNodeData {
  type: 'message';
  message: string;
  messageType: 'sms' | 'voice';
}

export interface ConditionalNodeData extends BaseNodeData {
  type: 'conditional';
  condition: string;
  conditionType: 'response_contains' | 'response_equals' | 'duration_greater' | 'duration_less' | 'custom';
  value: string;
  trueLabel?: string;
  falseLabel?: string;
}

export interface InputNodeData extends BaseNodeData {
  type: 'input';
  prompt: string;
  inputType: 'speech' | 'dtmf' | 'both';
  timeout?: number;
  maxRetries?: number;
}

export interface DelayNodeData extends BaseNodeData {
  type: 'delay';
  duration: number;
  unit: 'seconds' | 'minutes' | 'hours';
}

export interface EndNodeData extends BaseNodeData {
  type: 'end';
  reason?: string;
}

export type WorkflowNodeData = 
  | StartNodeData 
  | CallNodeData 
  | MessageNodeData 
  | ConditionalNodeData 
  | InputNodeData 
  | DelayNodeData 
  | EndNodeData;

// Extend ReactFlow's Node type
export interface WorkflowNode extends Omit<Node, 'data'> {
  data: WorkflowNodeData;
}

// Extend ReactFlow's Edge type  
export interface WorkflowEdge extends Edge {
  animated?: boolean;
  label?: string | ReactNode;
  condition?: string;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  createdAt: Date;
  updatedAt: Date;
  status?: 'draft' | 'published' | 'running' | 'completed' | 'failed';
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt: Date;
  completedAt?: Date;
  currentNodeId?: string;
  executionData: Record<string, unknown>;
  logs: ExecutionLog[];
}

export interface ExecutionLog {
  timestamp: Date;
  nodeId: string;
  event: 'node_entered' | 'node_completed' | 'node_failed' | 'condition_evaluated' | 'user_input';
  data: Record<string, unknown>;
  message?: string;
}

export interface PythonGenerationOptions {
  includeComments?: boolean;
  useAsyncAwait?: boolean;
  includeTryCatch?: boolean;
  twilioVersion?: string;
}

export type ErrorType = 'save' | 'execute' | 'connection' | 'validation';

export interface WorkflowError {
  id: string;
  type: ErrorType;
  message: string;
  timestamp: Date;
  nodeId?: string;
}