import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ReactFlow, MiniMap, Controls, Background, useNodesState, useEdgesState, addEdge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

function BlockDiagram({ analysisId }) {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [saving, setSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');

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

    const saveDiagram = async () => {
        setSaving(true);
        try {
            await axios.post('/api/v1/diagrams/save', { analysis_id: parseInt(analysisId), diagram_type: 'block', name: 'Block Diagram', nodes, edges });
            setSaveMessage('✓ Saved!');
        } catch (error) {
            setSaveMessage('✗ Error');
        } finally {
            setSaving(false);
            setTimeout(() => setSaveMessage(''), 3000);
        }
    };

    return (
        <div>
            <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
                <h3>Block Diagram</h3>
                <div>
                    <span style={{ color: saveMessage.includes('✓') ? 'green' : 'red', marginRight: '10px' }}>{saveMessage}</span>
                    <button onClick={saveDiagram} disabled={saving}>{saving ? 'Saving...' : '💾 Save'}</button>
                </div>
            </div>
            <div style={{ height: '500px', border: '1px solid #ddd' }}>
                <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={(params) => setEdges((eds) => addEdge(params, eds))} fitView>
                    <Controls />
                    <MiniMap />
                    <Background />
                </ReactFlow>
            </div>
        </div>
    );
}

export default BlockDiagram;