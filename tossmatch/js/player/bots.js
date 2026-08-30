/* FlipArena player module — bots */
import "../shared/runtime.js";
import {BOTS_SEED,VIP_DISC,VIP_EMOJI_COUNTS,VIP_TOURNEY_DISC} from "./data.js";
import {addFeed,toast,vipFor} from "./helpers.js";

const QUESTS_SEED=[
 {id:"settle",icon:"🏃",goal:"Settle 3 games",target:3,reward:50},
 {id:"win",icon:"🏆",goal:"Win 1 game",target:1,reward:75},
 {id:"cup",icon:"⚔️",goal:"Play 1 Series Cup",target:1,reward:50}];
const ACHIEVEMENTS=[
 {id:"first",icon:"🪙",name:"First Flip",desc:"Settle your first game",rew:30},
 {id:"onfire",icon:"🔥",name:"On Fire",desc:"3-win streak",rew:75},
 {id:"unstoppable",icon:"⚡",name:"Unstoppable",desc:"5-win streak",rew:150},
 {id:"jackpot",icon:"🎰",name:"Jackpot!",desc:"Win the jackpot",rew:300},
 {id:"cup",icon:"⚔️",name:"Cup Winner",desc:"Win a Series Cup",rew:100},
 {id:"champ",icon:"👑",name:"Champion",desc:"Win a tournament",rew:300},
 {id:"bigballer",icon:"🕶️",name:"Big Baller",desc:"Stake 500+ in one game",rew:100},
 {id:"nightowl",icon:"🦉",name:"Night Owl",desc:"Play 10 games",rew:50},
 {id:"frequent",icon:"🎯",name:"Frequent Flipper",desc:"Play 25 games",rew:100},
 {id:"doubledigits",icon:"🔟",name:"Double Digits",desc:"Win 10 games",rew:100},
 {id:"highroller",icon:"💎",name:"High Roller",desc:"Reach level 5",rew:100},
 {id:"comeback",icon:"🙌",name:"Comeback Kid",desc:"Win after two straight losses",rew:75},
 {id:"century",icon:"💯",name:"Century Club",desc:"Settle 100 games",rew:250},
 {id:"veteran",icon:"🎖️",name:"Veteran",desc:"Settle 250 games",rew:500},
 {id:"winner25",icon:"🏅",name:"Quarter Century",desc:"Win 25 games",rew:250},
 {id:"winner100",icon:"🏆",name:"Winning Machine",desc:"Win 100 games",rew:750},
 {id:"streak10",icon:"🌋",name:"Volcanic",desc:"Reach a 10-win streak",rew:500},
 {id:"cup5",icon:"⚔️",name:"Cup Specialist",desc:"Win 5 Series Cups",rew:300},
 {id:"trny3",icon:"🏟️",name:"Bracket Boss",desc:"Win 3 tournaments",rew:500},
 {id:"catalog5",icon:"🎮",name:"Game Explorer",desc:"Play 5 different catalog games",rew:150},
 {id:"catalog17",icon:"🧭",name:"Catalog Master",desc:"Play all 100 catalog games",rew:750},
 {id:"collector5",icon:"🛍️",name:"Collector",desc:"Own 5 paid cosmetics",rew:150},
 {id:"collector15",icon:"🗃️",name:"Super Collector",desc:"Own 15 paid cosmetics",rew:400},
 {id:"silvervip",icon:"🥈",name:"Silver Status",desc:"Reach Silver VIP",rew:100},
 {id:"goldvip",icon:"🥇",name:"Gold Status",desc:"Reach Gold VIP",rew:250},
 {id:"profit1000",icon:"📈",name:"Profit Maker",desc:"Reach +1,000 career net",rew:300},
 {id:"level10",icon:"⭐",name:"Double-Digit Level",desc:"Reach level 10",rew:300},
 {id:"level20",icon:"🌟",name:"Elite Level",desc:"Reach level 20",rew:750},
 {id:"transfer5",icon:"💸",name:"Generous",desc:"Complete 5 player transfers",rew:150},
 {id:"friends5",icon:"🤝",name:"Friendly Five",desc:"Add 5 friends",rew:125},
 {id:"friends10",icon:"🫶",name:"Social Circle",desc:"Add 10 friends",rew:250},
 {id:"chat10",icon:"💬",name:"Lobby Regular",desc:"Send 10 lobby messages",rew:100},
 {id:"rooms3",icon:"🔒",name:"Room Host",desc:"Create 3 private rooms",rew:150},
 {id:"gifts3",icon:"🎁",name:"Gift Giver",desc:"Send 3 gifts",rew:150},
 {id:"arcade10",icon:"🕹️",name:"Arcade Starter",desc:"Play 10 Arcade Zone games",rew:150},
 {id:"arcade50",icon:"👾",name:"Arcade Ace",desc:"Play 50 Arcade Zone games",rew:500},
 {id:"maxpay1000",icon:"💰",name:"Four-Figure Payout",desc:"Receive a 1,000+ payout",rew:300},
 {id:"wager10000",icon:"📊",name:"Volume Player",desc:"Wager 10,000 lifetime",rew:300},
 {id:"cup10",icon:"🛡️",name:"Cup Legend",desc:"Win 10 Series Cups",rew:600},
 {id:"trny5",icon:"🏟️",name:"Tournament Royalty",desc:"Win 5 tournaments",rew:750},
 {id:"collector25",icon:"🏪",name:"Wardrobe Vault",desc:"Own 25 paid cosmetics",rew:750},
 {id:"level30",icon:"🌠",name:"Master Level",desc:"Reach level 30",rew:1000},
 {id:"level40",icon:"🚀",name:"Mythic Level",desc:"Reach level 40",rew:1500},
 {id:"level50",icon:"🏔️",name:"Level Summit",desc:"Reach level 50",rew:2500},
 {id:"transfer10",icon:"💞",name:"Community Banker",desc:"Complete 10 player transfers",rew:300},
 {id:"streak15",icon:"☄️",name:"Untouchable",desc:"Reach a 15-win streak",rew:1000},
 {id:"catalog50",icon:"🗺️",name:"Catalog Veteran",desc:"Play 50 catalog matches",rew:500},
 {id:"clan5",icon:"🛡",name:"Clan Loyalist",desc:"Play 5 clan games",rew:300},
 {id:"allrounder",icon:"🌐",name:"All-Rounder",desc:"Play Catalog, Series, Tournament, Friend and Arcade modes",rew:500}];
const COS={
 skins:[
  {id:"classic",name:"Classic Gold",price:0,rarity:"free"},{id:"platinum-vip",name:"Platinum VIP",price:0,rarity:"epic",vip:4,vipOnly:true},{id:"diamond-vip",name:"Diamond VIP",price:0,rarity:"legendary",vip:5,vipOnly:true},
  {id:"silver",name:"Silver",price:25,rarity:"common"},
  {id:"bronze",name:"Bronze",price:25,rarity:"common"},{id:"neon",name:"Neon",price:50,rarity:"uncommon"},
  {id:"arctic",name:"Arctic",price:50,rarity:"uncommon"},{id:"ember",name:"Ember",price:75,rarity:"uncommon"},
  {id:"ruby",name:"Ruby",price:100,rarity:"rare"},{id:"emerald",name:"Emerald",price:100,rarity:"rare"},
  {id:"sapphire",name:"Sapphire",price:100,rarity:"rare"},{id:"bitcoin",name:"Bitcoin",price:150,rarity:"rare"},
  {id:"koi",name:"Koi Fish",price:150,rarity:"rare"},{id:"galaxy",name:"Galaxy",price:300,rarity:"epic"},
  {id:"rainbow",name:"Rainbow",price:500,rarity:"legendary"},{id:"blackhole",name:"Black Hole",price:600,rarity:"legendary"},
  {id:"obsidian",name:"Obsidian",price:250,rarity:"rare"},{id:"solar",name:"Solar Flare",price:450,rarity:"epic"},
  {id:"frostfire",name:"Frostfire",price:750,rarity:"legendary"},{id:"quantum",name:"Quantum Shift",price:1200,rarity:"mythic"},
  {id:"jade",name:"Jade Fortune",price:350,rarity:"epic"},{id:"lunar",name:"Lunar Halo",price:650,rarity:"legendary"},
  {id:"legend",name:"Legend Prism",price:0,rarity:"mythic",vip:8,vipOnly:true},{id:"eternal",name:"Eternal Flame",price:0,rarity:"mythic",vip:8,vipOnly:true},
  {id:"photoreal",name:"Photoreal Coin",price:800,rarity:"legendary"},
  {id:"molten",name:"Molten Gold",price:500,rarity:"epic"},{id:"tide",name:"Tide Crest",price:420,rarity:"epic"},
  {id:"marble",name:"Marble Fortune",price:900,rarity:"legendary"},{id:"inferno",name:"Inferno Forge",price:1500,rarity:"mythic"},
  {id:"crimson",name:"Crimson Dollar",price:700,rarity:"legendary"},{id:"honeycomb",name:"Honeycomb",price:380,rarity:"epic"}],
 flags:[
  {id:"in",name:"India",ch:"🇮🇳",price:25,rarity:"common"},{id:"br",name:"Brazil",ch:"🇧🇷",price:25,rarity:"common"},
  {id:"gb",name:"UK",ch:"🇬🇧",price:25,rarity:"common"},{id:"us",name:"USA",ch:"🇺🇸",price:50,rarity:"uncommon"},
  {id:"jp",name:"Japan",ch:"🇯🇵",price:50,rarity:"uncommon"},{id:"de",name:"Germany",ch:"🇩🇪",price:50,rarity:"uncommon"},
  {id:"ca",name:"Canada",ch:"🇨🇦",price:100,rarity:"rare"},{id:"ae",name:"UAE",ch:"🇦🇪",price:100,rarity:"rare"},
  {id:"au",name:"Australia",ch:"🇦🇺",price:100,rarity:"rare"},{id:"it",name:"Italy",ch:"🇮🇹",price:100,rarity:"rare"},
  {id:"kr",name:"South Korea",ch:"🇰🇷",price:200,rarity:"epic"},{id:"earth",name:"Earth",ch:"🌐",price:500,rarity:"legendary"},
  {id:"sg",name:"Singapore",ch:"🇸🇬",price:100,rarity:"rare"},{id:"za",name:"South Africa",ch:"🇿🇦",price:100,rarity:"rare"},
  {id:"nz",name:"New Zealand",ch:"🇳🇿",price:150,rarity:"rare"},{id:"pt",name:"Portugal",ch:"🇵🇹",price:150,rarity:"rare"},
  {id:"th",name:"Thailand",ch:"🇹🇭",price:100,rarity:"rare"},{id:"vn",name:"Vietnam",ch:"🇻🇳",price:100,rarity:"rare"},
  {id:"id",name:"Indonesia",ch:"🇮🇩",price:150,rarity:"rare"},{id:"ph",name:"Philippines",ch:"🇵🇭",price:150,rarity:"rare"},
  {id:"ar",name:"Argentina",ch:"🇦🇷",price:150,rarity:"rare"},{id:"mx",name:"Mexico",ch:"🇲🇽",price:100,rarity:"rare"},
  {id:"ng",name:"Nigeria",ch:"🇳🇬",price:200,rarity:"epic"},{id:"eg",name:"Egypt",ch:"🇪🇬",price:200,rarity:"epic"}],
 avatars:[
  {id:"hero",name:"Hero",ch:"🦸",price:25,rarity:"common"},{id:"ninja",name:"Ninja",ch:"🥷",price:25,rarity:"common"},
  {id:"cop",name:"Officer",ch:"👮",price:50,rarity:"uncommon"},{id:"wizard",name:"Wizard",ch:"🧙",price:50,rarity:"uncommon"},
  {id:"astro",name:"Astronaut",ch:"👨‍🚀",price:100,rarity:"rare"},{id:"robot",name:"Robot",ch:"🤖",price:100,rarity:"rare"},
  {id:"mask",name:"Mask",ch:"🎭",price:100,rarity:"rare"},{id:"ghost",name:"Ghost",ch:"👻",price:200,rarity:"epic"},
  {id:"royal",name:"Royal",ch:"👑",price:500,rarity:"legendary"},{id:"agent",name:"Agent",ch:"🕵️",price:400,rarity:"legendary"},
  {id:"fairy",name:"Fairy",ch:"🧚",price:1000,rarity:"mythic"},{id:"dragon",name:"Dragon",ch:"🐉",price:800,rarity:"legendary"},
  {id:"alien",name:"Alien",ch:"👽",price:300,rarity:"epic"},{id:"fox",name:"Fox",ch:"🦊",price:200,rarity:"rare"},
  {id:"panda",name:"Panda",ch:"🐼",price:250,rarity:"rare"},{id:"unicorn",name:"Unicorn",ch:"🦄",price:700,rarity:"legendary"},
  {id:"cat",name:"Cat",ch:"🐱",price:150,rarity:"rare"},{id:"dog",name:"Dog",ch:"🐶",price:150,rarity:"rare"},
  {id:"owl",name:"Owl",ch:"🦉",price:250,rarity:"epic"},{id:"lion",name:"Lion",ch:"🦁",price:350,rarity:"epic"},
  {id:"tiger",name:"Tiger",ch:"🐯",price:350,rarity:"epic"},{id:"koala",name:"Koala",ch:"🐨",price:300,rarity:"epic"}],
 frames:[
  {id:"none",name:"None",price:0,rarity:"free",cls:""},{id:"thin",name:"Thin Ring",price:25,rarity:"common",cls:"box-shadow:0 0 0 2px #64748b"},
  {id:"double",name:"Double Ring",price:50,rarity:"uncommon",cls:"box-shadow:0 0 0 2px #64748b,0 0 0 4px #334155"},
  {id:"gold",name:"Gold Ring",price:100,rarity:"rare",cls:"frame-gold"},{id:"fire",name:"Fire Ring",price:150,rarity:"rare",cls:"frame-fire"},
  {id:"ice",name:"Ice Ring",price:200,rarity:"epic",cls:"frame-ice"},{id:"neon",name:"Neon Pulse",price:250,rarity:"epic",cls:"frame-neon"},
  {id:"blackdiamond",name:"Black Diamond Animated",price:0,rarity:"legendary",cls:"frame-blackdiamond",vip:6,vipOnly:true},{id:"rainbow",name:"Rainbow Spin",price:600,rarity:"legendary",cls:"frame-rainbow"},
  {id:"emerald-ring",name:"Emerald Orbit",price:200,rarity:"rare",cls:"box-shadow:0 0 0 3px #10b981,0 0 14px #10b981"},
  {id:"cosmic-ring",name:"Cosmic Halo",price:400,rarity:"epic",cls:"box-shadow:0 0 0 3px #8b5cf6,0 0 18px #22d3ee"},
  {id:"crown-ring",name:"Crown Aura",price:700,rarity:"legendary",cls:"box-shadow:0 0 0 3px #fbbf24,0 0 22px #f59e0b"},
  {id:"lava-ring",name:"Lava Ring",price:500,rarity:"epic",cls:"box-shadow:0 0 0 3px #f43f5e,0 0 20px #fb923c"},
  {id:"ocean-ring",name:"Ocean Ring",price:500,rarity:"epic",cls:"box-shadow:0 0 0 3px #38bdf8,0 0 20px #0ea5e9"},
  {id:"plant-ring",name:"Vine Ring",price:450,rarity:"epic",cls:"box-shadow:0 0 0 3px #4ade80,0 0 18px #16a34a"}],
 colours:[
  {id:"default",name:"Default",price:0,rarity:"free",hex:"#e8edf7"},{id:"blue",name:"Blue",price:50,rarity:"uncommon",hex:"#60a5fa"},
  {id:"green",name:"Green",price:50,rarity:"uncommon",hex:"#34d399"},{id:"orange",name:"Orange",price:100,rarity:"rare",hex:"#fb923c"},
  {id:"purple",name:"Purple",price:100,rarity:"rare",hex:"#c084fc"},{id:"gold",name:"Gold",price:200,rarity:"epic",hex:"#fbbf24"},
  {id:"pink",name:"Pink",price:100,rarity:"rare",hex:"#f472b6"},{id:"cyan",name:"Cyan",price:100,rarity:"rare",hex:"#22d3ee"},
  {id:"red",name:"Crimson",price:150,rarity:"rare",hex:"#fb7185"},{id:"white",name:"Pearl",price:250,rarity:"epic",hex:"#f8fafc"},
  {id:"rainbow",name:"Rainbow",price:500,rarity:"legendary",hex:"rainbow"},{id:"glitch",name:"Glitch",price:1000,rarity:"mythic",hex:"glitch"},
  {id:"lime",name:"Lime",price:150,rarity:"rare",hex:"#a3e635"},{id:"sky",name:"Sky",price:150,rarity:"rare",hex:"#7dd3fc"},
  {id:"magenta",name:"Magenta",price:300,rarity:"epic",hex:"#f0abfc"},{id:"sunburst",name:"Sunburst",price:350,rarity:"epic",hex:"#fdba74"}],
 fx:[
  {id:"confetti",name:"Standard Confetti",price:0,rarity:"free",emojis:["🎉","💰","✨"]},
  {id:"coins",name:"Gold Coins Fall",price:50,rarity:"common",emojis:["🪙","💰","💵"]},
  {id:"fireworks",name:"Fireworks",price:100,rarity:"uncommon",emojis:["🎆","🎇","✨"]},
  {id:"star",name:"Star Burst",price:150,rarity:"rare",emojis:["⭐","🌟","💫"]},
  {id:"laser",name:"Laser Show",price:300,rarity:"epic",emojis:["💈","🔆","⚡"]},
  {id:"money",name:"Money Rain",price:300,rarity:"epic",emojis:["💸","💵","🤑"]},
  {id:"phoenix",name:"Phoenix Rise",price:600,rarity:"legendary",emojis:["🔥","🦅","✨"]},
  {id:"cherry",name:"Cherry Blossom",price:250,rarity:"epic",emojis:["🌸","🌺","✨"]},
  {id:"thunder",name:"Thunder Storm",price:450,rarity:"epic",emojis:["⚡","🌩️","💥"]},
  {id:"aurora-burst",name:"Aurora Burst",price:550,rarity:"legendary",emojis:["🌌","✨","💫"]},
  {id:"trophy",name:"Trophy Shower",price:700,rarity:"legendary",emojis:["🏆","🥇","✨"]},
  {id:"dragon",name:"Dragon Roar",price:1200,rarity:"mythic",emojis:["🐉","🔥","💥"]},
  {id:"love",name:"Heart Storm",price:400,rarity:"epic",emojis:["❤️","💖","💘"]},
  {id:"snow",name:"Snow Flurry",price:350,rarity:"epic",emojis:["❄️","🌨️","☃️"]},
  {id:"pizza",name:"Pizza Party",price:300,rarity:"epic",emojis:["🍕","🧀","🍅"]}],
 themes:[
  {id:"midnight",name:"Midnight",price:0,rarity:"free",bg:""},
  {id:"ocean",name:"Ocean",price:50,rarity:"common",bg:"linear-gradient(135deg,rgba(14,116,144,.25),rgba(8,47,73,.4))"},
  {id:"forest",name:"Forest",price:100,rarity:"uncommon",bg:"linear-gradient(135deg,rgba(22,101,52,.25),rgba(6,46,26,.4))"},
  {id:"sunset",name:"Sunset",price:150,rarity:"rare",bg:"linear-gradient(135deg,rgba(194,65,12,.25),rgba(120,53,15,.4))"},
  {id:"space",name:"Space",price:300,rarity:"epic",bg:"radial-gradient(circle at 30% 20%,rgba(var(--violet2-rgb),.25),rgba(11,16,32,.5))"},
  {id:"casino",name:"Casino Gold",price:300,rarity:"epic",bg:"radial-gradient(circle at 50% 0%,rgba(var(--gold-rgb),.18),rgba(11,16,32,.5))"},
  {id:"aurora",name:"Aurora",price:600,rarity:"legendary",bg:"linear-gradient(135deg,rgba(var(--green-rgb),.15),rgba(var(--blue-rgb),.15),rgba(var(--purple-rgb),.15))"},
  {id:"desert",name:"Desert Gold",price:200,rarity:"rare",bg:"linear-gradient(135deg,rgba(245,158,11,.22),rgba(120,53,15,.38))"},
  {id:"icepalace",name:"Ice Palace",price:350,rarity:"epic",bg:"linear-gradient(135deg,rgba(125,211,252,.22),rgba(30,64,175,.36))"},
  {id:"royalhall",name:"Royal Hall",price:700,rarity:"legendary",bg:"radial-gradient(circle at 50% 0%,rgba(var(--violet2-rgb),.28),rgba(46,16,101,.45))"},
  {id:"lava",name:"Lava Chamber",price:850,rarity:"legendary",bg:"linear-gradient(135deg,rgba(220,38,38,.25),rgba(67,20,7,.55))"},
  {id:"cyber",name:"Neon Cyberpunk",price:1000,rarity:"mythic",bg:"linear-gradient(135deg,rgba(236,72,153,.18),rgba(var(--cyan2-rgb),.18))"},
  {id:"nightlife",name:"Nightlife",price:300,rarity:"epic",bg:"linear-gradient(135deg,rgba(var(--purple-rgb),.22),rgba(15,23,42,.5))"},
  {id:"embergarden",name:"Ember Garden",price:550,rarity:"legendary",bg:"linear-gradient(135deg,rgba(251,146,60,.22),rgba(69,26,3,.45))"},
  {id:"arcade",name:"Retro Arcade",price:650,rarity:"legendary",bg:"repeating-linear-gradient(45deg,rgba(34,211,238,.14),rgba(34,211,238,.14) 12px,rgba(236,72,153,.14) 12px,rgba(236,72,153,.14) 24px)"},
  {id:"valentine",name:"Rose Garden",price:600,rarity:"legendary",bg:"radial-gradient(circle at 50% 0%,rgba(244,114,182,.25),rgba(76,5,25,.4))"}],
 sounds:[
  {id:"standard",name:"Standard",price:0,rarity:"free",wave:["triangle","sine"]},
  {id:"8bit",name:"8-Bit Retro",price:50,rarity:"common",wave:["square","square"]},
  {id:"orch",name:"Orchestral",price:100,rarity:"uncommon",wave:["triangle","sawtooth"]},
  {id:"dj",name:"DJ Mix",price:200,rarity:"rare",wave:["sawtooth","square"]},
  {id:"trailer",name:"Movie Trailer",price:300,rarity:"epic",wave:["sine","sawtooth"]},
  {id:"synth",name:"Synthwave",price:250,rarity:"epic",wave:["sawtooth","triangle"]},
  {id:"crystal",name:"Crystal Chime",price:350,rarity:"epic",wave:["sine","sine"]},
  {id:"bass",name:"Deep Bass",price:450,rarity:"legendary",wave:["square","sine"]},
  {id:"choir",name:"Epic Choir",price:500,rarity:"legendary",wave:["sine","triangle"]},
  {id:"wind",name:"Wind Chimes",price:220,rarity:"rare",wave:["sine","triangle"]},
  {id:"dub",name:"Dubstep",price:600,rarity:"legendary",wave:["sawtooth","square"]}],
 emojis:[
  {id:"fire",ch:"🔥",name:"Fire",price:25,rarity:"common"},{id:"party",ch:"🎉",name:"Party",price:25,rarity:"common"},
  {id:"down",ch:"👎",name:"Thumbs down",price:25,rarity:"common"},{id:"drool",ch:"🤤",name:"Drooling",price:50,rarity:"uncommon"},
  {id:"poop",ch:"💩",name:"Poop",price:50,rarity:"uncommon"},{id:"angry",ch:"😤",name:"Angry",price:50,rarity:"uncommon"},
  {id:"think",ch:"🤔",name:"Thinking",price:100,rarity:"rare"},{id:"explode",ch:"🤯",name:"Exploding head",price:100,rarity:"rare"},
  {id:"nerd",ch:"🤓",name:"Nerdy",price:100,rarity:"rare"},{id:"money",ch:"🤑",name:"Money face",price:200,rarity:"epic"},
  {id:"crown",ch:"👑",name:"Crown",price:200,rarity:"epic"},{id:"ctrl",ch:"🎮",name:"Controller",price:200,rarity:"epic"},
  {id:"gem",ch:"💎",name:"Diamond",price:400,rarity:"legendary"},{id:"slot",ch:"🎰",name:"Slot",price:400,rarity:"legendary"},
  {id:"hundo",ch:"💯",name:"100",price:500,rarity:"legendary"},
  {id:"rocket",ch:"🚀",name:"Rocket",price:150,rarity:"rare"},{id:"trophy",ch:"🏆",name:"Trophy",price:250,rarity:"epic"},
  {id:"robot",ch:"🤖",name:"Robot",price:150,rarity:"rare"},{id:"alien",ch:"👽",name:"Alien",price:250,rarity:"epic"},
  {id:"fox",ch:"🦊",name:"Fox",price:100,rarity:"rare"},{id:"panda",ch:"🐼",name:"Panda",price:100,rarity:"rare"},
  {id:"starstruck",ch:"🤩",name:"Star-struck",price:250,rarity:"epic"},{id:"devil",ch:"😈",name:"Devil",price:300,rarity:"epic"},
  {id:"angel",ch:"😇",name:"Angel",price:300,rarity:"epic"},{id:"cowboy",ch:"🤠",name:"Cowboy",price:200,rarity:"rare"},
  {id:"unicorn",ch:"🦄",name:"Unicorn",price:400,rarity:"legendary"},{id:"pizza",ch:"🍕",name:"Pizza",price:150,rarity:"rare"},
  {id:"eye",ch:"👁️",name:"Seeing Eye",price:350,rarity:"epic"},{id:"vibes",ch:"✨",name:"Sparkles",price:250,rarity:"epic"}],
 cardbacks:[
  {id:"classic",name:"Classic Red",price:0,rarity:"free",bg:"#7f1d1d"},
  {id:"stripes",name:"Gold Stripes",price:25,rarity:"common",bg:"linear-gradient(45deg,#3b2f10,#f6c453)"},
  {id:"azure",name:"Azure Wave",price:50,rarity:"uncommon",bg:"linear-gradient(135deg,#0c4a6e,#38bdf8)"},
  {id:"neon",name:"Neon Pulse",price:75,rarity:"uncommon",bg:"linear-gradient(135deg,#7c3aed,#22d3ee)"},
  {id:"royal",name:"Royal Court",price:150,rarity:"rare",bg:"linear-gradient(135deg,#3b0764,#a855f7)"},
  {id:"knight",name:"Knight Plate",price:200,rarity:"rare",bg:"linear-gradient(135deg,#334155,#94a3b8)"},
  {id:"galaxy",name:"Galaxy Back",price:300,rarity:"epic",bg:"radial-gradient(circle at 30% 30%,#6366f1,#0f172a)"},
  {id:"dragon",name:"Dragon Scale",price:600,rarity:"legendary",bg:"linear-gradient(135deg,#166534,#f43f5e)"},
  {id:"phoenix",name:"Phoenix Feather",price:750,rarity:"legendary",bg:"linear-gradient(135deg,#ea580c,#facc15)"},
  {id:"void",name:"Void Back",price:1000,rarity:"mythic",bg:"linear-gradient(135deg,#0f172a,#111827,#4c1d95)"},
  {id:"diamondback",name:"Diamond Weave",price:850,rarity:"legendary",bg:"linear-gradient(135deg,#bae6fd,#f8fafc)"},
  {id:"mirror",name:"Mirror Shine",price:1250,rarity:"mythic",bg:"conic-gradient(#f8fafc,#cbd5e1,#e2e8f0,#f8fafc)"}]
};
const SHOP_CATS=[
 {id:"skins",name:"🪙 Coin Skins",type:"coin"},{id:"flags",name:"🏳️ Flags",type:"flag"},
 {id:"avatars",name:"🦸 Personas",type:"avi"},{id:"frames",name:"🖼️ Frames",type:"frame"},
 {id:"colours",name:"💬 Chat Colours",type:"swatch"},{id:"fx",name:"🎊 Victory FX",type:"emoji"},
 {id:"themes",name:"🎨 Table Themes",type:"theme"},{id:"sounds",name:"🎵 Sound Packs",type:"sound"},
 {id:"emojis",name:"😀 Premium Emojis",type:"emoji"},{id:"cardbacks",name:"🃏 Card Backs",type:"cardback"}];
const FREE_EMOJIS=["👍","😂","😱"];
function grantOwned(cat,id){S.owned[cat]=S.owned[cat]||[];if(!S.owned[cat].includes(id))S.owned[cat].push(id);}
function currentVipEntitlements(){const v=vipFor(S.monthWagered);return {tier:v.tier,shopDiscount:VIP_DISC[v.tier]||0,tournamentDiscount:VIP_TOURNEY_DISC[v.tier]||0,queuePriority:v.tier>=3,birthdayEligible:v.tier>=6,prioritySupport:v.tier>=7,earlyAccess:v.tier>=8,title:v.tier>=8?"Legend":v.tier>=7?"Royal Crown":"",goldName:v.tier>=8};}
function applyVipUnlocks(notify=true){
  if(!S||!S.owned)return;const current=vipFor(S.monthWagered),before=S.vipUnlockedTier||1,target=Math.max(before,current.tier);S.vipBenefits=S.vipBenefits||{unlockedAt:{1:Date.now()}};S.vipBenefits.unlockedAt=S.vipBenefits.unlockedAt||{1:Date.now()};
  if(target>=2)grantOwned("colours","blue");if(target>=3)grantOwned("frames","gold");if(target>=4)grantOwned("skins","platinum-vip");if(target>=5)grantOwned("skins","diamond-vip");if(target>=6)grantOwned("frames","blackdiamond");if(target>=8){grantOwned("skins","legend");grantOwned("skins","eternal");}
  const emojiCount=VIP_EMOJI_COUNTS[target]||0;COS.emojis.slice(0,emojiCount).forEach(e=>grantOwned("emojis",e.id));
  for(let t=before+1;t<=target;t++)S.vipBenefits.unlockedAt[t]=Date.now();S.vipUnlockedTier=target;S.vipBenefits.birthdayEligible=target>=6;
  if(current.tier>before){
    if(current.tier===2&&S.equipped.colour==="default")S.equipped.colour="blue";
    if(current.tier===3&&S.equipped.frame==="none")S.equipped.frame="gold";
    if(current.tier===4&&S.equipped.skin==="classic")S.equipped.skin="platinum-vip";
    if(current.tier===5&&["classic","platinum-vip"].includes(S.equipped.skin))S.equipped.skin="diamond-vip";
    if(current.tier===6)S.equipped.frame="blackdiamond";
    if(current.tier===8)S.equipped.skin="legend";
    if(notify){toast(`💎 VIP upgraded to <b>${current.name}</b> — permanent rewards unlocked!`,"jp");addFeed(`💎 <b>You</b> reached ${current.name} VIP and unlocked new benefits`);}
  }
}
let sessionStart=Date.now(), selfExUntil=0;

const HUB={community:"friends",newgames:"wheel",progression:"pass",economy:"crates",services:"platform"};
const HISTORY={tab:"games",page:1,search:"",sort:"time-desc",size:20};
let lastLossStreak=0;

export function bind(){
  (function(){
    const used=new Set(BOTS_SEED.map(b=>b.name));
    const first=["Aarav","Vihaan","Arjun","Sai","Reyansh","Krishna","Ishaan","Rohan","Aditya","Kabir",
      "Ananya","Diya","Isha","Kavya","Meera","Nisha","Pooja","Riya","Sara","Tara",
      "Liam","Noah","Oliver","Ethan","Mason","Lucas","Logan","James","Henry","Owen",
      "Olivia","Emma","Ava","Mia","Sophia","Isabella","Charlotte","Amelia","Harper","Evelyn",
      "Yuki","Haruto","Sora","Ren","Hina","Aoi","Daiki","Hiroshi","Kenji","Misaki",
      "Chen","Wei","Ming","Lei","Jun","Yuan","Tao","Huan","Bao","Guiying",
      "Olu","Kwame","Ade","Tunde","Chidi","Dakarai","Jabari","Kofi","Sefu","Zuberi",
      "Sven","Bjorn","Erik","Lars","Anders","Gunnar","Magnus","Nils","Olaf","Tor",
      "Diego","Santiago","Mateo","Alejandro","Javier","Carlos","Luis","Miguel","Rafael","Pablo",
      "Pierre","Louis","Henri","Antoine","Thomas","Nicolas","Julien","Francois","Hugo","Maxime",
      "Ahmed","Hassan","Omar","Ali","Yusuf","Karim","Tariq","Rashid","Imran","Malik"];
    const initials="ABCDEFGHJKLMNPRSTVWXYZ";
    const countries=[
      ["India","🇮🇳"],["Brazil","🇧🇷"],["USA","🇺🇸"],["UK","🇬🇧"],["Japan","🇯🇵"],["Germany","🇩🇪"],
      ["UAE","🇦🇪"],["South Korea","🇰🇷"],["Mexico","🇲🇽"],["Canada","🇨🇦"],["Australia","🇦🇺"],["Italy","🇮🇹"],
      ["France","🇫🇷"],["Spain","🇪🇸"],["Norway","🇳🇴"],["Sweden","🇸🇪"],["Ghana","🇬🇭"],["China","🇨🇳"],
      ["Russia","🇷🇺"],["Nigeria","🇳🇬"],["Argentina","🇦🇷"],["Netherlands","🇳🇱"],["Turkey","🇹🇷"],["Egypt","🇪🇬"],
      ["Indonesia","🇮🇩"],["Philippines","🇵🇭"],["Vietnam","🇻🇳"],["Thailand","🇹🇭"],["Poland","🇵🇱"],["Netherlands","🇳🇱"]];
    const titles=["Flipper","Duelist","Grinder","Regular","Whale","Strategist","Rookie","Veteran","Sniper","All-Rounder",
      "Night Shift","Morning Person","Lucky Charm","Underdog","Comeback Kid","Iron Will","Wildcard","Dark Horse","High Stakes","Cool Head"];
    const bios=[
      "Plays during lunch break. Reliable HEADS picker.",
      "Here for the leaderboard. Not here to make friends.",
      "Tails never fails me. (It does, often.)",
      "I play the numbers. The numbers play me back.",
      "Bo5 enjoyer. Will take your cup.",
      "I buy every skin. Regret nothing.",
      "Silent type. Let the coin do the talking.",
      "Chasing a jackpot since season 1.",
      "Small stakes, big dreams.",
      "I only play when the pool is armed.",
      "Math major. Calculating. Beep boop.",
      "Coffee, coin, repeat."];
    const av=["🧑","👩","👨","🧑‍🦰","👨‍🦰","👩‍🦳","👨‍🦳","🧔","👱","👱‍♀️","👲","🧕","👮","🕵️","💂","👷",
      "🤴","👸","🥷","🧙","🧝","🧛","🧟","🧞","🧜","🧚","🙂","😎","🤓","🧐",
      "🦸","🦹","🧑‍🎓","👨‍🎓","👩‍🎓","🧑‍🏫","👨‍🍳","👩‍🍳","🧑‍🔧","👨‍🔧","🧑‍🌾","👨‍✈️","🧑‍🚀","👩‍🚀","🧑‍💻","👨‍💻",
      "🧑‍🎨","👩‍🎨","🧑‍🎤","👨‍🎤","🧑‍🚒","👩‍🚒","🧑‍🏭","🦸‍♂️","🦸‍♀️","🦹‍♂️"];
    const skins=["classic","silver","bronze","neon","arctic","ember","ruby","emerald","sapphire","bitcoin","koi","galaxy"];
    let fi=0;
    while(BOTS_SEED.length<99){
      let base=first[fi%first.length]; fi++;
      let name=base; let tries=0;
      while(used.has(name)&&tries<30){
        name=base+" "+initials[Math.floor(Math.random()*initials.length)]+".";
        tries++;
      }
      if(used.has(name))continue;
      used.add(name);
      const c=countries[Math.floor(Math.random()*countries.length)];
      BOTS_SEED.push({
        name,avi:av[Math.floor(Math.random()*av.length)],flag:c[1],balance:0,
        level:2+Math.floor(Math.random()*18),country:c[0],
        title:titles[Math.floor(Math.random()*titles.length)],about:bios[Math.floor(Math.random()*bios.length)],
        skin:skins[Math.floor(Math.random()*skins.length)],joined:1+Math.floor(Math.random()*20)
      });
    }
  })();
}


/* expose top-level symbols to globalThis so legacy inline handlers and the shared theme engine can resolve them */
Object.assign(globalThis,{ACHIEVEMENTS,COS,FREE_EMOJIS,HISTORY,HUB,QUESTS_SEED,SHOP_CATS,applyVipUnlocks,currentVipEntitlements,grantOwned,lastLossStreak,selfExUntil,sessionStart});

export {ACHIEVEMENTS,COS,FREE_EMOJIS,HISTORY,HUB,QUESTS_SEED,SHOP_CATS,applyVipUnlocks,currentVipEntitlements,grantOwned,lastLossStreak,selfExUntil,sessionStart};
