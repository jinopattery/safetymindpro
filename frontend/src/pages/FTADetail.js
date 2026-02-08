import React, { useState } from 'react';
import axios from 'axios';

const FTADetail = ({ id }) => {
    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);

    const handleSave = async () => {
        try {
            const response = await axios.post(`/api/v1/fta/trees/${id}`, {
                nodes,
                edges
            });
            console.log('Fault tree diagram saved successfully:', response.data);
        } catch (error) {
            console.error('Error saving fault tree diagram:', error);
        }
    };

    return (
        <div>
            <h1>Fault Tree Analysis Detail</h1>
            {/* Visualization of nodes and edges would go here */}
            <button onClick={handleSave}>Save Fault Tree Diagram</button>
        </div>
    );
};

export default FTADetail;