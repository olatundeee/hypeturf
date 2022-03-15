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
import {keychain, isKeychainInstalled, hasKeychainBeenUsed} from '@hiveio/keychain'
import Select from "react-dropdown-select";

import ProfileHeader from "./widgets/profileHeader";

import styled from 'styled-components';

const DropDownContainer = styled("div")`
  float: right;
  width: 50%;
  margin: 0;
`;

const DropDownHeader = styled("div")`
  margin-bottom: 0.8em;
  padding: 0.4em 2em 0.4em 1em;
  font-weight: 500;
  color: #1A2238;
  background: #ffffff;
`;

const DropDownListContainer = styled("div")``;

const DropDownList = styled("ul")`
  padding: 0;
  margin: 0;
  padding-left: 1em;
  background: #ffffff;
  border: 2px solid #e5e5e5;
  box-sizing: border-box;
  color: #1A2238;
  font-weight: 500;
  &:first-child {
    padding-top: 0.8em;
  }
`;

const ListItem = styled("li")`
  list-style: none;
  margin-bottom: 0.8em;
  padding: 2%;
  text-align: left;
  cursor: pointer;
`;



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
    let [hiveSelectOpen, setHiveSelectOpen] = React.useState(false) 
    let [hpSelectOpen, setHPSelectOpen] = React.useState(false) 
    let [hbdSelectOpen, setHBDSelectOpen] = React.useState(false) 
    let [savingSelectOpen, setSavingSelectOpen] = React.useState(false) 

    const toggling = () => setHiveSelectOpen(!hiveSelectOpen);

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

    async function claimRewards(user) {        
        let [account] = await hive.api.getAccountsAsync([user]);
        let rewardHive = account.reward_hive_balance
        let rewardHBD = account.reward_hbd_balance
        let rewardHP = account.reward_vesting_balance
        let hivePower = document.getElementById('user-hp').innerText

        const vestingShares = account.vesting_shares;
    
        const vestPercentage = (parseFloat(rewardHP) / parseFloat(hivePower)) * 100
    
        const rewardVests = (vestPercentage / 100) * parseFloat(vestingShares)

        console.log(rewardHive, rewardHP, rewardHBD)



        const keychainStatus = localStorage.getItem('keychain')

        
        const {success, msg, cancel, notInstalled, notActive} = await keychain(window, 'requestTransfer', 'test', user, 5,  'test memo', 'HIVE')

        if(isKeychainInstalled && keychainStatus === 'yes') {
            // do your thing

            try {
                let operation = [
                    "claim_reward_balance",
                    {
                        "account": user,
                        "reward_hive": rewardHive,
                        "reward_hbd": rewardHBD,
                        "reward_vests":rewardHP
                    }
                ]

                //const {success, msg, cancel, notInstalled, notActive} = await keychain(window, 'requestBroadcast', voter, [operation], 'Posting');

                const {success, msg, cancel, notInstalled, notActive} = await keychain(window, 'requestBroadcast', user, [operation], 'Active');

                if (success) {
                    return {success: 'yes'}
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
                    const sendPost = await hive.broadcast.claimRewardBalanceAsync(dybnjg, user, rewardHive, rewardHBD, rewardHP)
                    if (sendPost.id) {
                        alert('Rewards claimed succesfully')
                    }
                } catch (error) {
                    console.log(error)
                    alert('Error encountered')                
                }
            }
        }
    }
    
    if (walletData.vestingWithdrawalHive <= 0.000) {
        document.getElementById('power-down-notifier').style.display = 'none'
    }


    let rewardsNotifierDisp = 'inline-flex'
    if (loggedInUser !== profile) {
        rewardsNotifierDisp = 'none'
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

                <div className="wallet-area" style={{padding: '3% 10%', fontSize: '12px'}}>
                    <div className="row">
                        <div className="card col-lg-12 col-md-12 col-sm-12 wallet-info-area">
                            <div className="card-body">
                                <p>This page is still in development so all the features won't work yet</p>
                            </div>
                            <div className="card-body user-info-sec">
                                <h6 const="user-info-area">@<span className="username-text">{profile}</span>'s Wallet</h6>
                            </div>
                            <div className="card-body" id="power-down-notifier">
                                <p>Your next power down is scheduled to happen in approximately {walletData.finalTimeInterval}. About  {walletData.vestingWithdrawalHive} HIVE</p>
                            </div>
                            <div className="card-body row" id="rewards-notifier" style={{display: rewardsNotifierDisp}}>
                                <div className="col-8">
                                    <p><span id="reward-hive">{ walletData.rewardHive }</span>, <span id="reward-hbd">{ walletData.rewardHBD }</span>, <span id="reward-hp">{ walletData.rewardVesting }</span></p>
                                </div>
                                <div className="col-4" id="claimer-btn">
                                    <center>
                                        <button type="button" className="btn claim-rewards" style={{backgroundColor: '#1A2238', color: 'white'}} onClick={() => {
                                            claimRewards(loggedInUser)
                                        }}>Claim</button>
                                    </center>
                                </div>
                            </div>
                        </div>
                        <div className="card col-lg-12 col-md-12 col-sm-12 token-area">
                            <div className="card-body">
                                <div className="row container">
                                    <div className="col-lg-8 col-md-8 col-sm-12 text-left">
                                        <h5 className="text-left">Hive(Liquid)</h5>
                                        <p className="text-left">Liquid tokens that can be converted to Hive Power(HP) by powering up, or to other cryptocurrencies and FIAT by trading on HIVE listed exchanges</p>
                                    </div>
                                    <div className="col-lg-4 col-md-4 col-sm-12 text-right currency-area">
                                        {/*<div className="dropdown">    
                                            <h6 className="text-right dropdown-toggle" id="dropdownMenuButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" style={{cursor: "pointer"}}>{ walletData.hiveBalance } HIVE</h6>
                                            <div className="dropdown-menu float-right" aria-labelledby="dropdownMenuButton" style={{marginLeft: "40%"}}>
                                            <a className="dropdown-item" href="#"  data-toggle="modal" data-target="#trfHiveModal">Transfer</a>
                                            <a className="dropdown-item" href="#"  data-toggle="modal" data-target="#trfHiveToVestModal">Power Up</a>
                                            </div>
                                        </div>*/}
                                        <DropDownContainer>
                                            <DropDownHeader style={{cursor: 'pointer'}} onClick={() => {
                                                if (loggedInUser === profile) {
                                                    setHiveSelectOpen(!hiveSelectOpen)
                                                } else {
                                                    alert('You must be logged in to this account to perform operations')
                                                }
                                            }}>{ walletData.hiveBalance } HIVE <Icon.ChevronDown /></DropDownHeader>
                                            {//hiveSelectOpen && (
                                                <DropDownListContainer style={{display: hiveSelectOpen === true ? 'block' : 'none'}}>
                                                    <DropDownList>
                                                        <ListItem>Transfer</ListItem>
                                                        <ListItem>Power Up</ListItem>
                                                    </DropDownList>
                                                </DropDownListContainer>
                                            //)
                                            } 
                                        </DropDownContainer> 
                                    </div>
                                </div>
                            </div>
                            <hr />
                            <div className="card-body">
                                <div className="row container">
                                    <div className="col-lg-8 col-md-8 col-sm-12 text-left">
                                        <h5 className="text-left">Hive Power(HP)(Staked)</h5>
                                        <p className="text-left">Hive power is accumulated as rewards from curation and content creation. <br /> Users with more Hive Power will earn more Hive, so endeavor to power up some Hive as much as you can to increase your potential rewards</p>
                                    </div>
                                    <div className="col-lg-4 col-md-4 col-sm-12 text-right currency-area">
                                        {/*<div className="dropdown">    
                                            <h6 className="text-right dropdown-toggle" id="dropdownMenuButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" style={{cursor: "pointer"}}><span id="user-hp">{ walletData.hivePower }</span> HP<br /><i>({ walletData.delegatedHivePower } HP)</i></h6>
                                            <div className="dropdown-menu float-right" aria-labelledby="dropdownMenuButton" style={{marginLeft: "40%"}}>
                                            <a className="dropdown-item" href="#" data-toggle="modal" data-target="#unStakeModal">Power Down</a>
                                            <a className="dropdown-item" href="#" data-toggle="modal" data-target="#delegationModal">Delegate</a>
                                            <a className="dropdown-item" href="#" data-toggle="modal" data-target="#unStakeModal" id="cancel-unstake">Cancel Power Down</a>
                                            </div>
                                        </div>*/}

                                        
                                        <DropDownContainer>
                                            <DropDownHeader style={{cursor: 'pointer'}} onClick={() => {
                                                if (loggedInUser === profile) {
                                                    setHPSelectOpen(!hpSelectOpen)
                                                } else {
                                                    alert('You must be logged in to this account to perform operations')
                                                }
                                            }}><span id="user-hp">{ walletData.hivePower }</span> HP<br /><i>({ walletData.delegatedHivePower } HP)</i> <Icon.ChevronDown /></DropDownHeader>
                                            {//hiveSelectOpen && (
                                                <DropDownListContainer style={{display: hpSelectOpen === true ? 'block' : 'none'}}>
                                                    <DropDownList>
                                                        <ListItem>Delegate</ListItem>
                                                        <ListItem>Power Down</ListItem>
                                                        <ListItem>Cancel Power Down</ListItem>
                                                    </DropDownList>
                                                </DropDownListContainer>
                                            //)
                                            } 
                                        </DropDownContainer>
                                    </div>
                                </div>
                            </div>
                            <hr />
                            <div className="card-body">
                                <div className="row container">
                                    <div className="col-lg-8 col-md-8 col-sm-12 text-left">
                                        <h5 className="text-left">Hive Backed Dollars(HBD)</h5>
                                        <p className="text-left">Can be converted to liquid HIVE</p>
                                    </div>
                                    <div className="col-lg-4 col-md-4 col-sm-12 text-right">
                                        {/*<div className="dropdown">    
                                            <h6 className="text-right dropdown-toggle" id="dropdownMenuButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" style={{cursor: "pointer"}}>{ walletData.hbdBalance } HBD</h6>
                                            <div className="dropdown-menu float-right" aria-labelledby="dropdownMenuButton" style={{marginLeft: "40%"}}>
                                            <a className="dropdown-item" href="#" data-toggle="modal" data-target="#trfHBDModal">Transfer</a>
                                            <a className="dropdown-item" href="#" data-toggle="modal" data-target="#trfHBDSavingsModal">Transfer To Savings</a>
                                            </div>
                                        </div>*/}

                                        <DropDownContainer>
                                            <DropDownHeader style={{cursor: 'pointer'}} onClick={() => {
                                                if (loggedInUser === profile) {
                                                    setHBDSelectOpen(!hbdSelectOpen)
                                                } else {
                                                    alert('You must be logged in to this account to perform operations')
                                                }
                                            }}>{ walletData.hbdBalance } HBD <Icon.ChevronDown /></DropDownHeader>
                                            {//hiveSelectOpen && (
                                                <DropDownListContainer style={{display: hbdSelectOpen === true ? 'block' : 'none'}}>
                                                    <DropDownList>
                                                        <ListItem>Transfer</ListItem>
                                                        <ListItem>Transfer To Savings</ListItem>
                                                    </DropDownList>
                                                </DropDownListContainer>
                                            //)
                                            } 
                                        </DropDownContainer>
                                    </div>
                                </div>
                            </div>
                            <hr />
                            <div className="card-body">
                                <div className="row container">
                                    <div className="col-lg-8 col-md-8 col-sm-12 text-left">
                                        <h5 className="text-left">Hive Savings</h5>
                                        <p className="text-left">Save your HIVE tokens</p>
                                    </div>
                                    <div className="col-lg-4 col-md-4 col-sm-12 text-right">
                                        {/*<div className="dropdown">    
                                            <h6 className="text-right dropdown-toggle" id="dropdownMenuButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" style={{cursor: "pointer"}}>{ walletData.hbdSavings } HBD</h6>
                                            <div className="dropdown-menu float-right" aria-labelledby="dropdownMenuButton" style={{marginLeft: "40%"}}>
                                            <a className="dropdown-item" href="#" data-toggle="modal" data-target="#withdrawHBDSavingsModal">Withdraw</a>
                                            </div>
                                        </div>*/}

                                        <DropDownContainer>
                                            <DropDownHeader style={{cursor: 'pointer'}} onClick={() => {
                                                if (loggedInUser === profile) {
                                                    setSavingSelectOpen(!savingSelectOpen)
                                                } else {
                                                    alert('You must be logged in to this account to perform operations')
                                                }
                                            }}>{ walletData.hbdSavings } HBD <Icon.ChevronDown /></DropDownHeader>
                                            {//hiveSelectOpen && (
                                                <DropDownListContainer style={{display: savingSelectOpen === true ? 'block' : 'none'}}>
                                                    <DropDownList>
                                                        <ListItem>Withdraw</ListItem>
                                                    </DropDownList>
                                                </DropDownListContainer>
                                            //)
                                            } 
                                        </DropDownContainer>
                                    </div>
                                </div>
                            </div>
                            <hr />
                            <div className="card-body">
                                <div className="row container">
                                    <div className="col-lg-8 col-md-8 col-sm-12 text-left">
                                        <h5 className="text-left">Estimated Account Value</h5>
                                    </div>
                                    <div className="col-lg-4 col-md-4 col-sm-12 text-right">
                                        <h6 className="text-right">${ walletData.estimatedAccountValue }</h6>
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