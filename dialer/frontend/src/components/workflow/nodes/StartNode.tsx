import React, { useCallback } from 'react';
import { BaseWorkflowNode } from '../BaseWorkflowNode';
import { StartNodeData } from '@/types/workflow';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useNodeUpdate } from '../WorkflowCanvas';

interface StartNodeProps {
  data: StartNodeData;
  isConnectable: boolean;
  selected?: boolean;
}

export const StartNode: React.FC<StartNodeProps> = ({ data, isConnectable, selected }) => {
  const { updateNodeData } = useNodeUpdate();

  const handlePhoneChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateNodeData(data.id, { phoneNumber: e.target.value });
  }, [updateNodeData, data.id]);

  const handlePromptChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateNodeData(data.id, { initialPrompt: e.target.value });
  }, [updateNodeData, data.id]);

  return (
    <BaseWorkflowNode
      data={data}
      isConnectable={isConnectable}
      selected={selected}
      targetHandles={[]} // Start node has no input handles
    >
      <div className="space-y-3">
        <div>
          <Label htmlFor="phone" className="text-xs font-medium text-gray-700">Phone Number</Label>
          <Input
            id="phone"
            placeholder="+1234567890"
            value={data.phoneNumber || ''}
            onChange={handlePhoneChange}
            className="text-xs mt-1 bg-white/50 border-white/30 focus:bg-white/70 focus:border-blue-300 transition-all"
          />
        </div>
        <div>
          <Label className="text-xs font-medium text-gray-700">Initial Prompt</Label>
          <Textarea
            value={data.initialPrompt || 'Hello! This is an automated call.'}
            onChange={handlePromptChange}
            className="text-xs mt-1 resize-none bg-white/50 border-white/30 focus:bg-white/70 focus:border-blue-300 transition-all"
            rows={2}
            placeholder="Enter initial call message..."
          />
        </div>
      </div>
    </BaseWorkflowNode>
  );
};

export default StartNode;