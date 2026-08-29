/* FlipArena player module — data */
import "../shared/runtime.js";

const C={feePct:5,cupRakePct:5,trnyRakePct:10,jpFundPct:10,jpFloor:1,jpArm:50,jpPayPct:50,
  nonMainCapPct:20,transferFee:2,transferMin:10,transferCap:500};
const VIP_SEED=[
 {tier:1,name:"Starter",wagered:0,rakeback:0,color:"#8d6e63"},
 {tier:2,name:"Silver",wagered:1000,rakeback:4,color:"#c0c0c0"},
 {tier:3,name:"Gold",wagered:3000,rakeback:6,color:"#ffd700"},
 {tier:4,name:"Platinum",wagered:8000,rakeback:8,color:"#e5e4e2"},
 {tier:5,name:"Diamond",wagered:20000,rakeback:12,color:"#b9f2ff"},
 {tier:6,name:"Black Diamond",wagered:50000,rakeback:15,color:"linear-gradient(135deg,#111827,#f43f5e)"},
 {tier:7,name:"Royal",wagered:75000,rakeback:17,color:"linear-gradient(135deg,#f43f5e,#fbbf24)"},
 {tier:8,name:"Legend",wagered:100000,rakeback:20,color:"linear-gradient(135deg,#fbbf24,#f43f5e,#a855f7)"}];
const VIP_DISC={6:10,7:20,8:30};
const VIP_TOURNEY_DISC={5:5,6:10,7:10,8:15};
const VIP_BENEFITS={
  1:["Basic access","Daily quests","Jackpot eligibility"],
  2:["4% rakeback","Blue chat colour","1 free premium emoji"],
  3:["6% rakeback","Gold avatar frame","Queue priority","2 free premium emojis"],
  4:["8% rakeback","Platinum VIP coin skin","2 free premium emojis"],
  5:["12% rakeback","Diamond VIP coin skin","5% tournament discount","3 free premium emojis"],
  6:["15% rakeback","Black Diamond animated frame","Birthday-bonus eligibility","10% tournament discount","10% cosmetics discount","5 free premium emojis"],
  7:["17% rakeback","Royal Crown title","10% tournament discount","20% cosmetics discount","Priority-support entitlement","8 free premium emojis"],
  8:["20% rakeback (maximum)","Legend Prism + Eternal Flame skins","15% tournament discount","30% cosmetics discount","All premium emojis","Gold leaderboard name","Early-access entitlement"]
};
const VIP_EMOJI_COUNTS={2:1,3:2,4:2,5:3,6:5,7:8,8:15};
const BOTS_SEED=[
 {name:"Aman",avi:"🧑🏽",flag:"🇮🇳",balance:0,level:7,country:"India",title:"Coin Flip King",about:"Delhi-based flipper chasing the Legend tier.",skin:"classic",joined:1},
 {name:"Priya",avi:"👩🏽",flag:"🇮🇳",balance:0,level:12,country:"India",title:"High Roller",about:"Plays only 500+ tables. Undefeated on Tuesdays.",skin:"ruby",joined:1},
 {name:"Raj",avi:"🧔🏽",flag:"🇮🇳",balance:0,level:4,country:"India",title:"Newcomer",about:"Just learning the ropes. Wish me luck!",skin:"silver",joined:2},
 {name:"Neo",avi:"🤖",flag:"🌐",balance:0,level:18,country:"The Grid",title:"The Architect",about:"I calculate odds. You cannot win. (But I'm fun.)",skin:"galaxy",joined:1},
 {name:"Luna",avi:"🌙",flag:"🇧🇷",balance:0,level:9,country:"Brazil",title:"Night Owl",about:"Plays after midnight. Loves Bo5 cups.",skin:"arctic",joined:1},
 {name:"Blaze",avi:"🔥",flag:"🇺🇸",balance:0,level:6,country:"USA",title:"Hot Streak",about:"Currently on fire. Someone stop me.",skin:"ember",joined:1},
 {name:"Kaito",avi:"🧑‍🎤",flag:"🇯🇵",balance:0,level:11,country:"Japan",title:"Samurai",about:"Honor. Patience. One perfect flip.",skin:"neon",joined:1},
 {name:"Sofia",avi:"👩‍🎨",flag:"🇧🇷",balance:0,level:8,country:"Brazil",title:"Artist",about:"Here for the cosmetics. Check my skins.",skin:"rainbow",joined:1},
 {name:"Omar",avi:"👳",flag:"🇦🇪",balance:0,level:14,country:"UAE",title:"Sheikh of Coins",about:"Gold is the only colour.",skin:"bitcoin",joined:1},
 {name:"Zara",avi:"👩‍🚀",flag:"🇬🇧",balance:0,level:10,country:"UK",title:"Astronaut",about:"Floating through brackets. See you in the finals.",skin:"sapphire",joined:1},
 {name:"Chen",avi:"🧑‍💻",flag:"🇰🇷",balance:0,level:15,country:"South Korea",title:"Pro Gamer",about:"APAC server. 3 tournament titles.",skin:"blackhole",joined:1},
 {name:"Maya",avi:"🧚",flag:"🇮🇳",balance:0,level:7,country:"India",title:"Fairy Godflipper",about:"Spreading luck and rainbow coins.",skin:"rainbow",joined:2},
 {name:"Thor",avi:"🧔",flag:"🇩🇪",balance:0,level:9,country:"Germany",title:"Thunder",about:"I bring the hammer down on tails.",skin:"bronze",joined:1},
 {name:"Aria",avi:"👸",flag:"🇮🇹",balance:0,level:13,country:"Italy",title:"Queen",about:"Royalty in the making. Crown me.",skin:"ruby",joined:1},
 {name:"Diego",avi:"🤠",flag:"🇲🇽",balance:0,level:5,country:"Mexico",title:"Cowboy",about:"Yeehaw, let's flip.",skin:"bronze",joined:3},
 {name:"Vega",avi:"🥷",flag:"🌐",balance:0,level:20,country:"Shadow Network",title:"Silent Assassin",about:"You won't see me coming.",skin:"legend",joined:1},
 {name:"Yuki",avi:"👩‍🎓",flag:"🇯🇵",balance:0,level:10,country:"Japan",title:"Scholar",about:"Studying the RNG. It is fair, I checked.",skin:"sapphire",joined:1},
 {name:"Rafael",avi:"🧑‍🎨",flag:"🇧🇷",balance:0,level:7,country:"Brazil",title:"Trickster",about:"Mind games only. Which side am I on?",skin:"neon",joined:2},
 {name:"Inga",avi:"👩‍🦰",flag:"🇩🇪",balance:0,level:12,country:"Germany",title:"Valkyrie",about:"Chooser of the slain. (And the winners.)",skin:"arctic",joined:1},
 {name:"Arjun",avi:"🧑‍🏫",flag:"🇮🇳",balance:0,level:14,country:"India",title:"Professor",about:"Taught half of you how to play.",skin:"emerald",joined:1},
 {name:"Chloe",avi:"👩‍🍳",flag:"🇫🇷",balance:0,level:6,country:"France",title:"Chef",about:"I cook up wins. Bon appétit.",skin:"ember",joined:2},
 {name:"Magnus",avi:"🧙‍♂️",flag:"🇳🇴",balance:0,level:17,country:"Norway",title:"Grand Wizard",about:"The coin bends to my will.",skin:"galaxy",joined:1},
 {name:"Kofi",avi:"🧑‍🌾",flag:"🇬🇭",balance:0,level:5,country:"Ghana",title:"Harvester",about:"Planting coins, reaping jackpots.",skin:"bronze",joined:3},
 {name:"Lars",avi:"🧑‍🔧",flag:"🇸🇪",balance:0,level:11,country:"Sweden",title:"Engineer",about:"I fix games. This one works.",skin:"silver",joined:1},
 {name:"Nina",avi:"💃",flag:"🇪🇸",balance:0,level:8,country:"Spain",title:"Flamenco",about:"Every flip is a dance. Olé!",skin:"ruby",joined:2},
 {name:"Anaya",avi:"👩‍⚕️",flag:"🇮🇳",balance:0,level:13,country:"India",title:"Doctor",about:"Diagnosing your losses since day one.",skin:"emerald",joined:1},
 {name:"Boris",avi:"🕵️",flag:"🇷🇺",balance:0,level:16,country:"Russia",title:"Spy",about:"I was never here.",skin:"blackhole",joined:1},
 {name:"Tariq",avi:"🧑‍✈️",flag:"🇦🇪",balance:0,level:12,country:"UAE",title:"Pilot",about:"Flying high, landing wins.",skin:"sapphire",joined:1},
 {name:"Mei",avi:"👩‍💼",flag:"🇨🇳",balance:0,level:16,country:"China",title:"CEO",about:"This is a hostile takeover of the leaderboard.",skin:"koi",joined:1},
 {name:"Hugo",avi:"🧑‍🚒",flag:"🇫🇷",balance:0,level:6,country:"France",title:"Firefighter",about:"Putting out hot streaks since 2024.",skin:"ember",joined:2}
];

export function bind(){

}


/* expose top-level symbols to globalThis so legacy inline handlers and the shared theme engine can resolve them */
Object.assign(globalThis,{BOTS_SEED,C,VIP_BENEFITS,VIP_DISC,VIP_EMOJI_COUNTS,VIP_SEED,VIP_TOURNEY_DISC});

export {BOTS_SEED,C,VIP_BENEFITS,VIP_DISC,VIP_EMOJI_COUNTS,VIP_SEED,VIP_TOURNEY_DISC};
