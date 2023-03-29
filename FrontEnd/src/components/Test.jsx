import React, { useContext } from 'react'
import { SocketContext } from '../context/SocketContext'
const Test = () => {
  const context = useContext(SocketContext)
  console.log(context)
  const { socket } = context

  return <>HOLA</>
}

export default Test
