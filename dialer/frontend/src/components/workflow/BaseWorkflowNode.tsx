import React from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { WorkflowNodeData, NodeType } from '@/types/workflow';

const nodeColors: Record<NodeType, { gradient: string; text: string; badge: string }> = {
  start: { 
    gradient: 'bg-gradient-to-br from-green-100/80 to-emerald-50/60', 
    text: 'text-green-800', 
    badge: 'bg-green-100/50 text-green-700 border-green-200/30' 
  },
  call: { 
    gradient: 'bg-gradient-to-br from-blue-100/80 to-sky-50/60', 
    text: 'text-blue-800', 
    badge: 'bg-blue-100/50 text-blue-700 border-blue-200/30' 
  },
  message: { 
    gradient: 'bg-gradient-to-br from-purple-100/80 to-violet-50/60', 
    text: 'text-purple-800', 
    badge: 'bg-purple-100/50 text-purple-700 border-purple-200/30' 
  },
  conditional: { 
    gradient: 'bg-gradient-to-br from-yellow-100/80 to-amber-50/60', 
    text: 'text-yellow-800', 
    badge: 'bg-yellow-100/50 text-yellow-700 border-yellow-200/30' 
  },
  input: { 
    gradient: 'bg-gradient-to-br from-orange-100/80 to-orange-50/60', 
    text: 'text-orange-800', 
    badge: 'bg-orange-100/50 text-orange-700 border-orange-200/30' 
  },
  delay: { 
    gradient: 'bg-gradient-to-br from-gray-100/80 to-slate-50/60', 
    text: 'text-gray-800', 
    badge: 'bg-gray-100/50 text-gray-700 border-gray-200/30' 
  },
  end: { 
    gradient: 'bg-gradient-to-br from-red-100/80 to-rose-50/60', 
    text: 'text-red-800', 
    badge: 'bg-red-100/50 text-red-700 border-red-200/30' 
  },
};

const nodeIcons: Record<NodeType, string> = {
  start: '🚀',
  call: '📞',
  message: '💬',
  conditional: '🔀',
  input: '⌨️',
  delay: '⏱️',
  end: '🏁',
};

interface BaseWorkflowNodeComponentProps {
  data: WorkflowNodeData;
  children: React.ReactNode;
  sourceHandles?: Array<{ id: string; position: Position; label?: string }>;
  targetHandles?: Array<{ id: string; position: Position }>;
  isConnectable: boolean;
  selected?: boolean;
  hasError?: boolean;
  errorMessage?: string;
}

export const BaseWorkflowNode: React.FC<BaseWorkflowNodeComponentProps> = ({
  data,
  children,
  sourceHandles = [{ id: 'source', position: Position.Right }],
  targetHandles = [{ id: 'target', position: Position.Left }],
  isConnectable,
  selected,
  hasError = false,
  errorMessage
}) => {
  const colors = nodeColors[data.type];
  const { deleteElements } = useReactFlow();
  
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteElements({ nodes: [{ id: data.id }] });
  };
  
  return (
    <div className={`workflow-node relative ${selected ? 'ring-2 ring-blue-400/50 ring-offset-2' : ''} ${hasError ? 'ring-2 ring-red-400/50 ring-offset-2' : ''}`}>
      {targetHandles.map(handle => (
        <Handle
          key={handle.id}
          type="target"
          position={handle.position}
          id={handle.id}
          isConnectable={isConnectable}
          className="!w-3 !h-3 !bg-white/80 !border-2 !border-gray-300/50 backdrop-blur-sm shadow-sm hover:!bg-blue-100"
        />
      ))}
      
      {/* Glassmorphic Card */}
      <Card className={`
        min-w-[200px] 
        ${colors.gradient}
        backdrop-blur-md
        border border-white/20 
        shadow-xl shadow-black/5
        hover:shadow-2xl hover:shadow-black/10
        transition-all duration-300
        relative
        ${hasError ? 'border-red-200/50 shadow-red-200/20' : ''}
      `}>
        {/* Error Indicator */}
        {hasError && (
          <div 
            className="absolute -top-1 -left-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center z-20"
            title={errorMessage || 'Node has an error'}
          >
            <span className="text-white text-xs">!</span>
          </div>
        )}
        
        {/* Delete Button */}
        <Button
          size="sm"
          variant="ghost"
          onClick={handleDelete}
          className="
            absolute -top-2 -right-2 
            w-6 h-6 p-0 
            bg-red-100/80 hover:bg-red-200/90 
            text-red-600 hover:text-red-700
            border border-red-200/50 
            rounded-full 
            shadow-sm
            backdrop-blur-sm
            transition-all duration-200
            z-10
          "
        >
          <X size={12} />
        </Button>
        
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className={`text-sm font-semibold ${colors.text} flex items-center gap-2`}>
              <span className="text-base">{nodeIcons[data.type]}</span>
              {data.label}
              {hasError && <span className="text-red-500 text-xs">⚠️</span>}
            </CardTitle>
            <Badge className={`text-xs ${colors.badge} backdrop-blur-sm`}>
              {data.type}
            </Badge>
          </div>
          {hasError && errorMessage && (
            <div className="text-xs text-red-600 mt-1 p-2 bg-red-50/50 rounded border border-red-200/30 backdrop-blur-sm">
              {errorMessage}
            </div>
          )}
        </CardHeader>
        <CardContent className="pt-0">
          {children}
        </CardContent>
      </Card>
      
      {sourceHandles.map(handle => (
        <Handle
          key={handle.id}
          type="source"
          position={handle.position}
          id={handle.id}
          isConnectable={isConnectable}
          className="!w-3 !h-3 !bg-white/80 !border-2 !border-gray-300/50 backdrop-blur-sm shadow-sm hover:!bg-blue-100"
        >
          {handle.label && (
            <div className="absolute top-full mt-1 text-xs text-gray-600 whitespace-nowrap bg-white/80 backdrop-blur-sm px-1 py-0.5 rounded shadow-sm">
              {handle.label}
            </div>
          )}
        </Handle>
      ))}
    </div>
  );
};

export default BaseWorkflowNode;