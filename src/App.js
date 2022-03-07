import {
  Routes,
  Route
} from "react-router-dom";
import './App.css';
import Home from "./components/home"
import Login from "./components/login"
import Post from "./components/post"
import New from "./components/new"
import Profile from "./components/profile"
import UserPosts from "./components/userPosts";
import * as Icon from 'react-bootstrap-icons';

const restrictedPaths = ['/new']
const NavLinks = function() {
  let token = localStorage.getItem('token')
  if (token !== null) {
    const username = localStorage.getItem('username')
    return (<>
              <li className="nav-item">
                <a className="nav-link text-white" aria-current="page" href={"/u?user=" + username}>Profile < Icon.Person /></a>
              </li>
              <li className="nav-item">
                <a className="nav-link text-white" aria-current="page" href={"/new?user=" + username}>Create Post < Icon.PencilFill /></a>
              </li>
              <li className="nav-item">
                <a className="nav-link text-white" aria-current="page" style={{cursor: 'pointer'}} onClick={logout}>Logout</a>
              </li>
              <li className="nav-item">
                <a className="nav-link text-white text-center" aria-current="page" href={"/u?user=" + username}>
                  <small className="text-center" style={{color: 'white'}}>@{username} </small> 
                  <img id="avatar" alt={'user avatar'} src={`https://images.hive.blog/u/${username}/avatar`} style={{borderRadius: '50%', border: '1px solid white'}} />
                </a>
              </li>
            </>) 
  }

  
  if (token === null) {
    if(restrictedPaths.includes(window.location.pathname)) {
      window.location.replace('/')
    }
    return (<>         
              <li className="nav-item" id="login-link">
                <a className="nav-link text-white" aria-current="page" href="/login">Login</a>
              </li>
            </>)
    }
}

function logout() {
  localStorage.removeItem('token')
  localStorage.removeItem('username')
  localStorage.removeItem('id')
  localStorage.removeItem('ajbhs')
  window.location.reload()
};

function App() {
  return (
      <div className="App">
        <nav className="navbar sticky-top navbar-expand-lg navbar-dark" style={{backgroundColor: "rgb(150, 75, 0)"}}>
          <div className="container-fluid">
            <a className="navbar-brand" href="/" style={{fontFamily: 'Brush Script MT', fontSize: '30px'}}>UPFUND</a>
            <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
              <span className="navbar-toggler-icon"></span>
            </button>
            <div className="collapse navbar-collapse flex-grow-1 text-end" id="navbarSupportedContent">
              <ul className="navbar-nav me-auto text-end">
                <li className="nav-item">
                  <a className="nav-link text-white" aria-current="page" href="/">Home < Icon.House /></a>
                </li>
                
                <NavLinks id="protected-links" />
                
              </ul>
            </div>
          </div>
        </nav>
        
        <div className="page-view">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/post" element={<Post />} />
              <Route path="/new" element={<New />} />
              <Route path="/u" element={<Profile />} />
              <Route path="/p" element={<UserPosts />} />
            </Routes>
        </div>
      </div>
  );
}

export default App;
