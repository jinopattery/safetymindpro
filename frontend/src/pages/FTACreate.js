import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function FTACreate() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    top_event: '',
    nodes: [],
    edges: []
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Create sample fault tree structure
    const sampleNodes = [
      { id: 'top', type: 'event', label: formData.top_event, probability: 0.001 },
      { id: 'gate1', type: 'or', label: 'OR Gate' },
      { id: 'event1', type: 'event', label: 'Primary Failure', probability: 0.0005 },
      { id: 'event2', type: 'event', label: 'Secondary Failure', probability: 0.0008 }
    ];

    const sampleEdges = [
      { source: 'gate1', target: 'top' },
      { source: 'event1', target: 'gate1' },
      { source: 'event2', target: 'gate1' }
    ];

    try {
      const response = await axios.post('/api/v1/fta/trees', {
        ...formData,
        nodes: sampleNodes,
        edges: sampleEdges
      });
      navigate('/fta');
    } catch (error) {
      console.error('Error creating fault tree:', error);
      alert('Error creating fault tree');
    }
  };

  return (
    <div>
      <h1>Create Fault Tree</h1>
      
      <form onSubmit={handleSubmit}>
        <div className="card">
          <div className="form-group">
            <label>Tree Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div className="form-group">
            <label>Top Event *</label>
            <input
              type="text"
              value={formData.top_event}
              onChange={(e) => setFormData({...formData, top_event: e.target.value})}
              required
              placeholder="e.g., System Failure"
            />
          </div>

          <button type="submit" className="btn btn-primary">Create Fault Tree</button>
        </div>
      </form>
    </div>
  );
}

export default FTACreate;