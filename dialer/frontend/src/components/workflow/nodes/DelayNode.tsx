import React from 'react';
import { BaseWorkflowNode } from '../BaseWorkflowNode';
import { DelayNodeData } from '@/types/workflow';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface DelayNodeProps {
  data: DelayNodeData;
  isConnectable: boolean;
  selected?: boolean;
}

export const DelayNode: React.FC<DelayNodeProps> = ({ data, isConnectable, selected }) => {
  return (
    <BaseWorkflowNode
      data={data}
      isConnectable={isConnectable}
      selected={selected}
    >
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Label className="text-xs font-medium">Duration</Label>
            <Input
              value={data.duration.toString()}
              className="text-xs mt-1"
              readOnly
            />
          </div>
          <div>
            <Label className="text-xs font-medium">Unit</Label>
            <Badge variant="outline" className="mt-1 text-xs">
              {data.unit}
            </Badge>
          </div>
        </div>
        
        <div className="text-xs text-gray-600 text-center pt-2 border-t border-gray-200">
          Wait for {data.duration} {data.unit}
        </div>
      </div>
    </BaseWorkflowNode>
  );
};

export default DelayNode;