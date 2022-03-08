import React from "react";
import * as Icon from 'react-bootstrap-icons';
import { css } from "@emotion/react";

// components
import PulseLoader from "react-spinners/PulseLoader";
import Modal from 'react-modal';
import { Range } from 'react-range';
 
// To include the default styles
import 'react-rangeslider/lib/index.css'

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

Modal.setAppElement('#root');

function Vote (v) {
    let [loading, setLoading] = React.useState(true);
    let [color, setColor] = React.useState('#1A2238');
    let [modalIsOpen, setIsOpen] = React.useState(false);
    let [volume, setVolume] = React.useState([50])
    let props = v.props

    
    // Can be a string as well. Need to ensure each key-value pair ends with ;
    let override = css`
    display: inline-flex;
    margin: 0 auto;
    border-color: red;
    `;
    let bareDisplay = `none`
    let fillDisplay = `none`

    if (props.voted) {
        fillDisplay = `inline-flex`
    } else {
        bareDisplay = `inline-flex`
    }

    function openModal() {
        setIsOpen(true);
    }
    
    function closeModal() {
        setIsOpen(false);
    }



    async function voteContent (author, permlink, username, weight) {
        document.getElementById(`${author}${permlink}loader`).style.display = 'inline-flex'
        document.getElementById(`${author}${permlink}voter`).style.display = 'none'
        const sendVote = await ops.voteContent(author, permlink, username, weight * 100)

        if (sendVote.success === 'yes') {
            document.getElementById(`${author}${permlink}rvote`).style.display = 'inline-flex'
            document.getElementById(`${author}${permlink}loader`).style.display = 'none'
        }
    }
    
    return (
        <>
            <div className="sweet-loading vote-loading" id={`${props.author}${props.permlink}loader`} style={{display: 'none'}}>
                <PulseLoader color={'white'} loading={loading} css={override} size={5} />
            </div>
            <Icon.HandThumbsUp onClick={openModal} id={`${props.author}${props.permlink}voter`} style={{display: bareDisplay, cursor: 'pointer'}} />
            <div style={customStyles}>
                <Modal
                    isOpen={modalIsOpen}
                    onRequestClose={closeModal}
                    style={customStyles}
                    contentLabel="Example Modal"
                >
                    <div>
                        <span className="text-start">{volume}%</span>
                        <span className="text-end"> <i style={{cursor: 'pointer', color: '#1A2238', backgroundColor: 'white'}} onClick={closeModal}><Icon.XCircle /></i></span>
                    </div>
                    <br />

                    <Range
                        className="text-center"
                        step={1}
                        min={0}
                        max={100}
                        values={volume}
                        onChange={(values) => setVolume(values)}
                        renderTrack={({ props, children }) => (
                        <div
                            {...props}
                            style={{
                            ...props.style,
                            height: '6px',
                            width: '100%',
                            backgroundColor: '#ccc'
                            }}
                        >
                            {children}
                        </div>
                        )}
                        renderThumb={({ props }) => (
                        <div
                            {...props}
                            style={{
                            ...props.style,
                            height: '42px',
                            width: '42px',
                            backgroundColor: '#1A2238'
                            }}
                        />
                        )}
                    />
                    
                    <br />
                    <a className="btn btn-sm text-end" style={{backgroundColor: '#1A2238', color: 'white', cursor: 'pointer !important'}}><Icon.HandThumbsUp className="text-end" onClick={() => {
                        voteContent(props.author, props.permlink, props.voter, volume)
                        closeModal()
                    }} style={{display: bareDisplay, cursor: 'pointer'}} /></a>
                </Modal>
            </div>
            <Icon.HandThumbsUpFill id={`${props.author}${props.permlink}rvote`} style={{display: fillDisplay}} />
        </>
    )
}

export default Vote