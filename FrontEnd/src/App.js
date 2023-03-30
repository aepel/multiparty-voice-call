import './App.css'
import React from 'react'
import SocketProvider from './context/SocketContext'

import Test from './components/Test'
function App() {
  return (
    <div className="App">
      <header className="App-header"></header>
      <SocketProvider>
        {' '}
        <Test></Test>
        {/* <Meeting></Meeting> */}
      </SocketProvider>
    </div>
  )
}

export default App
