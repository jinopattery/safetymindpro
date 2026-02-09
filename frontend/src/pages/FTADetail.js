import React, { useEffect, useState } from 'react';
import ReactFlow, { MiniMap, Controls, Background, useNodesState, useEdgesState, addEdge } from '@xyflow/react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

const FTADetail = () => {
    const { id } = useParams();
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [saving, setSaving] = useState(false);
    const [nodeName, setNodeName] = useState('');
    const [nodeType, setNodeType] = useState('event');

    useEffect(() => {
        const loadTreeData = async () => {
            try {
                const response = await axios.get(`/api/v1/fta/trees/${id}`);
                const data = response.data;
                // Load nodes and edges from data or initialize with default values
                if (data) {
                    setNodes(data.nodes);
                    setEdges(data.edges);
                } else {
                    // Default initialization
                    const defaultTopEvent = { id: '1', type: 'event', position: { x: 0, y: 0 }, data: { label: 'Top Event' }};
                    const defaultORGate = { id: '2', type: 'or', position: { x: 100, y: 50 }, data: { label: 'OR Gate' }};
                    const basicEvent1 = { id: '3', type: 'event', position: { x: 200, y: 0 }, data: { label: 'Event 1' }};
                    const basicEvent2 = { id: '4', type: 'event', position: { x: 200, y: 100 }, data: { label: 'Event 2' }};
                    setNodes([defaultTopEvent, defaultORGate, basicEvent1, basicEvent2]);
                }
            } catch (error) {
                console.error('Error loading tree data: ', error);
            }
        };
        loadTreeData();
    }, [id]);

    const addNode = () => {
        const newNode = {
            id: (nodes.length + 1).toString(),
            type: nodeType,
            position: { x: Math.random() * 400, y: Math.random() * 400 },
            data: { label: nodeName },
        };
        if (nodeType === 'event') {
            newNode.color = 'red';
        } else if (nodeType === 'or') {
            newNode.color = 'orange';
        } else if (nodeType === 'and') {
            newNode.color = 'purple';
        }
        setNodes((nds) => nds.concat(newNode));
        setNodeName('');
        setNodeType('event');
    };

    const onConnect = (params) => setEdges((eds) => addEdge(params, eds));
    const onNodesDelete = (deleted) => {
        const ids = deleted.map((node) => node.id);
        setEdges((eds) => eds.filter((edge) => !ids.includes(edge.source) && !ids.includes(edge.target)));
    };

    const saveDiagram = async () => {
        setSaving(true);
        try {
            await axios.put(`/api/v1/fta/trees/${id}`, { nodes, edges });
            alert('Diagram saved successfully!');
        } catch (error) {
            console.error('Error saving diagram: ', error);
            alert('Error saving diagram.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div>
            <h1>Fault Tree Diagram</h1>
            <div>
                <label>Node Name: </label>
                <input value={nodeName} onChange={(e) => setNodeName(e.target.value)} />
                <label>Node Type: </label>
                <select value={nodeType} onChange={(e) => setNodeType(e.target.value)}>
                    <option value="event">Event</option>
                    <option value="or">OR Gate</option>
                    <option value="and">AND Gate</option>
                </select>
                <button onClick={addNode}>Add Node</button>
                <button onClick={saveDiagram} disabled={saving}>{saving ? 'Saving...' : 'Save Diagram'}</button>
            </div>
            <div style={{ height: '600px' }}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onNodesDelete={onNodesDelete}
                >
                    <MiniMap />
                    <Controls />
                    <Background />
                </ReactFlow>
            </div>
        </div>
    );
};

export default FTADetail;