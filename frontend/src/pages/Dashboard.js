import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const Dashboard = () => {
    const [fmeaAnalyses, setFmeaAnalyses] = useState([]);
    const [ftaTrees, setFtaTrees] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            const [fmeaResponse, ftaResponse] = await Promise.all([
                axios.get('/api/v1/fmea/analyses'),
                axios.get('/api/v1/fta/trees')
            ]);
            
            setFmeaAnalyses(fmeaResponse.data.slice(0, 5));
            setFtaTrees(ftaResponse.data.slice(0, 5));
            setLoading(false);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            setLoading(false);
        }
    };

    if (loading) return <div>Loading dashboard...</div>;

    return (
        <div>
            <h1>SafetyMindPro Dashboard</h1>
            <p style={{ color: '#666', marginBottom: '30px' }}>
                Welcome to SafetyMindPro - Your comprehensive FMEA and Fault Tree Analysis tool
            </p>

            <div className="card" style={{ marginBottom: '30px' }}>
                <h2>Quick Actions</h2>
                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginTop: '15px' }}>
                    <Link to="/fmea/create" className="btn btn-primary">➕ Create New FMEA</Link>
                    <Link to="/fta/create" className="btn btn-primary">➕ Create New Fault Tree</Link>
                    <Link to="/risk-matrix" className="btn btn-primary">📊 View Risk Matrix</Link>
                </div>
            </div>

            <div className="card" style={{ marginBottom: '30px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h2>Recent FMEA Analyses</h2>
                    <Link to="/fmea" style={{ color: '#3498db', fontSize: '14px' }}>View All →</Link>
                </div>
                
                {fmeaAnalyses.length === 0 ? (
                    <p style={{ color: '#666', fontStyle: 'italic' }}>No FMEA analyses yet. <Link to="/fmea/create">Create your first one!</Link></p>
                ) : (
                    <table style={{ width: '100%' }}>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>System</th>
                                <th>Failure Modes</th>
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {fmeaAnalyses.map(analysis => (
                                <tr key={analysis.id}>
                                    <td>{analysis.name}</td>
                                    <td>{analysis.system}</td>
                                    <td>{analysis.failure_modes?.length || 0}</td>
                                    <td>{new Date(analysis.created_at).toLocaleDateString()}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '5px' }}>
                                            <Link to={`/fmea/${analysis.id}`} className="btn btn-primary" style={{ fontSize: '12px', padding: '5px 10px' }}>📋 View</Link>
                                            <Link to={`/structure/${analysis.id}`} className="btn btn-primary" style={{ fontSize: '12px', padding: '5px 10px' }}>🔧 Diagrams</Link>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h2>Recent Fault Trees</h2>
                    <Link to="/fta" style={{ color: '#3498db', fontSize: '14px' }}>View All →</Link>
                </div>
                
                {ftaTrees.length === 0 ? (
                    <p style={{ color: '#666', fontStyle: 'italic' }}>No fault trees yet. <Link to="/fta/create">Create your first one!</Link></p>
                ) : (
                    <table style={{ width: '100%' }}>
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
                            {ftaTrees.map(tree => (
                                <tr key={tree.id}>
                                    <td>{tree.name}</td>
                                    <td>{tree.top_event}</td>
                                    <td>{tree.nodes?.length || 0}</td>
                                    <td>{new Date(tree.created_at).toLocaleDateString()}</td>
                                    <td>
                                        <Link to={`/fta/${tree.id}`} className="btn btn-primary" style={{ fontSize: '12px', padding: '5px 10px' }}>🌲 Edit Tree</Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <div className="card" style={{ marginTop: '30px', background: '#f8f9fa' }}>
                <h3>💡 Quick Guide</h3>
                <ul style={{ lineHeight: '1.8', color: '#555' }}>
                    <li><strong>FMEA:</strong> Create and manage Failure Mode and Effects Analysis with RPN calculations</li>
                    <li><strong>Fault Trees:</strong> Build interactive fault tree diagrams with events and logic gates</li>
                    <li><strong>Block Diagrams:</strong> Visualize system structure with block diagrams (access via FMEA → Diagrams)</li>
                    <li><strong>Risk Matrix:</strong> View risk distribution across severity and occurrence dimensions</li>
                </ul>
            </div>
        </div>
    );
};

export default Dashboard;