/* FlipArena — Arcade Zone expansion (75 new modes → 100 total).
   Pure data + resolver module. Each mode is a distinct concept with its own
   proof-derived rule. `control` drives the small player input:
     none    → no selection
     select  → pick one of `options`
     number  → pick an integer between min and max                                */

const SUITS=['♠','♥','♦','♣'];
const FLOWERS=['🌹','🌻','🌷','🌼','🌸','🌺'];
const FRUITS=['🍒','🍋','🍇','🍉','🍓'];
const CANDIES=['🍬','🍭','🍩','🍪'];
const GEMS=['💎','💠','🔷','🔶','🟢'];
const NOTES=['C','D','E','F','G','A','B'];

function d(n){return n%6+1;}
function c(n){return n%13+2;}
function cn(n){const r=c(n);return r<=10?String(r):['J','Q','K','A'][r-11];}
function s(n){return SUITS[n%4];}
function b2(n){return (n>>1)&1;}
function one(n){return n&1;}

const _EXT_ARCADE2=[
 {id:'coinflipx',icon:'🪙',title:'Coin Flip Express',stake:50,group:'Coin & Chance',control:'select',options:['HEADS','TAILS'],desc:'One proof flip decides. Pick the side you think lands up.',payout:'Match 1.9× · miss 0×.'},
 {id:'coinrun',icon:'🎪',title:'Coin Run',stake:50,group:'Coin & Chance',control:'number',min:0,max:5,desc:'Predict how many of five proof flips land HEADS.',payout:'Exact 5× · ±1 1.5× · else 0×.'},
 {id:'doubleornothing',icon:'🪙',title:'Double or Nothing',stake:50,group:'Coin & Chance',control:'select',options:['HEADS','TAILS'],desc:'Two fair flips are revealed. Your side must appear to cash out.',payout:'Both flips your side 3× · one 1.2× · none 0×.'},
 {id:'flipcountdown',icon:'⏱️',title:'Flip Countdown',stake:50,group:'Coin & Chance',control:'select',options:['HEADS','TAILS'],desc:'Three proof flips count your side.',payout:'3 matches 4× · 2 matches 2× · else 0×.'},
 {id:'coinstack',icon:'🪙',title:'Coin Stack',stake:50,group:'Coin & Chance',control:'select',options:['HEADS','TAILS'],desc:'Choose a side; four flips must all match your pick to bank the top stack.',payout:'All four match 6× · 3 match 2× · else 0×.'},
 {id:'luckypenny',icon:'🍀',title:'Lucky Penny',stake:50,group:'Coin & Chance',control:'select',options:['1','2','3','4','5','6','7','8','9'],desc:'Nine tiles hide one lucky penny. Pick a tile.',payout:'Penny tile 3× · adjacent 1.2× · else 0×.'},
 {id:'coinfall',icon:'⬇️',title:'Coin Fall',stake:50,group:'Coin & Chance',control:'select',options:['1','2','3','4'],desc:'Four proof coins fall into one of four columns. Pick your column.',payout:'1 coin 0× · 2 coins 2.5× · 3+ coins 7×.'},
 {id:'coinmachine',icon:'🎰',title:'Coin Machine',stake:50,group:'Coin & Chance',control:'select',options:['1','2','3','4','5','6','7','8','9'],desc:'A proof number chooses the winning slot on a nine-slot machine.',payout:'Exact slot 6× · adjacent 1.5×.'},
 {id:'flipcycle',icon:'🔄',title:'Flip Cycle',stake:50,group:'Coin & Chance',control:'select',options:['HEADS','TAILS'],desc:'Six fair flips run a cycle; four or more of your side banks the payout.',payout:'4+ matches 2× · 5+ matches 4× · else 0×.'},
 {id:'loopycoin',icon:'🌀',title:'Loopy Coin',stake:50,group:'Coin & Chance',control:'select',options:['4 HEADS','OTHER'],desc:'Eight flips land; bet on whether it lands exactly four HEADS or not.',payout:'Exactly four 3× · otherwise 1.5×.'},
 {id:'dicegauntlet',icon:'🎲',title:'Dice Gauntlet',stake:50,group:'Dice & Numbers',control:'number',min:2,max:12,desc:'Predict the total of two proof dice.',payout:'Exact 8× · ±1 2× · else 0×.'},
 {id:'snakeeyes',icon:'🐍',title:'Snake Eyes',stake:50,group:'Dice & Numbers',control:'select',options:['1','2','3','4','5','6'],desc:'Pick a die face. Two proof dice roll.',payout:'Both dice match 30× · one matches 3× · none 0×.'},
 {id:'dicebattle',icon:'⚔️',title:'Dice Battle',stake:50,group:'Dice & Numbers',control:'select',options:['HIGH','LOW','SEVEN'],desc:'Two dice roll; bet HIGH (8–12), LOW (2–6) or the exact SEVEN.',payout:'HIGH/LOW 1.8× · SEVEN 10×.'},
 {id:'ladoroll',icon:'🐢',title:'Ludo Roll',stake:50,group:'Dice & Numbers',control:'select',options:['1','2','3','4','5','6'],desc:'Four proof dice roll; choose the face to chase.',payout:'4 matches 20× · 3 matches 6× · 2 matches 2×.'},
 {id:'yatzy',icon:'🖐️',title:'Yahtzee Lite',stake:50,group:'Dice & Numbers',control:'none',desc:'Three proof dice roll; triple is the jackpot outcome.',payout:'Triple 8× · pair 2× · else 0×.'},
 {id:'dicevault',icon:'🔐',title:'Dice Vault',stake:50,group:'Dice & Numbers',control:'number',min:2,max:12,desc:'Two dice roll to a locked vault combination.',payout:'Exact 5× · ±1 2× · else 0×.'},
 {id:'dicetower',icon:'🗼',title:'Dice Tower',stake:50,group:'Dice & Numbers',control:'number',min:4,max:24,desc:'Four dice fall through a tower; predict the total.',payout:'Exact 6× · ±2 1.5×.'},
 {id:'pyramiddice',icon:'🔺',title:'Pyramid Dice',stake:50,group:'Dice & Numbers',control:'select',options:['1','2','3','4','5','6'],desc:'Three dice must all be at least your chosen face to climb the pyramid.',payout:'All 3+ face 6× · 2 dice 2× · else 0×.'},
 {id:'cardmatch',icon:'🃏',title:'Card Match',stake:50,group:'Cards & Decks',control:'select',options:['2','3','4','5','6','7','8','9','10','J','Q','K','A'],desc:'Three proof cards deal; pick a rank to match.',payout:'3 matches 6× · 2 matches 2.5× · 1 match 1.2×.'},
 {id:'kingscourt',icon:'👑',title:"King's Court",stake:50,group:'Cards & Decks',control:'select',options:SUITS,desc:'Six proof cards are dealt. Pick a suit to count.',payout:'3+ 8× · 2 2× · 1 1× (stake back) · 0 0×.'},
 {id:'cardpoker',icon:'♠️',title:'Poker Draw',stake:50,group:'Cards & Decks',control:'none',desc:'Five proof cards form a poker hand; the hand itself is the result.',payout:'Pair 1.5× · two pair 2.5× · trips 6× · straight 12× · flush 30×.'},
 {id:'solitaire',icon:'🂠',title:'Solitaire Sprint',stake:50,group:'Cards & Decks',control:'select',options:['RED','BLACK'],desc:'Five proof cards; pick the majority colour.',payout:'Majority 2× · tie 1× (push).'},
 {id:'cardcount',icon:'🔢',title:'Card Count',stake:50,group:'Cards & Decks',control:'select',options:['J','Q','K','A','2','3','4','5','6','7','8','9','10'],desc:'Eight cards deal; pick a rank and count it.',payout:'3+ 8× · 2 2.5× · 1 1.2×.'},
 {id:'card21blitz',icon:'🃏',title:'Card-21 Blitz',stake:50,group:'Cards & Decks',control:'none',desc:'Three cards deal across the 21 line; the closer you get the bigger the multiplier.',payout:'Exactly 21 10× · 19–20 4× · 15–18 2× · bust 0×.'},
 {id:'highcardplus',icon:'📈',title:'High Card Plus',stake:50,group:'Cards & Decks',control:'select',options:['HIGH','LOW'],desc:'Four cards total (8–56); bet over or under 27.',payout:'Correct 1.9× · exactly 27 push 1×.'},
 {id:'numbercrush',icon:'💥',title:'Number Crush',stake:50,group:'Dice & Numbers',control:'number',min:0,max:255,desc:'One proof byte is revealed; predict it.',payout:'Exact 20× · ±5 5× · ±20 2× · ±50 1.2×.'},
 {id:'primerush',icon:'🔢',title:'Prime Rush',stake:50,group:'Dice & Numbers',control:'number',min:0,max:5,desc:'Five proof numbers are checked for primality; predict the count.',payout:'Exact 4× · ±1 1.6×.'},
 {id:'fibspin',icon:'🌀',title:'Fibonacci Spin',stake:50,group:'Dice & Numbers',control:'select',options:['1','2','3','5','8','13','21','34','55','89'],desc:'A proof number is measured against the Fibonacci ladder; pick the rung.',payout:'Exact rung 7× · adjacent rung 1.8×.'},
 {id:'egyptianmath',icon:'🏺',title:'Egyptian Math',stake:50,group:'Dice & Numbers',control:'number',min:0,max:6,desc:'Two proof bytes sum; predict the remainder modulo 7.',payout:'Exact 5× · ±1 1.5×.'},
 {id:'romanroll',icon:'🏛️',title:'Roman Roll',stake:50,group:'Dice & Numbers',control:'select',options:['I','V','X','L','C','D','M'],desc:'A proof byte rolls a Roman numeral; pick the matching symbol.',payout:'Match 5× · adjacent numeral 1.4×.'},
 {id:'binaryrain',icon:'🌧️',title:'Binary Rain',stake:50,group:'Bits & Patterns',control:'number',min:0,max:8,desc:'Eight proof bytes fall; predict how many have an odd low bit.',payout:'Exact 3× · ±1 1.4×.'},
 {id:'puzzlepattern',icon:'🧩',title:'Puzzle Pattern',stake:50,group:'Bits & Patterns',control:'select',options:['HH','HT','TH','TT'],desc:'A two-symbol proof code is revealed; pick the closest pattern.',payout:'Exact 10× · one difference 2.5× · two differences 1.2×.'},
 {id:'gridpath',icon:'🧭',title:'Grid Path',stake:50,group:'Bits & Patterns',control:'select',options:['NW','NE','SW','SE'],desc:'Four proof moves walk a 3×3 grid; predict which corner you end in.',payout:'Predicted corner 6× · other 0×.'},
 {id:'gemmatch',icon:'💎',title:'Gem Match',stake:50,group:'Candy & Gems',control:'select',options:GEMS,desc:'Six proof gems fall; pick a gem type to count.',payout:'3+ 4× · 2 1.8× · 1 1×.'},
 {id:'candycrush',icon:'🍬',title:'Candy Line',stake:50,group:'Candy & Gems',control:'select',options:CANDIES,desc:'Five proof candies drop; pick a shape to match.',payout:'3+ 5× · 2 1.5× · 1 1×.'},
 {id:'fruitsalad',icon:'🥗',title:'Fruit Salad',stake:50,group:'Candy & Gems',control:'select',options:FRUITS,desc:'Five proof fruits are drawn; pick one to count.',payout:'3+ 4.5× · 2 1.8× · 1 1×.'},
 {id:'treasuremaze',icon:'🗺️',title:'Treasure Maze',stake:50,group:'Adventure & Quest',control:'select',options:['1','2','3','4','5'],desc:'Five maze doors; one holds treasure and two hold silver.',payout:'Treasure 6× · silver 2× · empty 0×.'},
 {id:'minehelper',icon:'⛏️',title:'Mine Helper',stake:50,group:'Adventure & Quest',control:'select',options:['1','2','3','4','5','6','7','8','9'],desc:'Nine tiles: five diamonds, four mines. Pick a tile.',payout:'Diamond 2.4× · mine 0×.'},
 {id:'goalblitz',icon:'⚽',title:'Goal Blitz',stake:50,group:'Sports & Races',control:'select',options:['LEFT','CENTER','RIGHT'],desc:'Five penalty kicks face a proof-derived keeper direction.',payout:'5 goals 10× · 4 goals 5× · 3 goals 3× · else 0×.'},
 {id:'freethrow',icon:'🏀',title:'Free Throw',stake:50,group:'Sports & Races',control:'number',min:0,max:10,desc:'Ten proof free throws shoot; predict how many go in.',payout:'Exact 7× · ±2 1.6×.'},
 {id:'bowling',icon:'🎳',title:'Bowling Strike',stake:50,group:'Sports & Races',control:'select',options:['6','7','8','9','10'],desc:'One proof roll knocks pins down; predict the count.',payout:'10 pins 12× · 8–9 3× · 6–7 1.5×.'},
 {id:'horserace',icon:'🐎',title:'Horse Race',stake:50,group:'Sports & Races',control:'select',options:['1','2','3','4','5'],desc:'Five proof horses race; pick your horse\'s finish position.',payout:'1st 8× · 2nd 3× · 3rd 1.5×.'},
 {id:'sprintdash',icon:'🏃',title:'Sprint Dash',stake:50,group:'Sports & Races',control:'select',options:['1','2','3','4'],desc:'Four lanes race; pick the winning lane (1st or 2nd).',payout:'1st 6× · 2nd 2.5×.'},
 {id:'butterfly',icon:'🦋',title:'Butterfly Catch',stake:50,group:'Nature & Garden',control:'select',options:['1','2','3','4','5','6'],desc:'Six proof butterflies land on six flowers; predict the winning flower.',payout:'Winner 4× · adjacent 1.5×.'},
 {id:'beehive',icon:'🐝',title:'Bee Hive',stake:50,group:'Nature & Garden',control:'select',options:['QUEEN','WORKER','DRONE'],desc:'Five bees emerge from a hive; pick the majority type.',payout:'Majority 3× · tie 1×.'},
 {id:'flowerpower',icon:'🌼',title:'Flower Power',stake:50,group:'Nature & Garden',control:'number',min:1,max:7,desc:'A proof byte reveals a flower and a petal count; predict the petals.',payout:'Exact 7× · ±1 1.8×.'},
 {id:'mushroomhunt',icon:'🍄',title:'Mushroom Hunt',stake:50,group:'Nature & Garden',control:'select',options:['RED','BLUE','GREEN'],desc:'Three mushrooms grow; pick the colour that appears most.',payout:'3 of a kind 8× · 2 of a kind 2× · one each 1×.'},
 {id:'asteroid',icon:'☄️',title:'Asteroid Dodge',stake:50,group:'Space & Sci-Fi',control:'select',options:['SHIELD','LASER'],desc:'Six asteroids classify by parity; your defence must survive four or more.',payout:'4+ survive 2.2× · 3 survive 1× · else 0×.'},
 {id:'moonlanding',icon:'🌕',title:'Moon Landing',stake:50,group:'Space & Sci-Fi',control:'select',options:['CRATER','SMOOTH','ROCKY'],desc:'One proof byte lands the module on one of three lunar surfaces; pick it.',payout:'Match 5× · adjacent 2×.'},
 {id:'starcollector',icon:'⭐',title:'Star Collector',stake:50,group:'Space & Sci-Fi',control:'number',min:0,max:9,desc:'Nine celestial cells reveal stars; predict how many stars appear.',payout:'Exact 5× · ±1 1.8×.'},
 {id:'rocketfuel',icon:'🚀',title:'Rocket Fuel',stake:50,group:'Space & Sci-Fi',control:'number',min:0,max:100,desc:'One proof fuel gauge lands 0–100; predict it.',payout:'Exact 12× · ±3 3× · ±10 1.5×.'},
 {id:'beatdrop',icon:'🎵',title:'Beat Drop',stake:50,group:'Music & Stage',control:'select',options:NOTES,desc:'Four proof notes play; pick a note to count.',payout:'3+ 6× · 2 2× · 1 1.2×.'},
 {id:'djdeck',icon:'🎧',title:'DJ Deck',stake:50,group:'Music & Stage',control:'select',options:['1','2','3','4','5','6','7','8'],desc:'Eight proof tracks spin on a deck; pick the winning track.',payout:'Exact 5× · adjacent 1.5×.'},
 {id:'karaoke',icon:'🎤',title:'Karaoke Key',stake:50,group:'Music & Stage',control:'select',options:['HIGH','MID','LOW'],desc:'A proof byte sets the vocal key; pick the band it falls in.',payout:'Match 2× · tie at band edge 1×.'},
 {id:'crystalball',icon:'🔮',title:'Crystal Ball',stake:50,group:'Mystery & Magic',control:'number',min:1,max:10,desc:'The oracle reveals a number 1–10; predict it.',payout:'Exact 8× · ±1 2×.'},
 {id:'voodoodice',icon:'🕯️',title:'Voodoo Dice',stake:50,group:'Mystery & Magic',control:'select',options:['CURSED','BLESSED'],desc:'Three dice roll; bet the spirit side decides the sum.',payout:'Cursed sum ≤9 · blessed sum ≥12 · 10–11 push 1×.'},
 {id:'magichat',icon:'🎩',title:'Magic Hat',stake:50,group:'Mystery & Magic',control:'select',options:['1','2','3','4','5','6'],desc:'Six rabbits race out of a hat; pick the one that appears.',payout:'Exact 6× · adjacent 1.5×.'},
 {id:'fortuneteller',icon:'🔭',title:'Fortune Teller',stake:50,group:'Mystery & Magic',control:'select',options:['1','2','3','4','5','6','7','8'],desc:'Eight fate cards are drawn; pick your fortune card.',payout:'Exact 6× · adjacent 2×.'},
 {id:'zodiacclock',icon:'🕐',title:'Zodiac Clock',stake:50,group:'Mystery & Magic',control:'select',options:['1','2','3','4','5','6','7','8','9','10','11','12'],desc:'The zodiac clock strikes one hour; predict it.',payout:'Exact 6× · ±1 2×.'},
 {id:'nightsky',icon:'🌌',title:'Night Sky',stake:50,group:'Space & Sci-Fi',control:'select',options:['ORION','DRACO','LYRA','CYGNUS','AQUILA','CASSIOPEIA','PEGASUS','ANDROMEDA'],desc:'Eight constellations light up one at a time; pick the one that glows.',payout:'Match 5× · adjacent 1.8×.'},
 {id:'coffeebreak',icon:'☕',title:'Coffee Break',stake:50,group:'Daily & Life',control:'select',options:['1','2','3','4'],desc:'Four cups hide one gold bean and a silver bean.',payout:'Gold 4× · silver 1.5× · empty 0×.'},
 {id:'teatime',icon:'🍵',title:'Tea Time',stake:50,group:'Daily & Life',control:'select',options:['GREEN','BLACK','HERBAL'],desc:'Three teas are poured; pick the one the proof picks.',payout:'Match 3.5× · other 0×.'},
 {id:'rainbowarcade',icon:'🌈',title:'Rainbow Arcade',stake:50,group:'Daily & Life',control:'select',options:['RED','ORANGE','YELLOW','GREEN','BLUE','INDIGO','VIOLET'],desc:'Seven colours spin; predict the rainbow landing.',payout:'Exact 7× · adjacent 1.6×.'},
 {id:'luckyclover',icon:'🍀',title:'Lucky Clover',stake:50,group:'Daily & Life',control:'select',options:['4-LEAF','3-LEAF'],desc:'Five clovers grow; count four-leaf luck.',payout:'3+ four-leaf 6× · 2 four-leaf 2× · 1 four-leaf 1.2×.'},
 {id:'gemcrush',icon:'🟦',title:'Gem Rush',stake:50,group:'Candy & Gems',control:'select',options:GEMS,desc:'Six proof gems fall into a hopper; pick one to count.',payout:'3+ 5× · 2 1.6× · 1 1×.'},
 {id:'treasurechest',icon:'🧰',title:'Treasure Chest',stake:50,group:'Adventure & Quest',control:'select',options:['1','2','3','4','5','6'],desc:'Six chests: one gold, two silver, three empty.',payout:'Gold 5× · silver 2× · empty 0×.'},
 {id:'seafarers',icon:'⛵',title:'Sea Farers',stake:50,group:'Sports & Races',control:'select',options:['1','2','3','4','5'],desc:'Five sailboats race; predict their finish position.',payout:'1st 7× · 2nd 2.5× · 3rd 1.4×.'},
 {id:'icerace',icon:'🧊',title:'Ice Race',stake:50,group:'Sports & Races',control:'select',options:['1','2','3','4'],desc:'Four skaters dash across an ice rink; pick a finish position.',payout:'1st 6× · 2nd 2.2×.'},
 {id:'volcano',icon:'🌋',title:'Volcano Watch',stake:50,group:'Nature & Garden',control:'select',options:['ERUPT','QUIET'],desc:'Five dice measure seismic energy; high energy erupts.',payout:'ERUPT ≥18 3× · QUIET ≤12 3× · middle 0×.'},
 {id:'treasureisland',icon:'🏝️',title:'Treasure Island',stake:50,group:'Adventure & Quest',control:'select',options:['1','2','3','4','5','6','7','8','9'],desc:'An X marks one of nine map squares; pick it.',payout:'X square 5× · adjacent 2×.'},
 {id:'clocktower',icon:'🕰️',title:'Clock Tower',stake:50,group:'Daily & Life',control:'select',options:['1','2','3','4','5','6','7','8','9','10','11','12'],desc:'The tower chimes a proof hour; predict it.',payout:'Exact 6× · ±1 2×.'},
 {id:'runewheel',icon:'ᚱ',title:'Rune Wheel',stake:50,group:'Mystery & Magic',control:'select',options:['1','2','3','4','5','6','7','8'],desc:'Eight runes spin on a wheel; pick the rune it stops on.',payout:'Exact 6× · adjacent 1.6×.'},
 {id:'spellbook',icon:'📖',title:'Spell Book',stake:50,group:'Mystery & Magic',control:'select',options:['FIREBALL','HEAL','SHIELD','CHARM'],desc:'Four spells have different success odds; pick one and let the proof cast it.',payout:'Fireball 0.35 success 4× · Heal 0.45 3.2× · Shield 0.55 2.5× · Charm 0.65 2×.'},
 {id:'weatherwatch',icon:'🌦️',title:'Weather Watch',stake:50,group:'Daily & Life',control:'select',options:['SUN','RAIN','SNOW','WIND'],desc:'One proof reads a four-way weather forecast; pick the call it makes.',payout:'Match 4× · no match 0×.'},
 {id:'dragonbridge',icon:'🐉',title:'Dragon Bridge',stake:50,group:'Adventure & Quest',control:'select',options:['SAFE','FIRE'],desc:'Three flames guard the bridge; bet on how many light up.',payout:'0 flames 3× · 1 flame 1.5× · 2+ flames 0×.'}
];

export const EXT_ARCADE2=Object.fromEntries(_EXT_ARCADE2.map(x=>[x.id,x]));

export function arcadeOptions(key){
  const g=EXT_ARCADE2[key];
  if(!g)return [];
  if(g.control==='select')return g.options;
  if(g.control==='number')return Array.from({length:(g.max-g.min)+1},(_,i)=>String(g.min+i));
  return ['AUTO'];
}
export function arcadeDefaultPick(key){const o=arcadeOptions(key);return o[Math.floor(o.length/2)];}

export function arcadeOutcome(key,choice,bytes){
  const b=i=>bytes[i]||0;
  const arr=n=>Array.from({length:n},(_,i)=>b(i));
  const cnt=(vals,target)=>vals.filter(x=>x===target).length;
  const x=+choice;
  switch(key){
    case 'coinflipx': {const r=b(0)%2?'TAILS':'HEADS';return {mult:r===choice?1.9:0,detail:`flip ${r}`};}
    case 'coinrun': {const h=arr(5).filter(v=>v%2===0).length;return {mult:h===x?5:Math.abs(h-x)===1?1.5:0,detail:`${h} HEADS in 5`};}
    case 'doubleornothing': {const f=arr(2).map(v=>v%2?'TAILS':'HEADS');const m=cnt(f,choice);return {mult:m===2?3:m===1?1.2:0,detail:`${f.join(' ')} · ${m} match`};}
    case 'flipcountdown': {const f=arr(3).map(v=>v%2?'TAILS':'HEADS');const m=cnt(f,choice);return {mult:m===3?4:m===2?2:0,detail:`${f.join(' ')} · ${m}/3`};}
    case 'coinstack': {const f=arr(4).map(v=>v%2?'TAILS':'HEADS');const m=cnt(f,choice);return {mult:m===4?6:m===3?2:0,detail:`${f.join(' ')} · ${m}/4`};}
    case 'luckypenny': {const win=b(0)%9+1;return {mult:x===win?3:Math.abs(x-win)===1?1.2:0,detail:`lucky penny tile ${win}`};}
    case 'coinfall': {const col=b(0)%4+1,n=arr(5).filter(v=>v%4+1===col).length;return {mult:n>=3?7:n===2?2.5:0,detail:`column ${col} caught ${n} coins`};}
    case 'coinmachine': {const slot=b(0)%9+1;return {mult:x===slot?6:Math.abs(x-slot)===1?1.5:0,detail:`machine stopped on ${slot}`};}
    case 'flipcycle': {const f=arr(6).map(v=>v%2?'TAILS':'HEADS');const m=cnt(f,choice);return {mult:m>=5?4:m===4?2:0,detail:`${m}/6 ${choice}`};}
    case 'loopycoin': {const h=arr(8).filter(v=>v%2===0).length;const exact=h===4;return {mult:exact=== (choice==='4 HEADS')?(exact?3:1.5):0,detail:`${h} HEADS of 8`};}
    case 'dicegauntlet': {const t=d(b(0))+d(b(1));const dd=Math.abs(x-t);return {mult:dd===0?8:dd===1?2:0,detail:`dice ${d(b(0))}+${d(b(1))}=${t}`};}
    case 'snakeeyes': {const a=d(b(0)),c2=d(b(1));return {mult:a===x&&c2===x?30:(a===x||c2===x)?3:0,detail:`${a} + ${c2}`};}
    case 'dicebattle': {const t=d(b(0))+d(b(1));const s=t===7?'SEVEN':t>=8?'HIGH':'LOW';return {mult:s===choice?(s==='SEVEN'?10:1.8):0,detail:`sum ${t} · ${s}`};}
    case 'ladoroll': {const f=arr(4).map(d);const m=cnt(f,x);return {mult:m===4?20:m===3?6:m===2?2:0,detail:`${f.join('-')} · ${m} matches`};}
    case 'yatzy': {const f=arr(3).map(d);const triple=f[0]===f[1]&&f[1]===f[2],pair=f[0]===f[1]||f[1]===f[2]||f[0]===f[2];return {mult:triple?8:pair?2:0,detail:`${f.join('-')}`};}
    case 'dicevault': {const t=d(b(0))+d(b(1));const dd=Math.abs(x-t);return {mult:dd===0?5:dd===1?2:0,detail:`combination ${t}`};}
    case 'dicetower': {const f=arr(4).map(d);const t=f.reduce((a,v)=>a+v,0);const dd=Math.abs(x-t);return {mult:dd===0?6:dd<=2?1.5:0,detail:`${f.join('+')}=${t}`};}
    case 'pyramiddice': {const f=arr(3).map(d);const m=f.filter(v=>v>=x).length;return {mult:m===3?6:m===2?2:0,detail:`${f.join('-')} · ${m} at least ${x}`};}
    case 'cardmatch': {const f=arr(3).map(cn);const m=cnt(f,choice);return {mult:m===3?6:m===2?2.5:m===1?1.2:0,detail:`${f.join(' ')} · ${m} matches`};}
    case 'kingscourt': {const f=arr(6).map(s);const m=cnt(f,choice);return {mult:m>=3?8:m===2?2:m===1?1:0,detail:`${f.join(' ')} · ${m} ${choice}`};}
    case 'cardpoker': {const ranks=arr(5).map(c).sort((a,b)=>b-a),suits=arr(5).map(s),c0={};ranks.forEach(r=>c0[r]=(c0[r]||0)+1);const g=Object.values(c0).sort((a,b)=>b-a),flush=new Set(suits).size===1,uniq=[...new Set(ranks)].sort((a,b)=>b-a);if(uniq[0]===14)uniq.push(1);let st=0;for(let i=0;i<=uniq.length-5;i++)if(uniq[i]-uniq[i+4]===4){st=1;break;}const mult=flush&&st?30:g[0]===3?6:g[0]===2&&g[1]===2?2.5:g[0]===2?1.5:0;const name=flush&&st?'FLUSH STRAIGHT':g[0]===3?'TRIPS':g[0]===2&&g[1]===2?'TWO PAIR':g[0]===2?'PAIR':'HIGH CARD';return {mult,detail:`${ranks.map(cn).join(' ')} · ${name}`};}
    case 'solitaire': {const f=arr(5).map(s);const red=cnt(f,'♥')+cnt(f,'♦'),black=5-red;const r=red===black?'TIE':red>black?'RED':'BLACK';return {mult:r==='TIE'?1:r===choice?2:0,detail:`${f.join(' ')} · ${r} majority`};}
    case 'cardcount': {const f=arr(8).map(cn);const m=cnt(f,choice);return {mult:m>=3?8:m===2?2.5:m===1?1.2:0,detail:`${m} × ${choice} in 8 cards`};}
    case 'card21blitz': {const face=i=>{const r=c(b(i));return r===14?11:r>=11?10:r;};const t=face(0)+face(1)+face(2);const mult=t===21?10:t>=19?4:t>=15?2:0;return {mult,detail:`cards total ${t} · ${t>21?'BUST':t===21?'21!':''}`};}
    case 'highcardplus': {const t=arr(4).map(c).reduce((a,v)=>a+v,0);const s=t>27?'HIGH':t<27?'LOW':'TIE';return {mult:s==='TIE'?1:s===choice?1.9:0,detail:`${t} total · ${s}`};}
    case 'numbercrush': {const t=b(0),dd=Math.abs(x-t);return {mult:dd===0?20:dd<=5?5:dd<=20?2:dd<=50?1.2:0,detail:`byte ${t} · distance ${dd}`};}
    case 'primerush': {const p=arr(5).filter(v=>{const n=2+v%250;if(n<2)return false;for(let i=2;i*i<=n;i++)if(n%i===0)return false;return true;}).length;const dd=Math.abs(x-p);return {mult:dd===0?4:dd===1?1.6:0,detail:`${p} primes`};}
    case 'fibspin': {const ladder=[1,1,2,3,5,8,13,21,34,55,89];const v=Math.max(1,b(0)%100),ix=ladder.reduce((a,n,i)=>Math.abs(n-v)<Math.abs(ladder[a]-v)?i:a,0),rung=ladder[ix],pos=ix+1;return {mult:choice===String(rung)?7:Math.abs(x-pos)<=1?1.8:0,detail:`value ${v} → rung ${rung}`};}
    case 'egyptianmath': {const t=(b(0)+b(1))%7,dd=Math.abs(Number.isFinite(x)?x%7-0:0);const d2=Math.min(Math.abs(x-t),7-Math.abs(x-t));return {mult:d2===0?5:d2===1?1.5:0,detail:`sum ${b(0)+b(1)} mod 7 = ${t}`};}
    case 'romanroll': {const r=['I','V','X','L','C','D','M'][b(0)%7];const ix=r==='I'?0:r==='V'?1:r==='X'?2:r==='L'?3:r==='C'?4:r==='D'?5:6;const cx=choice==='I'?0:choice==='V'?1:choice==='X'?2:choice==='L'?3:choice==='C'?4:choice==='D'?5:6;return {mult:cx===ix?5:Math.abs(cx-ix)===1?1.4:0,detail:`numeral ${r}`};}
    case 'binaryrain': {const odd=arr(8).filter(v=>v&1).length;const dd=Math.abs(x-odd);return {mult:dd===0?3:dd===1?1.4:0,detail:`${odd}/8 odd low-bits`};}
    case 'puzzlepattern': {const code=['H','T','H','T'][b(0)%4] + (b(1)%2?'T':'H');const dist=[0,1].filter(i=>choice[i]!==code[i]).length;return {mult:dist===0?10:dist===1?2.5:1.2,detail:`code ${code} · distance ${dist}`};}
    case 'gridpath': {let x2=1,y2=1;const steps=arr(4).map(v=>v%4);steps.forEach(st=>{if(st===0)x2--;else if(st===1)x2++;else if(st===2)y2--;else y2++;});const corner=(x2<=0&&y2<=0)?'NW':(x2>=2&&y2<=0)?'NE':(x2<=0&&y2>=2)?'SW':(x2>=2&&y2>=2)?'SE':null;return {mult:corner===choice?6:0,detail:`moves ${steps.join('')} → ${corner||'centre'}`};}
    case 'gemmatch': {const f=arr(6).map(v=>GEMS[v%GEMS.length]);const m=cnt(f,choice);return {mult:m>=3?4:m===2?1.8:m===1?1:0,detail:`${f.join(' ')} · ${m} matches`};}
    case 'candycrush': {const f=arr(5).map(v=>CANDIES[v%CANDIES.length]);const m=cnt(f,choice);return {mult:m>=3?5:m===2?1.5:m===1?1:0,detail:`${f.join(' ')} · ${m} matches`};}
    case 'fruitsalad': {const f=arr(5).map(v=>FRUITS[v%FRUITS.length]);const m=cnt(f,choice);return {mult:m>=3?4.5:m===2?1.8:m===1?1:0,detail:`${f.join(' ')} · ${m} matches`};}
    case 'treasuremaze': {const t=b(0)%5+1,silver=1+(b(1)%3);const tp=x===t,sv=x===silver;return {mult:tp?6:sv?2:0,detail:`treasure ${t} · silver ${silver}`};}
    case 'minehelper': {const safe=new Set();let i=0;while(safe.size<5){safe.add((b(i)+i)%9+1);i++;}return {mult:safe.has(x)?2.4:0,detail:`tile ${x} ${safe.has(x)?'diamond':'mine'}`};}
    case 'goalblitz': {const dirs=['LEFT','CENTER','RIGHT'];const goals=arr(5).filter(v=>dirs[v%3]!==choice).length;return {mult:goals===5?10:goals===4?5:goals===3?3:0,detail:`${goals}/5 scored`};}
    case 'freethrow': {const made=arr(10).filter(v=>v%10<6).length;const dd=Math.abs(x-made);return {mult:dd===0?7:dd<=2?1.6:0,detail:`${made}/10 made`};}
    case 'bowling': {const pins=1+b(0)%10;return {mult:pins===10?12:pins>=8?3:pins>=6?1.5:0,detail:`${pins} pins down`};}
    case 'horserace': {const order=arr(5).map((v,i)=>i+1).sort(()=>0);const pos=(b(0)+b(1))%5+1;return {mult:pos===1?8:pos===2?3:pos===3?1.5:0,detail:`your horse finished #${pos}`};}
    case 'sprintdash': {const pos=1+b(0)%4;return {mult:pos===1?6:pos===2?2.5:0,detail:`lane finished #${pos}`};}
    case 'butterfly': {const win=1+b(0)%6;return {mult:win===x?4:Math.abs(win-x)===1?1.5:0,detail:`winning flower ${win}`};}
    case 'beehive': {const f=arr(5).map(v=>['QUEEN','WORKER','DRONE'][v%3]);const c0={};f.forEach(t=>c0[t]=(c0[t]||0)+1);const s=Object.entries(c0).sort((a,b)=>b[1]-a[1])[0][0];return {mult:s===choice?(c0[s]===5?6:c0[s]===4?4:3):0,detail:`${f.join(' ')} · ${s} majority`};}
    case 'flowerpower': {const p=1+b(0)%7;const dd=Math.abs(x-p);return {mult:dd===0?7:dd===1?1.8:0,detail:`petals ${p}`};}
    case 'mushroomhunt': {const f=arr(3).map(v=>['RED','BLUE','GREEN'][v%3]);const m=cnt(f,choice);return {mult:m===3?8:m===2?2:1,detail:`${f.join(' ')} · ${m} ${choice}`};}
    case 'asteroid': {const surv=arr(6).filter(v=>v%2===0).length;const shield=choice==='SHIELD';const ok=(shield&&surv>=4)||(!shield&&surv<=2);const tie=surv===3;return {mult:tie?1:ok?2.2:0,detail:`${surv}/6 even asteroids · ${tie?'split':'defence ok'}`};}
    case 'moonlanding': {const t=b(0)%3,s=['CRATER','SMOOTH','ROCKY'][t];return {mult:s===choice?5:Math.abs(t-(choice==='CRATER'?0:choice==='SMOOTH'?1:2))===1?2:0,detail:`landed ${s}`};}
    case 'starcollector': {const n=arr(9).filter(v=>v%3===0).length;const dd=Math.abs(x-n);return {mult:dd===0?5:dd===1?1.8:0,detail:`${n} stars`};}
    case 'rocketfuel': {const f=30+b(0)%51,dd=Math.abs(x-f);return {mult:dd===0?12:dd<=3?3:dd<=10?1.5:0,detail:`fuel ${f}%`};}
    case 'beatdrop': {const f=arr(4).map(v=>NOTES[v%7]);const m=cnt(f,choice);return {mult:m>=3?6:m===2?2:m===1?1.2:0,detail:`${f.join(' ')} · ${m} matches`};}
    case 'djdeck': {const win=1+b(0)%8;return {mult:win===x?5:Math.abs(win-x)===1?1.5:0,detail:`track ${win} stopped`};}
    case 'karaoke': {const v=b(0),s=v<85?'LOW':v>=170?'HIGH':'MID';return {mult:s===choice?2:Math.abs(v-(choice==='LOW'?85:choice==='HIGH'?170:127))<=8?1:0,detail:`key ${v} · ${s}`};}
    case 'crystalball': {const n=1+b(0)%10,dd=Math.abs(x-n);return {mult:dd===0?8:dd===1?2:0,detail:`oracle ${n}`};}
    case 'voodoodice': {const t=d(b(0))+d(b(1))+d(b(2)),s=t<=9?'CURSED':t>=12?'BLESSED':'NEUTRAL';return {mult:s==='NEUTRAL'?1:s===choice?3:0,detail:`${t} · ${s}`};}
    case 'magichat': {const n=1+b(0)%6;return {mult:n===x?6:Math.abs(n-x)===1?1.5:0,detail:`rabbit ${n} appeared`};}
    case 'fortuneteller': {const n=1+b(0)%8;return {mult:n===x?6:Math.abs(n-x)===1?2:0,detail:`fate card ${n}`};}
    case 'zodiacclock': {const n=1+b(0)%12,dd=Math.min(Math.abs(x-n),12-Math.abs(x-n));return {mult:dd===0?6:dd===1?2:0,detail:`hour ${n}`};}
    case 'nightsky': {const n=1+b(0)%8;const ix=Math.min(7,Math.max(0,x-1));return {mult:ix+1===n?5:Math.abs(ix+1-n)===1?1.8:0,detail:`constellation #${n} glows`};}
    case 'coffeebreak': {const gold=1+b(0)%4,silver=1+b(1)%4;return {mult:x===gold?4:x===silver?1.5:0,detail:`gold ${gold} · silver ${silver}`};}
    case 'teatime': {const n=(b(0)%2===0?1:b(1)%3);const s=['GREEN','BLACK','HERBAL'][n];return {mult:s===choice?3.5:0,detail:`pour ${s}`};}
    case 'rainbowarcade': {const cols=['RED','ORANGE','YELLOW','GREEN','BLUE','INDIGO','VIOLET'];const n=b(0)%7;return {mult:cols[n]===choice?7:Math.abs(n-cols.indexOf(choice))===1?1.6:0,detail:`landed ${cols[n]}`};}
    case 'luckyclover': {const f=arr(5).map(v=>v%2?'3-LEAF':'4-LEAF');const m=cnt(f,'4-LEAF');const four=choice==='4-LEAF';return {mult:four?(m>=3?6:m===2?2:m===1?1.2:0):(m===0?6:m===1?2:0),detail:`${m} four-leaf clovers`};}
    case 'gemcrush': {const f=arr(6).map(v=>GEMS[v%GEMS.length]);const m=cnt(f,choice);return {mult:m>=3?5:m===2?1.6:m===1?1:0,detail:`${f.join(' ')} · ${m} matches`};}
    case 'treasurechest': {const gold=1+b(0)%6,silver=new Set([1+b(1)%6,1+b(2)%6]);return {mult:x===gold?5:silver.has(x)?2:0,detail:`gold ${gold} · silver ${[...silver].join(',')}`};}
    case 'seafarers': {const pos=1+b(0)%5;return {mult:pos===1?7:pos===2?2.5:pos===3?1.4:0,detail:`boat finished #${pos}`};}
    case 'icerace': {const pos=1+b(0)%4;return {mult:pos===1?6:pos===2?2.2:0,detail:`skater finished #${pos}`};}
    case 'volcano': {const t=d(b(0))+d(b(1))+d(b(2))+d(b(3))+d(b(4)),s=t>=18?'ERUPT':t<=12?'QUIET':'NEUTRAL';return {mult:s==='NEUTRAL'?0:s===choice?3:0,detail:`energy ${t} · ${s}`};}
    case 'treasureisland': {const xpos=1+b(0)%9;return {mult:x===xpos?5:Math.abs(x-xpos)===1&&Math.floor((x-1)/3)===Math.floor((xpos-1)/3)?2:0,detail:`X on square ${xpos}`};}
    case 'clocktower': {const n=1+b(0)%12,dd=Math.min(Math.abs(x-n),12-Math.abs(x-n));return {mult:dd===0?6:dd===1?2:0,detail:`chime ${n}`};}
    case 'runewheel': {const n=1+b(0)%8;return {mult:n===x?6:Math.abs(n-x)===1?1.6:0,detail:`rune ${n}`};}
    case 'spellbook': {const r={FIREBALL:{p:35,m:4},HEAL:{p:45,m:3.2},SHIELD:{p:55,m:2.5},CHARM:{p:65,m:2}}[choice];const ok=(b(0)%100)<r.p;return {mult:ok?r.m:0,detail:`${choice} ${ok?'success':'fizzled'}`};}
    case 'dragonbridge': {const flames=arr(3).filter(v=>v%5<3).length;return {mult:flames===0?3:flames===1?1.5:0,detail:`${flames} flames lit`};}
    case 'weatherwatch': {const w=['SUN','RAIN','SNOW','WIND'][b(0)%4];return {mult:w===choice?4:0,detail:`forecast ${w}`};}
    default: return {mult:0,detail:'unknown mode'};
  }
}
