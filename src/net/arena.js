// Authoritative, dependency-free simulation; browser receives snapshots only.
export const WIDTH=2400, FLOOR=3900, TOP=360, STEP=1/60;
export function createPlatforms(){
 const out=[{id:0,x:0,y:FLOOR,w:WIDTH,h:80}];
 for(let row=1;row<=27;row++)for(let col=0;col<6;col++){
  const x=col*400+(row%2?55:5);
  out.push({id:out.length,x,y:FLOOR-row*125,w:340,h:28});
 }
 for(let col=0;col<6;col++)out.push({id:out.length,x:col*400+5,y:485,w:340,h:28});
 // Last terrace leads onto a continuous summit made from independent blocks.
 for(let i=0;i<20;i++)out.push({id:out.length,x:i*120,y:TOP,w:120,h:55,top:true,crack:0,gone:false});
 return out;
}
const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export class Arena{
 constructor(members,random=Math.random){
  this.random=random;this.time=0;this.phase='running';this.winner=null;this.lava=FLOOR+180;this.collapse=0;this.nextChest=17;this.serial=0;
  this.platforms=createPlatforms();this.chests=[];this.arrows=[];this.players=members.map((m,i)=>({id:m.id,name:m.name,color:i,x:100+i*(WIDTH-230)/Math.max(1,members.length-1),y:FLOOR-48,w:28,h:48,vx:0,vy:0,hp:100,alive:true,ground:true,face:1,weapon:1,sword:false,bow:false,ammo:0,cooldown:0,immune:0,charge:0,input:{},previous:{},lastInput:0}));
  // First loot is two jumps above spawn, spread across all six routes.
  for(const p of this.platforms.filter(p=>p.y===FLOOR-250))this.addChest(p,random()<.5?'sword':'bow');
  for(let row=5;row<=26;row+=3){const candidates=this.platforms.filter(p=>p.y===FLOOR-row*125);for(let j=0;j<3;j++){const p=candidates.splice(Math.floor(random()*candidates.length),1)[0];this.addChest(p);}}
 }
 addChest(p,loot){this.chests.push({id:++this.serial,x:p.x+p.w/2-16,y:p.y-28,w:32,h:28,platform:p.id,loot:loot||['sword','bow','heal'][Math.floor(this.random()*3)]});}
 input(id,data){const p=this.players.find(p=>p.id===id);if(!p||!p.alive)return;const num=v=>typeof v==='number'&&Number.isFinite(v);p.input={left:data.left===true,right:data.right===true,jump:data.jump===true,crouch:data.crouch===true,use:data.use===true,attack:data.attack===true,slot:[1,2,3].includes(data.slot)?data.slot:0,aim:num(data.aim)?clamp(data.aim,-Math.PI,Math.PI):null};p.lastInput=this.time;}
 disconnect(id){const p=this.players.find(p=>p.id===id);if(p){p.hp=0;p.alive=false;}}
 hit(p,damage,vx,vy){if(!p.alive||p.immune>0)return;p.hp-=damage;p.vx+=vx;p.vy=Math.min(p.vy,vy);p.ground=false;p.immune=.38;}
 step(dt=STEP){if(this.phase!=='running')return;this.time+=dt;
  // 12 seconds to find footing, then an accelerating ascent of about three minutes.
  if(this.time>12)this.lava=Math.max(TOP+65,this.lava-(13+Math.min(15,(this.time-12)*.08))*dt);
  if(this.lava<=TOP+65){this.collapse-=dt;if(this.collapse<=0){const available=this.platforms.filter(p=>p.top&&!p.gone&&!p.crack);if(available.length)available[Math.floor(this.random()*available.length)].crack=1.15;this.collapse=1.5;}}
  for(const b of this.platforms)if(b.crack>0){b.crack-=dt;if(b.crack<=0){b.gone=true;b.drop=0;b.dropV=0;}}
  for(const b of this.platforms)if(b.gone&&b.drop<200){b.dropV+=1000*dt;b.drop+=b.dropV*dt;}
  this.chests=this.chests.filter(c=>c.y+c.h<this.lava&&!this.platforms[c.platform].gone);
  if(this.time>=this.nextChest){this.nextChest=this.time+14;const candidates=this.platforms.filter(p=>!p.gone&&!p.crack&&p.y<this.lava-100&&p.y>this.lava-800&&!this.chests.some(c=>c.platform===p.id));if(candidates.length)this.addChest(candidates[Math.floor(this.random()*candidates.length)]);}
  const attacks=[];
  for(const p of this.players){if(!p.alive)continue;const k=this.time-p.lastInput>1?{}:p.input,prev=p.previous;
   p.cooldown=Math.max(0,p.cooldown-dt);p.immune=Math.max(0,p.immune-dt);
   if(k.slot&&(k.slot===1||k.slot===2&&p.sword||k.slot===3&&p.bow)){if(p.weapon!==k.slot)p.charge=0;p.weapon=k.slot;}
   const oldBottom=p.y+p.h;p.h=k.crouch?28:48;p.y=oldBottom-p.h;
   const dir=Number(!!k.right)-Number(!!k.left);if(dir)p.face=dir;
   p.vx+=(dir*(k.crouch?145:285)-p.vx)*Math.min(1,dt*(p.ground?12:3));
   if(k.jump&&!prev.jump&&p.ground){p.vy=-650;p.ground=false;}
   p.vy+=1550*dt;p.x=clamp(p.x+p.vx*dt,0,WIDTH-p.w);p.y+=p.vy*dt;p.ground=false;
   for(const b of this.platforms)if(!b.gone&&p.vy>=0&&oldBottom<=b.y+2&&p.y+p.h>=b.y&&p.x+p.w>b.x&&p.x<b.x+b.w){p.y=b.y-p.h;p.vy=0;p.ground=true;break;}
   if(k.use&&!prev.use){const c=this.chests.find(c=>Math.abs(c.x+16-p.x-14)<70&&Math.abs(c.y-p.y)<65);if(c){if(c.loot==='sword')p.sword=true;if(c.loot==='bow'){p.bow=true;p.ammo+=8;}if(c.loot==='heal')p.hp=Math.min(100,p.hp+35);this.chests.splice(this.chests.indexOf(c),1);}}
   if(p.weapon===3){if(k.attack&&p.ammo>0)p.charge=Math.min(1.2,p.charge+dt);if(!k.attack&&prev.attack&&p.charge>0&&p.cooldown===0&&p.ammo>0){const power=p.charge/1.2,angle=k.aim??(p.face===1?0:Math.PI);this.arrows.push({id:++this.serial,owner:p.id,x:p.x+14,y:p.y+p.h*.4,vx:Math.cos(angle)*(450+550*power),vy:Math.sin(angle)*(450+550*power),life:3,damage:12+14*power});p.ammo--;p.cooldown=.35;p.charge=0;}if(!k.attack)p.charge=0;
   }else{p.charge=0;if(k.attack&&!prev.attack&&p.cooldown===0){p.cooldown=p.weapon===2?.48:.38;attacks.push({owner:p.id,x:p.face===1?p.x+p.w:p.x-(p.weapon===2?68:44),y:p.y,w:p.weapon===2?68:44,h:p.h,damage:p.weapon===2?24:10,force:p.face*(p.weapon===2?470:340)});}}
   p.previous={...k};
  }
  // Resolve all attacks before deciding who survived this tick.
  for(const a of attacks)for(const p of this.players)if(p.id!==a.owner&&overlap(a,p))this.hit(p,a.damage,a.force,-270);
  for(const a of this.arrows){const oldX=a.x,oldY=a.y;a.vy+=310*dt;a.x+=a.vx*dt;a.y+=a.vy*dt;a.life-=dt;const swept={x:Math.min(oldX,a.x)-4,y:Math.min(oldY,a.y)-4,w:Math.abs(a.x-oldX)+8,h:Math.abs(a.y-oldY)+8};for(const p of this.players)if(p.alive&&p.id!==a.owner&&overlap(swept,p)){this.hit(p,a.damage,Math.sign(a.vx)*360,-180);a.life=0;break;}if(this.platforms.some(b=>!b.gone&&overlap(swept,b)))a.life=0;}
  this.arrows=this.arrows.filter(a=>a.life>0);
  for(const p of this.players)if(p.alive&&(p.hp<=0||p.y+p.h>=this.lava||p.y>FLOOR+300)){
   p.alive=false;p.hp=0;p.charge=0;const ground=this.platforms.find(b=>!b.gone&&Math.abs(b.y-p.y-p.h)<5&&p.x+p.w>b.x&&p.x<b.x+b.w&&b.y<this.lava);
   if(ground){if(p.sword)this.addChest(ground,'sword');if(p.bow)this.addChest(ground,'bow');}
  }
  const alive=this.players.filter(p=>p.alive);if(alive.length<=1){this.phase='finished';this.winner=alive[0]?.id??null;}
 }
 snapshot(){return {time:this.time,phase:this.phase,winner:this.winner,lava:this.lava,platforms:this.platforms,chests:this.chests,arrows:this.arrows,players:this.players.map(({input,previous,lastInput,...p})=>p)};}
}
