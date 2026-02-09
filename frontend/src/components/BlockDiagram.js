import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { ReactFlow, MiniMap, Controls, Background, useNodesState, useEdgesState, addEdge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

function BlockDiagram({ analysisId }) {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [saving, setSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');
    const [nodeName, setNodeName] = useState('');
    const [nodeType, setNodeType] = useState('default');

    useEffect(() => { loadDiagram(); }, [analysisId]);

    const loadDiagram = async () => {
        try {
            const response = await axios.get(`/api/v1/diagrams/load/${analysisId}/block`);
            if (response.data.nodes) {
                setNodes(response.data.nodes);
                setEdges(response.data.edges);
            }
        } catch (error) {
            initializeDefaultDiagram();
        }
    };

    const initializeDefaultDiagram = () => {
        setNodes([
            { id: 'input', type: 'input', data: { label: 'Input' }, position: { x: 50, y: 150 }, style: { background: '#3498db', color: 'white', padding: '12px' }},
            { id: 'process', type: 'default', data: { label: 'Process' }, position: { x: 250, y: 150 }, style: { background: '#2ecc71', color: 'white', padding: '12px' }},
            { id: 'output', type: 'output', data: { label: 'Output' }, position: { x: 450, y: 150 }, style: { background: '#e74c3c', color: 'white', padding: '12px' }}
        ]);
        setEdges([
            { id: 'e1-2', source: 'input', target: 'process', animated: true },
            { id: 'e2-3', source: 'process', target: 'output', animated: true }
        ]);
    };

    const addNode = () => {
        if (!nodeName.trim()) {
            alert('Please enter a node name');
            return;
        }

        const newNode = {
            id: `node-${Date.now()}`,
            type: nodeType,
            data: { label: nodeName },
            position: { x: Math.random() * 400, y: Math.random() * 300 },
            style: { 
                background: nodeType === 'input' ? '#3498db' : nodeType === 'output' ? '#e74c3c' : '#2ecc71', 
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
                diagram_type: 'block', 
                name: 'Block Diagram', 
                nodes, 
                edges 
            });
            setSaveMessage('✓ Saved!');
        } catch (error) {
            setSaveMessage('✗ Error saving');
        } finally {
            setSaving(false);
            setTimeout(() => setSaveMessage(''), 3000);
        }
    };

    return (
        <div>
            <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>Block Diagram</h3>
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
                        placeholder="Node name"
                        value={nodeName}
                        onChange={(e) => setNodeName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addNode()}
                        style={{ padding: '8px', flex: 1, maxWidth: '200px' }}
                    />
                    <select value={nodeType} onChange={(e) => setNodeType(e.target.value)} style={{ padding: '8px' }}>
                        <option value="input">Input</option>
                        <option value="default">Process</option>
                        <option value="output">Output</option>
                    </select>
                    <button onClick={addNode} className="btn btn-primary">➕ Add Node</button>
                    <span style={{ fontSize: '12px', color: '#666', marginLeft: '10px' }}>
                        💡 Drag nodes to reposition | Click nodes and press Delete to remove
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
                    <Controls />
                    <MiniMap />
                    <Background />
                </ReactFlow>
            </div>
        </div>
    );
}

export default BlockDiagram;