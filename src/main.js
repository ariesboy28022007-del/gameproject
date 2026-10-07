import {GameAudio} from './audio.js?v=0.10.0';
import {normalizeBindings,toggleBinding,movementInput,LABELS} from './controls.js?v=0.6.0';
import {Game,THEMES,WORLD} from './engine.js?v=0.10.0';
import {Renderer} from './render.js?v=0.10.0';
const $=id=>document.getElementById(id),canvas=$('scene'),renderer=new Renderer(canvas);
let pointer=null;
let selected=0,state='menu',game,keys={},accumulator=0,last=0,toastUntil=0;
let settings={volume:35,musicVolume:18,shake:true,particles:true,travel:false};try{settings={...settings,...JSON.parse(localStorage.getItem('koth-settings')||'{}')};}catch{}
// Reset the old default once, while preserving later explicit choices.
if(settings.travelDefaultRevision!==6){settings.travel=false;settings.travelDefaultRevision=6;try{localStorage.setItem('koth-settings',JSON.stringify(settings));}catch{}}
const audio=new GameAudio(settings);
settings.bindings=normalizeBindings(settings.bindings);
$('music-volume').value=settings.musicVolume;$('volume').value=settings.volume;$('shake').checked=settings.shake;$('particles').checked=settings.particles;$('travel').checked=settings.travel;
function save(){settings={...settings,volume:+$('volume').value,musicVolume:+$('music-volume').value,shake:$('shake').checked,particles:$('particles').checked,travel:$('travel').checked};try{localStorage.setItem('koth-settings',JSON.stringify(settings));}catch{}audio.configure(settings);audio.unlock();}
for(const id of ['music-volume','volume','shake','particles','travel'])$(id).addEventListener('input',save);
function updateHints(){for(const el of document.querySelectorAll('[data-key]'))el.textContent=LABELS[settings.bindings[el.dataset.key]];for(const el of document.querySelectorAll('[data-bind]')){const action=el.dataset.bind;el.textContent=LABELS[settings.bindings[action]]+' ⇄';el.setAttribute('aria-label',`Сменить клавишу: ${LABELS[settings.bindings[action]]}`);}}
for(const el of document.querySelectorAll('[data-bind]'))el.onclick=()=>{settings.bindings=toggleBinding(settings.bindings,el.dataset.bind);keys={};save();updateHints();};
updateHints();
function sound(type){audio.play(type);}
function onEvent(type,text){sound(type);if(text){$('toast').textContent=text;toastUntil=performance.now()+2800;}if(type==='hit')renderer.shake=7;if(type==='lose'){state='lost';audio.setActive(false);keys={};$('lost').showModal();}if(type==='win'){state='won';audio.setActive(false);keys={};$('win-stats').textContent=`Время ${format(game.time)} · Падений: ${game.deaths} · Побеждено соперников: ${game.kills}`;$('win').showModal();}}
game=new Game(selected,onEvent);
function closeDialogs(){document.querySelectorAll('dialog[open]').forEach(d=>d.close());}
function start(){closeDialogs();audio.unlock();audio.setActive(true);game=new Game(selected,onEvent);renderer.camera={x:0,y:2200};state='playing';keys={};accumulator=0;toastUntil=0;document.body.classList.add('playing');$('menu').hidden=true;$('hud').hidden=false;$('location').textContent=THEMES[selected].name.toUpperCase();$('toast').textContent='Путь наверх начинается здесь. Найди первый сундук →';toastUntil=performance.now()+4000;}
function menu(){closeDialogs();state='menu';audio.setActive(false);keys={};game=new Game(selected,onEvent);document.body.classList.remove('playing');$('menu').hidden=false;$('hud').hidden=true;}
function pause(){if(state!=='playing')return;state='paused';audio.setActive(false);keys={};$('pause-dialog').showModal();}
let settingsPausedGame=false;
function openSettings(){
 settingsPausedGame=state==='playing';
 if(settingsPausedGame){state='paused';audio.setActive(false);}
 keys={};$('settings').showModal();
}
$('settings').addEventListener('close',()=>{
 const shouldResume=settingsPausedGame;settingsPausedGame=false;keys={};
 if(shouldResume&&state==='paused'){
  if(document.hidden){$('pause-dialog').showModal();return;}
  state='playing';audio.setActive(true);accumulator=0;
 }
});
function resume(){closeDialogs();keys={};state='playing';audio.setActive(true);accumulator=0;}
$('retry-lost').onclick=start;$('lost-menu').onclick=menu;$('lost').addEventListener('cancel',e=>{e.preventDefault();menu();});$('play').onclick=start;$('again').onclick=start;$('restart').onclick=start;$('resume').onclick=resume;$('pause').onclick=pause;$('back-menu').onclick=menu;$('win-menu').onclick=menu;document.querySelector('.brand').onclick=e=>{e.preventDefault();menu();};$('settings-top').onclick=openSettings;$('settings-game').onclick=openSettings;$('settings-paused').onclick=openSettings;$('controls-open').onclick=()=>$('controls').showModal();
$('pause-dialog').addEventListener('cancel',e=>{e.preventDefault();resume();});$('win').addEventListener('cancel',e=>{e.preventDefault();menu();});
for(const card of document.querySelectorAll('.world'))card.onclick=()=>{const old=selected;selected=+card.dataset.world;if(old!==selected&&settings.travel)renderer.startTransition(old,selected,performance.now()/1000);document.querySelectorAll('.world').forEach(c=>{c.classList.toggle('active',c===card);c.setAttribute('aria-pressed',String(c===card));});game=new Game(selected,onEvent);};
for(let i=1;i<=5;i++)$('slot'+i).onclick=()=>game.selectWeapon(i);
window.addEventListener('keydown',e=>{if(e.code==='Escape'){if(state==='playing'){e.preventDefault();pause();}return;}if(state!=='playing')return;if(['KeyW','KeyA','KeyS','KeyD','KeyE','KeyH','KeyJ','Digit1','Digit2','Digit3','Digit4','Digit5','ArrowLeft','ArrowRight','Space','ArrowUp','ArrowDown'].includes(e.code))e.preventDefault();keys[e.code]=true;});window.addEventListener('keyup',e=>delete keys[e.code]);canvas.addEventListener('pointerdown',e=>{if(e.button===0&&state==='playing')keys.Mouse=true;});window.addEventListener('pointermove',e=>{const r=canvas.getBoundingClientRect();pointer={x:e.clientX-r.left,y:e.clientY-r.top};});window.addEventListener('pointerup',()=>delete keys.Mouse);window.addEventListener('blur',()=>{keys={};pause();});document.addEventListener('visibilitychange',()=>{audio.setVisible(!document.hidden);if(document.hidden)pause();});window.addEventListener('resize',()=>renderer.resize());
function format(t){return `${String(Math.floor(t/60)).padStart(2,'0')}:${String(Math.floor(t%60)).padStart(2,'0')}`;}
function hud(){const p=game.player;$('height-bar').style.width=Math.min(100,Math.max(0,(WORLD.startY-p.y-p.h)/(WORLD.startY-game.level.summit)*100))+'%';$('height').textContent=`${Math.max(0,Math.round((WORLD.startY-p.y-p.h)/10))} м / ${Math.round((WORLD.startY-game.level.summit)/10)} м`;$('timer').textContent=format(game.time);$('deaths').textContent=`ПАДЕНИЯ: ${game.deaths}`;for(const [i,w]of ['fist','sword','bow','pickaxe','vine'].entries())$('slot'+(i+1)).classList.toggle('active',p.weapon===w);$('slot2').querySelector('span').textContent=p.sword?'Меч':'Найди меч';$('slot3').querySelector('span').textContent=p.bow?'Лук':'Найди лук';$('slot4').querySelector('span').textContent=p.pickaxe?'Кирка':'Найди кирку';$('slot5').querySelector('span').textContent=p.vine?'Лиана':'Найди лиану';const arena=game.level.arena;$('lives').hidden=!arena||arena.state==='waiting';$('lives').textContent=arena?`ЖИЗНИ: ${arena.lives} / 3`:'';$('toast').classList.toggle('visible',performance.now()<toastUntil);}
function loop(now){const dt=Math.min((now-last)/1000,.1);last=now;if(state==='playing'){accumulator+=dt;while(accumulator>=1/120){game.step(1/120,{...movementInput(keys,settings.bindings),attack:keys.KeyJ||keys.Mouse,aim:pointer?{x:pointer.x/renderer.scale+renderer.camera.x,y:pointer.y/renderer.scale+renderer.camera.y}:null,slot:keys.Digit1?1:keys.Digit2?2:keys.Digit3?3:keys.Digit4?4:keys.Digit5?5:0});accumulator-=1/120;if(state!=='playing')break;}hud();}renderer.draw(game,now/1000,state==='menu',settings);requestAnimationFrame(loop);}
requestAnimationFrame(loop);
// Explicit test hook, enabled only for local automated verification.
if(new URLSearchParams(location.search).has('test'))window.__game={get game(){return game;},get state(){return state;},start,pause,resume,menu};
