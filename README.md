# multiparty-voice-call

## Why Mediasoup?

Media soup is a library over WebRTC for doing SFU. An SFU (Selective Forwarding Unit) receives audio and video streams from endpoints and relays them to everyone else (endpoints send one and receive many). Each receiver endpoint can select which streams and spatial/temporal layers it receives. Compared to a mixer or MCU (Multipoint Conferencing Unit) this design leads to a better performance, higher throughput and less latency. It's highly scalable and requires much less resources given that it does not transcode or mix media.

Since endpoints get the other endpoints' media separately, they can have a personalized layout and choose which streams to render and how to display them.

Since we are using Mediasoup and it is a little bit tricky i trully recommend as introduction to understand what are we doing check this link
<https://www.youtube.com/watch?v=DOe7GkQgwPo>

### Different types of video call communication

<https://programmerclick.com/article/18041458237/>

## Mediasoup Architecture

![](https://mediasoup.org/images/mediasoup-v3-architecture-01.svg)

### Mediasoup Entities

**The Producer:** is a class which represents a media source, such as a webcam or microphone, and is responsible for sending media data to the mediasoup server.
**The Consumer:** is class which represents a media sink, such as a video element or an audio element, and is responsible for receiving media data from the mediasoup server.
**PlainTransport** A plain transport represents a network path through which RTP, RTCP (optionally secured with SRTP) and SCTP (DataChannel) is transmitted.

## What Is WebRTC?

WebRTC isn’t just a protocol; it’s a combination of protocols, standards, and JavaScript APIs that enable real-time communication it’s named for. It takes advantage of browser peer-to-peer connections to deliver data with a latency as low as 500 milliseconds or less. Plus, WebRTC is open source, meaning a large community of developers have and continue to contribute to it.

It’s excellent for click-to-start video chats (you’re likely familiar with several applications that use WebRTC whenever you have a meeting or virtual happy hour), but it’s not made to handle streaming to large audiences.

## RTP Streaming

The Real-Time Transport Protocol (RTP) as a network-level protocol that transmits video and audio data when timeliness is essential.

Think of it this way: All streaming technology delivers video and audio data as “packets.” Due to factors like poor internet connectivity, traffic volume, etc., it’s possible for these packets to arrive at an end user’s device in the wrong order, with improper spacing between them — known as jitter — or to not arrive at all. Some protocols are designed to ensure one or more of these mistakes don’t happen, but RTP is designed to accommodate for them when they do.

RTP streaming timestamps packets so they arrive in the correct order even if some are missing, which ensures whatever is there arrives promptly. This process results in audio and video skips that are (hopefully) unnoticeable to either you or your customer. The stream flows constantly this way, facilitating your conversation’s momentum instead of making you endure frustrating playback stalls and glitches.

### Important Notes

<https://github.com/Kurento/mediasoup-demos/blob/master/mediasoup-recording/README.md#important-notes>
