import React from "react";
import { Routes, Route, useMatch } from 'react-router-dom';
import * as Icon from 'react-bootstrap-icons';
import MarkdownIt from 'markdown-it';
import TurndownService from 'turndown';
import { css } from "@emotion/react";
import PulseLoader from "react-spinners/PulseLoader";
import Vote from './widgets/vote'
import Reblog from './widgets/reblog';
import Follow from './widgets/follow';
import ops from "../services/hiveOps"
import TimeAgo from 'timeago-react';

import ProfileHeader from "./widgets/profileHeader";

const hive = require("@hiveio/hive-js")
let md = new MarkdownIt()
const turndownService = new TurndownService()

// Can be a string as well. Need to ensure each key-value pair ends with ;
const override = css`
  display: block;
  margin: 0 auto;
  border-color: red;
`;

function getUrlParameter(sParam) {
    var sPageURL = window.location.search.substring(1),
        sURLVariables = sPageURL.split('&'),
        sParameterName,
        i;

    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');

        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined ? true : decodeURIComponent(sParameterName[1]);
        }
    }
    return false;
};

//let inscrybmde = new InscrybMDE()


const profile = getUrlParameter('user')
const screenWidth = window.screen.width + 'px'
let loggedInUser = localStorage.getItem('username') ? localStorage.getItem('username') : null


function Posts(v) {
    let props = v.props
    return (
        <>
            {props.posts.map((post) => (
                <div className="col-lg-6 col-md-6 col-sm-12 post">
                    <div className="card mb-3"  key={post.permlink} data-author={post.author} style={{margin: '5%'}}>
                        <div className="row no-gutters">
                            <div className="col-md-12 col-sm-12">
                                <div className="card-body row">
                                    <div className="text-start col-md-3">
                                        <img id="avatar" src={`https://images.hive.blog/u/${post.author}/avatar`} style={{borderRadius: '50%'}} />
                                    </div>
                                    
                                    <div className="text-start col-md-9">
                                        <h5 className="card-title post-title-wrap"><a href={`/post?permlink=${post.permlink}&author=${post.author}`} style={{cursor: 'pointer !important', color: '#1A2238', textDecoration: 'none !important'}} className="post-title">{post.title}</a></h5>
                                    </div>
                                                    
                                    {
                                    //<p className="card-text" dangerouslySetInnerHTML={createMarkup(post.summary)} />
                                    }
                                    <p className="card-text">
                                        <small className="text-muted text-start">
                                            <TimeAgo
                                                datetime={post.last_update}
                                            />
                                        </small>
                                    </p>
                                    <p className="card-text"><small className="text-muted text-start"><a href={"/u?user=" + post.author} style={{cursor: 'pointer !important', color: '#1A2238', textDecoration: 'none !important'}}>@{post.author}</a> </small></p>
                                </div>
                            </div>
                            <div className="col-md-12">
                                <div className="card-footer post-footer-area row" style={{backgroundColor: "#1A2238"}}>
                                    <div className="vote-post text-white col">
                                        <Vote props={{
                                            author: post.author,
                                            permlink: post.permlink,
                                            voted: post.voted,
                                            voter: loggedInUser
                                        }} />
                                    </div>
                                    <div className="view-post text-white col"><a href={`/post?permlink=${post.permlink}&author=${post.author}`} style={{cursor: 'pointer !important'}} className="text-white">< Icon.Eye /></a></div>
                                    <div className="post-comments text-white col"><a href={`/post?permlink=${post.permlink}&author=${post.author}`} style={{cursor: 'pointer !important'}} className="text-white">< Icon.Chat /></a></div>
                                    {
                                        //<div className="share-post text-white col">< Icon.Share /></div>
                                    }
                                    <div className="reblog-post text-white col">
                                        <Reblog props={{
                                            author: post.author,
                                            permlink: post.permlink,
                                            reblogged: post.reblogged,
                                            username: loggedInUser
                                        }} />
                                    </div>
                                    <div className="pending-payout text-white col" style={{fontSize: '10px', display: 'inline-flex', paddingTop: '1%'}}><b>{post.pendingPayout}</b></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </>
    )
}


function UserReplies() {
    const [posts, setPosts] = React.useState([]);
    let [loading, setLoading] = React.useState(true);
    let [color, setColor] = React.useState('#1A2238');
    let [followStatus, setFollowStatus] = React.useState(false);
    let [followCount, setFollowCount] = React.useState(0);
    let [coverImage, setCoverImage] = React.useState('/img/default_avatar.png')

    let refPosts = []
    let authorPosts = []
    let postImgHeight = '250px'

    async function sortContents(a) {
        if (a.length > 0) {
            await a.forEach(async d => {
                if (d.permlink !== undefined && d.author !== undefined) {
                    if (d.title.length > 0) {
                        let json = d.json_metadata
                        let title = d.title
        
                        let voted = false
                        let reblogged = false
        
                        if (loggedInUser) {
                            d.active_votes.forEach(v => {
                                if (v.voter === loggedInUser) {
                                    voted = true
                                }
                            })
                        }
        
                        
        
                        let summary = d.body
                        if (d.body.length > 100) {
                            summary = d.body.substring(0, 90)
                        }
                        summary = summary.replace(/<center>/g, '').replace(/<\/center>/g, '').replace(/<div className="text-justify">/g, '').replace(/<\/div>/g, '').replace(/<div className="pull-left">/g, '').replace(/<div className="pull-right">/g, '').replace(/<hr>/g, '')
                        if (json) {
                            //json = JSON.parse(json)
                            //if (json.image) {
                                //if (json.image.length > 0 && title.length > 0) {
                                    await authorPosts.push({
                                        title: title,
                                        permlink: d.permlink,
                                        author: d.author,
                                        url: d.url,
                                        last_update: d.last_update,
                                        cover: json.image !== undefined && json.image.length > 0 ? json.image[0] : coverImage,
                                        postImgHeight,
                                        summary: md.render(summary),
                                        voted,
                                        pendingPayout: d.is_paidout === true ? d.payout + " HBD" :  d.pending_payout_value,
                                        reblogged
                                    })
                                //}
                            //}
                        }
                    }
                }
            });
        }
    }

    React.useEffect(() => {

        async function getPosts() {
            let theAuthorPosts = await ops.getAccountPosts(profile, 'replies')
            console.log(theAuthorPosts)
           
            const [account] = await hive.api.getAccountsAsync([profile]);

            let cover = ''; //TODO:REPLACE

            let json = {}

            if (account.posting_json_metadata || account.json_metadata) {
                json = JSON.parse(account.posting_json_metadata || account.json_metadata)
            }

            if (json.profile && json.profile.cover_image !== undefined) {
                cover = json.profile.cover_image;
            }

            if (cover.length > 0) {
                setCoverImage(cover)
            }
             
            if (theAuthorPosts.length > 0) {
                await sortContents(theAuthorPosts)
            }

            if (theAuthorPosts.length === 0) {
                let onePost = {
                    title: 'No posts available for ' + profile,
                    permlink: '#',
                    author: 'null',
                    url: '',
                    last_update: 'None',
                    cover: '',
                    category: '',
                    postImgHeight,
                    summary: '',
                    postStatus: false
                }
                await authorPosts.push(onePost)
            }

            document.getElementById('hideOnLoad').style.display = 'none'
            setPosts(authorPosts)

            console.log({ p: posts })

            async function checkFollowing(follower, user) {
                let checkFollowOp = await ops.checkFollowing(follower, user);
                return checkFollowOp;
            }

            async function getFollowCount(user) {
                let getCount = await ops.getFollowCount(user);
                return getCount;
            }

            const followCountOp = await getFollowCount(profile)

            setFollowCount(followCountOp.follower_count)

            const followStatus = await checkFollowing(loggedInUser, profile)

            setFollowStatus(followStatus)
        }

        getPosts()
    }, []);

    let followDisplay = 'block'

    if (loggedInUser === profile) {
        followDisplay = 'none'
    }
    

    function createMarkup(params) {
        return {__html: params};
    }

    return (
        <div className="posts" id="page-content">
            <div className="row trending-posts">
                <ProfileHeader props={{
                    followStatus,
                    followCount,
                    coverImage,
                    followDisplay
                }} />
                <div className="sweet-loading col-lg-12 col-md-12 col-sm-12" id="hideOnLoad" style={{marginTop: '5%'}}>
                    <PulseLoader color={color} loading={loading} css={override} size={50} />
                </div>

                <Posts props={{
                        posts
                    }}/>
            </div>
        </div>
    );
}

export default UserReplies;