/* FlipArena — shared Progress+ definitions (P7 daily missions, P8 badges).
   Pure definitions in one place so the player app and the Admin console
   always show the same six daily missions and twelve career badges.
   `get` / `test` read the live player state from the shared global `S`. */
export const DAILY_MISSIONS=[
 {id:'games',icon:'🎮',label:'Play 5 games',target:5,reward:60,get:()=>S.stats.games},
 {id:'wins',icon:'🏅',label:'Win 3 games',target:3,reward:80,get:()=>S.stats.wins},
 {id:'catalog',icon:'🎲',label:'Play 2 catalog games',target:2,reward:70,get:()=>S.stats.catalogGames||0},
 {id:'arcade',icon:'🕹️',label:'Play 2 arcade modes',target:2,reward:70,get:()=>S.stats.arcadePlays||0},
 {id:'streak',icon:'🔥',label:'Reach a 3-win streak',target:3,reward:90,get:()=>S.bestStreak||0},
 {id:'wag',icon:'💸',label:'Wager 2,000 coins',target:2000,reward:100,get:()=>S.stats.lifetimeWagered||0}
];
export const BADGE_DEFS=[
 {id:'first-game',icon:'🎯',name:'First Game',desc:'Settle your first game',test:()=>S.stats.games>=1},
 {id:'first-win',icon:'🏅',name:'First Win',desc:'Win your first game',test:()=>S.stats.wins>=1},
 {id:'streak-5',icon:'🔥',name:'Hot Streak',desc:'Reach a 5-win streak',test:()=>S.bestStreak>=5},
 {id:'games-100',icon:'🎮',name:'Centurion',desc:'Play 100 games',test:()=>S.stats.games>=100},
 {id:'wins-50',icon:'👑',name:'Half-Century',desc:'Win 50 games',test:()=>S.stats.wins>=50},
 {id:'jackpot',icon:'🎰',name:'Jackpot Hunter',desc:'Hit a jackpot',test:()=>S.stats.jackpots>=1},
 {id:'level-25',icon:'⭐',name:'High Flyer',desc:'Reach level 25',test:()=>S.level>=25},
 {id:'cups',icon:'⚔️',name:'Cup Contender',desc:'Win a Series Cup',test:()=>S.stats.cupsWon>=1},
 {id:'trny',icon:'🏆',name:'Tournament Star',desc:'Win a tournament',test:()=>S.stats.trnysWon>=1},
 {id:'vip-leg',icon:'💎',name:'VIP Legend',desc:'Reach Legend VIP',test:()=>S.vipUnlockedTier>=8},
 {id:'arcade-25',icon:'🕹️',name:'Arcade Explorer',desc:'Play 25 arcade games',test:()=>S.stats.arcadePlays>=25},
 {id:'cosmetic',icon:'🛍️',name:'Collector',desc:'Own 20 cosmetics',test:()=>Object.values(S.owned).reduce((n,a)=>n+a.length,0)>=20}
];
