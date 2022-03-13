import React  from "react";
import * as Icon from 'react-bootstrap-icons';
import MarkdownIt from 'markdown-it';
import TurndownService from 'turndown';
import { css } from "@emotion/react";
import PulseLoader from "react-spinners/PulseLoader";
import ops from "../services/hiveOps"
import {keychain, isKeychainInstalled, hasKeychainBeenUsed} from '@hiveio/keychain'
import Vote from './widgets/vote';
import Reblog from './widgets/reblog';
import Select from 'react-select-me';
import TimeAgo from 'timeago-react';
import remarkableStripper from '../utils/RemarkableStripper'
import sanitize from 'sanitize-html';
import {htmlDecode} from '../utils/htmlDecode'

// IMPORTANT If you want to provide default styles you have to import them
import 'react-select-me/lib/ReactSelectMe.css';

const postOptions = [
    { value: 'trending', label: 'Trending' },
    { value: 'hot', label: 'Hot' },
    { value: 'new', label: 'New' },
    { value: 'feed', label: 'Feed' }
];


const hive = require("@hiveio/hive-js")
let md = new MarkdownIt()
const turndownService = new TurndownService()



// Can be a string as well. Need to ensure each key-value pair ends with ;
const override = css`
  display: block;
  margin: 0 auto;
  border-color: red;
`;

let token = localStorage.getItem('token')
let loggedInUser = localStorage.getItem('username') ? localStorage.getItem('username') : null

const Jumbotron = function () {
    if (token === null) {
      return (
        <div class="p-5 text-white" style={{backgroundColor: '#1A2238'}}>
            <h4>Get cryptocurrency rewards on <a href="https://hive.io" target="_blank" style={{color: '#e9425f', textDecoration: 'none !important'}}>Hive</a> by creating content on our website. Click the links below to login or signup</h4>
            <p>Click the <a href="https://hive.io" target="_blank" style={{color: '#e9425f', textDecoration: 'none !important'}}>link</a> to learn more about <a href="https://hive.io" target="_blank" style={{color: '#e9425f', textDecoration: 'none !important'}}>Hive</a></p>
            <p>If you are new to <a href="https://hive.io" target="_blank" style={{color: '#e9425f', textDecoration: 'none !important'}}>Hive</a> checkout the <a href="/u?user=newbies-guide" target="_blank" style={{color: '#e9425f', textDecoration: 'none !important'}}>newbies guide for help</a></p>
            <div>
                <span style={{margin: '3%'}}><a href="/login" className="btn btn-lg" style={{backgroundColor: "white", color: '#1A2238'}}>Login</a></span>
                <span style={{margin: '5% 1%'}}><a href="https://signup.hive.io" className="btn btn-lg" style={{backgroundColor: "white", color: '#1A2238'}} target="_blank">Signup</a></span>
            </div>
        </div>
      )
    }
    
    if (token !== null) {
        return null
    }
}

function Posts() {
    let [middlePosts, setMiddlePosts] = React.useState([]);
    let [sidePostsOne, setSideOnePosts] = React.useState([]);
    let [sidePostsTwo, setSideTwoPosts] = React.useState([]);
    let [posts, setPosts] = React.useState([]);
    let [newPostsArr, setPostsNew] = React.useState([]);
    let [hotPostsArr, setPostsHot] = React.useState([]);
    let [postsClass, setPostsClass] =  React.useState({
        value: 'trending'
    })
    let [loading, setLoading] = React.useState(true);
    let [color, setColor] = React.useState('#1A2238');
    let [coverImage, setCoverImage] = React.useState('/img/default_avatar.png')
  
    let refPosts = []
    let trendingPosts = []
    let hotPosts = []
    let newPosts = []

    async function sortContents(a, b, c) {
        let postImgHeight = '300px'
        
        await a.forEach(async d => {
            if (d.title.length > 0 && d.author !== undefined && d.permlink !== undefined) {
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
                summary = summary.replace(/(^(\n|\r|\s)*)>([\s\S]*?).*\s*/g, '');
                summary = remarkableStripper.render(summary)
                summary = sanitize(summary, { allowedTags: [] }); // remove all html, leaving text
                summary = htmlDecode(summary);
            
                // Strip any raw URLs from preview text
                summary = summary.replace(/https?:\/\/[^\s]+/g, '');
            
                // Grab only the first line (not working as expected. does rendering/sanitizing strip newlines?)
                // eslint-disable-next-line prefer-destructuring
                summary = summary.trim().split('\n')[0];
            
                if (summary.length > 200) {
                    summary = summary.substring(0, 200).trim();
            
                    // Truncate, remove the last (likely partial) word (along with random punctuation), and add ellipses
                    summary = summary
                        .substring(0, 180)
                        .trim()
                        .replace(/[,!?]?\s+[^\s]+$/, '…');
                }  
                
                let cover = coverImage;

                if (json) {
                    json = JSON.parse(json)
                            await trendingPosts.push({
                                title: title,
                                permlink: d.permlink,
                                author: d.author,
                                url: d.url,
                                last_update: d.last_update,
                                cover: json.image !== undefined && json.image.length > 0 ? json.image[0] : cover,
                                category: json.tags[0],
                                postImgHeight,
                                summary: summary,
                                voted,
                                pendingPayout: d.pending_payout_value === '0.000 HBD' ? d.total_payout_value :  d.pending_payout_value,
                                reblogged
                            })
                }
            }
        });
        await b.forEach(async d => {
            if (d.title.length > 0 && d.author !== undefined && d.permlink !== undefined) {
                let json = d.json_metadata
                let title = d.title

                let loggedInUser = localStorage.getItem('username') ? localStorage.getItem('username') : null
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
                
                let cover = coverImage;
                if (json) {
                    json = JSON.parse(json)
                            await hotPosts.push({
                                title: title,
                                permlink: d.permlink,
                                author: d.author,
                                url: d.url,
                                last_update: d.last_update,
                                cover: json.image !== undefined && json.image.length > 0 ? json.image[0] : cover,
                                category: json.tags[0],
                                postImgHeight,
                                summary: md.render(summary),
                                voted,
                                pendingPayout: d.pending_payout_value === '0.000 HBD' ? d.total_payout_value :  d.pending_payout_value,
                                reblogged
                            })
                }
            }
        });
        await c.forEach(async d => {
            if (d.title.length > 0 && d.author !== undefined && d.permlink !== undefined) {
                let json = d.json_metadata
                let title = d.title

                let loggedInUser = localStorage.getItem('username') ? localStorage.getItem('username') : null
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

                let cover = coverImage;
                if (json) {
                    json = JSON.parse(json)
                            await newPosts.push({
                                title: title,
                                permlink: d.permlink,
                                author: d.author,
                                url: d.url,
                                last_update: d.last_update,
                                cover: json.image !== undefined && json.image.length > 0 ? json.image[0] : cover,
                                category: json.tags[0],
                                postImgHeight,
                                summary: md.render(summary),
                                voted,
                                pendingPayout: d.pending_payout_value === '0.000 HBD' ? d.total_payout_value :  d.pending_payout_value,
                                reblogged
                            })
                }
            }
        });
    }

    React.useEffect(() => {
        async function getPosts() {
            try {
                let theTrendingPosts = await hive.api.getDiscussionsByTrendingAsync({ limit : 20, tag : "" });
                let theNewPosts = await hive.api.getDiscussionsByCreatedAsync({ limit : 20, tag : "" });
                let theHotPosts = await hive.api.getDiscussionsByHotAsync({ limit : 20, tag : "" });
                await sortContents(theTrendingPosts, theHotPosts, theNewPosts)
                setPosts(trendingPosts)
                setPostsHot(hotPosts)
                setPostsNew(newPosts)
                setMiddlePosts(trendingPosts)
                setSideOnePosts(newPosts)
                setSideTwoPosts(hotPosts)
                document.getElementById('hideOnLoad').style.display = 'none'
            } catch (error) {
                console.log(error)
            }
        }


        getPosts()
    }, []);

    async function reloadContent (selectedOption) {

        document.getElementById('hideOnLoad').style.display = 'block'
        setMiddlePosts([])
        setPostsClass({value: selectedOption.target.value})

        if (selectedOption.target.value === 'hot') {
            setMiddlePosts(hotPostsArr)
            setSideTwoPosts(posts)
            document.getElementById('hotHeader').innerHTML = '<p>Trending</p>'
            setSideOnePosts(newPostsArr)
            document.getElementById('newHeader').innerHTML = '<p>New</p>'
        }
        if (selectedOption.target.value === 'new') {
            setMiddlePosts(newPostsArr)
            setSideOnePosts(posts)
            document.getElementById('newHeader').innerHTML = '<p>Trending</p>'
            setSideTwoPosts(hotPostsArr)
            document.getElementById('hotHeader').innerHTML = '<p>Hot</p>'
        }
        if (selectedOption.target.value === 'trending') {
            setMiddlePosts(posts)
            setSideOnePosts(newPostsArr)
            document.getElementById('newHeader').innerHTML = '<p>New</p>'
            setSideTwoPosts(hotPostsArr)
            document.getElementById('hotHeader').innerHTML = '<p>Hot</p>'
        }

        if (selectedOption.target.value === 'feed') {
            setMiddlePosts(posts)
            setSideOnePosts(newPostsArr)
            document.getElementById('newHeader').innerHTML = '<p>New</p>'
            setSideTwoPosts(hotPostsArr)
            document.getElementById('hotHeader').innerHTML = '<p>Hot</p>'
        }

        document.getElementById('hideOnLoad').style.display = 'none'
    }

    const { selectedOption } = postsClass

    function createMarkup(params) {
        return {__html: params};
    }

    return (
        <div className="posts" id="page-content">
            <Jumbotron />
            <div className="row trending-posts">
                <div className="col-lg-4 col-sm-12 col-md-4">
                    <div className="section-title text-start" style={{margin: '40px 0'}}>
                        <select value={postsClass.value} onChange={reloadContent}>
                            {postOptions.map((option) => (
                                <option value={option.value}>{option.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <br />
                <hr />
                <br />
                <br />
                <div className="col-lg-3 d-none d-sm-none d-md-none d-lg-block" style={{width: '25%'}}>
                    <div className="card border-0 mb-3" style={{margin: '5% 0'}}>
                        <div className="list-group">
                            <a href="#" className="list-group-item list-group-item-action flex-column align-items-start border-0" style={{padding: '5%'}} id="newHeader">
                                <p>New</p>
                            </a>
                            {sidePostsOne.map((post) => (
                                <a href={`/post?permlink=${post.permlink}&author=${post.author}`} className="list-group-item list-group-item-action flex-column align-items-start border-0" style={{padding: '5%'}}>
                                    <div className="d-flex w-100 justify-content-between">
                                        <h6 className="mb-1"  style={{cursor: 'pointer !important', color: '#1A2238', textDecoration: 'none !important'}}>{post.title}</h6>
                                    </div>
                                    <hr />
                                    <div className="d-flex w-100 justify-content-between">
                                        <img className="card-img-top" src={post.cover}  height={'150px'} alt="Card image cap" />
                                    </div>
                                    <div className="d-flex w-100 justify-content-between align-items-end" style={{marginTop: '10%'}}>
                                        <a href={"/u?user=" + post.author} style={{cursor: 'pointer !important', color: '#1A2238', textDecoration: 'none !important'}}>
                                            <small className="text-muted">@{post.author}</small>
                                        </a>
                                        <small className="text-muted">
                                            {post.pendingPayout}
                                        </small>
                                        <small className="text-muted">
                                            <TimeAgo
                                                datetime={post.last_update}
                                            />
                                        </small>
                                    </div>
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="col-lg-6 col-sm-12 col-md-12">
                    <div className="sweet-loading text-center" id="hideOnLoad" style={{marginTop: '15%'}}>
                        <PulseLoader color={color} loading={loading} css={override} size={50} />
                    </div>
                    <div className="card-body">
                        <h5 className="new post-title"  style={{color: '#1A2238', textDecoration: 'none !important'}}>Posts</h5>
                    </div>
                    <div id="postsContainer">
                        {middlePosts.map((post) => (
                            <div className="card mb-3 post" key={post.permlink} data-author={post.author}>
                                <img className="card-img-top" src={post.cover}  height={post.postImgHeight} alt="Card image cap" />
                                <div className="card-body row">

                                    <div className="text-start col-md-3">
                                        <img id="avatar" src={`https://images.hive.blog/u/${post.author}/avatar`} style={{borderRadius: '50%'}} />
                                    </div>
                                        
                                    <div className="text-start col-md-9">
                                        <h5 className="card-title post-title-wrap"><a href={`/post?permlink=${post.permlink}&author=${post.author}`} style={{cursor: 'pointer !important', color: '#1A2238', textDecoration: 'none !important'}} className="post-title">{post.title}</a></h5>
                                    </div>

                                    <p className="card-text" style={{marginTop: '5%'}}>
                                        <small className="text-muted" style={{
                                            marginLeft: "-5%"
                                        }}>
                                            <TimeAgo
                                                datetime={post.last_update}
                                            />
                                        </small>

                                        <small className="text-muted" style={{
                                            marginLeft: "50%"
                                        }}><a href={"/u?user=" + post.author} style={{cursor: 'pointer !important', color: '#1A2238', textDecoration: 'none !important'}}>@{post.author}</a> </small>
                                    </p>
                                </div>
                                
                                <div className="card-footer post-footer-area row" style={{backgroundColor: "#1A2238"}}>
                                    <div className="vote-post text-white col" id={`${post.author}${post.permlink}`}>
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
                        ))}
                    </div>
                </div>
                <div className="col-lg-3 d-none d-sm-none d-md-none d-lg-block" style={{width: '25%'}}>
                    <div className="card border-0 mb-3" style={{margin: '5% 0'}}>
                        <div className="list-group">
                            <a href="#" className="list-group-item list-group-item-action flex-column align-items-start border-0" style={{padding: '5%'}} id="hotHeader">
                                <p>Hot</p>
                            </a>
                            {sidePostsTwo.map((post) => (
                                <a href={`/post?permlink=${post.permlink}&author=${post.author}`} className="list-group-item list-group-item-action flex-column align-items-start border-0" style={{padding: '5%'}}>
                                    <div className="d-flex w-100 justify-content-between">
                                        <h6 className="mb-1"  style={{cursor: 'pointer !important', color: '#1A2238', textDecoration: 'none !important'}}>{post.title}</h6>
                                    </div>
                                    <hr />
                                    <div className="d-flex w-100 justify-content-between">
                                        <img className="card-img-top" src={post.cover}  height={'150px'} alt="Card image cap" />
                                    </div>
                                    <div className="d-flex w-100 justify-content-between align-items-end" style={{marginTop: '10%'}}>
                                        <a href={"/u?user=" + post.author} style={{cursor: 'pointer !important', color: '#1A2238', textDecoration: 'none !important'}}>
                                            <small className="text-muted">@{post.author}</small>
                                        </a>
                                        <small className="text-muted">
                                            {post.pendingPayout}
                                        </small>
                                        <small className="text-muted">
                                            <TimeAgo
                                                datetime={post.last_update}
                                            />
                                        </small>
                                    </div>
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Posts;