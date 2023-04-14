const { getCodecInfoFromRtpParameters } = require('./utils')

// File to create SDP text from mediasoup RTP Parameters
module.exports.createSdpText = rtpParameters => {
  const { video, audio } = rtpParameters
  console.log('🚀 ~ file: sdp.js:6 ~ rtpParameters:', rtpParameters)

  // Video codec info
  const videoCodecInfo = getCodecInfoFromRtpParameters('video', video?.rtpParameters)

  // Audio codec info
  const audioCodecInfo = getCodecInfoFromRtpParameters('audio', audio?.rtpParameters)

  return `v=0
  o=- 0 0 IN IP4 127.0.0.1
  s=FFmpeg
  c=IN IP4 127.0.0.1
  t=0 0
  ${video ? `m=video ${video.remoteRtpPort} RTP/AVP ${videoCodecInfo.payloadType}` : ''}
  ${video ? `a=rtpmap:${videoCodecInfo.payloadType} ${videoCodecInfo.codecName}/${videoCodecInfo.clockRate}` : ''}
  ${video ? `a=sendonly` : ''}
  ${audio ? `m=audio ${audio.remoteRtpPort} RTP/AVP ${audioCodecInfo.payloadType}` : ''} 
  ${
    audio
      ? `a=rtpmap:${audioCodecInfo.payloadType} ${audioCodecInfo.codecName}/${audioCodecInfo.clockRate}/${audioCodecInfo.channels}`
      : ''
  }
  ${audio ? `a=sendonly` : ''}
  `
}
