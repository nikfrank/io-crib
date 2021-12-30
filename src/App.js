import { useState, useEffect } from 'react';

import './App.scss';

import { Game } from './Game';
import { loginWithGithub, auth, loadBoards } from './network';
import { ReactComponent as GithubLogo } from './github.svg'

const mockHands = [
  [
    { rank: 1, suit: 0 },
    { rank: 4, suit: 1 },
    { rank: 4, suit: 0 },
    { rank: 12, suit: 0 },
    { rank: 13, suit: 0 },
    { rank: 5, suit: 0 }
  ],

  [
    { rank: 1, suit: 2 },
    { rank: 2, suit: 1 },
    { rank: 3, suit: 3 },
    { rank: 11, suit: 0 },
    { rank: 5, suit: 3 },
    { rank: 11, suit: 2  },
  ]
];

const Logo = ()=> (<img src='favicon.ico' />);
const Score = ({ game={ p1: { score: 0 }, p2: { score: 0 }} }={})=> (<div>
  <div>p1 = {game.p1.score}</div>
  <div>p2 = {game.p2.score}</div>
</div>);


const Menu = ({ user })=> user ? (
  <img className='user' alt='' src={user.photoURL} />
) : (
  <div>
    <button className='login' onClick={loginWithGithub}>
      Login with <GithubLogo />
    </button>
  </div>
);

function App() {

  // this should be a useReducer, which the network can update
  // aka just a downstream copy of the firebase state
  // all updates run through the network
  const [game, setGame] = useState({ p1: { score: 0, hand: mockHands[0] }, p2: { score: 0, hand: mockHands[1] }});

  // App needs to manage connecting to a table, binding network actions to the Game
  // when the game is over, display a winner message and a button to start the next game


  const [user, setUser] = useState(null);

  useEffect(()=>{
    auth().onAuthStateChanged((newUser) => {
      console.log(newUser?.providerData[0]);
      if (!newUser) return;
      setUser(newUser.providerData[0]);
    })
  }, []);

  useEffect(()=>{
    if(user) loadBoards(user.uid).then(boards=> console.log(boards));
  }, [user]);
  
  return (
    <div className="App">
      <header className="App-header">
        <Logo />
        <Score game={game} />
        <Menu user={user}/>
      </header>
      <div className='game-container'><Game game={game} /></div>
    </div>
  );
}

export default App;
