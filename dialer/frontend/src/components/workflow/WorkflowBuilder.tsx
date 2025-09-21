import React, { useState, useCallback } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useDrop } from 'react-dnd';
import { v4 as uuidv4 } from 'uuid';
import { ReactFlowProvider } from '@xyflow/react';

import { WorkflowCanvas } from './WorkflowCanvas';
import { NodePalette } from './NodePalette';
import { Workflow, WorkflowNodeData, NodeType } from '@/types/workflow';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Play, 
  Save, 
  Download, 
  Code
} from 'lucide-react';

interface WorkflowBuilderProps {
  initialWorkflow?: Workflow;
  onWorkflowSave?: (workflow: Workflow) => void;
  onWorkflowExecute?: (workflow: Workflow) => void;
  className?: string;
}

// Default node data based on type
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getDefaultNodeData = (type: NodeType, _position: { x: number; y: number }): WorkflowNodeData => {
  const baseData = {
    id: uuidv4(),
    type,
    label: '',
  };

  switch (type) {
    case 'start':
      return {
        ...baseData,
        type: 'start' as const,
        label: 'Start Call',
        phoneNumber: '',
        initialPrompt: 'Hello! This is an automated call.',
      };
    case 'call':
      return {
        ...baseData,
        type: 'call' as const,
        label: 'Make Call',
        phoneNumber: '',
        prompt: 'Please hold while we connect your call.',
      };
    case 'message':
      return {
        ...baseData,
        type: 'message' as const,
        label: 'Send Message',
        message: 'Your message content here.',
        messageType: 'sms' as const,
      };
    case 'conditional':
      return {
        ...baseData,
        type: 'conditional' as const,
        label: 'Check Condition',
        condition: 'user_response',
        conditionType: 'response_contains' as const,
        value: 'yes',
        trueLabel: 'Yes',
        falseLabel: 'No',
      };
    case 'input':
      return {
        ...baseData,
        type: 'input' as const,
        label: 'Get Input',
        prompt: 'Please provide your response.',
        inputType: 'speech' as const,
        timeout: 5,
        maxRetries: 3,
      };
    case 'delay':
      return {
        ...baseData,
        type: 'delay' as const,
        label: 'Wait',
        duration: 5,
        unit: 'seconds' as const,
      };
    case 'end':
      return {
        ...baseData,
        type: 'end' as const,
        label: 'End Call',
        reason: 'Call completed successfully.',
      };
    default:
      throw new Error(`Unknown node type: ${type}`);
  }
};

interface DropZoneProps {
  children: React.ReactNode;
  onNodeDrop: (nodeType: NodeType, position: { x: number; y: number }) => void;
}

const DropZone: React.FC<DropZoneProps> = ({ children, onNodeDrop }) => {
  const [{ isOver }, drop] = useDrop({
    accept: 'workflow-node',
    drop: (item: { nodeType: NodeType }, monitor) => {
      const clientOffset = monitor.getClientOffset();
      
      if (clientOffset) {
        // Simple approach: use screen coordinates and adjust for sidebar
        const x = Math.max(50, clientOffset.x - 300); // Account for 300px sidebar
        const y = Math.max(50, clientOffset.y - 100); // Account for header
        
        console.log('DropZone drop:', item.nodeType, 'at screen coords:', clientOffset, 'adjusted to:', { x, y });
        onNodeDrop(item.nodeType, { x, y });
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  return (
    <div 
      // @ts-expect-error - react-dnd drop ref type compatibility
      ref={drop} 
      className={`w-full h-full transition-colors ${
        isOver ? 'bg-blue-50 border-2 border-dashed border-blue-300' : ''
      }`}
      data-drop-zone="true"
    >
      {children}
    </div>
  );
};

export const WorkflowBuilder: React.FC<WorkflowBuilderProps> = ({
  initialWorkflow,
  onWorkflowSave,
  onWorkflowExecute,
  className = '',
}) => {
  const [workflow, setWorkflow] = useState<Workflow>(
    initialWorkflow || {
      id: uuidv4(),
      name: 'Untitled Workflow',
      description: '',
      nodes: [],
      edges: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'draft',
    }
  );

  const [isExecuting, setIsExecuting] = useState(false);

  const handleNodeDrop = useCallback((nodeType: NodeType, position: { x: number; y: number }) => {
    console.log('handleNodeDrop called:', nodeType, position);
    
    const nodeData = getDefaultNodeData(nodeType, position);
    const newNode = {
      id: nodeData.id,
      type: nodeType,
      position,
      data: nodeData,
    };

    console.log('Creating new node:', newNode);
    console.log('Current workflow nodes before add:', workflow.nodes);

    setWorkflow((prev) => {
      const updatedWorkflow = {
        ...prev,
        nodes: [...prev.nodes, newNode],
        updatedAt: new Date(),
      };
      console.log('Updated workflow nodes:', updatedWorkflow.nodes);
      return updatedWorkflow;
    });
  }, [workflow.nodes]);

  const handleWorkflowChange = useCallback((updatedWorkflow: Workflow) => {
    setWorkflow(updatedWorkflow);
  }, []);

  const handleSave = useCallback(() => {
    if (onWorkflowSave) {
      onWorkflowSave(workflow);
    }
  }, [workflow, onWorkflowSave]);

  const handleExecute = useCallback(async () => {
    if (onWorkflowExecute) {
      setIsExecuting(true);
      try {
        await onWorkflowExecute(workflow);
      } finally {
        setIsExecuting(false);
      }
    }
  }, [workflow, onWorkflowExecute]);

  const handleExportPython = useCallback(() => {
    // TODO: Implement Python export
    console.log('Exporting to Python...', workflow);
  }, [workflow]);

  const handleExportJSON = useCallback(() => {
    const dataStr = JSON.stringify(workflow, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `workflow-${workflow.name.toLowerCase().replace(/\s+/g, '-')}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }, [workflow]);

  return (
    <DndProvider backend={HTML5Backend}>
      <ReactFlowProvider>
        <div className={`workflow-builder flex flex-col h-full ${className}`}>
          {/* Header */}
          <Card className="rounded-b-none border-b-0">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 max-w-md">
                  <Label htmlFor="workflow-name" className="text-sm font-medium">
                    Workflow Name
                  </Label>
                  <Input
                    id="workflow-name"
                    value={workflow.name}
                    onChange={(e) => 
                      setWorkflow(prev => ({ 
                        ...prev, 
                        name: e.target.value, 
                        updatedAt: new Date() 
                      }))
                    }
                    className="mt-1"
                    placeholder="Enter workflow name..."
                  />
                </div>

                <div className="flex items-center gap-2 ml-6">
                  <Button
                    onClick={handleSave}
                    variant="outline"
                    size="sm"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                  
                  <Button
                    onClick={handleExecute}
                    disabled={isExecuting || workflow.nodes.length === 0}
                    variant="default"
                    size="sm"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    {isExecuting ? 'Running...' : 'Execute'}
                  </Button>

                  <Separator orientation="vertical" className="h-6" />

                  <Button
                    onClick={handleExportPython}
                    variant="outline"
                    size="sm"
                  >
                    <Code className="w-4 h-4 mr-2" />
                    Python
                  </Button>

                  <Button
                    onClick={handleExportJSON}
                    variant="outline"
                    size="sm"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    JSON
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Main Content */}
          <div className="flex-1 flex overflow-hidden">
            {/* Node Palette */}
            <div className="w-72 border-r border-gray-200 bg-gray-50">
              <NodePalette className="border-0 rounded-none bg-transparent" />
            </div>

            {/* Canvas Area */}
            <div className="flex-1 relative">
              <DropZone onNodeDrop={handleNodeDrop}>
                <WorkflowCanvas
                  workflow={workflow}
                  onWorkflowChange={handleWorkflowChange}
                  className="absolute inset-0"
                />
              </DropZone>
            </div>
          </div>

          {/* Status Bar */}
          <Card className="rounded-t-none border-t-0">
            <CardContent className="py-2 px-4">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center gap-4">
                  <span>{workflow.nodes.length} nodes</span>
                  <span>{workflow.edges.length} connections</span>
                  <span className="capitalize">Status: {workflow.status}</span>
                </div>
                <div>
                  Last updated: {workflow.updatedAt.toLocaleTimeString()}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </ReactFlowProvider>
    </DndProvider>
  );
};

export default WorkflowBuilder;