export const sameCard = pc=> hc => ((hc.rank === pc.rank) && (hc.suit === pc.suit));

export const whoPegs = game=>{
  // phase says whose crib
  // other player played first
  // back and forth, unless turn can't pay but other can

  let turn = game.phase.substr(-2) === 'p2' ? 'p1' : 'p2';
  let count = 0;
  
  game.pegs.forEach(pc => {
    const nextCount = count + Math.min(10, pc.rank);
    if( nextCount > 31 ) count = Math.min(10, pc.rank);
    else count = nextCount;

    if( game.p1hand.find(sameCard(pc)) ) turn = 'p2';
    if( game.p2hand.find(sameCard(pc)) ) turn = 'p1';

    const turnHand = (turn === 'p2' ? game.p2hand : game.p1hand).filter(hc => !game.pegs.find(sameCard(hc)) );
    const otherHand = (turn === 'p1' ? game.p2hand : game.p1hand).filter(hc => !game.pegs.find(sameCard(hc)) );
    
    if( ( count < 31 ) &&
        !turnHand.find(tc=> (Math.min(10, tc.rank) + count <= 31)) &&
        otherHand.find(tc=> (Math.min(10, tc.rank) + count <= 31))
    ) turn = turn === 'p1' ? 'p2' : 'p1';

    // if neither, it's a go!
  });

  return turn;
}


export const runPtsPerStack = stack => {
  for ( let i = stack.length; i>2; i--)
    if ( stack.filter(c => c.rank)
              .slice(-i)
              .map( c => 1*c.rank )
              .sort((a, b) => (a - b))
              .reduce( (p, c, i, a) => ( p && ( (!i) || ( c - a[i-1] === 1)) ), true) &&
         stack.filter(c => c.card.rank).length > 2 )
      return stack.filter(c => c.card.rank).slice(-i).length;
  
  return 0;
};

export const pegScore = (played, p1hand, p2hand) => {
  const { count, stack } = played.reduce( (p, c, {
    m: m = Math.min(10, c.rank || 0)
  })=> (
    (p.count + m > 31) ?
    ({
      count: m,
      stack: [c],
    }) : ({
      count: p.count + m,
      stack: [...p.stack, c],
    })
    
  ), { count: 0, stack: []});

  const lastCard = stack[stack.length-1];

  // if pair / triple / quad onScoringEvent( lastPlayer, 2 / 6 / 12 )
  
  let pairLength = 0;
  for (let i=stack.length; i-->0;) {
    if ( !('rank' in lastCard) ) break;
    else if ( stack[i].rank === lastCard.rank ) pairLength++;
    else if ( !('rank' in stack[i]) ) {}
    else break;
  }
  
  const pairPts = (pairLength - 1) * pairLength;
  
  // if count is 15, onScoringEvent( lastPlayer, 2 )
  const fifteenPts = lastCard?.rank && (count === 15) ? 2 : 0;
  
  // if last N cards are consecutive onScoringEvent( lastPlayer, N )

  const runPts = lastCard?.rank ? runPtsPerStack(stack) : 0;
  
  // if count === 31 onScoringEvent( lastPlayer, 2 )
  const thirtyOnePts = ( (count === 31) && lastCard.rank) ? 2 : 0;
  
  // if neither player has any cards left to play within 31, 1 pt
  const p1left = p1hand.filter(lc => !played.find(sameCard(lc)))
                       .filter(lc => ((Math.min(10, lc.rank) + count) <= 31));
  
  const p2left = p2hand.filter(lc => !played.find(sameCard(lc)))
                       .filter(lc => ((Math.min(10, lc.rank) + count) <= 31));

  const goPts = !p1left.length && !p2left.length ? 1 : 0;

  const score = pairPts + fifteenPts + runPts + thirtyOnePts + goPts;

  return score;
};


export const randomCard = game=>{
  const cards = [...game.p1hand, ...game.p2hand, ...game.p1crib, ...game.p2crib];
  
  let rank = game.p1hand[0]?.rank, suit = game.p1hand[0]?.suit;
  
  while( cards.find(sameCard({ rank, suit})) || (rank === undefined) ) {
    rank = Math.floor(Math.random()*13) + 1;
    suit = Math.floor(Math.random()*4);
  }

  return { rank, suit };
};

export const dealCards = (howMany=12)=>{
  const cards = [];

  while( cards.length < howMany )
    cards.push( randomCard({ p1hand: cards, p2hand: [], p1crib: [], p2crib: [] }) );

  return {
    p1hand: cards.slice(0,6),
    p2hand: cards.slice(6),
  };
};



// refactor into one big ugly reduce! [scoring fn, ..].reduce

export const scorehand = (hand, cut = {}) => {
  const cards = hand.concat(cut);
  
  let total = 0;

  const dibsPts = hand.filter( ({ rank, suit }) => ((rank === 11) && (suit === cut.suit)) ).length;
  
  const pairPts = cards.reduce( (p, c, i) =>
    p + cards.slice(i + 1).filter( ({ rank }) => (rank === c.rank) ).length * 2, 0);


  const flushPts = (hand.reduce( (p, c) => (( p === c.suit ) ? p : -1), hand[0].suit) > -1) ?
                   cards.filter( ({ suit, rank }) => ((suit === hand[0].suit) && (rank > 0)) ).length : 0;

  
  const runPatterns = cards.sort((a, b) => (a.rank < b.rank) ? -1 : 1)
                           .map( (c, i, arr) => Math.min((arr[i+1] || {rank: NaN}).rank - c.rank, 2) )
                           .filter( n => !isNaN(n) ).join('').split('2')
                           .filter( d => (d.length > 1) );
  
  const runPts = runPatterns.map(runPattern =>
    (
      (runPattern.match(/1/g)||[]).length < 2
    ) ? 0 : (
      (1 + runPattern.match(/1/g).length) * runPattern
        .split('1').reduce( (p, c) => p * (c.length + 1), 1)
    )
  ).reduce( (p, c) => p + c, 0);


  // this filter is for crib scoring, which needs a test case
  const ranks = cards.map( c => Math.min(10, c.rank) ).filter( r => !isNaN(r));

  const fifteenPts =
    Array( Math.pow(2, ranks.length) - 1)
      .fill(1).map( (d, i) => ( Array(ranks.length).join('0')+(i+1).toString(2))
        .slice(-1 * ranks.length).split('') )
      .filter( b =>
        (b.reduce( (p, c, i) => (p + (1 * c) * ranks[i]), 0 ) === 15)
      ).length * 2;

  total += dibsPts;
  total += pairPts;
  total += flushPts;
  total += runPts;
  total += fifteenPts;
  
  return total;
};
