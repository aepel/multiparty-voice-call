import VideoContainer from './VideoContainer'
import CallingBox from './CallingBox'
import useMeeting from '../hooks/useMeeting'
import Button from '@mui/material/Button'
const Meeting = () => {
  const {
    callAccepted,
    userVideo,
    myVideo,
    callEnded,
    stream,
    idToCall,
    setIdToCall,
    leaveCall,
    callUser,
    me,
    setName,
    name,
    receivingCall,
    answerCall,
  } = useMeeting()
  return (
    <>
      <h1 style={{ textAlign: 'center', color: '#fff' }}>Meet Epel (Hi!)</h1>
      <div className="container">
        <VideoContainer
          callAccepted={callAccepted}
          userVideoRef={userVideo}
          videoStreamRef={myVideo}
          callEnded={callEnded}
          stream={stream}
        ></VideoContainer>
        <CallingBox
          name={name}
          callAccepted={callAccepted}
          callEnded={callEnded}
          idToCall={idToCall}
          setIdToCall={setIdToCall}
          leaveCall={leaveCall}
          callUser={callUser}
          me={me}
          setName={setName}
        ></CallingBox>
        <div>
          {receivingCall && !callAccepted ? (
            <div className="caller">
              <h1>{name} is calling...</h1>
              <Button variant="contained" color="primary" onClick={answerCall}>
                Answer
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </>
  )
}
export default Meeting
