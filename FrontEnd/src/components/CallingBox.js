import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'

import { CopyToClipboard } from 'react-copy-to-clipboard'
import AssignmentIcon from '@mui/icons-material/Assignment'
import PhoneIcon from '@mui/icons-material/Phone'

const CallingBox = ({ name, callAccepted, callEnded, idToCall, setIdToCall, leaveCall, callUser, me, setName }) => (
  <>
    <div className="myId">
      <TextField
        id="filled-basic"
        label="Name"
        variant="filled"
        value={name}
        onChange={e => setName(e.target.value)}
        style={{ marginBottom: '20px' }}
      />
      <CopyToClipboard text={me} style={{ marginBottom: '2rem' }}>
        <Button variant="contained" color="primary" startIcon={<AssignmentIcon fontSize="large" />}>
          Copy ID
        </Button>
      </CopyToClipboard>

      <TextField
        id="filled-basic"
        label="ID to call"
        variant="filled"
        value={idToCall}
        onChange={e => setIdToCall(e.target.value)}
      />
      <div className="call-button">
        {callAccepted && !callEnded ? (
          <Button variant="contained" color="secondary" onClick={leaveCall}>
            End Call
          </Button>
        ) : (
          <IconButton color="primary" aria-label="call" onClick={() => callUser(idToCall)}>
            <PhoneIcon fontSize="large" />
          </IconButton>
        )}
        {idToCall}
      </div>
    </div>
  </>
)

export default CallingBox
 

