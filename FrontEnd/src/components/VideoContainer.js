const VideoContainer = (stream, callAccepted, callEnded, videoStreamRef, userVideoRef) => (
  <>
    <div className="video-container">
      <div className="video">
        {stream && <video playsInline muted ref={videoStreamRef} autoPlay style={{ width: '300px' }} />}
      </div>
      <div className="video">
        {callAccepted && !callEnded ? <video playsInline ref={userVideoRef} autoPlay style={{ width: '300px' }} /> : null}
      </div>
    </div>
  </>
)
export default VideoContainer
