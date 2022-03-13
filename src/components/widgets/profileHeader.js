import React from 'react'
import Follow from './follow';


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

const profile = getUrlParameter('user')

function ProfileHeader(v) {
    let props = v.props;

    return (
        <>
            <div className="col-lg-12 col-sm-12 col-md-12">
                <div className="jumbotron jumbotron-fluid d-flex flex-column">
                    <img src={`${props.coverImage}`} style={{height: '300px'}} />
                </div>
            </div>
                        
            <div className="col-lg-12 col-sm-12 col-md-12" style={{margin: '2% 0', display: props.followDisplay }}>
                <div className="text-end" id="profile-follow" style={{width: "10%", marginLeft: '70%'}}>
                    <Follow props={{
                        followUser: profile,
                        profile,
                        followingStatus: props.followStatus,
                        followCount: props.followCount
                    }} />
                </div>
            </div>
            <hr />
            <div className="post-footer-area row" style={{color: 'white'}}>
                <ul className="nav nav-tabs" style={{backgroundColor: '#1A2238', color: 'white'}}>
                    <li className="nav-item">
                        <a className="nav-link" aria-current="page" href={`/u?user=${profile}`} style={{color: 'white'}}>Blog</a>
                    </li>
                    <li className="nav-item">
                        <a className="nav-link" aria-current="page" href={`/p?user=${profile}`} style={{color: 'white'}}>Posts</a>
                    </li>
                    <li className="nav-item">
                        <a className="nav-link" href={`/replies?user=${profile}`} tabindex="-1" aria-disabled="true" style={{color: 'white'}}>Replies</a>
                    </li>
                    <li className="nav-item">
                        <a className="nav-link" href={`/wallet?user=${profile}`} tabindex="-1" aria-disabled="true" style={{color: 'white'}}>Wallet</a>
                    </li>
                    {/*<li className="nav-item">
                        <a className="nav-link" href={`/u/promotions?user=${profile}`} tabindex="-1" aria-disabled="true" style={{color: 'white'}}>Promotions</a>
                    </li>
                    <li className="nav-item">
                        <a className="nav-link" href={`/comments?user=${profile}`} tabindex="-1" aria-disabled="true" style={{color: 'white'}}>Comments</a>
                    </li>
                    <li className="nav-item">
                        <a className="nav-link" href="#" style={{color: 'white'}}>Following</a>
                    </li>
                    <li className="nav-item">
                        <a className="nav-link" href="#" style={{color: 'white'}}>Followers</a>
                    </li>
                    <li className="nav-item">
                        <a className="nav-link" href="#" tabindex="-1" aria-disabled="true" style={{color: 'white'}}>Wallet</a>
                    </li>
                    <li className="nav-item">
                        <a className="nav-link" href="#" tabindex="-1" aria-disabled="true" style={{color: 'white'}}>P2P Exchange</a>
                    </li>*/}
                </ul>
            </div>
        </>
    )
}

export default ProfileHeader;