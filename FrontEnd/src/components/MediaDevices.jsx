import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import Select from '@mui/material/Select'
import { Grid } from '@mui/material'

const MediaDevices = ({
  videoDevices,
  audioDevices,
  videoDeviceSelected,
  audioDeviceSelected,
  setVideoDeviceSelected,
  setAudioDeviceSelected,
}) => (
  <>
    <Grid item xs={4}>
      {videoDevices ? (
        <FormControl sx={{ m: 1, minWidth: 120 }}>
          <InputLabel id="demo-simple-select-helper-label">Video Devices</InputLabel>
          <Select
            displayEmpty={false}
            value={videoDeviceSelected}
            labelId="demo-simple-select-helper-label"
            id="demo-simple-select-helper"
            label="Video Devices"
            onChange={val => setVideoDeviceSelected(val.target.value)}
          >
            {videoDevices.map((device, index) => (
              <MenuItem defaultValue={index === 0} value={device.deviceId} key={device.deviceId}>
                {device.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      ) : null}
    </Grid>
    <Grid item xs={4}>
      {audioDevices ? (
        <FormControl sx={{ m: 1, minWidth: 120 }}>
          <InputLabel id="demo-simple-select-helper-label">Audio Devices</InputLabel>
          <Select
            value={audioDeviceSelected}
            displayEmpty={false}
            labelId="demo-simple-select-helper-label"
            id="demo-simple-select-helper"
            label="Video Devices"
            onChange={val => {
              console.log(val)
              setAudioDeviceSelected(val.target.value)
            }}
          >
            {audioDevices.map((device, index) => (
              <MenuItem defaultValue={index === 0} value={device.deviceId} key={device.deviceId}>
                {device.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      ) : null}
    </Grid>
  </>
)

export default MediaDevices
