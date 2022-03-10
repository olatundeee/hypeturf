import React from "react";
import * as Icon from 'react-bootstrap-icons';
import MarkdownIt from 'markdown-it';
import TurndownService from 'turndown';
import Vote from './widgets/vote';
import Reblog from './widgets/reblog';
import Follow from './widgets/follow';
import Comment from './views/comment'
import ops from "../services/hiveOps"
import { Remarkable } from 'remarkable';
import sanitizeConfig, { noImageText } from '../utils/sanitizeConfig';
import sanitize from 'sanitize-html';
import HtmlReady from '../utils/HtmlReady';
import { generateMd as EmbeddedPlayerGenerateMd } from './widgets/EmbeddedPlayers';
import {extractImageLink} from '../utils/extractImageLink'
import { css } from "@emotion/react";
import PulseLoader from "react-spinners/PulseLoader";
import TimeAgo from 'timeago-react';
import ReplyLink from "./widgets/replyLink";
import CommentBox from "./widgets/commentBox";
/*import remarkableStripper from '../utils/RemarkableStripper'
import sanitize from 'sanitize-html';
import {htmlDecode} from '../utils/htmlDecode'*/
//import ReactMarkdown from 'react-markdown'
//import remarkGfm from 'remark-gfm'
//import Markdown from 'markdown-to-jsx';


const hive = require("@hiveio/hive-js")
let md = new MarkdownIt()
const turndownService = new TurndownService()

const remarkable = new Remarkable({
    html: true, // remarkable renders first then sanitize runs...
    breaks: true,
    linkify: false, // linkify is done locally
    typographer: false, // https://github.com/jonschlinkert/remarkable/issues/142#issuecomment-221546793
    quotes: '“”‘’',
});

const remarkableToSpec = new Remarkable({
    html: true,
    breaks: false, // real markdown uses \n\n for paragraph breaks
    linkify: false,
    typographer: false,
    quotes: '“”‘’',
});

// If you're in the browser, the Remarkable class is already available in the window
//var md = new Remarkable();

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

const author = getUrlParameter('author')
const permlink = getUrlParameter('permlink')
let loggedInUser = localStorage.getItem('username') ? localStorage.getItem('username') : null

// Can be a string as well. Need to ensure each key-value pair ends with ;
const override = css`
  display: block;
  margin: 0 auto;
  border-color: red;
`;

function Post() {
    

  const [post, setPost] = React.useState([]);
  const [followers, setFollowers] = React.useState([]);
  const [following, setFollowing] = React.useState([]);
  const [morePosts, setMorePosts] = React.useState([]);
  const [comments, setComments] = React.useState([]);
  let [loading, setLoading] = React.useState(true);
  let [color, setColor] = React.useState('#1A2238');
  let [followCount, setFollowCount] = React.useState(0);

  let morePostsInit = []
  let commentsPosts = []
  let allFollowerArr = []
  let allFollowingArr = []


  

  React.useEffect(() => {
    let postObj = {
        cover: '',
        title: '',
        body: null,
        voted: false
    }
    async function getPost() {
        let post = await hive.api.getContentAsync(author, permlink);
        let followersArr = await hive.api.getFollowersAsync(author, '', "blog", 10)
        let followingArr = await hive.api.getFollowingAsync(author, '', "blog", 10)
        let morePostsArr = await hive.api.getDiscussionsByBlogAsync({ limit : 10, tag : author });
        let postReplies = await hive.api.getContentRepliesAsync(author, permlink);


        
        async function sortComments(a) {
            await a.forEach(async d => {
                if (d.body.length > 0) {
                    let json = d.json_metadata
                    let voted = false
    
                    if (loggedInUser) {
                        d.active_votes.forEach(v => {
                            if (v.voter === loggedInUser) {
                                voted = true
                            }
                        })
                    }

                    //let commentReplies = await hive.api.getContentRepliesAsync(d.author, d.permlink);
                    
                    //console.log(commentReplies)

                    let postBody = d.body

                    let html = false;
                    // See also ReplyEditor isHtmlTest
                    const m = postBody.match(/^<html>([\S\s]*)<\/html>$/);
                    if (m && m.length === 2) {
                        html = true;
                        postBody = m[1];
                    } else {
                        // See also ReplyEditor isHtmlTest
                        html = /^<p>[\S\s]*<\/p>/.test(postBody);
                    }

                    // Strip out HTML comments. "JS-DOS" bug.
                    postBody = postBody.replace(/<!--([\s\S]+?)(-->|$)/g, '(html comment removed: $1)');

                    let renderer = remarkableToSpec;
                    /*if (this.props.breaks === true) {
                        renderer = remarkable;
                    }*/

                    let renderedText = html ? postBody : renderer.render(postBody);

                    // If content isn't wrapped with an html element at this point, add it.
                    if (!renderedText.indexOf('<html>') !== 0) {
                        renderedText = '<html>' + renderedText + '</html>';
                    }

                    let hideImages = false;

                    // Embed videos, link mentions and hashtags, etc...
                    if (renderedText) renderedText = HtmlReady(renderedText, { hideImages }).html;

                    let cleanText = renderedText;

                    let highQualityPost = post.payout > 10.0 ? true : false
                    let large = true

                    cleanText = sanitize(
                        renderedText,
                        sanitizeConfig({
                            large,
                            highQualityPost,
                            noImage: false && false,
                        })
                    );

                    if (/<\s*script/gi.test(cleanText)) {
                        // Not meant to be complete checking, just a secondary trap and red flag (code can change)
                        console.error('Refusing to render script tag in post text', cleanText);
                        return <div />;
                    }

                    const noImageActive = cleanText.indexOf(noImageText) !== -1;
                    
                    

                    // In addition to inserting the youtube component, this allows
                    // react to compare separately preventing excessive re-rendering.
                    let idx = 0;
                    let sections = [];

                    function checksum(s) {
                        let chk = 0x12345678;
                        const len = s.length;
                        for (let i = 0; i < len; i += 1) {
                            chk += s.charCodeAt(i) * (i + 1);
                        }

                        // eslint-disable-next-line no-bitwise
                        return (chk & 0xffffffff).toString(16);
                    }

                    // HtmlReady inserts ~~~ embed:${id} type ~~~
                    for (let section of cleanText.split('~~~ embed:')) {
                        const embedMd = EmbeddedPlayerGenerateMd(section, idx, large);
                        if (embedMd) {
                            const { section: newSection, markdown } = embedMd;
                            section = newSection;
                            sections.push(markdown);

                            if (section === '') {
                                // eslint-disable-next-line no-continue
                                continue;
                            }
                        }

                        sections.push(<div key={checksum(section)} dangerouslySetInnerHTML={{ __html: section }} />);

                        idx += 1;
                    }


                    let className = ''
                    const cn = 'Markdown'
                    + (className ? ` ${className}` : '')
                    + (html ? ' html' : '')
                    + (large ? '' : ' MarkdownViewer--small');

                    let allowNoImage = false;
                    let finalText = '';
                    sections.forEach(async sec => {
                        if (!sec.props.className || sec.props.className !== 'videoWrapper') {
                            finalText += sec.props.dangerouslySetInnerHTML.__html
                        }
                        if (sec.props.className === 'videoWrapper') {
                            console.log(
                                sec.props.className, sec.props.style.position, sec.props.style.width, sec.props.style.height, sec.props.style.paddingBottom
                            )
                            console.log(sec.props)
                            finalText += 
                                `<div className=${sec.props.className} style=${{position: sec.props.style.position, width: sec.props.style.width, height: sec.props.style.height, paddingBottom: sec.props.style.paddingBottom}}>
                                    <iframe src=${sec.props.children.props.src} height=${sec.props.children.props.height} title=${sec.props.children.props.title}></iframe>
                                </div>`
                        }
                    })
            
                    let summary = d.body.replace(/(^(\n|\r|\s)*)>([\s\S]*?).*\s*/g, '');
                    if (d.body.length > 100) {
                        summary = d.body.substring(0, 90)
                    }
                    
                    summary = summary
                    await commentsPosts.push({
                        permlink: d.permlink,
                        author: d.author,
                        url: d.url,
                        last_update: d.last_update,
                        body: finalText,
                        voted,
                        pendingPayout: d.pending_payout_value === '0.000 HBD' ? d.total_payout_value :  d.pending_payout_value,
                        parent_author: d.parent_author,
                        parent_permlink: d.parent_permlink
                    })
                }
            });
        }

        await sortComments(postReplies)


        if(post) {
            postObj.title = post.title
            postObj.author = author
            postObj.voted = false
            postObj.reblogged = false
            postObj.pendingPayout = post.pending_payout_value === '0.000 HBD' ? post.total_payout_value :  post.pending_payout_value
            postObj.permlink = post.permlink

            if (loggedInUser) {
                post.active_votes.forEach(v => {
                    if (v.voter === loggedInUser) {
                        postObj.voted = true
                    }
                })
            }

            let postBody =  post.body

            let html = false;
            // See also ReplyEditor isHtmlTest
            const m = postBody.match(/^<html>([\S\s]*)<\/html>$/);
            if (m && m.length === 2) {
                html = true;
                postBody = m[1];
            } else {
                // See also ReplyEditor isHtmlTest
                html = /^<p>[\S\s]*<\/p>/.test(postBody);
            }

            // Strip out HTML comments. "JS-DOS" bug.
            postBody = postBody.replace(/<!--([\s\S]+?)(-->|$)/g, '(html comment removed: $1)');

            let renderer = remarkableToSpec;
            /*if (this.props.breaks === true) {
                renderer = remarkable;
            }*/

            let renderedText = html ? postBody : renderer.render(postBody);

            // If content isn't wrapped with an html element at this point, add it.
            if (!renderedText.indexOf('<html>') !== 0) {
                renderedText = '<html>' + renderedText + '</html>';
            }

            let hideImages = false;

            // Embed videos, link mentions and hashtags, etc...
            if (renderedText) renderedText = HtmlReady(renderedText, { hideImages }).html;

            let cleanText = renderedText;

            let highQualityPost = post.payout > 10.0 ? true : false
            let large = true

            cleanText = sanitize(
                renderedText,
                sanitizeConfig({
                    large,
                    highQualityPost,
                    noImage: false && false,
                })
            );

            if (/<\s*script/gi.test(cleanText)) {
                // Not meant to be complete checking, just a secondary trap and red flag (code can change)
                console.error('Refusing to render script tag in post text', cleanText);
                return <div />;
            }

            const noImageActive = cleanText.indexOf(noImageText) !== -1;
            
            

            // In addition to inserting the youtube component, this allows
            // react to compare separately preventing excessive re-rendering.
            let idx = 0;
            let sections = [];

            function checksum(s) {
                let chk = 0x12345678;
                const len = s.length;
                for (let i = 0; i < len; i += 1) {
                    chk += s.charCodeAt(i) * (i + 1);
                }

                // eslint-disable-next-line no-bitwise
                return (chk & 0xffffffff).toString(16);
            }

            // HtmlReady inserts ~~~ embed:${id} type ~~~
            for (let section of cleanText.split('~~~ embed:')) {
                const embedMd = EmbeddedPlayerGenerateMd(section, idx, large);
                if (embedMd) {
                    const { section: newSection, markdown } = embedMd;
                    section = newSection;
                    sections.push(markdown);

                    if (section === '') {
                        // eslint-disable-next-line no-continue
                        continue;
                    }
                }

                sections.push(<div key={checksum(section)} dangerouslySetInnerHTML={{ __html: section }} />);

                idx += 1;
            }


            let className = ''
            const cn = 'Markdown'
            + (className ? ` ${className}` : '')
            + (html ? ' html' : '')
            + (large ? '' : ' MarkdownViewer--small');

            let allowNoImage = false;
            let finalText = '';
            sections.forEach(async sec => {
                if (!sec.props.className || sec.props.className !== 'videoWrapper') {
                    finalText += sec.props.dangerouslySetInnerHTML.__html
                }
                if (sec.props.className === 'videoWrapper') {
                    const windowWidth = window.innerWidth

                    console.log(typeof windowWidth)

                    const wrapperHeight = windowWidth < 768 ? '100%' : '360px';

                    finalText += 
                        `<div className=${sec.props.className} style="position: relative; width: 100%; height: fit-content;">
                            <iframe src=${sec.props.children.props.src} height=${wrapperHeight} width=100% title=${sec.props.children.props.title}></iframe>
                        </div>`
                }
            })

            postObj.body = finalText;


            let json = post.json_metadata
            if (json) {
                json = JSON.parse(json)
            }
            if (json.image) {
                if (json.image.length > 0) {
                    postObj.cover = json.image[json.image.length - 1]
                }
            }

            setPost(postObj)
        }
        async function checkFollowing(follower, user) {
            let checkFollowOp = await ops.checkFollowing(follower, user);
            return checkFollowOp;
        }
                
        async function getFollowCount(user) {
            let getCount = await ops.getFollowCount(user);
            return getCount;
        }
    

        if (followersArr.length > 0) {
            await followersArr.forEach(async f => {
                const checkFollowOp = await checkFollowing(loggedInUser, f.follower)
                const followCountOp = await getFollowCount(f.follower)
    
                f.followCount = followCountOp

                f.status = checkFollowOp
                allFollowerArr.push(f)

                if (allFollowerArr.length === followersArr.length) {
                    setFollowers(allFollowerArr)
                }
            })
        }

        if (followingArr.length > 0) {
            await followingArr.forEach(async f => {
                const checkFollowOp = await checkFollowing(loggedInUser, f.following)
                const followCountOp = await getFollowCount(f.following)
    
                f.followCount = followCountOp

                f.status = checkFollowOp
                allFollowingArr.push(f)
                if (allFollowingArr.length === followingArr.length) {
                    setFollowing(allFollowingArr)
                }
            })
        }
        if (morePostsArr) {
            let onePost = {}
            await morePostsArr.forEach(async d => {
                if (d.title.length > 0 && d.author !== undefined && d.permlink !== undefined) {
                    let postImgHeight = '150px';
                    let json = d.json_metadata
                    let title = ``;
                    title = d.title

                    let summary = d.body
                    if (d.body.length > 100) {
                        summary = d.body.substring(0, 90)
                    }
                    summary = summary.replace(/<center>/g, '').replace(/<\/center>/g, '').replace(/<div className="text-justify">/g, '').replace(/<\/div>/g, '').replace(/<div className="pull-left">/g, '').replace(/<div className="pull-right">/g, '').replace(/<hr>/g, '')
                    if (json) {
                        json = JSON.parse(json)
                        if (json.image) {
                            if (json.image.length > 0 && title.length > 0) {        
                                onePost = {
                                    title: title,
                                    permlink: d.permlink,
                                    author: d.author,
                                    url: d.url,
                                    last_update: d.last_update,
                                    cover: json.image[0],
                                    category: json.tags[0],
                                    postImgHeight,
                                    summary: md.render(summary)
                                }
                            }
                        }
                        await morePostsInit.push(onePost)
                    }
                }
            });

            setMorePosts(morePostsInit)
        }

        if (commentsPosts) {
            setComments(commentsPosts)
        }

            
        
            
        document.getElementById('hideOnLoad').style.display = 'none'
    }

    getPost()
  }, []);

  function createMarkup(params) {
    return {__html: params};
  }

  function sanitizeHtmlFunc() {
    
  }

  return (
      

    <div className="post-detail" id="post-page-content" style={{padding: '5% 2%'}}>
        <div className="row">
            <div className="col-lg-2 col-sm-12 col-md-12 d-none d-sm-none d-md-none d-lg-block">
                <div className="card mb-3 border-0">
                    <h4 className="card-header hot border-0"  style={{color: '#1A2238', textDecoration: 'none !important', padding: '5%'}} className="post-title">More from @{post.author}</h4>
                    
                    <div className="list-group border-0">
                    {morePosts.map((post) => (
                        <a href={`/post?permlink=${post.permlink}&author=${post.author}`} className="list-group-item list-group-item-action flex-column align-items-start border-0"/*style={{padding: '10%'}}*/>
                            <div className="d-flex w-100 justify-content-between">
                                <h6 className="mb-1"  style={{cursor: 'pointer !important', color: '#1A2238', textDecoration: 'none !important'}}><b>{post.title}</b></h6>
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
            <div className="col-lg-7 col-md-12 col-sm-12" key={post.permlink} data-author={post.author}>
                {<div className="card post-card border-0">
                    <div className="card-header row" style={{backgroundColor: "#1A2238", color: "white", paddingTop: '3%'}}>
                        <div className="text-start col-md-3">
                            <img id="avatar" src={`https://images.hive.blog/u/${post.author}/avatar`} style={{borderRadius: '50%'}} />
                        </div>
                        
                        <div className="text-start col-md-9">
                            <h5 className="card-title col">{post.title}</h5>
                        </div>
                        
                    </div>
                    <div id="hideOnLoad" className="card-body post-card-body">
                        
                        <div className="sweet-loading text-center" style={{marginTop: '15%'}}>
                            <PulseLoader color={color} loading={loading} css={override} size={50} />
                        </div>
                    </div>
                    <div className="card-body post-card-body">
                        <div className="card-text text-start" id="post-body-text" dangerouslySetInnerHTML={createMarkup(post.body)} />
                        <div className="card-text text-start">
                            <hr />
                            <ReplyLink props={{
                                id: permlink + author,
                                parent_author: author,
                                parent_permlink: permlink,
                                isComment: false,
                                title: post.title
                            }} />
                            <hr />
                        </div>
                    </div>
                    
                    <div className="card-footer post-footer-area row" style={{backgroundColor: "#1A2238"}}>
                        <div className="vote-post text-white col">
                            <Vote props={{
                                author,
                                permlink,
                                voted: post.voted,
                                voter: loggedInUser
                            }} />
                        </div>
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
                </div>}
            </div>
            <div className="col-lg-3 col-sm-12 col-md-12 d-none d-sm-none d-md-none d-lg-block">
                <div className="card mb-3 border-0">
                    <h4 className="card-header hot border-0"  style={{color: '#1A2238', textDecoration: 'none !important', padding: '5%'}} className="post-title">@{post.author} followers</h4>
                    <div className="list-group">
                    {followers.map((oneFollower) => (
                        <a className="list-group-item list-group-item-action flex-column align-items-start border-0" /*style={{padding: '5% 10%', cursor: 'pointer'}}*/>
                            <div className="d-flex w-100 justify-content-between" style={{cursor: 'pointer !important', color: '#1A2238', textDecoration: 'none !important'}} data-profile-url={`/u?user=${oneFollower.follower}`} >
                                <b>{oneFollower.follower}</b>
                                <Follow props={{
                                    followUser: oneFollower.follower,
                                    author,
                                    followingStatus: oneFollower.status,
                                    followCount: oneFollower.followCount.follower_count
                                }} />
                            </div>
                        </a>
                    ))}
                    
                    </div>
                </div>
                <hr />
                <div className="card mb-3 border-0">
                    <h4 className="card-header hot border-0"  style={{color: '#1A2238', textDecoration: 'none !important', padding: '5%'}} className="post-title">@{post.author} is following</h4>
                    <div className="list-group">
                    {following.map((oneFollower) => (
                        <a className="list-group-item list-group-item-action flex-column align-items-start border-0" /*style={{padding: '5% 10%', cursor: 'pointer'}}*/>
                            <div className="d-flex w-100 justify-content-between" style={{cursor: 'pointer !important', color: '#1A2238', textDecoration: 'none !important'}} data-profile-url={`/u?user=${oneFollower.following}`} >
                                <b>{oneFollower.following}</b>
                                <Follow props={{
                                    followUser: oneFollower.following,
                                    author,
                                    followingStatus: oneFollower.status,
                                    followCount: oneFollower.followCount.follower_count
                                }} />
                                {
                                    //<span className="badge badge-primary badge-pill" style={{cursor: 'pointer', backgroundColor: '#1A2238', padding: '4%'}}>Follow</span>
                                }
                            </div>
                        </a>
                    ))}
                    
                    </div>
                </div>
            </div>
            <hr />
            <br />
            <br />

            <h6>Comments</h6>
            <Comment props={{
                comments,
                title: post.title
            }} />

            {/*comments.map((comment) => (<div className="col-lg-12 col-sm-12 container" key={comment.permlink} data-author={comment.author} data-parent-author={comment.parent_author} style={{margin: "3% 0"}}>
                {<div className="card comment-card">
                    <div className="card-body post-card-body">
                        <div className="card-text text-start" id="comment-body-text" dangerouslySetInnerHTML={createMarkup(comment.body)} />
                    </div>
                    <div className="card-footer text-center comments-footer-area row" style={{backgroundColor: "#1A2238"}}>
                        <div className="vote-post text-white text-center comment-action col-1">
                            <Vote props={{
                                author: comment.author,
                                permlink: comment.permlink,
                                voted: comment.voted,
                                voter: loggedInUser
                            }} />
                        </div>
                        <div className="comment-author text-center comment-action col-3" href={"/u?user=" + comment.author} style={{cursor: 'pointer !important', color: '#fff', textDecoration: 'none !important', display: 'inline-flex'}}>
                            <img src={`https://images.hive.blog/u/${comment.author}/avatar`} style={{borderRadius: '50%'}} />
                        </div>
                        <div className="comment-author text-center comment-action col-1" href={"/u?user=" + comment.author} style={{cursor: 'pointer !important', color: '#fff', textDecoration: 'none !important', display: 'inline-flex'}}>
                            <small>@{comment.author}</small> 
                        </div>
                        <div className="pending-payout text-white text-center comment-action col-1" style={{fontSize: '10px', display: 'inline-flex', paddingTop: '1%'}}><b className="text-center">{comment.pendingPayout}</b></div>
                        <ReplyLink className="col-1" style={{fontSize: '10px', display: 'inline-flex', paddingTop: '1%'}} />
                    </div>
                </div>}
            </div>))*/}
            <br />
            <br />
        </div>
    </div>
  );
}

export default Post;