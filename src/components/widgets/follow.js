import React from "react";
import * as Icon from 'react-bootstrap-icons';
import { css } from "@emotion/react";

// components
import PulseLoader from "react-spinners/PulseLoader";

// services
import ops from "../../services/hiveOps"

const customStyles = {
    content: {
      top: '40%',
      left: '20%',
      right: '20%',
      bottom: '20%',
      height: '150px',
    },
};

let loggedInUser = localStorage.getItem('username') ? localStorage.getItem('username') : null


function Follow (v) {
    let [loading, setLoading] = React.useState(true);
    let [color, setColor] = React.useState('#1A2238');
    let [modalIsOpen, setIsOpen] = React.useState(false);
    let [volume, setVolume] = React.useState([50])
    let props = v.props

    
    // Can be a string as well. Need to ensure each key-value pair ends with ;
    let override = css`
    display: block;
    margin: 0 auto;
    border-color: red;
    `;
    let bareDisplay = `none`
    let fillDisplay = `none`
    let loaderDisplay = `none`

    let pulseColor = '#1A2238'

    let followingStatus = props.followingStatus
    loaderDisplay = `inline-flex`

    if (followingStatus === true) {
        fillDisplay = `inline-flex`
    } else {
        bareDisplay = `inline-flex`
    }

    async function followUser (followUser, author, username) {
        document.getElementById(`${author}${followUser}follower`).style.display = 'none'
        document.getElementById(`${author}${followUser}followloader`).style.display = `inline-flex`
        const sendFollow = await ops.followUser(followUser, username)

        if (sendFollow.success === 'yes') {
            document.getElementById(`${author}${followUser}followed`).style.display = 'inline-flex'
            document.getElementById(`${author}${followUser}followloader`).style.display = 'none'
        }
    }
    
    return (
        <>
            <span className="sweet-loading follow-loading" id={`${props.author}${props.followUser}followloader`} style={{display: 'none'}}>
                <PulseLoader color={pulseColor} loading={loading} css={override} size={5} />
            </span>
            <span className="badge badge-primary badge-pill follow-badge" id={`${props.author}${props.followUser}follower`} style={{cursor: 'pointer', backgroundColor: '#1A2238', padding: '6%', display: bareDisplay, cursor: 'pointer'}} onClick={() => {
                followUser(props.followUser, props.author, loggedInUser)
            }}>Follow {(props.followCount)}</span>
            <span className="badge badge-primary badge-pill follow-badge" id={`${props.author}${props.followUser}followed`} style={{cursor: 'default', backgroundColor: '#1A2238', padding: '6%', display: fillDisplay}} onClick={() => {
                //followUser(props.followUser, props.author, loggedInUser)
            }}>Following {(props.followCount)}</span>
        </>
    )
}

export default Follow