import { useState, useEffect, useMemo } from 'react';

import './App.scss';

import { Game } from './Game';
import { loginWithGithub, auth, loadBoards, createGame, updateGame, subGame } from './network';
import { scorehand, randomCard, dealCards, pegScore } from './crib-util';

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
  cut: {},
  p1: "",
  p1crib: [],
  p1hand: [],
  p1photo: "",
  p1prevScore: 0,
  p1score: 0,
  p2: "",
  p2crib: [],
  p2hand: [],
  p2photo: "",
  p2prevScore: 0,
  p2score: 0,
  pegs: [],
  phase: "new",
};

const Logo = ()=> (<img src='favicon.ico' />);

const trackx = (score, inset)=>(
  (score > 0) && (score <= 30) ? 5 + (score * 87) / 30 :
  (score > 30) && (score <= 60) ? (101 - inset*3) :
  (score > 60) && (score <= 90) ? 8 + ((90 - score) * 87) / 30 :
  (score > 90) && (score <= 120) ? -1 + inset*3 : 3.5
);

const tracky = (score, inset)=>(
  ((score > 0) && (score <= 30)) ? -1 + inset*3 :
  ((score > 30) && (score <= 60)) ? 5 + ((score-30) * 87) / 30 :
  ((score > 60) && (score <= 90)) ? (101 - inset*3) :
  ((score > 90) && (score <= 120)) ? 8 + ((120 - score) * 87) / 30 : 3.5
);

const trackPoints = Array(2).fill(0).map((_, inset)=>
  Array(122).fill(0).map((_, score)=>
    [trackx(score, inset+1), tracky(score, inset+1)]
  )).flat().map(([ cx, cy ], i)=> <circle key={i} cx={cx} cy={cy} r={i === 121 ? 1.125 : 0.5} fill='black' />);

const trackLines = [
  [7, 93].map(e => Array(5)
    .fill(0)
    .map((_, i)=>  <line key={e+'a'+i} x1={i * 14.5 + 21} y1={100*Math.round(e / 100)} x2={i * 14.5 + 21} y2={e} /> )).flat(),
  
  [7, 93].map(e => Array(5)
    .fill(0)
    .map((_, i)=>  <line key={e+'b'+i} y1={i * 14.5 + 21} x1={100*Math.round(e / 100)} y2={i * 14.5 + 21} x2={e} /> )).flat(),
].flat();

const Track = ({ game: { p1score=0, p1prevscore=0, p2score=0, p2prevscore=0 }=
  { p1score: 0, p1prevscore: 0, p2score: 0, p2prevscore: 0 }})=> (
    <div className='score-track'>
      <svg viewBox='0 0 100 100' preserveAspectRatio='none'>
        <polygon
          fill='#b90'
          stroke='black'
          strokeWidth='0.125'
          points='0, 0 7, 7 7, 93 0, 100 0, 0 100, 0 93, 7 7, 7 0, 0 100, 0 100, 100 93, 93 93, 7 100, 0 100, 100 0, 100 7, 93 93, 93 100, 100 0, 100 7, 93 93, 93 93, 7 7, 7' />

        {trackPoints}

        {trackLines}

        <circle cx={trackx(p1score, 1)} cy={tracky(p1score, 1)} r={.5} fill='#3d3' />
        <circle cx={trackx(p1prevscore, 1)} cy={tracky(p1prevscore, 1)} r={.375} fill='#3d3' />


        <circle cx={trackx(p2score, 2)} cy={tracky(p2score, 2)} r={0.5} fill='#d33' />
        <circle cx={trackx(p2prevscore, 2)} cy={tracky(p2prevscore, 2)} r={.375} fill='#d33' />
      </svg>
    </div>
  );


const Menu = ({ user, newGame, boards, refreshBoards, selectGame, p2mode=false })=> user ? (
  <div className='Menu'>
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {boards.find(g => ((g.p1 === user.uid) || (g.p2 === user.uid))) ? (
         <svg viewBox='0 0 2 2' style={{ margin: 2, width: 'calc(100% - 4px)', height: 'calc(100% - 4px)' }}>
           <circle cx={1} cy={1} r={1} fill={p2mode ? '#d33' : '#3d3'} />
         </svg>
      ): (
         <button onClick={newGame}>
           New Game
         </button>
      )}
      <img className='user menu-user' alt='' src={user.photoURL} />
    </div>
    <ul className='game-select'>
      <li onClick={()=> refreshBoards(user.uid)}><span>Select Game</span></li>
      {boards.map(board=> (
        <li key={board.id} onClick={()=> selectGame(board)}>
          <span className='score'>{board.p1score}</span><img className='user' alt='' src={board.p1photo} />
          <span className='score'>{board.p2score}</span><img className='user' alt='' src={board.p2photo} />
        </li>
      ))}
      <li onClick={newGame}><span>New Game</span></li>
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

  const [p2mode, setP2mode] = useState(false);

  const refreshBoards = useMemo(()=> (uid)=> (
    loadBoards(uid)
      .then(boards=> boards.filter(b=> !b.phase.includes('won')))
      .then(boards=> (setBoards(boards), boards))
    //.then(boards=> (
    //  setGame( boards.find(b=> ([b.p1, b.p2].includes(user.uid))) ),
    //  subGame( boards.find(b=> ([b.p1, b.p2].includes(user.uid))), setGame ),
    //  setP2mode(user.uid === boards.find(b=> ([b.p1, b.p2].includes(user.uid)))?.p2)
    //))
  ), [boards, setBoards]);

  useEffect(()=>{
    auth().onAuthStateChanged((newUser) => {
      // console.log(newUser?.providerData[0]);
      if (!newUser) return;
      setUser(newUser.providerData[0]);
    })
  }, []);

  useEffect(()=> user ? (void refreshBoards(user.uid)) : null, [user]);

  const newGame = useMemo(()=> ()=> createGame({
    ...defGame,
    p1: user.uid,
    p1photo: user.photoURL,
  }).then(()=> refreshBoards(user.uid).then(boards=> {
    const newest = boards.filter(b => ((!b.p1 && (b.p2 === user.uid)) || (!b.p2 &&  (b.p1 === user.uid))) )[0];
    
    if( newest ) {
      setGame(newest);
      setP2mode(newest.p2 === user.uid);
      subGame( newest.id, setGame );
    }
  })), [user, setGame, setP2mode]);


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
    const cribP = game.phase.substr(-2);

    const cutCard = randomCard(game);

    const nextScores = (cutCard.rank === 11) && (game[cribP + 'score'] < 116) ? {
      [cribP + 'prevscore']: game[cribP + 'score'] || 0,
      [cribP + 'score']: game[cribP + 'score'] + 2,
    } : {};
    
    return updateGame(game.id, {
      [p]: game[p],
      cut: cutCard,
      phase: 'peg-' + game.phase.substr(-2),

      // if it's a jack and p#score < 116, add 2
      ...nextScores,
    });
  }, [game, p2mode]);

  const playPegCard = useMemo(()=> cardId=> {
    const p = p2mode ? 'p2' : 'p1';
    const cribP = game.phase.substr(-2);
    const otherP = cribP === 'p1' ? 'p2' : 'p1';

    const cardsLeft = game[p + 'hand'].filter(lc => !game.pegs.find(pc => ((pc.suit === lc.suit) && (pc.rank === lc.rank))));
    
    const nextPegs = [...game.pegs, cardsLeft[cardId]];

    const pegPoints = pegScore(nextPegs, game.p1hand, game.p2hand);
    const nextscore = game[p + 'score'] + pegPoints;

    const nextPhase = (
      nextscore >= 121
    ) ? (
      game[(p2mode ? 'p1' : 'p2') + 'score'] <= 60 ? (
        (p + '-doubleshneider-won-' + cribP )
      ) : game[(p2mode ? 'p1' : 'p2') + 'score'] <= 90 ? (
        (p + '-skunk-won-' + cribP )
      ) : (p + '-won-' + cribP)
    ) : (
      game.pegs.length === 7 ) ? (
        otherP + '-scores-' + cribP
      ) : game.phase;
    
    return updateGame(game.id, {
      [p]: game[p],
      pegs: nextPegs,
      phase: nextPhase,

      [p + 'score']: nextscore,
      [p + 'prevscore']: nextscore > game[p + 'score'] || 0 ? game[p + 'score'] || 0 : game[p + 'prevscore'] || 0,
    });
  }, [game, p2mode]);

  const takePoints = useMemo(()=> ()=> {
    const p = p2mode ? 'p2' : 'p1';
    const cribP = game.phase.substr(-2);
    const otherP = cribP === 'p1' ? 'p2' : 'p1';

    const handscore = scorehand(game[p + 'hand'], game.cut)
    const cribscore = scorehand([...game.p1crib, ...game.p2crib], game.cut)

    const nextscore = game[p + 'score'] + handscore + (p === cribP ? cribscore : 0);
    const nextPhase = (
      nextscore >= 121 ? (
        game[(p2mode ? 'p1' : 'p2') + 'score'] <= 60 ? (
          (p + '-doubleshneider-won-' + cribP )
        ) : game[(p2mode ? 'p1' : 'p2') + 'score'] <= 90 ? (
          (p + '-skunk-won-' + cribP )
        ) : (p + '-won-' + cribP)
      ) :
      p === cribP ? 'deals-'+otherP :
      cribP + '-scores-' + cribP
    );

    const nextHands = !nextPhase.includes('deals') ? {} : {
      cut: {},
      p1hand: [],
      p2hand: [],
      p1crib: [],
      p2crib: [],
    };
    
    return updateGame(game.id, {
      [p]: game[p],
      [p + 'score']: nextscore,
      [p + 'prevscore']: nextscore > game[p + 'score'] || 0 ? game[p + 'score'] || 0 : game[p + 'prevscore'] || 0,
      phase: nextPhase,

      ...nextHands,
    });
  }, [game, p2mode]);

  const dealHands = useMemo(()=> ()=> {
    const p = p2mode ? 'p2' : 'p1';
    const cribP = game.phase.substr(-2);
    
    return updateGame(game.id, {
      [p]: game[p],
      phase: 'cribs-'+cribP,
      ...dealCards(),
      pegs: [],
    });
  }, [game, p2mode]);

  const boundNetwork = useMemo(()=> ({
    putInCrib,
    cutTheDeck,
    playPegCard,
    takePoints,
    dealHands,
  }), [ putInCrib, cutTheDeck, playPegCard, takePoints, dealHands ]);

  const selectGame = useMemo(()=> nextGame=> {
    if( (nextGame.p1 === user.uid) || (nextGame.p2 === user.uid) ) {
      setGame(nextGame);
      setP2mode(nextGame.p2 === user.uid);
      subGame( nextGame.id, setGame );
      
      return Promise.resolve(nextGame);
      
    } else {
      // add the user to the game
      const p = nextGame.p1 ? 'p2' : 'p1';
      
      return updateGame(nextGame.id, {
        [p]: user.uid,
        [p + 'photo']: user.photoURL,
      }).then(()=> refreshBoards(user.uid))
    }
    
  }, [setGame, user, refreshBoards]);

  const startGame = useMemo(()=> ()=> {    
    const p = p2mode ? 'p2' : 'p1';
    const dealer = game.id.charCodeAt(0) % 2 ? 'p1' : 'p2';
    
    return updateGame(game.id, {
      phase: 'deals-' + dealer,
    });
  }, [game]);
  
  
  return (
    <div className="App">
      { (game?.phase || '').includes('won') && (game?.phase||'').includes('peg') ?
        <div className='new-game'>
          <span className={(game.phase.substr(0,2) === 'p2') === p2mode ? 'won' : 'lost'}>
            {(game.phase.substr(0,2) === 'p2') === p2mode ?
             'you won!': game.phase.includes('doubleshneider') ? 'you got double shneidered!' :
             game.phase.includes('skunk') ? 'you got shneidered!!' : 'you lost!'}
          </span>
          <button className='peg-win' onClick={newGame}>New Game</button>
        </div> :
        
        (game?.phase||'').includes('won') ? (
          <div className='new-game'>
            <span className={(game.phase.substr(0,2) === 'p2') === p2mode ? 'won' : 'lost'}>
              {(game.phase.substr(0,2) === 'p2') === p2mode ?
               'you won!': game.phase.includes('doubleshneider') ? 'you got double shneidered!' :
               game.phase.includes('skunk') ? 'you got shneidered!!' : 'you lost!'
              }
            </span>
            <button onClick={newGame}>New Game</button>
            {/* here, if both players hit newGame within 10 seconds, they should join the same game */}
          </div>
        ) : (game?.phase||'').includes('new') ? (
          <div className='new-game'>
            <button disabled={!game.p1 || !game.p2} onClick={startGame}>
              Start!
            </button>
          </div>
        ): null }
      
      <header className="App-header">
        <Track game={game} />
        <Menu user={user} selectGame={selectGame} newGame={newGame}
              boards={boards} refreshBoards={refreshBoards} p2mode={p2mode} />
      </header>
      <div className='game-container'>
        <Game game={game} p2mode={p2mode} network={boundNetwork} />
      </div>
    </div>
  );
}

export default App;
