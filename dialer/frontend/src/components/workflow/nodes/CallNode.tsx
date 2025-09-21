import React, { useCallback } from 'react';
import { BaseWorkflowNode } from '../BaseWorkflowNode';
import { CallNodeData } from '@/types/workflow';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNodeUpdate } from '../WorkflowCanvas';

interface CallNodeProps {
  data: CallNodeData;
  isConnectable: boolean;
  selected?: boolean;
}

export const CallNode: React.FC<CallNodeProps> = ({ data, isConnectable, selected }) => {
  const { updateNodeData } = useNodeUpdate();

  const handlePhoneChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateNodeData(data.id, { phoneNumber: e.target.value });
  }, [updateNodeData, data.id]);

  const handlePromptChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateNodeData(data.id, { prompt: e.target.value });
  }, [updateNodeData, data.id]);

  const handleVoiceChange = useCallback((voice: string) => {
    updateNodeData(data.id, { 
      voiceSettings: { 
        ...data.voiceSettings, 
        voice: voice as 'alice' | 'man' | 'woman' 
      } 
    });
  }, [updateNodeData, data.id, data.voiceSettings]);

  return (
    <BaseWorkflowNode
      data={data}
      isConnectable={isConnectable}
      selected={selected}
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
          <Label className="text-xs font-medium text-gray-700">Call Prompt</Label>
          <Textarea
            value={data.prompt || ''}
            onChange={handlePromptChange}
            className="text-xs mt-1 resize-none bg-white/50 border-white/30 focus:bg-white/70 focus:border-blue-300 transition-all"
            rows={3}
            placeholder="Enter call message..."
          />
        </div>
        <div className="pt-2 border-t border-white/30">
          <Label className="text-xs font-medium text-gray-700">Voice Settings</Label>
          <div className="mt-2">
            <Label className="text-xs text-gray-600">Voice</Label>
            <Select
              value={data.voiceSettings?.voice || 'alice'}
              onValueChange={handleVoiceChange}
            >
              <SelectTrigger className="text-xs h-7 bg-white/50 border-white/30 focus:bg-white/70 focus:border-blue-300">
                <SelectValue placeholder="Select voice" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="alice">Alice</SelectItem>
                <SelectItem value="man">Man</SelectItem>
                <SelectItem value="woman">Woman</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </BaseWorkflowNode>
  );
};

export default CallNode;