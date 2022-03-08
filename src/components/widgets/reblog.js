import React from "react";
import * as Icon from 'react-bootstrap-icons';
import { css } from "@emotion/react";

// components
import PulseLoader from "react-spinners/PulseLoader";
 
// To include the default styles
import 'react-rangeslider/lib/index.css'

// services
import ops from "../../services/hiveOps"

function Reblog (v) {
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

    if (props.reblogged) {
        fillDisplay = `inline-flex`
    } else {
        bareDisplay = `inline-flex`
    }



    async function reblogOp (author, permlink, username) {
        document.getElementById(`${author}${permlink}loadreblog`).style.display = 'inline-flex'
        document.getElementById(`${author}${permlink}reblogger`).style.display = 'none'
        const sendReblog = await ops.reblogContent(author, permlink, username)

        if (sendReblog.success === 'yes') {
            document.getElementById(`${author}${permlink}reblogged`).style.display = 'inline-flex'
            document.getElementById(`${author}${permlink}loadreblog`).style.display = 'none'
        }
    }
    
    return (
        <>
            <div className="sweet-loading vote-loading" id={`${props.author}${props.permlink}loadreblog`} style={{display: 'none'}}>
                <PulseLoader color={'white'} loading={loading} css={override} size={5} />
            </div>
            <Icon.ArrowRepeat onClick={() => {
                        reblogOp(props.author, props.permlink, props.username)
                    }} id={`${props.author}${props.permlink}reblogger`} style={{display: bareDisplay, cursor: 'pointer'}} />
            <b><Icon.CheckCircleFill id={`${props.author}${props.permlink}reblogged`} style={{display: fillDisplay, fontWeight: '700'}} /></b>
        </>
    )
}

export default Reblog