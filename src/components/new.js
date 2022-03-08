import {React, useCallback, useState, useMemo, useEffect} from "react";
import {keychain, isKeychainInstalled, hasKeychainBeenUsed} from '@hiveio/keychain'
import ops from "../services/hiveOps"
import SimpleMdeReact from "react-simplemde-editor";
import { InputTags } from 'react-bootstrap-tagsinput'
import 'react-bootstrap-tagsinput/dist/index.css'

// components


const hive = require("@hiveio/hive-js")
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

//let popularCommunities = [];


//let inscrybmde = new InscrybMDE()


const author = getUrlParameter('user')

function New() {
    let [value, setValue] = useState("");
    let [tags, setTags] =  useState(['hypeturf'])
    let [communities, setCommunities] = useState([])
    let [chosenCommunity, setChosenCommunity]= useState('')

    const autofocusNoSpellcheckerOptions = useMemo(() => {
        return  {
          hideIcons: ['preview', 'side-by-side'],
          previewImagesInEditor: true,
          promptURLs: true,
          autoSaving: true
        };
    }, []);

    function finishPosting(author, permlink) {
        window.location.replace(`/p?user=${author}`)
    }

    useEffect(() => {
        async function getCommunities () {
            let popularCommunities = await ops.getPopularCommunities()
            setCommunities(popularCommunities)
        }

        getCommunities()
    })
   
    async function handlePostSubmit() {
        const title = document.getElementById('postTitle').value
        const body = value;
        const parentAuthor = '';
        const parentTitleLower = title.toLowerCase();         
        const parentPermlinkInit = parentTitleLower.replace(/ /g, '-');
        const parentPermlinkInitEx = parentPermlinkInit.replace(/'?!.`;:/g, '');        
        const colonpermlink = parentPermlinkInitEx.replace(/,/g, '');
        let permlink = colonpermlink.replace(/:/g, '');
        permlink = permlink.replace(/\\|\//g,'') ;
        const parentPermlink = chosenCommunity.length > 0 ? chosenCommunity : 'ftest'
        const jsonMetadata = {tags, app: 'hypeturf/v1' }

        const comment = {
            parent_author: parentAuthor,
            parent_permlink: parentPermlink,
            author,
            permlink,
            title,
            body,
            json_metadata: JSON.stringify(jsonMetadata)
        };

        let benefactor_global = [
            [0, {beneficiaries: [{account: 'hypeturf', weight: 1100}]}]
        ];


        const comment_options = ['comment_options', {
            author,
            permlink,
            max_accepted_payout: /* video.declineRewards === true ? '0.000 SBD' : */'100000.000 SBD',
            percent_hbd: /* video.rewardPowerup === true ? 0 : */ 10000,
            allow_votes: true,
            allow_curation_rewards: true,
            extensions: /* video.declineRewards ? [] : */ benefactor_global
        }]

        const operation = ['comment', comment]

        const {success, msg, cancel, notInstalled, notActive} = await keychain(window, 'requestTransfer', 'test', author, 5,  'test memo', 'HIVE')
        
        const keychainStatus = localStorage.getItem('keychain')

        if(isKeychainInstalled && keychainStatus === 'yes') {
            // do your thing

            try {
                const {success, msg, cancel, notInstalled, notActive} = await keychain(window, 'requestBroadcast', author, [operation, comment_options], 'Posting');

                if (success) {
                    finishPosting(author, permlink)
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
                    const dybnjg = localStorage.getItem('ajbhs')
                    const sendPost = await hive.broadcast.commentAsync(dybnjg, parentAuthor, parentPermlink, author, permlink, title, body, JSON.stringify(jsonMetadata))
                    const sendCommentOptions = await hive.broadcast.sendAsync({
                        operations: [operation, comment_options]
                      }, {posting: dybnjg});
                    finishPosting(author, permlink)
                } catch (error) {
                    console.log(error)
                    alert('Error encountered')
                    
                }
            }
        }
    }

    async function changeSelect(v) {
        setChosenCommunity(v.target.value)
    }

    return (
        <div className="post-detail" id="post-page-content">
            <div className="row">
                <div className="col-lg-2"></div>
                <div className="col-lg-8 col-sm-12 container" key={author} data-author={author}>
                    <div className="container mb-3 text-cont">
                        <label htmlFor="postTitle" className="form-label text-left">Title</label>
                        <input type="text" className="form-control" id="postTitle" placeholder="Enter a Title for Your Post Here" />
                    </div>

                    <div className="container mb-3 text-cont">
                        <label htmlFor="communitiesSelect">Select one popular community(optional)</label>
                        <select value={chosenCommunity} onChange={changeSelect} style={{
                            width: '100%',
                            height: '50px',
                            borderRadius: "25px"
                        }} id="communitiesSelect">
                            {communities.map((option) => (
                                <option value={option.community.name}>{option.community.title}</option>
                            ))}
                        </select>
                    </div>

                    <div className="container mb-3">
                        <label htmlFor="postEditor" className="form-label">Description</label>
                        <SimpleMdeReact value={value} onChange={(value) => {
                            setValue(value)
                        }} options={autofocusNoSpellcheckerOptions} style={{textAlign: 'left'}} />
                    </div>

                    <div style={{ margin: 10 }}>
                        <div className='input-group'>
                            <InputTags values={tags} onTags={(value) => setTags(value.values)} />
                            <button
                            className='btn btn-outline-secondary'
                            type='button'
                            data-testid='button-clearAll'
                            onClick={() => {
                                setTags([])
                            }}
                            >
                            Delete all
                            </button>
                        </div>
                    </div>

                    <div className="container mb-3 text-right">
                        <a className="btn" id="submitPost" style={{backgroundColor: "#1A2238", color: 'white'}} onClick={() => {
                            handlePostSubmit()
                        }}>Submit</a>
                    </div>
                </div>
                <div className="col-lg-2"></div>
                <hr />
                <br />
                <br />
                <br />
                <br />
            </div>
        </div>
    );
}

export default New;