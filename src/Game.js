import { useState, useEffect } from 'react';

import './Game.scss';

import { Hand } from 'react-deck-o-cards';

const defHandStyle = {
  maxHeight:'32vh',
  minHeight:'32vh',
  
  maxWidth:'100vw',
  padding: 0,
};

const pegHandStyle = {
  maxHeight: '100%',
  maxWidth:'100vw',
  padding: 0,  
};

// possible phases:
//
// dealt, 2 in crib, 4 in crib, cutting, pegging, counting
// 
// the last three can cause scoring events
//
// network actions (even for local 2p)
// dealing
// putting cards in the crib
// cutting
// playing cards on the peg

const emptyGame = { p1: '', p2: '', p1hand: [], p2hand: [], pegs: [], phase: 'p1-deals' };


const PhaseButton = ({ phase, onClick, p2mode, handscores={ p1: 12, p2: 12, p2crib: 8 }, selectedCount=0 })=> (
  <div className='PhaseButton'>
    {phase === 'p1-deals' ? (
       <button disabled={p2mode} onClick={onClick}>
         {p2mode ? 'waiting for p1 to deal' :'Deal!'}
       </button>
    ) : phase === 'p2-deals' ? (
       <button disabled={!p2mode} onClick={onClick}>
         {!p2mode ? 'waiting for p2 to deal' :'Deal!'}
       </button>
       
    ) : phase === 'p1-cuts' ? (
       <button disabled={p2mode} onClick={onClick}>
         {p2mode ? 'waiting for p1 to cut' :'Deal!'}
       </button>
    ) : phase === 'p2-cuts' ? (
       <button disabled={!p2mode} onClick={onClick}>
         {!p2mode ? 'waiting for p1 to cut' :'Deal!'}
       </button>
       
    ) : phase === 'both-cribs-p1' ? (
      <button disabled={selectedCount !== 2} onClick={onClick}>
        Put selected cards into {p2mode ? 'opponent\'s' : 'my'} crib
      </button>
    ) : phase === 'both-cribs-p2' ? (
      <button disabled={selectedCount !== 2} onClick={onClick}>
        Put selected cards into {!p2mode ? 'opponent\'s' : 'my'} crib
      </button>
      
    ) : phase === 'p1-cribs-p1' ? (
      <button disabled={p2mode || (selectedCount !== 2)} onClick={onClick}>
        {p2mode ? 'waiting for p1 to put cards into crib' :'Put selected cards into my crib'}
      </button>
    ) : phase === 'p2-cribs-p1' ? (
      <button disabled={!p2mode || (selectedCount !== 2)} onClick={onClick}>
        {!p2mode ? 'waiting for p2 to put cards into crib' :'Put selected cards into opponent\'s crib'}
      </button>
    ) : phase === 'p1-cribs-p2' ? (
      <button disabled={p2mode || (selectedCount !== 2)} onClick={onClick}>
        {p2mode ? 'waiting for p1 to put cards into crib' :'Put selected cards into opponent\'s crib'}
      </button>
    ) : phase === 'p2-cribs-p2' ? (
      <button disabled={!p2mode || (selectedCount !== 2)} onClick={onClick}>
        {!p2mode ? 'waiting for p2 to put cards into crib' :'Put selected cards into my crib'}
      </button>
      
      
    ) : phase === 'p1-scores' ? (
      <button disabled={p2mode} onClick={onClick}>
        {p2mode ? 'waiting for p1 to take ${} points' : 'Take ${} points'}
      </button>
    ) : phase === 'p2-scores' ? (
      <button disabled={!p2mode} onClick={onClick}>
        {!p2mode ? 'waiting for p1 to take ${} points' : 'Take ${} points'}
      </button>
    ) : null
      
    }
  </div>
);


export function Game({ game: { p1, p1hand, p2, p2hand, phase, pegs } = emptyGame, p2mode = false }) {

  const [selectedCards, setSelectedCards] = useState([]);

  useEffect(()=> console.log(phase), [phase]);
  
  return (
    <div className="Game">
      <div className={'hand p1-hand '+(selectedCards.reduce((cl, sc)=> cl+'selected-'+sc+' ', ''))}>
        <Hand cards={p2mode ? p2hand : p1hand} hidden={false} style={defHandStyle}
              onClick={card=> setSelectedCards(prev=> prev.includes(card) ? prev.filter(c=> c !== card) : [...prev, card])} />
      </div>

      <div className='peg'>
        {phase === 'peg' ? (
           <Hand cards={pegs} hidden={false} style={pegHandStyle} onClick={()=>0} />
        ) : <PhaseButton
              phase={phase}
              onClick={()=> console.log('phase', phase)}
              p2mode={p2mode}
              selectedCount={selectedCards.length}
        />}
      </div>

      <div className='hand p2-hand'>
        <Hand cards={p2mode ? p1hand : p2hand} hidden={true} style={defHandStyle} />
      </div>
      
    </div>
  );
}
