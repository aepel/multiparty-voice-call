// const DEFAULT_CONSTRAINTS = Object.freeze({
//   audio: true,
//   video: { width: 640, height: 480 },
// })

// // Gets the users camera and returns the media stream
// module.exports.GUM = async () => {
//   console.log(
//     '🚀 ~ file: index.js:9 ~ module.exports.GUM= ~  navigator.mediaDevices.getUserMedia:',
//     navigator.mediaDevices.getUserMedia
//   )
//   return await navigator.mediaDevices.getUserMedia(DEFAULT_CONSTRAINTS)
// }

// https://mediasoup.org/documentation/v3/mediasoup-client/api/#ProducerOptions
// https://mediasoup.org/documentation/v3/mediasoup-client/api/#transport-produce
module.exports = {
  userMediaConfig: {
    audio: false,
    video: {
      width: {
        min: 640,
        max: 1920,
      },
      height: {
        min: 400,
        max: 1080,
      },
    },
  },
  // mediasoup params
  mediasoupParams: {
    encodings: [
      {
        rid: 'r0',
        maxBitrate: 100000,
        scalabilityMode: 'S1T3',
      },
      {
        rid: 'r1',
        maxBitrate: 300000,
        scalabilityMode: 'S1T3',
      },
      {
        rid: 'r2',
        maxBitrate: 900000,
        scalabilityMode: 'S1T3',
      },
    ],
    // https://mediasoup.org/documentation/v3/mediasoup-client/api/#ProducerCodecOptions
    codecOptions: {
      videoGoogleStartBitrate: 1000,
    },
  },
}
