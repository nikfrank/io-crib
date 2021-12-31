import { useState, useEffect, useMemo } from 'react';

import './App.scss';

import { Game } from './Game';
import { loginWithGithub, auth, loadBoards, createGame, updateGame, subGame, randomCard } from './network';
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

const mockGame = { p1: { score: 0, hand: mockHands[0] }, p2: { score: 0, hand: mockHands[1] }};

const defGame = {
  cut: "",
  p1: "66971604",
  p1crib: [],
  p1hand: mockHands[0],
  p1photo: "",
  p1prevScore: 0,
  p1score: 0,
  p2: "6264797",
  p2crib: [],
  p2hand: mockHands[1],
  p2photo: "https://avatars.githubusercontent.com/u/6264797?v=4",
  p2prevScore: 0,
  p2score: 0,
  pegs: [],
  phase: "p1-deals",
};

const Logo = ()=> (<img src='favicon.ico' />);
const Score = ({ game={ p1score: 0, p2score: 0 }}={})=> (<div>
  <div>p1 = {game.p1score}</div>
  <div>p2 = {game.p2score}</div>
</div>);


const Menu = ({ user, newGame, boards, selectGame })=> user ? (
  <div className='Menu'>
    <button className='new-game' onClick={newGame}>New</button>
    <img className='user' alt='' src={user.photoURL} />
    <ul className='game-select'>
      <li>Select Game</li>
      {boards.map(board=> (
        <li key={board.id} onClick={()=> selectGame(board)}>
          <img className='user' alt='' src={board.p1photo} />
          <img className='user' alt='' src={board.p2photo} />
        </li>
      ))}
    </ul>
  </div>
) : (
  <div>
    <button className='login' onClick={loginWithGithub}>
      Login with <GithubLogo />
    </button>
  </div>
);

function App() {

  // App needs to manage connecting to a table, binding network actions to the Game
  // when the game is over, display a winner message and a button to start the next game

  
  // only the network can update
  // aka just a downstream copy of the firebase state
  // all updates run through the network
  const [game, setGame] = useState();
  const [boards, setBoards] = useState([]);
  
  const [user, setUser] = useState(null);
  const [created, setCreated] = useState(0);

  const [p2mode, setP2mode] = useState(false);

  useEffect(()=>{
    auth().onAuthStateChanged((newUser) => {
      console.log(newUser?.providerData[0]);
      if (!newUser) return;
      setUser(newUser.providerData[0]);
    })
  }, []);

  useEffect(()=>{
    if(user) loadBoards(user.uid)
      .then(boards=> (setBoards(boards), boards))
      .then(boards=> boards.length === 1 ? (
        setGame(boards[0]),
        setP2mode(user.uid === boards[0].p2)
      ): (
        setGame(boards[boards.length-1]),
        setP2mode(user.uid === boards[boards.length-1].p2)
      ));
  }, [user, created]);

  const newGame = useMemo(()=> ()=> createGame({ ...defGame, p1: user.uid }).then(()=> setCreated(i => i++)), [user]);

  const gameId = useMemo(()=> game ? game.id : null, [game]);
  useEffect(()=> gameId ? subGame(gameId, setGame) : undefined, [gameId]);

  // calculate memos for bound network functions to:

  // deal
  // put cards in crib
  // cut
  // play peg
  // trigger scoring

  // pass them to Game

  // join game, create game (done)
  // pass to Menu

  const putInCrib = useMemo(()=> cardIds=> {
    const p = p2mode ? 'p2' : 'p1';
    
    return updateGame(game.id, {
      [p]: game[p],
      [p + 'crib']: cardIds.map(i=> game[p + 'hand'][i]),
      [p + 'hand']: game[p + 'hand'].filter((_, i) => !cardIds.includes(i)),
    });
  }, [game, p2mode]);

  const cutTheDeck = useMemo(()=> ()=> {
    const p = p2mode ? 'p2' : 'p1';

    const cutCard = randomCard(game);
    
    return updateGame(game.id, {
      [p]: game[p],
      cut: cutCard,
      phase: 'peg-' + game.phase.substr(-2),

      // if it's a jack and p#score < 116, add 2
    });
  }, [game, p2mode]);

  const playPegCard = useMemo(()=> cardId=> {
    const p = p2mode ? 'p2' : 'p1';
    const cribP = game.phase.substr(-2);
    const otherP = cribP === 'p1' ? 'p2' : 'p1';
    
    return updateGame(game.id, {
      [p]: game[p],
      pegs: [...game.pegs, game[p + 'hand'][cardId]],
      phase: game.pegs.length === 7 ? otherP + '-scores-' + cribP : game.phase,

      // if this play scores, eiter by pair/6/12, run, 15, 31, go
      // add the score on now
    });
  }, [game, p2mode]);

  const boundNetwork = useMemo(()=> ({ putInCrib, cutTheDeck, playPegCard }), [ putInCrib, cutTheDeck, playPegCard ]);
  
  return (
    <div className="App">
      <header className="App-header">
        <Logo />
        <Score game={game} />
        <Menu user={user} newGame={newGame} selectGame={setGame} boards={boards} />
      </header>
      <div className='game-container'>
        <Game game={game} p2mode={p2mode} network={boundNetwork} />
      </div>
    </div>
  );
}

export default App;
