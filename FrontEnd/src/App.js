import './App.css'
import React from 'react'
import SocketProvider from './context/SocketContext'
import { BrowserRouter, Route, Switch } from 'react-router-dom'

import Test from './components/Test'
function App() {
  return (
    <div className="App">
      <header className="App-header"></header>
      <SocketProvider>
        <BrowserRouter>
          <Switch>
            <Route path="/connect/:roomName/:userName" component={Test} />
            <Route path="/">
              <h1>To connect to a meeting please use https://URL/connect/roomName/userName</h1>
            </Route>
          </Switch>
        </BrowserRouter>
      </SocketProvider>
    </div>
  )
}

export default App
