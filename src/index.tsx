import React from 'react'
import ReactDOM from 'react-dom'
import App from './components/App'
import Gaussian from './components/interacts/Gaussian'
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
        <Route path='/'>
          <App />
        </Route>
      </Switch>
    </Router>
  </React.StrictMode>,
  document.getElementById('root')
)