import React from "react";
import ops from "../services/hiveOps"

import {keychain, isKeychainInstalled, hasKeychainBeenUsed} from '@hiveio/keychain'

const hive = require("@hiveio/hive-js")

async function loginOp(username, key) {
    try {
        const signIn = await ops.getToken(username, key);
        await callback(signIn);        
    } catch (error) {
        console.log(error)
        alert('Error encountered')
    }
}
async function callback(data) {
    if (data.auth == true) {
        localStorage.setItem('token', data.token)
        localStorage.setItem('username', data.username)
        localStorage.setItem('id', data.id)
        localStorage.setItem('ajbhs', data.password)
        localStorage.setItem('keychain', 'no')

        window.location.replace('/')
    }
}
async function keychainLoginOp(username) {
    try{
        const accountData = await hive.api.getAccountsAsync([username])
        let auth = accountData[0].posting.account_auths.filter(el => el[0] === 'speak.bounties');
        // All good
        console.log(auth)

        const {success, msg, cancel, notInstalled, notActive} = await keychain(window, 'requestTransfer', 'test', username, 5,  'test memo', 'HIVE')
        if(isKeychainInstalled) {
            // do your thing
            if (auth.length === 0) {
                const response = await keychain(window, 'requestAddAccountAuthority', username, "speak.bounties", "posting", 1);

                if (response.success === true){
                    const fetchMemo = await ops.fetchMemo(username)
                    console.log(fetchMemo)
                    keychainCallback(fetchMemo)
                }
                else {
                    console.log({error : "Keychain error"});
                }
            }
            else {
                const fetchMemo = await ops.fetchMemo(username)
                console.log(fetchMemo)
                keychainCallback(fetchMemo)
            }
        }
        // User didn't cancel, so something must have happened
        else if(!cancel) {
            if(notActive) {
                alert('Please allow Keychain to access this website')
            } else if(notInstalled) {
                alert('Please install Keychain')
            } else {
                //console.log(error.message)
                alert('Error encountered')
            }
        }
    } catch (error) {
        console.log(error)
        alert('Error encountered')
    }
}
async function keychainCallback(memo) {
    const theUsername = memo.username
    const encoded = memo.encoded

    let successMessage = ''

    const res = await keychain(window, 'requestSignBuffer', theUsername, encoded, 'Posting')

    if (res.success) {
        successMessage = res.success
        if (successMessage) {
            const data = await ops.keychainCallback(successMessage, theUsername)
            callback2(data)
        }
    }
}
async function callback2(data) {
    if (data.auth == true) {
        localStorage.setItem('token', data.token)
        localStorage.setItem('username', data.username)
        localStorage.setItem('id', data.id)
        localStorage.setItem('keychain', data.keychain)

        window.location.replace('/')
    }
}
function Login() {

  React.useEffect(() => { }, []);

  return (
      

    <div className="login" id="login-content">
        <div className="row login-form">
            <div className="col-lg-12 col-sm-12 col-md-12">
                <div className="card" id="login-card">
                    <div className="card-title text-center text-white" style={{padding: '2%', backgroundColor: "#1A2238"}}>
                        <h4>Login</h4>
                    </div>
                    <div className="card-body">
                        <div className="input-group mb-3">
                            <input type="text" className="form-control" placeholder="Username" aria-label="Username" aria-describedby="basic-addon1" id="username" />
                        </div>
                        <div className="input-group mb-3" id="posting-key-sec" style={{display: 'flex'}}>
                            <input type="password" className="form-control" placeholder="Posting Key" aria-label="Posting Key" aria-describedby="basic-addon1" id="posting-key" />
                        </div>
                        <div className="form-check mb-3 text-start">
                            <label className="form-check-label" htmlFor="useKeychain">
                                Use Hive Keychain
                            </label>
                            <input className="form-check-input" type="checkbox" value="" id="useKeychain" onClick={() => {
                                if (document.getElementById('useKeychain').checked) {
                                    document.getElementById('keychain-login').style.display = 'flex';
                                    document.getElementById('posting-login').style.display = 'none';
                                    document.getElementById('posting-key-sec').style.display = 'none';
                                } else {
                                    document.getElementById('keychain-login').style.display = 'none';
                                    document.getElementById('posting-login').style.display = 'flex';
                                    document.getElementById('posting-key-sec').style.display = 'flex';
                                }
                                
                            }} />
                        </div>
                        <div className="input-group mb-3" id="posting-login">
                            <button type="button" className="btn" style={{backgroundColor: "#1A2238", color: 'white'}}  id="login" onClick={() => {
                                const username = document.getElementById('username').value
                                const posting = document.getElementById('posting-key').value
                                loginOp(username, posting) 
                            }}>Login</button>
                        </div>
                        <div className="input-group mb-3" id="keychain-login" style={{display: 'none'}}>
                            <button type="button" className="btn" style={{backgroundColor: "#1A2238", color: 'white'}} id="login-key" onClick={() => {
                                const username = document.getElementById('username').value
                                keychainLoginOp(username) 
                            }}>Keychain Login</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
}

export default Login;