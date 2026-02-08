import React, { useEffect, useState } from 'react';
import ReactFlow, { MiniMap, Controls, useNodesState, useEdgesState } from 'react-flow-renderer';

const initialNodes = [
  { id: '1', data: { label: 'Main Function 1' }, position: { x: 250, y: 5 } },
  { id: '2', data: { label: 'Sub Function 1.1' }, position: { x: 100, y: 100 } },
  { id: '3', data: { label: 'Sub Function 1.2' }, position: { x: 400, y: 100 } },
  { id: '4', data: { label: 'Main Function 2' }, position: { x: 250, y: 300 } },
];

const initialEdges = [
  { id: 'e1-2', source: '1', target: '2' },
  { id: 'e1-3', source: '1', target: '3' },
  { id: 'e4-2', source: '4', target: '2' },
];

const FunctionTree = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = (params) => setEdges((eds) => addEdge(params, eds));

  return (
    <div style={{ height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      >
        <MiniMap />
        <Controls />
      </ReactFlow>
    </div>
  );
};

export default FunctionTree;