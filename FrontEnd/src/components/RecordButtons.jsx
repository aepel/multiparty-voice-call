import * as React from 'react'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'

const RecordButtons = ({ onRecordClick, onStopRecordClick, enableRecording = false, enableStopRecording = false }) => {
  const startRecord = async peer => {
    let recordInfo = {}

    for (const producer of peer.producers) {
      // recordInfo[producer.kind] = await publishProducerRtpStream(peer, producer)
    }

    recordInfo.fileName = Date.now().toString()

    // peer.process = getProcess(recordInfo)

    setTimeout(async () => {
      for (const consumer of peer.consumers) {
        // Sometimes the consumer gets resumed before the GStreamer process has fully started
        // so wait a couple of seconds
        await consumer.resume()
        await consumer.requestKeyFrame()
      }
    }, 1000)
  }
  return (
    <>
      <Stack direction="row" spacing={4}>
        <Button id="startRecordButton" onclick={onRecordClick} disabled={enableRecording}>
          Start Record
        </Button>

        <Button id="stopRecordButton" onclick={onStopRecordClick} disabled={enableStopRecording}>
          Stop Record
        </Button>
      </Stack>
    </>
  )
}
export default RecordButtons
