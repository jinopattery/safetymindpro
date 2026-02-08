import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

function FTAList() {
  const [trees, setTrees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrees();
  }, []);

  const loadTrees = async () => {
    try {
      const response = await axios.get('/api/v1/fta/trees');
      setTrees(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading trees:', error);
      setLoading(false);
    }
  };

  const deleteTree = async (id) => {
    if (window.confirm('Are you sure you want to delete this fault tree?')) {
      try {
        await axios.delete(`/api/v1/fta/trees/${id}`);
        loadTrees();
      } catch (error) {
        console.error('Error deleting tree:', error);
      }
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Fault Tree Analysis</h1>
        <Link to="/fta/create" className="btn btn-primary">Create New Fault Tree</Link>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Top Event</th>
              <th>Nodes</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {trees.map(tree => (
              <tr key={tree.id}>
                <td>{tree.name}</td>
                <td>{tree.top_event}</td>
                <td>{tree.nodes.length}</td>
                <td>{new Date(tree.created_at).toLocaleDateString()}</td>
                <td>
                  <button 
                    onClick={() => deleteTree(tree.id)}
                    className="btn btn-danger"
                    style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default FTAList;