import React from "react";
import * as Icon from 'react-bootstrap-icons';
import { css } from "@emotion/react";

// components
//import PulseLoader from "react-spinners/PulseLoader";
//import Modal from 'react-modal';
import Vote from '../widgets/vote'
import ChildComment from './childComment'
import ReplyLink from "../widgets/replyLink";
import CommentBox from "../widgets/commentBox";


const override = css`
  display: block;
  margin: 0 auto;
  border-color: red;
`;


let loggedInUser = localStorage.getItem('username') ? localStorage.getItem('username') : null


function Comment (v) {
    let props = v.props;

    function createMarkup(params) {
        return {__html: params};
    }

    return (
        <>
            {props.comments.map((comment) => (<div className="col-lg-12 col-md-12 col-sm-12" key={comment.permlink} data-author={comment.author} data-parent-author={comment.parent_author} data-parent-permlink ={comment.parent_permlink} style={{margin: "1% 2%"}}>
                {<div className="card comment-card">
                    <div className="card-body">
                        <div className="card-text text-start" id="comment-body-text" dangerouslySetInnerHTML={createMarkup(comment.body)} />
                        <hr />
                        <div>
                            <a className="comment-author comment-action" href={"/u?user=" + comment.author} style={{cursor: 'pointer !important', color: 'rgb(150, 75, 0)', textDecoration: 'none !important', display: 'inline-flex', width: '50%',}}>
                            <small>@{comment.author}</small></a>
                            <span className="pending-payout comment-action" style={{fontSize: '10px', display: 'inline-flex', paddingTop: '1%', width: '50%'}}><b className="text-center">{comment.pendingPayout}</b></span>
                        </div>
                    </div>
                    <div className="card-footer comments-footer-area" style={{backgroundColor: "rgb(150, 75, 0)"}}>
                        <a className="vote-post text-white comment-action" style={{width: '50%', display: 'inline-flex'}}>
                            <Vote props={{
                                author: comment.author,
                                permlink: comment.permlink,
                                voted: comment.voted,
                                voter: loggedInUser
                            }} />
                        </a>
                        <ReplyLink props={{
                            id: comment.permlink + comment.author,
                            isComment: true,
                            parent_author: comment.author,
                            parent_permlink: comment.permlink,
                            title: props.title
                        }} />
                    </div>
                    <ChildComment props={{
                        author: comment.author,
                        permlink: comment.permlink,
                        parent_author: comment.parent_author,
                        parent_permlink: comment.parent_permlink
                    }} />
                </div>}
            </div>))}
        </>
    )   
}

export default Comment;