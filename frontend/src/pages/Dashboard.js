import React from 'react';

const Dashboard = () => {
    return (
        <div className="dashboard">
            <h1>Dashboard</h1>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button className="btn btn-primary">Action 1</button>
                <button className="btn btn-primary">Action 2</button>
                <button className="btn btn-primary">Action 3</button>
            </div>
        </div>
    );
};

export default Dashboard;