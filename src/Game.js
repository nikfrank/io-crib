import { useState } from 'react';

import './Game.scss';

import { Hand } from 'react-deck-o-cards';

const defHandStyle = {
  maxHeight:'34vh',
  minHeight:'34vh',
  
  maxWidth:'100vw',
  padding: 0,
};

export function Game({ game: { p1: { hand: p1hand }, p2: { hand: p2hand } } }) {

  const [selectedCards, setSelectedCards] = useState([]);
  
  return (
    <div className="Game">
      <div className={'hand p1-hand '+(selectedCards.reduce((cl, sc)=> cl+'selected-'+sc+' ', ''))}>
        <Hand cards={p1hand} hidden={false} style={defHandStyle}
              onClick={card=> setSelectedCards(prev=> prev.includes(card) ? prev.filter(c=> c !== card) : [...prev, card])} />
      </div>

      <div className='hand p2-hand'>
        <Hand cards={p2hand} hidden={true} style={defHandStyle} />
      </div>
      
    </div>
  );
}
