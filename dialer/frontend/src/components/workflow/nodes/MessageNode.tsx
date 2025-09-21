import React, { useCallback } from 'react';
import { BaseWorkflowNode } from '../BaseWorkflowNode';
import { MessageNodeData } from '@/types/workflow';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNodeUpdate } from '../WorkflowCanvas';

interface MessageNodeProps {
  data: MessageNodeData;
  isConnectable: boolean;
  selected?: boolean;
}

export const MessageNode: React.FC<MessageNodeProps> = ({ data, isConnectable, selected }) => {
  const { updateNodeData } = useNodeUpdate();

  const handleMessageChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateNodeData(data.id, { message: e.target.value });
  }, [updateNodeData, data.id]);

  const handleTypeChange = useCallback((messageType: string) => {
    updateNodeData(data.id, { messageType: messageType as 'sms' | 'voice' });
  }, [updateNodeData, data.id]);

  return (
    <BaseWorkflowNode
      data={data}
      isConnectable={isConnectable}
      selected={selected}
    >
      <div className="space-y-3">
        <div>
          <Label className="text-xs font-medium text-gray-700">Message Type</Label>
          <Select
            value={data.messageType || 'sms'}
            onValueChange={handleTypeChange}
          >
            <SelectTrigger className="text-xs h-7 mt-1 bg-white/50 border-white/30 focus:bg-white/70 focus:border-blue-300">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sms">SMS</SelectItem>
              <SelectItem value="voice">Voice</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label className="text-xs font-medium text-gray-700">Message Content</Label>
          <Textarea
            value={data.message || ''}
            onChange={handleMessageChange}
            className="text-xs mt-1 resize-none bg-white/50 border-white/30 focus:bg-white/70 focus:border-blue-300 transition-all"
            rows={3}
            placeholder="Enter message content..."
          />
        </div>
      </div>
    </BaseWorkflowNode>
  );
};

export default MessageNode;