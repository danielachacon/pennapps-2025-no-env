import React, { useCallback, useMemo, createContext, useContext } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  Connection,
  NodeTypes,
  BackgroundVariant,
  ConnectionMode,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import {
  StartNode,
  CallNode,
  MessageNode,
  ConditionalNode,
  InputNode,
  DelayNode,
  EndNode,
} from './nodes';
import { Workflow } from '@/types/workflow';

interface WorkflowCanvasProps {
  workflow?: Workflow;
  onWorkflowChange?: (workflow: Workflow) => void;
  isReadOnly?: boolean;
  className?: string;
}

// Create a context for node updates
interface NodeUpdateContextType {
  updateNodeData: (nodeId: string, updates: Record<string, unknown>) => void;
}

const NodeUpdateContext = createContext<NodeUpdateContextType | null>(null);

export const useNodeUpdate = () => {
  const context = useContext(NodeUpdateContext);
  if (!context) {
    throw new Error('useNodeUpdate must be used within NodeUpdateContext');
  }
  return context;
};

const nodeTypes: NodeTypes = {
  start: StartNode,
  call: CallNode,
  message: MessageNode,
  conditional: ConditionalNode,
  input: InputNode,
  delay: DelayNode,
  end: EndNode,
};

const defaultEdgeOptions = {
  animated: true,
  type: 'smoothstep',
  style: { stroke: '#64748b', strokeWidth: 2 },
};

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

export const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({
  workflow,
  onWorkflowChange,
  isReadOnly = false,
  className = '',
}) => {
  console.log('WorkflowCanvas render with workflow:', workflow);
  
  const [nodes, setNodes, onNodesChange] = useNodesState(
    workflow?.nodes || initialNodes
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    workflow?.edges || initialEdges
  );

  // Sync nodes and edges with workflow prop when it changes
  React.useEffect(() => {
    if (workflow?.nodes) {
      console.log('Updating canvas with nodes:', workflow.nodes);
      setNodes(workflow.nodes);
    }
  }, [workflow?.nodes, setNodes]);

  React.useEffect(() => {
    if (workflow?.edges) {
      console.log('Updating canvas with edges:', workflow.edges);
      setEdges(workflow.edges);
    }
  }, [workflow?.edges, setEdges]);

  // Create node update function that updates both local state and workflow
  const updateNodeData = useCallback((nodeId: string, updates: Record<string, unknown>) => {
    console.log('Updating node data:', nodeId, updates);
    
    // Update local ReactFlow state
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...updates } }
          : node
      )
    );

    // Update parent workflow state
    if (onWorkflowChange && workflow) {
      const updatedNodes = workflow.nodes.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...updates } }
          : node
      );
      
      const updatedWorkflow = {
        ...workflow,
        nodes: updatedNodes,
        updatedAt: new Date(),
      };
      
      console.log('Propagating workflow change:', updatedWorkflow);
      onWorkflowChange(updatedWorkflow);
    }
  }, [setNodes, onWorkflowChange, workflow]);

  const onConnect = useCallback(
    (params: Connection) => {
      if (isReadOnly) return;
      
      const newEdge: Edge = {
        ...params,
        id: `${params.source}-${params.target}`,
        animated: true,
        type: 'smoothstep',
        style: { stroke: '#64748b', strokeWidth: 2 },
      };
      
      setEdges((eds) => addEdge(newEdge, eds));
      
      // Notify parent component of changes
      if (onWorkflowChange && workflow) {
        const updatedWorkflow = {
          ...workflow,
          edges: [...edges, newEdge],
          updatedAt: new Date(),
        };
        onWorkflowChange(updatedWorkflow);
      }
    },
    [isReadOnly, setEdges, edges, onWorkflowChange, workflow]
  );

  const onNodeClick = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (_event: React.MouseEvent, _node: Node) => {
      if (isReadOnly) return;
      // TODO: Handle node selection for editing properties
    },
    [isReadOnly]
  );

  const onNodesDelete = useCallback(
    (deletedNodes: Node[]) => {
      if (isReadOnly) return;
      
      const deletedNodeIds = deletedNodes.map(n => n.id);
      
      // Update the workflow state
      if (onWorkflowChange && workflow) {
        const updatedWorkflow = {
          ...workflow,
          nodes: workflow.nodes.filter(node => !deletedNodeIds.includes(node.id)),
          edges: workflow.edges.filter(edge => 
            !deletedNodeIds.includes(edge.source) && !deletedNodeIds.includes(edge.target)
          ),
          updatedAt: new Date(),
        };
        onWorkflowChange(updatedWorkflow);
      }
    },
    [isReadOnly, onWorkflowChange, workflow]
  );

  const onEdgesDelete = useCallback(
    (deletedEdges: Edge[]) => {
      if (isReadOnly) return;
      
      // Update the workflow state  
      if (onWorkflowChange && workflow) {
        const deletedEdgeIds = deletedEdges.map(e => e.id);
        const updatedWorkflow = {
          ...workflow,
          edges: workflow.edges.filter(edge => !deletedEdgeIds.includes(edge.id)),
          updatedAt: new Date(),
        };
        onWorkflowChange(updatedWorkflow);
      }
    },
    [isReadOnly, onWorkflowChange, workflow]
  );

  const onNodeDelete = useCallback(
    (nodeIds: string[]) => {
      if (isReadOnly) return;
      setNodes((nds) => nds.filter((node) => !nodeIds.includes(node.id)));
      setEdges((eds) =>
        eds.filter((edge) => !nodeIds.includes(edge.source) && !nodeIds.includes(edge.target))
      );
    },
    [isReadOnly, setNodes, setEdges]
  );

  const onEdgeDelete = useCallback(
    (edgeIds: string[]) => {
      if (isReadOnly) return;
      setEdges((eds) => eds.filter((edge) => !edgeIds.includes(edge.id)));
    },
    [isReadOnly, setEdges]
  );

  const nodesSyncedWithChanges = useMemo(() => {
    return nodes.map((node) => ({
      ...node,
      deletable: !isReadOnly,
      selectable: !isReadOnly,
    }));
  }, [nodes, isReadOnly]);

  const edgesSyncedWithChanges = useMemo(() => {
    return edges.map((edge) => ({
      ...edge,
      deletable: !isReadOnly,
      selectable: !isReadOnly,
    }));
  }, [edges, isReadOnly]);

  return (
    <NodeUpdateContext.Provider value={{ updateNodeData }}>
      <div className={`w-full h-full ${className}`}>
        <ReactFlow
          nodes={nodesSyncedWithChanges}
          edges={edgesSyncedWithChanges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodesDelete={onNodesDelete}
          onEdgesDelete={onEdgesDelete}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          connectionMode={ConnectionMode.Loose}
          fitView
          attributionPosition="bottom-left"
          className="workflow-canvas"
          deleteKeyCode={['Backspace', 'Delete']}
        >
        <Controls position="top-left" />
        <MiniMap
          position="bottom-right"
          nodeColor={(node) => {
            switch (node.type) {
              case 'start':
                return '#22c55e';
              case 'end':
                return '#ef4444';
              case 'call':
                return '#3b82f6';
              case 'message':
                return '#8b5cf6';
              case 'conditional':
                return '#f59e0b';
              case 'input':
                return '#06b6d4';
              case 'delay':
                return '#64748b';
              default:
                return '#6b7280';
            }
          }}
          maskColor="rgba(255, 255, 255, 0.2)"
        />
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="#e2e8f0"
        />
      </ReactFlow>
    </div>
    </NodeUpdateContext.Provider>
  );
};

export default WorkflowCanvas;