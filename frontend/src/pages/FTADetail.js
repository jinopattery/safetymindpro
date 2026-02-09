import React, { useEffect, useState } from 'react';
import { ReactFlow, MiniMap, Controls, Background, useNodesState, useEdgesState, addEdge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

const FTADetail = () => {
    const { id } = useParams();
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [saving, setSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');
    const [nodeName, setNodeName] = useState('');
    const [nodeType, setNodeType] = useState('event');
    const [tree, setTree] = useState(null);

    useEffect(() => {
        loadTreeData();
    }, [id]);

    const loadTreeData = async () => {
        try {
            const response = await axios.get(`/api/v1/fta/trees/${id}`);
            const data = response.data;
            setTree(data);
            
            if (data.nodes && data.nodes.length > 0) {
                const flowNodes = data.nodes.map((node, index) => ({
                    id: node.id || `node-${index}`,
                    type: 'default',
                    data: { label: `${node.label || node.type}${node.probability ? '\nP: ' + node.probability : ''}` },
                    position: node.position || { x: index * 150, y: Math.floor(index / 3) * 100 },
                    style: {
                        background: node.type === 'event' ? '#e74c3c' : node.type === 'or' ? '#f39c12' : '#9b59b6',
                        color: 'white',
                        padding: '12px',
                        borderRadius: '5px',
                        minWidth: '100px',
                        textAlign: 'center'
                    }
                }));
                setNodes(flowNodes);
                
                if (data.edges) {
                    const flowEdges = data.edges.map((edge, index) => ({
                        id: edge.id || `edge-${index}`,
                        source: edge.source,
                        target: edge.target,
                        animated: true
                    }));
                    setEdges(flowEdges);
                }
            } else {
                initializeDefaultTree();
            }
        } catch (error) {
            console.error('Error loading tree data:', error);
            initializeDefaultTree();
        }
    };

    const initializeDefaultTree = () => {
        setNodes([
            { 
                id: 'top', 
                type: 'default', 
                data: { label: 'Top Event' }, 
                position: { x: 250, y: 50 }, 
                style: { background: '#e74c3c', color: 'white', padding: '12px', borderRadius: '5px', minWidth: '100px', textAlign: 'center' }
            },
            { 
                id: 'gate1', 
                type: 'default', 
                data: { label: 'OR Gate' }, 
                position: { x: 250, y: 150 }, 
                style: { background: '#f39c12', color: 'white', padding: '12px', borderRadius: '5px', minWidth: '100px', textAlign: 'center' }
            },
            { 
                id: 'event1', 
                type: 'default', 
                data: { label: 'Basic Event 1' }, 
                position: { x: 150, y: 250 }, 
                style: { background: '#3498db', color: 'white', padding: '12px', borderRadius: '5px', minWidth: '100px', textAlign: 'center' }
            },
            { 
                id: 'event2', 
                type: 'default', 
                data: { label: 'Basic Event 2' }, 
                position: { x: 350, y: 250 }, 
                style: { background: '#3498db', color: 'white', padding: '12px', borderRadius: '5px', minWidth: '100px', textAlign: 'center' }
            }
        ]);
        setEdges([
            { id: 'e-top-gate1', source: 'gate1', target: 'top', animated: true },
            { id: 'e-gate1-event1', source: 'event1', target: 'gate1', animated: true },
            { id: 'e-gate1-event2', source: 'event2', target: 'gate1', animated: true }
        ]);
    };

    const addNode = () => {
        if (!nodeName.trim()) {
            alert('Please enter a node name');
            return;
        }

        const newNode = {
            id: `node-${Date.now()}`,
            type: 'default',
            position: { x: Math.random() * 400 + 50, y: Math.random() * 300 + 50 },
            data: { label: nodeName },
            style: {
                background: nodeType === 'event' ? '#e74c3c' : nodeType === 'or' ? '#f39c12' : '#9b59b6',
                color: 'white',
                padding: '12px',
                borderRadius: '5px',
                minWidth: '100px',
                textAlign: 'center'
            }
        };
        
        setNodes((nds) => nds.concat(newNode));
        setNodeName('');
    };

    const onConnect = (params) => setEdges((eds) => addEdge(params, eds));
    
    const onNodesDelete = (deleted) => {
        const ids = deleted.map((node) => node.id);
        setEdges((eds) => eds.filter((edge) => !ids.includes(edge.source) && !ids.includes(edge.target)));
    };

    const saveDiagram = async () => {
        setSaving(true);
        try {
            await axios.put(`/api/v1/fta/trees/${id}`, { 
                nodes: nodes.map(n => ({
                    id: n.id,
                    type: n.style.background === '#e74c3c' ? 'event' : n.style.background === '#f39c12' ? 'or' : 'and',
                    label: n.data.label,
                    position: n.position,
                    probability: 0.001
                })),
                edges: edges.map(e => ({ 
                    id: e.id, 
                    source: e.source, 
                    target: e.target 
                }))
            });
            setSaveMessage('✓ Saved!');
        } catch (error) {
            console.error('Error saving diagram:', error);
            setSaveMessage('✗ Error saving');
        } finally {
            setSaving(false);
            setTimeout(() => setSaveMessage(''), 3000);
        }
    };

    return (
        <div>
            <div style={{ marginBottom: '20px' }}>
                <Link to="/fta" style={{ color: '#3498db', marginBottom: '10px', display: 'block' }}>
                    ← Back to FTA List
                </Link>
                <h1>Fault Tree Analysis: {tree?.name || 'Loading...'}</h1>
                {tree && <p><strong>Top Event:</strong> {tree.top_event}</p>}
                {tree?.description && <p>{tree.description}</p>}
            </div>

            <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>Fault Tree Diagram</h3>
                <div>
                    <span style={{ color: saveMessage.includes('✓') ? 'green' : 'red', marginRight: '10px' }}>
                        {saveMessage}
                    </span>
                    <button onClick={saveDiagram} disabled={saving} className="btn btn-primary">
                        {saving ? 'Saving...' : '💾 Save Diagram'}
                    </button>
                </div>
            </div>

            <div style={{ marginBottom: '15px', padding: '10px', background: '#f5f5f5', borderRadius: '5px' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input 
                        type="text"
                        placeholder="Event/Gate name"
                        value={nodeName} 
                        onChange={(e) => setNodeName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addNode()}
                        style={{ padding: '8px', flex: 1, maxWidth: '200px' }}
                    />
                    <select 
                        value={nodeType} 
                        onChange={(e) => setNodeType(e.target.value)} 
                        style={{ padding: '8px' }}
                    >
                        <option value="event">Basic Event (Red)</option>
                        <option value="or">OR Gate (Orange)</option>
                        <option value="and">AND Gate (Purple)</option>
                    </select>
                    <button onClick={addNode} className="btn btn-primary">
                        ➕ Add Node
                    </button>
                    <span style={{ fontSize: '12px', color: '#666', marginLeft: '10px' }}>
                        💡 Connect events by dragging from edge | Select and Delete to remove
                    </span>
                </div>
            </div>

            <div style={{ height: '600px', border: '1px solid #ddd', borderRadius: '5px' }}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onNodesDelete={onNodesDelete}
                    fitView
                >
                    <Controls />
                    <MiniMap />
                    <Background />
                </ReactFlow>
            </div>
        </div>
    );
};

export default FTADetail;