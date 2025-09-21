import React from 'react';
import { BaseWorkflowNode } from '../BaseWorkflowNode';
import { InputNodeData } from '@/types/workflow';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface InputNodeProps {
  data: InputNodeData;
  isConnectable: boolean;
  selected?: boolean;
}

const inputTypeLabels = {
  speech: 'Speech',
  dtmf: 'DTMF (Keypad)',
  both: 'Speech + DTMF'
};

export const InputNode: React.FC<InputNodeProps> = ({ data, isConnectable, selected }) => {
  return (
    <BaseWorkflowNode
      data={data}
      isConnectable={isConnectable}
      selected={selected}
    >
      <div className="space-y-3">
        <div>
          <Label className="text-xs font-medium">Input Type</Label>
          <Badge variant="secondary" className="mt-1 text-xs">
            {inputTypeLabels[data.inputType]}
          </Badge>
        </div>
        
        <div>
          <Label className="text-xs font-medium">Prompt</Label>
          <Textarea
            value={data.prompt}
            className="text-xs mt-1 resize-none"
            rows={2}
            readOnly
            placeholder="Enter prompt for user input..."
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          {data.timeout && (
            <div>
              <Label className="text-xs font-medium text-gray-600">Timeout</Label>
              <Input
                value={`${data.timeout}s`}
                className="text-xs mt-1"
                readOnly
              />
            </div>
          )}
          {data.maxRetries && (
            <div>
              <Label className="text-xs font-medium text-gray-600">Max Retries</Label>
              <Input
                value={data.maxRetries.toString()}
                className="text-xs mt-1"
                readOnly
              />
            </div>
          )}
        </div>
      </div>
    </BaseWorkflowNode>
  );
};

export default InputNode;