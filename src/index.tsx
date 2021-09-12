import React from 'react'
import ReactDOM from 'react-dom'
import App from './components/App'
import Gaussian from './components/interacts/Gaussian'
import Cmaes from './components/interacts/Cmaes'
import Nes from './components/interacts/Nes'
import {
  BrowserRouter as Router,
  Switch,
  Route
} from "react-router-dom"

ReactDOM.render(
  <React.StrictMode>
    <Router>
      <Switch>
        <Route path='/correlation-matrix'>
          <Gaussian />
        </Route>
        <Route path='/nes'>
          <Nes />
        </Route>
        <Route path='/cmaes'>
          <Cmaes />
        </Route>
        <Route path='/'>
          <App />
        </Route>
      </Switch>
    </Router>
  </React.StrictMode>,
  document.getElementById('root')
)