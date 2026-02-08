import React from 'react';
import { useReactFlow, Background } from 'reactflow';

const FailureTree = () => {
  const { setNodes } = useReactFlow();

  const onAddNode = (type) => {
    const newNode = {
      id: `${type}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: { label: type === 'failure' ? 'Failure Event' : 'Gate' }
    };
    setNodes((nds) => nds.concat(newNode));
  };

  return (
    <div style={{ height: '100vh' }}>
      <button onClick={() => onAddNode('failure')}>Add Failure Event</button>
      <button onClick={() => onAddNode('and')}>Add AND Gate</button>
      <button onClick={() => onAddNode('or')}>Add OR Gate</button>
      <Background color="#aaa" gap={16} />
    </div>
  );
};

export default FailureTree;
