/* TossMatch admin module — _top */
import "../shared/runtime.js";
import {applyTheme} from "../shared/theme.js";

const SAVE_KEY="tossmatch_v8",BOT_CHANNEL_NAME="tossmatch_bot_live_v1";
const ADMIN_LIVE_ID="admin-"+(sessionStorage.adminLiveId||(sessionStorage.adminLiveId=Math.random().toString(36).slice(2)));
const botLiveChannel=typeof BroadcastChannel!=="undefined"?new BroadcastChannel(BOT_CHANNEL_NAME):null;
let lastPlayerAliveAt=0;

const VIP_BENEFIT_LABELS={1:"Basic access · quests · jackpot",2:"Blue chat · 1 emoji",3:"Gold frame · priority queue · 2 emojis",4:"Platinum skin · 2 emojis",5:"Diamond skin · tournament −5% · 3 emojis",6:"Animated frame · birthday eligible · tournament −10% · shop −10% · 5 emojis",7:"Royal Crown · tournament −10% · shop −20% · priority support · 8 emojis",8:"Legend skins · tournament −15% · shop −30% · all emojis · gold name · early access"};
const FEATURE_DIRECTORY=[
 {cat:'Core Games',code:'CORE-1',name:'Coin Toss',desc:'Escrowed HEADS/TAILS P2P match with fee, jackpot, proof, manual take and auto-match.',status:'Implemented',tab:'play'},
 {cat:'Core Games',code:'CORE-2',name:'P2P Catalog',desc:'Thirty-three proof-driven games with per-game queues, manual take, carries and history.',status:'Implemented',tab:'games'},
 {cat:'Core Games',code:'CORE-3',name:'Series Cups',desc:'Bo3, Bo5, Bo7 and Advantage Cups for player-vs-bot and unattended bot-vs-bot play.',status:'Implemented',tab:'series'},
 {cat:'Core Games',code:'CORE-4',name:'Tournaments',desc:'Single-flip and Bo3 brackets with bot fill, VIP discount and 75/25 prizes.',status:'Implemented',tab:'series',admin:'trny'},
 {cat:'Core Games',code:'CORE-5',name:'Jackpot',desc:'Fee-funded, threshold-armed byte-00 jackpot with rollover.',status:'Implemented',tab:'play',admin:'rates'},
 {cat:'Core Games',code:'CORE-6',name:'Fairness Verifier',desc:'Local SHA-256 recomputation for retained Coin and Catalog proof inputs.',status:'Implemented',tab:'verify'},
 {cat:'Social & Community',code:'S1',name:'Friends & Buddies',desc:'Friend list, bot requests and connections, online status, direct challenge and friend-first bets.',status:'Implemented',tab:'community',feature:'friends'},
 {cat:'Social & Community',code:'S2',name:'Private Rooms',desc:'Invite/friend access, custom game and stake rules, details and history.',status:'Implemented',tab:'community',feature:'rooms'},
 {cat:'Social & Community',code:'S3',name:'Player Profiles',desc:'Stats, VIP, skill, cosmetics, achievements, form graph and recent games.',status:'Implemented',tab:'community',feature:'profile'},
 {cat:'Social & Community',code:'S4',name:'Spectator Mode',desc:'Animated viewer with participants, picks, pot, fee, result and proof.',status:'Implemented',tab:'community',feature:'spectate'},
 {cat:'Social & Community',code:'S5',name:'Gifting',desc:'MAIN coin and paid cosmetic gifts with fee, minimum, cap and history.',status:'Implemented',tab:'community',feature:'gifts'},
 {cat:'Social & Community',code:'S6',name:'Lobby Chat',desc:'Text, owned emojis, autonomous bot conversation, replies, mute/block and sent history.',status:'Implemented',tab:'community',feature:'chat'},
 {cat:'Social & Community',code:'S7',name:'Clans & Teams',desc:'Clan identity, roster, team matches, tournaments, leaderboard and history.',status:'Implemented',tab:'community',feature:'clans'},
 {cat:'Arcade+ Games',code:'G1',name:'Lucky Wheel',desc:'Daily free and paid spins with coin and cosmetic prizes.',status:'Implemented',tab:'newgames',feature:'wheel'},
 {cat:'Arcade+ Games',code:'G2',name:'Scratch Cards',desc:'Three card tiers, nine reveals and match-based payouts.',status:'Implemented',tab:'newgames',feature:'scratch'},
 {cat:'Arcade+ Games',code:'G3',name:'Dice Roll',desc:'Exact double 30× or low/high range 1.8×.',status:'Implemented',tab:'newgames',feature:'dice'},
 {cat:'Arcade+ Games',code:'G4',name:'Weekly Raffle',desc:'Player/bot tickets with 80% winner payout and 20% house share.',status:'Implemented',tab:'newgames',feature:'raffle'},
 {cat:'Arcade+ Games',code:'G5',name:'Multiplier Ladder P2P',desc:'Matched rung-or-bust P2P duel with split handling.',status:'Implemented',tab:'newgames',feature:'ladder'},
 {cat:'Arcade+ Games',code:'G6',name:'War Card Game',desc:'2–Ace cards with automatic War rounds and P2P settlement.',status:'Implemented',tab:'newgames',feature:'war'},
 {cat:'Core Games',code:'CAT18',name:'Rock Paper Scissors Duel',desc:'Two hidden simultaneous picks; standard RPS winner takes the post-fee P2P pot.',status:'Implemented',tab:'games',feature:'rps'},
 {cat:'Core Games',code:'CAT19',name:'Closest to 21',desc:'Each player receives proof-derived cards; closest total to 21 without exceeding it wins.',status:'Implemented',tab:'games',feature:'closest21'},
 {cat:'Core Games',code:'CAT20',name:'Triple Coin Majority',desc:'Players select HEADS or TAILS and three proof flips decide the majority side.',status:'Implemented',tab:'games',feature:'triplecoin'},
 {cat:'Core Games',code:'CAT21',name:'Sequence Builder',desc:'Players choose different two-symbol starters and extend a proof sequence toward a target pattern.',status:'Implemented',tab:'games',feature:'sequencebuilder'},
 {cat:'Core Games',code:'CAT22',name:'Dice Sum Duel',desc:'Each participant receives two proof-derived dice; the higher sum wins and equal sums split.',status:'Implemented',tab:'games',feature:'dicesumduel'},
 {cat:'Core Games',code:'CAT23',name:'Colour Spectrum Duel',desc:'Players claim different colour bands mapped across byte 0–255; result inside a claimed band wins.',status:'Implemented',tab:'games',feature:'colourspectrum'},
 {cat:'Core Games',code:'CAT24',name:'Prime vs Composite',desc:'Opposite picks resolve from a number between 2 and 251; primality determines the winner.',status:'Implemented',tab:'games',feature:'primecomposite'},
 {cat:'Core Games',code:'CAT25',name:'Median Number Battle',desc:'Two player picks and one proof number form three values; the player closest to the median wins.',status:'Implemented',tab:'games',feature:'medianbattle'},
 {cat:'Core Games',code:'CAT26',name:'Streak Survivor',desc:'Opposite sides race through proof flips; the first side to achieve a four-result streak wins.',status:'Implemented',tab:'games',feature:'streaksurvivor'},
 {cat:'Core Games',code:'CAT27',name:'Territory Capture',desc:'Players claim non-overlapping map sectors and successive proof bytes capture territory until majority.',status:'Implemented',tab:'games',feature:'territory'},
 {cat:'Core Games',code:'CAT28',name:'Modulo Four Duel',desc:'Two players claim different remainders from 0–3; a proof byte modulo four decides, while unclaimed results carry.',status:'Implemented',tab:'games',feature:'modulo4'},
 {cat:'Core Games',code:'CAT29',name:'Poker High Duel',desc:'Five proof-derived cards per entrant; standard hand rank determines the P2P winner.',status:'Implemented',tab:'games',feature:'pokerhigh'},
 {cat:'Core Games',code:'CAT30',name:'Three Dice Poker',desc:'Three proof dice each; triple beats pair, then total/high die, with exact ties split.',status:'Implemented',tab:'games',feature:'threedicepoker'},
 {cat:'Core Games',code:'CAT31',name:'Last Digit Duel',desc:'Different 0–9 picks compete against a proof number last digit; unclaimed digits carry.',status:'Implemented',tab:'games',feature:'lastdigit'},
 {cat:'Core Games',code:'CAT32',name:'Binary Code Duel',desc:'Different three-bit codes compete by Hamming distance to the proof code; equal distance splits.',status:'Implemented',tab:'games',feature:'binaryduel'},
 {cat:'Core Games',code:'CAT33',name:'Coin Balance Battle',desc:'Distinct predictions compete on the number of HEADS in ten proof flips; equal distance splits.',status:'Implemented',tab:'games',feature:'coinbalance'},
 {cat:'Arcade+ Games',code:'G7',name:'Plinko Drop',desc:'Drop a chip through a proof-derived peg path into prize multiplier slots.',status:'Implemented',tab:'newgames',feature:'plinko'},
 {cat:'Arcade+ Games',code:'G8',name:'Mini Slots',desc:'Three proof-derived reels with transparent symbol odds, paylines and capped prizes.',status:'Implemented',tab:'newgames',feature:'slots'},
 {cat:'Arcade+ Games',code:'G9',name:'Quick Keno',desc:'Pick numbers from a compact board and compare them with proof-derived draws.',status:'Implemented',tab:'newgames',feature:'keno'},
 {cat:'Arcade+ Games',code:'G10',name:'Bingo Rush',desc:'Fast 3×3 card with proof draws; complete a line before the draw limit.',status:'Implemented',tab:'newgames',feature:'bingo'},
 {cat:'Arcade+ Games',code:'G11',name:'Treasure Hunt',desc:'Choose tiles on a hidden map containing coins, multipliers, keys and traps.',status:'Implemented',tab:'newgames',feature:'treasure'},
 {cat:'Arcade+ Games',code:'G12',name:'Memory Match',desc:'Resolve eight proof-driven memory moves and earn published pair-count prizes.',status:'Implemented',tab:'newgames',feature:'memory'},
 {cat:'Arcade+ Games',code:'G13',name:'Drop Ball',desc:'Release a ball into columns with proof-derived bounce direction and visible multiplier pockets.',status:'Implemented',tab:'newgames',feature:'dropball'},
 {cat:'Arcade+ Games',code:'G14',name:'Daily Trivia',desc:'One proof-retained daily question attempt; a correct answer pays the published 3× reward.',status:'Implemented',tab:'newgames',feature:'trivia'},
 {cat:'Arcade+ Games',code:'G15',name:'Fishing Reel',desc:'Cast, wait and reel proof-derived fish rarities for collection and coin rewards.',status:'Implemented',tab:'newgames',feature:'fishing'},
 {cat:'Arcade+ Games',code:'G16',name:'Penalty Shootout',desc:'Pick shot direction against a proof-derived goalkeeper for a five-kick score challenge.',status:'Implemented',tab:'newgames',feature:'penalty'},
 {cat:'Arcade+ Games',code:'G17',name:'Coin Pusher',desc:'Five proof-derived drops push stacks toward published 0×–6× reward trays.',status:'Implemented',tab:'newgames',feature:'coinpusher'},
 {cat:'Arcade+ Games',code:'G18',name:'Tower Builder',desc:'Choose floor 3, 5 or 7 and survive every proof-derived risk check for the published multiplier.',status:'Implemented',tab:'newgames',feature:'tower'},
 {cat:'Arcade+ Games',code:'G19',name:'Match-3 Rush',desc:'A proof-derived 5×5 gem board pays by horizontal and vertical three-symbol matches.',status:'Implemented',tab:'newgames',feature:'match3'},
 {cat:'Arcade+ Games',code:'G20',name:'Mystery Vault',desc:'Choose one of five keys; the proof-selected winning key pays 4.5×.',status:'Implemented',tab:'newgames',feature:'vault'},
 {cat:'Arcade+ Games',code:'G21',name:'Crash',desc:'Restored classic: cash out before the proof-derived bust point; published 97% RTP curve with auto cash-out.',status:'Implemented',tab:'newgames',feature:'crash'},
 {cat:'Arcade+ Games',code:'G22',name:'Hi-Lo',desc:'Restored classic: build a higher-or-lower card streak at 1.7× per correct guess and bank at any time.',status:'Implemented',tab:'newgames',feature:'hilo'},
 {cat:'Arcade+ Games',code:'G23',name:'Mines',desc:'Restored classic: reveal gems on a 5×5 board while avoiding proof-placed mines; multiplier rises per gem.',status:'Implemented',tab:'newgames',feature:'mines'},
 {cat:'Progression',code:'P1',name:'Battle Pass',desc:'Monthly free/premium XP milestones and reward claims.',status:'Implemented',tab:'progressionplus',feature:'pass'},
 {cat:'Progression',code:'P2',name:'7-Day Login Calendar',desc:'Escalating automatic rewards with day-7 cosmetic and BONUS.',status:'Implemented',tab:'progressionplus',feature:'calendar'},
 {cat:'Progression',code:'P3',name:'Weekly Challenges',desc:'Wins, game variety and streak goals with larger rewards.',status:'Implemented',tab:'progressionplus',feature:'weekly'},
 {cat:'Progression',code:'P4',name:'Prestige',desc:'Level reset for permanent XP boost, badge and Rainbow frame.',status:'Implemented',tab:'progressionplus',feature:'prestige'},
 {cat:'Progression',code:'P5',name:'Skill Matchmaking',desc:'Five skill tiers and preferred peer-bot matching with fallback.',status:'Implemented',tab:'progressionplus',feature:'skill'},
 {cat:'Economy+',code:'E1',name:'Mystery Crates',desc:'Four tiers with 1–3 cosmetics and a guaranteed rarity floor.',status:'Implemented',tab:'economyplus',feature:'crates'},
 {cat:'Economy+',code:'E2',name:'Trading Post',desc:'Bot listings, player sales and a 10% house transaction fee.',status:'Implemented',tab:'economyplus',feature:'trade'},
 {cat:'Economy+',code:'E3',name:'Staking Vault',desc:'Flexible staking with completed-week 1% interest and claim cap.',status:'Implemented',tab:'economyplus',feature:'staking'},
 {cat:'Economy+',code:'E4',name:'Subscriptions',desc:'Plus, Pro and Elite 30-day tiers with engagement perks.',status:'Implemented',tab:'economyplus',feature:'subscription'},
 {cat:'Economy+',code:'E5',name:'Coin Boosters',desc:'Time-limited 2× XP or +5% rakeback consumables.',status:'Implemented',tab:'economyplus',feature:'boosters'},
 {cat:'Economy+',code:'E6',name:'Cosmetic Crafting',desc:'Spend MAIN on uncommon, rare or epic rarity-floor cosmetic recipes with retained history.',status:'Implemented',tab:'economyplus',feature:'utility'},
 {cat:'Economy+',code:'E7',name:'Event Ticket Packs',desc:'Buy persistent non-payout demo utility tickets in 1, 3 or 7-ticket packs.',status:'Implemented',tab:'economyplus',feature:'utility'},
 {cat:'Economy+',code:'E8',name:'Clan Treasury',desc:'Non-withdrawable MAIN contributions create clan utility resources and levels without wagering advantage.',status:'Implemented',tab:'economyplus',feature:'utility'},
 {cat:'Economy+',code:'E9',name:'Private Room Upgrades',desc:'Unlock persistent Basic, Neon, Royal or Cosmic visual room tiers with no gameplay advantage.',status:'Implemented',tab:'economyplus',feature:'utility'},
 {cat:'Player & Retention',code:'RET-1',name:'8-Tier VIP',desc:'Monthly wager tiers, rakeback, permanent rewards, discounts and priority.',status:'Implemented',tab:'season',admin:'vip'},
 {cat:'Player & Retention',code:'RET-2',name:'Achievements & Levels',desc:'Forty-nine achievements, configurable rewards through level 50 and milestone cosmetics.',status:'Implemented',tab:'season',admin:'vip'},
 {cat:'Player & Retention',code:'RET-3',name:'Player History',desc:'Nine categories, search, sorting, pagination, details and export.',status:'Implemented',tab:'history'},
 {cat:'Player & Retention',code:'RET-4',name:'Advanced Statistics',desc:'Lifetime wager, total/max payout, fees, averages, ROI, payout trend and Player top-up analytics.',status:'Implemented',tab:'stats'},
 {cat:'Wallet & Commerce',code:'WAL-1',name:'Segmented Wallet',desc:'MAIN, BONUS, REFERRAL, RAKEBACK and BANK with stake caps.',status:'Implemented',tab:'wallet'},
 {cat:'Wallet & Commerce',code:'WAL-2',name:'Deposit & Top-up Analytics',desc:'Player payment-method deposits with references/status and bot initialization at 0 MAIN + 1,000 BONUS, required first-top-up gate, Admin promotion control and complete Player/bot analytics.',status:'Implemented',tab:'stats',admin:'topups'},
 {cat:'Wallet & Commerce',code:'WAL-5',name:'Player Deposits & Withdrawals',desc:'Demo deposit confirmation/receipt (method, reference, processing state) and KYC-verified withdrawals with min checks and full Admin visibility.',status:'Implemented',tab:'wallet',admin:'withdraw'},
 {cat:'Wallet & Commerce',code:'WAL-3',name:'Shop & Cosmetics',desc:'Nine expanded categories, 38 new items, VIP rewards, discounts and equip controls.',status:'Implemented',tab:'shop'},
 {cat:'Wallet & Commerce',code:'WAL-4',name:'Transfers & Bot Economy',desc:'Bots start at 0 MAIN + 1,000 BONUS, complete a varied first MAIN top-up before activity, then use active economy, later top-ups and roster growth.',status:'Implemented',tab:'wallet',admin:'ops'},
 {cat:'Operations',code:'OPS-1',name:'Command Center',desc:'KPIs, live bot-engine status, alerts, quick actions, revenue, top-up volume, jackpot and RNG monitoring.',status:'Implemented',admin:'dash'},
 {cat:'Operations',code:'OPS-2',name:'Feature Hub',desc:'B1–B4 telemetry and feature administration controls.',status:'Implemented',admin:'features'},
 {cat:'Operations',code:'OPS-3',name:'Audit & Exports',desc:'Audit trail, review flags, filtering, pagination and data exports.',status:'Implemented',admin:'audit'},
 {cat:'Operations',code:'OPS-4',name:'Promotions Manager',desc:'Scheduled campaigns now support Player credit/cash-drop claims, next-top-up activation, one-claim tracking and Admin counts.',status:'Implemented',tab:'services',feature:'offers',admin:'promo'},
 {cat:'Operations',code:'OPS-5',name:'Withdrawals',desc:'Bots file cash-outs when MAIN reaches a personal 3,000-5,000 trigger; the Admin ledger tracks paid bot requests and the demo player\'s KYC-verified withdrawals with references.',status:'Implemented',admin:'withdraw'},
 {cat:'Operations',code:'OPS-6',name:'Player Directory',desc:'Searchable, sortable Admin table of the demo player and the full simulated roster with balances, records, net, level and top-ups.',status:'Implemented',admin:'people'},
 {cat:'Responsible Gaming',code:'RG-D',name:'Demo RG Controls',desc:'Persistent deposit/session limits, cool-off, durable self-exclusion, loss limit, reality graph, bank and Auto Bet stop.',status:'Implemented',tab:'services',feature:'rg',admin:'trust'},
 {cat:'Platform',code:'T1',name:'Installable PWA',desc:'Manifest, 192/512 icons, install readiness and offline service-worker cache.',status:'Implemented',tab:'services',feature:'platform',admin:'trust'},
 {cat:'Platform',code:'T2',name:'Multi-language',desc:'Persistent English, Hindi, Bengali, Tamil and Telugu primary navigation/Home translations.',status:'Implemented',tab:'services',feature:'platform',admin:'trust'},
 {cat:'Platform',code:'T3',name:'Public API',desc:'Working in-browser API explorer, key rotation, OpenAPI spec and request log; server API still required.',status:'Partial',tab:'services',feature:'api',admin:'trust'},
 {cat:'Platform',code:'T4',name:'Real-time Analytics',desc:'Cross-tab live Player bot-engine pulses plus retained player/game/revenue/queue/social/Arcade samples, KPIs, chart and export.',status:'Implemented',admin:'trust'},
 {cat:'Platform',code:'T5',name:'Push Notifications',desc:'Browser permission, preferences, local notifications and history; remote push backend still required.',status:'Partial',tab:'services',feature:'platform',admin:'trust'},
 {cat:'Security',code:'SEC1',name:'Two-Factor Authentication',desc:'Web Crypto six-digit TOTP enrollment, verification and verified disable demo; account backend required.',status:'Partial',tab:'services',feature:'security',admin:'trust'},
 {cat:'Security',code:'SEC2',name:'Anti-Cheat Detection',desc:'Rules scan for impossible balances, extreme win rate, duplicate proof, malformed payout and Turbo risk.',status:'Implemented',tab:'services',feature:'security',admin:'trust'},
 {cat:'Security',code:'SEC3',name:'Public Fairness Page',desc:'Standalone proof verification without account access.',status:'Implemented',tab:'verify'},
 {cat:'Security',code:'SEC4',name:'Monthly Activity Statement',desc:'Monthly preview with wager, payout, fee, P/L and top-up totals plus JSON/CSV downloads and email simulation.',status:'Implemented',tab:'services',feature:'statements',admin:'trust'},
 {cat:'Responsible Gaming',code:'RG1',name:'Deposit Limits',desc:'Persistent daily/weekly/monthly limits, immediate decreases, delayed increases and enforced top-up checks.',status:'Implemented',tab:'services',feature:'rg',admin:'trust'},
 {cat:'Responsible Gaming',code:'RG2',name:'Session Time Limits',desc:'Persistent maximum duration with enforced cool-off before new games.',status:'Implemented',tab:'services',feature:'rg',admin:'trust'},
 {cat:'Responsible Gaming',code:'RG3',name:'Durable Self-Exclusion',desc:'Timed or permanent shared-state exclusion with no early Player/Admin undo.',status:'Implemented',tab:'services',feature:'rg',admin:'trust'},
 {cat:'Responsible Gaming',code:'RG4',name:'Reality Check Graph',desc:'Configurable reminders, retained session P/L points, graph and explicit up/down callout.',status:'Implemented',tab:'services',feature:'rg',admin:'trust'},
 {cat:'UX & Accessibility',code:'UX1',name:'Accessibility Center',desc:'Persistent high contrast, reduced motion, text scale, colour-vision presets and screen-reader hints.',status:'Implemented',tab:'services',feature:'ux'},
 {cat:'UX & Accessibility',code:'UX2',name:'Customizable Dashboard',desc:'Player-selected and reordered Home KPI cards and sections with reset and persistence.',status:'Implemented',tab:'services',feature:'ux'},
 {cat:'UX & Accessibility',code:'UX3',name:'Saved Bet & Game Presets',desc:'Up to 20 named Coin/Catalog/Arcade presets that fill controls without auto-wagering and retain RG checks.',status:'Implemented',tab:'services',feature:'ux'},
 {cat:'UX & Accessibility',code:'UX4',name:'Smart Game Discovery',desc:'Explainable favorite, variety, current-game, daily and collection recommendations with exact links.',status:'Implemented',tab:'services',feature:'ux'},
 {cat:'Suggested — LiveOps & Social',code:'LIVE1',name:'Event Calendar & Scheduled Play',desc:'Upcoming tournaments, Cups, promotions and reminders in one calendar with timezone support.',status:'Suggested'},
 {cat:'Suggested — LiveOps & Social',code:'LIVE2',name:'Match Replay & Shareable Proof',desc:'Step-by-step replay, share link and redacted proof package for games and tournaments.',status:'Suggested'},
 {cat:'Suggested — LiveOps & Social',code:'LIVE3',name:'Clan Seasons & Cooperative Quests',desc:'Season divisions, shared clan goals, contribution ledger, rewards and archived standings.',status:'Suggested'},
 {cat:'Suggested — Trust & Compliance',code:'TRUST1',name:'Identity, Age & Jurisdiction Checks',desc:'Age gate, KYC status, geofencing and jurisdiction-specific feature eligibility.',status:'Suggested'},
 {cat:'Suggested — Trust & Compliance',code:'TRUST2',name:'Privacy & Data Rights Center',desc:'Consent history, data export, correction and deletion requests with retention status.',status:'Suggested'},
 {cat:'Suggested — Trust & Compliance',code:'TRUST3',name:'Dispute & Support Case Center',desc:'Open cases from a game or transaction, attach proof, track SLA and record resolution.',status:'Suggested'},
 {cat:'Suggested — Trust & Compliance',code:'TRUST4',name:'Device & Session Management',desc:'View active devices, revoke sessions, detect unusual login locations and require step-up verification.',status:'Suggested'},
 {cat:'Suggested — Operations',code:'OPS5',name:'Status & Incident Center',desc:'Service health, incident timeline, maintenance updates, postmortems and player-facing status notices.',status:'Suggested'}
];
const PAGE_SIZE=20;
const DIRECTORY={search:"",category:"",status:""};
const VIEWS={withdrawals:{page:1,filter:"",sort:"time-desc"},people:{page:1,filter:"",sort:"balance"},audit:{page:1,filter:"",sort:"time-desc"},games:{page:1,filter:"",sort:"time-desc"},catalog:{page:1,filter:"",result:"",sort:"time-desc"},transfers:{page:1,filter:"",sort:"time-desc"},topups:{page:1,filter:"",sort:"time-desc"},playerTopups:{page:1,filter:"",sort:"time-desc"},levels:{page:1,filter:"",sort:"level-asc"},queue:{page:1,filter:"",sort:"wait-desc"},flags:{page:1,filter:"",sort:"time-desc"},tournaments:{page:1,status:"",sort:"time-desc"}};
const $=id=>document.getElementById(id);
const fmt=n=>Math.round(n).toLocaleString("en-IN");
function pageRows(rows,view){const pages=Math.max(1,Math.ceil(rows.length/PAGE_SIZE));view.page=Math.max(1,Math.min(view.page,pages));return {rows:rows.slice((view.page-1)*PAGE_SIZE,view.page*PAGE_SIZE),pages,total:rows.length};}
function setPager(prefix,view,meta){const lbl=$(prefix+"Page"),prev=$(prefix+"Prev"),next=$(prefix+"Next");if(lbl)lbl.textContent=`Page ${view.page} / ${meta.pages} · ${meta.total} rows`;if(prev)prev.disabled=view.page<=1;if(next)next.disabled=view.page>=meta.pages;}
function topupAnalytics(){const player=(S.rg?.deposits||[]).map(x=>{const base=+(x.base??x.amount??0),firstBonus=+(x.firstBonus||0),campaignBonus=+(x.campaignBonus||0),bonus=+(x.bonus??(firstBonus+campaignBonus)),credited=+(x.credited??(base+bonus));return {...x,base,amount:base,firstBonus,campaignBonus,bonus,credited,source:x.source||'Player wallet'};}).sort((a,b)=>(b.t||0)-(a.t||0)),bots=(S.botTopups||[]).map(x=>{const firstPromo=+(x.bonus||0),startingBonus=+(x.startingBonus||0),base=+(x.base||0),bonus=firstPromo+startingBonus,credited=+(x.walletCredit??(base+bonus));return {...x,base,firstPromo,startingBonus,bonus,credited};}).sort((a,b)=>(b.t||0)-(a.t||0)),summary=rows=>{const sum=k=>rows.reduce((n,x)=>n+(+x[k]||0),0),base=sum('base'),bonus=sum('bonus'),credited=sum('credited'),count=rows.length;return {count,base,bonus,credited,average:count?Math.round(base/count):0,largest:rows.reduce((n,x)=>Math.max(n,x.base),0),last7:rows.filter(x=>x.t>=Date.now()-7*86400000).reduce((n,x)=>n+x.base,0),last30:rows.filter(x=>x.t>=Date.now()-30*86400000).reduce((n,x)=>n+x.base,0),promoRate:base?bonus/base*100:0};};return {player,bots,playerStats:summary(player),botStats:{...summary(bots),unique:new Set(bots.map(x=>x.bot)).size,ready:S.bots.filter(b=>b.firstTopupDone).length,pending:S.bots.filter(b=>!b.firstTopupDone).length,startingBonus:bots.reduce((n,x)=>n+x.startingBonus,0),firstPromo:bots.reduce((n,x)=>n+x.firstPromo,0)},combined:{count:player.length+bots.length,base:player.reduce((n,x)=>n+x.base,0)+bots.reduce((n,x)=>n+x.base,0),bonus:player.reduce((n,x)=>n+x.bonus,0)+bots.reduce((n,x)=>n+x.bonus,0),credited:player.reduce((n,x)=>n+x.credited,0)+bots.reduce((n,x)=>n+x.credited,0)}};}
function toast(m){const t=document.createElement("div");t.className="toast";t.textContent=m;$("toasts").appendChild(t);setTimeout(()=>{t.style.opacity=0;t.style.transition=".3s";setTimeout(()=>t.remove(),300)},2800);}
function audit(action,detail=""){S.config.audit.unshift({t:Date.now(),who:"admin",action,detail});if(S.config.audit.length>50)S.config.audit.pop();}
function save(){if(applyingRemoteState)return;localStorage.setItem(SAVE_KEY,JSON.stringify(S));}
function load(){
  const d={v:11.0,config:{feePct:5,cupRakePct:5,trnyRakePct:10,jpFundPct:10,jpFloor:1,jpArm:50,jpPayPct:50,nonMainCapPct:20,transferFee:2,transferMin:10,transferCap:500,
    botTopupThreshold:500,botGrowthMax:250,botGrowthIntervalSec:15,botGrowthBatch:1,botArcadePerTick:2,wdMin:3000,wdMax:5000,wdTickChance:0.35,
    vip:[{tier:1,name:"Starter",wagered:0,rakeback:0,color:"#8d6e63"},{tier:2,name:"Silver",wagered:1000,rakeback:4,color:"#c0c0c0"},{tier:3,name:"Gold",wagered:3000,rakeback:6,color:"#ffd700"},{tier:4,name:"Platinum",wagered:8000,rakeback:8,color:"#e5e4e2"},{tier:5,name:"Diamond",wagered:20000,rakeback:12,color:"#b9f2ff"},{tier:6,name:"Black Diamond",wagered:50000,rakeback:15,color:"linear-gradient(135deg,#111827,#f43f5e)"},{tier:7,name:"Royal",wagered:75000,rakeback:17,color:"linear-gradient(135deg,#f43f5e,#fbbf24)"},{tier:8,name:"Legend",wagered:100000,rakeback:20,color:"linear-gradient(135deg,#fbbf24,#f43f5e,#a855f7)"}],
    levelRewards:Object.fromEntries(Array.from({length:49},(_,n)=>[n+2,(n+2)*50])),
    features:{autoMatch:true,quests:true,dailyLogin:true,bots:true,botGrowth:true,maintenance:false,topupPromo:true},
    broadcast:"",promotions:[],seasonNumber:1,seasonEnds:0,
    house:{capital:100000,fees:0,catalogFees:0,cupRakes:0,trnyRakes:0,shop:0,promoCost:0,comps:0,withdrawals:0,playerWithdrawals:0,deposits:0,botDeposits:0,netRevenue:0,netCash:0,xfFees:0},
    taps:0,sinks:0,audit:[],reviewFlags:[]},
    wallet:{main:1000,bonus:250,referral:50,rakeback:0,bank:0},
    level:1,xp:0,monthWagered:0,accruedRakeback:0,vipMonthKey:new Date().toISOString().slice(0,7),vipUnlockedTier:1,vipBenefits:{unlockedAt:{1:Date.now()},birthdayEligible:false},streak:0,bestStreak:0,
    quests:{settle:0,win:0,cup:0,claimed:{}},owned:{skins:["classic"],flags:[],avatars:[],frames:["none"],colours:["default"],fx:["confetti"],themes:["midnight"],sounds:["standard"],emojis:[]},
    equipped:{skin:"classic",flag:"",avatar:"",frame:"none",colour:"default",fx:"confetti",theme:"midnight",sound:"standard"},
    games:[],reactions:{},stats:{games:0,wins:0,losses:0,biggestStake:0,jackpots:0,net:0,bestWin:0,cupsWon:0,trnysWon:0},
    waiting:[],cups:[],trnys:[],x2room:[],feed:[],jackpot:120,
    bots:[],botActivity:{socialActions:0,arcadePlays:0,createdBots:0,socialLog:[],arcadeLog:[],lastCreatedAt:0},services:{apiKey:"",apiLog:[],notifications:{enabled:false},notificationLog:[],twoFactor:{secret:"",enabled:false,verifiedAt:0},antiCheat:{lastScan:0,score:0,findings:[]},promoClaims:{},activeDepositPromo:"",statements:[],emailLog:[]},rg:{depositLimits:{daily:0,weekly:0,monthly:0},pendingDepositLimits:null,deposits:[],sessionLimitMin:0,coolOffMin:1,coolOffUntil:0,selfExUntil:0,selfExPermanent:false,selfExReason:"",realityIntervalMin:5,lastRealityAt:0,sessionPoints:[]},analytics:{samples:[],lastSampleAt:0},settings:{theme:"dark",themeName:"midnight",customPalette:null,language:"en"},referralCode:"TM-0000",referredBy:"",referralCount:0,referralEarned:0,transferToday:0,transferDay:"",playerName:"",firstDepositDone:false,
    kyc:{verified:false,verifiedAt:0,name:"",docType:""},playerWithdrawals:{count:0,amount:0,log:[]},walletRefs:{deposit:1,withdraw:1},
    login:{streak:0,lastDay:""},lossLimit:0,global:{heads:0,tails:0,totalGames:0,jackpots:0},ledger:[],botTransfers:[],botTopups:[],gid:1};
  try{const raw=localStorage.getItem(SAVE_KEY);if(raw){const p=JSON.parse(raw);
    // deep merge config
    S=Object.assign(d,p);
    S.settings=Object.assign(d.settings,p.settings||{});
    S.config=Object.assign(d.config,p.config||{});
    S.config.house=Object.assign(d.config.house,(p.config&&p.config.house)||{});if(!S.config.house.playerWithdrawals)S.config.house.playerWithdrawals=0;if(S.config.house.deposits==null)S.config.house.deposits=0;if(S.config.house.botDeposits==null)S.config.house.botDeposits=0;
    S.withdrawals=Object.assign({count:0,amount:0,log:[]},p.withdrawals||{});if(!Array.isArray(S.withdrawals.log))S.withdrawals.log=[];
    S.rg.deposits=Array.isArray(p.rg&&p.rg.deposits)?p.rg.deposits:d.rg.deposits;
    S.kyc=Object.assign(d.kyc,p.kyc||{});
    S.playerWithdrawals=Object.assign({count:0,amount:0,log:[]},p.playerWithdrawals||{});if(!Array.isArray(S.playerWithdrawals.log))S.playerWithdrawals.log=[];
    S.walletRefs=Object.assign({deposit:1,withdraw:1},p.walletRefs||{});
    S.playerName=typeof p.playerName==='string'?p.playerName:'';
    S.config.features=Object.assign(d.config.features,(p.config&&p.config.features)||{});
    S.config.vip=(p.config&&p.config.vip&&p.config.vip.length===8)?p.config.vip:d.config.vip;
    S.config.levelRewards=Object.assign(d.config.levelRewards,(p.config&&p.config.levelRewards)||{});
    S.wallet=Object.assign(d.wallet,p.wallet||{});if((p.v||8)<8.2&&(p.stats?.games||0)===0&&+(p.wallet?.main||0)===5000)S.wallet.main=1000;S.v=11.0;
    S.stats=Object.assign(d.stats,p.stats||{});
    S.global=Object.assign(d.global,p.global||{});
    S.owned=Object.assign(d.owned,p.owned||{});
    S.equipped=Object.assign(d.equipped,p.equipped||{});
    S.bots=p.bots||d.bots;S.botActivity=Object.assign(d.botActivity,p.botActivity||{});S.services=Object.assign(d.services,p.services||{});S.services.twoFactor=Object.assign(d.services.twoFactor,(p.services&&p.services.twoFactor)||{});S.services.antiCheat=Object.assign(d.services.antiCheat,(p.services&&p.services.antiCheat)||{});S.rg=Object.assign(d.rg,p.rg||{});S.rg.depositLimits=Object.assign(d.rg.depositLimits,(p.rg&&p.rg.depositLimits)||{});S.analytics=Object.assign(d.analytics,p.analytics||{});
    S.feed=p.feed||[];S.games=p.games||[];S.waiting=p.waiting||[];S.cups=p.cups||[];S.trnys=p.trnys||[];S.x2room=p.x2room||[];
    S.config.promotions=p.config&&p.config.promotions||[];
    S.config.audit=p.config&&p.config.audit||[];
    S.config.reviewFlags=p.config&&p.config.reviewFlags||[];
    S.ledger=p.ledger||[];
    if(!S.config.house.xfFees)S.config.house.xfFees=0;
    reconcileHouse();
    return;
  }}catch(e){console.warn(e)}
  S=d;reconcileHouse();
}
function cfg(){return S.config;}
function houseGross(){const h=cfg().house;return (h.fees||0)+(h.catalogFees||0)+(h.cupRakes||0)+(h.trnyRakes||0)+(h.shop||0)+(h.xfFees||0);}
function houseNet(){const h=cfg().house;return houseGross()-(h.promoCost||0)-(h.comps||0);}
function houseCashIn(){const h=cfg().house;return (h.deposits||0)+(h.botDeposits||0);}
function houseCashOut(){const h=cfg().house;return (h.withdrawals||0)+(h.playerWithdrawals||0);}
function houseNetCash(){return houseCashIn()-houseCashOut();}
function reconcileHouse(){const h=cfg().house;h.netRevenue=Math.round(houseNet());h.netCash=Math.round(houseNetCash());return h;}
function processBotWithdrawals(){
  let n=0,coins=0;(S.bots||[]).forEach(bot=>{
    if(!bot||!bot.firstTopupDone)return;
    const lo=Math.max(1000,+(cfg().wdMin??3000)),hi=Math.max(lo,+(cfg().wdMax??5000));
    if(!bot.withdrawAt)bot.withdrawAt=lo+Math.floor(Math.random()*(hi-lo+1));
    if((bot.balance||0)<bot.withdrawAt)return;
    if(bot.wdCool&&Date.now()<bot.wdCool)return;
    const keep=400+Math.floor(Math.random()*800);
    let amount=Math.floor((bot.balance-keep)/50)*50;
    if(amount<500)return;
    bot.balance-=amount;
    cfg().house.withdrawals=(cfg().house.withdrawals||0)+amount;
    cfg().sinks=(cfg().sinks||0)+amount;
    if(!S.withdrawals)S.withdrawals={count:0,amount:0,log:[]};
    S.withdrawals.count=(S.withdrawals.count||0)+1;S.withdrawals.amount=(S.withdrawals.amount||0)+amount;
    bot.withdraws=(bot.withdraws||0)+1;bot.withdrawTotal=(bot.withdrawTotal||0)+amount;
    bot.withdrawAt=lo+Math.floor(Math.random()*(hi-lo+1));bot.wdCool=Date.now()+20000;
    S.withdrawals.log=S.withdrawals.log||[];S.withdrawals.log.unshift({t:Date.now(),botId:bot.id||bot.name,name:bot.name,amount,keep:bot.balance,trigger:bot.withdrawAt,status:"paid"});
    if(S.withdrawals.log.length>200)S.withdrawals.log.length=200;
    n++;coins+=amount;
  });
  return {n,coins};
}
function checkVipMonthReset(){const key=new Date().toISOString().slice(0,7);if(!S.vipMonthKey){S.vipMonthKey=key;return;}if(S.vipMonthKey!==key){S.vipMonthKey=key;S.monthWagered=0;audit("vip-month-auto-reset",key);save();}}
function renderAll(){render();}
function renderAdminLiveStatus(){const now=Date.now(),tickAge=now-lastBotTickAt,playerAge=now-lastPlayerAliveAt,syncAge=now-lastStorageSyncAt,el=$("adminLiveStatus");if(!el)return;const live=tickAge<6000,connected=playerAge<6000||syncAge<6000;el.textContent=live?`BOT ENGINE LIVE · ${fmt(S?.global?.totalGames||0)} GAMES`:connected?'PLAYER CONNECTED · SYNCING':'WAITING FOR PLAYER TAB';el.parentElement.style.color=live?'var(--green)':connected?'var(--gold)':'var(--red)';}
function sendAdminBotPulse(){if(document.visibilityState==='visible'&&botLiveChannel)botLiveChannel.postMessage({type:'admin-pulse',id:ADMIN_LIVE_ID,t:Date.now()});renderAdminLiveStatus();}
function renderAdminChrome(){
  const c=cfg(),ratio=c.taps>0?c.sinks/c.taps:0;
  $("adminClock").textContent=new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
  $("adminHeroText").textContent=c.features.maintenance?'Maintenance is active. New betting is currently paused.':'Monitor liquidity, revenue, risk and engagement across the TossMatch economy.';
  const alerts=[c.features.maintenance?{c:'danger',t:'🚧 Maintenance mode is active'}:{c:'ok',t:'● Betting services operational'},S.waiting.length>20?{c:'warn',t:`⏳ Queue depth elevated: ${S.waiting.length}`}:{c:'ok',t:`⚡ Queue healthy: ${S.waiting.length} open`},S.jackpot>=c.jpArm?{c:'warn',t:`🎰 Jackpot armed at ${fmt(S.jackpot)}`}:{c:'ok',t:`🎰 Jackpot building: ${fmt(S.jackpot)}`},ratio<.15&&c.taps>0?{c:'danger',t:`📉 Inflation risk · sink ratio ${ratio.toFixed(2)}`}:{c:'ok',t:`📈 Economy ratio ${ratio.toFixed(2)}`}];
  $("adminAlerts").innerHTML=alerts.map(a=>`<div class="admin-alert ${a.c}">${a.t}</div>`).join('');renderAdminLiveStatus();
}
function renderFeatureAdmin(){
  const social=S.social||{},fg=S.featureGames||{},ba=S.botActivity||{},eng=S.engagement||{},ep=S.economyPlus||{},sub=ep.subscription||{},stake=ep.staking||{},boost=ep.boosters||{},utility=ep.utility||{};
  const socialCount=(social.friends||[]).length+(social.chat||[]).length+(social.privateRooms||[]).length+(ba.socialActions||0);
  const arcadeCount=(fg.wheel?.spins||0)+(fg.dice?.length||0)+(fg.scratch?.length||0)+(fg.ladder?.length||0)+(fg.war?.length||0)+(fg.extended?.plays?.length||0)+(ba.arcadePlays||0);
  const progress=(eng.battlePass?.xp||0)+(eng.prestige||0)*1000;
  const economy=(ep.cratesOpened||0)+(ep.tradingListings?.length||0)+(stake.balance||0)+(utility.crafts?.length||0)+(utility.ticketPurchases?.length||0)+(utility.clanTreasury||0)+(utility.roomPurchases?.length||0);
  $("featureTiles").innerHTML=[['🤝',socialCount,'Social actions'],['🎮',arcadeCount,'Arcade sessions'],['🚀',progress,'Progress score'],['💼',economy,'Economy+ activity']].map(x=>`<div class="stat-tile"><div style="font-size:22px">${x[0]}</div><div class="v">${fmt(x[1])}</div><div class="k">${x[2]}</div></div>`).join('');
  $("communityMetrics").innerHTML=`<div class="kv"><span class="k">Friends</span><b>${(social.friends||[]).length}</b></div><div class="kv"><span class="k">Chat messages</span><b>${(social.chat||[]).length}</b></div><div class="kv"><span class="k">Private rooms</span><b>${(social.privateRooms||[]).length}</b></div><div class="kv"><span class="k">Clan</span><b>${social.clan?`[${social.clan.tag}] ${social.clan.name}`:'None'}</b></div><div class="kv"><span class="k">Gifts</span><b>${(social.gifts||[]).length}</b></div><div class="kv"><span class="k">Autonomous bot social actions</span><b>${ba.socialActions||0}</b></div><div class="kv"><span class="k">Incoming bot requests</span><b>${(social.friendRequests||[]).length}</b></div>`;
  $("arcadeMetrics").innerHTML=`<div class="kv"><span class="k">Wheel spins</span><b>${fg.wheel?.spins||0}</b></div><div class="kv"><span class="k">Dice sessions</span><b>${fg.dice?.length||0}</b></div><div class="kv"><span class="k">Raffle tickets</span><b>${fg.raffle?.playerTickets||0}</b></div><div class="kv"><span class="k">Scratch history</span><b>${fg.scratch?.length||0}</b></div><div class="kv"><span class="k">Last wheel prize</span><b>${fg.wheel?.lastPrize||'—'}</b></div><div class="kv"><span class="k">G7–G16 player sessions</span><b>${fg.extended?.plays?.length||0}</b></div><div class="kv"><span class="k">Autonomous bot Arcade+ plays</span><b>${ba.arcadePlays||0}</b></div>`;
  $("progressMetrics").innerHTML=`<div class="kv"><span class="k">Battle Pass</span><b>${eng.battlePass?.premium?'Premium':'Free'} · ${fmt(eng.battlePass?.xp||0)} XP</b></div><div class="kv"><span class="k">Prestige</span><b>${eng.prestige||0}</b></div><div class="kv"><span class="k">Skill-only matching</span><b>${eng.skillOnly?'Enabled':'Off'}</b></div><div class="kv"><span class="k">Weekly wins</span><b>${eng.weekly?.wins||0}</b></div>`;
  $("economyPlusMetrics").innerHTML=`<div class="kv"><span class="k">Crates opened</span><b>${ep.cratesOpened||0}</b></div><div class="kv"><span class="k">Trading listings</span><b>${ep.tradingListings?.length||0}</b></div><div class="kv"><span class="k">Staked coins</span><b>${fmt(stake.balance||0)}</b></div><div class="kv"><span class="k">Subscription</span><b>${sub.expires>Date.now()?sub.tier:'None'}</b></div><div class="kv"><span class="k">XP / rake boosters</span><b>${boost.xpUntil>Date.now()?'XP active':'—'} / ${boost.rakeUntil>Date.now()?'Rake active':'—'}</b></div><div class="kv"><span class="k">Crafts / event tickets</span><b>${utility.crafts?.length||0} / ${utility.eventTickets||0}</b></div><div class="kv"><span class="k">Clan treasury / room tier</span><b>${fmt(utility.clanTreasury||0)} / ${utility.roomUpgrade||'basic'}</b></div>`;
}
function adminAntiCheatScan(){const svc=S.services,findings=[],st=S.stats||{},wr=st.games?st.wins/st.games:0;if(st.games>=20&&wr>.8)findings.push({severity:'high',rule:'AC-WINRATE',detail:`Player win rate ${(wr*100).toFixed(1)}% over ${st.games} games`});if(!Object.values(S.wallet||{}).every(x=>Number.isFinite(x)&&x>=0)||!(S.bots||[]).every(b=>Number.isFinite(b.balance)&&b.balance>=0))findings.push({severity:'high',rule:'AC-BALANCE',detail:'Invalid or negative balance detected'});const proofs=(S.games||[]).map(g=>g.proof?.finalHash||g.proof?.h).filter(Boolean);if(proofs.some((x,i)=>proofs.indexOf(x)!==i))findings.push({severity:'medium',rule:'AC-PROOF',detail:'Duplicate proof hash detected'});if((S.games||[]).some(g=>!Number.isFinite(g.delta)||Math.abs(g.delta||0)>10000000))findings.push({severity:'high',rule:'AC-PAYOUT',detail:'Malformed or extreme payout record'});if((S.turbo||1)>=1000)findings.push({severity:'medium',rule:'AC-TURBO',detail:'1000× stress mode active'});if(!findings.length)findings.push({severity:'low',rule:'AC-PASS',detail:'No local anomaly detected'});const score=Math.min(100,findings.reduce((n,x)=>n+(x.severity==='high'?40:x.severity==='medium'?20:0),0));svc.antiCheat={lastScan:Date.now(),score,findings};findings.filter(x=>x.severity==='high').forEach(x=>cfg().reviewFlags.unshift({t:Date.now(),game:'account',type:'anti-cheat',amount:0,detail:x.detail}));audit('anti-cheat-scan',`risk ${score}`);return svc.antiCheat;}
function renderTrust(){const svc=S.services||{},rg=S.rg||{},an=S.analytics||{samples:[]},samples=an.samples||[],last=samples[samples.length-1]||{},ac=svc.antiCheat||{findings:[]},claims=Object.keys(svc.promoClaims||{}).length,dep=(rg.deposits||[]),since=ms=>dep.filter(x=>x.t>=Date.now()-ms).reduce((n,x)=>n+x.amount,0),max=Math.max(1,...samples.map(x=>x.games||0));
 $("trustTiles").innerHTML=[["🌐",S.bots.length+1,'Visible players'],["🎮",last.games||S.global.totalGames,'Games sampled'],["🛡️",ac.score||0,'Anti-cheat risk'],["📄",(svc.statements||[]).length,'Statements']].map(x=>`<div class="stat-tile"><div style="font-size:20px">${x[0]}</div><div class="v">${fmt(x[1])}</div><div class="k">${x[2]}</div></div>`).join('');
 $("analyticsMetrics").innerHTML=`<div class="kv"><span class="k">Samples</span><b>${samples.length}</b></div><div class="kv"><span class="k">Players / queue</span><b>${last.players||S.bots.length+1} / ${last.queue??S.waiting.length}</b></div><div class="kv"><span class="k">Gross revenue</span><b>${fmt(last.gross||0)}</b></div><div class="kv"><span class="k">Net revenue (NGR)</span><b>${fmt(last.net??houseNet())}</b></div><div class="kv"><span class="k">Cash in / out</span><b>+${fmt(houseCashIn())} / −${fmt(houseCashOut())}</b></div><div class="kv"><span class="k">Bot social / Arcade</span><b>${last.social||0} / ${last.arcade||0}</b></div>`;$("analyticsChart").innerHTML=`<div class="analytics-bars">${samples.slice(-60).map(x=>`<i style="height:${Math.max(3,(x.games||0)/max*100)}%" title="${x.games||0} games · net ${x.net??0}"></i>`).join('')}</div>`;
 $("antiCheatMetrics").innerHTML=`<div class="kv"><span class="k">Risk</span><b>${ac.score||0}/100</b></div><div class="kv"><span class="k">Last scan</span><b>${ac.lastScan?new Date(ac.lastScan).toLocaleString():'Never'}</b></div>`;$("antiCheatList").innerHTML=(ac.findings||[]).map(x=>`<div class="trust-finding"><span>${x.severity==='high'?'🔴':x.severity==='medium'?'🟠':'🟢'}</span><div><b>${x.rule}</b><br><span class="muted">${x.detail}</span></div></div>`).join('')||'<div class="muted">No findings.</div>';
 $("rgAdminMetrics").innerHTML=`<div class="kv"><span class="k">Deposit limits D / W / M</span><b>${rg.depositLimits?.daily||'Off'} / ${rg.depositLimits?.weekly||'Off'} / ${rg.depositLimits?.monthly||'Off'}</b></div><div class="kv"><span class="k">Usage D / W / M</span><b>${fmt(since(86400000))} / ${fmt(since(7*86400000))} / ${fmt(since(31*86400000))}</b></div><div class="kv"><span class="k">Session limit / cool-off</span><b>${rg.sessionLimitMin||'Off'}m / ${rg.coolOffUntil>Date.now()?'ACTIVE':'Off'}</b></div><div class="kv"><span class="k">Self-exclusion</span><b>${rg.selfExPermanent?'PERMANENT':rg.selfExUntil>Date.now()?'ACTIVE until '+new Date(rg.selfExUntil).toLocaleString():'Off'}</b></div><div class="kv"><span class="k">Pending limit increase</span><b>${rg.pendingDepositLimits?new Date(rg.pendingDepositLimits.effectiveAt).toLocaleTimeString():'None'}</b></div>`;
 $("platformAdminMetrics").innerHTML=`<div class="kv"><span class="k">PWA assets</span><b>Manifest + SW + 2 icons</b></div><div class="kv"><span class="k">Language</span><b>${S.settings?.language||'en'}</b></div><div class="kv"><span class="k">API requests</span><b>${(svc.apiLog||[]).length}</b></div><div class="kv"><span class="k">Notifications / log</span><b>${svc.notifications?.enabled?'Enabled':'Off'} / ${(svc.notificationLog||[]).length}</b></div><div class="kv"><span class="k">2FA</span><b>${svc.twoFactor?.enabled?'Enabled':'Off'}</b></div>`;
 $("serviceAdminMetrics").innerHTML=`<div class="grid4"><div class="stat-tile"><div class="v">${(cfg().promotions||[]).length}</div><div class="k">Campaigns</div></div><div class="stat-tile green"><div class="v">${claims}</div><div class="k">Player claims</div></div><div class="stat-tile blue"><div class="v">${(svc.statements||[]).length}</div><div class="k">Statements</div></div><div class="stat-tile purple"><div class="v">${(svc.emailLog||[]).length}</div><div class="k">Email simulations</div></div></div>`;}
function renderFeatureDirectory(){
  const categories=[...new Set(FEATURE_DIRECTORY.map(x=>x.cat))],q=DIRECTORY.search.toLowerCase(),catEl=$("directoryCategory");if(!catEl.dataset.ready){catEl.innerHTML='<option value="">All categories</option>'+categories.map(x=>`<option value="${x}">${x}</option>`).join('');catEl.dataset.ready='1';}catEl.value=DIRECTORY.category;$("directoryStatus").value=DIRECTORY.status;if(document.activeElement!==$("directorySearch"))$("directorySearch").value=DIRECTORY.search;
  let rows=FEATURE_DIRECTORY.filter(x=>(!DIRECTORY.category||x.cat===DIRECTORY.category)&&(!DIRECTORY.status||x.status===DIRECTORY.status)&&(!q||`${x.code} ${x.name} ${x.desc} ${x.cat}`.toLowerCase().includes(q)));
  const counts={Implemented:FEATURE_DIRECTORY.filter(x=>x.status==='Implemented').length,Partial:FEATURE_DIRECTORY.filter(x=>x.status==='Partial').length,Suggested:FEATURE_DIRECTORY.filter(x=>x.status==='Suggested').length};$("directoryTiles").innerHTML=[['✅',counts.Implemented,'Implemented'],['⚠️',counts.Partial,'Partial / demo-only'],['🧭',counts.Suggested,'Suggested next'],['🗂',FEATURE_DIRECTORY.length,'Total features']].map(x=>`<div class="stat-tile"><div style="font-size:21px">${x[0]}</div><div class="v">${x[1]}</div><div class="k">${x[2]}</div></div>`).join('');
  $("featureDirectory").innerHTML=categories.map(cat=>{const list=rows.filter(x=>x.cat===cat);if(!list.length)return'';return `<div class="directory-category">${cat} · ${list.length}</div><div class="directory-grid">${list.map(x=>`<div class="directory-card"><div class="directory-top"><span class="directory-code">${x.code}</span><span class="directory-status ${x.status.toLowerCase().replace(/\W+/g,'')}">${x.status}</span></div><h4>${x.name}</h4><p>${x.desc}</p><div class="directory-links">${x.tab?`<a href="index.html?tab=${x.tab}${x.feature?'&feature='+x.feature:''}" target="_blank">Open player ↗</a>`:''}${x.admin?`<button data-admin-go="${x.admin}">Open admin</button>`:''}${!x.tab&&!x.admin?'<span class="muted">Roadmap item</span>':''}</div></div>`).join('')}</div>`}).join('')||'<div class="muted">No features match these filters.</div>';
}
function render(){
  const c=cfg(),h=reconcileHouse();
  applyTheme();
  renderAdminChrome();renderFeatureAdmin();renderFeatureDirectory();renderTrust();
  // header
  $("hNet").textContent=fmt(h.netRevenue);
  $("hTopups").textContent=fmt(topupAnalytics().combined.base);
  $("hPool").textContent=fmt(S.jackpot);
  $("hGames").textContent=fmt(S.global.totalGames);
  // dash
  renderDash();
  // rates
  $("rngFee").value=c.feePct;$("lblFee").textContent=c.feePct+"%";
  $("rngCup").value=c.cupRakePct;$("lblCup").textContent=c.cupRakePct+"%";
  $("rngTrny").value=c.trnyRakePct;$("lblTrny").textContent=c.trnyRakePct+"%";
  $("rngXf").value=c.transferFee;$("lblXf").textContent=c.transferFee+"%";
  $("rngJpFund").value=c.jpFundPct;$("lblJpFund").textContent=c.jpFundPct+"%";
  $("rngJpFloor").value=c.jpFloor;$("lblJpFloor").textContent=c.jpFloor;
  $("rngJpArm").value=c.jpArm;$("lblJpArm").textContent=c.jpArm;
  $("rngJpPay").value=c.jpPayPct;$("lblJpPay").textContent=c.jpPayPct+"%";
  $("cfgCap").value=c.nonMainCapPct;$("cfgXfCap").value=c.transferCap;$("cfgXfMin").value=c.transferMin;
  $("cfgWdMin").value=c.wdMin??3000;$("cfgWdMax").value=c.wdMax??5000;$("cfgWdChance").value=c.wdTickChance??0.35;$("cfgArcadeTick").value=c.botArcadePerTick??2;$("cfgSeason").value=c.seasonNumber||1;$("cfgHouseCap").value=c.house.capital||0;
  // vip
  renderVip();
  renderLevels();
  // trny
  renderTrny();
  // promo
  renderPromo();
  // econ and top-up analytics
  renderEcon();renderTopupAnalytics();renderWithdrawals();renderPeople();
  // ops
  $("togMaint").checked=!!c.features.maintenance;
  $("togTopupPromo").checked=c.features.topupPromo!==false;
  $("togAuto").checked=!!c.features.autoMatch;
  $("togBots").checked=!!c.features.bots;$("togBotGrowth").checked=c.features.botGrowth!==false;
  $("botTopupThreshold").value=c.botTopupThreshold??500;$("botGrowthMax").value=c.botGrowthMax??250;$("botGrowthInterval").value=c.botGrowthIntervalSec??15;$("botGrowthBatch").value=c.botGrowthBatch??1;const botReadyCount=S.bots.filter(b=>b.firstTopupDone).length,botPendingCount=S.bots.length-botReadyCount;$("botGrowthStatus").textContent=`${S.bots.length+1} total players · ${botReadyCount} top-up ready · ${botPendingCount} blocked · ${(S.botActivity?.createdBots||0)} auto-created`;$("botFirstTopupStatus").innerHTML=[[fmt(botReadyCount),'First top-up complete','green'],[fmt(botPendingCount),'Blocked before play',botPendingCount?'red':'green'],[fmt(S.bots.reduce((n,b)=>n+(b.topupCount||0),0)),'All bot top-ups','purple'],[fmt(S.bots.reduce((n,b)=>n+(b.balance||0),0)),'Bot MAIN balance','blue'],[fmt(S.bots.reduce((n,b)=>n+(b.bonusBalance||0),0)),'Bot BONUS balance','purple']].map(x=>`<div class="stat-tile ${x[2]}"><div class="v">${x[0]}</div><div class="k">${x[1]}</div></div>`).join('');$("botTopupHeading").textContent=`Recent bot top-ups (first top-up required · later trigger below ${fmt(c.botTopupThreshold??500)})`;
  $("togQuests").checked=!!c.features.quests;
  $("togLogin").checked=!!c.features.dailyLogin;
  $("togX2").checked=true;
  $("plLvl").textContent=S.level+" ("+fmt(S.xp)+" XP)";
  let vipT=c.vip[0];for(const tier of c.vip)if(S.monthWagered>=tier.wagered)vipT=tier;
  const maxVip=c.vip.find(v=>v.tier===(S.vipUnlockedTier||vipT.tier))||vipT;
  $("plVip").innerHTML=`<span class="vip-dot" style="background:${vipT.color}"></span>${vipT.name} (${vipT.rakeback}%) · highest ${maxVip.name}<br><span class="muted">${VIP_BENEFIT_LABELS[vipT.tier]||''}</span>`;
  $("plWager").textContent=fmt(S.monthWagered);
  $("plNet2").textContent=(S.stats.net>=0?'+':'')+fmt(S.stats.net);
  renderFlags();
  $("qaDepth").textContent=S.waiting.length;
  $("qaEscrow").textContent=fmt(S.waiting.reduce((a,b)=>a+(b.stake||0),0));
  $("qaBots").textContent=S.bots.length;
  const qv=VIEWS.queue,qq=qv.filter.toLowerCase();let qw=[...S.waiting];const qgame=b=>b.gameName||((b.kind||'toss')==='toss'?'Coin Toss':b.kind);if(qq)qw=qw.filter(b=>`${qgame(b)} ${b.name||b.owner} ${b.pick??b.side??'AUTO'}`.toLowerCase().includes(qq));qw.sort((a,b)=>qv.sort==="stake-desc"?(b.stake||0)-(a.stake||0):qv.sort==="game-asc"?qgame(a).localeCompare(qgame(b)):(b.wait||0)-(a.wait||0));const qp=pageRows(qw,qv);setPager("queue",qv,qp);$("qaList").innerHTML=qp.rows.length?`<table><thead><tr><th>Game</th><th>Player</th><th>Pick</th><th>Stake</th><th>Wait</th></tr></thead><tbody>${qp.rows.map(b=>`<tr><td>${qgame(b)}</td><td>${b.name||b.owner}</td><td>${b.pick??b.side??'AUTO'}</td><td>${fmt(b.stake||0)}</td><td>${b.wait||0}s</td></tr>`).join('')}</tbody></table>`:'<div class="muted">Queue is empty.</div>';
  const xv=VIEWS.transfers,xq=xv.filter.toLowerCase();let bt=[...(S.botTransfers||[])];if(xq)bt=bt.filter(x=>`${x.from} ${x.to}`.toLowerCase().includes(xq));bt.sort((a,b)=>xv.sort==="time-asc"?a.t-b.t:xv.sort==="amount-desc"?(b.received||0)-(a.received||0):xv.sort==="fee-desc"?(b.fee||0)-(a.fee||0):b.t-a.t);const bx=pageRows(bt,xv);setPager("botXf",xv,bx);$("botTransferList").innerHTML=bx.rows.length?`<table><thead><tr><th>When</th><th>From</th><th>To</th><th>Sent</th><th>Fee</th></tr></thead><tbody>${bx.rows.map(x=>`<tr><td>${new Date(x.t).toLocaleTimeString()}</td><td>${x.from}</td><td>${x.to}</td><td>${fmt(x.received)}</td><td>${fmt(x.fee)}</td></tr>`).join('')}</tbody></table>`:'<div class="muted">No bot transfers match.</div>';
  const uv=VIEWS.topups,uq=uv.filter.toLowerCase();let bu=[...(S.botTopups||[])];if(uq)bu=bu.filter(x=>`${x.bot} ${x.reason}`.toLowerCase().includes(uq));bu.sort((a,b)=>uv.sort==="time-asc"?a.t-b.t:uv.sort==="total-desc"?(b.total||0)-(a.total||0):uv.sort==="promo-desc"?(b.bonus||0)-(a.bonus||0):b.t-a.t);const up=pageRows(bu,uv);setPager("botTopup",uv,up);$("botTopupList").innerHTML=up.rows.length?`<table><thead><tr><th>When</th><th>Bot</th><th>MAIN top-up</th><th>Starting BONUS</th><th>Promo BONUS</th><th>Wallet credit</th><th>Reason</th></tr></thead><tbody>${up.rows.map(x=>`<tr><td>${new Date(x.t).toLocaleTimeString()}</td><td>${x.bot}</td><td>${fmt(x.base)}</td><td>${x.startingBonus?`+${fmt(x.startingBonus)}`:'—'}</td><td>${x.bonus?`+${fmt(x.bonus)}`:'—'}</td><td>${fmt(x.walletCredit??((x.total||0)+(x.startingBonus||0)))}</td><td>${x.reason}</td></tr>`).join('')}</tbody></table>`:'<div class="muted">No bot top-ups match.</div>';
  // audit
  renderAudit();
  renderGameHistory();renderCatalogHistory();
  save();
}
function renderTopupAnalytics(){
  const a=topupAnalytics(),p=a.playerStats,b=a.botStats,c=a.combined;
  $("topupAdminTiles").innerHTML=[{v:fmt(c.credited),k:'Combined credits',cls:'blue'},{v:fmt(c.base),k:'Base top-up volume'},{v:fmt(c.bonus),k:'Top-up promo credits',cls:'red'},{v:fmt(c.count),k:'Top-up events'},{v:fmt(p.credited),k:'Player credits',cls:'green'},{v:fmt(b.credited),k:'Bot credits',cls:'purple'},{v:fmt(p.last30+b.last30),k:'30-day base volume'},{v:fmt(b.unique),k:'Bots topped up'}].map(x=>`<div class="stat-tile ${x.cls||''}"><div class="v">${x.v}</div><div class="k">${x.k}</div></div>`).join('');
  $("playerTopupSummary").innerHTML=`<div class="kv"><span class="k">Top-up count</span><span class="v">${fmt(p.count)}</span></div><div class="kv"><span class="k">Base volume</span><span class="v">${fmt(p.base)}</span></div><div class="kv"><span class="k">Bonus / total credited</span><span class="v">${fmt(p.bonus)} / ${fmt(p.credited)}</span></div><div class="kv"><span class="k">Average / largest base</span><span class="v">${fmt(p.average)} / ${fmt(p.largest)}</span></div><div class="kv"><span class="k">Last 7 / 30 days</span><span class="v">${fmt(p.last7)} / ${fmt(p.last30)}</span></div><div class="kv"><span class="k">Bonus rate</span><span class="v">${p.promoRate.toFixed(1)}%</span></div>`;
  $("botTopupSummary").innerHTML=`<div class="kv"><span class="k">First-top-up ready / blocked</span><span class="v">${fmt(b.ready)} / ${fmt(b.pending)}</span></div><div class="kv"><span class="k">Top-up count / unique bots</span><span class="v">${fmt(b.count)} / ${fmt(b.unique)}</span></div><div class="kv"><span class="k">Base volume</span><span class="v">${fmt(b.base)}</span></div><div class="kv"><span class="k">Starting bonus / first promo</span><span class="v">${fmt(b.startingBonus)} / ${fmt(b.firstPromo)}</span></div><div class="kv"><span class="k">All bonus / total credited</span><span class="v">${fmt(b.bonus)} / ${fmt(b.credited)}</span></div><div class="kv"><span class="k">Average / largest base</span><span class="v">${fmt(b.average)} / ${fmt(b.largest)}</span></div><div class="kv"><span class="k">Last 7 / 30 days</span><span class="v">${fmt(b.last7)} / ${fmt(b.last30)}</span></div><div class="kv"><span class="k">Bonus rate</span><span class="v">${b.promoRate.toFixed(1)}%</span></div>`;
  const v=VIEWS.playerTopups,q=v.filter.toLowerCase();let rows=[...a.player];if(q)rows=rows.filter(x=>`${x.source} ${x.campaignId||''} ${x.method||''} ${x.reference||''} ${x.status||''} ${x.base} ${x.bonus} ${x.credited}`.toLowerCase().includes(q));rows.sort((x,y)=>v.sort==='time-asc'?x.t-y.t:v.sort==='base-desc'?y.base-x.base:v.sort==='bonus-desc'?y.bonus-x.bonus:v.sort==='credited-desc'?y.credited-x.credited:y.t-x.t);const pg=pageRows(rows,v);setPager('playerTopup',v,pg);
  $("playerTopupList").innerHTML=pg.rows.length?`<table><thead><tr><th>When</th><th>Base</th><th>First promo</th><th>Campaign promo</th><th>Total bonus</th><th>Credited</th><th>Method / Ref</th><th>Status</th></tr></thead><tbody>${pg.rows.map(x=>`<tr><td>${new Date(x.t).toLocaleString()}</td><td>${fmt(x.base)}</td><td>${x.firstBonus?`+${fmt(x.firstBonus)}`:'—'}</td><td>${x.campaignBonus?`+${fmt(x.campaignBonus)}`:'—'}</td><td>${fmt(x.bonus)}</td><td><b>${fmt(x.credited)}</b></td><td>${x.method||'Wallet'}${x.reference?' · '+x.reference:''}</td><td><span class="tag on">${(x.status||'completed').toUpperCase()}</span></td></tr>`).join('')}</tbody></table>`:'<div class="muted">No Player deposits match.</div>';
  $("topupRecentBots").innerHTML=a.bots.slice(0,10).map(x=>`<div class="kv"><span class="k">${new Date(x.t).toLocaleString()} · ${x.bot}<br><span class="muted">${x.reason||'Low balance'}</span></span><span class="v">${fmt(x.base)} MAIN${x.startingBonus?` + ${fmt(x.startingBonus)} starting BONUS`:''}${x.firstPromo?` + ${fmt(x.firstPromo)} promo BONUS`:''}</span></div>`).join('')||'<div class="muted">No bot top-ups yet. Full filtered history is in Live Operations.</div>';
}
function renderDash(){
  const c=cfg(),h=c.house,tu=topupAnalytics();
  const gross=houseGross(),net=houseNet();
  const tiles=[
    {v:fmt(net),k:"Net revenue (NGR)",cls:net>=0?"green":"red"},
    {v:fmt(gross),k:"Gross revenue"},
    {v:fmt(houseCashIn()),k:"Cash in (deposits)",cls:"blue"},
    {v:fmt(houseCashOut()),k:"Cash out (withdrawals)",cls:"red"},
    {v:fmt(houseNetCash()),k:"Net cash flow",cls:houseNetCash()>=0?"green":"red"},
    {v:fmt(h.catalogFees||0),k:"Catalog earnings",cls:"purple"},
    {v:fmt(h.promoCost),k:"Promo cost",cls:"red"},
    {v:fmt(tu.combined.base),k:"Top-up base volume",cls:"blue"},
    {v:fmt(tu.combined.bonus),k:"Top-up bonuses",cls:"red"},
    {v:fmt(tu.combined.count),k:"Top-up events"},
    {v:fmt(S.global.totalGames),k:"Games settled"},
    {v:fmt(S.waiting.length),k:"Open bets"},
    {v:fmt(S.jackpot),k:"Jackpot pool",cls:S.jackpot>=c.jpArm?"green":""},
    {v:fmt(S.global.jackpots),k:"Jackpots hit"},
    {v:c.features.maintenance?"MAINT":"LIVE",k:"System status",cls:c.features.maintenance?"red":"green"},
  ];
  $("dashTiles").innerHTML=tiles.map(t=>`<div class="stat-tile ${t.cls||''}"><div class="v">${t.v}</div><div class="k">${t.k}</div></div>`).join("");
  $("plFees").textContent=fmt(h.fees||0);$("plCatalog").textContent=fmt(h.catalogFees||0);$("plCup").textContent=fmt(h.cupRakes);$("plTrny").textContent=fmt(h.trnyRakes);
  $("plShop").textContent=fmt(h.shop);$("plXf").textContent=fmt(h.xfFees||0);
  $("plGross").textContent=fmt(gross);$("plPromo").textContent=fmt(h.promoCost);$("plComp").textContent=fmt(h.comps);
  $("plNet").textContent=fmt(net);$("plCap").textContent=fmt(h.capital+net);
  $("jpPool").textContent=fmt(S.jackpot);
  $("jpArmed").innerHTML=S.jackpot>=c.jpArm?'<span class="tag on">ARMED</span>':'<span class="tag off">not armed</span>';
  $("jpArm").textContent=c.jpArm;$("jpFund").textContent=c.jpFundPct+"%";$("jpPay").textContent=c.jpPayPct+"%";$("jpTotal").textContent=S.global.jackpots;
  $("jpBar").style.width=Math.min(100,S.jackpot/Math.max(c.jpArm,1)*100)+"%";
  // feed
  $("dashFeed").innerHTML=S.feed.slice(0,30).map(f=>`<div class="feed-item ${f.jp?'tag warn':''}"><span class="ft">${f.t}</span>${f.msg}</div>`).join("")||'<div class="muted">No activity yet — open the player app and play a game.</div>';
  // rng chart
  drawRng();
}
function drawRng(){
  const cv=$("rngCanvas");if(!cv)return;const ctx=cv.getContext&&cv.getContext("2d");if(!ctx)return;
  const w=cv.width,h=cv.height;ctx.clearRect(0,0,w,h);
  // show last 60 results
  const recent=S.games.filter(g=>g.result==="HEADS"||g.result==="TAILS").slice(0,60).reverse();
  const heads=recent.filter(g=>g.result==="HEADS").length,tails=recent.filter(g=>g.result==="TAILS").length;
  ctx.fillStyle=getComputedStyle(document.body).getPropertyValue('--bg2').trim();ctx.fillRect(0,0,w,h);
  // axes
  ctx.strokeStyle="#22304f";ctx.beginPath();ctx.moveTo(30,h-25);ctx.lineTo(w-10,h-25);ctx.stroke();
  // bars
  const bw=(w-40)/Math.max(recent.length,1);
  recent.forEach((g,i)=>{
    ctx.fillStyle=g.result==="HEADS"?"#f6c453":"#60a5fa";
    const barH=(g.result==="HEADS"?-1:1)*((h-40)/2);
    ctx.fillRect(32+i*bw,h/2+barH/2,Math.max(bw-2,2),Math.abs(barH));
  });
  ctx.fillStyle="#93a0bd";ctx.font="10px monospace";ctx.fillText("H",4,14);ctx.fillText("T",4,h-14);
  const hT=S.global.heads,tT=S.global.tails,tot=hT+tT;
  $("rngHT").textContent=`${hT} / ${tT} (${tot?Math.round(hT/tot*100):0}% H)`;
  if(tot>0){const z=(hT-tot*.5)/Math.sqrt(tot*.25);$("rngZ").textContent=z.toFixed(3)+(Math.abs(z)<3?" ✓ fair":" ⚠ drift");$("rngZ").style.color=Math.abs(z)<3?"var(--green)":"var(--red)";}
  else $("rngZ").textContent="—";
  $("rngJp").textContent=tot?(S.global.jackpots/tot*100).toFixed(2)+"% (theory 0.39%)":"—";
}
function renderVip(){
  const el=$("vipEditor");
  el.innerHTML=cfg().vip.map((v,i)=>`
    <div class="vip-row">
      <span><span class="vip-dot" style="background:${v.color}"></span></span>
      <input type="text" value="${v.name}" data-vip="${i}" data-f="name" style="padding:6px 9px;font-size:12px"/>
      <input type="number" value="${v.wagered}" data-vip="${i}" data-f="wagered" min="0" step="500" class="sm" style="width:100%"/>
      <input type="number" value="${v.rakeback}" data-vip="${i}" data-f="rakeback" min="0" max="20" class="sm" style="width:100%"/>
      <span class="muted">${v.rakeback}% · ${VIP_BENEFIT_LABELS[v.tier]||''}</span>
    </div>`).join("");
}
function readVip(){
  cfg().vip.forEach((v,i)=>{
    document.querySelectorAll(`[data-vip="${i}"]`).forEach(inp=>{
      const f=inp.dataset.f;
      v[f]=f==="name"?inp.value:(f==="rakeback"?Math.max(0,Math.min(20,+inp.value)):Math.max(0,+inp.value));
    });
  });
}
function renderLevels(){
  const lr=cfg().levelRewards,v=VIEWS.levels,q=v.filter.trim();let keys=Object.keys(lr).map(Number);if(q)keys=keys.filter(k=>String(k).includes(q));keys.sort((x,y)=>v.sort==='level-desc'?y-x:v.sort==='reward-desc'?(lr[y]||0)-(lr[x]||0):x-y);const pg=pageRows(keys,v);setPager('level',v,pg);
  $("levelEditor").innerHTML=pg.rows.map(k=>`
    <div style="background:var(--bg2);border:1px solid var(--line);border-radius:9px;padding:9px">
      <div class="muted" style="font-size:10px;text-transform:uppercase">Level ${k}${[30,40,50].includes(k)?' · COSMETIC MILESTONE':''}</div>
      <input type="number" value="${lr[k]}" data-level="${k}" min="0" class="sm" style="width:100%;margin-top:4px"/>
    </div>`).join("")||'<div class="muted">No levels match.</div>';
}
function renderTrny(){
  const el=$("trnyList"),v=VIEWS.tournaments;let list=[...(S.trnys||[])];
  if(v.status)list=list.filter(t=>t.status===v.status);
  list.sort((a,b)=>v.sort==="time-asc"?(a.createdAt||0)-(b.createdAt||0):v.sort==="entry-desc"?(b.entry||0)-(a.entry||0):v.sort==="size-desc"?(b.size||0)-(a.size||0):(b.createdAt||0)-(a.createdAt||0));
  const pg=pageRows(list,v);setPager("trny",v,pg);
  if(!pg.rows.length){el.innerHTML='<div class="muted">No tournaments match the filter.</div>';return;}
  el.innerHTML=pg.rows.map(t=>{
    const status=t.status==="open"?`<span class="tag on">OPEN ${t.entrants.length}/${t.size}</span>`:t.status==="running"?`<span class="tag warn">RUNNING</span>`:`<span class="tag">COMPLETE · 👑 ${t.champion||"?"}</span>`;
    return `<div class="promo-card"><div class="row"><b>${t.size}-P ${t.format==="bo3"?'Bo3 Series':'Single-Flip'} tournament</b> ${status}<span class="muted">entry ${fmt(t.entry)} · rake ${t.rake}% · ${new Date(t.createdAt||Date.now()).toLocaleString()}</span></div></div>`;
  }).join("");
}
function renderPromo(){
  const now=Date.now();
  const list=cfg().promotions||[];
  const el=$("promoList");
  if(!list.length)el.innerHTML='<div class="muted">No campaigns.</div>';
  else el.innerHTML=list.map((p,i)=>{
    const live=now>=p.start && (!p.end||now<p.end) && p.on;
    const ended=p.end&&now>=p.end;
    return `<div class="promo-card">
      <div class="row"><b>${p.type}</b> · ${p.type==='deposit'?fmt(p.amount)+'%':fmt(p.amount)+' 🪙'}
        <span>${live?'<span class="live-badge">LIVE</span>':ended?'<span class="expired">ENDED</span>':'<span class="tag warn">SCHEDULED</span>'}</span></div>
      <div class="muted" style="font-size:11px;margin-top:4px">starts ${new Date(p.start).toLocaleString()}${p.end?' · ends '+new Date(p.end).toLocaleString():' (no end)'} · Player claims ${S.services?.promoClaims?.[p.id]?1:0}</div>
      <div class="row" style="margin-top:6px">
        <button class="btn btn-ghost btn-sm" data-promo-toggle="${i}">${p.on?'Pause':'Resume'}</button>
        <button class="btn btn-danger btn-sm" data-promo-del="${i}">Delete</button></div></div>`;
  }).join("");
  const bc=cfg().broadcast;
  if(bc){$("bcPreview").style.display="block";$("bcPreview").textContent="📣 "+bc;}else $("bcPreview").style.display="none";
}
function renderEcon(){
  const h=cfg().house,tu=topupAnalytics();
  const gross=houseGross(),net=houseNet();
  const tiles=[
    {v:fmt(cfg().taps),k:"Taps (coins created)",cls:"blue"},
    {v:fmt(cfg().sinks),k:"Sinks (coins removed)",cls:"purple"},
    {v:fmt(net),k:"Net revenue (NGR)",cls:net>=0?"green":"red"},
    {v:fmt(h.capital+net),k:"House bankroll (NGR)"},
    {v:fmt(houseCashIn()),k:"Cash in (deposits)",cls:"blue"},
    {v:fmt(houseCashOut()),k:"Cash out (withdrawals)",cls:"red"},
    {v:fmt(houseNetCash()),k:"Net cash flow",cls:houseNetCash()>=0?"green":"red"},
    {v:fmt(tu.combined.base),k:"Top-up base volume",cls:"blue"},
    {v:fmt(tu.combined.bonus),k:"Top-up promo credits",cls:"red"},
  ];
  $("econTiles").innerHTML=tiles.map(t=>`<div class="stat-tile ${t.cls}"><div class="v">${t.v}</div><div class="k">${t.k}</div></div>`).join("");
  $("tapVal").textContent=fmt(cfg().taps);
  $("sinkVal").textContent=fmt(cfg().sinks);
  const ratio=cfg().taps>0?cfg().sinks/cfg().taps:0;
  $("ratioVal").textContent=ratio.toFixed(3);
  $("econBar").style.width=Math.min(100,ratio*100)+"%";
  const v=$("econVerdict");
  if(ratio>=0.5){v.className="ok-box";v.textContent="✅ HEALTHY — sinks are absorbing taps. Economy is balanced.";}
  else if(ratio>=0.15){v.className="ok-box";v.style.borderColor="rgba(var(--amber-rgb),.5)";v.style.color="var(--gold)";v.textContent="⚠️ BALANCED — watch the ratio; consider boosting sinks (shop, fees) if it drops.";}
  else{v.className="warn-box";v.textContent="🔴 INFLATIONARY — taps outpace sinks. Reduce bonuses or add shop items before coins lose meaning.";}
  $("compAvail").textContent=fmt(Math.max(0,h.netRevenue));
}
function renderFlags(){
  const all=cfg().reviewFlags||[],v=VIEWS.flags;let flags=[...all];if(v.filter)flags=flags.filter(f=>f.type===v.filter);flags.sort((a,b)=>v.sort==="time-asc"?a.t-b.t:v.sort==="amount-desc"?(b.amount||0)-(a.amount||0):b.t-a.t);const pg=pageRows(flags,v);setPager("flag",v,pg);
  $("flagCount").textContent=all.length;
  $("flagList").innerHTML=pg.rows.map(f=>`<div class="kv"><span class="k">Game #${f.game} · ${new Date(f.t).toLocaleTimeString()}</span><span class="v"><span class="tag ${f.type==='jackpot'?'warn':'on'}">${f.type}</span> ${fmt(f.amount)}</span></div>`).join("")||'<div class="muted">No flags match the filter.</div>';
}
function renderWithdrawals(){
  const w=S.withdrawals||{count:0,amount:0,log:[]},v=VIEWS.withdrawals,q=v.filter.toLowerCase();
  const log=(w.log||[]).slice();
  const lo=Math.max(1000,+(cfg().wdMin??3000)),hi=Math.max(lo,+(cfg().wdMax??5000));
  const ripe=S.bots.filter(b=>(b.balance||0)>=Math.max(lo,(b.withdrawAt||lo)));
  const now=Date.now(),d7=log.filter(x=>(x.t||0)>=now-7*86400000).reduce((a,x)=>a+(x.amount||0),0);
  const avg=w.count?Math.round((w.amount||0)/w.count):0,largest=log.reduce((m,x)=>Math.max(m,x.amount||0),0);
  const unique=new Set(log.map(x=>x.name)).size;
  $("wdTiles").innerHTML=[
    {v:fmt(w.count||0),k:"Requests paid",cls:"green"},
    {v:fmt(w.amount||0),k:"Total withdrawn"},
    {v:fmt(ripe.length),k:"Eligible now",cls:ripe.length?"gold":""},
    {v:fmt(lo)+"–"+fmt(hi),k:"Trigger band"},
  ].map(t=>`<div class="stat-tile ${t.cls||''}"><div class="v">${t.v}</div><div class="k">${t.k}</div></div>`).join("");
  $("wdSummary").innerHTML=[["Requests paid",fmt(w.count||0)+" / "+fmt(unique)+" bots"],["Average / largest",fmt(avg)+" / "+fmt(largest)],["Last 7 days",fmt(d7)],["Coins removed (sinks)",fmt(w.amount||0)]].map(x=>`<div class="kv"><span class="k">${x[0]}</span><span class="v">${x[1]}</span></div>`).join("");
  const h=cfg().house,gross=houseGross(),net=houseNet(),cin=houseCashIn(),cout=houseCashOut(),ncash=houseNetCash();
  $("wdPnl").innerHTML=[["Gross revenue",fmt(gross)],["Promo cost","−"+fmt(h.promoCost||0)],["Comps paid","−"+fmt(h.comps||0)],["Net revenue (NGR)",fmt(net),net>=0?"g":"r"],["Cash in — player deposits","+"+fmt(h.deposits||0)],["Cash in — bot deposits","+"+fmt(h.botDeposits||0)],["Cash in total","+"+fmt(cin)],["Cash out — bot withdrawals","−"+fmt(h.withdrawals||0)],["Cash out — player withdrawals","−"+fmt(h.playerWithdrawals||0)],["Cash out total","−"+fmt(cout)],["Net cash flow",fmt(ncash),ncash>=0?"g":"r"]].map(x=>`<div class="kv"><span class="k">${x[0]}</span><span class="v ${x[2]||''}">${x[1]}</span></div>`).join("");
  let rows=log.slice();
  if(q)rows=rows.filter(x=>`${x.name} ${x.amount}`.toLowerCase().includes(q));
  rows.sort((a,b)=>v.sort==="time-asc"?(a.t||0)-(b.t||0):v.sort==="amount-desc"?(b.amount||0)-(a.amount||0):(b.t||0)-(a.t||0));
  const pg=pageRows(rows,v);setPager("wd",v,pg);
  $("wdList").innerHTML=`<table><thead><tr><th>When</th><th>Bot</th><th>Amount</th><th>Kept MAIN</th><th>Status</th></tr></thead><tbody>${pg.rows.map(x=>`<tr><td>${new Date(x.t||0).toLocaleString()}</td><td>${x.name}</td><td>${fmt(x.amount||0)}</td><td>${fmt(x.keep||0)}</td><td><span class="tag on">paid</span></td></tr>`).join("")||'<tr><td colspan="5" class="muted">No withdrawals yet. Bots cash out after MAIN reaches '+fmt(lo)+"–"+fmt(hi)+'.</td></tr>'}</tbody></table>`;
  $("wdNear").innerHTML=`<table><thead><tr><th>Bot</th><th>MAIN</th><th>Trigger</th><th>Gap</th></tr></thead><tbody>${S.bots.slice().sort((a,b)=>(b.balance||0)-(a.balance||0)).slice(0,12).map(b=>{const trig=Math.max(lo,+(b.withdrawAt||lo));return `<tr><td>${b.name}</td><td>${fmt(b.balance||0)}</td><td>${fmt(trig)}</td><td>${fmt(Math.max(0,trig-(b.balance||0)))}</td></tr>`;}).join("")}</tbody></table>`;
  // Player banking: deposits + KYC withdrawals
  const pdep=(S.rg?.deposits||[]),pwd=S.playerWithdrawals||{count:0,amount:0,log:[]},pwdLog=pwd.log||[];
  const pDepBase=pdep.reduce((n,x)=>n+((x.base??x.amount)||0),0),pDepCred=pdep.reduce((n,x)=>n+(x.credited??(((x.base??x.amount)||0)+((x.bonus||0)+(x.firstBonus||0)+(x.campaignBonus||0)))),0);
  $("pydTiles").innerHTML=[
    {v:fmt(pdep.length),k:"Player deposits",cls:"green"},
    {v:fmt(pDepBase),k:"Deposit base"},
    {v:fmt(pDepCred),k:"Deposit credits",cls:"blue"},
    {v:fmt(pwd.count||0),k:"Player withdrawals",cls:"purple"},
    {v:fmt(pwd.amount||0),k:"Withdrawal amount"},
    {v:fmt(S.wallet?.main||0),k:"Available MAIN"},
    {v:fmt(cfg().house.playerWithdrawals||0),k:"Player outflow"},
    {v:S.kyc?.verified?"Verified":"Required",k:"KYC status",cls:S.kyc?.verified?"green":"gold"}
  ].map(t=>`<div class="stat-tile ${t.cls||''}"><div class="v">${t.v}</div><div class="k">${t.k}</div></div>`).join("");
  $("playerDepList").innerHTML=pdep.slice(0,25).map(x=>`<div class="kv"><span class="k">${new Date(x.t).toLocaleString()}<br><span class="muted">${x.method||'Wallet'}${x.reference?' · '+x.reference:''}</span></span><span class="v">+${fmt(x.credited??(((x.base??x.amount)||0)+((x.bonus||0)+(x.firstBonus||0)+(x.campaignBonus||0))))} <span class="tag on">${(x.status||'completed').toUpperCase()}</span>${x.reference?` <button class="btn btn-danger btn-sm" onclick="adminReverseDeposit('${x.reference.replace(/'/g,"\\'")}')">⤺ Reverse</button>`:''}</span></div>`).join("")||'<div class="muted">No player deposits yet.</div>';
  $("playerWdList").innerHTML=pwdLog.slice(0,25).map(x=>`<div class="kv"><span class="k">${new Date(x.t).toLocaleString()}<br><span class="muted">${x.method||'—'}${x.reference?' · '+x.reference:''}</span></span><span class="v">−${fmt(x.amount||0)} <span class="tag on">${(x.status||'completed').toUpperCase()}</span>${x.reference?` <button class="btn btn-danger btn-sm" onclick="adminReverseWithdraw('${x.reference.replace(/'/g,"\\'")}')">⤺ Reverse</button>`:''}</span></div>`).join("")||'<div class="muted">No player withdrawals yet. Run the player wallet to request one.</div>';
  if($("pydLedgerCount"))$("pydLedgerCount").textContent=(S.ledger||[]).length;
  if($("pydAuditCount"))$("pydAuditCount").textContent=(cfg().audit||[]).length;
}
function renderPeople(){
  const v=VIEWS.people,q=v.filter.toLowerCase();
  $("adminTheme").value=(S.settings?.themeName||'midnight')==='light'?'light':'dark';
  $("adminLanguage").value=S.settings?.language||'en';
  $("adminSound").value=S.settings?.sound?'true':'false';
  $("adminInstant").value=S.settings?.instant?'true':'false';
  $("adminStop").value=S.settings?.autoRebetStop??-200;
  $("adminPlayerName").value=S.playerName||'';
  const playable=(S.wallet.main||0)+(S.wallet.bonus||0)+(S.wallet.referral||0)+(S.wallet.rakeback||0);
  const you={name:S.playerName||"Player",you:true,balance:playable,bal:playable,wins:S.stats?.wins||0,losses:S.stats?.losses||0,level:S.level||1,net:S.stats?.net||0,topupCount:(S.rg?.deposits||[]).length,withdraws:S.playerWithdrawals?.count||0,withdrawTotal:S.playerWithdrawals?.amount||0,country:"YOU",flag:""};
  let rows=[you].concat((S.bots||[]).map(b=>({...b,balance:(b.balance||0)+(b.bonusBalance||0),bal:(b.balance||0)+(b.bonusBalance||0)})));
  if(q)rows=rows.filter(r=>`${r.name} ${r.country||""} ${r.title||""}`.toLowerCase().includes(q));
  const key=v.sort;rows.sort((a,b)=>(b[key]||0)-(a[key]||0));
  const online=S.bots.filter(b=>b.online).length;
  $("peopleTiles").innerHTML=[
    {v:fmt(playable),k:"Demo player wallet",cls:"green"},
    {v:fmt(S.stats?.net||0),k:"Player career net",cls:(S.stats?.net||0)>=0?"green":"red"},
    {v:fmt(S.bots.length),k:"Simulated roster"},
    {v:fmt(online),k:"Appearing online",cls:"blue"},
  ].map(t=>`<div class="stat-tile ${t.cls||''}"><div class="v">${t.v}</div><div class="k">${t.k}</div></div>`).join("");
  const pg=pageRows(rows,v);setPager("people",v,pg);
  $("peopleList").innerHTML=`<table><thead><tr><th>Name</th><th>Playable</th><th>MAIN / BONUS</th><th>W–L</th><th>Net</th><th>Lv</th><th>Top-ups</th><th>Withdrawals</th></tr></thead><tbody>${pg.rows.map(r=>`<tr><td>${r.name}${r.you?" · you":" · "+(r.country||"")}</td><td>${fmt(r.bal||r.balance||0)}</td><td>${fmt(r.balance!==undefined?r.balance:0)} / ${fmt(r.bonusBalance||0)}</td><td>${r.wins||0}–${r.losses||0}</td><td style="color:${(r.net||0)>=0?"var(--green)":"var(--red)"}">${(r.net||0)>=0?"+":""}${fmt(r.net||0)}</td><td>${r.level||"–"}</td><td>${r.topupCount||r.topups||0}</td><td>${r.withdraws||0}</td></tr>`).join("")||'<tr><td colspan="8" class="muted">No players match.</td></tr>'}</tbody></table>`;
}
function renderAudit(){
  const el=$("auditBody"),v=VIEWS.audit,q=v.filter.toLowerCase();let rows=[...(cfg().audit||[])];
  if(q)rows=rows.filter(a=>`${a.who} ${a.action} ${a.detail||''}`.toLowerCase().includes(q));
  rows.sort((a,b)=>v.sort==="time-asc"?a.t-b.t:v.sort==="action-asc"?String(a.action).localeCompare(String(b.action)):b.t-a.t);
  const pg=pageRows(rows,v);setPager("audit",v,pg);
  el.innerHTML=pg.rows.map(a=>`<tr><td>${new Date(a.t).toLocaleString()}</td><td>${a.who}</td><td><b>${a.action}</b></td><td>${a.detail||""}</td></tr>`).join("")||'<tr><td colspan="4" class="muted">No audit rows match.</td></tr>';
}
function renderGameHistory(){
  const el=$("gameHistory"),v=VIEWS.games,q=v.filter.toLowerCase();let rows=[...(S.games||[])];
  if(q)rows=rows.filter(g=>`${g.game||'Coin Toss'} ${g.result} ${g.oppName||''} ${g.resultText||''} ${g.playerPick||''} ${g.botPick||''}`.toLowerCase().includes(q));
  rows.sort((a,b)=>v.sort==="time-asc"?(a.t||0)-(b.t||0):v.sort==="stake-desc"?(b.stake||0)-(a.stake||0):v.sort==="delta-desc"?(b.delta||0)-(a.delta||0):v.sort==="game-asc"?String(a.game||'Coin Toss').localeCompare(String(b.game||'Coin Toss')):(b.t||0)-(a.t||0));
  const pg=pageRows(rows,v);setPager("game",v,pg);
  if(!pg.rows.length){el.innerHTML='<div class="muted">No games match the filter.</div>';return;}
  el.innerHTML=`<table><thead><tr><th># / When</th><th>Game</th><th>Result</th><th>Players & picks</th><th>Stake / Fee</th><th>Player Δ</th><th>Resolution details</th><th>Proof</th></tr></thead><tbody>${pg.rows.map(g=>`<tr class="table-click" data-game-row="${g.id}"><td>#${g.id}<br><span class="muted">${new Date(g.t||0).toLocaleTimeString()}</span></td><td><b>${g.game||'Coin Toss'}</b></td><td><span class="tag ${g.result==='HEADS'?'warn':'on'}" style="text-transform:none">${g.result}${g.flips?' ('+g.flips.length+' flips)':''}</span></td><td>You${g.playerPick!==undefined?' ['+g.playerPick+']':''} vs ${g.oppName||"bot"} ${g.oppFlag||""}${g.botPick!==undefined?' ['+g.botPick+']':''}</td><td>${fmt(g.stake||0)} / ${fmt(g.fee||0)}</td><td style="color:${g.delta>=0?'var(--green)':'var(--red)'}">${g.delta>=0?'+':''}${fmt(g.delta||0)}</td><td style="min-width:220px">${g.resultText||((g.flips&&g.flips.join)?g.flips.join(' · '):'—')}</td><td>${g.verified?'<span class="tag on">✓ fair</span>':'—'}</td></tr>`).join("")}</tbody></table>`;
}
function renderCatalogHistory(){
  const el=$("catalogHistory"),v=VIEWS.catalog,all=S.catalogLog||[],q=v.filter.toLowerCase();
  const wagered=all.reduce((a,x)=>a+(x.stake||0)*2,0),loggedFees=all.reduce((a,x)=>a+(x.fee||0),0),carry=Object.values(S.gameCarries||{}).reduce((a,x)=>a+(+x||0),0);
  $("catalogSummary").innerHTML=[{v:fmt(all.length),k:"Catalog matches"},{v:fmt(wagered),k:"Catalog turnover"},{v:fmt(cfg().house.catalogFees||0),k:"House catalog earnings",cls:"green"},{v:fmt(carry),k:"Open carry pools",cls:"purple"}].map(x=>`<div class="stat-tile ${x.cls||''}"><div class="v">${x.v}</div><div class="k">${x.k}</div></div>`).join('');
  let rows=[...all];if(q)rows=rows.filter(x=>`${x.game} ${x.playerA} ${x.pickA} ${x.playerB} ${x.pickB} ${x.result} ${x.detail}`.toLowerCase().includes(q));if(v.result)rows=rows.filter(x=>String(x.result).toUpperCase().includes(v.result));
  rows.sort((a,b)=>v.sort==="time-asc"?a.t-b.t:v.sort==="fee-desc"?(b.fee||0)-(a.fee||0):v.sort==="stake-desc"?(b.stake||0)-(a.stake||0):v.sort==="game-asc"?String(a.game).localeCompare(String(b.game)):b.t-a.t);
  const pg=pageRows(rows,v);setPager("cat",v,pg);if(!pg.rows.length){el.innerHTML='<div class="muted">No catalog matches fit the filters.</div>';return;}
  el.innerHTML=`<table><thead><tr><th>When / #</th><th>Game</th><th>Match</th><th>Stake / Fee</th><th>Result</th><th>Resolution</th><th>Proof</th></tr></thead><tbody>${pg.rows.map(x=>`<tr class="table-click" data-cat-row="${x.id}"><td>${new Date(x.t).toLocaleTimeString()}<br><span class="muted">#${x.id}</span></td><td><b>${x.game}</b></td><td>${x.playerA} [${x.pickA}]<br>vs ${x.playerB} [${x.pickB}]</td><td>${fmt(x.stake)} / ${fmt(x.fee)}</td><td><span class="tag on">${x.result}</span></td><td style="min-width:240px">${x.detail}</td><td><span class="tag on" title="${x.proof||''}">✓ ${String(x.proof||'').slice(0,10)}…</span></td></tr>`).join('')}</tbody></table>`;
}
const ADMIN_NAV_META=[
 ['Command','dash','⌁','Overview','KPIs, alerts, revenue and quick actions','dashboard command'],['Command','ops','🚦','Live Operations','Player controls, queues, bots, limits and transfers','liquidity player bot'],['Command','features','✨','Feature Hub','Community, Arcade, Progress and Economy telemetry','b1 b4 features'],['Command','directory','🗂','Feature Directory','Search every feature and open exact Player/Admin destinations','product map'],
 ['Commercial','rates','💹','Rates & Jackpot','Fees, jackpot rules and transfer limits','configuration'],['Commercial','econ','📈','Economy','P&L, taps, sinks, simulator and compensation','revenue finance'],['Commercial','topups','💳','Top-up Analytics','Player and bot top-up volume, bonuses, trends and records','topup deposit credit bonus liquidity'],['Commercial','promo','🎁','Promotions','Campaigns, top-up offer and broadcast banner','offers marketing'],
 ['Engagement','vip','💎','VIP & Levels','Eight VIP tiers and paginated level rewards','progression'],['Engagement','trny','🏟','Tournaments','Create and inspect bot/player brackets','competition'],
 ['Governance','audit','🧾','Audit & Data','Audit trail, histories, proofs and exports','compliance records'],['Governance','trust','🛡️','Trust Center','Analytics, anti-cheat, RG, PWA, API, 2FA and statements','security safety']
].map(x=>({group:x[0],tab:x[1],icon:x[2],name:x[3],desc:x[4],keys:x[5]}));
const ADMIN_CATALOG_GAMES=[['overunder','Over / Under'],['speed','Speed Round'],['tug','Tug of War'],['evenodd','Even / Odd Sum'],['closest','Closest Number'],['luckybattle','Lucky Number Battle'],['sumpredict','Sum Prediction'],['higherbyte','Higher Byte'],['patternrace','Pattern Race'],['parlayduel','Parlay Duel'],['prediction','Prediction Streak'],['blind','Blind Pick'],['rangewar','Range War'],['bullseye','Bullseye'],['chain','Chain Reaction'],['ladder','Elimination Ladder'],['mirrored','Mirrored Coins'],['rps','CAT18 · Rock Paper Scissors'],['closest21','CAT19 · Closest to 21'],['triplecoin','CAT20 · Triple Coin Majority'],['sequencebuilder','CAT21 · Sequence Builder'],['dicesumduel','CAT22 · Dice Sum Duel'],['colourspectrum','CAT23 · Colour Spectrum'],['primecomposite','CAT24 · Prime vs Composite'],['medianbattle','CAT25 · Median Battle'],['streaksurvivor','CAT26 · Streak Survivor'],['territory','CAT27 · Territory Capture'],['modulo4','CAT28 · Modulo Four'],['pokerhigh','CAT29 · Poker High'],['threedicepoker','CAT30 · Three Dice Poker'],['lastdigit','CAT31 · Last Digit Duel'],['binaryduel','CAT32 · Binary Code Duel'],['coinbalance','CAT33 · Coin Balance Battle']];
const ADMIN_ARCADE_GAMES=[['wheel','G1 · Lucky Wheel'],['scratch','G2 · Scratch Cards'],['dice','G3 · Dice Roll'],['raffle','G4 · Weekly Raffle'],['ladder','G5 · Multiplier Ladder'],['war','G6 · War Card'],['plinko','G7 · Plinko'],['slots','G8 · Mini Slots'],['keno','G9 · Quick Keno'],['bingo','G10 · Bingo Rush'],['treasure','G11 · Treasure Hunt'],['memory','G12 · Memory Match'],['dropball','G13 · Drop Ball'],['trivia','G14 · Daily Trivia'],['fishing','G15 · Fishing Reel'],['penalty','G16 · Penalty Shootout'],['coinpusher','G17 · Coin Pusher'],['tower','G18 · Tower Builder'],['match3','G19 · Match-3 Rush'],['vault','G20 · Mystery Vault']];
function goAdminTab(name){document.querySelector(`.tab[data-tab="${name}"]`)?.click();}
function adminCommandEntries(){return [...ADMIN_NAV_META.map(x=>({...x,playerTab:'',feature:''})),...ADMIN_CATALOG_GAMES.map(x=>({group:'Player · Catalog Games',playerTab:'games',feature:x[0],icon:'🎲',name:x[1],desc:'Open exact P2P Catalog game',keys:'player game'})),...ADMIN_ARCADE_GAMES.map(x=>({group:'Player · Arcade+ Games',playerTab:'newgames',feature:x[0],icon:'🎮',name:x[1],desc:'Open exact Arcade+ game',keys:'player arcade'}))];}
function renderAdminCommand(q=''){q=q.trim().toLowerCase();const rows=adminCommandEntries().filter(x=>!q||`${x.name} ${x.desc} ${x.keys} ${x.group}`.toLowerCase().includes(q));let group='';$("adminCommandList").innerHTML=rows.map((x,i)=>{const head=x.group!==group?(group=x.group,`<div class="admin-command-group">${x.group}</div>`):'';return `${head}<button class="admin-command-item" ${x.playerTab?`data-command-player="${x.playerTab}" data-command-feature="${x.feature}"`:`data-command-admin="${x.tab}"`}><span class="ci">${x.icon}</span><span><b>${x.name}</b><small>${x.desc}</small></span><kbd>${i+1<10?i+1:''}</kbd></button>`;}).join('')||'<div class="muted" style="padding:18px">No matching Admin screens or games.</div>';}
function openAdminCommand(q=''){const bg=$("adminCommandBg");bg.classList.add('show');bg.setAttribute('aria-hidden','false');$("adminCommandSearch").value=q;renderAdminCommand(q);setTimeout(()=>$("adminCommandSearch").focus(),0);}
function closeAdminCommand(){$("adminCommandBg").classList.remove('show');$("adminCommandBg").setAttribute('aria-hidden','true');}
function filterAdminNavigation(q){q=q.trim().toLowerCase();let shown=0;document.querySelectorAll('#tabs .tab[data-tab]').forEach(b=>{const meta=ADMIN_NAV_META.find(x=>x.tab===b.dataset.tab),match=!q||`${b.textContent} ${meta?.name||''} ${meta?.desc||''} ${meta?.keys||''}`.toLowerCase().includes(q);b.style.display=match?'':'none';if(match)shown++;});document.querySelectorAll('#tabs .admin-nav-label').forEach(x=>x.style.display=q?'none':'');$("adminNavEmpty").style.display=shown?'none':'block';}
function syncAdminNavigation(tab){$("adminNavJump").value=tab;document.querySelectorAll('#adminQuickDock [data-admin-tab]').forEach(b=>b.classList.toggle('active',b.dataset.adminTab===tab));}

export function bind(){
  "use strict";
  if(botLiveChannel)botLiveChannel.onmessage=e=>{const m=e.data||{};if(m.type==='player-alive'){lastPlayerAliveAt=Date.now();renderAdminLiveStatus();}else if(m.type==='bot-tick'){lastPlayerAliveAt=Date.now();lastBotTickAt=m.t||Date.now();renderAdminLiveStatus();}};
  setInterval(sendAdminBotPulse,1800);
  window.addEventListener('visibilitychange',sendAdminBotPulse);
  $("adminCommandBtn").onclick=()=>openAdminCommand();
  $("adminMobileMore").onclick=()=>openAdminCommand();
  $("adminCommandClose").onclick=closeAdminCommand;
  $("adminCommandBg").onclick=e=>{if(e.target===$("adminCommandBg"))closeAdminCommand();};
  $("adminCommandSearch").oninput=e=>renderAdminCommand(e.target.value);
  $("adminCommandList").onclick=e=>{const b=e.target.closest('[data-command-admin],[data-command-player]');if(!b)return;closeAdminCommand();if(b.dataset.commandPlayer)window.open(`index.html?tab=${b.dataset.commandPlayer}&feature=${b.dataset.commandFeature}`,'_blank');else goAdminTab(b.dataset.commandAdmin);};
  $("adminNavSearch").oninput=e=>filterAdminNavigation(e.target.value);
  $("adminNavJump").onchange=e=>{if(e.target.value)goAdminTab(e.target.value);};
  $("adminQuickDock").onclick=e=>{const b=e.target.closest('[data-admin-tab]');if(b)goAdminTab(b.dataset.adminTab);};
  document.addEventListener('keydown',e=>{const typing=['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName);if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openAdminCommand();}else if(e.key==='/'&&!typing){e.preventDefault();openAdminCommand();}else if(e.key==='Escape')closeAdminCommand();});
}


/* expose top-level symbols to globalThis so legacy inline handlers and the shared theme engine can resolve them */
Object.assign(globalThis,{$,ADMIN_ARCADE_GAMES,ADMIN_CATALOG_GAMES,ADMIN_LIVE_ID,ADMIN_NAV_META,BOT_CHANNEL_NAME,DIRECTORY,FEATURE_DIRECTORY,PAGE_SIZE,SAVE_KEY,VIEWS,VIP_BENEFIT_LABELS,adminAntiCheatScan,adminCommandEntries,audit,botLiveChannel,cfg,checkVipMonthReset,closeAdminCommand,drawRng,filterAdminNavigation,fmt,goAdminTab,houseCashIn,houseCashOut,houseGross,houseNet,houseNetCash,lastPlayerAliveAt,load,openAdminCommand,pageRows,processBotWithdrawals,readVip,reconcileHouse,render,renderAdminChrome,renderAdminCommand,renderAdminLiveStatus,renderAll,renderAudit,renderCatalogHistory,renderDash,renderEcon,renderFeatureAdmin,renderFeatureDirectory,renderFlags,renderGameHistory,renderLevels,renderPeople,renderPromo,renderTopupAnalytics,renderTrny,renderTrust,renderVip,renderWithdrawals,save,sendAdminBotPulse,setPager,syncAdminNavigation,toast,topupAnalytics});

export {$,ADMIN_ARCADE_GAMES,ADMIN_CATALOG_GAMES,ADMIN_LIVE_ID,ADMIN_NAV_META,BOT_CHANNEL_NAME,DIRECTORY,FEATURE_DIRECTORY,PAGE_SIZE,SAVE_KEY,VIEWS,VIP_BENEFIT_LABELS,adminAntiCheatScan,adminCommandEntries,audit,botLiveChannel,cfg,checkVipMonthReset,closeAdminCommand,drawRng,filterAdminNavigation,fmt,goAdminTab,houseCashIn,houseCashOut,houseGross,houseNet,houseNetCash,lastPlayerAliveAt,load,openAdminCommand,pageRows,processBotWithdrawals,readVip,reconcileHouse,render,renderAdminChrome,renderAdminCommand,renderAdminLiveStatus,renderAll,renderAudit,renderCatalogHistory,renderDash,renderEcon,renderFeatureAdmin,renderFeatureDirectory,renderFlags,renderGameHistory,renderLevels,renderPeople,renderPromo,renderTopupAnalytics,renderTrny,renderTrust,renderVip,renderWithdrawals,save,sendAdminBotPulse,setPager,syncAdminNavigation,toast,topupAnalytics};
