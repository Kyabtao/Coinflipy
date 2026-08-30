// FlipArena admin entry.
import "../shared/runtime.js";
import {bind as bind__top} from "./core.js";
import {bind as bind_render} from "./render.js";
import {bind as bind_theme} from "./theme.js";
import {bind as bind_plus} from "./plus.js";
import {bind as bind_engine} from "./engine.js";
import {bind as bind_banking} from "./banking.js";
import {bind as bind_sync} from "./sync.js";
import {bind as bind_boot} from "./boot.js";

bind__top();
bind_render();
bind_theme();
bind_plus();
bind_engine();
bind_banking();
bind_sync();
bind_boot();
