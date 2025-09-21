import React from 'react';
import { Position } from '@xyflow/react';
import { BaseWorkflowNode } from '../BaseWorkflowNode';
import { ConditionalNodeData } from '@/types/workflow';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface ConditionalNodeProps {
  data: ConditionalNodeData;
  isConnectable: boolean;
  selected?: boolean;
}

const conditionTypeLabels = {
  response_contains: 'Response Contains',
  response_equals: 'Response Equals',
  duration_greater: 'Duration >',
  duration_less: 'Duration <',
  custom: 'Custom'
};

export const ConditionalNode: React.FC<ConditionalNodeProps> = ({ data, isConnectable, selected }) => {
  // Conditional nodes have two output handles: true and false
  const sourceHandles = [
    { id: 'true', position: Position.Right, label: data.trueLabel || 'True' },
    { id: 'false', position: Position.Bottom, label: data.falseLabel || 'False' }
  ];

  return (
    <BaseWorkflowNode
      data={data}
      isConnectable={isConnectable}
      selected={selected}
      sourceHandles={sourceHandles}
    >
      <div className="space-y-3">
        <div>
          <Label className="text-xs font-medium">Condition Type</Label>
          <Badge variant="outline" className="mt-1 text-xs">
            {conditionTypeLabels[data.conditionType]}
          </Badge>
        </div>
        
        <div>
          <Label htmlFor="condition" className="text-xs font-medium">Condition</Label>
          <Input
            id="condition"
            value={data.condition}
            className="text-xs mt-1"
            readOnly
            placeholder="Enter condition..."
          />
        </div>
        
        <div>
          <Label htmlFor="value" className="text-xs font-medium">Value</Label>
          <Input
            id="value"
            value={data.value}
            className="text-xs mt-1"
            readOnly
            placeholder="Enter value to compare..."
          />
        </div>

        <div className="pt-2 border-t border-gray-200">
          <div className="flex justify-between text-xs text-gray-600">
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              {data.trueLabel || 'True'}
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-red-400 rounded-full"></div>
              {data.falseLabel || 'False'}
            </span>
          </div>
        </div>
      </div>
    </BaseWorkflowNode>
  );
};

export default ConditionalNode;