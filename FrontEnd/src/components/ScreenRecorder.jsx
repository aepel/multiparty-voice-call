

import React, {useRef, useEffect} from 'react';
import { useReactMediaRecorder } from 'react-media-recorder';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from '@mui/material';

const ScreenRecorder = ({sendStreamToServer, children}) => {
  const {
    status,
    startRecording,
    stopRecording,
    mediaBlobUrl,
  } = useReactMediaRecorder({ scree: true });
  const canvasRef = useRef(null);
  const targetDivRef= useRef(null);
  useEffect(() => {

    const targetDiv = targetDivRef.current;
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    let animationFrameId;
    
    const captureScreen = () => {
      const { width, height } = targetDiv.getBoundingClientRect();
      canvas.width = width;
      canvas.height = height;
      context.drawImage(targetDiv, 0, 0, width, height);

      if (status === 'recording') {
        animationFrameId = requestAnimationFrame(captureScreen);
      }
    };

    if (status === 'recording') {
      captureScreen();
    }
    return () => {
      cancelAnimationFrame(animationFrameId);
    }
  }, [status]);

  const handleStartRecording = () => {
    if (status !== 'recording') {
      startRecording();
      handleUploadRecording();
    }
  };

  const handleStopRecording = () => {
    if (status === 'recording') {
      stopRecording();
    }
    handleDownload();
  };
  const handleDownload = () => {
    if (mediaBlobUrl) {
      const a = document.createElement('a');
      a.href = mediaBlobUrl;
      a.download = 'recorded-video.webm';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };
  const handleUploadRecording = () => {
    if (mediaBlobUrl) {
      // Convert the blob URL to a Blob object
      fetch(mediaBlobUrl)
        .then((response) => response.blob())
        .then((blob) => sendStreamToServer(blob))
        .catch(console.error);
    }
}
  return (
    <div>
       <Button onClick={handleStartRecording} disabled={status === 'recording'} type="primary" icon="play-circle"
    className="margin-left-sm"
    ghost>
        
        Start Recording
      </Button>
      <button onClick={handleStopRecording} disabled={status !== 'recording'}>
        <FontAwesomeIcon icon="fa-stop" />
        Stop Recording
      </button>
      <div ref={targetDivRef} style={{ width: '100%', height: '100%' }}> 
      {children}
      </div>
      <button onClick={handleDownload}>Download Recording</button>
    </div>
  );
};

export default ScreenRecorder;
