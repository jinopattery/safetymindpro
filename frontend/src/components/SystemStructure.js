import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { ReactFlow, MiniMap, Controls, Background, useNodesState, useEdgesState, addEdge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const SystemStructure = ({ analysisId }) => {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [saving, setSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');
    const [nodeName, setNodeName] = useState('');

    useEffect(() => {
        if (analysisId) {
            loadStructure();
        } else {
            initializeDefaultStructure();
        }
    }, [analysisId]);

    const loadStructure = async () => {
        try {
            const response = await axios.get(`/api/v1/diagrams/load/${analysisId}/structure`);
            if (response.data.nodes) {
                setNodes(response.data.nodes);
                setEdges(response.data.edges);
            } else {
                initializeDefaultStructure();
            }
        } catch (error) {
            console.error('Error loading diagram:', error);
            initializeDefaultStructure();
        }
    };

    const initializeDefaultStructure = () => {
        const defaultNodes = [
            { id: '1', position: { x: 100, y: 100 }, data: { label: 'System' }, style: { background: '#3498db', color: 'white', padding: '12px', borderRadius: '5px' } },
            { id: '2', position: { x: 300, y: 100 }, data: { label: 'Subsystem 1' }, style: { background: '#2ecc71', color: 'white', padding: '12px', borderRadius: '5px' } },
            { id: '3', position: { x: 300, y: 200 }, data: { label: 'Subsystem 2' }, style: { background: '#2ecc71', color: 'white', padding: '12px', borderRadius: '5px' } },
        ];
        const defaultEdges = [
            { id: 'e1-2', source: '1', target: '2', animated: true },
            { id: 'e1-3', source: '1', target: '3', animated: true }
        ];
        setNodes(defaultNodes);
        setEdges(defaultEdges);
    };

    const addNode = () => {
        if (!nodeName.trim()) {
            alert('Please enter a node name');
            return;
        }

        const newNode = {
            id: `node-${Date.now()}`,
            type: 'default',
            data: { label: nodeName },
            position: { x: Math.random() * 400 + 50, y: Math.random() * 300 + 50 },
            style: { 
                background: '#9b59b6', 
                color: 'white', 
                padding: '12px',
                borderRadius: '5px'
            }
        };

        setNodes((nds) => nds.concat(newNode));
        setNodeName('');
    };

    const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

    const onNodesDelete = useCallback(
        (deleted) => {
            setEdges(
                deleted.reduce((acc, node) => {
                    const incomers = acc.filter((e) => e.target === node.id);
                    const outgoers = acc.filter((e) => e.source === node.id);
                    const connectedEdges = incomers.concat(outgoers).map((edge) => edge.id);

                    return acc.filter((e) => !connectedEdges.includes(e.id));
                }, edges)
            );
        },
        [edges, setEdges]
    );

    const saveDiagram = async () => {
        setSaving(true);
        try {
            await axios.post('/api/v1/diagrams/save', { 
                analysis_id: parseInt(analysisId), 
                diagram_type: 'structure', 
                name: 'System Structure', 
                nodes, 
                edges 
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
            <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>System Structure</h3>
                <div>
                    <span style={{ color: saveMessage.includes('✓') ? 'green' : 'red', marginRight: '10px' }}>{saveMessage}</span>
                    <button onClick={saveDiagram} disabled={saving} className="btn btn-primary">
                        {saving ? 'Saving...' : '💾 Save'}
                    </button>
                </div>
            </div>

            <div style={{ marginBottom: '15px', padding: '10px', background: '#f5f5f5', borderRadius: '5px' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input
                        type="text"
                        placeholder="Component name"
                        value={nodeName}
                        onChange={(e) => setNodeName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addNode()}
                        style={{ padding: '8px', flex: 1, maxWidth: '200px' }}
                    />
                    <button onClick={addNode} className="btn btn-primary">➕ Add Component</button>
                    <span style={{ fontSize: '12px', color: '#666', marginLeft: '10px' }}>
                        💡 Connect components by dragging from edge to edge | Select and Delete to remove
                    </span>
                </div>
            </div>

            <div style={{ height: '500px', border: '1px solid #ddd', borderRadius: '5px' }}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onNodesDelete={onNodesDelete}
                    fitView
                >
                    <MiniMap />
                    <Controls />
                    <Background color="lightgray" gap={16} />
                </ReactFlow>
            </div>
        </div>
    );
};

export default SystemStructure;