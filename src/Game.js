import { useState, useEffect, useCallback, useMemo } from 'react';

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


const cutHandStyle = {
  maxHeight: '100%',
  maxWidth:'12vh',
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
    {phase === 'deals-p1' ? (
       <button disabled={p2mode} onClick={onClick}>
         {p2mode ? 'waiting for p1 to deal' :'Deal!'}
       </button>
    ) : phase === 'deals-p2' ? (
       <button disabled={!p2mode} onClick={onClick}>
         {!p2mode ? 'waiting for p2 to deal' :'Deal!'}
       </button>
       
    ) : phase === 'cut-cribs-p1' ? (
       <button disabled={p2mode} onClick={onClick}>
         {p2mode ? 'waiting for p1 to cut' :'Cut!'}
       </button>
    ) : phase === 'cut-cribs-p2' ? (
       <button disabled={!p2mode} onClick={onClick}>
         {!p2mode ? 'waiting for p1 to cut' :'Cut!'}
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
      
      
    ) : phase === 'p1-scores-p1' ? (
      <button disabled={p2mode} onClick={onClick}>
        {p2mode ? 'waiting for p1 to take ${} points' : 'Take ${} points'}
      </button>
    ) : phase === 'p2-scores-p1' ? (
      <button disabled={!p2mode} onClick={onClick}>
        {!p2mode ? 'waiting for p1 to take ${} points' : 'Take ${} points'}
      </button>
    ) : phase === 'p1-scores-p2' ? (
      <button disabled={p2mode} onClick={onClick}>
        {p2mode ? 'waiting for p1 to take ${} points' : 'Take ${} points'}
      </button>
    ) : phase === 'p2-scores-p2' ? (
      <button disabled={!p2mode} onClick={onClick}>
        {!p2mode ? 'waiting for p1 to take ${} points' : 'Take ${} points'}
      </button>
    ) : null
      
    }
  </div>
);


export function Game({ game = emptyGame, p2mode = false, network={} }) {

  const { p1, p1hand, p1crib, p2, p2hand, p2crib, phase, pegs, cut } = game;

  const finePhase = useMemo(()=>
    phase.includes('peg') ? 'playerToPlay()' + phase :
    phase.includes('cribs') ? (
      !(p1crib + p2crib) ? 'both' :
      !p1crib.length ? 'p1' :
      !p2crib.length ? 'p2' : 'cut'
    ) + '-' + phase :
    phase, [phase, p2crib, p1crib]);
  
  const [selectedCards, setSelectedCards] = useState([]);

  useEffect(()=> console.log(phase), [phase]);

  // here, useCallback -> for the phase button on click
  //   import bound network calls from App
  //   state will propagate back down through props.game

  const { putInCrib, cutTheDeck } = network;

  const phaseClick = useCallback(()=> {
    if( finePhase.includes('cut') ) cutTheDeck();
    else if( phase.includes('crib') ) putInCrib(selectedCards);
    
  }, [phase, game, p2mode, selectedCards, network]);
  
  return (
    <div className="Game">
      <div className={'hand p1-hand '+(selectedCards.reduce((cl, sc)=> cl+'selected-'+sc+' ', ''))}>
        <Hand cards={p2mode ? p2hand : p1hand} hidden={false} style={defHandStyle}
              onClick={card=> setSelectedCards(prev=> prev.includes(card) ? prev.filter(c=> c !== card) : [...prev, card])} />
      </div>

      <div className='peg'>
        {phase.includes('peg') ? (
           <Hand cards={pegs} hidden={false} style={pegHandStyle} onClick={()=>0} />
        ) : <PhaseButton
              phase={finePhase}
              onClick={phaseClick}
              p2mode={p2mode}
              selectedCount={selectedCards.length}
        />}
      </div>

      <div className='hand p2-hand'>
        <Hand cards={p2mode ? p1hand : p2hand} hidden={true} style={defHandStyle} />
      </div>

      {cut ? (
         <div className='cut-container'>
           <Hand cards={[cut]} hidden={false} style={cutHandStyle} />
         </div>
      ) : null}
      
    </div>
  );
}
