import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import BlockDiagram from '../components/BlockDiagram';
import SystemStructure from '../components/SystemStructure';

function StructureAnalysis() {
  const { id } = useParams();
  const [analysis, setAnalysis] = useState(null);
  const [activeView, setActiveView] = useState('block');

  useEffect(() => {
    if (id) {
      loadAnalysis();
    }
  }, [id]);

  const loadAnalysis = async () => {
    try {
      const response = await axios.get(`/api/v1/fmea/analyses/${id}`);
      setAnalysis(response.data);
    } catch (error) {
      console.error('Error loading analysis:', error);
    }
  };

  return (
    <div>
      <h1>Structure Analysis</h1>
      {analysis && <h2>{analysis.name}</h2>}

      <div className="card">
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button 
            onClick={() => setActiveView('block')}
            className={activeView === 'block' ? 'btn btn-primary' : 'btn btn-secondary'}
          >
            Block Diagram
          </button>
          <button 
            onClick={() => setActiveView('structure')}
            className={activeView === 'structure' ? 'btn btn-primary' : 'btn btn-secondary'}
          >
            System Structure
          </button>
        </div>

        {activeView === 'block' && <BlockDiagram analysisId={id} />}
        {activeView === 'structure' && <SystemStructure analysisId={id} />}
      </div>

      <div className="card">
        <h3>Analysis Information</h3>
        {analysis && (
          <div>
            <p><strong>System:</strong> {analysis.system_name}</p>
            <p><strong>Subsystem:</strong> {analysis.subsystem_name}</p>
            <p><strong>Created:</strong> {new Date(analysis.created_at).toLocaleDateString()}</p>
            <p><strong>Total Failure Modes:</strong> {analysis.failure_modes?.length || 0}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default StructureAnalysis;