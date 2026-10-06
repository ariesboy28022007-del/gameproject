import {randomBytes} from 'node:crypto';
import {Arena,STEP} from './arena.js';
export class Rooms{
 constructor(){this.rooms=new Map();this.sessions=new Map();}
 join({name,code,create},now=Date.now()){
  if(this.sessions.size>=200)throw Error('Сервер заполнен');
  let room;if(create){if(this.rooms.size>=20)throw Error('Слишком много комнат');let key;do{key=randomBytes(3).toString('hex').toUpperCase();}while(this.rooms.has(key));room={code:key,members:[],game:null,countdown:null};this.rooms.set(key,room);}else{room=this.rooms.get(String(code||'').trim().toUpperCase());if(!room)throw Error('Комната не найдена');}
  if(room.members.length>=10)throw Error('В комнате уже 10 участников');
  const id=randomBytes(8).toString('hex'),token=randomBytes(24).toString('hex');const member={id,name:String(name||'Странник').trim().slice(0,20)||'Странник',ready:false,seen:now,token};
  room.members.push(member);this.sessions.set(token,{room,member});this.resetReady(room);return {id,token,code:room.code};
 }
 resetReady(room){room.countdown=null;for(const p of room.members)p.ready=false;}
 get(token){const s=this.sessions.get(token);if(!s)throw Error('Подключение истекло. Войди в комнату снова.');s.member.seen=Date.now();return s;}
 action(token,data){const {room,member}=this.get(token);
  if(data.type==='leave'){this.leave(token);return;}
  if(data.type==='ready'&&room.game?.phase!=='running'){member.ready=data.ready===true;if(room.members.length>=2&&room.members.every(p=>p.ready))room.countdown??=3;else room.countdown=null;}
  if(data.type==='input'&&room.game?.phase==='running')room.game.input(member.id,data.input||{});
 }
 leave(token){const s=this.sessions.get(token);if(!s)return;const {room,member}=s;room.game?.disconnect(member.id);room.members=room.members.filter(p=>p.id!==member.id);this.sessions.delete(token);this.resetReady(room);if(!room.members.length)this.rooms.delete(room.code);}
 tick(now=Date.now()){
  for(const [token,{member}] of this.sessions)if(now-member.seen>15000)this.leave(token);
  for(const room of this.rooms.values()){
   if(room.countdown!==null){room.countdown-=STEP;if(room.countdown<=0){room.game=new Arena(room.members);this.resetReady(room);}}
   room.game?.step(STEP);
  }
 }
 snapshot(room){return {code:room.code,countdown:room.countdown,members:room.members.map(({id,name,ready})=>({id,name,ready})),game:room.game?.snapshot()??null};}
}
