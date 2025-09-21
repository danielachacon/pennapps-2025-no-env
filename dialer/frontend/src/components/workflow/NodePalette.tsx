import React from 'react';
import { useDrag } from 'react-dnd';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { NodeType } from '@/types/workflow';
import { 
  Phone, 
  MessageSquare, 
  GitBranch, 
  Keyboard, 
  Clock, 
  Play, 
  Square 
} from 'lucide-react';

interface NodePaletteItem {
  type: NodeType;
  label: string;
  description: string;
  icon: React.ReactNode;
  category: 'flow' | 'communication' | 'logic' | 'utility';
  color: string;
}

const nodeItems: NodePaletteItem[] = [
  // Flow Control
  {
    type: 'start',
    label: 'Start',
    description: 'Begin the workflow',
    icon: <Play className="w-4 h-4" />,
    category: 'flow',
    color: 'text-green-600',
  },
  {
    type: 'end',
    label: 'End',
    description: 'End the workflow',
    icon: <Square className="w-4 h-4" />,
    category: 'flow',
    color: 'text-red-600',
  },
  
  // Communication
  {
    type: 'call',
    label: 'Make Call',
    description: 'Initiate a phone call',
    icon: <Phone className="w-4 h-4" />,
    category: 'communication',
    color: 'text-blue-600',
  },
  {
    type: 'message',
    label: 'Send Message',
    description: 'Send SMS or voice message',
    icon: <MessageSquare className="w-4 h-4" />,
    category: 'communication',
    color: 'text-purple-600',
  },
  {
    type: 'input',
    label: 'Get Input',
    description: 'Collect user input (speech/DTMF)',
    icon: <Keyboard className="w-4 h-4" />,
    category: 'communication',
    color: 'text-orange-600',
  },
  
  // Logic
  {
    type: 'conditional',
    label: 'Conditional',
    description: 'Branch based on conditions',
    icon: <GitBranch className="w-4 h-4" />,
    category: 'logic',
    color: 'text-yellow-600',
  },
  
  // Utility
  {
    type: 'delay',
    label: 'Delay',
    description: 'Wait for specified time',
    icon: <Clock className="w-4 h-4" />,
    category: 'utility',
    color: 'text-gray-600',
  },
];

const categories = [
  { id: 'flow', label: 'Flow Control', color: 'border-green-200' },
  { id: 'communication', label: 'Communication', color: 'border-blue-200' },
  { id: 'logic', label: 'Logic', color: 'border-yellow-200' },
  { id: 'utility', label: 'Utility', color: 'border-gray-200' },
] as const;

interface DraggableNodeProps {
  item: NodePaletteItem;
}

const DraggableNode: React.FC<DraggableNodeProps> = ({ item }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'workflow-node',
    item: { nodeType: item.type },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <Button
      // @ts-expect-error - react-dnd drag ref type compatibility
      ref={drag}
      variant="ghost"
      className={`
        w-full justify-start gap-3 p-3 h-auto hover:bg-gray-50
        cursor-grab active:cursor-grabbing transition-opacity
        ${isDragging ? 'opacity-50' : 'opacity-100'}
      `}
    >
      <div className={`${item.color} flex-shrink-0`}>
        {item.icon}
      </div>
      <div className="text-left flex-1 min-w-0">
        <div className="font-medium text-sm text-gray-900">
          {item.label}
        </div>
        <div className="text-xs text-gray-500 truncate">
          {item.description}
        </div>
      </div>
    </Button>
  );
};

interface NodePaletteProps {
  className?: string;
}

export const NodePalette: React.FC<NodePaletteProps> = ({ 
  className = '' 
}) => {
  return (
    <Card className={`${className} h-full flex flex-col`}>
      <div className="p-4 pb-0">
        <h3 className="font-semibold text-lg text-gray-900">
          Node Palette
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Drag nodes onto the canvas to build your workflow
        </p>
      </div>
      
      <CardContent className="flex-1 overflow-hidden p-4">
        <ScrollArea className="h-full">
          <div className="space-y-4">
            {categories.map((category) => {
              const categoryItems = nodeItems.filter(
                (item) => item.category === category.id
              );
              
              return (
                <div key={category.id}>
                  <div className={`border-l-4 ${category.color} pl-3 mb-2`}>
                    <h4 className="font-medium text-sm text-gray-700">
                      {category.label}
                    </h4>
                  </div>
                  
                  <div className="space-y-1 ml-3">
                    {categoryItems.map((item) => (
                      <DraggableNode key={item.type} item={item} />
                    ))}
                  </div>
                  
                  {category.id !== 'utility' && (
                    <Separator className="mt-3" />
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default NodePalette;