import { useState } from 'react';

import './App.scss';

import { Game } from './Game';

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
const Menu = ()=> (<div />);

function App() {

  const [game, setGame] = useState({ p1: { score: 0, hand: mockHands[0] }, p2: { score: 0, hand: mockHands[1] }});
  
  return (
    <div className="App">
      <header className="App-header">
        <Logo />
        <Score game={game} />
        <Menu />
      </header>
      <div className='game-container'><Game game={game} /></div>
    </div>
  );
}

export default App;
