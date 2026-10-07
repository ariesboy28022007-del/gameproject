import test from 'node:test';
import assert from 'node:assert/strict';
import {Arena,createPlatforms,movePlayer,STEP,TOP,FLOOR} from '../src/net/arena.js';
import {Rooms} from '../src/net/rooms.js';
import {createServer} from '../server.mjs';
const members=Array.from({length:10},(_,i)=>({id:'p'+i,name:'Player '+i}));
const game=()=>new Arena(members.slice(0,2),()=>.3);
function run(g,n=1){for(let i=0;i<n;i++)g.step();}
test('arena fits ten starts with fists and first loot above spawn',()=>{const g=new Arena(members);assert.equal(g.players.length,10);assert.ok(g.players.every(p=>p.weapon===1&&!p.sword&&!p.bow));assert.equal(g.chests.length,0);run(g,181);const first=g.chests.filter(c=>c.y>FLOOR-400);assert.equal(first.length,6);assert.ok(first.every(c=>g.platforms[c.platform].row===2&&c.loot!=='heal'));});
test('parkour has small staggered stones, two choke points and a broken summit',()=>{
 const ps=createPlatforms();assert.ok(ps.filter(p=>p.id).every(p=>p.w<=120));
 assert.ok(new Set(ps.filter(p=>p.row===1).map(p=>p.y)).size>1);
 for(const row of [12,22])assert.equal(ps.filter(p=>p.row===row).length,1);
 const top=ps.filter(p=>p.top);for(let i=1;i<top.length;i++)assert.ok(top[i].x-top[i-1].x-top[i-1].w>=80);
 assert.ok(ps.filter(p=>!p.top).every(p=>p.y>TOP+65));
});
test('server ignores health/position input and restricts unavailable weapon',()=>{const g=game();g.input('p0',{hp:999,x:9000,slot:3,aim:Infinity});run(g);assert.equal(g.players[0].hp,100);assert.equal(g.players[0].weapon,1);assert.ok(g.players[0].x<200);assert.equal(g.players[0].input.aim,null);});
test('lava waits, rises, then stops and destroys summit blocks',()=>{const g=game();g.players.forEach(p=>{p.y=TOP-48;p.x=680;});run(g,600);assert.equal(g.lava,FLOOR+180);g.time=200;g.lava=TOP+65.1;run(g,4);assert.equal(g.lava,TOP+65);assert.ok(g.platforms.some(b=>b.crack>0));run(g,75);assert.ok(g.platforms.some(b=>b.top&&b.gone));});
test('simultaneous deaths draw; sole survivor wins below summit',()=>{let g=game();g.players.forEach(p=>p.hp=0);run(g);assert.equal(g.phase,'finished');assert.equal(g.winner,null);g=game();g.players[1].hp=0;run(g);assert.equal(g.winner,'p0');assert.equal(g.players[0].y,FLOOR-48);});
test('simultaneous lethal melee resolves both attacks before outcome',()=>{const g=game();Object.assign(g.players[0],{x:100,hp:10,face:1});Object.assign(g.players[1],{x:135,hp:10,face:-1});g.input('p0',{attack:true});g.input('p1',{attack:true});run(g);assert.equal(g.phase,'finished');assert.equal(g.winner,null);});
test('hold bow charges, release fires and spends limited ammunition',()=>{const g=game();Object.assign(g.players[0],{bow:true,weapon:3,ammo:2});g.input('p0',{attack:true,aim:-.5});run(g,40);assert.equal(g.arrows.length,0);assert.ok(g.players[0].charge>.6);g.input('p0',{attack:false,aim:-.5});run(g);assert.equal(g.arrows.length,1);assert.equal(g.players[0].ammo,1);assert.ok(g.arrows[0].vy<0);assert.equal(g.players[0].charge,0);});
test('chest interaction grants weapon, consumes chest, dead input cannot revive',()=>{const g=game();run(g,181);const c=g.chests[0];g.players[0].x=c.x;g.players[0].y=c.y-20;g.input('p0',{use:true});run(g);assert.ok(g.players[0].sword);assert.ok(!g.chests.includes(c));g.players[0].alive=false;g.input('p0',{hp:100});assert.equal(g.players[0].alive,false);});
test('short invulnerability prevents repeated stun hits',()=>{const g=game(),p=g.players[0];g.hit(p,10,100,-100);g.hit(p,10,100,-100);assert.equal(p.hp,90);assert.equal(p.vx,100);});
test('rooms need every player ready; joining resets ready; max ten',()=>{const r=new Rooms(),a=r.join({create:true,name:'A'});r.action(a.token,{type:'ready',ready:true});r.tick();assert.equal(r.sessions.get(a.token).room.countdown,null);const b=r.join({code:a.code,name:'B'});assert.equal(r.sessions.get(a.token).member.ready,false);r.action(a.token,{type:'ready',ready:true});r.action(b.token,{type:'ready',ready:true});for(let i=0;i<182;i++)r.tick();const room=r.sessions.get(a.token).room;assert.equal(room.game.phase,'running');const c=r.join({code:a.code,name:'C'});assert.ok(!room.game.players.some(p=>p.id===c.id));for(let i=0;i<7;i++)r.join({code:a.code});assert.throws(()=>r.join({code:a.code}),/10/);r.leave(a.token);r.tick();assert.equal(room.game.winner,b.id);});
test('replay includes spectators and disconnected sessions expire',()=>{const r=new Rooms(),a=r.join({create:true}),b=r.join({code:a.code});const room=r.sessions.get(a.token).room;room.game=new Arena(room.members);const c=r.join({code:a.code});room.game.players[0].hp=0;r.tick();for(const s of [a,b,c])r.action(s.token,{type:'ready',ready:true});for(let i=0;i<182;i++)r.tick();assert.equal(room.game.players.length,3);assert.ok(room.game.players.every(p=>p.alive&&p.hp===100&&!p.sword));r.tick(Date.now()+16000);assert.equal(r.sessions.size,0);assert.equal(r.rooms.size,0);});
test('HTTP clients join one server, share SSE snapshot, move with validated input',async()=>{const {server,rooms}=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`,abort=new AbortController();try{const request=async(path,body,token)=>(await fetch(base+'/api/'+path,{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(body)})).json();const a=await request('join',{create:true,name:'A'}),b=await request('join',{code:a.code,name:'B'});assert.equal(a.code,b.code);const response=await fetch(base+'/api/events?token='+a.token,{signal:abort.signal});assert.match(response.headers.get('content-type'),/event-stream/);const data=new TextDecoder().decode((await response.body.getReader().read()).value);assert.ok(data.includes('"name":"B"'));await request('action',{type:'ready',ready:true},a.token);await request('action',{type:'ready',ready:true},b.token);for(let i=0;i<182;i++)rooms.tick();await request('action',{type:'input',input:{right:true}},a.token);rooms.tick();assert.ok(rooms.sessions.get(a.token).room.game.players[0].vx>0);const html=await fetch(base+'/online.html');assert.equal(html.status,200);assert.equal((await fetch(base+'/package.json')).status,404);const forbidden=await fetch(base+'/api/join',{method:'POST',headers:{Origin:'https://other.example'},body:'{}'});assert.equal(forbidden.status,403);}finally{abort.abort();server.closeAllConnections();await new Promise(r=>server.close(r));}});
test('server arrow damages opponent and is consumed',()=>{const g=game();Object.assign(g.players[0],{x:100,bow:true,weapon:3,ammo:2});g.players[1].x=330;g.input('p0',{attack:true,aim:0});run(g,40);g.input('p0',{attack:false,aim:0});run(g,25);assert.ok(g.players[1].hp<100);assert.equal(g.arrows.length,0);});

function jump(a,b,platforms){
 const dir=Math.sign(b.x+b.w/2-a.x-a.w/2)||1;
 for(const fraction of (a.id===0?[Math.max(0,Math.min(1,(b.x-100)/(a.w-28))),Math.max(0,Math.min(1,(b.x+b.w+60)/(a.w-28)))]:[0,.25,.5,.75,1]))for(const initial of [0,dir*285])for(const delay of [0,6,12,18]){
  const p={x:a.x+(a.w-28)*fraction,y:a.y-48,w:28,h:48,vx:initial,vy:-650,ground:false};
  for(let frame=0;frame<65;frame++){
   const delta=b.x+b.w/2-p.x-14;
   const control=frame<delay?0:Math.abs(delta)<10?0:Math.sign(delta);
   p.vx+=(control*285-p.vx)*STEP*3;p.vy+=1550*STEP;movePlayer(p,platforms,STEP);
   if(p.ground){if(Math.abs(p.y+48-b.y)<.01&&p.x+28>b.x&&p.x<b.x+b.w)return true;break;}
   if(p.y>a.y+80)break;
  }
 }
 return false;
}

test('every island and summit is reachable with solid collisions and steering',()=>{
 const platforms=createPlatforms(),edges=new Map();
 for(const a of platforms){edges.set(a.id,[]);for(const b of platforms){const dy=a.y-b.y;
  if(dy<0||dy>131||a===b||a.x+a.w+240<b.x||b.x+b.w+240<a.x)continue;
  if(jump(a,b,platforms))edges.get(a.id).push(b.id);
 }}
 const reachable=(blocked)=>{const seen=new Set([0]);for(let old=-1;old!==seen.size;){old=seen.size;for(const id of seen)for(const next of edges.get(id))if(next!==blocked)seen.add(next);}return seen;};
 assert.equal(reachable().size,platforms.length);
 for(const choke of platforms.filter(p=>p.choke))assert.ok(!platforms.some(p=>p.top&&reachable(choke.id).has(p.id)),'cannot bypass the shared island');
});
test('ceiling stops upward motion, side faces block movement, removed stones do not',()=>{
 const ceiling={x:100,y:100,w:100,h:22};
 const p={x:130,y:130,w:28,h:48,vx:0,vy:-650};movePlayer(p,[ceiling],.1);assert.equal(p.y,122);assert.equal(p.vy,0);assert.equal(p.ground,false);
 Object.assign(p,{x:50,y:105,vx:900,vy:0});movePlayer(p,[ceiling],.1);assert.equal(p.x,72);assert.equal(p.vx,0);
 Object.assign(p,{x:130,y:130,vx:0,vy:-650});movePlayer(p,[{...ceiling,gone:true}],.1);assert.equal(p.y,65);
});
test('crouching player cannot stand up inside a solid ceiling',()=>{
 const g=game(),p=g.players[0];g.platforms=[{id:0,x:0,y:3900,w:2400,h:80},{id:1,x:50,y:3840,w:150,h:25}];g.chests=[];
 Object.assign(p,{x:100,y:3872,h:28});g.input(p.id,{});run(g);assert.equal(p.h,28);assert.equal(p.y+p.h,3900);
 p.x=250;run(g);assert.equal(p.h,48);
});
test('two fist hits can knock a stationary opponent off a small island',()=>{
 const g=game(),p=g.players[0];g.platforms=[{id:0,x:800,y:2000,w:120,h:22}];g.chests=[];
 Object.assign(p,{x:846,y:1952});g.hit(p,10,340,-270);run(g,24);g.hit(p,10,340,-270);run(g,30);
 assert.ok(p.x>920||p.y+p.h>2000);assert.ok(p.hp>0);
});

test('loot spawns during play near survivors, expires, and never uses flooded or broken platforms',()=>{
 const g=game();assert.equal(g.chests.length,0);run(g,179);assert.equal(g.chests.length,0);run(g,2);assert.ok(g.chests.length>=2);
 const firstIds=g.chests.map(c=>c.id);assert.ok(g.chests.every(c=>c.born>=3&&c.expires-c.born===22));
 g.players.forEach(p=>Object.assign(p,{x:680,y:TOP-48}));g.time=30;g.nextChest=30;g.lava=TOP+65;run(g);
 assert.ok(g.chests.every(c=>!firstIds.includes(c.id)));
 assert.ok(g.chests.length>0);assert.ok(g.chests.every(c=>g.platforms[c.platform].top&&!g.platforms[c.platform].crack&&c.y+c.h<g.lava));
 assert.ok(g.nextChest>=g.time+5&&g.nextChest<=g.time+8);
 const c=g.chests[0];g.platforms[c.platform].gone=true;g.nextChest=100;run(g);assert.ok(!g.chests.includes(c));
});
