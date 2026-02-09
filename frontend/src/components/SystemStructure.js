import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ReactFlow, { MiniMap, Controls, Background, useNodesState, useEdgesState, addEdge } from 'react-flow-renderer';

const SystemStructure = ({ analysisId }) => {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    const loadStructure = async () => {
        try {
            const response = await axios.get(`/api/v1/diagrams/load?analysisId=${analysisId}`);
            const { nodes: fetchedNodes, edges: fetchedEdges } = response.data;
            setNodes(fetchedNodes);
            setEdges(fetchedEdges);
        } catch (error) {
            console.error('Error loading diagram:', error);
        }
    };

    const initializeDefaultStructure = () => {
        const defaultNodes = [
            { id: '1', position: { x: 0, y: 0 }, data: { label: 'System 1' } },
            { id: '2', position: { x: 100, y: 100 }, data: { label: 'Subsystem 1' } },
        ];
        const defaultEdges = [];
        setNodes(defaultNodes);
        setEdges(defaultEdges);
    };

    const saveDiagram = async () => {
        try {
            await axios.post('/api/v1/diagrams/save', { nodes, edges });
            alert('Diagram saved successfully!');
        } catch (error) {
            console.error('Error saving diagram:', error);
        }
    };

    useEffect(() => {
        if (analysisId) {
            loadStructure();
        } else {
            initializeDefaultStructure();
        }
    }, [analysisId]);

    return (
        <div>
            <h1>System Structure</h1>
            <button onClick={saveDiagram}>Save</button>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={addEdge}
                style={{ width: '100%', height: '500px' }}
            >
                <MiniMap />(MiniMap)
                <Controls />
                <Background color="lightgray" gap={16} />
            </ReactFlow>
        </div>
    );
};

export default SystemStructure;