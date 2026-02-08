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
    data: { label: 'System' },
    position: { x: 250, y: 0 },
    style: { 
      background: '#2c3e50', 
      color: 'white', 
      border: '2px solid #1a252f', 
      borderRadius: '8px', 
      padding: '15px',
      fontSize: '16px',
      fontWeight: 'bold'
    }
  },
  {
    id: '2',
    data: { label: 'Subsystem A' },
    position: { x: 100, y: 100 },
    style: { 
      background: '#3498db', 
      color: 'white', 
      border: '2px solid #2980b9', 
      borderRadius: '8px', 
      padding: '12px' 
    }
  },
  {
    id: '3',
    data: { label: 'Subsystem B' },
    position: { x: 400, y: 100 },
    style: { 
      background: '#3498db', 
      color: 'white', 
      border: '2px solid #2980b9', 
      borderRadius: '8px', 
      padding: '12px' 
    }
  },
  {
    id: '4',
    data: { label: 'Component A1' },
    position: { x: 50, y: 220 },
    style: { 
      background: '#9b59b6', 
      color: 'white', 
      border: '2px solid #8e44ad', 
      borderRadius: '8px', 
      padding: '10px' 
    }
  },
  {
    id: '5',
    data: { label: 'Component A2' },
    position: { x: 150, y: 220 },
    style: { 
      background: '#9b59b6', 
      color: 'white', 
      border: '2px solid #8e44ad', 
      borderRadius: '8px', 
      padding: '10px' 
    }
  },
  {
    id: '6',
    data: { label: 'Component B1' },
    position: { x: 350, y: 220 },
    style: { 
      background: '#9b59b6', 
      color: 'white', 
      border: '2px solid #8e44ad', 
      borderRadius: '8px', 
      padding: '10px' 
    }
  },
  {
    id: '7',
    data: { label: 'Component B2' },
    position: { x: 450, y: 220 },
    style: { 
      background: '#9b59b6', 
      color: 'white', 
      border: '2px solid #8e44ad', 
      borderRadius: '8px', 
      padding: '10px' 
    }
  },
];

const initialEdges = [
  { id: 'e1-2', source: '1', target: '2', animated: false, style: { stroke: '#2c3e50', strokeWidth: 2 } },
  { id: 'e1-3', source: '1', target: '3', animated: false, style: { stroke: '#2c3e50', strokeWidth: 2 } },
  { id: 'e2-4', source: '2', target: '4', animated: false, style: { stroke: '#3498db', strokeWidth: 2 } },
  { id: 'e2-5', source: '2', target: '5', animated: false, style: { stroke: '#3498db', strokeWidth: 2 } },
  { id: 'e3-6', source: '3', target: '6', animated: false, style: { stroke: '#3498db', strokeWidth: 2 } },
  { id: 'e3-7', source: '3', target: '7', animated: false, style: { stroke: '#3498db', strokeWidth: 2 } },
];

function SystemStructure({ analysisId }) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState(null);
  const [nodeType, setNodeType] = useState('component');

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ ...params, style: { stroke: '#95a5a6', strokeWidth: 2 } }, eds)),
    [setEdges],
  );

  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
  }, []);

  const getNodeStyle = (type) => {
    switch(type) {
      case 'system':
        return { background: '#2c3e50', color: 'white', border: '2px solid #1a252f', borderRadius: '8px', padding: '15px', fontSize: '16px', fontWeight: 'bold' };
      case 'subsystem':
        return { background: '#3498db', color: 'white', border: '2px solid #2980b9', borderRadius: '8px', padding: '12px' };
      case 'component':
        return { background: '#9b59b6', color: 'white', border: '2px solid #8e44ad', borderRadius: '8px', padding: '10px' };
      default:
        return { background: '#95a5a6', color: 'white', border: '2px solid #7f8c8d', borderRadius: '8px', padding: '10px' };
    }
  };

  const addNewNode = () => {
    const newNode = {
      id: `node-${Date.now()}`,
      data: { label: `New ${nodeType.charAt(0).toUpperCase() + nodeType.slice(1)}` },
      position: { x: Math.random() * 500, y: Math.random() * 400 },
      style: getNodeStyle(nodeType)
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const deleteNode = () => {
    if (selectedNode) {
      setNodes((nds) => nds.filter(n => n.id !== selectedNode.id));
      setEdges((eds) => eds.filter(e => e.source !== selectedNode.id && e.target !== selectedNode.id));
      setSelectedNode(null);
    }
  };

  return (
    <div style={{ width: '100%', height: '600px', border: '1px solid #ddd', borderRadius: '8px', marginTop: '20px' }}>
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
            const bgColor = node.style?.background || '#95a5a6';
            return bgColor;
          }}
        />
        <Background variant="dots" gap={12} size={1} />
        <Panel position="top-left" style={{ background: 'white', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#2c3e50' }}>System Structure</h3>
          
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: '#7f8c8d' }}>Node Type:</label>
            <select 
              value={nodeType} 
              onChange={(e) => setNodeType(e.target.value)}
              style={{ width: '100%', padding: '5px', borderRadius: '4px', border: '1px solid #ddd' }}
            >
              <option value="system">System</option>
              <option value="subsystem">Subsystem</option>
              <option value="component">Component</option>
            </select>
          </div>

          <button 
            onClick={addNewNode} 
            style={{ 
              width: '100%', 
              padding: '8px', 
              marginBottom: '8px',
              background: '#27ae60', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            + Add Node
          </button>

          {selectedNode && (
            <div style={{ marginTop: '15px', padding: '10px', background: '#ecf0f1', borderRadius: '4px', borderLeft: '3px solid #3498db' }}>
              <div style={{ fontSize: '12px', color: '#7f8c8d', marginBottom: '5px' }}>Selected:</div>
              <div style={{ fontWeight: 'bold', marginBottom: '10px', color: '#2c3e50' }}>{selectedNode.data.label}</div>
              <button 
                onClick={deleteNode}
                style={{ 
                  width: '100%', 
                  padding: '6px', 
                  background: '#e74c3c', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Delete Node
              </button>
            </div>
          )}

          <div style={{ marginTop: '15px', padding: '10px', background: '#fff3cd', borderRadius: '4px', fontSize: '11px', color: '#856404' }}>
            <strong>Tips:</strong>
            <ul style={{ margin: '5px 0 0 0', paddingLeft: '15px' }}>
              <li>Drag nodes to reposition</li>
              <li>Click nodes to select</li>
              <li>Connect nodes by dragging from edges</li>
            </ul>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}

export default SystemStructure;