import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import StructureAnalysis from './pages/StructureAnalysis';

function App() {
    return (
        <Router>
            <Switch>
                <Route path="/structure/:id" component={StructureAnalysis} />
                {/* Other routes can go here */}
            </Switch>
        </Router>
    );
}

export default App;