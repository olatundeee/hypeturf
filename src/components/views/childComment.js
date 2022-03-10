import React from "react";
import * as Icon from 'react-bootstrap-icons';
import { css } from "@emotion/react";
import MarkdownIt from 'markdown-it';
import { Remarkable } from 'remarkable';
import sanitizeConfig, { noImageText } from '../../utils/sanitizeConfig';
import sanitize from 'sanitize-html';
import HtmlReady from '../../utils/HtmlReady';
import { generateMd as EmbeddedPlayerGenerateMd } from '../widgets/EmbeddedPlayers';
import {extractImageLink} from '../../utils/extractImageLink'

// components
import PulseLoader from "react-spinners/PulseLoader";
import Modal from 'react-modal';

import Comment from "./comment";


const hive = require("@hiveio/hive-js")
let md = new MarkdownIt()


const remarkableToSpec = new Remarkable({
    html: true,
    breaks: false, // real markdown uses \n\n for paragraph breaks
    linkify: false,
    typographer: false,
    quotes: '“”‘’',
});

let loggedInUser = localStorage.getItem('username') ? localStorage.getItem('username') : null




function ChildComment (v) {
    const [comments, setComments] = React.useState([]);
    let [displayStatus, setDisplayStatus] = React.useState('none');
    let commentsPosts = []
    const props = v.props

    React.useEffect(() => {
        let postObj = {
            cover: '',
            title: '',
            body: null,
            voted: false
        }
        async function getPost() {
            let postReplies = await hive.api.getContentRepliesAsync(props.author, props.permlink);
    
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

                        let highQualityPost = d.payout > 10.0 ? true : false
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
        
                        let summary = d.body
                        if (d.body.length > 100) {
                            summary = d.body.substring(0, 90)
                        }
                        summary = summary.replace(/<center>/g, '').replace(/<\/center>/g, '').replace(/<div className="text-justify">/g, '').replace(/<\/div>/g, '').replace(/<div className="pull-left">/g, '').replace(/<div className="pull-right">/g, '').replace(/<hr>/g, '')
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
    
            if (commentsPosts.length > 0) {
                setComments(commentsPosts)
            }
        }
    
        getPost()
      }, []);

    return (
        <Comment props={{
            comments
        }} />
    )   
}

export default ChildComment;