import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function FMEACreate() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    system: '',
    subsystem: '',
    failure_modes: []
  });

  const [currentFailureMode, setCurrentFailureMode] = useState({
    component: '',
    function: '',
    failure_mode: '',
    failure_effects: '',
    failure_causes: '',
    severity: 5,
    occurrence: 5,
    detection: 5,
    current_controls: '',
    recommended_actions: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/v1/fmea/analyses', formData);
      navigate(`/fmea/${response.data.id}`);
    } catch (error) {
      console.error('Error creating analysis:', error);
      alert('Error creating analysis');
    }
  };

  const addFailureMode = () => {
    setFormData({
      ...formData,
      failure_modes: [...formData.failure_modes, currentFailureMode]
    });
    setCurrentFailureMode({
      component: '',
      function: '',
      failure_mode: '',
      failure_effects: '',
      failure_causes: '',
      severity: 5,
      occurrence: 5,
      detection: 5,
      current_controls: '',
      recommended_actions: ''
    });
  };

  return (
    <div>
      <h1>Create FMEA Analysis</h1>
      
      <form onSubmit={handleSubmit}>
        <div className="card">
          <h2>Analysis Details</h2>
          
          <div className="form-group">
            <label>Analysis Name *</label>
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
            <label>System *</label>
            <input
              type="text"
              value={formData.system}
              onChange={(e) => setFormData({...formData, system: e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <label>Subsystem</label>
            <input
              type="text"
              value={formData.subsystem}
              onChange={(e) => setFormData({...formData, subsystem: e.target.value})}
            />
          </div>
        </div>

        <div className="card">
          <h2>Add Failure Modes</h2>
          
          <div className="form-group">
            <label>Component *</label>
            <input
              type="text"
              value={currentFailureMode.component}
              onChange={(e) => setCurrentFailureMode({...currentFailureMode, component: e.target.value})}
            />
          </div>

          <div className="form-group">
            <label>Function *</label>
            <input
              type="text"
              value={currentFailureMode.function}
              onChange={(e) => setCurrentFailureMode({...currentFailureMode, function: e.target.value})}
            />
          </div>

          <div className="form-group">
            <label>Failure Mode *</label>
            <input
              type="text"
              value={currentFailureMode.failure_mode}
              onChange={(e) => setCurrentFailureMode({...currentFailureMode, failure_mode: e.target.value})}
            />
          </div>

          <div className="form-group">
            <label>Failure Effects *</label>
            <textarea
              value={currentFailureMode.failure_effects}
              onChange={(e) => setCurrentFailureMode({...currentFailureMode, failure_effects: e.target.value})}
            />
          </div>

          <div className="form-group">
            <label>Failure Causes *</label>
            <textarea
              value={currentFailureMode.failure_causes}
              onChange={(e) => setCurrentFailureMode({...currentFailureMode, failure_causes: e.target.value})}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            <div className="form-group">
              <label>Severity (1-10) *</label>
              <input
                type="number"
                min="1"
                max="10"
                value={currentFailureMode.severity}
                onChange={(e) => setCurrentFailureMode({...currentFailureMode, severity: parseInt(e.target.value)})}
              />
            </div>

            <div className="form-group">
              <label>Occurrence (1-10) *</label>
              <input
                type="number"
                min="1"
                max="10"
                value={currentFailureMode.occurrence}
                onChange={(e) => setCurrentFailureMode({...currentFailureMode, occurrence: parseInt(e.target.value)})}
              />
            </div>

            <div className="form-group">
              <label>Detection (1-10) *</label>
              <input
                type="number"
                min="1"
                max="10"
                value={currentFailureMode.detection}
                onChange={(e) => setCurrentFailureMode({...currentFailureMode, detection: parseInt(e.target.value)})}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Current Controls</label>
            <textarea
              value={currentFailureMode.current_controls}
              onChange={(e) => setCurrentFailureMode({...currentFailureMode, current_controls: e.target.value})}
            />
          </div>

          <div className="form-group">
            <label>Recommended Actions</label>
            <textarea
              value={currentFailureMode.recommended_actions}
              onChange={(e) => setCurrentFailureMode({...currentFailureMode, recommended_actions: e.target.value})}
            />
          </div>

          <button type="button" onClick={addFailureMode} className="btn btn-primary">
            Add Failure Mode
          </button>

          {formData.failure_modes.length > 0 && (
            <div style={{ marginTop: '1rem' }}>
              <h3>Added Failure Modes: {formData.failure_modes.length}</h3>
              <ul>
                {formData.failure_modes.map((fm, index) => (
                  <li key={index}>{fm.component} - {fm.failure_mode} (RPN: {fm.severity * fm.occurrence * fm.detection})</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <button type="submit" className="btn btn-primary">Create Analysis</button>
      </form>
    </div>
  );
}

export default FMEACreate;