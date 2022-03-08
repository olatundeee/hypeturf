import React from 'react'
import Modal from 'react-modal';
import CommentBox from './commentBox'
import * as Icon from 'react-bootstrap-icons';
import randomstring from 'randomstring';
import {keychain, isKeychainInstalled, hasKeychainBeenUsed} from '@hiveio/keychain'

const hive = require("@hiveio/hive-js")

let loggedInUser = localStorage.getItem('username') ? localStorage.getItem('username') : null
    
let replyText = <></>;

const customStyles = {
    content: {
      top: '20%',
      left: '20%',
      right: '20%',
      bottom: '20%',
      height: '400px',
    },
};

Modal.setAppElement('#root');


function finishPosting() {
    window.location.reload()
}

function ReplyLink (v) {
    let [replyModalIsOpen, setIsOpen] = React.useState(false);
    let props = v.props
    let color = props.isComment === true ? '#fff' : '#1A2238'

    function openModal() {
        setIsOpen(true);
    }
    
    function closeModal() {
        setIsOpen(false);
    }
    
    async function sendReply() {
        let author = loggedInUser
        let parent_author = props.parent_author
        let parent_permlink = props.parent_permlink
        let body = document.getElementById('reply-comment-box').value;
        let jsonMetadata = {tags: ['funda'], app: 'funda/v1' }
        let title = props.title !== undefined && props.title.length > 0 ? props.title : ''
        let permlink = randomstring.generate({
            length: 8,
            charset: 'alphabetic'
        }).toLowerCase();

        const comment = {
            parent_author: parent_author !== undefined && parent_author.length > 0 ? parent_author : '',
            parent_permlink: parent_permlink !== undefined && parent_permlink.length > 0 ? parent_permlink : '',
            author,
            permlink,
            title,
            body,
            json_metadata: JSON.stringify(jsonMetadata),
        };
        
        

        const operation = ['comment', comment]

        const {success, msg, cancel, notInstalled, notActive} = await keychain(window, 'requestTransfer', 'test', author, 5,  'test memo', 'HIVE')
        
        const keychainStatus = localStorage.getItem('keychain')

        if(isKeychainInstalled && keychainStatus === 'yes') {
            // do your thing

            try {
                const {success, msg, cancel, notInstalled, notActive} = await keychain(window, 'requestBroadcast', author, [operation], 'Posting');

                if (success) {
                    finishPosting()
                }
                
            } catch (error) {
                console.log(error)
                alert('Error encountered')
            }
        }
        // User didn't cancel, so something must have happened
        else if(!cancel) {
            if(notActive) {
                alert('Please allow Keychain to access this website')
            } else {
                try {
                    console.log(comment)
                    const dybnjg = localStorage.getItem('ajbhs')
                    const sendPost = await hive.broadcast.commentAsync(dybnjg, parent_author, parent_permlink, author, permlink, title, body, JSON.stringify(jsonMetadata))
                    finishPosting()
                } catch (error) {
                    console.log(error)
                    alert('Error encountered')
                    
                }
            }
        }
    }
   
    if (loggedInUser !== null) {
        replyText = 
            <>
                <span className={`reply-comment comment-action`} style={{fontSize: '15px', display: 'inline-flex', paddingTop: '1% 0', cursor: 'pointer', marginLeft: '40% !important', width: '50%', color: color}} onClick={openModal} >Reply</span>
                <div style={customStyles}>
                    <Modal
                        isOpen={replyModalIsOpen}
                        onRequestClose={closeModal}
                        style={customStyles}
                        contentLabel="Example Modal"
                    >
                        <div>
                            <span className="text-end"> <i style={{cursor: 'pointer', color: '#1A2238', backgroundColor: 'white'}} onClick={closeModal}><Icon.XCircle /></i></span>

                            <div className='replyBox' style={{width: '100% !important'}}>
                                <textarea type="text" id="reply-comment-box" name="comment-input-box" style={{borderRadius: '25px', width: '90%', height: '200px', margin: '5%', padding: '3%'}} />
                            </div>
                        </div>
                        <br />
                        <a className="btn btn-sm text-end" style={{backgroundColor: '#1A2238', color: 'white', cursor: 'pointer !important', marginBottom: '5%'}}  onClick={() => {
                            sendReply()
                            //closeModal()
                        }}>Reply</a>
                    </Modal>
                </div>
            </>
    }
    return (replyText)
}

export default ReplyLink