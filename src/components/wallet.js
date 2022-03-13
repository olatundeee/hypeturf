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

function Wallet() {
    const [walletData, setWalletData] = React.useState([]);
    let [loading, setLoading] = React.useState(true);
    let [color, setColor] = React.useState('#1A2238');
    let [followStatus, setFollowStatus] = React.useState(false);
    let [followCount, setFollowCount] = React.useState(0);
    let [coverImage, setCoverImage] = React.useState('/img/default_avatar.png')

    let refPosts = []
    let authorPosts = []
    let postImgHeight = '250px'

    

    React.useEffect(() => {

        async function getWalletData() {

            const getWalletData = await ops.getWalletData(profile);

            setWalletData(getWalletData)
            
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

            document.getElementById('hideOnLoad').style.display = 'none'

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

        getWalletData()
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

                <div class="wallet-area" style={{padding: '3% 10%', fontSize: '12px'}}>
                    <div class="row">
                        <div class="card col-lg-12 col-md-12 col-sm-12 wallet-info-area">
                            <div class="card-body power-down-notifier">
                                <h6 const="user-info-area">@<span class="username-text">{profile}</span>'s Wallet</h6>
                            </div>
                            <div class="card-body power-down-notifier">
                                <p>Your next power down is scheduled to happen in approximately {walletData.finalTimeInterval }. About  {walletData.vestingWithdrawalHive} HIVE</p>
                            </div>
                            <div class="card-body row rewards-notifier">
                                <div class="col-8">
                                    <p><span class="reward-hive">{ walletData.rewardHive }</span>, <span class="reward-hbd">{ walletData.rewardHBD }</span>, <span class="reward-hp">{ walletData.rewardVesting }</span></p>
                                </div>
                                <div class="col-4">
                                    <center>
                                        <button type="button" class="btn btn-primary claim-rewards">Claim</button>
                                    </center>
                                </div>
                            </div>
                        </div>
                        <div class="card col-lg-12 col-md-12 col-sm-12 token-area">
                            <div class="card-body">
                                <div class="row container">
                                    <div class="col-lg-8 col-md-8 col-sm-12 text-left">
                                        <h5 class="text-left">Hive(Liquid)</h5>
                                        <p class="text-left">Liquid tokens that can be converted to Hive Power(HP) by powering up, or to other cryptocurrencies by trading on HIVE listed exchanges</p>
                                    </div>
                                    <div class="col-lg-4 col-md-4 col-sm-12 text-right currency-area">
                                        <div class="dropdown">    
                                            <h6 class="text-right dropdown-toggle" id="dropdownMenuButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" style={{cursor: "pointer"}}>{ walletData.hiveBalance } HIVE</h6>
                                            <div class="dropdown-menu float-right" aria-labelledby="dropdownMenuButton" style={{marginLeft: "40%"}}>
                                            <a class="dropdown-item" href="#"  data-toggle="modal" data-target="#trfHiveModal">Transfer</a>
                                            <a class="dropdown-item" href="#"  data-toggle="modal" data-target="#trfHiveToVestModal">Power Up</a>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <hr />
                            <div class="card-body">
                                <div class="row container">
                                    <div class="col-lg-8 col-md-8 col-sm-12 text-left">
                                        <h5 class="text-left">Hive Power(HP)(Staked)</h5>
                                        <p class="text-left">Hive power is accumulated as rewards from curation and content creation. <br /> Users with more Hive Power will earn more Hive, so endeavor to power up some Hive as much as you can to increase your potential rewards</p>
                                    </div>
                                    <div class="col-lg-4 col-md-4 col-sm-12 text-right currency-area">
                                        <div class="dropdown">    
                                            <h6 class="text-right dropdown-toggle" id="dropdownMenuButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" style={{cursor: "pointer"}}><span class="user-hp">{ walletData.hivePower }</span> HP<br /><i>({ walletData.delegatedHivePower } HP)</i></h6>
                                            <div class="dropdown-menu float-right" aria-labelledby="dropdownMenuButton" style={{marginLeft: "40%"}}>
                                            <a class="dropdown-item" href="#" data-toggle="modal" data-target="#unStakeModal">Power Down</a>
                                            <a class="dropdown-item" href="#" data-toggle="modal" data-target="#delegationModal">Delegate</a>
                                            <a class="dropdown-item" href="#" data-toggle="modal" data-target="#unStakeModal" id="cancel-unstake">Cancel Power Down</a>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <hr />
                            <div class="card-body">
                                <div class="row container">
                                    <div class="col-lg-8 col-md-8 col-sm-12 text-left">
                                        <h5 class="text-left">Hive Backed Dollars(HBD)</h5>
                                        <p class="text-left">Can be converted to liquid HIVE</p>
                                    </div>
                                    <div class="col-lg-4 col-md-4 col-sm-12 text-right">
                                        <div class="dropdown">    
                                            <h6 class="text-right dropdown-toggle" id="dropdownMenuButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" style={{cursor: "pointer"}}>{ walletData.hbdBalance } HBD</h6>
                                            <div class="dropdown-menu float-right" aria-labelledby="dropdownMenuButton" style={{marginLeft: "40%"}}>
                                            <a class="dropdown-item" href="#" data-toggle="modal" data-target="#trfHBDModal">Transfer</a>
                                            <a class="dropdown-item" href="#" data-toggle="modal" data-target="#trfHBDSavingsModal">Transfer To Savings</a>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <hr />
                            <div class="card-body">
                                <div class="row container">
                                    <div class="col-lg-8 col-md-8 col-sm-12 text-left">
                                        <h5 class="text-left">Hive Savings</h5>
                                        <p class="text-left">Save your HIVE tokens</p>
                                    </div>
                                    <div class="col-lg-4 col-md-4 col-sm-12 text-right">
                                        <div class="dropdown">    
                                            <h6 class="text-right dropdown-toggle" id="dropdownMenuButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" style={{cursor: "pointer"}}>{ walletData.hbdSavings } HBD</h6>
                                            <div class="dropdown-menu float-right" aria-labelledby="dropdownMenuButton" style={{marginLeft: "40%"}}>
                                            <a class="dropdown-item" href="#" data-toggle="modal" data-target="#withdrawHBDSavingsModal">Withdraw</a>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <hr />
                            <div class="card-body">
                                <div class="row container">
                                    <div class="col-lg-8 col-md-8 col-sm-12 text-left">
                                        <h5 class="text-left">Estimated Account Value</h5>
                                    </div>
                                    <div class="col-lg-4 col-md-4 col-sm-12 text-right">
                                        <h6 class="text-right">${ walletData.estimatedAccountValue }</h6>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Wallet;