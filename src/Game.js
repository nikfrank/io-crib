import { useState, useEffect, useCallback, useMemo } from 'react';

import './Game.scss';

import { Hand } from 'react-deck-o-cards';

import { sameCard, whoPegs, scorehand } from './crib-util';

const fillTo = (n, hand)=> (
  [...hand, ...(Array(Math.max(0, n-hand.length)).fill({ rank: 0 }) )]
);

const defHandStyle = {
  maxHeight:'29vh',
  minHeight:'29vh',
  
  maxWidth:'86vw',
  padding: 0,
};

const pegHandStyle = {
  maxHeight: '27vh',
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

const PegArrow = ({ game, p2mode })=> {
  const who = useMemo(()=> whoPegs(game), [game]);

  return <div className='peg-arrow'>{(who === 'p2') === p2mode ? '\\/' : '/\\'}</div>;
};

const PhaseButton = ({ phase, onClick, p2mode, handScores={}, selectedCount=0 })=> (
  <div className='PhaseButton'>
    {phase === 'deals-p1' ? (
       <button disabled={p2mode} onClick={onClick}>
         {p2mode ? 'p1 to deal' :'Deal!'}
       </button>
    ) : phase === 'deals-p2' ? (
       <button disabled={!p2mode} onClick={onClick}>
         {!p2mode ? 'p2 to deal' :'Deal!'}
       </button>
       
    ) : phase === 'cut-cribs-p1' ? (
       <button disabled={!p2mode} onClick={onClick}>
         {!p2mode ? 'p2 to cut' :'Cut!'}
       </button>
    ) : phase === 'cut-cribs-p2' ? (
       <button disabled={p2mode} onClick={onClick}>
         {p2mode ? 'p1 to cut' :'Cut!'}
       </button>
       
    ) : phase === 'both-cribs-p1' ? (
       <button disabled={selectedCount !== 2} onClick={onClick}>
         Put cards in {p2mode ? 'p2\'s' : 'my'} crib
       </button>
    ) : phase === 'both-cribs-p2' ? (
       <button disabled={selectedCount !== 2} onClick={onClick}>
         Put cards in {!p2mode ? 'p1\'s' : 'my'} crib
       </button>
       
    ) : phase === 'p1-cribs-p1' ? (
       <button disabled={p2mode || (selectedCount !== 2)} onClick={onClick}>
         {p2mode ? 'p1... put cards in crib' :'Put cards in my crib'}
       </button>
    ) : phase === 'p2-cribs-p1' ? (
       <button disabled={!p2mode || (selectedCount !== 2)} onClick={onClick}>
         {!p2mode ? 'p2... put cards in crib' :'Put cards in p1\'s crib'}
       </button>
    ) : phase === 'p1-cribs-p2' ? (
       <button disabled={p2mode || (selectedCount !== 2)} onClick={onClick}>
         {p2mode ? 'p1... put cards in crib' :'Put cards in p2\'s crib'}
       </button>
    ) : phase === 'p2-cribs-p2' ? (
       <button disabled={!p2mode || (selectedCount !== 2)} onClick={onClick}>
         {!p2mode ? 'p2... put cards to crib' :'Put cards in my crib'}
       </button>
    ) : phase === 'done-peg' ? (
       <button onClick={onClick}>
         Done
       </button>
       
    ) : phase === 'p1-scores-p1' ? (
       <button disabled={p2mode} onClick={onClick}>
         {p2mode ? `p1: ${handScores.p1} + ${handScores.p1crib} pts` :
          `Take ${handScores.p1} + ${handScores.p1crib} pts`}
       </button>
    ) : phase === 'p2-scores-p1' ? (
       <button disabled={!p2mode} onClick={onClick}>
         {!p2mode ? `p2: ${handScores.p2} pts` : `Take ${handScores.p2} pts`}
       </button>
    ) : phase === 'p1-scores-p2' ? (
       <button disabled={p2mode} onClick={onClick}>
         {p2mode ? `p1: ${handScores.p1} pts` : `Take ${handScores.p1} pts`}
       </button>
    ) : phase === 'p2-scores-p2' ? (
       <button disabled={!p2mode} onClick={onClick}>
         {!p2mode ? `p2 to take ${handScores.p2} + ${handScores.p2crib} pts` :
          `Take ${handScores.p2} + ${handScores.p2crib} pts`}
       </button>
    ) : null}
  </div>
);


export function Game({ game = emptyGame, p2mode = false, network={} }) {

  const { p1, p1hand, p1crib, p2, p2hand, p2crib, phase, pegs, cut } = game;

  const finePhase = useMemo(()=>
    phase.includes('peg') ? pegs.length === 8 ? 'peg-over' : phase :
    phase.includes('cribs') ? (
      !(p1crib + p2crib) ? 'both' :
      !p1crib.length ? 'p1' :
      !p2crib.length ? 'p2' : 'cut'
    ) + '-' + phase :
    phase, [phase, p2crib, p1crib]);
  
  const [selectedCards, setSelectedCards] = useState([]);

  const myPegHand = useMemo(()=> (
    (p2mode ? p2hand : p1hand).filter(hc => !pegs.find(sameCard(hc)))
  ), [p2mode, p2hand, p1hand, pegs]);

  const otherPegHand = useMemo(()=> (
    (p2mode ? p1hand : p2hand).filter(hc => !pegs.find(sameCard(hc)))
  ), [p2mode, p2hand, p1hand, pegs]);

  const currentPeg = useMemo(()=> (
    pegs.reduce((s, c)=> (s.count + Math.min(10, c.rank) > 31 ? (
      { ...s, count: Math.min(10, c.rank), stack: [c] }
    ) : (
      { ...s, count: s.count + Math.min(10, c.rank), stack: [...s.stack, c] }
    )), { stack: [], count: 0 })), [pegs]);
  
  
  // here, useCallback -> for the phase button on click
  //   import bound network calls from App
  //   state will propagate back down through props.game

  const { putInCrib, cutTheDeck, playPegCard, takePoints, dealHands, donePeg } = network;

  const phaseClick = useCallback(cardId=> {
    if( finePhase.includes('cut') ) cutTheDeck();
    else if( phase.includes('crib') ){
      putInCrib(selectedCards);
      setSelectedCards([]);
    }
    else if( phase.includes('peg') ){
      if( phase.includes('done') ) donePeg();

      // is it my turn to play a peg card?
      else if(p2mode === (whoPegs(game) === 'p2')){
        const myLeft = game[p2mode ? 'p2hand' : 'p1hand'].filter(c => !pegs.find( sameCard(c) ));
        
        if(
          ( myLeft.find(c => ((Math.min(10, c.rank) + currentPeg.count) <= 31)) ) &&
          ( Math.min(10, myLeft[cardId].rank) + currentPeg.count > 31 )
        ) console.log('not allowed');
        else playPegCard(cardId);
      }
      else console.log('not my turn');
      
    } else if( phase.includes('scores') ) takePoints();
    else if( phase.includes('deal') ) dealHands();
    
  }, [phase, game, p2mode, selectedCards, network, currentPeg]);


  const handScores = useMemo(()=> !phase.includes('scores') ? {} : {
    p1: scorehand(game.p1hand, game.cut),
    p2: scorehand(game.p2hand, game.cut),
    [phase.substr(-2) + 'crib']: scorehand([...game.p1crib, ...game.p2crib], game.cut),
  }, [phase, game]);


  return (
    <div className="Game">
      <div className={'hand my-hand '+(selectedCards.reduce((cl, sc)=> cl+'selected-'+sc+' ', ''))}>
        {!phase.includes('peg') ? (
           <Hand cards={p2mode ? p2hand : p1hand}
                 hidden={phase.includes('scores') && ((p2mode && (phase.substr(0, 2) === 'p1')) ||
                                                      (!p2mode && (phase.substr(0, 2) === 'p2')))}
                 style={defHandStyle}
                 onClick={card=> setSelectedCards(prv=> prv.includes(card) ? prv.filter(c=> c !== card) : [...prv, card])} />
        ) : (
           <>
             <Hand cards={fillTo(4, myPegHand)}
                   hidden={false} style={defHandStyle}
                   onClick={phaseClick} />
             <PegArrow game={game} p2mode={p2mode} />
           </>
        )}
      </div>

      <div className='peg'>
        {phase.includes('peg') ? (
           <div className='peg-container hand'>
             <Hand cards={fillTo(6, currentPeg.stack)}
                   hidden={false} style={pegHandStyle} onClick={()=>0} />
             <div className='peg-total'>{currentPeg.count}</div>
             {
               phase.includes('done') ? <PhaseButton phase='done-peg' onClick={donePeg} /> : null
             }
           </div>
        ) : <PhaseButton
              phase={finePhase}
              onClick={phaseClick}
              p2mode={p2mode}
              selectedCount={selectedCards.length}
              handScores={handScores}
        />}
        {
          phase.includes('scores') ? (
            <Hand cards={[...game.p1crib, ...game.p2crib]}
                  hidden={phase.substr(0, 2) !== phase.substr(-2)}
                  style={pegHandStyle} onClick={()=>0}/>
          ): null
        }
      </div>

      <div className='hand other-hand'>
        <Hand cards={phase.includes('peg') ? fillTo(4, otherPegHand) : p2mode ? p1hand : p2hand}
              hidden={!(phase.includes('scores') && ((p2mode && (phase.substr(0, 2) === 'p1')) ||
                                                     (!p2mode && (phase.substr(0, 2) === 'p2'))))}
              style={defHandStyle} />
      </div>

      {cut ? (
         <div className='cut-container'>
           <Hand cards={[cut]} hidden={false} style={cutHandStyle} />
         </div>
      ) : null}
      
    </div>
  );
}
