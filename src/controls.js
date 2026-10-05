export const BINDINGS={jump:['KeyW','ArrowUp'],left:['KeyA','ArrowLeft'],crouch:['KeyS','ArrowDown'],right:['KeyD','ArrowRight'],use:['KeyE','KeyH']};
export const LABELS={KeyE:'E',KeyH:'H',KeyW:'W',KeyA:'A',KeyS:'S',KeyD:'D',ArrowUp:'↑',ArrowLeft:'←',ArrowDown:'↓',ArrowRight:'→'};
export function normalizeBindings(saved={}){return Object.fromEntries(Object.entries(BINDINGS).map(([action,options])=>[action,options.includes(saved?.[action])?saved[action]:options[0]]));}
export function toggleBinding(bindings,action){const options=BINDINGS[action];return {...bindings,[action]:options[1-options.indexOf(bindings[action])]};}
export function movementInput(keys,bindings){return Object.fromEntries(Object.keys(BINDINGS).map(action=>[action,!!keys[bindings[action]]]));}
