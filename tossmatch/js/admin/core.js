/* FlipArena admin module — _top */
import "../shared/runtime.js";
import {applyTheme,renderNavTheme} from "../shared/theme.js";
import {coin,ledgerAudit,numOr,reconciliation,revenueChartSVG,revenueSeries,transactionLog,wageredVolume} from "../shared/money.js";
import {createBadge,createLiveBadge} from "../../src/components/badge/badge.js";
import {createButton} from "../../src/components/button/button.js";
import {createCard,createStatGrid,createStatTile} from "../../src/components/card/card.js";

const SAVE_KEY="tossmatch_v8",BOT_CHANNEL_NAME="tossmatch_bot_live_v1";
const ADMIN_LIVE_ID="admin-"+(sessionStorage.adminLiveId||(sessionStorage.adminLiveId=Math.random().toString(36).slice(2)));
const botLiveChannel=typeof BroadcastChannel!=="undefined"?new BroadcastChannel(BOT_CHANNEL_NAME):null;
let lastPlayerAliveAt=0;

const VIP_BENEFIT_LABELS={1:"Basic access · quests · jackpot",2:"Blue chat · 1 emoji",3:"Gold frame · priority queue · 2 emojis",4:"Platinum skin · 2 emojis",5:"Diamond skin · tournament −5% · 3 emojis",6:"Animated frame · birthday eligible · tournament −10% · shop −10% · 5 emojis",7:"Royal Crown · tournament −10% · shop −20% · priority support · 8 emojis",8:"Legend skins · tournament −15% · shop −30% · all emojis · gold name · early access"};
const FEATURE_DIRECTORY=[
 {cat:'Core Games',code:'CORE-1',name:'Coin Toss',desc:'Escrowed HEADS/TAILS P2P match with fee, jackpot, proof, manual take and auto-match.',status:'Implemented',tab:'play'},
 {cat:'Core Games',code:'CORE-2',name:'P2P Games',desc:'Thirty-three proof-driven games with per-game queues, manual take, carries and history.',status:'Implemented',tab:'games'},
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
 {cat:'Arcade Zone',code:'G1',name:'Lucky Wheel',desc:'Daily free and paid spins with coin and cosmetic prizes.',status:'Implemented',tab:'newgames',feature:'wheel'},
 {cat:'Arcade Zone',code:'G2',name:'Scratch Cards',desc:'Three card tiers, nine reveals and match-based payouts.',status:'Implemented',tab:'newgames',feature:'scratch'},
 {cat:'Arcade Zone',code:'G3',name:'Dice Roll',desc:'Exact double 30× or low/high range 1.8×.',status:'Implemented',tab:'newgames',feature:'dice'},
 {cat:'Arcade Zone',code:'G4',name:'Weekly Raffle',desc:'Player/bot tickets with 80% winner payout and 20% house share.',status:'Implemented',tab:'newgames',feature:'raffle'},
 {cat:'Arcade Zone',code:'G5',name:'Multiplier Ladder P2P',desc:'Matched rung-or-bust P2P duel with split handling.',status:'Implemented',tab:'newgames',feature:'ladder'},
 {cat:'Arcade Zone',code:'G6',name:'War Card Game',desc:'2–Ace cards with automatic War rounds and P2P settlement.',status:'Implemented',tab:'newgames',feature:'war'},
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
 {cat:'Core Games',code:'CAT34',name:'Byte War',desc:'Each side reads three proof bytes; the higher byte-sum wins, equal sums split the pot.',status:'Implemented',tab:'games',feature:'bytewar'},
 {cat:'Core Games',code:'CAT35',name:'Sum Four',desc:'Entrants predict a 0–1020 total; closest to the sum of four proof bytes wins, equal distance splits.',status:'Implemented',tab:'games',feature:'sumfour'},
 {cat:'Core Games',code:'CAT36',name:'High Card Duel',desc:'Each side takes a proof-derived card 2–A; the higher rank wins, equal ranks split.',status:'Implemented',tab:'games',feature:'highcard'},
 {cat:'Arcade Zone',code:'G7',name:'Plinko Drop',desc:'Drop a chip through a proof-derived peg path into prize multiplier slots.',status:'Implemented',tab:'newgames',feature:'plinko'},
 {cat:'Arcade Zone',code:'G8',name:'Mini Slots',desc:'Three proof-derived reels with transparent symbol odds, paylines and capped prizes.',status:'Implemented',tab:'newgames',feature:'slots'},
 {cat:'Arcade Zone',code:'G9',name:'Quick Keno',desc:'Pick numbers from a compact board and compare them with proof-derived draws.',status:'Implemented',tab:'newgames',feature:'keno'},
 {cat:'Arcade Zone',code:'G10',name:'Bingo Rush',desc:'Fast 3×3 card with proof draws; complete a line before the draw limit.',status:'Implemented',tab:'newgames',feature:'bingo'},
 {cat:'Arcade Zone',code:'G11',name:'Treasure Hunt',desc:'Choose tiles on a hidden map containing coins, multipliers, keys and traps.',status:'Implemented',tab:'newgames',feature:'treasure'},
 {cat:'Arcade Zone',code:'G12',name:'Memory Match',desc:'Resolve eight proof-driven memory moves and earn published pair-count prizes.',status:'Implemented',tab:'newgames',feature:'memory'},
 {cat:'Arcade Zone',code:'G13',name:'Drop Ball',desc:'Release a ball into columns with proof-derived bounce direction and visible multiplier pockets.',status:'Implemented',tab:'newgames',feature:'dropball'},
 {cat:'Arcade Zone',code:'G14',name:'Daily Trivia',desc:'One proof-retained daily question attempt; a correct answer pays the published 3× reward.',status:'Implemented',tab:'newgames',feature:'trivia'},
 {cat:'Arcade Zone',code:'G15',name:'Fishing Reel',desc:'Cast, wait and reel proof-derived fish rarities for collection and coin rewards.',status:'Implemented',tab:'newgames',feature:'fishing'},
 {cat:'Arcade Zone',code:'G16',name:'Penalty Shootout',desc:'Pick shot direction against a proof-derived goalkeeper for a five-kick score challenge.',status:'Implemented',tab:'newgames',feature:'penalty'},
 {cat:'Arcade Zone',code:'G17',name:'Coin Pusher',desc:'Five proof-derived drops push stacks toward published 0×–6× reward trays.',status:'Implemented',tab:'newgames',feature:'coinpusher'},
 {cat:'Arcade Zone',code:'G18',name:'Tower Builder',desc:'Choose floor 3, 5 or 7 and survive every proof-derived risk check for the published multiplier.',status:'Implemented',tab:'newgames',feature:'tower'},
 {cat:'Arcade Zone',code:'G19',name:'Match-3 Rush',desc:'A proof-derived 5×5 gem board pays by horizontal and vertical three-symbol matches.',status:'Implemented',tab:'newgames',feature:'match3'},
 {cat:'Arcade Zone',code:'G20',name:'Mystery Vault',desc:'Choose one of five keys; the proof-selected winning key pays 4.5×.',status:'Implemented',tab:'newgames',feature:'vault'},
 {cat:'Arcade Zone',code:'G21',name:'Crash',desc:'Restored classic: cash out before the proof-derived bust point; published 97% RTP curve with auto cash-out.',status:'Implemented',tab:'newgames',feature:'crash'},
 {cat:'Arcade Zone',code:'G22',name:'Hi-Lo',desc:'Restored classic: build a higher-or-lower card streak at 1.7× per correct guess and bank at any time.',status:'Implemented',tab:'newgames',feature:'hilo'},
 {cat:'Arcade Zone',code:'G23',name:'Mines',desc:'Restored classic: reveal gems on a 5×5 board while avoiding proof-placed mines; multiplier rises per gem.',status:'Implemented',tab:'newgames',feature:'mines'},
 {cat:'Arcade Zone',code:'G24',name:'Roulette',desc:'Bet RED, BLACK or GREEN on a proof-rolled 16-pocket wheel; colours pay 2×, green pays 15×, pocket zero voids.',status:'Implemented',tab:'newgames',feature:'roulette'},
 {cat:'Arcade Zone',code:'G25',name:'Blackjack',desc:'One-shot HIT or STAND on a two-card proof deal; natural pays 3×, win 2×, push 1×, bust/lose 0×.',status:'Implemented',tab:'newgames',feature:'blackjack'},
 {cat:'Progression',code:'P1',name:'Battle Pass',desc:'Monthly free/premium XP milestones and reward claims.',status:'Implemented',tab:'progressionplus',feature:'pass'},
 {cat:'Progression',code:'P2',name:'7-Day Login Calendar',desc:'Escalating automatic rewards with day-7 cosmetic and BONUS.',status:'Implemented',tab:'progressionplus',feature:'calendar'},
 {cat:'Progression',code:'P3',name:'Weekly Challenges',desc:'Wins, game variety and streak goals with larger rewards.',status:'Implemented',tab:'progressionplus',feature:'weekly'},
 {cat:'Progression',code:'P4',name:'Prestige',desc:'Level reset for permanent XP boost, badge and Rainbow frame.',status:'Implemented',tab:'progressionplus',feature:'prestige'},
 {cat:'Progression',code:'P5',name:'Skill Matchmaking',desc:'Five skill tiers and preferred peer-bot matching with fallback.',status:'Implemented',tab:'progressionplus',feature:'skill'},
 {cat:'Progression',code:'P6',name:'Career Milestones',desc:'Twelve lifetime goals (games, wins, wager, jackpots, level, achievements) with one-time BONUS rewards that survive Prestige.',status:'Implemented',tab:'progressionplus',feature:'milestones'},
 {cat:'Economy+',code:'E1',name:'Mystery Crates',desc:'Four tiers with 1–3 cosmetics and a guaranteed rarity floor.',status:'Implemented',tab:'economyplus',feature:'crates'},
 {cat:'Economy+',code:'E2',name:'Trading Post',desc:'Bot listings, player sales and a 10% house transaction fee.',status:'Implemented',tab:'economyplus',feature:'trade'},
 {cat:'Economy+',code:'E3',name:'Staking Vault',desc:'Flexible staking with completed-week 1% interest and claim cap.',status:'Implemented',tab:'economyplus',feature:'staking'},
 {cat:'Economy+',code:'E4',name:'Subscriptions',desc:'Plus, Pro and Elite 30-day tiers with engagement perks.',status:'Implemented',tab:'economyplus',feature:'subscription'},
 {cat:'Economy+',code:'E5',name:'Coin Boosters',desc:'Time-limited 2× XP or +5% rakeback consumables.',status:'Implemented',tab:'economyplus',feature:'boosters'},
 {cat:'Economy+',code:'E6',name:'Cosmetic Crafting',desc:'Spend MAIN on uncommon, rare or epic rarity-floor cosmetic recipes with retained history.',status:'Implemented',tab:'economyplus',feature:'utility'},
 {cat:'Economy+',code:'E7',name:'Event Ticket Packs',desc:'Buy persistent non-payout demo utility tickets in 1, 3 or 7-ticket packs.',status:'Implemented',tab:'economyplus',feature:'utility'},
 {cat:'Economy+',code:'E8',name:'Clan Treasury',desc:'Non-withdrawable MAIN contributions create clan utility resources and levels without wagering advantage.',status:'Implemented',tab:'economyplus',feature:'utility'},
 {cat:'Economy+',code:'E9',name:'Private Room Upgrades',desc:'Unlock persistent Basic, Neon, Royal or Cosmic visual room tiers with no gameplay advantage.',status:'Implemented',tab:'economyplus',feature:'utility'},
 {cat:'Economy+',code:'E10',name:'Auction House',desc:'Three weekly cosmetic lots with autonomous bot bidding; winner pays at the hammer and the house keeps a 10% hammer fee recognised as auction revenue.',status:'Implemented',tab:'economyplus',feature:'auction'},
 {cat:'Player & Retention',code:'RET-1',name:'8-Tier VIP',desc:'Monthly wager tiers, rakeback, permanent rewards, discounts and priority.',status:'Implemented',tab:'season',admin:'vip'},
 {cat:'Player & Retention',code:'RET-2',name:'Achievements & Levels',desc:'Forty-nine achievements, configurable rewards through level 50 and milestone cosmetics.',status:'Implemented',tab:'season',admin:'vip'},
 {cat:'Player & Retention',code:'RET-3',name:'Player History',desc:'Nine categories, search, sorting, pagination, details and export.',status:'Implemented',tab:'history'},
 {cat:'Player & Retention',code:'RET-4',name:'Advanced Statistics',desc:'Lifetime wager, total/max payout, fees, averages, ROI, payout trend and Player top-up analytics.',status:'Implemented',tab:'stats'},
 {cat:'Wallet & Commerce',code:'WAL-1',name:'Segmented Wallet',desc:'MAIN, BONUS, REFERRAL, RAKEBACK and BANK with stake caps.',status:'Implemented',tab:'wallet'},
 {cat:'Wallet & Commerce',code:'WAL-2',name:'Top-ups & Deposits',desc:'Unified player and bot top-up and deposit records with references/status, bot initialization at 0 MAIN + 1,000 BONUS, required first-top-up gate, Admin promotion control and combined analytics with an All / Players / Bots filter.',status:'Implemented',tab:'stats',admin:'topups'},
 {cat:'Wallet & Commerce',code:'WAL-5',name:'Player Deposits & Withdrawals',desc:'Demo deposit confirmation/receipt (method, reference, processing state) and KYC-verified withdrawals with min checks and full Admin visibility.',status:'Implemented',tab:'wallet',admin:'withdraw'},
 {cat:'Wallet & Commerce',code:'WAL-3',name:'Shop & Cosmetics',desc:'Nine expanded categories, 38 new items, VIP rewards, discounts and equip controls.',status:'Implemented',tab:'shop'},
 {cat:'Wallet & Commerce',code:'WAL-4',name:'Transfers & Bot Economy',desc:'Bots start at 0 MAIN + 1,000 BONUS, complete a varied first MAIN top-up before activity, then use active economy, later top-ups and roster growth.',status:'Implemented',tab:'wallet',admin:'ops'},
 {cat:'Operations',code:'OPS-1',name:'Command Center',desc:'KPIs, live bot-engine status, alerts, quick actions, revenue, top-up volume, jackpot and RNG monitoring.',status:'Implemented',admin:'dash'},
 {cat:'Operations',code:'OPS-2',name:'Feature Hub',desc:'Community, Arcade Zone, Progress+ and Economy+ telemetry with feature administration controls.',status:'Implemented',admin:'features'},
 {cat:'Operations',code:'OPS-3',name:'Audit & Exports',desc:'Audit trail, review flags, filtering, pagination and data exports.',status:'Implemented',admin:'audit'},
 {cat:'Operations',code:'OPS-4',name:'Promotions Manager',desc:'Scheduled campaigns now support Player credit/cash-drop claims, next-top-up activation, one-claim tracking and Admin counts.',status:'Implemented',tab:'services',feature:'offers',admin:'promo'},
 {cat:'Operations',code:'OPS-5',name:'Withdrawals',desc:'Bots file cash-outs when MAIN reaches a personal 3,000-5,000 trigger; the unified Admin ledger tracks paid bot requests and the demo player\'s KYC-verified withdrawals in one table with an All / Players / Bots filter.',status:'Implemented',admin:'withdraw'},
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
 {cat:'Suggested — LiveOps & Social',code:'LIVE1',name:'Event Calendar & Scheduled Play',desc:'Community Events tab: daily trivia, weekly raffle, live auto-tournaments, season/VIP resets and active campaigns in one timezone-aware calendar with persisted reminders.',status:'Implemented (demo)',tab:'community',feature:'events'},
 {cat:'Suggested — LiveOps & Social',code:'LIVE2',name:'Match Replay & Shareable Proof',desc:'Step-by-step replay, share link and redacted proof package for games and tournaments.',status:'Suggested'},
 {cat:'Suggested — LiveOps & Social',code:'LIVE3',name:'Clan Seasons & Cooperative Quests',desc:'Season divisions, shared clan goals, contribution ledger, rewards and archived standings.',status:'Suggested'},
 {cat:'Admin Console',code:'ADM-1',name:'Admin Login & RBAC',desc:'Session-gated sign-in (admin/flip2026) with role-based screen access for Super Admin, Finance, Operations and Support, 2FA demo code 246810, header profile and logout; sessions persist per browser tab.',status:'Implemented',admin:'settings'},
 {cat:'Admin Console',code:'ADM-2',name:'Approvals & Review Queue',desc:'KYC verification with player approve/reset plus a simulated bot request queue, automated review-flag triage (clear/escalate), freeze controls and a persistent exclusion list — all audit-logged with nav badges.',status:'Implemented',admin:'approvals'},
 {cat:'Admin Console',code:'ADM-3',name:'Admin Settings',desc:'House economics (fees, rakes, jackpot arm/pay, stake range), administrator role switching, maintenance mode, engine speed and factory reset with audit logging.',status:'Implemented',admin:'settings'},
 {cat:'Admin Console',code:'ADM-4',name:'Reports & Analytics',desc:'Seven-day revenue, deposits and cash-out charts, all-time revenue mix, busiest games and one-click CSV/JSON report exports.',status:'Implemented',admin:'reports'},
 {cat:'Admin Console',code:'ADM-5',name:'Games & Content',desc:'Catalog-wide plays and fee contribution per game with live enable/disable controls, filter and sort.',status:'Implemented',admin:'games'},
 {cat:'Admin Console',code:'ADM-6',name:'Referrals',desc:'Demo player referral code, referred player roster and the house 5% referral payout, with a register action.',status:'Implemented',admin:'referrals'},
 {cat:'Admin Console',code:'ADM-7',name:'Announcements',desc:'Create, publish, unpublish and delete in-app announcements; published ones show on player Homes.',status:'Implemented',admin:'announcements'},
 {cat:'Admin Console',code:'ADM-8',name:'Support & Messaging',desc:'Unified ticket inbox covering player and bot reporters with filter, reply and close (all audit-logged), plus platform messages delivered to the player Services hub.',status:'Implemented',admin:'support'},
 {cat:'Admin Console',code:'ADM-9',name:'Admin Users & Backups',desc:'Console account management (add users, change roles, disable) and point-in-time state snapshots with create/restore/delete, retained in the browser.',status:'Implemented',admin:'settings'},
 {cat:'Admin Console',code:'ADM-10',name:'Compliance & Privacy',desc:'Dated compliance reports (revenue, funding, KYC, flags, exclusions, admin users, full audit log) with checksum and JSON/CSV export, plus player-data export and audited erasure.',status:'Implemented',admin:'compliance'},
 {cat:'Suggested — Trust & Compliance',code:'TRUST1',name:'Identity, Age & Jurisdiction Checks',desc:'Age gate, KYC status, geofencing and jurisdiction-specific feature eligibility.',status:'Suggested'},
 {cat:'Suggested — Trust & Compliance',code:'TRUST2',name:'Privacy & Data Rights Center',desc:'Consent history, data export, correction and deletion requests with retention status.',status:'Suggested'},
 {cat:'Suggested — Trust & Compliance',code:'TRUST3',name:'Dispute & Support Case Center',desc:'Open cases from a game or transaction, attach proof, track SLA and record resolution.',status:'Suggested'},
 {cat:'Suggested — Trust & Compliance',code:'TRUST4',name:'Device & Session Management',desc:'View active devices, revoke sessions, detect unusual login locations and require step-up verification.',status:'Suggested'},
 {cat:'Suggested — Operations',code:'OPS5',name:'Status & Incident Center',desc:'Service health, incident timeline, maintenance updates, postmortems and player-facing status notices.',status:'Suggested'}
];
const PAGE_SIZE=20;
const DIRECTORY={search:"",category:"",status:""};
const VIEWS={revenue:{range:"day"},withdrawals:{page:1,filter:"",sort:"time-desc",who:"all"},people:{page:1,filter:"",sort:"balance"},audit:{page:1,filter:"",sort:"time-desc"},games:{page:1,filter:"",sort:"time-desc"},catalog:{page:1,filter:"",result:"",sort:"time-desc"},transfers:{page:1,filter:"",sort:"time-desc"},topups:{page:1,filter:"",sort:"time-desc",who:"all"},playerTopups:{page:1,filter:"",sort:"time-desc"},gamesAdmin:{page:1,filter:"",sort:"plays-desc"},announcements:{page:1,filter:"",sort:"time-desc"},support:{page:1,filter:"",sort:"time-desc",status:""},levels:{page:1,filter:"",sort:"level-asc"},queue:{page:1,filter:"",sort:"wait-desc"},flags:{page:1,filter:"",sort:"time-desc"},tournaments:{page:1,status:"",sort:"time-desc"}};
const $=id=>document.getElementById(id);
const fmt=n=>Math.round(n).toLocaleString("en-IN");
function pageRows(rows,view){const pages=Math.max(1,Math.ceil(rows.length/PAGE_SIZE));view.page=Math.max(1,Math.min(view.page,pages));return {rows:rows.slice((view.page-1)*PAGE_SIZE,view.page*PAGE_SIZE),pages,total:rows.length};}
function setPager(prefix,view,meta){const lbl=$(prefix+"Page"),prev=$(prefix+"Prev"),next=$(prefix+"Next");if(lbl)lbl.textContent=`Page ${view.page} / ${meta.pages} · ${meta.total} rows`;if(prev)prev.disabled=view.page<=1;if(next)next.disabled=view.page>=meta.pages;}
function topupAnalytics(){const player=(S.rg?.deposits||[]).map(x=>{const base=+(x.base??x.amount??0),firstBonus=+(x.firstBonus||0),campaignBonus=+(x.campaignBonus||0),bonus=+(x.bonus??(firstBonus+campaignBonus)),credited=+(x.credited??(base+bonus));return {...x,base,amount:base,firstBonus,campaignBonus,bonus,credited,source:x.source||'Player wallet'};}).sort((a,b)=>(b.t||0)-(a.t||0)),bots=(S.botTopups||[]).map(x=>{const firstPromo=+(x.bonus||0),startingBonus=+(x.startingBonus||0),base=+(x.base||0),bonus=firstPromo+startingBonus,credited=+(x.walletCredit??(base+bonus));return {...x,base,firstPromo,startingBonus,bonus,credited};}).sort((a,b)=>(b.t||0)-(a.t||0)),summary=rows=>{const sum=k=>rows.reduce((n,x)=>n+(+x[k]||0),0),base=sum('base'),bonus=sum('bonus'),credited=sum('credited'),count=rows.length;return {count,base,bonus,credited,average:count?Math.round(base/count):0,largest:rows.reduce((n,x)=>Math.max(n,x.base),0),last7:rows.filter(x=>x.t>=Date.now()-7*86400000).reduce((n,x)=>n+x.base,0),last30:rows.filter(x=>x.t>=Date.now()-30*86400000).reduce((n,x)=>n+x.base,0),promoRate:base?bonus/base*100:0};};return {player,bots,playerStats:summary(player),botStats:{...summary(bots),unique:new Set(bots.map(x=>x.bot)).size,ready:S.bots.filter(b=>b.firstTopupDone).length,pending:S.bots.filter(b=>!b.firstTopupDone).length,startingBonus:bots.reduce((n,x)=>n+x.startingBonus,0),firstPromo:bots.reduce((n,x)=>n+x.firstPromo,0)},combined:{count:player.length+bots.length,base:player.reduce((n,x)=>n+x.base,0)+bots.reduce((n,x)=>n+x.base,0),bonus:player.reduce((n,x)=>n+x.bonus,0)+bots.reduce((n,x)=>n+x.bonus,0),credited:player.reduce((n,x)=>n+x.credited,0)+bots.reduce((n,x)=>n+x.credited,0)}};}
function toast(m){const t=document.createElement("div");t.className="toast";t.textContent=m;$("toasts").appendChild(t);setTimeout(()=>{t.style.opacity=0;t.style.transition=".3s";setTimeout(()=>t.remove(),300)},2800);}
function audit(action,detail=""){S.config.audit.unshift({t:Date.now(),who:"admin",action,detail});if(S.config.audit.length>50)S.config.audit.pop();}
function save(){if(applyingRemoteState)return;localStorage.setItem(SAVE_KEY,JSON.stringify(S));}
function defaultState(){return {v:11.0,frozen:{you:false,reason:"",at:0,by:""},config:{stakeMin:10,stakeMax:1000,payoutCap:0,animMs:2300,edgePct:2,feePct:5,cupRakePct:5,trnyRakePct:10,jpFundPct:10,jpFloor:1,jpArm:50,jpPayPct:50,nonMainCapPct:20,transferFee:2,transferMin:10,transferCap:500,
    botTopupThreshold:500,botGrowthMax:250,botGrowthIntervalSec:15,botGrowthBatch:1,botArcadePerTick:2,wdMin:3000,wdMax:5000,wdTickChance:0.35,
    vip:[{tier:1,name:"Starter",wagered:0,rakeback:0,color:"#8d6e63"},{tier:2,name:"Silver",wagered:1000,rakeback:4,color:"#c0c0c0"},{tier:3,name:"Gold",wagered:3000,rakeback:6,color:"#ffd700"},{tier:4,name:"Platinum",wagered:8000,rakeback:8,color:"#e5e4e2"},{tier:5,name:"Diamond",wagered:20000,rakeback:12,color:"#b9f2ff"},{tier:6,name:"Black Diamond",wagered:50000,rakeback:15,color:"linear-gradient(135deg,#111827,#f43f5e)"},{tier:7,name:"Royal",wagered:75000,rakeback:17,color:"linear-gradient(135deg,#f43f5e,#fbbf24)"},{tier:8,name:"Legend",wagered:100000,rakeback:20,color:"linear-gradient(135deg,#fbbf24,#f43f5e,#a855f7)"}],
    levelRewards:Object.fromEntries(Array.from({length:49},(_,n)=>[n+2,(n+2)*50])),
    features:{autoMatch:true,quests:true,dailyLogin:true,bots:true,botGrowth:true,maintenance:false,topupPromo:true},
    broadcast:"",promotions:[],seasonNumber:1,seasonEnds:0,
    house:{capital:100000,fees:0,catalogFees:0,cupRakes:0,trnyRakes:0,shop:0,promoCost:0,comps:0,withdrawals:0,playerWithdrawals:0,deposits:0,botDeposits:0,netRevenue:0,netCash:0,xfFees:0,auctionFees:0,rakebackPaid:0,referralCost:0},
    taps:0,sinks:0,audit:[],reviewFlags:[]},
    wallet:{main:1000,bonus:250,referral:50,rakeback:0,bank:0},
    level:1,xp:0,monthWagered:0,accruedRakeback:0,vipMonthKey:new Date().toISOString().slice(0,7),vipUnlockedTier:1,vipBenefits:{unlockedAt:{1:Date.now()},birthdayEligible:false},streak:0,bestStreak:0,
    quests:{settle:0,win:0,cup:0,claimed:{}},owned:{skins:["classic"],flags:[],avatars:[],frames:["none"],colours:["default"],fx:["confetti"],themes:["midnight"],sounds:["standard"],emojis:[]},
    equipped:{skin:"classic",flag:"",avatar:"",frame:"none",colour:"default",fx:"confetti",theme:"midnight",sound:"standard"},
    games:[],reactions:{},stats:{games:0,wins:0,losses:0,biggestStake:0,jackpots:0,net:0,bestWin:0,cupsWon:0,trnysWon:0},
    waiting:[],cups:[],trnys:[],x2room:[],feed:[],jackpot:120,announcements:[],gamesEnabled:{},supportTickets:[],adminMessages:[],adminUsers:[],backups:[],privacyErasedAt:0,
    bots:[],botActivity:{socialActions:0,arcadePlays:0,createdBots:0,socialLog:[],arcadeLog:[],lastCreatedAt:0},services:{apiKey:"",apiLog:[],notifications:{enabled:false},notificationLog:[],twoFactor:{secret:"",enabled:false,verifiedAt:0},antiCheat:{lastScan:0,score:0,findings:[]},promoClaims:{},activeDepositPromo:"",statements:[],emailLog:[]},rg:{depositLimits:{daily:0,weekly:0,monthly:0},pendingDepositLimits:null,deposits:[],sessionLimitMin:0,coolOffMin:1,coolOffUntil:0,selfExUntil:0,selfExPermanent:false,selfExReason:"",realityIntervalMin:5,lastRealityAt:0,sessionPoints:[]},analytics:{samples:[],lastSampleAt:0},settings:{theme:"dark",themeName:"midnight",customPalette:null,language:"en"},referralCode:"TM-0000",referredBy:"",referralCount:0,referralEarned:0,transferToday:0,transferDay:"",playerName:"",firstDepositDone:false,
    kyc:{verified:false,verifiedAt:0,name:"",docType:""},playerWithdrawals:{count:0,amount:0,log:[]},walletRefs:{deposit:1,withdraw:1},
    login:{streak:0,lastDay:""},lossLimit:0,global:{heads:0,tails:0,totalGames:0,jackpots:0},ledger:[],botTransfers:[],botTopups:[],gid:1};}
function load(){
  const d=defaultState();
  try{const raw=localStorage.getItem(SAVE_KEY);if(raw){const p=JSON.parse(raw);
    // deep merge config
    S=Object.assign(d,p);
    S.settings=Object.assign(d.settings,p.settings||{});
    S.config=Object.assign(d.config,p.config||{});
    S.frozen=Object.assign(d.frozen,p.frozen||{});
    S.config.stakeMin=Math.max(1,Math.round(S.config.stakeMin||10));
    S.config.stakeMax=Math.max(S.config.stakeMin,Math.round(S.config.stakeMax||1000));
    S.config.payoutCap=Math.max(0,Math.round(S.config.payoutCap||0));
    S.config.animMs=Math.max(200,Math.round(S.config.animMs||2300));
    S.config.edgePct=Math.min(25,Math.max(0,numOr(S.config.edgePct,2)));
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
    seedAdminDefaults();
    return;
  }}catch(e){console.warn(e)}
  S=d;reconcileHouse();
  seedAdminDefaults();
}
function seedAdminDefaults(){
  if(!Array.isArray(S.adminUsers)||!S.adminUsers.length){
    S.adminUsers=[
      {id:"u1",name:"admin",role:"Super Admin",status:"active",createdAt:Date.now()-90*86400000},
      {id:"u2",name:"finance",role:"Finance",status:"active",createdAt:Date.now()-60*86400000},
      {id:"u3",name:"ops",role:"Operations",status:"active",createdAt:Date.now()-30*86400000},
      {id:"u4",name:"support",role:"Support",status:"active",createdAt:Date.now()-12*86400000}
    ];
  }
  if(!Array.isArray(S.supportTickets)||!S.supportTickets.length){
    S.supportTickets=[
      {id:"tk1",who:"Demo player",kind:"player",subject:"Withdrawal reference not received",body:"My withdrawal was paid but I never got the bank reference e-mail.",t:Date.now()-26*3600000,status:"open",reply:"",repliedAt:0},
      {id:"tk2",who:"Vera",kind:"bot",subject:"Jackpot payout timing",body:"Jackpot hit mid-round; please confirm the 50% pool payout landed in my MAIN.",t:Date.now()-7*3600000,status:"open",reply:"",repliedAt:0},
      {id:"tk3",who:"Rex",kind:"bot",subject:"Top-up bonus missing",body:"My first-top-up bonus did not appear on the cycle top-up.",t:Date.now()-3*3600000,status:"open",reply:"",repliedAt:0}
    ];
  }
}
function cfg(){return S.config;}
function houseGross(){const h=cfg().house;return (h.fees||0)+(h.catalogFees||0)+(h.cupRakes||0)+(h.trnyRakes||0)+(h.shop||0)+(h.xfFees||0)+(h.auctionFees||0);}
function houseNet(){const h=cfg().house;return houseGross()-(h.promoCost||0)-(h.comps||0)-(h.rakebackPaid||0)-(h.referralCost||0);}
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
  $("adminHeroText").textContent=c.features.maintenance?'Maintenance is active. New betting is currently paused.':'Monitor liquidity, revenue, risk and engagement across the FlipArena economy.';
  const alerts=[c.features.maintenance?{c:'danger',t:'🚧 Maintenance mode is active'}:{c:'ok',t:'● Betting services operational'},S.waiting.length>20?{c:'warn',t:`⏳ Queue depth elevated: ${S.waiting.length}`}:{c:'ok',t:`⚡ Queue healthy: ${S.waiting.length} open`},S.jackpot>=c.jpArm?{c:'warn',t:`🎰 Jackpot armed at ${fmt(S.jackpot)}`}:{c:'ok',t:`🎰 Jackpot building: ${fmt(S.jackpot)}`},ratio<.15&&c.taps>0?{c:'danger',t:`📉 Inflation risk · sink ratio ${ratio.toFixed(2)}`}:{c:'ok',t:`📈 Economy ratio ${ratio.toFixed(2)}`}];
  $("adminAlerts").innerHTML=alerts.map(a=>`<div class="admin-alert ${a.c}">${a.t}</div>`).join('');renderAdminLiveStatus();
  try{renderNavTheme();}catch(e){}
}
function renderFeatureAdmin(){
  const social=S.social||{},fg=S.featureGames||{},ba=S.botActivity||{},eng=S.engagement||{},ep=S.economyPlus||{},sub=ep.subscription||{},stake=ep.staking||{},boost=ep.boosters||{},utility=ep.utility||{};
  const socialCount=(social.friends||[]).length+(social.chat||[]).length+(social.privateRooms||[]).length+(ba.socialActions||0)+Object.keys(social.eventReminders||{}).filter(k=>social.eventReminders[k]).length;
  const arcadeCount=(fg.wheel?.spins||0)+(fg.dice?.length||0)+(fg.scratch?.length||0)+(fg.ladder?.length||0)+(fg.war?.length||0)+(fg.extended?.plays?.length||0)+(ba.arcadePlays||0);
  const progress=(eng.battlePass?.xp||0)+(eng.prestige||0)*1000+Object.keys(eng.milestones?.claimed||{}).length*10;
  const economy=(ep.cratesOpened||0)+(ep.tradingListings?.length||0)+(stake.balance||0)+(utility.crafts?.length||0)+(utility.ticketPurchases?.length||0)+(utility.clanTreasury||0)+(utility.roomPurchases?.length||0)+(ep.auction?.history?.length||0);
  $("featureTiles").innerHTML=[['🤝',socialCount,'Social actions'],['🎮',arcadeCount,'Arcade sessions'],['🚀',progress,'Progress score'],['💼',economy,'Economy+ activity']].map(x=>`<div class="stat-tile"><div style="font-size:22px">${x[0]}</div><div class="v">${fmt(x[1])}</div><div class="k">${x[2]}</div></div>`).join('');
  $("communityMetrics").innerHTML=`<div class="kv"><span class="k">Friends</span><b>${(social.friends||[]).length}</b></div><div class="kv"><span class="k">Chat messages</span><b>${(social.chat||[]).length}</b></div><div class="kv"><span class="k">Private rooms</span><b>${(social.privateRooms||[]).length}</b></div><div class="kv"><span class="k">Clan</span><b>${social.clan?`[${social.clan.tag}] ${social.clan.name}`:'None'}</b></div><div class="kv"><span class="k">Gifts</span><b>${(social.gifts||[]).length}</b></div><div class="kv"><span class="k">Autonomous bot social actions</span><b>${ba.socialActions||0}</b></div><div class="kv"><span class="k">Incoming bot requests</span><b>${(social.friendRequests||[]).length}</b></div><div class="kv"><span class="k">Event reminders on</span><b>${Object.keys(social.eventReminders||{}).filter(k=>social.eventReminders[k]).length}</b></div>`;
  $("arcadeMetrics").innerHTML=`<div class="kv"><span class="k">Wheel spins</span><b>${fg.wheel?.spins||0}</b></div><div class="kv"><span class="k">Dice sessions</span><b>${fg.dice?.length||0}</b></div><div class="kv"><span class="k">Raffle tickets</span><b>${fg.raffle?.playerTickets||0}</b></div><div class="kv"><span class="k">Scratch history</span><b>${fg.scratch?.length||0}</b></div><div class="kv"><span class="k">Last wheel prize</span><b>${fg.wheel?.lastPrize||'—'}</b></div><div class="kv"><span class="k">Extended Arcade Zone sessions</span><b>${fg.extended?.plays?.length||0}</b></div><div class="kv"><span class="k">Autonomous bot Arcade Zone plays</span><b>${ba.arcadePlays||0}</b></div>`;
  $("progressMetrics").innerHTML=`<div class="kv"><span class="k">Battle Pass</span><b>${eng.battlePass?.premium?'Premium':'Free'} · ${fmt(eng.battlePass?.xp||0)} XP</b></div><div class="kv"><span class="k">Prestige</span><b>${eng.prestige||0}</b></div><div class="kv"><span class="k">Skill-only matching</span><b>${eng.skillOnly?'Enabled':'Off'}</b></div><div class="kv"><span class="k">Weekly wins</span><b>${eng.weekly?.wins||0}</b></div><div class="kv"><span class="k">Milestones claimed</span><b>${Object.keys(eng.milestones?.claimed||{}).length}/12</b></div>`;
  $("economyPlusMetrics").innerHTML=`<div class="kv"><span class="k">Crates opened</span><b>${ep.cratesOpened||0}</b></div><div class="kv"><span class="k">Trading listings</span><b>${ep.tradingListings?.length||0}</b></div><div class="kv"><span class="k">Staked coins</span><b>${fmt(stake.balance||0)}</b></div><div class="kv"><span class="k">Subscription</span><b>${sub.expires>Date.now()?sub.tier:'None'}</b></div><div class="kv"><span class="k">XP / rake boosters</span><b>${boost.xpUntil>Date.now()?'XP active':'—'} / ${boost.rakeUntil>Date.now()?'Rake active':'—'}</b></div><div class="kv"><span class="k">Crafts / event tickets</span><b>${utility.crafts?.length||0} / ${utility.eventTickets||0}</b></div><div class="kv"><span class="k">Clan treasury / room tier</span><b>${fmt(utility.clanTreasury||0)} / ${utility.roomUpgrade||'basic'}</b></div><div class="kv"><span class="k">Auction hammers / fees</span><b>${(ep.auction?.history||[]).length} · ${fmt(cfg().house.auctionFees||0)}</b></div>`;
}
function adminAntiCheatScan(){const svc=S.services,findings=[],st=S.stats||{},wr=st.games?st.wins/st.games:0;if(st.games>=20&&wr>.8)findings.push({severity:'high',rule:'Extreme win rate',detail:`Player win rate ${(wr*100).toFixed(1)}% over ${st.games} games`});if(!Object.values(S.wallet||{}).every(x=>Number.isFinite(x)&&x>=0)||!(S.bots||[]).every(b=>Number.isFinite(b.balance)&&b.balance>=0))findings.push({severity:'high',rule:'Invalid or negative balance',detail:'Invalid or negative balance detected'});const proofs=(S.games||[]).map(g=>g.proof?.finalHash||g.proof?.h).filter(Boolean);if(proofs.some((x,i)=>proofs.indexOf(x)!==i))findings.push({severity:'medium',rule:'Duplicate proof hash',detail:'Duplicate proof hash detected'});if((S.games||[]).some(g=>!Number.isFinite(g.delta)||Math.abs(g.delta||0)>10000000))findings.push({severity:'high',rule:'Malformed or extreme payout',detail:'Malformed or extreme payout record'});if((S.turbo||1)>=1000)findings.push({severity:'medium',rule:'Stress-test speed active',detail:'1000× stress mode active'});if(!findings.length)findings.push({severity:'low',rule:'No anomaly detected',detail:'No local anomaly detected'});const score=Math.min(100,findings.reduce((n,x)=>n+(x.severity==='high'?40:x.severity==='medium'?20:0),0));svc.antiCheat={lastScan:Date.now(),score,findings};findings.filter(x=>x.severity==='high').forEach(x=>cfg().reviewFlags.unshift({t:Date.now(),game:'account',type:'anti-cheat',amount:0,detail:x.detail}));audit('anti-cheat-scan',`risk ${score}`);return svc.antiCheat;}
function renderTrust(){const svc=S.services||{},rg=S.rg||{},an=S.analytics||{samples:[]},samples=an.samples||[],last=samples[samples.length-1]||{},ac=svc.antiCheat||{findings:[]},claims=Object.keys(svc.promoClaims||{}).length,dep=(rg.deposits||[]),since=ms=>dep.filter(x=>x.t>=Date.now()-ms).reduce((n,x)=>n+x.amount,0),max=Math.max(1,...samples.map(x=>x.games||0));
 $("trustTiles").innerHTML=[["🌐",S.bots.length+1,'Visible players'],["🎮",last.games||S.global.totalGames,'Games sampled'],["🛡️",ac.score||0,'Anti-cheat risk'],["📄",(svc.statements||[]).length,'Statements']].map(x=>`<div class="stat-tile"><div style="font-size:20px">${x[0]}</div><div class="v">${fmt(x[1])}</div><div class="k">${x[2]}</div></div>`).join('');
 $("analyticsMetrics").innerHTML=`<div class="kv"><span class="k">Samples</span><b>${samples.length}</b></div><div class="kv"><span class="k">Players / queue</span><b>${last.players||S.bots.length+1} / ${last.queue??S.waiting.length}</b></div><div class="kv"><span class="k">Gross revenue</span><b>${fmt(last.gross||0)}</b></div><div class="kv"><span class="k">Net revenue (NGR)</span><b>${fmt(last.net??houseNet())}</b></div><div class="kv"><span class="k">Cash in / out</span><b>+${fmt(houseCashIn())} / −${fmt(houseCashOut())}</b></div><div class="kv"><span class="k">Bot social / Arcade</span><b>${last.social||0} / ${last.arcade||0}</b></div>`;$("analyticsChart").innerHTML=`<div class="analytics-bars">${samples.slice(-60).map(x=>`<i style="height:${Math.max(3,(x.games||0)/max*100)}%" title="${x.games||0} games · net ${x.net??0}"></i>`).join('')}</div>`;
 $("antiCheatMetrics").innerHTML=`<div class="kv"><span class="k">Risk</span><b>${ac.score||0}/100</b></div><div class="kv"><span class="k">Last scan</span><b>${ac.lastScan?new Date(ac.lastScan).toLocaleString():'Never'}</b></div>`;$("antiCheatList").innerHTML=(ac.findings||[]).map(x=>`<div class="trust-finding"><span>${x.severity==='high'?'🔴':x.severity==='medium'?'🟠':'🟢'}</span><div><b>${x.rule}</b><br><span class="muted">${x.detail}</span></div></div>`).join('')||'<div class="muted">No findings.</div>';
 $("rgAdminMetrics").innerHTML=`<div class="kv"><span class="k">Deposit limits D / W / M</span><b>${rg.depositLimits?.daily||'Off'} / ${rg.depositLimits?.weekly||'Off'} / ${rg.depositLimits?.monthly||'Off'}</b></div><div class="kv"><span class="k">Usage D / W / M</span><b>${fmt(since(86400000))} / ${fmt(since(7*86400000))} / ${fmt(since(31*86400000))}</b></div><div class="kv"><span class="k">Session limit / cool-off</span><b>${rg.sessionLimitMin||'Off'}m / ${rg.coolOffUntil>Date.now()?'ACTIVE':'Off'}</b></div><div class="kv"><span class="k">Self-exclusion</span><b>${rg.selfExPermanent?'PERMANENT':rg.selfExUntil>Date.now()?'ACTIVE until '+new Date(rg.selfExUntil).toLocaleString():'Off'}</b></div><div class="kv"><span class="k">Pending limit increase</span><b>${rg.pendingDepositLimits?new Date(rg.pendingDepositLimits.effectiveAt).toLocaleTimeString():'None'}</b></div>`;
 $("platformAdminMetrics").innerHTML=`<div class="kv"><span class="k">PWA assets</span><b>Manifest + SW + 2 icons</b></div><div class="kv"><span class="k">Language</span><b>${S.settings?.language||'en'}</b></div><div class="kv"><span class="k">API requests</span><b>${(svc.apiLog||[]).length}</b></div><div class="kv"><span class="k">Notifications / log</span><b>${svc.notifications?.enabled?'Enabled':'Off'} / ${(svc.notificationLog||[]).length}</b></div><div class="kv"><span class="k">2FA</span><b>${svc.twoFactor?.enabled?'Enabled':'Off'}</b></div>`;
 $("serviceAdminMetrics").innerHTML=`<div class="grid4"><div class="stat-tile"><div class="v">${(cfg().promotions||[]).length}</div><div class="k">Campaigns</div></div><div class="stat-tile green"><div class="v">${claims}</div><div class="k">Player claims</div></div><div class="stat-tile blue"><div class="v">${(svc.statements||[]).length}</div><div class="k">Statements</div></div><div class="stat-tile purple"><div class="v">${(svc.emailLog||[]).length}</div><div class="k">Email simulations</div></div></div>`;}
function renderFeatureDirectory(){
  const categories=[...new Set(FEATURE_DIRECTORY.map(x=>x.cat))],q=DIRECTORY.search.toLowerCase(),catEl=$("directoryCategory");if(!catEl.dataset.ready){catEl.innerHTML='<option value="">All categories</option>'+categories.map(x=>`<option value="${x}">${x}</option>`).join('');catEl.dataset.ready='1';}catEl.value=DIRECTORY.category;$("directoryStatus").value=DIRECTORY.status;if(document.activeElement!==$("directorySearch"))$("directorySearch").value=DIRECTORY.search;
  // Search matches human-facing copy only — internal codes stay out of the index.
  let rows=FEATURE_DIRECTORY.filter(x=>(!DIRECTORY.category||x.cat===DIRECTORY.category)&&(!DIRECTORY.status||x.status===DIRECTORY.status)&&(!q||`${x.name} ${x.desc} ${x.cat} ${x.status}`.toLowerCase().includes(q)));
  const counts={Implemented:FEATURE_DIRECTORY.filter(x=>x.status==='Implemented').length,Partial:FEATURE_DIRECTORY.filter(x=>x.status==='Partial').length,Suggested:FEATURE_DIRECTORY.filter(x=>x.status==='Suggested').length};$("directoryTiles").innerHTML=[['✅',counts.Implemented,'Implemented'],['⚠️',counts.Partial,'Partial / demo-only'],['🧭',counts.Suggested,'Suggested next'],['🗂',FEATURE_DIRECTORY.length,'Total features']].map(x=>`<div class="stat-tile"><div style="font-size:21px">${x[0]}</div><div class="v">${x[1]}</div><div class="k">${x[2]}</div></div>`).join('');
  $("featureDirectory").innerHTML=categories.map(cat=>{const list=rows.filter(x=>x.cat===cat);if(!list.length)return'';return `<div class="directory-category">${cat} · ${list.length}</div><div class="directory-grid">${list.map(x=>`<div class="directory-card"><div class="directory-top"><span class="directory-code">${x.cat}</span><span class="directory-status ${x.status.toLowerCase().replace(/\W+/g,'')}">${x.status}</span></div><h4>${x.name}</h4><p>${x.desc}</p><div class="directory-links">${x.tab?`<a href="index.html?tab=${x.tab}${x.feature?'&feature='+x.feature:''}" target="_blank">Open player ↗</a>`:''}${x.admin?`<button data-admin-go="${x.admin}">Open admin</button>`:''}${!x.tab&&!x.admin?'<span class="muted">Roadmap item</span>':''}</div></div>`).join('')}</div>`}).join('')||'<div class="muted">No features match these filters.</div>';
}
function render(){
  const c=cfg(),h=reconcileHouse();
  applyTheme();
  renderAdminChrome();renderFeatureAdmin();renderFeatureDirectory();renderTrust();
  renderApprovals();renderSettings();applyAdminNavGroups();updateAdminNavBadges();renderAdminProfile();applyAdminRbac();
  // header
  $("hNet").textContent=fmt(h.netRevenue);
  $("hTopups").textContent=fmt(topupAnalytics().combined.base);
  $("hPool").textContent=fmt(S.jackpot);
  $("hGames").textContent=fmt(S.global.totalGames);
  // dash
  renderDash();
  // rates
  renderRates();
  // vip
  renderVip();
  renderLevels();
  // trny
  renderTrny();
  // promo
  renderPromo();
  // econ and top-up analytics
  renderEcon();renderTopupAnalytics();renderWithdrawals();renderPeople();
  renderReports();renderGamesAdmin();renderReferrals();renderAnnouncements();renderSupport();renderCompliance();
  renderRevenue();renderGameParams();renderSessionMonitor();renderAdminLiveStatus();
  // ops
  renderOps();

}
function renderTopupAnalytics(){
  const a=topupAnalytics(),p=a.playerStats,b=a.botStats,c=a.combined,v=VIEWS.topups,q=v.filter.toLowerCase();
  $( "topupAdminTiles").innerHTML=[{v:fmt(c.credited),k:'Combined credits',cls:'blue'},{v:fmt(c.base),k:'Base top-up volume'},{v:fmt(c.bonus),k:'Top-up promo credits',cls:'red'},{v:fmt(c.count),k:'Top-up events'},{v:fmt(p.credited),k:'Player credits',cls:'green'},{v:fmt(b.credited),k:'Bot credits',cls:'purple'},{v:fmt(p.last30+b.last30),k:'30-day base volume'},{v:fmt(b.unique),k:'Bots topped up'}].map(x=>`<div class="stat-tile ${x.cls||''}"><div class="v">${x.v}</div><div class="k">${x.k}</div></div>`).join('');
  const who=v.who||'all';
  $( "topupWhoToggle").innerHTML=['all','players','bots'].map(k=>`<button class="btn btn-sm ${who===k?'btn-primary':'btn-ghost'}" data-topup-who="${k}">${k==='all'?'All':k==='players'?'Players':'Bots'}</button>`).join('');
  const st=who==='players'?p:who==='bots'?b:{count:p.count+b.count,base:p.base+b.base,bonus:p.bonus+b.bonus,credited:p.credited+b.credited,average:(p.count+b.count)?Math.round((p.base+b.base)/(p.count+b.count)):0,largest:Math.max(p.largest,b.largest),last7:p.last7+b.last7,last30:p.last30+b.last30,promoRate:(p.base+b.base)?(p.bonus+b.bonus)/(p.base+b.base)*100:0};
  let extra='';
  if(who==='bots')extra=`<div class="kv"><span class="k">Unique bots</span><span class="v">${fmt(b.unique)}</span></div><div class="kv"><span class="k">First-top-up ready / blocked</span><span class="v">${fmt(b.ready)} / ${fmt(b.pending)}</span></div><div class="kv"><span class="k">Starting bonus / first promo</span><span class="v">${fmt(b.startingBonus)} / ${fmt(b.firstPromo)}</span></div>`;
  if(who==='all')extra=`<div class="kv"><span class="k">Player / bot events</span><span class="v">${fmt(p.count)} / ${fmt(b.count)}</span></div><div class="kv"><span class="k">Player / bot credited</span><span class="v">${fmt(p.credited)} / ${fmt(b.credited)}</span></div><div class="kv"><span class="k">Unique bots topped up</span><span class="v">${fmt(b.unique)}</span></div>`;
  $( "topupSummary").innerHTML=`<div class="kv"><span class="k">Showing</span><span class="v">${who==='all'?'Players and bots':who==='players'?'Players':'Bots'}</span></div><div class="kv"><span class="k">Top-up count</span><span class="v">${fmt(st.count)}</span></div><div class="kv"><span class="k">Base volume</span><span class="v">${fmt(st.base)}</span></div><div class="kv"><span class="k">Bonus / total credited</span><span class="v">${fmt(st.bonus)} / ${fmt(st.credited)}</span></div><div class="kv"><span class="k">Average / largest base</span><span class="v">${fmt(st.average)} / ${fmt(st.largest)}</span></div><div class="kv"><span class="k">Last 7 / 30 days</span><span class="v">${fmt(st.last7)} / ${fmt(st.last30)}</span></div><div class="kv"><span class="k">Bonus rate</span><span class="v">${st.promoRate.toFixed(1)}%</span></div>`+extra;
  let rows=[
    ...a.player.map(x=>({kind:'player',who:S.playerName||'Demo player',t:x.t||0,base:x.base,bonus:x.bonus,credited:x.credited,note:`${x.method||'Wallet'}${x.reference?' · '+x.reference:''}`,status:x.status||'completed',src:x.source||'Player deposit'})),
    ...a.bots.map(x=>({kind:'bot',who:x.bot,t:x.t||0,base:x.base,bonus:x.bonus,credited:x.credited,note:x.reason||'Low balance',status:'credited',src:'Bot cycle top-up'}))
  ];
  if(who==='players')rows=rows.filter(x=>x.kind==='player');
  if(who==='bots')rows=rows.filter(x=>x.kind==='bot');
  if(q)rows=rows.filter(x=>`${x.who} ${x.note} ${x.src} ${x.status} ${x.base} ${x.bonus} ${x.credited}`.toLowerCase().includes(q));
  rows.sort((x,y)=>v.sort==='time-asc'?x.t-y.t:v.sort==='base-desc'?y.base-x.base:v.sort==='bonus-desc'?y.bonus-x.bonus:v.sort==='credited-desc'?y.credited-x.credited:y.t-x.t);
  const pg=pageRows(rows,v);setPager('topups',v,pg);
  $( "topupList").innerHTML=pg.rows.length?`<table><thead><tr><th>When</th><th>Who</th><th>Base</th><th>Bonus</th><th>Credited</th><th>Detail</th><th>Status</th></tr></thead><tbody>${pg.rows.map(x=>`<tr><td>${new Date(x.t).toLocaleString()}</td><td>${x.who} <span class="tag ${x.kind==='player'?'on':'warn'}">${x.kind==='player'?'Player':'Bot'}</span></td><td>${fmt(x.base)}</td><td>${x.bonus?`+${fmt(x.bonus)}`:'—'}</td><td><b>${fmt(x.credited)}</b></td><td>${x.note}</td><td><span class="tag on">${x.status.toUpperCase()}</span></td></tr>`).join('')}</tbody></table>`:'<div class="muted">No top-ups match.</div>';
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
  $("plShop").textContent=fmt(h.shop);$("plXf").textContent=fmt(h.xfFees||0);if($("plAuction"))$("plAuction").textContent=fmt(h.auctionFees||0);
  $("plGross").textContent=fmt(gross);$("plPromo").textContent=fmt(h.promoCost);$("plComp").textContent=fmt(h.comps);
  if($("plRakeback"))$("plRakeback").textContent=fmt(h.rakebackPaid||0);if($("plReferral"))$("plReferral").textContent=fmt(h.referralCost||0);
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
  $("wdPnl").innerHTML=[["Gross revenue",fmt(gross)],["Promo cost","−"+fmt(h.promoCost||0)],["Comps paid","−"+fmt(h.comps||0)],["Rakeback paid","−"+fmt(h.rakebackPaid||0)],["Referral payouts","−"+fmt(h.referralCost||0)],["Net revenue (NGR)",fmt(net),net>=0?"g":"r"],["Cash in — player deposits","+"+fmt(h.deposits||0)],["Cash in — bot deposits","+"+fmt(h.botDeposits||0)],["Cash in total","+"+fmt(cin)],["Cash out — bot withdrawals","−"+fmt(h.withdrawals||0)],["Cash out — player withdrawals","−"+fmt(h.playerWithdrawals||0)],["Cash out total","−"+fmt(cout)],["Net cash flow",fmt(ncash),ncash>=0?"g":"r"]].map(x=>`<div class="kv"><span class="k">${x[0]}</span><span class="v ${x[2]||''}">${x[1]}</span></div>`).join("");
  const pLog=(S.playerWithdrawals||{}).log||[];
  let rows=[
    ...log.map(x=>({kind:'bot',who:x.name,t:x.t||0,amount:x.amount||0,keep:x.keep||0,detail:'Bot cash-out',status:x.status||'paid'})),
    ...pLog.map(x=>({kind:'player',who:S.playerName||'Demo player',t:x.t||0,amount:x.amount||0,keep:0,detail:`${x.method||'Wallet'}${x.reference?' · '+x.reference:''}`,status:x.status||'paid'}))
  ];
  const wh=v.who||'all';
  if(wh==='players')rows=rows.filter(x=>x.kind==='player');
  if(wh==='bots')rows=rows.filter(x=>x.kind==='bot');
  if(q)rows=rows.filter(x=>`${x.who} ${x.amount} ${x.detail}`.toLowerCase().includes(q));
  rows.sort((a,b)=>v.sort==="time-asc"?(a.t||0)-(b.t||0):v.sort==="amount-desc"?(b.amount||0)-(a.amount||0):(b.t||0)-(a.t||0));
  const pg=pageRows(rows,v);setPager("wd",v,pg);
  $("wdWho").value=wh;
  $("wdList").innerHTML=`<table><thead><tr><th>When</th><th>Who</th><th>Amount</th><th>Detail</th><th>Kept MAIN</th><th>Status</th></tr></thead><tbody>${pg.rows.map(x=>`<tr><td>${new Date(x.t||0).toLocaleString()}</td><td>${x.who} <span class="tag ${x.kind==='player'?'on':'warn'}">${x.kind==='player'?'Player':'Bot'}</span></td><td>${fmt(x.amount||0)}</td><td>${x.detail}</td><td>${fmt(x.keep||0)}</td><td><span class="tag on">${x.status}</span></td></tr>`).join("")||'<tr><td colspan="6" class="muted">No withdrawals yet. Bots cash out after MAIN reaches '+fmt(lo)+"–"+fmt(hi)+'.</td></tr>'}</tbody></table>`;
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
/* ── Support & Messaging ── */
function renderSupport(){
  const v=VIEWS.support,q=v.filter.toLowerCase();
  const tickets=S.supportTickets||[],msgs=S.adminMessages||[];
  const open=tickets.filter(t=>t.status==="open").length,replied=tickets.filter(t=>t.status==="replied").length;
  $("supTiles").innerHTML=[
    {v:String(open),k:"Open tickets",cls:open?"gold":""},
    {v:String(tickets.length),k:"Tickets received"},
    {v:String(replied),k:"Replied · awaiting close"},
    {v:String(msgs.length),k:"Messages sent"}
  ].map(t=>`<div class="stat-tile ${t.cls||''}"><div class="v">${t.v}</div><div class="k">${t.k}</div></div>`).join("");
  let rows=[...tickets];
  if(v.status)rows=rows.filter(t=>t.status===v.status);
  if(q)rows=rows.filter(t=>`${t.who} ${t.subject} ${t.body} ${t.reply||''}`.toLowerCase().includes(q));
  rows.sort((a,b)=>v.sort==="time-asc"?(a.t||0)-(b.t||0):(b.t||0)-(a.t||0));
  const pg=pageRows(rows,v);setPager("sup",v,pg);
  $("supList").innerHTML=pg.rows.length?`<table><thead><tr><th>Received</th><th>From</th><th>Subject</th><th>Message / reply</th><th>Status</th><th></th></tr></thead><tbody>${pg.rows.map(t=>`<tr><td>${new Date(t.t||0).toLocaleString()}</td><td>${t.who} <span class="tag ${t.kind==="player"?"on":"warn"}">${t.kind==="player"?"Player":"Bot"}</span></td><td><b>${t.subject}</b></td><td>${t.body}${t.reply?`<br><span class="muted">↩ Admin: ${t.reply}</span>`:""}</td><td><span class="tag ${t.status==="open"?"warn":t.status==="replied"?"on":"off"}">${t.status.toUpperCase()}</span></td><td>${t.status!=="closed"?`<button class="btn btn-ghost btn-sm" data-sup-reply="${t.id}">Reply</button> <button class="btn btn-ghost btn-sm" data-sup-close="${t.id}">Close</button>`:'—'}</td></tr>`).join("")}</tbody></table>`:'<div class="muted">No tickets match.</div>';
  $("supMsgLog").innerHTML=msgs.length?msgs.slice(0,8).map(m=>`<div class="kv"><span class="k">${new Date(m.t||0).toLocaleString()}<br><span class="muted">${m.to==="all"?"Broadcast to all players":"To the demo player"}</span></span><span class="v">${m.body}</span></div>`).join(""):'<div class="muted">No messages sent yet.</div>';
}
function adminReplyTicket(id){const t=(S.supportTickets||[]).find(x=>x.id===id);if(!t)return;
  const r=prompt(`Reply to ${t.who} — ${t.subject}`,"Thanks for reaching out — we're looking into it.");
  if(r===null)return;
  t.reply=r.trim()||"We've noted this and will follow up.";t.status="replied";t.repliedAt=Date.now();
  audit("ticket-reply",t.subject);renderSupport();save();toast("Reply sent to "+t.who+".");}
function adminCloseTicket(id){const t=(S.supportTickets||[]).find(x=>x.id===id);if(!t)return;
  t.status="closed";t.repliedAt=t.repliedAt||Date.now();
  audit("ticket-close",t.subject);renderSupport();updateAdminNavBadges();save();toast("Ticket closed.");}
function adminSendPlayerMessage(){const to=$("supMsgTo").value,body=$("supMsgBody").value.trim();
  if(!body){toast("Message body is required.","err");return;}
  S.adminMessages=S.adminMessages||[];
  S.adminMessages.unshift({id:"msg"+Date.now(),to,body,t:Date.now()});
  $("supMsgBody").value="";
  audit("player-message",to+" · "+body.slice(0,60));renderSupport();save();toast(to==="all"?"Broadcast sent to all players.":"Message delivered to the demo player.");}
/* ── Admin users & backups ── */
function adminAddUser(){const name=$("setUserName").value.trim(),role=$("setUserRole").value;
  if(!name){toast("Enter an admin name.","err");return;}
  if((S.adminUsers||[]).some(u=>u.name.toLowerCase()===name.toLowerCase())){toast("That name already exists.","err");return;}
  S.adminUsers.push({id:"u"+Date.now(),name,role,status:"active",createdAt:Date.now()});
  $("setUserName").value="";
  audit("admin-user-add",name+" ("+role+")");renderSettings();save();toast(name+" added as "+role+".");}
function adminToggleUser(id){const u=(S.adminUsers||[]).find(x=>x.id===id);if(!u)return;
  if(u.name==="admin"&&u.role==="Super Admin"){toast("The primary Super Admin cannot be disabled.","err");return;}
  u.status=u.status==="active"?"disabled":"active";
  audit("admin-user-"+(u.status==="active"?"enable":"disable"),u.name);renderSettings();save();toast(u.name+(u.status==="active"?" enabled.":" disabled."));}
function adminSetUserRole(id,role){const u=(S.adminUsers||[]).find(x=>x.id===id);if(!u)return;
  if(u.name==="admin"&&role!=="Super Admin"){toast("The primary account stays Super Admin.","err");renderSettings();return;}
  const was=u.role;u.role=role;
  audit("admin-user-role",u.name+": "+was+" → "+role);renderSettings();save();toast(u.name+" is now "+role+".");}
function adminCreateBackup(){const id="bk"+Date.now();const json=JSON.stringify(S);
  try{localStorage.setItem("tossmatch_backup_"+id,json);}catch(e){toast("Snapshot too large for browser storage.","err");return;}
  S.backups=S.backups||[];S.backups.unshift({id,t:Date.now(),bytes:json.length});
  while(S.backups.length>5){const oldB=S.backups.pop();try{localStorage.removeItem("tossmatch_backup_"+oldB.id);}catch(e2){}}
  audit("backup-create",id);renderSettings();save();toast("Backup snapshot created (5 kept).");}
function adminRestoreBackup(id){const raw=localStorage.getItem("tossmatch_backup_"+id);
  if(!raw){toast("Backup data not found in this browser.","err");return;}
  try{
    const p=JSON.parse(raw),d=defaultState();
    // Mutate the live state object in place so every module reference stays valid
    Object.keys(S).forEach(k=>{if(!(k in p)&&!(k in d))delete S[k];});
    Object.assign(S,d,p);
    S.settings=Object.assign(d.settings,p.settings||{});
    S.config=Object.assign(d.config,p.config||{});
    S.frozen=Object.assign(d.frozen,p.frozen||{});
    S.announcements=Array.isArray(p.announcements)?p.announcements:[];
    S.gamesEnabled=p.gamesEnabled||{};
    S.supportTickets=Array.isArray(p.supportTickets)?p.supportTickets:[];
    S.adminMessages=Array.isArray(p.adminMessages)?p.adminMessages:[];
    S.adminUsers=Array.isArray(p.adminUsers)?p.adminUsers:[];
    S.backups=Array.isArray(p.backups)?p.backups:[];
    audit("backup-restore",id);
    render();save();toast("Backup restored.");
  }catch(e){toast("Restore failed: "+e.message,"err");}}
function adminDeleteBackup(id){try{localStorage.removeItem("tossmatch_backup_"+id);}catch(e){}
  S.backups=(S.backups||[]).filter(b=>b.id!==id);
  audit("backup-delete",id);renderSettings();save();toast("Backup deleted.");}
/* ── Compliance & Privacy ── */
let lastComplianceReport=null;
function complianceReportSet(r){lastComplianceReport=r;}
function complianceReportGet(){return lastComplianceReport;}
function complianceChecksum(o){let h=5381;const t=JSON.stringify(o);for(let i=0;i<t.length;i++){h=((h<<5)+h+t.charCodeAt(i))>>>0;}return "CRC-"+h.toString(16).padStart(8,"0");}
function buildComplianceReport(){
  const c=cfg(),h=c.house,kyc=c.kycRequests||[],flags=c.reviewFlags||[];
  const base={
    id:"CR-"+new Date().toISOString().slice(0,10).replace(/-/g,""),
    generatedAt:new Date().toISOString(),
    house:{gross:houseGross(),net:houseNet(),fees:h.fees||0,catalogFees:h.catalogFees||0,cupRakes:h.cupRakes||0,trnyRakes:h.trnyRakes||0,shop:h.shop||0,xfFees:h.xfFees||0,auctionFees:h.auctionFees||0},
    funding:{playerDeposits:h.deposits||0,botDeposits:h.botDeposits||0,botWithdrawals:h.withdrawals||0,playerWithdrawals:h.playerWithdrawals||0},
    kyc:{pending:kyc.filter(x=>x.status==="pending").length,approved:kyc.filter(x=>x.status==="approved").length,declined:kyc.filter(x=>x.status==="declined").length},
    flags:{raised:flags.length,open:flags.filter(f=>!f.resolved).length,resolved:(c.resolvedFlags||[]).length},
    exclusions:(c.exclusions||[]).slice(),
    adminUsers:(S.adminUsers||[]).map(u=>({name:u.name,role:u.role,status:u.status})),
    announcements:(S.announcements||[]).map(a=>({t:a.t,title:a.title,status:a.status})),
    auditLog:(c.audit||[]).map(a=>({t:new Date(a.t).toISOString(),who:a.who,action:a.action,detail:a.detail||""})),
    cashIn:(S.rg?.deposits||[]).map(x=>({t:new Date(x.t||0).toISOString(),base:x.base??x.amount??0,credited:x.credited||0,method:x.method||""})),
    cashOut:[...(S.withdrawals?.log||[]).map(x=>({t:new Date(x.t||0).toISOString(),who:x.name,amount:x.amount||0})),
      ...(S.playerWithdrawals?.log||[]).map(x=>({t:new Date(x.t||0).toISOString(),who:S.playerName||"Demo player",amount:x.amount||0}))]
  };
  base.checksum=complianceChecksum(base);
  return base;
}
function buildPlayerDataBundle(){
  const me=S.playerName||"Demo player";
  return {
    exportedAt:new Date().toISOString(),
    identity:{name:me,referralCode:S.referralCode||"",referredBy:S.referredBy||"",kyc:{verified:!!(S.kyc?.verified),docType:S.kyc?.docType||""}},
    wallet:{...(S.wallet||{})},
    progression:{level:S.level||0,xp:S.xp||0,monthWagered:S.monthWagered||0,vipUnlockedTier:S.vipUnlockedTier||1,stats:{...(S.stats||{})}},
    ledger:S.ledger||[],
    games:S.games||[],
    catalogMatches:(S.catalogLog||[]).filter(x=>x.playerA==="You"),
    deposits:(S.rg?.deposits||[]).map(x=>({t:x.t,base:x.base??x.amount??0,credited:x.credited||0,method:x.method||"",reference:x.reference||""})),
    withdrawals:(S.playerWithdrawals||{}).log||[],
    supportTickets:(S.supportTickets||[]).filter(t=>t.kind==="player"&&t.who===me),
    platformMessages:(S.adminMessages||[]).filter(m=>m.to==="you"||m.to==="all")
  };
}
function erasePlayerData(who){
  S.ledger=[];
  S.games=[];
  S.catalogLog=(S.catalogLog||[]).filter(x=>x.playerA!=="You");
  S.rg.deposits=[];
  S.playerWithdrawals={count:0,amount:0,log:[]};
  S.analytics={samples:[],lastSampleAt:0};
  S.services.emailLog=[];
  S.services.statements=[];
  S.privacyErasedAt=Date.now();
}
function adminErasePlayerData(){
  if(!confirm("Erase the demo player's transaction history (ledger, matches, deposits, withdrawals)? Career stats and balance are kept. This is audit-logged."))return;
  erasePlayerData("admin");
  audit("privacy-erase","Demo player transaction history erased by Admin");
  renderCompliance();save();toast("Player data erased. Entry added to the audit trail.");
}
function renderCompliance(){
  const c=cfg(),kyc=c.kycRequests||[],flags=c.reviewFlags||[];
  $("compTiles").innerHTML=[
    {v:String((c.audit||[]).length),k:"Audit entries"},
    {v:fmt(kyc.filter(x=>x.status==="approved").length)+" / "+fmt(kyc.filter(x=>x.status==="declined").length),k:"KYC approved / declined"},
    {v:fmt(flags.filter(f=>!f.resolved).length),k:"Open review flags",cls:flags.some(f=>!f.resolved)?"gold":""},
    {v:fmt((c.exclusions||[]).length),k:"Active exclusions"}
  ].map(t=>`<div class="stat-tile ${t.cls||''}"><div class="v">${t.v}</div><div class="k">${t.k}</div></div>`).join("");
  const r=lastComplianceReport;
  $("compReport").innerHTML=r?`<div class="kv"><span class="k">Report ID</span><span class="v"><b>${r.id}</b></span></div>
    <div class="kv"><span class="k">Generated</span><span class="v">${new Date(r.generatedAt).toLocaleString()}</span></div>
    <div class="kv"><span class="k">Checksum</span><span class="v"><code>${r.checksum}</code></span></div>
    <div class="kv"><span class="k">Gross / net revenue</span><span class="v">${fmt(r.house.gross)} / ${fmt(r.house.net)}</span></div>
    <div class="kv"><span class="k">Cash in / out</span><span class="v">${fmt(r.funding.playerDeposits+r.funding.botDeposits)} / ${fmt(r.funding.botWithdrawals+r.funding.playerWithdrawals)}</span></div>
    <div class="kv"><span class="k">KYC (pending / approved / declined)</span><span class="v">${r.kyc.pending} / ${r.kyc.approved} / ${r.kyc.declined}</span></div>
    <div class="kv"><span class="k">Audit log entries included</span><span class="v">${fmt(r.auditLog.length)}</span></div>
    <div class="kv"><span class="k">Admin users / announcements</span><span class="v">${fmt(r.adminUsers.length)} / ${fmt(r.announcements.length)}</span></div>`:'<div class="muted">No report generated yet. Generate one, then export it as JSON or audit-log CSV.</div>';
  const ledgerRows=(S.ledger||[]);
  $("compPrivacy").innerHTML=`<div class="kv"><span class="k">Last player-data erasure</span><span class="v">${S.privacyErasedAt?new Date(S.privacyErasedAt).toLocaleString():"Never"}</span></div>
    <div class="kv"><span class="k">Ledger size now</span><span class="v">${fmt(ledgerRows.length)} entries</span></div>
    <div class="kv"><span class="k">Retention</span><span class="v">Demo data lives only in this browser (localStorage). Factory reset or player erasure removes it.</span></div>
    <div class="row" style="flex-wrap:wrap;gap:6px;margin-top:10px">
      <button class="btn btn-ghost btn-sm" id="compExportPlayer">📦 Export player data (JSON)</button>
      <button class="btn btn-danger btn-sm" id="compErase">🧹 Erase player data</button>
    </div>`;
}
/* ── Reports & Analytics ── */
function reportsData(){
  const now=Date.now(),D=86400000;
  const days=Array.from({length:7},(_,i)=>{const d=new Date(now-(6-i)*D);d.setHours(0,0,0,0);return d.getTime();});
  const inDay=(t,d)=>(t||0)>=d&&(t||0)<d+D;
  const games=S.games||[],cat=S.catalogLog||[];
  const depLog=S.rg?.deposits||[],botLog=S.botTopups||[];
  const wdLog=(S.withdrawals||{}).log||[],pWdLog=(S.playerWithdrawals||{}).log||[];
  const rev=days.map(d=>games.filter(g=>inDay(g.t,d)).reduce((n,g)=>n+(+g.fee||0),0)+cat.filter(x=>inDay(x.t,d)).reduce((n,x)=>n+(+x.fee||0),0));
  const dep=days.map(d=>depLog.filter(x=>inDay(x.t,d)).reduce((n,x)=>n+(+(x.base??x.amount)||0),0)+botLog.filter(x=>inDay(x.t,d)).reduce((n,x)=>n+(+x.base||0),0));
  const wd=days.map(d=>wdLog.filter(x=>inDay(x.t,d)).reduce((n,x)=>n+(+x.amount||0),0)+pWdLog.filter(x=>inDay(x.t,d)).reduce((n,x)=>n+(+x.amount||0),0));
  return {days,rev,dep,wd,games:games.length,cat:cat.length};
}
function repBarChart(elId,vals,cls,title){
  const m=Math.max(1,...vals),D=86400000;
  $(elId).innerHTML=`<div class="rep-chart">${vals.map((v,i)=>`<div class="rep-col" title="${new Date(reportsCache.days[i]).toLocaleDateString()} — ${fmt(v)}"><div class="rep-bar ${cls}" style="height:${Math.max(4,Math.round(v/m*110))}px"></div><em>${new Date(reportsCache.days[i]).toLocaleDateString(undefined,{weekday:'short'}).slice(0,2)}</em></div>`).join("")}</div>`;
}
let reportsCache=null;
function renderReports(){
  reportsCache=reportsData();
  const r=reportsCache,h=cfg().house;
  const totRev=r.rev.reduce((a,b)=>a+b,0),totDep=r.dep.reduce((a,b)=>a+b,0),totWd=r.wd.reduce((a,b)=>a+b,0);
  $("repTiles").innerHTML=[{v:fmt(totRev),k:"Revenue (7d)",cls:"green"},{v:fmt(totDep),k:"Deposits (7d)",cls:"blue"},{v:fmt(totWd),k:"Cash-outs (7d)",cls:"red"},{v:fmt(r.games+r.cat),k:"Matches settled"}].map(t=>`<div class="stat-tile ${t.cls||''}"><div class="v">${t.v}</div><div class="k">${t.k}</div></div>`).join("");
  repBarChart("repDailyRev",r.rev,"gold","Revenue");
  repBarChart("repDailyCash",r.dep.map((v,i)=>v-r.wd[i]),"blue","Net cash flow");
  const mix=[["Coin Toss fees",h.fees||0],["Catalog earnings",h.catalogFees||0],["Series Cup rake",h.cupRakes||0],["Tournament rake",h.trnyRakes||0],["Shop & commerce",h.shop||0],["Transfer fees",h.xfFees||0],["Auction fees",h.auctionFees||0]];
  const gmix=mix.reduce((a,x)=>a+x[1],0);
  $("repMix").innerHTML=gmix?mix.map(x=>`<div class="kv"><span class="k">${x[0]}</span><span class="v">${fmt(x[1])} · ${Math.round(x[1]/gmix*100)}%</span></div><div class="bar"><i style="width:${Math.round(x[1]/gmix*100)}%"></i></div>`).join(""):'<div class="muted">No revenue recognised yet.</div>';
  const byGame={};
  (S.catalogLog||[]).forEach(x=>{const g=x.game||"Catalog";byGame[g]=byGame[g]||{plays:0,fee:0};byGame[g].plays++;byGame[g].fee+=+(x.fee||0);});
  (S.games||[]).forEach(g=>{const name=g.game||"Coin Toss";byGame[name]=byGame[name]||{plays:0,fee:0};byGame[name].plays++;byGame[name].fee+=+(g.fee||0);});
  const top=Object.entries(byGame).sort((a,b)=>b[1].plays-a[1].plays).slice(0,8);
  $("repGames").innerHTML=top.map(([g,x])=>`<div class="kv"><span class="k">${g}</span><span class="v">${fmt(x.plays)} plays · ${fmt(x.fee)} fees</span></div>`).join("")||'<div class="muted">No matches yet.</div>';
}
/* ── Games & Content ── */
function renderGamesAdmin(){
  const v=VIEWS.gamesAdmin,q=v.filter.toLowerCase();
  const enabled=id=>(S.config.gamesEnabled||{})[id]!==false;
  const plays={},fees={};
  (S.catalogLog||[]).forEach(x=>{plays[x.game]=(plays[x.game]||0)+1;fees[x.game]=(fees[x.game]||0)+(x.fee||0);});
  const rows=ADMIN_CATALOG_GAMES.map(([id,name])=>({id,name,plays:plays[name]||0,fees:fees[name]||0,on:enabled(id)}));
  const filtered=q?rows.filter(r=>r.name.toLowerCase().includes(q)):rows;
  const sorted=[...filtered].sort((a,b)=>v.sort==="name-asc"?a.name.localeCompare(b.name):v.sort==="fee-desc"?b.fees-a.fees:b.plays-a.plays);
  const pg=pageRows(sorted,v);setPager("gc",v,pg);
  const totPlays=rows.reduce((n,r)=>n+r.plays,0),totFees=rows.reduce((n,r)=>n+r.fees,0),off=rows.filter(r=>!r.on).length;
  $("gcTiles").innerHTML=[{v:String(rows.length),k:"Catalog games"},{v:fmt(totPlays),k:"Catalog plays"},{v:fmt(cfg().house.catalogFees||0),k:"Catalog earnings",cls:"green"},{v:String(off),k:"Disabled games",cls:off?"red":""}].map(t=>`<div class="stat-tile ${t.cls||''}"><div class="v">${t.v}</div><div class="k">${t.k}</div></div>`).join("");
  $("gcList").innerHTML=pg.rows.length?`<table><thead><tr><th>Game</th><th>Plays</th><th>Fee contribution</th><th>Status</th><th></th></tr></thead><tbody>${pg.rows.map(r=>`<tr class="${r.on?"":"muted"}"><td>${r.name}</td><td>${fmt(r.plays)}</td><td>${fmt(r.fees)}${totFees?` · ${Math.round(r.fees/totFees*100)}%`:""}</td><td><span class="tag ${r.on?"on":"off"}">${r.on?"Live":"Disabled"}</span></td><td><button class="btn btn-ghost btn-sm" data-gc-toggle="${r.id}">${r.on?"Disable":"Enable"}</button></td></tr>`).join("")}</tbody></table>`:'<div class="muted">No games match the filter.</div>';
}
/* ── Referrals ── */
function renderReferrals(){
  const h=cfg().house,code=S.referralCode||"TM-0000";
  const referred=(S.bots||[]).filter(b=>b.referredBy===code);
  $("refTiles").innerHTML=[{v:code,k:"Referral code"},{v:String(referred.length),k:"Referred players"},{v:fmt(S.referralEarned||0),k:"Earned (5%)",cls:"green"},{v:fmt(h.referralCost||0),k:"House referral payout",cls:"red"}].map(t=>`<div class="stat-tile ${t.cls||''}"><div class="v">${t.v}</div><div class="k">${t.k}</div></div>`).join("");
  $("refProgram").innerHTML=`<div class="kv"><span class="k">Program rate</span><span class="v">5% of referred player fees</span></div><div class="kv"><span class="k">This player's code</span><span class="v">${code}</span></div><div class="kv"><span class="k">Joined via</span><span class="v">${S.referredBy||"—"}</div></div><div class="kv"><span class="k">Payout wallet</span><span class="v">REFERRAL balance</span></div><div class="kv"><span class="k">Referral balance now</span><span class="v">${fmt(S.wallet?.referral||0)}</span></div>`;
  const rows=[
    ...(S.referredBy?[{name:S.playerName||"Demo player",country:"—",balance:S.wallet?.main||0,net:S.stats?.net||0,by:S.referredBy}]:[]),
    ...referred.map(b=>({name:b.name,country:b.country,balance:b.balance||0,net:b.net||0,by:b.referredBy}))
  ];
  $("refList").innerHTML=rows.length?`<table><thead><tr><th>Player</th><th>Country</th><th>Balance</th><th>Net</th><th>Referred by</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${r.name}</td><td>${r.country||"—"}</td><td>${fmt(r.balance)}</td><td>${r.net>=0?"+":""}${fmt(r.net)}</td><td>${r.by}</td></tr>`).join("")}</tbody></table>`:'<div class="muted">No referred players yet. Register one and it will appear here.</div>';
}
/* ── Announcements ── */
function renderAnnouncements(){
  const list=S.announcements||[];
  const pub=list.filter(a=>a.status==="published").sort((a,b)=>(b.t||0)-(a.t||0));
  const cur=pub[0];
  $("annCurrent").innerHTML=cur?`<div class="kv"><span class="k">Title</span><span class="v"><b>${cur.title}</b></span></div><div class="kv"><span class="k">Message</span><span class="v">${cur.body}</span></div><div class="kv"><span class="k">Published</span><span class="v">${new Date(cur.t).toLocaleString()}</span></div>`:'<div class="muted">Nothing published yet — player Homes show no banner.</div>';
  $("annList").innerHTML=list.length?`<table><thead><tr><th>When</th><th>Title</th><th>Message</th><th>Status</th><th></th></tr></thead><tbody>${list.map(a=>`<tr><td>${new Date(a.t).toLocaleString()}</td><td><b>${a.title}</b></td><td>${a.body}</td><td><span class="tag ${a.status==="published"?"on":"warn"}">${a.status==="published"?"Published":"Draft"}</span></td><td><button class="btn btn-ghost btn-sm" data-ann-toggle="${a.id}">${a.status==="published"?"Unpublish":"Publish"}</button> <button class="btn btn-danger btn-sm" data-ann-del="${a.id}">Delete</button></td></tr>`).join("")}</tbody></table>`:'<div class="muted">No announcements yet.</div>';
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
  const frozenYou=!!(S.frozen&&S.frozen.you);
  $("peopleList").innerHTML=`<table><thead><tr><th>Name</th><th>Playable</th><th>MAIN / BONUS</th><th>W–L</th><th>Net</th><th>Lv</th><th>Top-ups</th><th>Withdrawals</th><th>Status</th><th>Manage</th></tr></thead><tbody>${pg.rows.map(r=>{
    const isFrozen=r.you?frozenYou:!!r.frozen;
    return `<tr${isFrozen?' class="table-frozen"':''}><td>${r.name}${r.you?" · you":" · "+(r.country||"")}</td><td>${fmt(r.bal||r.balance||0)}</td><td>${fmt(r.balance!==undefined?r.balance:0)} / ${fmt(r.bonusBalance||0)}</td><td>${r.wins||0}–${r.losses||0}</td><td style="color:${(r.net||0)>=0?"var(--green)":"var(--red)"}">${(r.net||0)>=0?"+":""}${fmt(r.net||0)}</td><td>${r.level||"–"}</td><td>${r.topupCount||r.topups||0}</td><td>${r.withdraws||0}</td><td>${isFrozen?'<span class="tag danger">FROZEN</span>':'<span class="tag on">ACTIVE</span>'}</td><td style="white-space:nowrap"><button class="btn btn-sm ${isFrozen?'btn-green':'btn-danger'}" ${isFrozen?`data-unfreeze="${r.you?'__player__':r.name}"`:`data-freeze="${r.you?'__player__':r.name}"`}>${isFrozen?'❄️ Unfreeze':'⛔ Freeze'}</button> <button class="btn btn-sm btn-ghost" data-history="${r.you?'__player__':r.name}">🕘 Bets</button></td></tr>`;
  }).join("")||'<tr><td colspan="10" class="muted">No players match.</td></tr>'}</tbody></table>`;
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
 ['Command','dash','⌁','Overview','KPIs, alerts, revenue and quick controls','dashboard command'],['Command','ops','🚦','Live Ops','Player controls, queues, bots, limits and transfers','liquidity player bot'],['Command','people','👥','Players','Searchable roster with balances, records and top-ups','directory roster players'],['Command','features','✨','Feature Hub','Community, Arcade, Progress and Economy telemetry','b1 b4 features'],['Command','directory','🗂','Feature Directory','Search every feature and open exact destinations','product map'],['Command','reports','📈','Reports & Analytics','7-day revenue, cash flow, mix and busiest games with CSV/JSON export','report analytics chart export csv json'],
 ['Commercial','rates','💹','Rates & Jackpot','Fees, jackpot rules and transfer limits','configuration'],['Commercial','econ','📈','Economy','P&L, taps, sinks, simulator and compensation','revenue finance'],['Commercial','revenue','📊','Revenue','Total volume, net profit, daily/weekly charts and transaction exports','revenue volume profit chart export csv json'],['Commercial','topups','💳','Top-ups & Deposits','Unified player and bot top-up and deposit volume, bonuses, trends and records','topup deposit credit bonus liquidity'],['Commercial','withdraw','🏦','Withdrawals','Paid cash-outs, house P&L and reversal controls','cashout payout reversal'],['Commercial','promo','🎁','Promotions','Campaigns, top-up offer and broadcast banner','offers marketing'],['Commercial','games','🎮','Games & Content','Catalog plays, fee contribution and enable/disable per game','catalog game enable disable content'],
 ['Engagement','vip','💎','VIP & Levels','Eight VIP tiers and paginated level rewards','progression'],['Engagement','trny','🏟','Tournaments','Create and inspect bot and player brackets','competition'],['Engagement','referrals','🔗','Referrals','Invite program, referred players and 5% house referral payout','referral invite program payout'],['Engagement','announcements','📣','Announcements','Create and publish in-app announcements to player Homes','announcement broadcast message home'],['Engagement','support','💬','Support & Messaging','Unified ticket inbox with player and bot reporters, replies and platform messages','support ticket helpdesk message inbox'],
 ['Governance','audit','🧾','Audit & Data','Audit trail, histories, proofs and exports','compliance records'],['Governance','trust','🛡️','Trust Center','Analytics, anti-cheat, RG, PWA, API, 2FA and statements','security safety'],['Governance','compliance','📑','Compliance & Privacy','Dated compliance reports with checksum, audit-log export and player data export/erasure','compliance report privacy gdpr export']
].map(x=>({group:x[0],tab:x[1],icon:x[2],name:x[3],desc:x[4],keys:x[5]}));
const ADMIN_CATALOG_GAMES=[['overunder','Over / Under'],['speed','Speed Round'],['tug','Tug of War'],['evenodd','Even / Odd Sum'],['closest','Closest Number'],['luckybattle','Lucky Number Battle'],['sumpredict','Sum Prediction'],['higherbyte','Higher Byte'],['patternrace','Pattern Race'],['parlayduel','Parlay Duel'],['prediction','Prediction Streak'],['blind','Blind Pick'],['rangewar','Range War'],['bullseye','Bullseye'],['chain','Chain Reaction'],['ladder','Elimination Ladder'],['mirrored','Mirrored Coins'],['rps','Rock Paper Scissors'],['closest21','Closest to 21'],['triplecoin','Triple Coin Majority'],['sequencebuilder','Sequence Builder'],['dicesumduel','Dice Sum Duel'],['colourspectrum','Colour Spectrum'],['primecomposite','Prime vs Composite'],['medianbattle','Median Battle'],['streaksurvivor','Streak Survivor'],['territory','Territory Capture'],['modulo4','Modulo Four'],['pokerhigh','Poker High'],['threedicepoker','Three Dice Poker'],['lastdigit','Last Digit Duel'],['binaryduel','Binary Code Duel'],['coinbalance','Coin Balance Battle'],['bytewar','Byte War'],['sumfour','Sum Four'],['highcard','High Card Duel']];
const ADMIN_ARCADE_GAMES=[['wheel','Lucky Wheel'],['scratch','Scratch Cards'],['dice','Dice Roll'],['raffle','Weekly Raffle'],['ladder','Multiplier Ladder'],['war','War Card'],['plinko','Plinko'],['slots','Mini Slots'],['keno','Quick Keno'],['bingo','Bingo Rush'],['treasure','Treasure Hunt'],['memory','Memory Match'],['dropball','Drop Ball'],['trivia','Daily Trivia'],['fishing','Fishing Reel'],['penalty','Penalty Shootout'],['coinpusher','Coin Pusher'],['tower','Tower Builder'],['match3','Match-3 Rush'],['vault','Mystery Vault'],['roulette','Roulette'],['blackjack','Blackjack']];
function goAdminTab(name){document.querySelector(`.tab[data-tab="${name}"]`)?.click();}
function toggleAdminNavDrawer(force){const open=force!==undefined?force:!document.body.classList.contains('nav-open');document.body.classList.toggle('nav-open',open);}
function closeAdminNavDrawer(){document.body.classList.remove('nav-open');}
function adminCommandEntries(){const nav=ADMIN_NAV_META.filter(x=>!adminRbacAllowed.length||adminRbacAllowed.includes(x.tab)).map(x=>({...x,playerTab:'',feature:''}));return [...nav,...ADMIN_CATALOG_GAMES.map(x=>({group:'Player · Catalog Games',playerTab:'games',feature:x[0],icon:'🎲',name:x[1],desc:'Open exact P2P Games game',keys:'player game'})),...ADMIN_ARCADE_GAMES.map(x=>({group:'Player · Arcade Zone Games',playerTab:'newgames',feature:x[0],icon:'🎮',name:x[1],desc:'Open exact Arcade Zone game',keys:'player arcade'}))];}
function renderAdminCommand(q=''){q=q.trim().toLowerCase();const rows=adminCommandEntries().filter(x=>!q||`${x.name} ${x.desc} ${x.keys} ${x.group}`.toLowerCase().includes(q));let group='';$("adminCommandList").innerHTML=rows.map((x,i)=>{const head=x.group!==group?(group=x.group,`<div class="admin-command-group">${x.group}</div>`):'';return `${head}<button class="admin-command-item" ${x.playerTab?`data-command-player="${x.playerTab}" data-command-feature="${x.feature}"`:`data-command-admin="${x.tab}"`}><span class="ci">${x.icon}</span><span><b>${x.name}</b><small>${x.desc}</small></span><kbd>${i+1<10?i+1:''}</kbd></button>`;}).join('')||'<div class="muted" style="padding:18px">No matching Admin screens or games.</div>';}
function openAdminCommand(q=''){const bg=$("adminCommandBg");bg.classList.add('show');bg.setAttribute('aria-hidden','false');$("adminCommandSearch").value=q;renderAdminCommand(q);setTimeout(()=>$("adminCommandSearch").focus(),0);}
function closeAdminCommand(){$("adminCommandBg").classList.remove('show');$("adminCommandBg").setAttribute('aria-hidden','true');}
function filterAdminNavigation(q){q=q.trim().toLowerCase();let shown=0;document.querySelectorAll('#tabs .tab[data-tab]').forEach(b=>{if(adminRbacAllowed.length&&!adminRbacAllowed.includes(b.dataset.tab))return;const meta=ADMIN_NAV_META.find(x=>x.tab===b.dataset.tab),match=!q||`${b.textContent} ${meta?.name||''} ${meta?.desc||''} ${meta?.keys||''}`.toLowerCase().includes(q);b.style.display=match?'':'none';if(match)shown++;});applyAdminNavGroups();$("adminNavEmpty").style.display=shown?'none':'block';}
function syncAdminNavigation(tab){$("adminNavJump").value=tab;document.querySelectorAll('#adminQuickDock [data-admin-tab]').forEach(b=>b.classList.toggle('active',b.dataset.adminTab===tab));}

/* ── Admin access control (v13): login gate, RBAC roles, session, badges ── */
const ADMIN_SESSION_KEY="fa_admin_session";
const ADMIN_ROLES={
 'Super Admin':['dash','ops','people','features','directory','rates','econ','revenue','topups','withdraw','promo','vip','trny','referrals','announcements','support','reports','games','approvals','audit','trust','compliance','settings'],
 'Finance':['dash','econ','revenue','topups','withdraw','promo','audit','reports','compliance'],
 'Operations':['dash','ops','people','features','directory','vip','trny','approvals','promo','games','announcements','support'],
 'Support':['dash','people','approvals','trust','support']
};
const ADMIN_ROLE_DESC={'Super Admin':'Full access to every console screen','Finance':'Revenue, economy, liquidity and audit','Operations':'Live ops, players, engagement and approvals','Support':'Player lookups, approvals and trust tools'};
function adminSession(){try{const x=JSON.parse(sessionStorage.getItem(ADMIN_SESSION_KEY)||'null');return x&&x.user&&x.role?x:null;}catch(e){return null;}}
function renderAdminProfile(){
  const ses=adminSession(),av=$("adminProfileAvatar"),nm=$("adminProfileName"),rl=$("adminProfileRole"),out=$("adminLogoutBtn");
  if(!ses){av.textContent="–";nm.textContent="Sign in required";rl.textContent="No session";if(out)out.hidden=true;return;}
  av.textContent=ses.user.slice(0,2).toUpperCase();nm.textContent=ses.user;rl.textContent=ses.role;if(out)out.hidden=false;
  $("adminLoginOverlay").hidden=true;
  document.body.classList.remove("admin-locked");
}
let adminRbacAllowed=[];
function applyAdminRbac(){
  const ses=adminSession();if(!ses)return;
  const allowed=ADMIN_ROLES[ses.role]||ADMIN_ROLES['Super Admin'];
  adminRbacAllowed=allowed;
  document.querySelectorAll('#tabs .tab[data-tab]').forEach(b=>{b.style.display=allowed.includes(b.dataset.tab)?'':'none';});
  // hide groups whose screens are all hidden
  document.querySelectorAll('#tabs .admin-nav-group').forEach(g=>{const any=[...g.querySelectorAll('.tab[data-tab]')].some(b=>b.style.display!=='none');g.style.display=any?'':'none';});
  // keep the jump select consistent with the role
  const jump=$("adminNavJump");
  if(jump){const kept=[];jump.querySelectorAll("optgroup").forEach(g=>{[...g.querySelectorAll("option")].forEach(o=>{const ok=allowed.includes(o.value);o.style.display=ok?'':'none';if(ok)kept.push(o.value);});if(![...g.querySelectorAll("option")].some(o=>o.style.display!=='none'))g.style.display='none';});}
  // keep the active screen reachable
  const active=document.querySelector('#tabs .tab.active');
  if(active&&active.style.display==='none'){const first=allowed[0];document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));document.querySelectorAll('.panel').forEach(p2=>p2.classList.remove('active'));const nb=document.querySelector('.tab[data-tab="'+first+'"]');if(nb){nb.classList.add('active');$("panel-"+first).classList.add('active');setAdminActiveTab(first);syncAdminNavigation(first);renderAdminTab(first);}}
}
function applyAdminNavGroups(){
  const nav=$("tabs");if(!nav||!S)return;
  const searching=!!(($("adminNavSearch")||{}).value||"").trim();
  nav.classList.toggle("searching",searching);
  const groups=S.adminNavGroups=S.adminNavGroups||{};
  nav.querySelectorAll(".admin-nav-group").forEach(g=>{
    const collapsed=!!groups[g.dataset.group]&&!searching;
    g.classList.toggle("collapsed",collapsed);
    const head=g.querySelector(".admin-nav-group-head");if(head)head.setAttribute("aria-expanded",String(!collapsed));
  });
}
function updateAdminNavBadges(){
  if(!S)return;
  const kycPending=kycQueue().filter(x=>x.status==='pending').length,
        flags=(cfg().reviewFlags||[]).filter(f=>!f.resolved).length,
        approvals=kycPending+flags,
        pendingPayouts=(S.bots||[]).filter(b=>b.trigger&&b.balance>=b.trigger-300).length,
        campaigns=(cfg().promotions||[]).filter(p2=>p2.active!==false).length;
  const openTickets=(S.supportTickets||[]).filter(t=>t.status==="open").length;
  const ba=$("adminBadgeApprovals"),bw=$("adminBadgeWithdraw"),bp=$("adminBadgePromo"),bs=$("adminBadgeSupport");
  if(ba){ba.textContent=approvals;ba.hidden=!approvals;}
  if(bw){bw.textContent=pendingPayouts;bw.hidden=!pendingPayouts;}
  if(bp){bp.textContent=campaigns;bp.hidden=!campaigns;}
  if(bs){bs.textContent=openTickets;bs.hidden=!openTickets;}
}
/* deterministic simulated KYC request queue (bot identities) */
function kycQueue(){
  const q=cfg().kycRequests;
  if(!Array.isArray(q)||!q.length){
    const names=(S.bots||[]).slice(0,4).map(b=>b.name);
    while(names.length<3)names.push(['Kiran','Dev','Asha'][names.length]);
    cfg().kycRequests=names.slice(0,3).map((n,i)=>({id:'kyc-'+i,name:n,docType:['PAN','Passport','Aadhaar'][i%3],t:Date.now()-86400000*(i+2),status:'pending',note:'Document submitted for review'}));
    save();
  }
  return cfg().kycRequests;
}
function adminDecideKyc(id,decision){
  const q=kycQueue(),item=q.find(x=>x.id===id);if(!item)return;
  item.status=decision;item.decidedAt=Date.now();
  audit('kyc-queue',`${item.name}: ${decision} (${item.docType})`);
  save();renderApprovals();updateAdminNavBadges();
}
function adminResolveFlag(t,action){
  const all=cfg().reviewFlags||[],f=all.find(x=>x.t===t);if(!f)return;
  f.resolved=true;f.resolution=action;f.resolvedAt=Date.now();
  (cfg().resolvedFlags=cfg().resolvedFlags||[]).unshift({t:f.t,game:f.game,type:f.type,amount:f.amount||0,detail:f.detail,resolution:action,at:Date.now()});
  if(cfg().resolvedFlags.length>60)cfg().resolvedFlags.length=60;
  audit('flag-review',`${f.type} ${action}: ${f.detail}`);
  save();renderApprovals();renderFlags();updateAdminNavBadges();
}
function adminAddExclusion(name){
  name=String(name||'').trim();if(!name)return;
  const list=cfg().exclusions=cfg().exclusions||[];
  if(list.includes(name)){toast('Already excluded.','err');return;}
  list.push(name);audit('exclusion',`Excluded ${name}`);save();renderApprovals();
}
function adminRemoveExclusion(name){
  const list=cfg().exclusions=cfg().exclusions||[],i=list.indexOf(name);
  if(i<0)return;list.splice(i,1);audit('exclusion',`Un-excluded ${name}`);save();renderApprovals();
}
function renderApprovals(){
  if(!S)return;
  const kyc=S.kyc||{},q=kycQueue(),flags=cfg().reviewFlags||[],resolved=cfg().resolvedFlags||[],excl=cfg().exclusions||[];
  const pending=q.filter(x=>x.status==='pending').length,open=flags.filter(f=>!f.resolved).length;
  $("approvalsAlerts").innerHTML=[
    pending?{c:'warn',t:`🪪 ${pending} KYC request(s) awaiting review`}:{c:'ok',t:'🪪 KYC queue clear'},
    open?{c:'warn',t:`⚑ ${open} unresolved review flag(s)`}:{c:'ok',t:'⚑ No unresolved flags'}
  ].map(a=>`<div class="admin-alert ${a.c}">${a.t}</div>`).join('');
  $("kycPlayerStatus").innerHTML=`<div class="kv-row"><span>Demo player status</span><b>${kyc.verified?'<span class="tag on">VERIFIED</span>':'<span class="tag">UNVERIFIED</span>'}</b></div>${kyc.verified?`<div class="kv-row"><span>Verified</span><b>${new Date(kyc.verifiedAt).toLocaleString()} · ${kyc.docType||'—'}</b></div>`:''}`;
  $("kycQueue").innerHTML=q.map(x=>`<div class="friend-row" style="padding:8px 0;border-bottom:1px solid var(--line)"><span style="font-size:16px">🪪</span><span class="grow"><b>${x.name}</b> <span class="muted">· ${x.docType}</span><br><small class="muted">Submitted ${new Date(x.t).toLocaleString()} · ${x.note}</small></span>${x.status==='pending'?`<button class="btn btn-primary btn-sm" data-approvals="kyc-approve" data-id="${x.id}">Approve</button><button class="btn btn-danger btn-sm" data-approvals="kyc-decline" data-id="${x.id}">Decline</button>`:`<span class="tag ${x.status==='approved'?'on':''}">${x.status.toUpperCase()}</span>`}</div>`).join('');
  const filt=$("flagFilterSel")?$("flagFilterSel").value:'';
  const frows=flags.filter(f=>!f.resolved).filter(f=>!filt||f.type===filt).slice(0,12);
  $("flagQueue").innerHTML=frows.length?frows.map(f=>`<div class="friend-row" style="padding:8px 0;border-bottom:1px solid var(--line)"><span style="font-size:16px">⚑</span><span class="grow"><b>${f.type}</b> <span class="muted">· ${f.game||'—'}${f.amount?` · ${fmt(f.amount)}`:''}</span><br><small class="muted">${new Date(f.t).toLocaleString()} · ${f.detail||''}</small></span><button class="btn btn-primary btn-sm" data-approvals="flag-clear" data-t="${f.t}">Clear</button><button class="btn btn-danger btn-sm" data-approvals="flag-escalate" data-t="${f.t}">Escalate</button></div>`).join(''):'<div class="empty">No unresolved flags in this view.</div>';
  const bots=(S.bots||[]).slice(0,40);
  $("restrictBotSel").innerHTML=bots.map(b=>`<option value="${b.name}" ${S.frozen[b.name]?'selected':''}>${b.name} ${S.frozen[b.name]?'(frozen)':''}</option>`).join('');
  $("exclusionList").innerHTML=excl.length?excl.map(n=>`<div class="friend-row" style="padding:6px 0"><span>🚫</span><span class="grow">${n}</span><button class="btn btn-ghost btn-sm" data-approvals="excl-remove" data-name="${n}">Remove</button></div>`).join(''):'<div class="empty">No active exclusions.</div>';
  const hist=(cfg().approvalsHistory=cfg().approvalsHistory||[]);
  $("approvalsHistory").innerHTML=hist.length?hist.slice(0,10).map(h=>`<div class="kv-row"><span>${new Date(h.t).toLocaleString()}</span><b>${h.who}: ${h.what}</b></div>`).join(''):'<div class="empty">Decisions you make appear here.</div>';
}
function renderSettings(){
  if(!S)return;
  const c=cfg(),ses=adminSession();
  $("setFeePct").value=c.feePct;$("setCupRake").value=c.cupRakePct;$("setTrnyRake").value=c.trnyRakePct;
  $("setJpArm").value=c.jpArm;$("setJpPay").value=c.jpPayPct;$("setStakeRange").value=c.stakeMin+" , "+c.stakeMax;
  $("setAccountRow").innerHTML=`<span>Signed in</span><b>${ses?ses.user+' · '+ses.role:'—'}</b><div style="width:100%"></div><span>Session started</span><b>${ses?new Date(ses.t).toLocaleString():'—'}</b><div style="width:100%"></div><span>Role scope</span><b>${ses?(ADMIN_ROLES[ses.role]||[]).length+' screens':'—'}</b>`;
  $("setRoleSel").value=ses?ses.role:'Super Admin';
  $("setBotCount").textContent=(S.bots||[]).length+' simulated players';
  $("setTurboState").textContent=(S.turbo&&S.turbo>1)?`${S.turbo}× stress`:'Normal (1×)';
  $("setMaintState").innerHTML=c.features.maintenance?'<span class="tag">ACTIVE</span>':'<span class="tag on">OFF</span>';
  // Admin users
  const users=S.adminUsers||[];
  $("setUsers").innerHTML=users.map(u=>`<div class="kv"><span class="k">${u.name}<br><span class="muted">since ${new Date(u.createdAt||0).toLocaleDateString()}</span></span><span class="v"><select data-user-role="${u.id}" style="max-width:120px">${["Super Admin","Finance","Operations","Support"].map(r=>`<option ${r===u.role?"selected":""}>${r}</option>`).join("")}</select> <span class="tag ${u.status==="active"?"on":"off"}">${u.status.toUpperCase()}</span> <button class="btn btn-ghost btn-sm" data-user-toggle="${u.id}">${u.status==="active"?"Disable":"Enable"}</button></span></div>`).join("")||'<div class="muted">No admin users.</div>';
  // Backups
  $("setBackups").innerHTML=(S.backups||[]).length?S.backups.map(b=>`<div class="kv"><span class="k">${new Date(b.t).toLocaleString()}<br><span class="muted">${b.id} · ${(b.bytes/1024).toFixed(1)} KB</span></span><span class="v"><button class="btn btn-ghost btn-sm" data-bk-restore="${b.id}">Restore</button> <button class="btn btn-danger btn-sm" data-bk-del="${b.id}">Delete</button></span></div>`).join(""):'<div class="muted">No snapshots yet — create one before risky changes.</div>';
}
function adminLogin(){
  const user=$("adminLoginUser").value.trim(),pass=$("adminLoginPass").value,role=$("adminLoginRole").value,tfa=$("adminLoginTfa").value.trim();
  const errEl=$("adminLoginError");
  const fail=m=>{errEl.textContent=m;errEl.hidden=false;};
  if(user.toLowerCase()!=='admin'||pass!=='flip2026')return fail('Invalid credentials. Demo login is admin / flip2026.');
  if(!/^\d{6}$/.test(tfa))return fail('Enter the 6-digit 2FA code (demo: 246810).');
  if(tfa!=='246810')return fail('2FA code does not match (demo: 246810).');
  sessionStorage.setItem(ADMIN_SESSION_KEY,JSON.stringify({user,role,t:Date.now()}));
  errEl.hidden=true;
  renderAdminProfile();applyAdminNavGroups();applyAdminRbac();updateAdminNavBadges();
  audit('admin-login',`${user} signed in as ${role}`);save();render();
}
function adminLogout(){
  const ses=adminSession();
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
  if(ses)audit('admin-logout',`${ses.user} signed out`);
  save();
  $("adminLoginOverlay").hidden=false;
  $("adminLoginPass").value='';$("adminLoginTfa").value='';
  document.querySelectorAll('#tabs .tab[data-tab]').forEach(b=>b.style.display='');
  document.querySelectorAll('#tabs .admin-nav-group').forEach(g=>g.style.display='');
  const jump=$("adminNavJump");
  if(jump){jump.querySelectorAll("optgroup").forEach(g=>g.style.display='');jump.querySelectorAll("option").forEach(o=>o.style.display='');}
  renderAdminProfile();
}


/* ── Revenue dashboard (Admin ↔ player ledger, integer-subunit math) ─────── */
const REVENUE_VIEW={range:"day"};
function downloadFile(filename,content,type){
  const blob=new Blob([content],{type:type||"text/plain"});
  const url=URL.createObjectURL(blob),a=document.createElement("a");
  a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
}
function renderRevenue(){
  const root=$("revenueRoot");if(!root)return;
  const r=reconciliation(),v=wageredVolume(),auditRep=ledgerAudit();
  root.innerHTML="";
  root.appendChild(createStatGrid([
    {icon:"🎯",value:fmt(v.lifetime||0),label:"Lifetime wagered volume",color:"blue"},
    {icon:"📈",value:fmt(r.gross),label:"Gross revenue",color:"green"},
    {icon:"💰",value:fmt(r.net),label:"Net platform profit (NGR)",color:r.net>=0?"green":"red"},
    {icon:"🎁",value:fmt(r.costs||0),label:"Total costs (promo + comps + rakeback + referral)",color:"purple"},
  ]));

  /* ── Complete fund-source register: every source of money in or out of the
       platform, classified so finance can never mistake funding for revenue. ── */
  const srcCard=createCard({title:"🧾 Complete fund-source register"});
  const srcMeta=document.createElement("p");srcMeta.className="muted";
  srcMeta.textContent="Every stream that touches the platform economy, tagged by its accounting treatment. REVENUE = recognised in NGR · COST = reduces NGR · FUNDING = cash-in (liability, never revenue) · CASH-OUT = cash-out (never an expense) · LIABILITY = owed to players.";
  srcCard.appendChild(srcMeta);
  const pctOf=(x,base)=>base>0?(x/base*100).toFixed(1)+"%":"—";
  const fundRows=[
    {tag:"REVENUE",t:"Coin Toss fees (5% pot fee − jackpot funding)",x:r.fees,share:pctOf(r.fees,r.gross),note:"Fee recognised net of the jackpot contribution held in pool."},
    {tag:"REVENUE",t:"P2P Games fees (catalog, ladder, war, rooms, friends)",x:r.catalogFees,share:pctOf(r.catalogFees,r.gross),note:"Same fee engine as Coin Toss, per settled match."},
    {tag:"REVENUE",t:"Series Cup rake",x:r.cupRakes,share:pctOf(r.cupRakes,r.gross),note:"Admin-set rake on every Cup pot."},
    {tag:"REVENUE",t:"Tournament rake",x:r.trnyRakes,share:pctOf(r.trnyRakes,r.gross),note:"Admin-set rake on every bracket pool."},
    {tag:"REVENUE",t:"Shop & commerce",x:r.shop,share:pctOf(r.shop,r.gross),note:"Cosmetics, arcade stakes, crates, subscriptions, boosters, trading fees, raffle cut, crafts, tickets, room upgrades, wheel spins."},
    {tag:"REVENUE",t:"Transfer & gifting fees",x:r.xfFees,share:pctOf(r.xfFees,r.gross),note:"2% on every MAIN transfer and coin gift."},
    {tag:"REVENUE",t:"Auction house fees (10% of winning bid)",x:r.auctionFees,share:pctOf(r.auctionFees,r.gross),note:"Weekly cosmetic auctions; the hammer fee is the only house take."},
    {tag:"COST",t:"Promotional cost (deposit bonuses, cash drops, wheel/scratch prizes, arcade payouts, staking interest)",x:r.promoCost,share:pctOf(r.promoCost,r.gross),note:"Coins created by offers and house-funded rewards."},
    {tag:"COST",t:"Comps paid (goodwill credits)",x:r.comps,share:pctOf(r.comps,r.gross),note:"Funded strictly from accumulated net revenue."},
    {tag:"COST",t:"Rakeback paid to players",x:r.rakebackPaid,share:pctOf(r.rakebackPaid,r.gross),note:"Tier% × half-fee claimed into RAKEBACK balance."},
    {tag:"COST",t:"Referral program payouts (5% of referred players' fees)",x:r.referralCost,share:pctOf(r.referralCost,r.gross),note:"External referrer share + demo player's referred-bot share."},
    {tag:"FUNDING",t:"Player deposits (top-ups)",x:coin((cfg().house.deposits||0)),share:"—",note:"Cash-in. Liability until withdrawn — never recognised as revenue."},
    {tag:"FUNDING",t:"Bot deposits (simulation liquidity)",x:coin((cfg().house.botDeposits||0)),share:"—",note:"Demo liquidity injections. Never recognised as revenue."},
    {tag:"CASH-OUT",t:"Player withdrawals",x:coin((cfg().house.playerWithdrawals||0)),share:"—",note:"Cash-out of player funding. Never an expense."},
    {tag:"CASH-OUT",t:"Bot withdrawals (cash-out triggers)",x:coin((cfg().house.withdrawals||0)),share:"—",note:"Coin sink + cash-out, deducted as cash-flow not expense."},
    {tag:"LIABILITY",t:"Jackpot pool (owed to the byte-00 winner)",x:coin(S.jackpot||0),share:"—",note:"Held from fees; 50% pays on hit, remainder rolls over."},
  ];
  const tbl=document.createElement("table");
  tbl.innerHTML="<thead><tr><th>Treatment</th><th>Fund source</th><th>Amount</th><th>% of gross</th><th>Accounting note</th></tr></thead><tbody>"+
    fundRows.map(x=>{const cls=x.tag==="REVENUE"?"on":x.tag==="COST"?"warn":x.tag==="FUNDING"?"blue":x.tag==="CASH-OUT"?"danger":"purple";
      return `<tr><td><span class="tag ${cls}">${x.tag}</span></td><td><b>${x.t}</b></td><td>${fmt(x.x)}</td><td>${x.share}</td><td class="muted" style="min-width:220px">${x.note}</td></tr>`;}).join("")+
    `</tbody>`;
  srcCard.appendChild(tbl);
  const totalRow=document.createElement("div");totalRow.className="catalog-note";totalRow.style.marginTop="10px";
  totalRow.innerHTML=`<b>Gross revenue</b> ${fmt(r.gross)} − <b>total costs</b> ${fmt(r.costs||0)} = <b style="color:var(--gold)">Net revenue (NGR) ${fmt(r.net)}</b> · Net cash flow ${fmt(r.netCash)}`;
  srcCard.appendChild(totalRow);
  root.appendChild(srcCard);
  const unit=REVENUE_VIEW.range==="week"?"week":"day";
  const series=revenueSeries(unit,unit==="week"?8:14);
  const chartCard=createCard({title:`📊 ${unit==="week"?"Weekly":"Daily"} volume`});
  const controls=document.createElement("div");controls.className="row";controls.style.marginBottom="10px";
  controls.appendChild(createButton({label:"Daily",variant:unit==="day"?"primary":"ghost",size:"sm",onclick:()=>{REVENUE_VIEW.range="day";renderRevenue();}}));
  controls.appendChild(createButton({label:"Weekly",variant:unit==="week"?"primary":"ghost",size:"sm",onclick:()=>{REVENUE_VIEW.range="week";renderRevenue();}}));
  chartCard.appendChild(controls);
  const chart=document.createElement("div");
  chart.innerHTML=revenueChartSVG(series,"volume",{label:unit+"ly volume",color:"var(--gold)"});
  chartCard.appendChild(chart);
  const revChart=document.createElement("div");revChart.style.marginTop="10px";
  revChart.innerHTML=revenueChartSVG(series,"revenue",{label:unit+"ly recognised revenue",color:"var(--green)"});
  chartCard.appendChild(revChart);
  root.appendChild(chartCard);

  const exportCard=createCard({title:"📦 Exportable transaction logs"});
  const q=v=>'"'+String(v??'').replace(/"/g,'""')+'"';
  const rows=transactionLog(2000);
  const meta=document.createElement("p");meta.className="muted";
  meta.textContent=`${rows.length} merged transaction rows — settled wagers, payouts, fees, top-ups, withdrawals, transfers and ledger movements. CSV and JSON contain the same records.`;
  exportCard.appendChild(meta);
  const btnRow=document.createElement("div");btnRow.className="row";btnRow.style.marginTop="10px";
  btnRow.appendChild(createButton({label:"⬇️ Export CSV",variant:"primary",size:"sm",onclick:()=>{
    const csv=[["timestamp_iso","when","type","category","who","amount","balance","note"]]
      .concat(rows.map(x=>[new Date(x.t).toISOString(),new Date(x.t).toLocaleString(),x.type,x.category,x.who,x.amount,x.balance,x.note]))
      .map(r=>r.map(q).join(",")).join("\n");
    downloadFile("fliparena-transactions.csv",csv,"text/csv");toast("Transaction log CSV exported.");audit("export-transactions-csv",rows.length+" rows");
  }}));
  btnRow.appendChild(createButton({label:"⬇️ Export JSON",variant:"ghost",size:"sm",onclick:()=>{
    downloadFile("fliparena-transactions.json",JSON.stringify({exportedAt:new Date().toISOString(),reconciliation:r,volume:v,rows},null,2),"application/json");
    toast("Transaction log JSON exported.");audit("export-transactions-json",rows.length+" rows");
  }}));
  btnRow.appendChild(createButton({label:"🧾 Revenue summary CSV",variant:"ghost",size:"sm",onclick:()=>{
    const csv=[["Metric","Value","Treatment"],["Coin Toss fees",r.fees,"REVENUE"],["P2P Games fees",r.catalogFees,"REVENUE"],["Series Cup rake",r.cupRakes,"REVENUE"],["Tournament rake",r.trnyRakes,"REVENUE"],["Shop & commerce",r.shop,"REVENUE"],["Transfer & gifting fees",r.xfFees,"REVENUE"],["Auction house fees",r.auctionFees,"REVENUE"],["Gross revenue",r.gross,"REVENUE"],["Promotional cost",r.promoCost,"COST"],["Comps paid",r.comps,"COST"],["Rakeback paid",r.rakebackPaid,"COST"],["Referral payouts",r.referralCost,"COST"],["Total costs",r.costs||0,"COST"],["Net revenue (NGR)",r.net,"NGR"],["Player deposits",coin(cfg().house.deposits||0),"FUNDING"],["Bot deposits",coin(cfg().house.botDeposits||0),"FUNDING"],["Cash in total",r.cashIn,"FUNDING"],["Player withdrawals",coin(cfg().house.playerWithdrawals||0),"CASH-OUT"],["Bot withdrawals",coin(cfg().house.withdrawals||0),"CASH-OUT"],["Cash out total",r.cashOut,"CASH-OUT"],["Net cash flow",r.netCash,"CASH-FLOW"],["Jackpot pool",coin(S.jackpot||0),"LIABILITY"],["Lifetime wagered",v.lifetime,"VOLUME"],["Settled games",v.games,"VOLUME"],["Taps (created)",r.taps,"ECONOMY"],["Sinks (removed)",r.sinks,"ECONOMY"],["House bankroll",r.bankroll,"ECONOMY"]]
      .map(r=>r.map(q).join(",")).join("\n");
    downloadFile("fliparena-revenue-summary.csv",csv,"text/csv");toast("Revenue summary CSV exported.");
  }}));
  exportCard.appendChild(btnRow);
  root.appendChild(exportCard);

  const recon=$("revenueRecon");if(recon){
    const check=(label,value,expected,good)=>`<div class="kv"><span class="k">${label}</span><span class="v" style="color:${good?"var(--green)":"var(--red)"}">${fmt(value)}${expected!=null?` <span class="muted">(expected ${fmt(expected)})</span>`:""}</span></div>`;
    recon.innerHTML=
      check("Coin Toss fees + P2P fees + rakes + shop + transfer fees + auction fees = Gross revenue",r.gross,null,true)+
      check("Gross revenue − promo cost − comps − rakeback − referral payouts = Net platform profit",r.net,sub(r.gross,r.costs||0),r.net===sub(r.gross,r.costs||0))+
      `<div class="kv"><span class="k">Rakeback paid (cost)</span><span class="v" style="color:var(--red)">−${fmt(r.rakebackPaid||0)}</span></div>`+
      `<div class="kv"><span class="k">Referral payouts (cost)</span><span class="v" style="color:var(--red)">−${fmt(r.referralCost||0)}</span></div>`+
      `<div class="kv"><span class="k">Cash in (top-ups / deposits)</span><span class="v">${fmt(r.cashIn)}</span></div>`+
      `<div class="kv"><span class="k">Cash out (withdrawals)</span><span class="v">${fmt(r.cashOut)}</span></div>`+
      `<div class="kv"><span class="k">Net cash flow</span><span class="v">${fmt(r.netCash)}</span></div>`+
      `<div class="kv"><span class="k">House bankroll (capital + net profit)</span><span class="v">${fmt(r.bankroll)}</span></div>`+
      `<div class="kv"><span class="k">Coins created (taps) / removed (sinks)</span><span class="v">${fmt(r.taps)} / ${fmt(r.sinks)}</span></div>`+
      `<div class="kv"><span class="k">Ledger invariants</span><span class="v">${auditRep.ok?'<span class="tag on">PASS</span>':'<span class="tag danger">'+auditRep.issues.length+' ISSUE(S)</span>'}</span></div>`+
      (auditRep.ok?'':`<div class="muted" style="margin-top:6px">${auditRep.issues.map(i=>"• "+i).join("<br>")}</div>`);
  }
}
/* Safe subtraction helper used by the reconciliation readout. */
function sub(a,b){return coin(a)-coin(b);}

/* ── Game parameters (mirrors every player-side betting control) ─────────── */
function gameParamDefaults(){return {stakeMin:10,stakeMax:1000,payoutCap:0,animMs:2300,edgePct:2,autoStop:-200};}
function renderGameParams(){
  const c=cfg(),d=gameParamDefaults();
  const set=(id,val)=>{const el=$(id);if(el&&document.activeElement!==el)el.value=val;};
  set("cfgStakeMin",c.stakeMin??d.stakeMin);set("cfgStakeMax",c.stakeMax??d.stakeMax);
  set("cfgPayoutCap",c.payoutCap??d.payoutCap);set("cfgEdge",c.edgePct??d.edgePct);
  set("cfgAnim",c.animMs??d.animMs);set("cfgAutoStop",(S.settings&&S.settings.autoRebetStop)??d.autoStop);
}
function saveGameParams(){
  const c=cfg(),d=gameParamDefaults();
  const num=(id,fallback)=>{const el=$(id);const v=el?parseFloat(el.value):NaN;return isFinite(v)?v:fallback;};
  let stakeMin=Math.max(1,Math.round(num("cfgStakeMin",d.stakeMin)));
  let stakeMax=Math.max(stakeMin,Math.round(num("cfgStakeMax",d.stakeMax)));
  c.stakeMin=stakeMin;c.stakeMax=stakeMax;
  c.payoutCap=Math.max(0,Math.round(num("cfgPayoutCap",d.payoutCap)));
  c.edgePct=Math.min(25,Math.max(0,num("cfgEdge",d.edgePct)));
  c.animMs=Math.max(200,Math.min(6000,Math.round(num("cfgAnim",d.animMs))));
  S.settings=S.settings||{};S.settings.autoRebetStop=Math.min(-50,Math.max(-10000,Math.round(num("cfgAutoStop",d.autoStop))));
  audit("game-params",`stake ${stakeMin}–${stakeMax} · cap ${c.payoutCap} · edge ${c.edgePct}% · anim ${c.animMs}ms · auto-stop ${S.settings.autoRebetStop}`);
  const st=$("gameParamsStatus");if(st)st.textContent=`Saved · stake ${fmt(stakeMin)}–${fmt(stakeMax)} · edge ${c.edgePct}%`;
  save();render();toast("Game parameters saved — the player app picks them up on the next bet.");
}
function resetGameParams(){
  const d=gameParamDefaults();Object.assign(cfg(),d);S.settings=S.settings||{};S.settings.autoRebetStop=d.autoStop;
  audit("game-params-reset","Restored default game parameters");save();render();toast("Game parameters reset to defaults.");
}

/* ── Live player session monitoring ──────────────────────────────────────── */
function renderSessionMonitor(){
  const el=$("playerSessionMonitor");if(!el)return;
  const w=S.wallet||{},pts=(S.rg&&S.rg.sessionPoints)||[];
  const last=pts.length?pts[pts.length-1]:null;
  const frozenYou=!!(S.frozen&&S.frozen.you);
  const frozenBots=(S.bots||[]).filter(b=>b.frozen).length;
  el.innerHTML=`<div class="grid4">
    <div class="stat-tile"><div class="v">${fmt(w.main||0)}</div><div class="k">MAIN balance</div></div>
    <div class="stat-tile blue"><div class="v">${fmt((w.bonus||0)+(w.referral||0)+(w.rakeback||0))}</div><div class="k">Bonus + referral + rakeback</div></div>
    <div class="stat-tile ${(S.stats&&S.stats.net)||0>=0?'green':'red'}"><div class="v">${((S.stats&&S.stats.net)||0)>=0?'+':''}${fmt((S.stats&&S.stats.net)||0)}</div><div class="k">Career net</div></div>
    <div class="stat-tile purple"><div class="v">${(S.waiting||[]).length}</div><div class="k">Open (escrowed) bets</div></div>
  </div>
  <div class="kv"><span class="k">Player account</span><span class="v">${frozenYou?'<span class="tag danger">FROZEN</span>':'<span class="tag on">ACTIVE</span>'} ${S.playerName||"Player"}</span></div>
  <div class="kv"><span class="k">Frozen simulated players</span><span class="v">${frozenBots} of ${(S.bots||[]).length}</span></div>
  <div class="kv"><span class="k">Last session sample</span><span class="v">${last?new Date(last.t).toLocaleTimeString()+" · net "+fmt(last.net||0):"No session samples yet"}</span></div>
  <div class="kv"><span class="k">Last ledger movement</span><span class="v">${(S.ledger&&S.ledger[0])?new Date(S.ledger[0].t).toLocaleTimeString()+" · "+S.ledger[0].type+" "+fmt(S.ledger[0].delta):"No ledger rows yet"}</span></div>
  <div class="row" style="margin-top:10px">
    <button class="btn ${frozenYou?'btn-green':'btn-danger'} btn-sm" id="adminFreezePlayer">${frozenYou?'❄️ Unfreeze player account':'⛔ Freeze player account'}</button>
    <button class="btn btn-ghost btn-sm" id="adminPlayerHistoryBtn">🕘 Player bet history</button>
  </div>`;
  const fb=$("adminFreezePlayer");
  if(fb)fb.onclick=()=>adminSetFreeze("__player__",!frozenYou);
  const hb=$("adminPlayerHistoryBtn");
  if(hb)hb.onclick=()=>adminPlayerHistory(S.playerName||"Player");
}

/* ── Player management: freeze / unfreeze / bet history ──────────────────── */
function adminSetFreeze(name,frozen){
  const reason=frozen?(prompt("Reason for freezing this account?")||"Admin review"):"";
  if(name==="__player__"){
    S.frozen=S.frozen||{you:false,reason:"",at:0,by:""};
    S.frozen.you=!!frozen;S.frozen.reason=reason;S.frozen.at=Date.now();S.frozen.by="admin";
  }else{
    const b=(S.bots||[]).find(x=>x.name===name);
    if(!b){toast("Player not found.");return;}
    b.frozen=!!frozen;b.frozenReason=reason;b.frozenAt=Date.now();
  }
  audit(frozen?"freeze-player":"unfreeze-player",name==="__player__"?"Demo player":name);
  save();render();toast((frozen?"Frozen ":"Unfrozen ")+(name==="__player__"?"the demo player account":name)+".");
}
function adminPlayerHistory(name){
  const isPlayer=name==="__player__"||name===(S.playerName||"Player");
  const coinGames=(S.games||[]).filter(g=>isPlayer||g.oppName===name);
  const catalogRows=(S.catalogLog||[]).filter(x=>!isPlayer&&(x.playerA===name||x.playerB===name));
  const rows=[
    ...coinGames.map(g=>({t:g.t,game:g.game||"Coin Toss",detail:`vs ${g.oppName||""} · ${g.result}`,amount:g.delta,stake:g.stake})),
    ...catalogRows.map(x=>({t:x.t,game:x.game,detail:`${x.playerA} [${x.pickA}] vs ${x.playerB} [${x.pickB}] · ${x.result}`,amount:null,stake:x.stake})),
  ].sort((a,b)=>(b.t||0)-(a.t||0)).slice(0,40);
  const body=rows.length?`<table><thead><tr><th>When</th><th>Game</th><th>Match</th><th>Stake</th><th>Δ</th></tr></thead><tbody>${
    rows.map(r=>`<tr><td>${new Date(r.t||0).toLocaleString()}</td><td>${r.game}</td><td>${r.detail}</td><td>${fmt(r.stake||0)}</td><td style="color:${(r.amount||0)>=0?"var(--green)":"var(--red)"}">${r.amount==null?"—":((r.amount>=0?"+":"")+fmt(r.amount))}</td></tr>`).join("")
  }</tbody></table>`:'<div class="muted">No settled bets for this player yet.</div>';
  const drawer=$("adminDrawer");if(drawer&&typeof openDrawer==="function"){
    $("drawerTitle").textContent="Bet history · "+(isPlayer?(S.playerName||"Player"):name);
    $("drawerContent").innerHTML=`<div class="grid4" style="margin-bottom:12px">
      <div class="stat-tile"><div class="v">${rows.length}</div><div class="k">Records</div></div>
      <div class="stat-tile blue"><div class="v">${fmt(rows.reduce((n,r)=>n+(r.stake||0),0))}</div><div class="k">Staked</div></div>
      <div class="stat-tile ${rows.reduce((n,r)=>n+(r.amount||0),0)>=0?'green':'red'}"><div class="v">${fmt(rows.reduce((n,r)=>n+(r.amount||0),0))}</div><div class="k">Net</div></div>
      <div class="stat-tile purple"><div class="v">${fmt(coinGames.filter(g=>g.winner==="you").length)}</div><div class="k">Wins vs player</div></div>
    </div>${body}`;
    openDrawer();
  }else toast("Drawer unavailable.");
}

function renderRates(){
  const c=cfg();
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
}

function renderOps(){
  const c=cfg();
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
  save();}
/* ── Targeted Admin rendering ────────────────────────────────────────────── */
let adminActiveTab="dash";
function setAdminActiveTab(tab){adminActiveTab=tab;}
const ADMIN_TAB_RENDERERS={
  dash:()=>renderDash(),
  approvals:()=>renderApprovals(),
  settings:()=>renderSettings(),
  ops:()=>renderOps(),
  people:()=>renderPeople(),
  features:()=>renderFeatureAdmin(),
  directory:()=>renderFeatureDirectory(),
  rates:()=>{renderRates();renderGameParams();renderSessionMonitor();},
  econ:()=>renderEcon(),
  revenue:()=>renderRevenue(),
  topups:()=>renderTopupAnalytics(),
  withdraw:()=>renderWithdrawals(),
  promo:()=>renderPromo(),
  vip:()=>{renderVip();renderLevels();},
  trny:()=>renderTrny(),
  audit:()=>{renderAudit();renderGameHistory();renderCatalogHistory();},
  trust:()=>renderTrust(),
  reports:()=>renderReports(),
  games:()=>renderGamesAdmin(),
  referrals:()=>renderReferrals(),
  announcements:()=>renderAnnouncements(),
  support:()=>renderSupport(),
  compliance:()=>renderCompliance(),
};
/** Render only the active Admin screen (no monolithic repaint). */
function renderAdminTab(tab){
  const key=tab||adminActiveTab,fn=ADMIN_TAB_RENDERERS[key];
  if(!fn)return false;
  try{fn();}catch(e){console.warn("renderAdminTab("+key+") error:",e);}
  return true;
}
/** Periodic refresh: chrome + the active Admin screen only. */
function renderAdminTick(){withPatchedDom(()=>{renderAdminChrome();updateAdminNavBadges();renderAdminTab();});}

export function bind(){
  "use strict";
  if(botLiveChannel)botLiveChannel.onmessage=e=>{const m=e.data||{};if(m.type==='player-alive'){lastPlayerAliveAt=Date.now();renderAdminLiveStatus();}else if(m.type==='bot-tick'){lastPlayerAliveAt=Date.now();lastBotTickAt=m.t||Date.now();renderAdminLiveStatus();}};
  setInterval(sendAdminBotPulse,1800);
  window.addEventListener('visibilitychange',sendAdminBotPulse);
  $("adminCommandBtn").onclick=()=>openAdminCommand();
  $("adminMobileMore").onclick=()=>openAdminCommand();
  /* v13.1 · floating nav drawer + in-nav theme settings. */
  $("adminNavFab")&&($("adminNavFab").onclick=e=>{e.stopPropagation();toggleAdminNavDrawer();});
  $("adminNavBackdrop")&&($("adminNavBackdrop").onclick=closeAdminNavDrawer);
  try{renderNavTheme();}catch(e){}
  $("adminCommandClose").onclick=closeAdminCommand;
  $("adminCommandBg").onclick=e=>{if(e.target===$("adminCommandBg"))closeAdminCommand();};
  $("adminCommandSearch").oninput=e=>renderAdminCommand(e.target.value);
  $("adminCommandSearch").oninput=e=>renderAdminCommand(e.target.value);
  // v13 access control + approvals + settings
  $("adminLoginBtn").onclick=adminLogin;
  $("adminLoginPass").addEventListener('keydown',e=>{if(e.key==='Enter')adminLogin();});
  $("adminLogoutBtn").onclick=adminLogout;
  if(!adminSession()){$("adminLoginOverlay").hidden=false;document.body.classList.add("admin-locked");}
  document.addEventListener('click',e=>{
    const gh=e.target.closest('[data-group-toggle]');
    if(gh){const g=S.adminNavGroups=S.adminNavGroups||{};const name=gh.dataset.groupToggle;g[name]=!g[name];applyAdminNavGroups();save();return;}
    const ap=e.target.closest('[data-approvals]');
    if(ap){
      if(ap.dataset.approvals==='kyc-approve')adminDecideKyc(ap.dataset.id,'approved');
      else if(ap.dataset.approvals==='kyc-decline')adminDecideKyc(ap.dataset.id,'declined');
      else if(ap.dataset.approvals==='flag-clear')adminResolveFlag(+ap.dataset.t,'Cleared — no action');
      else if(ap.dataset.approvals==='flag-escalate')adminResolveFlag(+ap.dataset.t,'Escalated to compliance');
      else if(ap.dataset.approvals==='excl-remove')adminRemoveExclusion(ap.dataset.name);
      return;
    }
  });
  $("kycVerifyApprove").onclick=adminVerifyKyc;
  $("kycResetApprove").onclick=adminResetKyc;
  $("flagRefresh").onclick=()=>renderApprovals();
  $("flagFilterSel").onchange=()=>renderApprovals();
  $("restrictFreeze").onclick=()=>{const n=$("restrictBotSel").value;if(n){adminSetFreeze(n,!S.frozen[n]);toast(S.frozen[n]?`Unfrozen ${n}.`:`${n} frozen.`,S.frozen[n]?'ok':'err');}};
  $("exclusionAdd").onclick=()=>{adminAddExclusion($("exclusionInput").value);$("exclusionInput").value='';};
  $("setEconSave").onclick=()=>{
    const c=cfg();
    c.feePct=Math.min(20,Math.max(0,+$("setFeePct").value||0));
    c.cupRakePct=Math.min(20,Math.max(0,+$("setCupRake").value||0));
    c.trnyRakePct=Math.min(20,Math.max(0,+$("setTrnyRake").value||0));
    c.jpArm=Math.max(0,Math.round(+$("setJpArm").value||0));
    c.jpPayPct=Math.min(100,Math.max(0,+$("setJpPay").value||0));
    const range=String($("setStakeRange").value).split(',').map(x=>Math.round(+x.trim())).filter(x=>isFinite(x)&&x>0);
    if(range.length===2){c.stakeMin=Math.min(range[0],range[1]);c.stakeMax=Math.max(range[0],range[1]);}
    audit('settings-economics',`fees ${c.feePct}/${c.cupRakePct}/${c.trnyRakePct} · jp ${c.jpArm}@${c.jpPayPct}% · stake ${c.stakeMin}-${c.stakeMax}`);
    save();render();$("setEconNote").textContent='Saved '+new Date().toLocaleTimeString();
  };
  $("setRoleSave").onclick=()=>{
    const ses=adminSession();if(!ses)return;
    const role=$("setRoleSel").value;
    sessionStorage.setItem(ADMIN_SESSION_KEY,JSON.stringify({user:ses.user,role,t:ses.t}));
    audit('settings-role',`${ses.user} switched role to ${role}`);
    renderAdminProfile();applyAdminRbac();toast('Role applied: '+role,'ok');
  };
  $("setMaintToggle").onclick=()=>{cfg().features.maintenance=!cfg().features.maintenance;audit('settings-maintenance',cfg().features.maintenance?'Maintenance ON':'Maintenance OFF');save();render();};
  $("setTurboCycle").onclick=()=>{S.turbo=S.turbo===1?2:S.turbo===2?100:S.turbo===100?1:1;audit('settings-turbo','Engine speed '+S.turbo+'x');save();render();};
  $("setFactoryReset").onclick=()=>{if(confirm('Factory reset wipes ALL shared demo state. Continue?')){localStorage.removeItem(SAVE_KEY);sessionStorage.removeItem(ADMIN_SESSION_KEY);location.reload();}};
  $("adminCommandList").onclick=e=>{const b=e.target.closest('[data-command-admin],[data-command-player]');if(!b)return;closeAdminCommand();if(b.dataset.commandPlayer)window.open(`index.html?tab=${b.dataset.commandPlayer}&feature=${b.dataset.commandFeature}`,'_blank');else goAdminTab(b.dataset.commandAdmin);};
  const peopleList=$("peopleList");
  if(peopleList)peopleList.addEventListener("click",e=>{
    const b=e.target.closest("[data-freeze],[data-unfreeze],[data-history]");if(!b)return;
    if(b.dataset.freeze)adminSetFreeze(b.dataset.freeze,true);
    else if(b.dataset.unfreeze)adminSetFreeze(b.dataset.unfreeze,false);
    else if(b.dataset.history)adminPlayerHistory(b.dataset.history);
  });
  $("adminNavSearch").oninput=e=>filterAdminNavigation(e.target.value);
  $("adminNavJump").onchange=e=>{if(e.target.value)goAdminTab(e.target.value);};
  $("adminQuickDock").onclick=e=>{const b=e.target.closest('[data-admin-tab]');if(b)goAdminTab(b.dataset.adminTab);};
  document.addEventListener('keydown',e=>{const typing=['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName);if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openAdminCommand();}else if(e.key==='/'&&!typing){e.preventDefault();openAdminCommand();}else if(e.key==='Escape'){closeAdminCommand();closeAdminNavDrawer();}});
  window.addEventListener('resize',()=>{if(window.innerWidth>1100)closeAdminNavDrawer();});
}


/* expose top-level symbols to globalThis so legacy inline handlers and the shared theme engine can resolve them */
Object.assign(globalThis,{$,ADMIN_TAB_RENDERERS,ADMIN_ARCADE_GAMES,ADMIN_CATALOG_GAMES,ADMIN_LIVE_ID,ADMIN_NAV_META,ADMIN_ROLES,BOT_CHANNEL_NAME,DIRECTORY,FEATURE_DIRECTORY,PAGE_SIZE,SAVE_KEY,VIEWS,VIP_BENEFIT_LABELS,adminAddExclusion,adminDecideKyc,adminLogin,adminLogout,adminRemoveExclusion,adminResolveFlag,adminSession,applyAdminRbac,applyAdminNavGroups,renderAdminProfile,adminAntiCheatScan,adminCommandEntries,adminPlayerHistory,adminSetFreeze,audit,botLiveChannel,cfg,checkVipMonthReset,closeAdminCommand,closeAdminNavDrawer,drawRng,filterAdminNavigation,fmt,downloadFile,gameParamDefaults,goAdminTab,toggleAdminNavDrawer,houseCashIn,houseCashOut,houseGross,houseNet,houseNetCash,lastPlayerAliveAt,load,openAdminCommand,pageRows,processBotWithdrawals,readVip,reconcileHouse,render,renderAdminChrome,renderAdminCommand,renderAdminLiveStatus,renderAll,renderAudit,renderCatalogHistory,renderDash,renderEcon,renderFeatureAdmin,renderAdminTab,renderAdminTick,renderFeatureDirectory,renderFlags,renderGameParams,renderOps,renderRates,renderRevenue,renderSessionMonitor,renderGameHistory,renderLevels,renderPeople,renderPromo,renderTopupAnalytics,renderTrny,renderTrust,renderVip,renderWithdrawals,renderReports,renderGamesAdmin,renderReferrals,renderAnnouncements,renderSupport,reportsData,buildComplianceReport,buildPlayerDataBundle,erasePlayerData,renderCompliance,complianceReportSet,complianceReportGet,adminErasePlayerData,adminReplyTicket,adminCloseTicket,adminSendPlayerMessage,adminAddUser,adminToggleUser,adminSetUserRole,adminCreateBackup,adminRestoreBackup,adminDeleteBackup,defaultState,resetGameParams,save,saveGameParams,sendAdminBotPulse,setAdminActiveTab,setPager,syncAdminNavigation,toast,topupAnalytics});

export {$,ADMIN_ARCADE_GAMES,ADMIN_CATALOG_GAMES,ADMIN_LIVE_ID,ADMIN_NAV_META,ADMIN_TAB_RENDERERS,BOT_CHANNEL_NAME,DIRECTORY,FEATURE_DIRECTORY,PAGE_SIZE,SAVE_KEY,VIEWS,VIP_BENEFIT_LABELS,adminAntiCheatScan,adminCommandEntries,adminPlayerHistory,adminSetFreeze,audit,botLiveChannel,cfg,checkVipMonthReset,closeAdminCommand,closeAdminNavDrawer,downloadFile,drawRng,filterAdminNavigation,fmt,gameParamDefaults,goAdminTab,toggleAdminNavDrawer,houseCashIn,houseCashOut,houseGross,houseNet,houseNetCash,lastPlayerAliveAt,load,openAdminCommand,pageRows,processBotWithdrawals,readVip,reconcileHouse,render,renderAdminChrome,renderAdminCommand,renderAdminLiveStatus,renderAdminTab,renderAdminTick,renderAll,renderAudit,renderCatalogHistory,renderDash,renderEcon,renderFeatureAdmin,renderFeatureDirectory,renderFlags,renderGameHistory,renderGameParams,renderLevels,renderOps,renderPeople,renderPromo,renderRates,renderRevenue,renderSessionMonitor,renderTopupAnalytics,renderTrny,renderTrust,renderVip,renderWithdrawals,renderReports,renderGamesAdmin,renderReferrals,renderAnnouncements,renderSupport,reportsData,buildComplianceReport,buildPlayerDataBundle,erasePlayerData,renderCompliance,complianceReportSet,complianceReportGet,adminErasePlayerData,adminReplyTicket,adminCloseTicket,adminSendPlayerMessage,adminAddUser,adminToggleUser,adminSetUserRole,adminCreateBackup,adminRestoreBackup,adminDeleteBackup,defaultState,resetGameParams,save,saveGameParams,sendAdminBotPulse,setAdminActiveTab,setPager,syncAdminNavigation,toast,topupAnalytics};

