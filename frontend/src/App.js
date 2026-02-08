import { Routes, Route, Link } from 'react-router-dom';

import FTADetail from './pages/FTADetail';
import StructureAnalysis from './pages/StructureAnalysis';

function App() {
    return (
        <div>
            <nav>
                <Link to="/structure/1">Structure</Link>
            </nav>
            <Routes>
                <Route path="/fta/:id" element={<FTADetail />} />
                <Route path="/structure/:id" element={<StructureAnalysis />} />
            </Routes>
        </div>
    );
}

export default App;