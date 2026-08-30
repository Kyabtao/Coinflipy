/* FlipArena — P2P Catalog expansion (CAT37–CAT100).
   Pure data + resolver module (no DOM / no state) so both the player app and
   the Admin console can consume the same catalog. Every game is a distinct
   concept with its own fair proof-derived resolution.                          */
const SUITS=['♠','♥','♦','♣'];
const DAYS=['MON','TUE','WED','THU','FRI','SAT','SUN'];
const MOONS=['NEW','WAX CRESCENT','FIRST QUARTER','WAX GIBBOUS','FULL','WANING GIBBOUS','LAST QUARTER','WANING CRESCENT'];
const ZODIAC=['ARIES','TAURUS','GEMINI','CANCER','LEO','VIRGO','LIBRA','SCORPIO','SAGITTARIUS','CAPRICORN','AQUARIUS','PISCES'];
const ELEMENTS=['FIRE','WATER','EARTH','AIR','WIND','VOID'];
const COLOURS8=['RED','ORANGE','YELLOW','GREEN','CYAN','BLUE','VIOLET','PINK'];
const TAROTS=['MAGICIAN','PRIESTESS','EMPRESS','EMPEROR','HIEROPHANT','LOVERS','CHARIOT','STRENGTH'];
const CARDFACES=['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
const LOWZONES=['0-31','32-63','64-95','96-127'];
const HIGHZONES=['128-159','160-191','192-223','224-255'];
const THIRDS=['0-85','86-170','171-255'];
const QUINTS=['0-51','52-102','103-153','154-204','205-255'];
const DECILES=['0-25','26-51','52-77','78-102','103-127','128-153','154-178','179-204','205-229','230-255'];
const ROMANS=['I','V','X','L','C','D','M'];

function side(n){return n%2===0?'HEADS':'TAILS';}
function dice(n){return n%6+1;}
function card(x){return x%13+2;}
function cardName(x){const r=card(x);return r<=10?String(r):['J','Q','K','A'][r-11];}
function suit(x){return SUITS[x%4];}
function fib(n){let a=0,b=1;while(b<n){const c=a+b;a=b;b=c;}return b===n;}
function prime(n){if(n<2)return false;for(let d=2;d*d<=n;d++)if(n%d===0)return false;return true;}
function bits(n){let c=0;while(n){c+=n&1;n>>=1;}return c;}
function zoneHit(z,v){const [a,b]=String(z).split('-').map(Number);return v>=a&&v<=b;}
function closest(a,b,t){const da=Math.abs(a-t),db=Math.abs(b-t);return da===db?null:da<db;}

/* 64 new P2P games — CAT37 → CAT100. */
export const P2P_EXTRA=[
 {id:'suitduel',code:'CAT37',name:'🃏 Suit Duel',edge:'4 suits',type:'options',options:SUITS,group:'Express Picks',desc:'Claim a card suit distinct from your opponent. A proof card is revealed; if its suit matches your claim you take the pot, opponent\u2019s claim wins for the bot, and an unclaimed suit carries.'},
 {id:'dayduel',code:'CAT38',name:'📅 Day Duel',edge:'7 days',type:'options',options:DAYS,group:'Express Picks',desc:'Pick a day of the week. A proof byte selects one day; matching claims win and unselected days carry the pot.'},
 {id:'moonpick',code:'CAT39',name:'🌙 Moon Phase',edge:'8 phases',type:'options',options:MOONS,group:'Express Picks',desc:'Predict the moon phase. One of eight phases is revealed; the side whose phase appears wins, unclaimed phases carry.'},
 {id:'zodiacduel',code:'CAT40',name:'⭐ Zodiac Duel',edge:'12 signs',type:'options',options:ZODIAC,group:'Express Picks',desc:'Claim one of twelve zodiac signs. A proof byte selects a sign; the matching claim wins and unclaimed signs carry.'},
 {id:'elementduel',code:'CAT41',name:'🔥 Element Duel',edge:'6 elements',type:'options',options:ELEMENTS,group:'Express Picks',desc:'Pick an element (Fire, Water, Earth, Air, Wind, Void). The revealed element decides; unclaimed elements carry.'},
 {id:'colour8',code:'CAT42',name:'🌈 Colour Wheel',edge:'8 colours',type:'options',options:COLOURS8,group:'Express Picks',desc:'Claim a colour on an eight-colour wheel. The proof byte lands on a colour; matching claim wins, unclaimed colours carry.'},
 {id:'tarotduel',code:'CAT43',name:'🔮 Tarot Duel',edge:'8 cards',type:'options',options:TAROTS,group:'Express Picks',desc:'Draw a Major Arcana. The revealed card decides between the two hidden picks; unclaimed cards carry the pot.'},
 {id:'dieface',code:'CAT44',name:'🎲 Die Face Duel',edge:'1–6',type:'options',options:['1','2','3','4','5','6'],group:'Express Picks',desc:'Each side claims a die face and one proof die is rolled; the matched face wins and unclaimed faces carry.'},
 {id:'cardface',code:'CAT45',name:'🂡 Card Face Clash',edge:'2–Ace',type:'options',options:CARDFACES,group:'Express Picks',desc:'Claim an exact card rank; the proof rank decides. Matching claim wins, unclaimed ranks carry.'},
 {id:'lowrange',code:'CAT46',name:'📉 Low Range Duel',edge:'4 ranges',type:'zones',options:LOWZONES,group:'Zones & Territory',desc:'Claim one of four low ranges (0–127 split). A proof byte inside a claimed range wins for that side; in-between bytes carry.'},
 {id:'highzone',code:'CAT47',name:'📈 High Zone Duel',edge:'4 ranges',type:'zones',options:HIGHZONES,group:'Zones & Territory',desc:'Claim one of four high ranges (128–255 split). Result inside a claimed range wins; between ranges carries.'},
 {id:'thirds',code:'CAT48',name:'✂️ Split Three',edge:'3 thirds',type:'zones',options:THIRDS,group:'Zones & Territory',desc:'Claim one third of the 0–255 spectrum. The proof byte inside your third wins; unclaimed thirds carry.'},
 {id:'quints',code:'CAT49',name:'🖐️ Quintile Clash',edge:'5 quintiles',type:'zones',options:QUINTS,group:'Zones & Territory',desc:'Claim one of five equal quintiles; the byte landing in your quintile wins and empty quintiles carry.'},
 {id:'deciles',code:'CAT50',name:'📏 Decile Duel',edge:'10 deciles',type:'zones',options:DECILES,group:'Zones & Territory',desc:'Claim one of ten deciles across 0–255. The revealed decile wins for the matching side; unclaimed deciles carry.'},
 {id:'bitcount',code:'CAT51',name:'💠 Bits Count',edge:'0–8',type:'number',min:0,max:8,group:'Numbers & Dice',desc:'Predict how many bits are set in one proof byte. The closest prediction wins and equal distance splits.'},
 {id:'evenscount',code:'CAT52',name:'🧮 Even Byte Count',edge:'0–4',type:'number',min:0,max:4,group:'Numbers & Dice',desc:'Predict how many of four proof bytes are even. Closest prediction wins; equal distance splits.'},
 {id:'primescount',code:'CAT53',name:'🔢 Prime Count',edge:'0–5',type:'number',min:0,max:5,group:'Numbers & Dice',desc:'Predict how many of five proof bytes are prime numbers. Closest wins; equal distance splits.'},
 {id:'avgbyte',code:'CAT54',name:'⚖️ Average Byte',edge:'0–255',type:'number',min:0,max:255,group:'Numbers & Dice',desc:'Predict the average of four proof bytes. The closest prediction wins the pot.'},
 {id:'rangebyte',code:'CAT55',name:'↕️ Byte Spread',edge:'0–255',type:'number',min:0,max:255,group:'Numbers & Dice',desc:'Predict the spread (maximum minus minimum) of four proof bytes. Closest prediction wins.'},
 {id:'modsum',code:'CAT56',name:'➕ Mod Sum Clash',edge:'0–9',type:'number',min:0,max:9,group:'Numbers & Dice',desc:'Predict the last digit of the sum of two bytes. Closest digit prediction wins.'},
 {id:'sumthree',code:'CAT57',name:'📊 Sum of Three',edge:'0–765',type:'number',min:0,max:765,group:'Numbers & Dice',desc:'Predict the total of three proof bytes. The closest prediction wins; equal distance splits.'},
 {id:'sumfive',code:'CAT58',name:'✋ Sum of Five',edge:'0–1275',type:'number',min:0,max:1275,group:'Numbers & Dice',desc:'Predict the total of five proof bytes (0–1275). Closest prediction wins; equal distance splits.'},
 {id:'productparity',code:'CAT59',name:'✖️ Product Parity',edge:'even / odd',type:'options',options:['EVEN','ODD'],group:'Numbers & Dice',desc:'Pick EVEN or ODD. Two proof bytes are multiplied; the parity of the product decides the winner.'},
 {id:'digitsum',code:'CAT60',name:'🔢 Digit Sum Duel',edge:'0–18',type:'number',min:0,max:18,group:'Numbers & Dice',desc:'Predict the digit sum of a proof byte (its decimal digits added). Closest prediction wins.'},
 {id:'last2',code:'CAT61',name:'🔟 Last Two Digits',edge:'0–99',type:'number',min:0,max:99,group:'Numbers & Dice',desc:'Predict the last two digits of the 16-bit proof number. Closest prediction wins.'},
 {id:'middlebyte',code:'CAT62',name:'🎯 Middle Byte',edge:'0–255',type:'number',min:0,max:255,group:'Numbers & Dice',desc:'Three proof bytes are sorted; predict the middle value. The closest prediction wins.'},
 {id:'mod7',code:'CAT63',name:'7️⃣ Mod Seven',edge:'remainder',type:'number',min:0,max:6,group:'Numbers & Dice',desc:'Predict the remainder of a proof byte divided by seven. Closest remainder wins.'},
 {id:'mod11',code:'CAT64',name:'1️⃣1️⃣ Mod Eleven',edge:'remainder',type:'number',min:0,max:10,group:'Numbers & Dice',desc:'Predict the remainder of a proof byte divided by eleven. Closest remainder prediction wins.'},
 {id:'fliprace5',code:'CAT65',name:'🏁 Five-Flip Sprint',edge:'first to 3',type:'options',options:['HEADS','TAILS'],group:'Races & Streaks',desc:'Pick a side. Fair flips race until one side reaches three — that side wins the pot.'},
 {id:'multirun',code:'CAT66',name:'🎢 Run Race',edge:'longest run',type:'options',options:['HEADS','TAILS'],group:'Races & Streaks',desc:'Eight fair flips are revealed. The side with the longest consecutive run wins; a tie carries the pot.'},
 {id:'alternating',code:'CAT67',name:'🔄 Alternating Streak',edge:'6 flips',type:'options',options:['HEADS','TAILS'],group:'Races & Streaks',desc:'Predict the starting side of a six-flip alternating sequence. If the sequence alternates starting with your side you win; otherwise the bot wins and a non-alternating sequence carries.'},
 {id:'evenflips',code:'CAT68',name:'⚖️ Even Flips',edge:'parity',type:'options',options:['EVEN','ODD'],group:'Races & Streaks',desc:'Predict whether the number of HEADS in six fair flips is even or odd.'},
 {id:'streak3first',code:'CAT69',name:'🔥 Three-Streak Sprint',edge:'3 in a row',type:'options',options:['HEADS','TAILS'],group:'Races & Streaks',desc:'Opposite sides race; the first side to show three identical consecutive results wins.'},
 {id:'walkrace',code:'CAT70',name:'🚶 Random Walk Duel',edge:'net direction',type:'options',options:['LEFT','RIGHT'],group:'Races & Streaks',desc:'Eight flips walk a rope LEFT (HEADS) or RIGHT (TAILS). Predict the final direction; a tied walk carries.'},
 {id:'parityrace',code:'CAT71',name:'♾️ Parity Race',edge:'4 of 6',type:'options',options:['EVEN','ODD'],group:'Races & Streaks',desc:'Six proof bytes are revealed. The parity appearing four or more times wins; a 3–3 split carries.'},
 {id:'highlowrun',code:'CAT72',name:'📊 High/Low Run',edge:'4 in a row',type:'options',options:['HIGH','LOW'],group:'Races & Streaks',desc:'Bytes are classified HIGH (128+) or LOW (0–127). The first classification to appear four times in a row wins; none reaching it carries.'},
 {id:'doublerace',code:'CAT73',name:'🎲 Doubles Race',edge:'first double',type:'options',options:['1','2','3','4','5','6'],group:'Races & Streaks',desc:'Claim a die face; the first face to repeat within eight proof dice wins. No repeat carries the pot.'},
 {id:'sum3exact',code:'CAT74',name:'🎲 Dice Sum Exact',edge:'2–12',type:'number',min:2,max:12,group:'Cards & Dice Duels',desc:'Predict the exact total of two proof dice. The closest prediction wins and equal distance splits.'},
 {id:'dicediff',code:'CAT75',name:'➖ Dice Difference',edge:'0–5',type:'number',min:0,max:5,group:'Cards & Dice Duels',desc:'Predict the absolute difference between two proof dice. Closest prediction wins.'},
 {id:'dicetriple',code:'CAT76',name:'👑 Dice Triple Duel',edge:'high / low / triple',type:'options',options:['HIGH','LOW','TRIPLE'],group:'Cards & Dice Duels',desc:'Three dice roll. TRIPLE wins when all three match; otherwise HIGH (11+) or LOW (3–10) decides.'},
 {id:'flushrace',code:'CAT77',name:'♠️ Flush Race',edge:'3 of 5',type:'options',options:SUITS,group:'Cards & Dice Duels',desc:'Five proof cards are revealed. The side claiming the suit that appears three or more times wins; no suit reaches three and it carries.'},
 {id:'cardtot21',code:'CAT78',name:'🃏 Twenty-One Beat',edge:'2–21',type:'number',min:2,max:21,group:'Cards & Dice Duels',desc:'Predict the total of two proof cards (Aces 11, face cards 10). The closest prediction wins; over-21 predictions bust to a loss.'},
 {id:'twopair',code:'CAT79',name:'🎴 Two-Card Pairs',edge:'pair vs high',type:'none',group:'Cards & Dice Duels',desc:'Each entrant receives two proof cards. A pair beats no pair; otherwise the higher high card wins and ties split.'},
 {id:'fourcard',code:'CAT80',name:'🧠 Four-Card Poker-Lite',edge:'pairs score',type:'none',group:'Cards & Dice Duels',desc:'Each entrant receives four proof cards. Pairs plus triples score; the higher score wins, then high card, then tie split.'},
 {id:'straight5',code:'CAT81',name:'🔗 Five-Card Straight',edge:'straights',type:'none',group:'Cards & Dice Duels',desc:'Each entrant receives five proof cards. A straight beats no straight; between two straights the higher top card wins.'},
 {id:'bridge',code:'CAT82',name:'🌉 Bridge Duel',edge:'sum of 4',type:'none',group:'Cards & Dice Duels',desc:'Each entrant receives four proof cards. The higher rank-total wins; equal totals split the pot.'},
 {id:'rankmode',code:'CAT83',name:'🗳️ Rank Mode',edge:'card ranks',type:'number',min:2,max:14,group:'Cards & Dice Duels',desc:'Predict the rank that appears most often in five proof cards. Closest rank prediction wins; a tie split.'},
 {id:'suitnumber',code:'CAT84',name:'🎨 Suit Count',edge:'0–8',type:'number',min:0,max:8,group:'Cards & Dice Duels',desc:'Claim a suit and predict how many of eight proof cards carry it. The closest prediction wins.'},
 {id:'kingcount',code:'CAT85',name:'👑 Kings Count',edge:'0–4',type:'number',min:0,max:4,group:'Cards & Dice Duels',desc:'Predict how many Kings (rank 13) appear in five proof cards. The closest prediction wins.'},
 {id:'acecount',code:'CAT86',name:'🅰️ Aces Count',edge:'0–5',type:'number',min:0,max:5,group:'Cards & Dice Duels',desc:'Predict how many Aces (rank 14) appear in five proof cards. The closest prediction wins.'},
 {id:'bitwisexor',code:'CAT87',name:'💠 Bitwise XOR',edge:'0–255',type:'number',min:0,max:255,group:'Binary & Bits',desc:'Predict the bitwise XOR of two proof bytes. The closest prediction wins.'},
 {id:'bitwiseand',code:'CAT88',name:'🔗 Bitwise AND',edge:'0–255',type:'number',min:0,max:255,group:'Binary & Bits',desc:'Predict the bitwise AND of two proof bytes. The closest prediction wins.'},
 {id:'bitwiseor',code:'CAT89',name:'🧩 Bitwise OR',edge:'0–255',type:'number',min:0,max:255,group:'Binary & Bits',desc:'Predict the bitwise OR of two proof bytes. The closest prediction wins.'},
 {id:'geomean',code:'CAT90',name:'📐 Geometric Mean',edge:'0–255',type:'number',min:0,max:255,group:'Binary & Bits',desc:'Predict the rounded geometric mean of two proof bytes (√(a×b)). The closest prediction wins.'},
 {id:'avg8',code:'CAT91',name:'📚 Average of Eight',edge:'0–255',type:'number',min:0,max:255,group:'Binary & Bits',desc:'Predict the average of eight proof bytes. Closest prediction wins the pot.'},
 {id:'byteposition',code:'CAT92',name:'👁️ Byte Position',edge:'greater / less / equal',type:'options',options:['GREATER','LESS','EQUAL'],allowSame:true,group:'Binary & Bits',desc:'Choose how the first proof byte compares with the second. The true relation decides and identical claims split.'},
 {id:'threshold',code:'CAT93',name:'🚧 Threshold Count',edge:'0–10',type:'number',min:0,max:10,group:'Number Theory',desc:'Predict how many of ten proof bytes exceed 127. The closest prediction wins; equal distance splits.'},
 {id:'collatz',code:'CAT94',name:'🔁 Collatz Steps',edge:'0–60',type:'number',min:0,max:60,group:'Number Theory',desc:'Predict how many Collatz steps a proof number takes to reach 1. The closest prediction wins.'},
 {id:'fibcheck',code:'CAT95',name:'🌀 Fibonacci Check',edge:'fib / no',type:'options',options:['FIB','NON-FIB'],group:'Number Theory',desc:'Pick FIB or NON-FIB. The sum of two proof bytes is checked against the Fibonacci sequence; the correct claim wins.'},
 {id:'squarecheck',code:'CAT96',name:'⬜ Square Check',edge:'square / no',type:'options',options:['SQUARE','NON-SQUARE'],group:'Number Theory',desc:'Pick SQUARE or NON-SQUARE. The sum of two proof bytes is tested for a perfect square; the correct claim wins.'},
 {id:'palindrome',code:'CAT97',name:'🪞 Palindrome Check',edge:'yes / no',type:'options',options:['YES','NO'],group:'Number Theory',desc:'Pick YES or NO. The three-proof-byte number is checked for a palindromic digit string; the correct claim wins.'},
 {id:'divremainder',code:'CAT98',name:'➗ Divide Remainder',edge:'0–6',type:'number',min:0,max:6,group:'Number Theory',desc:'Predict the remainder of a proof byte divided by seven; extended to a second stage where the sum of two bytes is divided by seven.'},
 {id:'romanduel',code:'CAT99',name:'🏛️ Roman Numeral Duel',edge:'7 numerals',type:'options',options:ROMANS,group:'Number Theory',desc:'Claim a Roman numeral (I, V, X, L, C, D, M). The proof byte maps to one of the seven numerals; a match wins and unclaimed numerals carry.'},
 {id:'nimgame',code:'CAT100',name:'⚔️ Nim Count Duel',edge:'0–5',type:'number',min:0,max:5,group:'Number Theory',desc:'Predict how many of five proof bytes fall in the low byte range 0–31. The closest prediction wins the pot.'}
];

/* The old (pre-expansion) games kept their original resolution in sync.js.
   Every new game resolves here so the formula is co-located with the data. */
const SUIT_IX={ '♠':0,'♥':1,'♦':2,'♣':3 };
const DAY_IX=Object.fromEntries(DAYS.map((d,i)=>[d,i]));
const MOON_IX=Object.fromEntries(MOONS.map((d,i)=>[d,i]));
const ZOD_IX=Object.fromEntries(ZODIAC.map((d,i)=>[d,i]));
const ELE_IX=Object.fromEntries(ELEMENTS.map((d,i)=>[d,i]));
const COL_IX=Object.fromEntries(COLOURS8.map((d,i)=>[d,i]));
const TAR_IX=Object.fromEntries(TAROTS.map((d,i)=>[d,i]));
const ROMAN_IX=Object.fromEntries(ROMANS.map((d,i)=>[d,i]));

export function resolveExtraGame(g,pickA,pickB,bytes){
  const b=i=>bytes[i]||0;
  const w=s=>String(pickA)===String(s)?'player':'bot';
  const id=g.id;
  if(id==='suitduel'){const s=SUITS[b(0)%4];return {winner:(SUIT_IX[pickA]===s? 'player':SUIT_IX[pickB]===s?'bot':'carry'),detail:`card ${cardName(b(0))}${suit(b(0))} → ${s}`};}
  if(id==='dayduel'){const day=b(0)%7;const s=DAYS[day];return {winner:DAY_IX[pickA]===day?'player':DAY_IX[pickB]===day?'bot':'carry',detail:`proof day ${s} (${day+1}/7)`};}
  if(id==='moonpick'){const ix=b(0)%8,s=MOONS[ix];return {winner:MOON_IX[pickA]===ix?'player':MOON_IX[pickB]===ix?'bot':'carry',detail:`phase ${s}`};}
  if(id==='zodiacduel'){const ix=b(0)%12,s=ZODIAC[ix];return {winner:ZOD_IX[pickA]===ix?'player':ZOD_IX[pickB]===ix?'bot':'carry',detail:`sign ${s}`};}
  if(id==='elementduel'){const ix=b(0)%6,s=ELEMENTS[ix];return {winner:ELE_IX[pickA]===ix?'player':ELE_IX[pickB]===ix?'bot':'carry',detail:`element ${s}`};}
  if(id==='colour8'){const ix=b(0)%8,s=COLOURS8[ix];return {winner:COL_IX[pickA]===ix?'player':COL_IX[pickB]===ix?'bot':'carry',detail:`colour ${s}`};}
  if(id==='tarotduel'){const ix=b(0)%8,s=TAROTS[ix];return {winner:TAR_IX[pickA]===ix?'player':TAR_IX[pickB]===ix?'bot':'carry',detail:`card ${s}`};}
  if(id==='dieface'){const n=dice(b(0));return {winner:String(pickA)===String(n)?'player':String(pickB)===String(n)?'bot':'carry',detail:`die rolled ${n}`};}
  if(id==='cardface'){const r=card(b(0)),n=cardName(b(0));return {winner:String(pickA)===String(n)?'player':String(pickB)===String(n)?'bot':'carry',detail:`card ${n} (${r})`};}
  if(id==='lowrange'||id==='highzone'||id==='thirds'||id==='quints'||id==='deciles'){
    const r=b(0),a=zoneHit(pickA,r),bb=zoneHit(pickB,r);
    return {winner:a?'player':bb?'bot':'carry',detail:`byte ${r} · zones ${pickA}/${pickB}`};
  }
  if(id==='bitcount'){const t=bits(b(0)),d=closest(+pickA,+pickB,t);return {winner:d===null?'split':d?'player':'bot',detail:`byte ${b(0)} has ${t} set bits`};}
  if(id==='evenscount'){const t=[b(0),b(1),b(2),b(3)].filter(x=>x%2===0).length,d=closest(+pickA,+pickB,t);return {winner:d===null?'split':d?'player':'bot',detail:`even bytes ${t}/4`};}
  if(id==='primescount'){const t=[b(0),b(1),b(2),b(3),b(4)].filter(x=>prime(x)).length,d=closest(+pickA,+pickB,t);return {winner:d===null?'split':d?'player':'bot',detail:`${t} of 5 prime`};}
  if(id==='avgbyte'){const t=Math.round((b(0)+b(1)+b(2)+b(3))/4),d=closest(+pickA,+pickB,t);return {winner:d===null?'split':d?'player':'bot',detail:`average ${t}`};}
  if(id==='rangebyte'){const arr=[b(0),b(1),b(2),b(3)],t=Math.max(...arr)-Math.min(...arr),d=closest(+pickA,+pickB,t);return {winner:d===null?'split':d?'player':'bot',detail:`spread ${t}`};}
  if(id==='modsum'){const t=(b(0)+b(1))%10,d=closest(+pickA,+pickB,t);return {winner:d===null?'split':d?'player':'bot',detail:`${b(0)}+${b(1)} mod 10 = ${t}`};}
  if(id==='sumthree'){const t=b(0)+b(1)+b(2),d=closest(+pickA,+pickB,t);return {winner:d===null?'split':d?'player':'bot',detail:`sum ${t}`};}
  if(id==='sumfive'){const t=b(0)+b(1)+b(2)+b(3)+b(4),d=closest(+pickA,+pickB,t);return {winner:d===null?'split':d?'player':'bot',detail:`sum ${t}`};}
  if(id==='productparity'){const t=((b(0)*b(1))%2===0)?'EVEN':'ODD';return {winner:w(t),detail:`${b(0)}×${b(1)}=${b(0)*b(1)} (${t})`};}
  if(id==='digitsum'){const v=b(0),t=Math.floor(v/10)+(v%10),d=closest(+pickA,+pickB,t);return {winner:d===null?'split':d?'player':'bot',detail:`digit sum ${t}`};}
  if(id==='last2'){const t=(b(0)*256+b(1))%100,d=closest(+pickA,+pickB,t);return {winner:d===null?'split':d?'player':'bot',detail:`last two digits ${t}`};}
  if(id==='middlebyte'){const arr=[b(0),b(1),b(2)].sort((x,y)=>x-y),t=arr[1],d=closest(+pickA,+pickB,t);return {winner:d===null?'split':d?'player':'bot',detail:`middle ${t} of ${arr.join(',')}`};}
  if(id==='mod7'){const t=b(0)%7,d=closest(+pickA,+pickB,t);return {winner:d===null?'split':d?'player':'bot',detail:`${b(0)} mod 7 = ${t}`};}
  if(id==='mod11'){const t=b(0)%11,d=closest(+pickA,+pickB,t);return {winner:d===null?'split':d?'player':'bot',detail:`${b(0)} mod 11 = ${t}`};}
  if(id==='fliprace5'){let h=0,t=0;for(let i=0;i<bytes.length;i++){side(bytes[i])==='HEADS'?h++:t++;if(h>=3||t>=3){const s=h>=3?'HEADS':'TAILS';return {winner:w(s),detail:`${s} reached 3 after ${i+1} flips (${h}-${t})`};}}return {winner:'carry',detail:'no side reached three'};}
  if(id==='multirun'){let rh=0,rt=0,ch=0,ct=0;for(let i=0;i<8;i++){const s=side(bytes[i]);if(s==='HEADS'){ch++;rt=Math.max(rt,ct);ct=0;}else{ct++;rh=Math.max(rh,ch);ch=0;}}rh=Math.max(rh,ch);rt=Math.max(rt,ct);if(rh===rt)return {winner:'split',detail:`${bytes.slice(0,8).map(x=>side(x)[0]).join('')} · runs ${rh}/${rt}`};const s=rh>rt?'HEADS':'TAILS';return {winner:w(s),detail:`${s} longest run ${Math.max(rh,rt)}`};}
  if(id==='alternating'){const seq=bytes.slice(0,6).map(x=>side(x));let ok=true;for(let i=1;i<seq.length;i++)if(seq[i]===seq[i-1])ok=false;if(!ok)return {winner:'carry',detail:`${seq.map(x=>x[0]).join('')} is not alternating`};const s=seq[0];return {winner:w(s),detail:`alternating from ${s}`};}
  if(id==='evenflips'){const h=bytes.slice(0,6).filter(x=>side(x)==='HEADS').length,s=h%2===0?'EVEN':'ODD';return {winner:w(s),detail:`${h} HEADS in 6 · ${s}`};}
  if(id==='streak3first'){let last='',run=0;for(let i=0;i<bytes.length;i++){const s=side(bytes[i]);if(s===last)run++;else{last=s;run=1;}if(run>=3)return {winner:w(s),detail:`${s} three in a row after ${i+1} flips`};}return {winner:'carry',detail:'no three-streak'};}
  if(id==='walkrace'){let pos=0;for(let i=0;i<8;i++)pos+=side(bytes[i])==='HEADS'?-1:1;const s=pos<0?'LEFT':pos>0?'RIGHT':'TIE';return {winner:s==='TIE'?'carry':w(s),detail:`walk ended at ${pos} · ${s}`};}
  if(id==='parityrace'){const e=bytes.slice(0,6).filter(x=>x%2===0).length,s=e>=4?'EVEN':e<=2?'ODD':'TIE';return {winner:s==='TIE'?'carry':w(s),detail:`${e} even / ${6-e} odd`};}
  if(id==='highlowrun'){let last='',run=0;for(let i=0;i<bytes.length;i++){const s=bytes[i]>=128?'HIGH':'LOW';if(s===last)run++;else{last=s;run=1;}if(run>=4)return {winner:w(s),detail:`${s} 4 in a row after byte ${i+1}`};}return {winner:'carry',detail:'no four-run'};}
  if(id==='doublerace'){const seen=new Map();for(let i=0;i<8;i++){const d=dice(bytes[i]);if(seen.has(d))return {winner:String(pickA)===String(d)?'player':String(pickB)===String(d)?'bot':'carry',detail:`${d} repeated on dice ${i+1}`};seen.set(d,1);}return {winner:'carry',detail:'no repeated face in eight dice'};}
  if(id==='sum3exact'){const t=dice(b(0))+dice(b(1)),d=closest(+pickA,+pickB,t);return {winner:d===null?'split':d?'player':'bot',detail:`dice ${dice(b(0))}+${dice(b(1))}=${t}`};}
  if(id==='dicediff'){const t=Math.abs(dice(b(0))-dice(b(1))),d=closest(+pickA,+pickB,t);return {winner:d===null?'split':d?'player':'bot',detail:`difference ${t}`};}
  if(id==='dicetriple'){const d=[dice(b(0)),dice(b(1)),dice(b(2))],sum=d.reduce((a,x)=>a+x,0),s=d[0]===d[1]&&d[1]===d[2]?'TRIPLE':sum>=11?'HIGH':'LOW';return {winner:w(s),detail:`${d.join('-')} · ${sum} · ${s}`};}
  if(id==='flushrace'){const counts={};for(let i=0;i<5;i++){const s=suit(bytes[i]);counts[s]=(counts[s]||0)+1;}const s=Object.keys(counts).find(k=>counts[k]>=3);if(!s)return {winner:'carry',detail:`no suit reached 3 (${Object.values(counts).join('/')})`};return {winner:SUIT_IX[pickA]===SUIT_IX[s]?'player':SUIT_IX[pickB]===SUIT_IX[s]?'bot':'carry',detail:`${s} appeared ${counts[s]}`};}
  if(id==='cardtot21'){const r=i=>{const x=card(bytes[i]);return x===14?11:x>=11?10:x;};const t=r(0)+r(1);const va=+pickA,bb2=+pickB;const bustA=va>21,bustB=bb2>21;if(bustA&&bustB)return {winner:'split',detail:`both bust (${va}/${bb2}) vs total ${t}`};if(bustA)return {winner:'bot',detail:`you ${va} BUST · total ${t}`};if(bustB)return {winner:'player',detail:`bot ${bb2} BUST · total ${t}`};const d=closest(va,bb2,t);return {winner:d===null?'split':d?'player':'bot',detail:`cards ${cardName(bytes[0])} + ${cardName(bytes[1])} = ${t}`};}
  if(id==='twopair'){const hand=i=>{const a=card(bytes[i*2]),b=card(bytes[i*2+1]);return {pair:a===b,high:Math.max(a,b)};},a=hand(0),bb=hand(1);if(a.pair!==bb.pair)return {winner:a.pair?'player':'bot',detail:`${a.pair?'pair':'no pair'} vs ${bb.pair?'pair':'no pair'}`};if(a.high===bb.high)return {winner:'split',detail:`both high ${a.high}`};return {winner:a.high>bb.high?'player':'bot',detail:`high ${a.high} vs ${bb.high}`};}
  if(id==='fourcard'){const score=i=>{const ranks=[card(bytes[i*4]),card(bytes[i*4+1]),card(bytes[i*4+2]),card(bytes[i*4+3])],c={};ranks.forEach(x=>c[x]=(c[x]||0)+1);const pairs=Object.values(c).filter(n=>n===2).length,trips=Object.values(c).filter(n=>n===3).length,hi=Math.max(...ranks);return {pairs,trips,hi};};const a=score(0),bb=score(1);if(a.trips!==bb.trips||a.pairs!==bb.pairs)return {winner:a.trips>bb.trips||(a.trips===bb.trips&&a.pairs>bb.pairs)?'player':'bot',detail:`triples/pairs ${a.trips}/${a.pairs} vs ${bb.trips}/${bb.pairs}`};if(a.hi===bb.hi)return {winner:'split',detail:`tied high ${a.hi}`};return {winner:a.hi>bb.hi?'player':'bot',detail:`high ${a.hi} vs ${bb.hi}`};}
  if(id==='straight5'){const ranks=i=>{const r=[card(bytes[i*5]),card(bytes[i*5+1]),card(bytes[i*5+2]),card(bytes[i*5+3]),card(bytes[i*5+4])].sort((x,y)=>x-y);const set=[...new Set(r)];let st=set.length===5&&set[4]-set[0]===4;return {st,top:Math.max(...r)};};const a=ranks(0),bb=ranks(1);if(a.st!==bb.st)return {winner:a.st?'player':'bot',detail:`straight vs no straight`};if(a.top===bb.top)return {winner:'split',detail:'tied straight/high'};return {winner:a.top>bb.top?'player':'bot',detail:`top ${a.top} vs ${bb.top}`};}
  if(id==='bridge'){const s=i=>card(bytes[i*4])+card(bytes[i*4+1])+card(bytes[i*4+2])+card(bytes[i*4+3]);const a=s(0),bb=s(1);return {winner:a===bb?'split':a>bb?'player':'bot',detail:`rank totals ${a} vs ${bb}`};}
  if(id==='rankmode'){const c={};for(let i=0;i<5;i++){const r=card(bytes[i]);c[r]=(c[r]||0)+1;}const t=+Object.entries(c).sort((a,b)=>b[1]-a[1]||b[0]-a[0])[0][0],d=closest(+pickA,+pickB,t);return {winner:d===null?'split':d?'player':'bot',detail:`mode rank ${cardName(t)} (${t})`};}
  if(id==='suitnumber'){const counts={};for(let i=0;i<8;i++){const s=suit(bytes[i]);counts[s]=(counts[s]||0)+1;}const ca=counts[pickA]||0,cb=counts[pickB]||0;return {winner:ca===cb?'split':ca>cb?'player':'bot',detail:`suit counts ${pickA}: ${ca} · ${pickB}: ${cb} of 8`};}
  if(id==='kingcount'){const t=[b(0),b(1),b(2),b(3),b(4)].filter(x=>card(x)===13).length,d=closest(+pickA,+pickB,t);return {winner:d===null?'split':d?'player':'bot',detail:`${t} kings in 5 cards`};}
  if(id==='acecount'){const t=[b(0),b(1),b(2),b(3),b(4)].filter(x=>card(x)===14).length,d=closest(+pickA,+pickB,t);return {winner:d===null?'split':d?'player':'bot',detail:`${t} aces in 5 cards`};}
  if(id==='bitwisexor'){const t=b(0)^b(1),d=closest(+pickA,+pickB,t);return {winner:d===null?'split':d?'player':'bot',detail:`${b(0)} XOR ${b(1)} = ${t}`};}
  if(id==='bitwiseand'){const t=b(0)&b(1),d=closest(+pickA,+pickB,t);return {winner:d===null?'split':d?'player':'bot',detail:`${b(0)} AND ${b(1)} = ${t}`};}
  if(id==='bitwiseor'){const t=b(0)|b(1),d=closest(+pickA,+pickB,t);return {winner:d===null?'split':d?'player':'bot',detail:`${b(0)} OR ${b(1)} = ${t}`};}
  if(id==='geomean'){const t=Math.round(Math.sqrt(b(0)*b(1))),d=closest(+pickA,+pickB,t);return {winner:d===null?'split':d?'player':'bot',detail:`√(${b(0)}×${b(1)}) ≈ ${t}`};}
  if(id==='avg8'){const t=Math.round(bytes.slice(0,8).reduce((a,x)=>a+x,0)/8),d=closest(+pickA,+pickB,t);return {winner:d===null?'split':d?'player':'bot',detail:`average ${t}`};}
  if(id==='byteposition'){const s=b(0)>b(1)?'GREATER':b(0)<b(1)?'LESS':'EQUAL';if(String(pickA)===String(pickB))return {winner:pickA===s?'split':'carry',detail:`both picked ${pickA}; relation ${s}`};return {winner:w(s),detail:`${b(0)} vs ${b(1)} → ${s}`};}
  if(id==='threshold'){const arr=bytes.slice(0,10),t=arr.filter(x=>x>127).length,d=closest(+pickA,+pickB,t);return {winner:d===null?'split':d?'player':'bot',detail:`${t}/10 above 127`};}
  if(id==='collatz'){let n=b(0)%250+2,steps=0;while(n!==1&&steps<100){n=n%2===0?n/2:3*n+1;steps++;}const t=steps,d=closest(+pickA,+pickB,t);return {winner:d===null?'split':d?'player':'bot',detail:`${steps} Collatz steps`};}
  if(id==='fibcheck'){const t=fib(b(0)+b(1))?'FIB':'NON-FIB';return {winner:w(t),detail:`${b(0)}+${b(1)}=${b(0)+b(1)} · ${t}`};}
  if(id==='squarecheck'){const v=b(0)+b(1),r=Math.round(Math.sqrt(v)),t=r*r===v?'SQUARE':'NON-SQUARE';return {winner:w(t),detail:`${v} · ${t}`};}
  if(id==='palindrome'){const v=String(b(0)*256+b(1)+b(2)),t=v===v.split('').reverse().join('')?'YES':'NO';return {winner:w(t),detail:`${v} · ${t}`};}
  if(id==='divremainder'){const t=(b(0)+b(1))%7,d=closest(+pickA,+pickB,t);return {winner:d===null?'split':d?'player':'bot',detail:`(${b(0)}+${b(1)}) mod 7 = ${t}`};}
  if(id==='romanduel'){const r=['I','V','X','L','C','D','M'][b(0)%7];return {winner:ROMAN_IX[pickA]===b(0)%7?'player':ROMAN_IX[pickB]===b(0)%7?'bot':'carry',detail:`numeral ${r}`};}
  if(id==='nimgame'){const t=bytes.slice(0,5).filter(x=>x<=31).length,d=closest(+pickA,+pickB,t);return {winner:d===null?'split':d?'player':'bot',detail:`${t}/5 low bytes`};}
  return {winner:'split',detail:'fair split'};
}
