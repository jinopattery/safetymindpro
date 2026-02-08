import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ReactFlow, { MiniMap, Controls, Background, useNodesState, useEdgesState, addEdge } from 'reactflow';
import 'reactflow/dist/style.css';

function SystemStructure({ analysisId }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => { loadStructure(); }, [analysisId]);

  const loadStructure = async () => {
    try {
      const response = await axios.get(`/api/v1/diagrams/load/${analysisId}/structure`);
      if (response.data.nodes) { setNodes(response.data.nodes); setEdges(response.data.edges); }
    } catch (error) { initializeDefaultStructure(); }
  };

  const initializeDefaultStructure = () => {
    setNodes([
      { id: 'system-1', type: 'default', data: { label: 'System' }, position: { x: 250, y: 0 }, style: { background: '#3498db', color: 'white', padding: '10px' }},
      { id: 'subsystem-1', type: 'default', data: { label: 'Subsystem 1' }, position: { x: 100, y: 150 }, style: { background: '#2ecc71', color: 'white', padding: '10px' }}
    ]);
    setEdges([{ id: 'e1-2', source: 'system-1', target: 'subsystem-1', animated: true }]);
  };

  const saveDiagram = async () => {
    setSaving(true);
    try {
      await axios.post('/api/v1/diagrams/save', { analysis_id: parseInt(analysisId), diagram_type: 'structure', name: 'System Structure', nodes, edges });
      setSaveMessage('✓ Saved!');
    } catch (error) { setSaveMessage('✗ Error'); }
    finally { setSaving(false); setTimeout(() => setSaveMessage(''), 3000); }
  };

  return (<div><div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}><h3>System Structure</h3><div><span style={{ color: saveMessage.includes('✓') ? 'green' : 'red' }}>{saveMessage}</span><button onClick={saveDiagram} disabled={saving}>{saving ? 'Saving...' : '💾 Save'}</button></div></div><div style={{ height: '500px', border: '1px solid #ddd' }}><ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={(params) => setEdges((eds) => addEdge(params, eds))} fitView><Controls /><MiniMap /><Background /></ReactFlow></div></div>);
}

export default SystemStructure;