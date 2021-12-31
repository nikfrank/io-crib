export const whoPegs = game=>{
  // phase says whose crib
  // other player played first
  // back and forth, unless turn can't pay but other can
}


export const runPtsPerStack = stack => {
  for ( let i = stack.length; i>2; i--)
    if ( stack.filter(c => c.card.rank)
              .slice(-i)
              .map( c => 1*c.card.rank )
              .sort((a, b) => (a - b))
              .reduce( (p, c, i, a) => ( p && ( (!i) || ( c - a[i-1] === 1)) ), true) &&
         stack.filter(c => c.card.rank).length > 2 )
      return stack.filter(c => c.card.rank).slice(-i).length;
  
  return 0;
};

export const pegScore = (played) => {
  const { count, stack } = played.reduce( (p, c, {
    m: m = Math.min(10, c.card.rank||0)
  })=> (
    (p.count + m > 31) ?
    ({
      count: m,
      stack: [c],
    }) : ({
      count: p.count + m,
      stack: p.stack.concat(c),
    })
    
  ), { count: 0, stack: []});

  const lastCard = stack[stack.length-1];

  // if pair / triple / quad onScoringEvent( lastPlayer, 2 / 6 / 12 )
  
  let pairLength = 0;
  for (let i=stack.length; i-->0;) {
    if ( !('rank' in lastCard.card) ) break;
    else if ( stack[i].card.rank === lastCard.card.rank ) pairLength++;
    else if ( !('rank' in stack[i].card) ) {}
    else break;
  }
  
  const pairPts = (pairLength - 1) * pairLength;
  
  // if count is 15, onScoringEvent( lastPlayer, 2 )
  const fifteenPts = ((lastCard||{}).card||{}).rank ? ((count === 15) ? 2 : 0) : 0;
  
  // if last N cards are consecutive onScoringEvent( lastPlayer, N )

  const runPts = ((lastCard||{}).card||{}).rank ? runPtsPerStack(stack) : 0;
  
  // if count === 31 onScoringEvent( lastPlayer, 2 )
  const thirtyOnePts = ( (count === 31) && (lastCard.card.rank)) ? 2 : 0;
  
  // if both players passed, the later one gets the point
  const secondLastCard = stack[stack.length-2];
  const goPts = (!lastCard || !secondLastCard || count === 31) ? 0 :
                1*( !('rank' in lastCard.card || 'rank' in secondLastCard.card ) );

  const score = pairPts + fifteenPts + runPts + thirtyOnePts + goPts;
  const player = (lastCard||{}).player;

  return { score, player, count, stack };
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
