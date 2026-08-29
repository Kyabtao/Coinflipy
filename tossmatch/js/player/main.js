// TossMatch player entry.
import "../shared/runtime.js";
import {bind as bind__top} from "./core.js";
import {bind as bind_data} from "./data.js";
import {bind as bind_bots} from "./bots.js";
import {bind as bind_crypto} from "./crypto.js";
import {bind as bind_state} from "./state.js";
import {bind as bind_helpers} from "./helpers.js";
import {bind as bind_render} from "./render.js";
import {bind as bind_theme} from "./theme.js";
import {bind as bind_games} from "./games.js";
import {bind as bind_wallet} from "./wallet.js";
import {bind as bind_misc} from "./misc.js";
import {bind as bind_sync} from "./sync.js";
import {bind as bind_boot} from "./boot.js";

bind__top();
bind_data();
bind_bots();
bind_crypto();
bind_state();
bind_helpers();
bind_render();
bind_theme();
bind_games();
bind_wallet();
bind_misc();
bind_sync();
bind_boot();
