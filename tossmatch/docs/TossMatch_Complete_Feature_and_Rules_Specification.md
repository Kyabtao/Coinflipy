# TossMatch v11.0 — Complete Feature, Rules and Operations Specification
**Authoritative documentation revision:** 28 August 2026 (v11.0 unified merge)  
**Runtime:** Local browser play-coin demonstration  
**Release counts:** 33 P2P Catalog + 23 Arcade+ = 56 game destinations; 75 Player commands; 106 unique Feature Directory records (95 Implemented / 3 Partial / 8 Suggested).  
**Shared state key:** `tossmatch_v8`  
**Scope:** Player, Admin, cross-tab live bot execution, 33 Catalog games, 23 Arcade+ modes (including restored G21–G23), bot withdrawals, Player Directory, Player/bot top-up analytics, bots, wallet/economy, progression, Platform/Security/RG, UX, feature directory, cons and production boundaries.

## 0. v11.0 unified-merge addendum

The v11.0 release merges five project workspaces into one project with the
v10.8 application as the functional base. Additions beyond v10.8:

| Feature | Rules |
|---|---|
| Bot withdrawals (OPS-5) | Each bot has a personal cash-out trigger uniformly randomized in the Admin-configurable band (default 3,000–5,000 MAIN). When a bot's MAIN reaches its trigger — and after its required first top-up — it files a withdrawal: it keeps 400–1,199 MAIN, the remainder (rounded down to 50, minimum 500) leaves the bot wallet, is counted as a coin **sink**, and is deducted from **house revenue**. A 20-second per-bot cooldown paces repeat cash-outs. Admin may process eligible withdrawals manually; the engine also processes them during background ticks at a configurable chance (default 0.35). |
| Player Directory (OPS-6) | Admin screen listing the demo player plus the full simulated roster with playable balance, MAIN/BONUS split, W–L record, net, level, top-ups and withdrawals; searchable, sortable and paginated (20 rows). |
| Crash (G21) | Escrowed stake; a proof byte derives the bust point `cp = min(100, floor((256×0.97)/(256−byte)×100)/100)`. The multiplier grows continuously; the player may cash out at any point below the bust point for `stake × multiplier` to MAIN. Auto cash-out at a chosen multiplier is supported. Busting records a loss; byte 0x00 can trigger the armed jackpot. |
| Hi-Lo (G22) | Escrowed stake; cards 1–13 derive from proof bytes. Each correct higher/lower guess raises the streak; the banked payout is `stake × 1.7^streak`. A wrong guess busts the run and records the loss. |
| Mines (G23) | Escrowed stake; 1–15 mines are placed on the 5×5 board from a proof hash chain. Each gem raises the multiplier `m = 0.97 × Π (25−i)/(safe−i)`; the player may bank `stake × m` after any gem. Hitting a mine busts the round. |
| Photoreal coin skin | Legendary shop skin (800 coins) using the project's real coin photographs on both faces. |
| Accounting | `house.withdrawals` accumulates paid bot withdrawals and reduces net revenue in all Admin P&L views. Withdrawals are never player payments or deposits. |

## 1. Deliverables and version
| Deliverable | Purpose |
|---|---|
| index.html | Player v10.8 application with initialized bot MAIN/BONUS wallets and first-top-up gate |
| admin.html | Admin v10.8 control panel with live bot wallet/readiness statistics |
| manifest.webmanifest | Installable PWA metadata |
| sw.js | Offline core-cache service worker |
| icons/icon-192.png / icon-512.png | PWA icons |
| api/openapi.json | Demo API specification |
| TossMatch_Project_Documentation.docx | Complete project documentation |
| TossMatch_Feature_Register.md | Feature-by-feature status |
| TossMatch_Cons_and_Roadmap.md | Cons, production deferrals and roadmap |
| TossMatch_Audit_Report.md | Validated build findings/fingerprints |
| CHANGELOG.md | Release chronology |

## 2. Non-negotiable defaults and rules
| Setting | Current value / behavior |
|---|---|
| Default player MAIN balance | 1,000 |
| Initial BONUS / REFERRAL | 250 / 50 |
| Bot starting roster | 99; grows automatically when enabled |
| Bot starting MAIN | 0 for every seeded, generated, imported-migrated and newly created bot |
| Bot starting BONUS | Exactly 1,000 in a separate `bonusBalance`; recorded as tap + promotion cost |
| Bot wallet migration | One-time `walletVersion=2` reset converts existing bots to 0 MAIN / 1,000 BONUS and resets first-top-up eligibility |
| Bot top-up trigger | 500 MAIN by default for later top-ups; Admin range 0–10,000 |
| Bot top-up eligibility | Every bot must complete one first top-up before any game, queue, Arcade or autonomous activity |
| Bot top-up values | Varied 400–1,600 credited to MAIN; required first top-up promotion, when enabled, is credited to BONUS; later top-ups use the configurable MAIN low-balance trigger |
| Player top-up | Minimum 100; first eligible top-up receives +50% if enabled; an activated percentage campaign can add a separate campaign bonus |
| Top-up analytics retention | 200 Player records / 100 bot records; base, bonuses and credited totals are tracked separately |
| Coin/Catalog fee | 5% default |
| Cup rake | 5% default |
| Tournament rake | 10% default |
| Jackpot funding | 10% of fee; floor 1; armed at 50; pays 50% of pool |
| Non-MAIN stake cap | 20% of stake |
| Transfer | 2% fee; minimum 10; default daily cap 500 |
| Auto Bet stop | −200 default; presets −100/−200/−500; custom −50 to −10,000 |
| Admin data paging | 20 rows when a dataset exceeds 20 |
| Play mode | Play coins only; no deposits/withdrawals/payment custody |

## 3. Wallet and settlement
| Segment | Use |
|---|---|
| MAIN | Winnings, manual top-ups, transfers and primary spend |
| BONUS | Promotions, level/achievement/quest rewards; capped non-MAIN stake contribution |
| REFERRAL | Referral fee share; capped non-MAIN stake contribution |
| RAKEBACK | Claimed VIP rakeback; capped non-MAIN stake contribution |
| BANK | Player-controlled parked MAIN balance; unavailable for betting until unparked |

Before each wager, maintenance, durable self-exclusion, cool-off, session limit, rate limit, loss limit, minimum/maximum stake, total balance and MAIN/non-MAIN requirements are checked. P2P stakes are debited into local escrow before outcome resolution. Split/carry behavior is game-specific and every retained result stores stake, fee, payout, delta, opponent, picks/details and proof where applicable.

## 4. Coin Toss, Series and tournaments
| Mode | Rules / winner determination |
|---|---|
| Coin Toss | Two entrants choose opposite HEADS/TAILS. Combined SHA-256 proof first byte parity decides. Both stakes enter escrow; winner receives post-fee pot. Byte 00 may trigger an armed jackpot. |
| Series Bo3 | First entrant to 2 wins receives post-rake pot. |
| Series Bo5 | First to 3 wins. |
| Series Bo7 | First to 4 wins. |
| Series Advantage | Win by two; capped at nine games. |
| Tournament single | 4/8/16-player single-elimination; one proof flip per match; bots fill all seats; no real player required. |
| Tournament Bo3 | Each bracket match is first to two; bots fill and run unattended. |
| Tournament prizes | Configured rake removed; remaining pool uses 75% champion / 25% runner-up allocation. VIP may discount player entry. |

### 4.1 Coin Toss controls, matching and fairness proof
| Detail | Current behavior |
|---|---|
| Stake | Default 100, minimum 10, quick values 50/100/250/500/1,000; effective maximum is `min(1,000, 100 + level × 100)`. |
| Pick and posting | Choose HEADS or TAILS, debit the segmented wallet into escrow and post to the waiting room. Player can cancel an unmatched own post for full refund. |
| Matching | A player can manually take an opposite open bet; automatic bot matching and bot-posted liquidity also operate. Friend and Private Room Coin Toss reuse the settlement path and add context history. |
| Auto Bet | Persistent on/off option. Stop threshold defaults to −200, has −100/−200/−500 presets and accepts −50 through −10,000 in steps of 50. It stops once session net is at/below the threshold. |
| Turbo stress modes | 1×, 20×, 100×, 500× and 1,000×. Default saved state is 1×. Turbo affects simulated bot throughput, not payout odds; 1,000× is flagged by the local anti-cheat scan as stress-mode risk. |
| Proof formula | `makerHash=SHA256(makerSeed:gameId:stake:side)`; same for taker; `commit=SHA256(serverSeed)`; add the three hashes as big integers; `finalHash=SHA256(combinedHex:gameId)`; even first byte = HEADS, odd = TAILS. Byte 00 may trigger an armed jackpot. |
| Verification | The Player verifier accepts revealed server seed, maker hash, taker hash and game ID; “Load last game” fills the most recent proof. This is a local demonstration, not an independently hosted commitment service. |

## 5. P2P Catalog — 33 playable games
| # | Code | Game | Category | Input | Winner / tie / carry |
|---|---|---|---|---|---|
| 1 | Base · overunder | ⚖️ Over / Under | Side Picks | HIGH / LOW | Proof byte 128–255 = HIGH, 0–127 = LOW; matching side wins. |
| 2 | Base · speed | 💨 Speed Round | Side Picks | HEADS / TAILS | Five flips; majority HEADS/TAILS wins. |
| 3 | Base · tug | 🪢 Tug of War | Side Picks | LEFT / RIGHT | Proof flips pull LEFT/RIGHT; first side to three steps wins. |
| 4 | Base · evenodd | ➕ Even / Odd Sum | Side Picks | EVEN / ODD | Two proof bytes are summed; parity matching EVEN/ODD wins. |
| 5 | Base · closest | 🎯 Closest Number | Numbers & Dice | Number 0–255 | Closest distinct 0–255 pick to proof byte wins; equal distance splits. |
| 6 | Base · luckybattle | 🎲 Lucky Number Battle | Numbers & Dice | Number 0–255 | Exact proof-byte match wins; otherwise closest pick; equal distance carries. |
| 7 | Base · sumpredict | 📈 Sum Prediction | Numbers & Dice | Number 0–510 | Closest distinct prediction to the sum of two proof bytes wins; equal distance splits. |
| 8 | Base · higherbyte | 🔢 Higher Byte | Numbers & Dice | No pick | Independent byte per entrant; higher byte wins; equal bytes split. |
| 9 | Base · patternrace | 🔗 Pattern Race | Patterns & Territory | pattern3 | First selected three-flip pattern to appear wins; none in proof window carries. |
| 10 | Base · parlayduel | 🧩 Parlay Duel | Patterns & Territory | pattern3 | Three flips; prediction with most positional matches wins; equal score carries. |
| 11 | Base · prediction | 🎯 Prediction Streak | Patterns & Territory | pattern5 | Five flips; most correct positional predictions wins; equal score splits. |
| 12 | Base · blind | 👁️ Blind Pick | Side Picks | HEADS / TAILS | Hidden HEADS/TAILS picks. Opposite picks resolve normally; same correct picks split and same wrong picks carry. |
| 13 | Base · rangewar | 🔢 Range War | Patterns & Territory | zones | Result inside a claimed non-overlapping quarter wins; outside both claims carries. |
| 14 | Base · bullseye | 🎯 Bullseye | Patterns & Territory | zones | Result inside a claimed non-overlapping target wedge wins; miss carries. |
| 15 | Base · chain | 🔗 Chain Reaction | Side Picks | HEADS / TAILS | Entrants alternate calls for up to ten flips; first incorrect caller loses; both surviving split. |
| 16 | Base · ladder | 💨 Elimination Ladder | Side Picks | HEADS / TAILS | HEADS/TAILS sides race; first side to three proof results wins. |
| 17 | Base · mirrored | 🪞 Mirrored Coins | Side Picks | HEADS / TAILS | Two coins: matching outcomes carry; different outcomes assign one coin to each side and matching player pick wins. |
| 18 | CAT18 · rps | ✊ Rock Paper Scissors Duel | Side Picks | ROCK / PAPER / SCISSORS | Standard ROCK/PAPER/SCISSORS dominance; same choices split. |
| 19 | CAT19 · closest21 | 🃏 Closest to 21 | Numbers & Dice | No pick | Two cards per entrant (1–10). Closest total at/below 21 wins; equal totals or both bust split. |
| 20 | CAT20 · triplecoin | 🪙 Triple Coin Majority | Side Picks | HEADS / TAILS | Majority of three proof flips wins. |
| 21 | CAT21 · sequencebuilder | 🧬 Sequence Builder | Patterns & Territory | HH / HT / TH / TT | First selected two-symbol H/T starter to appear wins; neither appearing carries. |
| 22 | CAT22 · dicesumduel | 🎲 Dice Sum Duel | Numbers & Dice | No pick | Two dice per entrant; higher sum wins; equal sums split. |
| 23 | CAT23 · colourspectrum | 🌈 Colour Spectrum Duel | Patterns & Territory | zones | Proof byte inside a claimed non-overlapping band wins; unclaimed band carries. |
| 24 | CAT24 · primecomposite | 🔢 Prime vs Composite | Side Picks | PRIME / COMPOSITE | Proof integer 2–251 is classified PRIME/COMPOSITE; matching side wins. |
| 25 | CAT25 · medianbattle | 📐 Median Number Battle | Numbers & Dice | Number 0–255 | Player picks and proof byte form three values; pick at median wins; if proof is median, nearest pick wins; equal distance splits. |
| 26 | CAT26 · streaksurvivor | 🔥 Streak Survivor | Side Picks | HEADS / TAILS | First HEADS/TAILS side to appear four times consecutively wins; no streak carries. |
| 27 | CAT27 · territory | 🗺️ Territory Capture | Patterns & Territory | zones | Nine proof bytes score claimed non-overlapping sectors; higher score wins; equal nonzero score splits; zero/zero carries. |
| 28 | CAT28 · modulo4 | ➗ Modulo Four Duel | Numbers & Dice | 0 / 1 / 2 / 3 | Proof byte modulo four matching a claimed remainder wins; unclaimed remainder carries. |
| 29 | CAT29 · pokerhigh | ♠️ Poker High Duel | Cards | No pick | Five unique proof-derived cards each; standard poker category and kickers decide; exact tie splits. |
| 30 | CAT30 · threedicepoker | 🎲 Three Dice Poker | Numbers & Dice | No pick | Three dice each; triple beats pair, then total/high die; exact tie splits. |
| 31 | CAT31 · lastdigit | 🔟 Last Digit Duel | Numbers & Dice | 0 / 1 / 2 / 3 / 4 / 5 / 6 / 7 / 8 / 9 | Different digits 0–9; proof number last digit matching a claim wins; unclaimed digit carries. |
| 32 | CAT32 · binaryduel | 🧬 Binary Code Duel | Patterns & Territory | pattern3 | Different three-bit H/T codes; lowest Hamming distance to proof code wins; equal distance splits. |
| 33 | CAT33 · coinbalance | ⚖️ Coin Balance Battle | Numbers & Dice | Number 2–8 | Different predictions 2–8; closest to HEADS count in ten flips wins; equal distance splits. |

Every Catalog game uses the same per-game waiting room, manual take, automatic bot joining, bot-posted liquidity, bot-vs-bot settlement, configured pot fee, proof retention, player per-game history and Admin Catalog result/earnings path.

## 6. Arcade+ — 20 playable modes
| Code | Mode | Control / cost | Winner or payout rule |
|---|---|---|---|
| G1 | Lucky Wheel | One free daily; paid spin 50 MAIN | 25/50 BONUS, 100 MAIN, cosmetic/emoji or 150 jackpot-style reward |
| G2 | Scratch Cards | Cards cost 25/100/250 | Best symbol count: 3=2×, 4=5×, 5+=10× |
| G3 | Dice Roll | Exact double or LOW 2–6 / HIGH 8–12 | Exact double 30×; ranges 1.8×; seven loses |
| G4 | Weekly Raffle | Tickets cost 10; player and bots | One ticket wins 80%; house retains 20%; weekly reset |
| G5 | Multiplier Ladder P2P | Equal stake vs bot | Higher proof rung wins post-fee pot; equal outcome splits |
| G6 | War Card Game | Equal stake vs bot | Higher 2–Ace card wins; ties trigger War; unresolved tie splits |
| G7 | Plinko Drop | Default stake 50; No choice | Slots: 0×, 0.5×, 1×, 2×, 5×, 2×, 1×, 0.5×, 0×. |
| G8 | Mini Slots | Default stake 50; No choice | Pair 2× · any triple 5× · triple 7 pays 10×. |
| G9 | Quick Keno | Default stake 50; Five distinct numbers 1–20 | 2 hits 0.5× · 3 hits 1.5× · 4 hits 5× · 5 hits 20×. |
| G10 | Bingo Rush | Default stake 50; No choice | Complete any row, column or diagonal within six draws to pay 3×. |
| G11 | Treasure Hunt | Default stake 50; Tile 1–9 | Published tile values range from 0× trap to 5× treasure; key pays 4×. |
| G12 | Memory Match | Default stake 50; No choice | 2 pairs 1× · 3 pairs 2× · 4 pairs 4× · 5+ pairs 8×. |
| G13 | Drop Ball | Default stake 50; Column 1–7 | Seven visible pockets pay 0×, 0.5×, 1×, 3×, 1×, 0.5×, 0×. |
| G14 | Daily Trivia | Default stake 25; One daily answer | Correct answer pays 3× and adds a daily trivia result to history. |
| G15 | Fishing Reel | Default stake 50; Basic/Shiny/Legend bait | Common 0.5× · Uncommon 1.2× · Rare 3× · Legendary 10×. |
| G16 | Penalty Shootout | Default stake 50; LEFT/CENTER/RIGHT | 3 goals 1.5× · 4 goals 3× · 5 goals 8×. |
| G17 | Coin Pusher | Default stake 50; No choice | Tray outcomes pay 0×, 0.5×, 1×, 2×, 3× or 6×. |
| G18 | Tower Builder | Default stake 50; Floor 3/5/7 | Floor 3 pays 1.6× · floor 5 pays 3× · floor 7 pays 7×; any failed floor loses. |
| G19 | Match-3 Rush | Default stake 50; No choice | 2 matches 1.5× · 4 matches 4× · 6+ matches 10×. |
| G20 | Mystery Vault | Default stake 50; Key 1–5 | Correct key pays 4.5×; other keys lose. |

Direct Arcade spends use MAIN and the shop/sink accounting family. Coin payouts update taps and promotional cost. G1–G4 use local demo randomization and do not expose a verifier proof package. G5–G6 derive outcomes from Web Crypto fairness bytes, but their direct Arcade history currently stores result detail rather than an exposed replay package. G7–G20 derive outcomes from the local commitment/hash helper and retain the hash/proof in the general game record. Every mode writes Arcade history and player statistics. Autonomous bots select from all 20 modes. These proof boundaries must not be represented as certified production RNG.

## 7. Social and community
| Code | Feature | Implemented detail |
|---|---|---|
| S1 | Friends & Buddies | Friend list, bot requests and connections, online status, direct challenge and friend-first bets. |
| S2 | Private Rooms | Invite/friend access, custom game and stake rules, details and history. |
| S3 | Player Profiles | Stats, VIP, skill, cosmetics, achievements, form graph and recent games. |
| S4 | Spectator Mode | Animated viewer with participants, picks, pot, fee, result and proof. |
| S5 | Gifting | MAIN coin and paid cosmetic gifts with fee, minimum, cap and history. |
| S6 | Lobby Chat | Text, owned emojis, autonomous bot conversation, replies, mute/block and sent history. |
| S7 | Clans & Teams | Clan identity, roster, team matches, tournaments, leaderboard and history. |

## 8. Progression, VIP and rewards
### 8.1 VIP tiers and complete benefits
| Tier | Name | Monthly wager threshold | Rakeback % | Benefits |
|---|---|---|---|---|
| 1 | Starter | 0 | 0 | Basic access; Daily quests; Jackpot eligibility |
| 2 | Silver | 1000 | 4 | 4% rakeback; Blue chat colour; 1 free premium emoji |
| 3 | Gold | 3000 | 6 | 6% rakeback; Gold avatar frame; Queue priority; 2 free premium emojis |
| 4 | Platinum | 8000 | 8 | 8% rakeback; Platinum VIP coin skin; 2 free premium emojis |
| 5 | Diamond | 20000 | 12 | 12% rakeback; Diamond VIP coin skin; 5% tournament discount; 3 free premium emojis |
| 6 | Black Diamond | 50000 | 15 | 15% rakeback; Black Diamond animated frame; Birthday-bonus eligibility; 10% tournament discount; 10% cosmetics discount; 5 free premium emojis |
| 7 | Royal | 75000 | 17 | 17% rakeback; Royal Crown title; 10% tournament discount; 20% cosmetics discount; Priority-support entitlement; 8 free premium emojis |
| 8 | Legend | 100000 | 20 | 20% rakeback (maximum); Legend Prism + Eternal Flame skins; 15% tournament discount; 30% cosmetics discount; All premium emojis; Gold leaderboard name; Early-access entitlement |

VIP wager counters reset by UTC month or Admin action. Pending rakeback and permanently unlocked cosmetics/emojis remain. Current-tier benefits such as discounts, queue priority, support/early-access entitlements depend on the current monthly tier.

### 8.2 Progress+ mechanics
| Code | Exact current configuration |
|---|---|
| P1 Battle Pass | Monthly pass XP milestones: 0 / 500 / 1,500 / 3,000 / 5,000. Free BONUS: 25 / 50 / 75 / 100 / 150. Premium BONUS: 75 / 125 / 200 / 300 / 500. Premium unlock costs 500 MAIN. Subscription quest multiplier applies when eligible. |
| P2 Login Calendar | First visit of each local day auto-claims: days 1–6 pay 50 / 75 / 100 / 125 / 150 / 175 BONUS; day 7 pays 250 BONUS plus a cosmetic. |
| P3 Weekly Challenges | Win 10 games = 300 BONUS; play 5 game types = 250 BONUS; reach a 3-win streak = 200 BONUS. Progress and claims use the current calendar week. |
| P4 Prestige | Requires level 10+. Resets level to 1 and XP to 0; increments Prestige rank, equips/unlocks Rainbow frame and adds permanent +5% XP per rank. |
| P5 Skill Matching | Rookie under 10 games; thereafter Bronze <45% wins, Silver 45–54%, Gold 55–64%, Elite 65%+. Optional peer-tier preference falls back to all eligible bots. |

### 8.3 Daily quests
| ID | Goal | Target | BONUS reward |
|---|---|---|---|
| settle | Settle 3 games | 3 | 50 |
| win | Win 1 game | 1 | 75 |
| cup | Play 1 Series Cup | 1 | 50 |

### 8.4 Achievements — 49
| ID | Achievement | Trigger | BONUS reward |
|---|---|---|---|
| first | 🪙 First Flip | Settle your first game | 30 |
| onfire | 🔥 On Fire | 3-win streak | 75 |
| unstoppable | ⚡ Unstoppable | 5-win streak | 150 |
| jackpot | 🎰 Jackpot! | Win the jackpot | 300 |
| cup | ⚔️ Cup Winner | Win a Series Cup | 100 |
| champ | 👑 Champion | Win a tournament | 300 |
| bigballer | 🕶️ Big Baller | Stake 500+ in one game | 100 |
| nightowl | 🦉 Night Owl | Play 10 games | 50 |
| frequent | 🎯 Frequent Flipper | Play 25 games | 100 |
| doubledigits | 🔟 Double Digits | Win 10 games | 100 |
| highroller | 💎 High Roller | Reach level 5 | 100 |
| comeback | 🙌 Comeback Kid | Win after two straight losses | 75 |
| century | 💯 Century Club | Settle 100 games | 250 |
| veteran | 🎖️ Veteran | Settle 250 games | 500 |
| winner25 | 🏅 Quarter Century | Win 25 games | 250 |
| winner100 | 🏆 Winning Machine | Win 100 games | 750 |
| streak10 | 🌋 Volcanic | Reach a 10-win streak | 500 |
| cup5 | ⚔️ Cup Specialist | Win 5 Series Cups | 300 |
| trny3 | 🏟️ Bracket Boss | Win 3 tournaments | 500 |
| catalog5 | 🎮 Game Explorer | Play 5 different catalog games | 150 |
| catalog17 | 🧭 Catalog Master | Play all 33 catalog games | 750 |
| collector5 | 🛍️ Collector | Own 5 paid cosmetics | 150 |
| collector15 | 🗃️ Super Collector | Own 15 paid cosmetics | 400 |
| silvervip | 🥈 Silver Status | Reach Silver VIP | 100 |
| goldvip | 🥇 Gold Status | Reach Gold VIP | 250 |
| profit1000 | 📈 Profit Maker | Reach +1,000 career net | 300 |
| level10 | ⭐ Double-Digit Level | Reach level 10 | 300 |
| level20 | 🌟 Elite Level | Reach level 20 | 750 |
| transfer5 | 💸 Generous | Complete 5 player transfers | 150 |
| friends5 | 🤝 Friendly Five | Add 5 friends | 125 |
| friends10 | 🫶 Social Circle | Add 10 friends | 250 |
| chat10 | 💬 Lobby Regular | Send 10 lobby messages | 100 |
| rooms3 | 🔒 Room Host | Create 3 private rooms | 150 |
| gifts3 | 🎁 Gift Giver | Send 3 gifts | 150 |
| arcade10 | 🕹️ Arcade Starter | Play 10 Arcade+ games | 150 |
| arcade50 | 👾 Arcade Ace | Play 50 Arcade+ games | 500 |
| maxpay1000 | 💰 Four-Figure Payout | Receive a 1,000+ payout | 300 |
| wager10000 | 📊 Volume Player | Wager 10,000 lifetime | 300 |
| cup10 | 🛡️ Cup Legend | Win 10 Series Cups | 600 |
| trny5 | 🏟️ Tournament Royalty | Win 5 tournaments | 750 |
| collector25 | 🏪 Wardrobe Vault | Own 25 paid cosmetics | 750 |
| level30 | 🌠 Master Level | Reach level 30 | 1000 |
| level40 | 🚀 Mythic Level | Reach level 40 | 1500 |
| level50 | 🏔️ Level Summit | Reach level 50 | 2500 |
| transfer10 | 💞 Community Banker | Complete 10 player transfers | 300 |
| streak15 | ☄️ Untouchable | Reach a 15-win streak | 1000 |
| catalog50 | 🗺️ Catalog Veteran | Play 50 catalog matches | 500 |
| clan5 | 🛡 Clan Loyalist | Play 5 clan games | 300 |
| allrounder | 🌐 All-Rounder | Play Catalog, Series, Tournament, Friend and Arcade modes | 500 |

### 8.5 Levels 2–50
| Level | Default BONUS | Additional milestone |
|---|---|---|
| 2 | 100 | — |
| 3 | 150 | — |
| 4 | 200 | — |
| 5 | 250 | — |
| 6 | 300 | — |
| 7 | 350 | — |
| 8 | 400 | — |
| 9 | 450 | — |
| 10 | 500 | — |
| 11 | 550 | — |
| 12 | 600 | — |
| 13 | 650 | — |
| 14 | 700 | — |
| 15 | 750 | — |
| 16 | 800 | — |
| 17 | 850 | — |
| 18 | 900 | — |
| 19 | 950 | — |
| 20 | 1000 | — |
| 21 | 1050 | — |
| 22 | 1100 | — |
| 23 | 1150 | — |
| 24 | 1200 | — |
| 25 | 1250 | — |
| 26 | 1300 | — |
| 27 | 1350 | — |
| 28 | 1400 | — |
| 29 | 1450 | — |
| 30 | 1500 | Rare cosmetic |
| 31 | 1550 | — |
| 32 | 1600 | — |
| 33 | 1650 | — |
| 34 | 1700 | — |
| 35 | 1750 | — |
| 36 | 1800 | — |
| 37 | 1850 | — |
| 38 | 1900 | — |
| 39 | 1950 | — |
| 40 | 2000 | Epic cosmetic |
| 41 | 2050 | — |
| 42 | 2100 | — |
| 43 | 2150 | — |
| 44 | 2200 | — |
| 45 | 2250 | — |
| 46 | 2300 | — |
| 47 | 2350 | — |
| 48 | 2400 | — |
| 49 | 2450 | — |
| 50 | 2500 | Legendary cosmetic |

Level formula: floor(sqrt(XP/60)) + 1. All crossed levels are paid when one XP award skips levels. Prestige at level 10 resets level/XP, adds one rank, grants Rainbow frame and permanently adds +5% XP per rank.

## 9. Shop inventory — 134 items
| Category | ID | Name | Price MAIN | Rarity | VIP restriction |
|---|---|---|---|---|---|
| skins | classic | Classic Gold | 0 | free | No |
| skins | platinum-vip | Platinum VIP | 0 | epic | VIP 4 |
| skins | diamond-vip | Diamond VIP | 0 | legendary | VIP 5 |
| skins | silver | Silver | 25 | common | No |
| skins | bronze | Bronze | 25 | common | No |
| skins | neon | Neon | 50 | uncommon | No |
| skins | arctic | Arctic | 50 | uncommon | No |
| skins | ember | Ember | 75 | uncommon | No |
| skins | ruby | Ruby | 100 | rare | No |
| skins | emerald | Emerald | 100 | rare | No |
| skins | sapphire | Sapphire | 100 | rare | No |
| skins | bitcoin | Bitcoin | 150 | rare | No |
| skins | koi | Koi Fish | 150 | rare | No |
| skins | galaxy | Galaxy | 300 | epic | No |
| skins | rainbow | Rainbow | 500 | legendary | No |
| skins | blackhole | Black Hole | 600 | legendary | No |
| skins | obsidian | Obsidian | 250 | rare | No |
| skins | solar | Solar Flare | 450 | epic | No |
| skins | frostfire | Frostfire | 750 | legendary | No |
| skins | quantum | Quantum Shift | 1200 | mythic | No |
| skins | jade | Jade Fortune | 350 | epic | No |
| skins | lunar | Lunar Halo | 650 | legendary | No |
| skins | legend | Legend Prism | 0 | mythic | VIP 8 |
| skins | eternal | Eternal Flame | 0 | mythic | VIP 8 |
| flags | in | India | 25 | common | No |
| flags | br | Brazil | 25 | common | No |
| flags | gb | UK | 25 | common | No |
| flags | us | USA | 50 | uncommon | No |
| flags | jp | Japan | 50 | uncommon | No |
| flags | de | Germany | 50 | uncommon | No |
| flags | ca | Canada | 100 | rare | No |
| flags | ae | UAE | 100 | rare | No |
| flags | au | Australia | 100 | rare | No |
| flags | it | Italy | 100 | rare | No |
| flags | kr | South Korea | 200 | epic | No |
| flags | earth | Earth | 500 | legendary | No |
| flags | sg | Singapore | 100 | rare | No |
| flags | za | South Africa | 100 | rare | No |
| flags | nz | New Zealand | 150 | rare | No |
| flags | pt | Portugal | 150 | rare | No |
| avatars | hero | Hero | 25 | common | No |
| avatars | ninja | Ninja | 25 | common | No |
| avatars | cop | Officer | 50 | uncommon | No |
| avatars | wizard | Wizard | 50 | uncommon | No |
| avatars | astro | Astronaut | 100 | rare | No |
| avatars | robot | Robot | 100 | rare | No |
| avatars | mask | Mask | 100 | rare | No |
| avatars | ghost | Ghost | 200 | epic | No |
| avatars | royal | Royal | 500 | legendary | No |
| avatars | agent | Agent | 400 | legendary | No |
| avatars | fairy | Fairy | 1000 | mythic | No |
| avatars | dragon | Dragon | 800 | legendary | No |
| avatars | alien | Alien | 300 | epic | No |
| avatars | fox | Fox | 200 | rare | No |
| avatars | panda | Panda | 250 | rare | No |
| avatars | unicorn | Unicorn | 700 | legendary | No |
| frames | none | None | 0 | free | No |
| frames | thin | Thin Ring | 25 | common | No |
| frames | double | Double Ring | 50 | uncommon | No |
| frames | gold | Gold Ring | 100 | rare | No |
| frames | fire | Fire Ring | 150 | rare | No |
| frames | ice | Ice Ring | 200 | epic | No |
| frames | neon | Neon Pulse | 250 | epic | No |
| frames | blackdiamond | Black Diamond Animated | 0 | legendary | VIP 6 |
| frames | rainbow | Rainbow Spin | 600 | legendary | No |
| frames | emerald-ring | Emerald Orbit | 200 | rare | No |
| frames | cosmic-ring | Cosmic Halo | 400 | epic | No |
| frames | crown-ring | Crown Aura | 700 | legendary | No |
| colours | default | Default | 0 | free | No |
| colours | blue | Blue | 50 | uncommon | No |
| colours | green | Green | 50 | uncommon | No |
| colours | orange | Orange | 100 | rare | No |
| colours | purple | Purple | 100 | rare | No |
| colours | gold | Gold | 200 | epic | No |
| colours | pink | Pink | 100 | rare | No |
| colours | cyan | Cyan | 100 | rare | No |
| colours | red | Crimson | 150 | rare | No |
| colours | white | Pearl | 250 | epic | No |
| colours | rainbow | Rainbow | 500 | legendary | No |
| colours | glitch | Glitch | 1000 | mythic | No |
| fx | confetti | Standard Confetti | 0 | free | No |
| fx | coins | Gold Coins Fall | 50 | common | No |
| fx | fireworks | Fireworks | 100 | uncommon | No |
| fx | star | Star Burst | 150 | rare | No |
| fx | laser | Laser Show | 300 | epic | No |
| fx | money | Money Rain | 300 | epic | No |
| fx | phoenix | Phoenix Rise | 600 | legendary | No |
| fx | cherry | Cherry Blossom | 250 | epic | No |
| fx | thunder | Thunder Storm | 450 | epic | No |
| fx | aurora-burst | Aurora Burst | 550 | legendary | No |
| fx | trophy | Trophy Shower | 700 | legendary | No |
| fx | dragon | Dragon Roar | 1200 | mythic | No |
| themes | midnight | Midnight | 0 | free | No |
| themes | ocean | Ocean | 50 | common | No |
| themes | forest | Forest | 100 | uncommon | No |
| themes | sunset | Sunset | 150 | rare | No |
| themes | space | Space | 300 | epic | No |
| themes | casino | Casino Gold | 300 | epic | No |
| themes | aurora | Aurora | 600 | legendary | No |
| themes | desert | Desert Gold | 200 | rare | No |
| themes | icepalace | Ice Palace | 350 | epic | No |
| themes | royalhall | Royal Hall | 700 | legendary | No |
| themes | lava | Lava Chamber | 850 | legendary | No |
| themes | cyber | Neon Cyberpunk | 1000 | mythic | No |
| sounds | standard | Standard | 0 | free | No |
| sounds | 8bit | 8-Bit Retro | 50 | common | No |
| sounds | orch | Orchestral | 100 | uncommon | No |
| sounds | dj | DJ Mix | 200 | rare | No |
| sounds | trailer | Movie Trailer | 300 | epic | No |
| sounds | synth | Synthwave | 250 | epic | No |
| sounds | crystal | Crystal Chime | 350 | epic | No |
| sounds | bass | Deep Bass | 450 | legendary | No |
| sounds | choir | Epic Choir | 500 | legendary | No |
| emojis | fire | Fire | 25 | common | No |
| emojis | party | Party | 25 | common | No |
| emojis | down | Thumbs down | 25 | common | No |
| emojis | drool | Drooling | 50 | uncommon | No |
| emojis | poop | Poop | 50 | uncommon | No |
| emojis | angry | Angry | 50 | uncommon | No |
| emojis | think | Thinking | 100 | rare | No |
| emojis | explode | Exploding head | 100 | rare | No |
| emojis | nerd | Nerdy | 100 | rare | No |
| emojis | money | Money face | 200 | epic | No |
| emojis | crown | Crown | 200 | epic | No |
| emojis | ctrl | Controller | 200 | epic | No |
| emojis | gem | Diamond | 400 | legendary | No |
| emojis | slot | Slot | 400 | legendary | No |
| emojis | hundo | 100 | 500 | legendary | No |
| emojis | rocket | Rocket | 150 | rare | No |
| emojis | trophy | Trophy | 250 | epic | No |
| emojis | robot | Robot | 150 | rare | No |
| emojis | alien | Alien | 250 | epic | No |
| emojis | fox | Fox | 100 | rare | No |
| emojis | panda | Panda | 100 | rare | No |

Purchases use MAIN, apply current VIP shop discount where eligible, update house shop/sink accounting and persist ownership. Bots may purchase affordable non-VIP inventory. E1 crates and E6 crafting also grant items through the same ownership model.

## 10. Economy+ and coin utility
| Code | Feature | Exact current configuration and accounting boundary |
|---|---|---|
| E1 | Mystery Crates | Common 75 MAIN, Rare 200, Epic 500, Legendary 1,000. Common/Rare grant 1–3 items; Epic/Legendary grant 2–3; selected tier is the rarity floor. Duplicate results remain possible. |
| E2 | Trading Post | Rotating bot listings and player listings. Player listing minimum is 25. Buyer pays the listing price, seller receives 90%, and house records a rounded 10% fee. |
| E3 | Staking Vault | Stake/unstake minimum input 100. Completed weeks pay 1% of staked balance; each claim is capped at 500 and recorded as house-funded reward. Demo can advance seven days. |
| E4 | Subscriptions | 30-day Plus 300 MAIN, Pro 700, Elite 1,500. Plus: badge + monthly cosmetic. Pro: exclusive-table entitlement + cosmetic + 2× quest rewards. Elite: Pro perks + Cyber theme + one-hour XP-booster bundle. Repurchase extends from the later of now/current expiry. |
| E5 | Coin Boosters | 2× XP for one hour costs 200 MAIN; +5 percentage points rakeback for 24 hours costs 300 MAIN, capped at 25% effective. Repurchase extends active duration. |
| E6 | Cosmetic Crafting | Uncommon-floor recipe 150 MAIN; Rare-floor 400; Epic-floor 800. One random item at/above the floor is granted; duplicates are possible; last 50 crafts retained. |
| E7 | Event Ticket Packs | 1 ticket = 100 MAIN; 3 = 250; 7 = 500. Tickets persist as non-payout demo utility; last 50 purchases retained. |
| E8 | Clan Treasury | Minimum contribution 50 MAIN; control defaults to 100. Funds are non-withdrawable, grant no wagering edge and count as sink/social resource—not house revenue. Utility level = `min(10, 1 + floor(treasury/1,000))`. |
| E9 | Private Room Upgrades | Basic 0, Neon 200 MAIN, Royal 500, Cosmic 1,000. Persistent visual tier is applied to stored Private Rooms; it changes no odds, payout, queue or matching behavior; last 20 purchases retained. |

Purchases use MAIN and retain Economy history. Ordinary shop, crates, subscriptions, boosters, crafting, tickets and room upgrades use shop/sink accounting. E8 is deliberately excluded from house revenue. E7 makes no payout promise. All values are play-coin demo values and are Admin/runtime configuration candidates for a server implementation.

## 11. Bots and automatic activity
| Area | Behavior |
|---|---|
| Roster | 99 initial bots; automatic creation default 1 every 15 seconds up to 250; Admin bounds 99–1,000, interval 5–3,600 seconds, batch 1–10 |
| Games | Eight Coin Toss and eight Catalog runs per normal cycle; Series, tournaments and all 20 Arcade+ modes |
| Social | Friend requests, bot-to-bot friendships, lobby chat, room/clan/gift activity logs |
| Starting wallet | Every bot begins at exactly 0 MAIN and 1,000 BONUS; source seed balances and procedural balances are zero |
| Wallet migration | `initializeBotStartingWallet` resets every pre-v10.8 bot once under `walletVersion=2`, including previous balance/top-up eligibility |
| Starting bonus accounting | `accountBotStartingBonus` records the 1,000 BONUS once, with timestamp, tap and promotion cost |
| Economy | Starting BONUS, required first MAIN top-up, then Shop purchases, Trading Post, transfers, event participation and later low-balance top-ups |
| First-top-up gate | Existing, imported, Admin-added and auto-created bots are blocked from play/activity until `firstTopupDone` becomes true |
| Activation | The coordinated engine leader runs `ensureAllBotsFirstTopups` before every full bot tick and once before initial Player activation |
| Direct eligibility | Skill matching, named-bot interaction and bot pools call readiness helpers so a pending bot is topped up before selection |
| New bots | `createAutoBot` performs the required first top-up immediately after adding the bot and before social/game activity logs |
| First top-up | Base 400–1,600 goes to MAIN; +50% promotion, when enabled, goes to BONUS; record includes startingBonus, walletCredit, required/pre-play flags and firstTopupAt |
| Later top-up | Only after first completion; triggers below Admin-configured MAIN default 500, retains varied values and credits MAIN |
| Bulk onboarding | Feed spam is suppressed while onboarding a roster; one summary feed row reports how many bots became eligible |
| Admin readiness | Live Operations shows ready/blocked/top-up counts plus aggregate bot MAIN and BONUS; Top-up Analytics separates starting BONUS and first-promo BONUS |
| Player profile | Bot profile shows MAIN, BONUS and total wallet separately |
| Accounting | Starting BONUS and promo BONUS are taps plus promotion cost; MAIN top-ups are taps; no bot credit is house revenue |
| Player count | Home, separate Player Directory, separate Leaderboard and Admin use persisted roster length; production must separate bots from humans |
| Turbo | Player header provides 1×/20×/100×/500×/1,000× stress speeds; normal saved default 1×; Turbo changes simulation volume only. |

## 12. Player screens and navigation
| Tab | Purpose |
|---|---|
| home | Home dashboard and customization |
| lobby | Live bets and activity |
| play | Coin Toss |
| series | Player-vs-bot and unattended bot-vs-bot Series Cups; bot-filled tournaments; double-or-nothing rooms |
| games | 33-game P2P Catalog |
| newgames | 20-game Arcade+ |
| leaderboard | Ranked list |
| players | Separate Player Directory |
| community | Social Hub |
| progressionplus | Progress+ |
| economyplus | Economy+ and Coin Utility |
| shop | 134-item shop |
| season | VIP, quests, achievements |
| history | Nine history categories |
| updates | Release notes |
| wallet | Wallet and quick RG |
| stats | Advanced game, payout, participation and Player top-up analytics |
| verify | Fairness verifier |
| services | UX, Platform, API, Security, RG, Statements, Offers |

Navigation includes desktop sidebar search, grouped quick jump, Ctrl/Command+K and `/` command palette, Escape close, mobile dock, exact-game command entries, Catalog/Arcade search/category/Favorites/jump, and query-parameter deep links.

## 13. Histories and statistics
| History category | Included records |
|---|---|
| All Games | Coin Toss, Catalog, Arcade and feature games |
| P2P Catalog | Per-game picks, result, fee, proof and carry |
| Friend Challenges | Opponent/result/payout |
| Private Rooms | Room lifecycle and room games |
| Clan Games | Matches and clan tournaments |
| Arcade+ | G1–G20 |
| Progress+ | Claims, Prestige and pass activity |
| Economy+ | Crates, trade, staking, subscriptions, boosters, E6–E9 |
| Social | Friends, gifting and communication actions |

Statistics include games/wins/losses/draws/carries, streaks, net, biggest stake, lifetime wagered, total/max payout, fees, average stake/payout, return on wagered, game-family participation, Cups/tournaments, friend/room/clan and Arcade counts, recent payout trend, and complete Player top-up analytics.

### 13.1 Player and bot top-up analytics
| Surface / metric | Current v10.8 behavior |
|---|---|
| Player record | Each new Player top-up retains timestamp, base amount, first-top-up bonus, campaign bonus, total bonus, total credited, campaign ID and source. Legacy `{t, amount}` records remain readable as base-only top-ups. |
| Player retention | Up to 200 deposit/top-up records remain in `rg.deposits`; the same base amounts continue to enforce daily/weekly/monthly deposit limits. |
| Player Wallet card | Shows top-up count, total base coins, total bonus coins and total credited. |
| Player Home card | “Top-up credited” is a ninth customizable Dashboard KPI and is added once during migration from a pre-v10.5 saved state. |
| Player Statistics cards | Adds top-up count, base volume, bonus volume and credited total to the main cards. |
| Player Statistics page | Shows count, base, bonus, credited, average, largest, last 7 days, last 30 days, first-top-up bonuses, campaign bonuses, bonus/base rate, most recent time and eight recent records. |
| Monthly statement | Adds top-up count, base total, bonus total and credited total for the selected month. |
| Bot record | Up to 100 records retain timestamp, bot, MAIN base, 1,000 starting BONUS, first-promo BONUS, top-up total, complete wallet credit, reason, count and required/pre-play flags. |
| Admin header / Overview | Header shows combined base top-up volume. Overview cards show combined base volume, top-up bonuses and event count. |
| Admin Economy | Cards separately show Player credits, bot credits, combined top-up promotional credits and zero top-up revenue. |
| Admin Top-up Analytics page | Shows Player/bot summaries, bot starting BONUS versus first-promo BONUS, ready/pending totals, complete wallet credits, filtered/paginated records, recent bots and CSV export. |
| Accounting boundary | Bot starting 1,000 BONUS and first-promo BONUS are taps plus promotion cost; first/later MAIN top-ups are taps. None is a deposit, payment or house revenue. |

### 13.2 Live cross-tab bot engine and Admin synchronization
| Component | Current v10.8 behavior |
|---|---|
| Admin launch | Player header and footer Admin links open `admin.html` in a new tab with `target="_blank"`, preserving the Player tab and full bot engine. |
| Admin fallback | Admin embeds a one-pixel same-origin `index.html?engine=1` Player-engine frame. If no normal Player tab owns simulation leadership, the fallback can take over after the lock expires. |
| Live channel | Player engines and Admin use `BroadcastChannel` name `tossmatch_bot_live_v1`. Visible Admin sends an `admin-pulse` every 1.8 seconds. |
| Hidden Player behavior | A hidden Player tab/frame receives Admin pulses and requests the full existing `backgroundTick`, avoiding reliance on browser-throttled hidden-tab intervals. |
| Single engine | Player instances coordinate through localStorage key `tossmatch_bot_leader_v1`. The lock identifies one Player engine, refreshes on each tick and expires after six seconds so another Player/fallback can take over. |
| Tick scope | The coordinated tick runs the full Player bot path: Coin Toss, Catalog, Arcade+, social activity, transfers, top-ups, roster growth, waiting-room matching, Series Cups and tournaments. |
| Immediate persistence | Every completed bot tick writes shared `tossmatch_v8` state and emits a `bot-tick` message containing time, source, games, bot count and queue depth. |
| Admin live refresh | Admin listens to shared-state storage events, reloads state and refreshes live cards/pages. If an Admin input is focused, safe summary surfaces refresh without replacing the field being edited. |
| Feedback-loop guard | `applyingRemoteState` suppresses Player/Admin writes while rendering a remote storage update, preventing cross-tab save ping-pong and stale overwrite. |
| Admin status | Header displays `BOT ENGINE LIVE`, `PLAYER CONNECTED · SYNCING`, or `WAITING FOR PLAYER TAB` from recent channel/storage timestamps. |
| Visible Player return | When Player becomes visible, it requests leadership/tick; Admin pulses stop driving it after pulse expiry, avoiding duplicate normal intervals. |
| Compatibility | BroadcastChannel is feature-detected. localStorage synchronization and the Player interval remain fallback paths, but modern same-origin browsers provide the intended live behavior. |

## 14. Admin screens and controls
| Admin destination | Controls |
|---|---|
| Overview | Live bot-engine status, KPIs, alerts, quick actions, revenue/jackpot/RNG |
| Live Operations | Maintenance, required bot first-top-up readiness, bots/growth, player, queue, transfers and later top-ups |
| Feature Hub | Social/Arcade/Progress/Economy and coin-utility telemetry, including 33 Catalog/20 Arcade destinations and Catalog earnings paths |
| Top-up Analytics | Combined Player/bot top-up cards, counts, base volume, bonuses, credits, averages, 7/30-day windows, Player records with filter/sort/20-row pagination, recent bot records and CSV export |
| Feature Directory | 101 records with search/category/status and quick links |
| Rates & Jackpot | Fees, jackpot and universal rules |
| Economy | P&L, taps/sinks, simulator and compensation |
| Promotions | First-top-up toggle, scheduled campaigns, broadcast and claims |
| VIP & Levels | Eight tiers and 49 paginated level rewards |
| Tournaments | Create/filter/sort brackets |
| Audit & Data | Audit, proofs, histories and exports |
| Trust Center | Analytics, anti-cheat, RG, PWA/API/notification/2FA/statement posture |

Admin has 12 screen destinations in v10.8. Data over 20 rows uses filter/sort/pagination. Admin cannot end durable Player self-exclusion. Exact Player game links are available from Feature Directory and command palette.

## 15. Platform, security, RG and UX
| Code | Feature | Status | Current detail |
|---|---|---|---|
| RG-D | Demo RG Controls | Implemented | Persistent deposit/session limits, cool-off, durable self-exclusion, loss limit, reality graph, bank and Auto Bet stop. |
| T1 | Installable PWA | Implemented | Manifest, 192/512 icons, install readiness and offline service-worker cache. |
| T2 | Multi-language | Implemented | Persistent English, Hindi, Bengali, Tamil and Telugu primary navigation/Home translations. |
| T3 | Public API | Partial | Working in-browser API explorer, key rotation, OpenAPI spec and request log; server API still required. |
| T4 | Real-time Analytics | Implemented | Cross-tab live Player bot-engine pulses plus retained player/game/revenue/queue/social/Arcade samples, KPIs, chart and export. |
| T5 | Push Notifications | Partial | Browser permission, preferences, local notifications and history; remote push backend still required. |
| SEC1 | Two-Factor Authentication | Partial | Web Crypto six-digit TOTP enrollment, verification and verified disable demo; account backend required. |
| SEC2 | Anti-Cheat Detection | Implemented | Rules scan for impossible balances, extreme win rate, duplicate proof, malformed payout and Turbo risk. |
| SEC3 | Public Fairness Page | Implemented | Standalone proof verification without account access. |
| SEC4 | Monthly Activity Statement | Implemented | Monthly preview with wager, payout, fee, P/L and top-up totals plus JSON/CSV downloads and email simulation. |
| RG1 | Deposit Limits | Implemented | Persistent daily/weekly/monthly limits, immediate decreases, delayed increases and enforced top-up checks. |
| RG2 | Session Time Limits | Implemented | Persistent maximum duration with enforced cool-off before new games. |
| RG3 | Durable Self-Exclusion | Implemented | Timed or permanent shared-state exclusion with no early Player/Admin undo. |
| RG4 | Reality Check Graph | Implemented | Configurable reminders, retained session P/L points, graph and explicit up/down callout. |
| UX1 | Accessibility Center | Implemented | Persistent high contrast, reduced motion, text scale, colour-vision presets and screen-reader hints. |
| UX2 | Customizable Dashboard | Implemented | Player-selected and reordered Home KPI cards and sections with reset and persistence. |
| UX3 | Saved Bet & Game Presets | Implemented | Up to 20 named Coin/Catalog/Arcade presets that fill controls without auto-wagering and retain RG checks. |
| UX4 | Smart Game Discovery | Implemented | Explainable favorite, variety, current-game, daily and collection recommendations with exact links. |

## 16. Complete Feature Directory — 101 records
| Category | Code | Feature | Status | Description | Destination |
|---|---|---|---|---|---|
| Core Games | CORE-1 | Coin Toss | Implemented | Escrowed HEADS/TAILS P2P match with fee, jackpot, proof, manual take and auto-match. | Player play |
| Core Games | CORE-2 | P2P Catalog | Implemented | Thirty-three proof-driven games with per-game queues, manual take, carries and history. | Player games |
| Core Games | CORE-3 | Series Cups | Implemented | Bo3, Bo5, Bo7 and Advantage Cups for player-vs-bot and unattended bot-vs-bot play. | Player series |
| Core Games | CORE-4 | Tournaments | Implemented | Single-flip and Bo3 brackets with bot fill, VIP discount and 75/25 prizes. | Player series · Admin trny |
| Core Games | CORE-5 | Jackpot | Implemented | Fee-funded, threshold-armed byte-00 jackpot with rollover. | Player play · Admin rates |
| Core Games | CORE-6 | Fairness Verifier | Implemented | Local SHA-256 recomputation for retained Coin and Catalog proof inputs. | Player verify |
| Social & Community | S1 | Friends & Buddies | Implemented | Friend list, bot requests and connections, online status, direct challenge and friend-first bets. | Player community/friends |
| Social & Community | S2 | Private Rooms | Implemented | Invite/friend access, custom game and stake rules, details and history. | Player community/rooms |
| Social & Community | S3 | Player Profiles | Implemented | Stats, VIP, skill, cosmetics, achievements, form graph and recent games. | Player community/profile |
| Social & Community | S4 | Spectator Mode | Implemented | Animated viewer with participants, picks, pot, fee, result and proof. | Player community/spectate |
| Social & Community | S5 | Gifting | Implemented | MAIN coin and paid cosmetic gifts with fee, minimum, cap and history. | Player community/gifts |
| Social & Community | S6 | Lobby Chat | Implemented | Text, owned emojis, autonomous bot conversation, replies, mute/block and sent history. | Player community/chat |
| Social & Community | S7 | Clans & Teams | Implemented | Clan identity, roster, team matches, tournaments, leaderboard and history. | Player community/clans |
| Arcade+ Games | G1 | Lucky Wheel | Implemented | Daily free and paid spins with coin and cosmetic prizes. | Player newgames/wheel |
| Arcade+ Games | G2 | Scratch Cards | Implemented | Three card tiers, nine reveals and match-based payouts. | Player newgames/scratch |
| Arcade+ Games | G3 | Dice Roll | Implemented | Exact double 30× or low/high range 1.8×. | Player newgames/dice |
| Arcade+ Games | G4 | Weekly Raffle | Implemented | Player/bot tickets with 80% winner payout and 20% house share. | Player newgames/raffle |
| Arcade+ Games | G5 | Multiplier Ladder P2P | Implemented | Matched rung-or-bust P2P duel with split handling. | Player newgames/ladder |
| Arcade+ Games | G6 | War Card Game | Implemented | 2–Ace cards with automatic War rounds and P2P settlement. | Player newgames/war |
| Core Games | CAT18 | Rock Paper Scissors Duel | Implemented | Two hidden simultaneous picks; standard RPS winner takes the post-fee P2P pot. | Player games/rps |
| Core Games | CAT19 | Closest to 21 | Implemented | Each player receives proof-derived cards; closest total to 21 without exceeding it wins. | Player games/closest21 |
| Core Games | CAT20 | Triple Coin Majority | Implemented | Players select HEADS or TAILS and three proof flips decide the majority side. | Player games/triplecoin |
| Core Games | CAT21 | Sequence Builder | Implemented | Players choose different two-symbol starters and extend a proof sequence toward a target pattern. | Player games/sequencebuilder |
| Core Games | CAT22 | Dice Sum Duel | Implemented | Each participant receives two proof-derived dice; the higher sum wins and equal sums split. | Player games/dicesumduel |
| Core Games | CAT23 | Colour Spectrum Duel | Implemented | Players claim different colour bands mapped across byte 0–255; result inside a claimed band wins. | Player games/colourspectrum |
| Core Games | CAT24 | Prime vs Composite | Implemented | Opposite picks resolve from a number between 2 and 251; primality determines the winner. | Player games/primecomposite |
| Core Games | CAT25 | Median Number Battle | Implemented | Two player picks and one proof number form three values; the player closest to the median wins. | Player games/medianbattle |
| Core Games | CAT26 | Streak Survivor | Implemented | Opposite sides race through proof flips; the first side to achieve a four-result streak wins. | Player games/streaksurvivor |
| Core Games | CAT27 | Territory Capture | Implemented | Players claim non-overlapping map sectors and successive proof bytes capture territory until majority. | Player games/territory |
| Core Games | CAT28 | Modulo Four Duel | Implemented | Two players claim different remainders from 0–3; a proof byte modulo four decides, while unclaimed results carry. | Player games/modulo4 |
| Core Games | CAT29 | Poker High Duel | Implemented | Five proof-derived cards per entrant; standard hand rank determines the P2P winner. | Player games/pokerhigh |
| Core Games | CAT30 | Three Dice Poker | Implemented | Three proof dice each; triple beats pair, then total/high die, with exact ties split. | Player games/threedicepoker |
| Core Games | CAT31 | Last Digit Duel | Implemented | Different 0–9 picks compete against a proof number last digit; unclaimed digits carry. | Player games/lastdigit |
| Core Games | CAT32 | Binary Code Duel | Implemented | Different three-bit codes compete by Hamming distance to the proof code; equal distance splits. | Player games/binaryduel |
| Core Games | CAT33 | Coin Balance Battle | Implemented | Distinct predictions compete on the number of HEADS in ten proof flips; equal distance splits. | Player games/coinbalance |
| Arcade+ Games | G7 | Plinko Drop | Implemented | Drop a chip through a proof-derived peg path into prize multiplier slots. | Player newgames/plinko |
| Arcade+ Games | G8 | Mini Slots | Implemented | Three proof-derived reels with transparent symbol odds, paylines and capped prizes. | Player newgames/slots |
| Arcade+ Games | G9 | Quick Keno | Implemented | Pick numbers from a compact board and compare them with proof-derived draws. | Player newgames/keno |
| Arcade+ Games | G10 | Bingo Rush | Implemented | Fast 3×3 card with proof draws; complete a line before the draw limit. | Player newgames/bingo |
| Arcade+ Games | G11 | Treasure Hunt | Implemented | Choose tiles on a hidden map containing coins, multipliers, keys and traps. | Player newgames/treasure |
| Arcade+ Games | G12 | Memory Match | Implemented | Resolve eight proof-driven memory moves and earn published pair-count prizes. | Player newgames/memory |
| Arcade+ Games | G13 | Drop Ball | Implemented | Release a ball into columns with proof-derived bounce direction and visible multiplier pockets. | Player newgames/dropball |
| Arcade+ Games | G14 | Daily Trivia | Implemented | One proof-retained daily question attempt; a correct answer pays the published 3× reward. | Player newgames/trivia |
| Arcade+ Games | G15 | Fishing Reel | Implemented | Cast, wait and reel proof-derived fish rarities for collection and coin rewards. | Player newgames/fishing |
| Arcade+ Games | G16 | Penalty Shootout | Implemented | Pick shot direction against a proof-derived goalkeeper for a five-kick score challenge. | Player newgames/penalty |
| Arcade+ Games | G17 | Coin Pusher | Implemented | Five proof-derived drops push stacks toward published 0×–6× reward trays. | Player newgames/coinpusher |
| Arcade+ Games | G18 | Tower Builder | Implemented | Choose floor 3, 5 or 7 and survive every proof-derived risk check for the published multiplier. | Player newgames/tower |
| Arcade+ Games | G19 | Match-3 Rush | Implemented | A proof-derived 5×5 gem board pays by horizontal and vertical three-symbol matches. | Player newgames/match3 |
| Arcade+ Games | G20 | Mystery Vault | Implemented | Choose one of five keys; the proof-selected winning key pays 4.5×. | Player newgames/vault |
| Progression | P1 | Battle Pass | Implemented | Monthly free/premium XP milestones and reward claims. | Player progressionplus/pass |
| Progression | P2 | 7-Day Login Calendar | Implemented | Escalating automatic rewards with day-7 cosmetic and BONUS. | Player progressionplus/calendar |
| Progression | P3 | Weekly Challenges | Implemented | Wins, game variety and streak goals with larger rewards. | Player progressionplus/weekly |
| Progression | P4 | Prestige | Implemented | Level reset for permanent XP boost, badge and Rainbow frame. | Player progressionplus/prestige |
| Progression | P5 | Skill Matchmaking | Implemented | Five skill tiers and preferred peer-bot matching with fallback. | Player progressionplus/skill |
| Economy+ | E1 | Mystery Crates | Implemented | Four tiers with 1–3 cosmetics and a guaranteed rarity floor. | Player economyplus/crates |
| Economy+ | E2 | Trading Post | Implemented | Bot listings, player sales and a 10% house transaction fee. | Player economyplus/trade |
| Economy+ | E3 | Staking Vault | Implemented | Flexible staking with completed-week 1% interest and claim cap. | Player economyplus/staking |
| Economy+ | E4 | Subscriptions | Implemented | Plus, Pro and Elite 30-day tiers with engagement perks. | Player economyplus/subscription |
| Economy+ | E5 | Coin Boosters | Implemented | Time-limited 2× XP or +5% rakeback consumables. | Player economyplus/boosters |
| Economy+ | E6 | Cosmetic Crafting | Implemented | Spend MAIN on uncommon, rare or epic rarity-floor cosmetic recipes with retained history. | Player economyplus/utility |
| Economy+ | E7 | Event Ticket Packs | Implemented | Buy persistent non-payout demo utility tickets in 1, 3 or 7-ticket packs. | Player economyplus/utility |
| Economy+ | E8 | Clan Treasury | Implemented | Non-withdrawable MAIN contributions create clan utility resources and levels without wagering advantage. | Player economyplus/utility |
| Economy+ | E9 | Private Room Upgrades | Implemented | Unlock persistent Basic, Neon, Royal or Cosmic visual room tiers with no gameplay advantage. | Player economyplus/utility |
| Player & Retention | RET-1 | 8-Tier VIP | Implemented | Monthly wager tiers, rakeback, permanent rewards, discounts and priority. | Player season · Admin vip |
| Player & Retention | RET-2 | Achievements & Levels | Implemented | Forty-nine achievements, configurable rewards through level 50 and milestone cosmetics. | Player season · Admin vip |
| Player & Retention | RET-3 | Player History | Implemented | Nine categories, search, sorting, pagination, details and export. | Player history |
| Player & Retention | RET-4 | Advanced Statistics | Implemented | Lifetime wager, total/max payout, fees, averages, ROI, payout trend and Player top-up analytics. | Player stats |
| Wallet & Commerce | WAL-1 | Segmented Wallet | Implemented | MAIN, BONUS, REFERRAL, RAKEBACK and BANK with stake caps. | Player wallet |
| Wallet & Commerce | WAL-2 | Top-up Promotion & Analytics | Implemented | Bot initialization at 0 MAIN + 1,000 BONUS, required first-top-up gate, Admin promotion control and complete Player/bot analytics. | Player stats · Admin topups |
| Wallet & Commerce | WAL-3 | Shop & Cosmetics | Implemented | Nine expanded categories, 38 new items, VIP rewards, discounts and equip controls. | Player shop |
| Wallet & Commerce | WAL-4 | Transfers & Bot Economy | Implemented | Bots start at 0 MAIN + 1,000 BONUS, complete a varied first MAIN top-up before activity, then use active economy, later top-ups and roster growth. | Player wallet · Admin ops |
| Operations | OPS-1 | Command Center | Implemented | KPIs, live bot-engine status, alerts, quick actions, revenue, top-up volume, jackpot and RNG monitoring. |  · Admin dash |
| Operations | OPS-2 | Feature Hub | Implemented | B1–B4 telemetry and feature administration controls. |  · Admin features |
| Operations | OPS-3 | Audit & Exports | Implemented | Audit trail, review flags, filtering, pagination and data exports. |  · Admin audit |
| Operations | OPS-4 | Promotions Manager | Implemented | Scheduled campaigns now support Player credit/cash-drop claims, next-top-up activation, one-claim tracking and Admin counts. | Player services/offers · Admin promo |
| Responsible Gaming | RG-D | Demo RG Controls | Implemented | Persistent deposit/session limits, cool-off, durable self-exclusion, loss limit, reality graph, bank and Auto Bet stop. | Player services/rg · Admin trust |
| Platform | T1 | Installable PWA | Implemented | Manifest, 192/512 icons, install readiness and offline service-worker cache. | Player services/platform · Admin trust |
| Platform | T2 | Multi-language | Implemented | Persistent English, Hindi, Bengali, Tamil and Telugu primary navigation/Home translations. | Player services/platform · Admin trust |
| Platform | T3 | Public API | Partial | Working in-browser API explorer, key rotation, OpenAPI spec and request log; server API still required. | Player services/api · Admin trust |
| Platform | T4 | Real-time Analytics | Implemented | Cross-tab live Player bot-engine pulses plus retained player/game/revenue/queue/social/Arcade samples, KPIs, chart and export. |  · Admin trust |
| Platform | T5 | Push Notifications | Partial | Browser permission, preferences, local notifications and history; remote push backend still required. | Player services/platform · Admin trust |
| Security | SEC1 | Two-Factor Authentication | Partial | Web Crypto six-digit TOTP enrollment, verification and verified disable demo; account backend required. | Player services/security · Admin trust |
| Security | SEC2 | Anti-Cheat Detection | Implemented | Rules scan for impossible balances, extreme win rate, duplicate proof, malformed payout and Turbo risk. | Player services/security · Admin trust |
| Security | SEC3 | Public Fairness Page | Implemented | Standalone proof verification without account access. | Player verify |
| Security | SEC4 | Monthly Activity Statement | Implemented | Monthly preview with wager, payout, fee, P/L and top-up totals plus JSON/CSV downloads and email simulation. | Player services/statements · Admin trust |
| Responsible Gaming | RG1 | Deposit Limits | Implemented | Persistent daily/weekly/monthly limits, immediate decreases, delayed increases and enforced top-up checks. | Player services/rg · Admin trust |
| Responsible Gaming | RG2 | Session Time Limits | Implemented | Persistent maximum duration with enforced cool-off before new games. | Player services/rg · Admin trust |
| Responsible Gaming | RG3 | Durable Self-Exclusion | Implemented | Timed or permanent shared-state exclusion with no early Player/Admin undo. | Player services/rg · Admin trust |
| Responsible Gaming | RG4 | Reality Check Graph | Implemented | Configurable reminders, retained session P/L points, graph and explicit up/down callout. | Player services/rg · Admin trust |
| UX & Accessibility | UX1 | Accessibility Center | Implemented | Persistent high contrast, reduced motion, text scale, colour-vision presets and screen-reader hints. | Player services/ux |
| UX & Accessibility | UX2 | Customizable Dashboard | Implemented | Player-selected and reordered Home KPI cards and sections with reset and persistence. | Player services/ux |
| UX & Accessibility | UX3 | Saved Bet & Game Presets | Implemented | Up to 20 named Coin/Catalog/Arcade presets that fill controls without auto-wagering and retain RG checks. | Player services/ux |
| UX & Accessibility | UX4 | Smart Game Discovery | Implemented | Explainable favorite, variety, current-game, daily and collection recommendations with exact links. | Player services/ux |
| Suggested — LiveOps & Social | LIVE1 | Event Calendar & Scheduled Play | Suggested | Upcoming tournaments, Cups, promotions and reminders in one calendar with timezone support. | Roadmap item |
| Suggested — LiveOps & Social | LIVE2 | Match Replay & Shareable Proof | Suggested | Step-by-step replay, share link and redacted proof package for games and tournaments. | Roadmap item |
| Suggested — LiveOps & Social | LIVE3 | Clan Seasons & Cooperative Quests | Suggested | Season divisions, shared clan goals, contribution ledger, rewards and archived standings. | Roadmap item |
| Suggested — Trust & Compliance | TRUST1 | Identity, Age & Jurisdiction Checks | Suggested | Age gate, KYC status, geofencing and jurisdiction-specific feature eligibility. | Roadmap item |
| Suggested — Trust & Compliance | TRUST2 | Privacy & Data Rights Center | Suggested | Consent history, data export, correction and deletion requests with retention status. | Roadmap item |
| Suggested — Trust & Compliance | TRUST3 | Dispute & Support Case Center | Suggested | Open cases from a game or transaction, attach proof, track SLA and record resolution. | Roadmap item |
| Suggested — Trust & Compliance | TRUST4 | Device & Session Management | Suggested | View active devices, revoke sessions, detect unusual login locations and require step-up verification. | Roadmap item |
| Suggested — Operations | OPS5 | Status & Incident Center | Suggested | Service health, incident timeline, maintenance updates, postmortems and player-facing status notices. | Roadmap item |

## 17. Accounting model
| Flow | Accounting |
|---|---|
| Coin/Catalog | Fee removed from pot; jackpot contribution separated; house fee/net and sinks updated |
| Cup/Tournament | Configured rake recognized; prizes paid from entrant pool |
| Direct Arcade | MAIN spend enters shop/sink family; coin payout is tap/promotion cost |
| Raffle | Ticket value stays in pool; only 20% draw share is house revenue |
| Shop/Crafting/Tickets/Room upgrades | MAIN spend and shop/sink accounting; ownership/utility retained |
| Clan Treasury | MAIN removed to non-withdrawable social resource; sink only, no house revenue |
| Trading Post | Buyer pays; seller receives 90%; house 10% |
| Bot top-ups | Demo liquidity tap, varied values, promotion cost for first bonus; never deposit revenue |
| Rewards | BONUS/tap and promotion cost where house-funded |
| Admin comps | Cannot exceed available net revenue |

## 18. Responsible Gaming
| Control | Behavior |
|---|---|
| Loss limit | Blocks new wagering once session net reaches negative limit |
| Deposit limits | Daily/weekly/monthly; top-up enforcement; decreases immediate, increases/removal delayed in demo |
| Session limit | Maximum minutes triggers cool-off and blocks games |
| Self-exclusion | Timed/permanent persisted lock; no early Player/Admin undo |
| Reality check | Configurable reminders, session P/L points/graph and up/down callout |
| Bank | Park MAIN outside wagering balance |
| Auto Bet stop | Default −200, configurable −50 to −10,000 |

## 19. Production boundary and deferred roadmap
The demo is not approved for public networked, real-money or regulated use. Production requires server-authoritative ledger/RG/settlement, authenticated accounts/Admin RBAC/MFA, independent RNG commitment service, safe output rendering/CSP, durable database, certified mathematics, KYC/AML/geofencing, bot/human analytics separation, observability and independent audits.

| Code | Suggested production feature |
|---|---|
| LIVE1 | Event Calendar & Scheduled Play — Upcoming tournaments, Cups, promotions and reminders in one calendar with timezone support. |
| LIVE2 | Match Replay & Shareable Proof — Step-by-step replay, share link and redacted proof package for games and tournaments. |
| LIVE3 | Clan Seasons & Cooperative Quests — Season divisions, shared clan goals, contribution ledger, rewards and archived standings. |
| TRUST1 | Identity, Age & Jurisdiction Checks — Age gate, KYC status, geofencing and jurisdiction-specific feature eligibility. |
| TRUST2 | Privacy & Data Rights Center — Consent history, data export, correction and deletion requests with retention status. |
| TRUST3 | Dispute & Support Case Center — Open cases from a game or transaction, attach proof, track SLA and record resolution. |
| TRUST4 | Device & Session Management — View active devices, revoke sessions, detect unusual login locations and require step-up verification. |
| OPS5 | Status & Incident Center — Service health, incident timeline, maintenance updates, postmortems and player-facing status notices. |

## 20. Validation baseline
Release validation must include Player/Admin syntax and boot, exact registry counts, deterministic game-rule checks, wallet/ledger conservation, bot balance invariants, Feature Directory total/unique/status checks, IDs, tab/panel mapping, CSS balance, DOCX ZIP/open, support-file parsing and live HTTP exact-content checks. The authoritative runtime sources are `index.html` and `admin.html`; this complete specification and DOCX Appendices V–Z consolidate their current v10.8 rules. Appendix V is the v10.4 baseline, W records v10.5 analytics, X records v10.6 live sync, Y records v10.7 first-top-up eligibility, and Appendix Z controls the v10.8 bot wallet initialization. Earlier appendices do not override Appendix Z.

**End of complete specification.**
