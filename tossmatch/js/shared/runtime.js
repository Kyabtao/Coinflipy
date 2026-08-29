// TossMatch shared runtime state.
// Cross-module mutable bindings that used to be top-level `let` are held on
// globalThis so every ES module sees the same live binding (assignments in one
// module are visible to the others, exactly like the original single-script app).
globalThis.S=null;
globalThis.activeGame="overunder";
globalThis.applyingRemoteState=false;
globalThis.audioCtx=null;
globalThis.betTimes=[];
globalThis.busy=false;
globalThis.cupFmt="bo3";
globalThis.featureHubsMounted=false;
globalThis.gamesMounted=false;
globalThis.isPrivate=false;
globalThis.lastAdminPulse=0;
globalThis.lastBotTickAt=0;
globalThis.lastProof=null;
globalThis.lastStorageSyncAt=0;
globalThis.lbSort="net";
globalThis.pickedSide=null;
globalThis.pwaInstallPrompt=null;
globalThis.servicesMounted=false;
globalThis.sessionNet=0;
globalThis.shopCat="skins";
globalThis.tickRunning=false;
