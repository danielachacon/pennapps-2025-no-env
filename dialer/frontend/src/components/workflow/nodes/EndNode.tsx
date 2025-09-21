import React from 'react';
import { BaseWorkflowNode } from '../BaseWorkflowNode';
import { EndNodeData } from '@/types/workflow';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface EndNodeProps {
  data: EndNodeData;
  isConnectable: boolean;
  selected?: boolean;
}

export const EndNode: React.FC<EndNodeProps> = ({ data, isConnectable, selected }) => {
  return (
    <BaseWorkflowNode
      data={data}
      isConnectable={isConnectable}
      selected={selected}
      sourceHandles={[]} // End node has no output handles
    >
      <div className="space-y-3">
        <div className="text-center text-xs text-gray-600">
          Workflow End
        </div>
        
        {data.reason && (
          <div>
            <Label className="text-xs font-medium">Reason</Label>
            <Textarea
              value={data.reason}
              className="text-xs mt-1 resize-none"
              rows={2}
              readOnly
              placeholder="End reason..."
            />
          </div>
        )}
      </div>
    </BaseWorkflowNode>
  );
};

export default EndNode;