import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Panel,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';

const nodeTypes = {
  andGate: ({ data }) => (
    <div style={{ 
      background: '#e74c3c', 
      color: 'white', 
      padding: '10px', 
      borderRadius: '50%',
      width: '60px',
      height: '60px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 'bold',
      border: '3px solid #c0392b'
    }}>
      AND
    </div>
  ),
  orGate: ({ data }) => (
    <div style={{ 
      background: '#f39c12', 
      color: 'white', 
      padding: '10px', 
      borderRadius: '50%',
      width: '60px',
      height: '60px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 'bold',
      border: '3px solid #e67e22'
    }}>
      OR
    </div>
  ),
  event: ({ data }) => (
    <div style={{ 
      background: '#3498db', 
      color: 'white', 
      padding: '12px 20px', 
      borderRadius: '8px',
      border: '2px solid #2980b9',
      minWidth: '120px',
      textAlign: 'center'
    }}>
      {data.label}
    </div>
  ),
  topEvent: ({ data }) => (
    <div style={{ 
      background: '#e74c3c', 
      color: 'white', 
      padding: '15px 25px', 
      borderRadius: '8px',
      border: '3px solid #c0392b',
      minWidth: '150px',
      textAlign: 'center',
      fontWeight: 'bold',
      fontSize: '16px'
    }}>
      {data.label}
    </div>
  ),
};

function FTADetail() {
  const { id } = useParams();
  const [tree, setTree] = useState(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [newNodeLabel, setNewNodeLabel] = useState('');
  const [selectedNodeType, setSelectedNodeType] = useState('event');

  useEffect(() => {
    if (id) {
      loadTree();
    }
  }, [id]);

  const loadTree = async () => {
    try {
      const response = await axios.get(`/api/v1/fta/trees/${id}`);
      setTree(response.data);
      
      // Convert tree events to nodes
      if (response.data.events && response.data.events.length > 0) {
        const initialNodes = response.data.events.map((event, idx) => ({
          id: event.id.toString(),
          type: event.event_type === 'top' ? 'topEvent' : 
                event.event_type === 'and' ? 'andGate' :
                event.event_type === 'or' ? 'orGate' : 'event',
          data: { label: event.name },
          position: { x: 250, y: idx * 150 },
        }));
        
        const initialEdges = response.data.events
          .filter(event => event.parent_id)
          .map(event => ({
            id: `e-${event.parent_id}-${event.id}`,
            source: event.parent_id.toString(),
            target: event.id.toString(),
            markerEnd: { type: MarkerType.ArrowClosed },
            style: { strokeWidth: 2, stroke: '#95a5a6' }
          }));

        setNodes(initialNodes);
        setEdges(initialEdges);
      }
    } catch (error) {
      console.error('Error loading fault tree:', error);
    }
  };

  const onConnect = (params) => {
    setEdges((eds) => addEdge({
      ...params,
      markerEnd: { type: MarkerType.ArrowClosed },
      style: { strokeWidth: 2, stroke: '#95a5a6' }
    }, eds));
  };

  const addNode = () => {
    if (!newNodeLabel.trim()) return;

    const newNode = {
      id: `node-${Date.now()}`,
      type: selectedNodeType,
      data: { label: newNodeLabel },
      position: { x: Math.random() * 400 + 100, y: Math.random() * 400 + 100 },
    };

    setNodes((nds) => [...nds, newNode]);
    setNewNodeLabel('');
  };

  const exportTree = async () => {
    try {
      const response = await axios.get(`/api/v1/fta/trees/${id}/export`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `fta-${tree.name}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting tree:', error);
    }
  };

  if (!tree) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Fault Tree Analysis: {tree.name}</h1>
        <button onClick={exportTree} className="btn btn-primary">
          Export to Excel
        </button>
      </div>

      <div className="card">
        <h3>Tree Information</h3>
        <p><strong>System:</strong> {tree.system_name}</p>
        <p><strong>Description:</strong> {tree.description}</p>
        <p><strong>Created:</strong> {new Date(tree.created_at).toLocaleDateString()}</p>
      </div>

      <div className="card">
        <h3>Fault Tree Visualization</h3>
        <div style={{ width: '100%', height: '600px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
          >
            <Controls />
            <MiniMap />
            <Background variant="dots" gap={12} size={1} />
            <Panel position="top-right" style={{ background: 'white', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
              <h4 style={{ margin: '0 0 10px 0' }}>Add Event</h4>
               
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px' }}>Event Type:</label>
                <select 
                  value={selectedNodeType}
                  onChange={(e) => setSelectedNodeType(e.target.value)}
                  style={{ width: '100%', padding: '5px', borderRadius: '4px', border: '1px solid #ddd' }}
                >
                  <option value="topEvent">Top Event</option>
                  <option value="event">Basic Event</option>
                  <option value="andGate">AND Gate</option>
                  <option value="orGate">OR Gate</option>
                </select>
              </div>

              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px' }}>Event Name:</label>
                <input
                  type="text"
                  value={newNodeLabel}
                  onChange={(e) => setNewNodeLabel(e.target.value)}
                  placeholder="Enter event name"
                  style={{ width: '100%', padding: '5px', borderRadius: '4px', border: '1px solid #ddd' }}
                  onKeyPress={(e) => e.key === 'Enter' && addNode()}
                />
              </div>

              <button 
                onClick={addNode}
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  background: '#27ae60', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Add Event
              </button>

              <div style={{ marginTop: '15px', padding: '10px', background: '#ecf0f1', borderRadius: '4px', fontSize: '11px' }}>
                <strong>Legend:</strong>
                <div style={{ marginTop: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                    <div style={{ width: '20px', height: '20px', background: '#e74c3c', borderRadius: '50%', marginRight: '8px' }}></div>
                    <span>AND Gate / Top Event</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                    <div style={{ width: '20px', height: '20px', background: '#f39c12', borderRadius: '50%', marginRight: '8px' }}></div>
                    <span>OR Gate</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ width: '30px', height: '20px', background: '#3498db', borderRadius: '4px', marginRight: '8px' }}></div>
                    <span>Basic Event</span>
                  </div>
                </div>
              </div>
            </Panel>
          </ReactFlow>
        </div>
      </div>

      {tree.events && tree.events.length > 0 && (
        <div className="card">
          <h3>Events List</h3>
          <table>
            <thead>
              <tr>
                <th>Event Name</th>
                <th>Type</th>
                <th>Probability</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {tree.events.map(event => (
                <tr key={event.id}>
                  <td>{event.name}</td>
                  <td>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      background: event.event_type === 'top' ? '#e74c3c' :
                                event.event_type === 'and' ? '#e74c3c' :
                                event.event_type === 'or' ? '#f39c12' : '#3498db',
                      color: 'white'
                    }}>
                      {event.event_type.toUpperCase()}
                    </span>
                  </td>
                  <td>{event.probability ? (event.probability * 100).toFixed(2) + '%' : 'N/A'}</td>
                  <td>{event.description || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default FTADetail;