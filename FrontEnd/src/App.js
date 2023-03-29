import './App.css'
import React, { useContext } from 'react'
import VideoCall from './components/VideoCall'
import SocketProvider from './context/SocketContext'
import Meeting from './components/Meeting'
import SocketContext from './context/SocketContext'

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
