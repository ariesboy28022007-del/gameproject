export const WORLD={width:1500,height:3050,startY:2760,goalY:360};
export const THEMES=[{name:'Изумрудные руины',sky:['#122c3b','#648d88','#e5d9ab'],mountains:['#467579','#30575e','#203e45'],stone:'#334d4e',edge:'#9bbc77',grass:'#a6c782',accent:'#d9ed96',fog:'#98bdac'}, {name:'Ледяной предел',sky:['#152344','#758caa','#ccdce2'],mountains:['#6f8da8','#405f82','#29425e'],stone:'#405d76',edge:'#bbe5ea',grass:'#d7f1ef',accent:'#c7f7fa',fog:'#afc8e1'}, {name:'Пепельная цитадель',sky:['#291d36','#925960','#dfab81'],mountains:['#8c646e','#684a60','#382f43'],stone:'#51404c',edge:'#c77d69',grass:'#da9a73',accent:'#ffd399',fog:'#cb9a92'}];
export const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
export function createLevel(theme=0){
 const platforms=[{x:90,y:2760,w:620,h:62},{x:310,y:2460,w:165,h:270,tunnel:true}];
 const routes=[
 [[750,2640,230],[1050,2520,230],[850,2400,230],[560,2280,230],[270,2160,230],[90,2040,230],[370,1920,230],[660,1800,230],[960,1680,230],[1160,1560,230],[880,1440,230],[590,1320,230],[300,1200,230],[110,1080,230],[380,960,230],[680,840,230],[980,720,230],[1150,600,230],[870,480,230],[580,360,330]],
 [[760,2640,270],[1080,2500,250],[790,2360,210],[480,2240,250],[170,2100,240],[70,1950,230],[360,1820,260],[690,1680,230],[1020,1540,240],[1150,1400,220],[830,1270,250],[520,1130,230],[220,990,250],[70,850,240],[360,720,260],[690,590,240],[990,460,260],[700,320,330]],
 [[740,2650,300],[1050,2540,260],[810,2410,280],[510,2310,290],[180,2190,280],[430,2050,250],[730,1920,290],[1050,1800,280],[800,1660,280],[480,1550,280],[150,1420,270],[400,1280,260],[700,1160,280],[1020,1030,280],[780,890,270],[470,780,290],[150,650,280],[450,520,280],[760,380,350]]
 ];
 routes[theme].forEach(([x,y,w],i)=>platforms.push({x,y,w,h:theme===2?46:32,baseX:x,moving:(theme===0?[7,14]:theme===1?[5,12]:[6,11]).includes(i),ice:theme===1&&i%3!==0}));
 const chest=(index,weapon)=>{const p=platforms[index];return {x:p.x+p.w*.65,y:p.y-24,weapon,open:false};};
 const chests=[{x:555,y:2736,weapon:'sword',open:false},chest(theme===1?4:5,'bow'),chest(12,'heal')];
 const spikes=(theme===0?[7,13,19]:theme===1?[6,10,16]:[4,9,16]).map(i=>({x:platforms[i].x+platforms[i].w-66,y:platforms[i].y-18,w:48,h:18}));
 const saws=theme===0?[{x:800,y:2000,baseX:800,r:20},{x:500,y:1040,baseX:500,r:22}]:theme===2?[{x:950,y:1730,baseX:950,r:25}]:[];
 const winds=theme===1?[{x:250,y:1700,w:850,h:360,force:100},{x:180,y:600,w:900,h:340,force:-110}]:[];
 const flames=theme===2?[5,10,15,18].map((index,j)=>{const p=platforms[index];return {x:p.x+70,y:p.y-90,w:40,h:90,phase:j*.8,active:false,warning:false};}):[];
 const icicles=theme===1?[4,8,13,17].map(index=>{const p=platforms[index];return {x:p.x+100,y:p.y-250,originY:p.y-250,endY:p.y-20,vy:0,cooldown:1,falling:false};}):[];
 const homes=theme===0?[5,10,14,19]:theme===1?[4,9,13,18]:[4,7,10,14,18];
 const bots=homes.map((home,j)=>({...actor(platforms[home].x+100,platforms[home].y-48),id:j+1,home,color:theme===1?'#a8e5ff':theme===2?'#ef9471':['#d9a080','#a8a6d8','#d69491','#c4b77e'][j],brain:j,role:theme===1&&j%2===0?'archer':theme===2?'guard':'fighter',respawn:0}));
 const top=platforms.at(-1);
 return {platforms,chests,spikes,saws,bots,winds,flames,icicles,goal:{x:top.x+top.w/2,y:top.y-70,w:40,h:70},theme,summit:top.y};
}
export function actor(x=175,y=2712){return {x,y,w:26,h:48,vx:0,vy:0,dir:1,hp:100,ground:false,coyote:0,buffer:0,inv:0,cooldown:0,swing:0,walk:0,weapon:'fist',sword:false,bow:false,kb:0};}
export class Game {
 constructor(theme=0,onEvent=()=>{}){this.theme=theme;this.onEvent=onEvent;this.reset();}
 reset(){this.level=createLevel(this.theme);this.player=actor();this.time=0;this.deaths=0;this.kills=0;this.won=false;this.projectiles=[];this.effects=[];this.previousJump=false;this.previousUse=false;this.maxHeight=0;}
 selectWeapon(slot){const p=this.player;const weapon=['fist','sword','bow'][slot-1];if(weapon&&(weapon==='fist'||p[weapon]))p.weapon=weapon;}
 event(type,text){this.onEvent(type,text);}
 respawn(){Object.assign(this.player,actor());this.player.inv=2;this.deaths++;this.projectiles=[];this.level.chests.forEach(c=>c.open=false);this.event('death','Снова в путь. Сундуки обновлены.');}
 damage(a,amount,dir){if(a.inv>0||a.hp<=0)return; a.hp=Math.max(0,a.hp-amount);a.inv=.65;a.kb=dir*390;a.vy=-260;a.ground=false;this.effects.push({x:a.x+13,y:a.y+20,t:.4,color:'#f4d9af'});this.event('hit');if(a!==this.player&&a.hp===0){a.respawn=5;this.kills++;this.event('kill','Соперник сброшен с пути');}}
 attack(a){if(a.cooldown>0||a.hp<=0)return;a.cooldown=a.weapon==='bow'?.62:.38;a.swing=.2;this.event('attack');if(a.weapon==='bow'){this.projectiles.push({x:a.x+13+a.dir*20,y:a.y+16,vx:a.dir*700,vy:-35,owner:a,life:2.2});return;}const reach=a.weapon==='sword'?75:44;const hit={x:a.dir>0?a.x+a.w:a.x-reach,y:a.y-5,w:reach,h:a.h+10};for(const enemy of a===this.player?this.level.bots:[this.player])if(overlap(hit,enemy))this.damage(enemy,a.weapon==='sword'?34:18,a.dir);}
 move(a,dt,input){
 a.inv=Math.max(0,a.inv-dt);a.cooldown=Math.max(0,a.cooldown-dt);a.swing=Math.max(0,a.swing-dt);
 const feet=a.y+a.h;const desired=input.crouch?28:48;
 if(desired<a.h){a.h=desired;a.y=feet-desired;}else if(desired>a.h&&!this.level.platforms.some(p=>overlap({x:a.x,y:feet-desired,w:a.w,h:desired},p))){a.h=desired;a.y=feet-desired;}
 a.coyote=a.ground?.1:Math.max(0,a.coyote-dt);a.buffer=input.jump?.12:Math.max(0,a.buffer-dt);
 if(a.buffer>0&&a.coyote>0){a.vy=-740;a.ground=false;a.coyote=0;a.buffer=0;if(a===this.player)this.event('jump');}
 const speed=a.h===28?132:285;const target=(input.right?1:0)-(input.left?1:0);if(target)a.dir=target;
 a.vx+=(target*speed-a.vx)*Math.min(1,dt*(a.ground?(a.onIce?2.2:16):9));a.kb*=Math.exp(-5*dt);a.walk+=Math.abs(a.vx)*dt*.065;
 a.x+=(a.vx+a.kb)*dt;for(const p of this.level.platforms)if(overlap(a,p)){if(a.vx+a.kb>0)a.x=p.x-a.w;else if(a.vx+a.kb<0)a.x=p.x+p.w;a.vx=0;a.kb=0;}
 a.x=Math.max(0,Math.min(WORLD.width-a.w,a.x));a.vy=Math.min(1050,a.vy+1500*dt);a.y+=a.vy*dt;a.ground=false;a.onIce=false;
 for(const p of this.level.platforms)if(overlap(a,p)){if(a.vy>=0){a.y=p.y-a.h;a.ground=true;a.onIce=!!p.ice;if(p.moving)a.x+=p.dx||0;}else a.y=p.y+p.h;a.vy=0;}
 }
 step(dt,input={}){if(this.won)return;dt=Math.min(dt,1/30);this.time+=dt;const l=this.level,p=this.player;
 for(const plat of l.platforms)if(plat.moving){const old=plat.x;plat.x=plat.baseX+Math.sin(this.time*.7)*36;plat.dx=plat.x-old;}
 const jump=!!input.jump&&!this.previousJump;this.previousJump=!!input.jump;this.move(p,dt,{...input,jump});
 if(input.slot)this.selectWeapon(input.slot);
 if(input.attack)this.attack(p);
 if(input.use&&!this.previousUse){const chest=l.chests.find(c=>!c.open&&Math.hypot(c.x-p.x,c.y-p.y)<85);if(chest){chest.open=true;if(chest.weapon==='heal'){p.hp=100;this.event('chest','Здоровье восстановлено');}else{p[chest.weapon]=true;p.weapon=chest.weapon;this.event('chest',chest.weapon==='sword'?'Меч найден · J / ЛКМ — удар':'Лук найден · J / ЛКМ — выстрел');}}}this.previousUse=!!input.use;
 for(const b of l.bots){if(b.hp<=0){b.respawn-=dt;if(b.respawn<=0){const home=l.platforms[b.home];Object.assign(b,actor(home.x+100,home.y-48),{respawn:0});}continue;}const home=l.platforms[b.home];const near=Math.abs(p.y-b.y)<65&&Math.abs(p.x-b.x)<(b.role==='archer'?440:190);let dir=near?Math.sign(p.x-b.x):b.dir;if(b.x<home.x+12)dir=1;if(b.x>home.x+home.w-40)dir=-1;this.move(b,dt,{left:dir<0&&!(near&&b.role==='archer'),right:dir>0&&!(near&&b.role==='archer')});b.weapon=b.role==='archer'?'bow':b.role==='guard'?'sword':b.brain%2?'sword':'fist';if(near&&Math.abs(p.x-b.x)<(b.role==='archer'?440:72)){b.dir=Math.sign(p.x-b.x)||1;this.attack(b);}if(b.y>WORLD.height){b.hp=0;b.respawn=3;}}
 for(const s of l.spikes)if(overlap(p,s))this.damage(p,25,p.x<s.x?-1:1);
 for(const s of l.saws){s.x=s.baseX+Math.sin(this.time*1.6)*90;if(overlap(p,{x:s.x-s.r,y:s.y-s.r,w:s.r*2,h:s.r*2}))this.damage(p,30,p.x<s.x?-1:1);}
 for(const wind of l.winds)if(overlap(p,wind)&&!p.ground)p.vx+=wind.force*dt;
 for(const f of l.flames){const phase=(this.time+f.phase)%4;f.active=phase>=2;f.warning=phase>=1.2&&phase<2;if(f.active&&overlap(p,f))this.damage(p,28,p.x<f.x?-1:1);}
 for(const ice of l.icicles){ice.cooldown-=dt;if(!ice.falling&&ice.cooldown<=0&&Math.abs(p.x-ice.x)<100&&p.y>ice.originY&&p.y<ice.endY+80)ice.falling=true;if(ice.falling){ice.vy+=1000*dt;ice.y+=ice.vy*dt;if(overlap(p,{x:ice.x-10,y:ice.y,w:20,h:38}))this.damage(p,25,p.x<ice.x?-1:1);if(ice.y>=ice.endY){ice.y=ice.originY;ice.vy=0;ice.falling=false;ice.cooldown=2.5;}}}
 for(const arrow of this.projectiles){arrow.life-=dt;const oldX=arrow.x;arrow.x+=arrow.vx*dt;arrow.y+=arrow.vy*dt;arrow.vy+=180*dt;const box={x:Math.min(oldX,arrow.x),y:arrow.y-3,w:Math.abs(arrow.x-oldX)+12,h:6};if(l.platforms.some(s=>overlap(box,s)))arrow.life=0;if(arrow.life>0)for(const enemy of arrow.owner===p?l.bots:[p])if(enemy.hp>0&&overlap(box,enemy)){this.damage(enemy,27,Math.sign(arrow.vx));arrow.life=0;break;}}
 this.projectiles=this.projectiles.filter(a=>a.life>0);this.effects=this.effects.filter(e=>(e.t-=dt)>0);
 if(p.hp<=0||p.y>WORLD.height||(this.theme===2&&p.y+p.h>=2980))this.respawn();
 this.maxHeight=Math.max(this.maxHeight,Math.max(0,WORLD.startY-(p.y+p.h)));
 if(overlap(p,l.goal)){this.won=true;this.event('win');}
 }
}
