import React, { useCallback, useState } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';

const initialNodes = [
  {
    id: '1',
    type: 'input',
    data: { label: 'System Input' },
    position: { x: 250, y: 25 },
    style: { background: '#3498db', color: 'white', border: '2px solid #2980b9', borderRadius: '8px', padding: '10px' }
  },
  {
    id: '2',
    data: { label: 'Control Unit' },
    position: { x: 250, y: 125 },
    style: { background: '#9b59b6', color: 'white', border: '2px solid #8e44ad', borderRadius: '8px', padding: '10px' }
  },
  {
    id: '3',
    data: { label: 'Processing Module' },
    position: { x: 100, y: 250 },
    style: { background: '#e67e22', color: 'white', border: '2px solid #d35400', borderRadius: '8px', padding: '10px' }
  },
  {
    id: '4',
    data: { label: 'Output Module' },
    position: { x: 400, y: 250 },
    style: { background: '#e67e22', color: 'white', border: '2px solid #d35400', borderRadius: '8px', padding: '10px' }
  },
  {
    id: '5',
    type: 'output',
    data: { label: 'System Output' },
    position: { x: 250, y: 375 },
    style: { background: '#27ae60', color: 'white', border: '2px solid #229954', borderRadius: '8px', padding: '10px' }
  },
];

const initialEdges = [
  { id: 'e1-2', source: '1', target: '2', animated: true, style: { stroke: '#3498db', strokeWidth: 2 } },
  { id: 'e2-3', source: '2', target: '3', animated: true, style: { stroke: '#9b59b6', strokeWidth: 2 } },
  { id: 'e2-4', source: '2', target: '4', animated: true, style: { stroke: '#9b59b6', strokeWidth: 2 } },
  { id: 'e3-5', source: '3', target: '5', animated: true, style: { stroke: '#e67e22', strokeWidth: 2 } },
  { id: 'e4-5', source: '4', target: '5', animated: true, style: { stroke: '#e67e22', strokeWidth: 2 } },
];

function BlockDiagram({ analysisId }) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState(null);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
    [setEdges],
  );

  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
  }, []);

  const addNewNode = () => {
    const newNode = {
      id: `${nodes.length + 1}`,
      data: { label: `New Component ${nodes.length + 1}` },
      position: { x: Math.random() * 500, y: Math.random() * 400 },
      style: { background: '#34495e', color: 'white', border: '2px solid #2c3e50', borderRadius: '8px', padding: '10px' }
    };
    setNodes((nds) => [...nds, newNode]);
  };

  return (
    <div style={{ width: '100%', height: '600px', border: '1px solid #ddd', borderRadius: '8px' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        fitView
      >
        <Controls />
        <MiniMap 
          nodeColor={(node) => {
            if (node.type === 'input') return '#3498db';
            if (node.type === 'output') return '#27ae60';
            return '#9b59b6';
          }}
        />
        <Background variant="dots" gap={12} size={1} />
        <Panel position="top-left" style={{ background: 'white', padding: '10px', borderRadius: '8px' }}>
          <h3 style={{ margin: '0 0 10px 0' }}>System Block Diagram</h3>
          <button onClick={addNewNode} className="btn btn-primary" style={{ fontSize: '0.875rem' }}>
            + Add Component
          </button>
          {selectedNode && (
            <div style={{ marginTop: '10px', padding: '10px', background: '#f8f9fa', borderRadius: '4px' }}>
              <strong>Selected:</strong> {selectedNode.data.label}
            </div>
          )}
        </Panel>
      </ReactFlow>
    </div>
  );
}

export default BlockDiagram;