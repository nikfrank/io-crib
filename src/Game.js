import { useState } from 'react';

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

export function Game({ game: { p1, p1hand, p2, p2hand } = { p1: '', p2: '' } }) {

  const [selectedCards, setSelectedCards] = useState([]);

  const [playedCards, setPlayedCards] = useState([ {rank:3, suit: 3} ]);
  
  return (
    <div className="Game">
      <div className={'hand p1-hand '+(selectedCards.reduce((cl, sc)=> cl+'selected-'+sc+' ', ''))}>
        <Hand cards={p1hand} hidden={false} style={defHandStyle}
              onClick={card=> setSelectedCards(prev=> prev.includes(card) ? prev.filter(c=> c !== card) : [...prev, card])} />
      </div>

      <div className='peg'>
        <Hand cards={playedCards} hidden={false} style={pegHandStyle} onClick={()=>0} />
      </div>

      <div className='hand p2-hand'>
        <Hand cards={p2hand} hidden={true} style={defHandStyle} />
      </div>
      
    </div>
  );
}
