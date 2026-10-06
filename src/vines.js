// Pendulum swing and fixed tower vines; independent of drawing and DOM input.
export function throwVine(game,aim){const p=game.player;if(!p.vine||p.rope||p.climbing)return false;
 const cx=p.x+p.w/2,cy=p.y+p.h/2;
 const candidates=game.level.anchors.filter(a=>Math.hypot(a.x-cx,a.y-cy)<950);
 const anchor=candidates.find(a=>{if(!aim)return Math.sign(a.x-cx)===p.dir;const ux=aim.x-cx,uy=aim.y-cy,ax=a.x-cx,ay=a.y-cy;return (ux*ax+uy*ay)/(Math.hypot(ux,uy)*Math.hypot(ax,ay)||1)>.96;});
 if(!anchor){game.event('chest','Наведи курсор на кольцо над обрывом.');return false;}
 p.rope={waiting:p.ground,anchor,length:Math.hypot(cx-anchor.x,cy-anchor.y),angle:Math.atan2(cx-anchor.x,cy-anchor.y),omega:p.vx/450};game.event('chest','Лиана зацепилась! Раскачивайся влево и вправо.');return true;}
export function vineMovement(game,dt,input,jump){const p=game.player,l=game.level;
 const hanging=l.towerVines.find(v=>Math.abs(p.x+p.w/2-v.x)<30&&p.y+p.h>v.top&&p.y<v.bottom);
 if(hanging&&(p.rope||(p.towerAccess&&input.jump))&&!p.climbing){p.climbing=hanging;p.towerAccess=true;p.rope=null;p.vx=p.vy=p.kb=0;}
 if(p.climbing){const v=p.climbing;p.x=v.x-p.w/2;p.y+=((input.crouch?1:0)-(input.jump?1:0))*170*dt;p.ground=false;p.vx=p.vy=p.kb=0;p.inv=Math.max(0,p.inv-dt);p.cooldown=Math.max(0,p.cooldown-dt);
 if(p.y+p.h<=v.top){p.x=v.exitX;p.y=v.top-p.h;p.climbing=null;p.ground=true;}else if(p.y>v.bottom){p.climbing=null;}return true;}
 if(!p.rope)return false;
 const r=p.rope;if(r.waiting){if(p.ground)return false;r.waiting=false;r.length=Math.hypot(p.x+p.w/2-r.anchor.x,p.y+p.h/2-r.anchor.y);r.angle=Math.atan2(p.x+p.w/2-r.anchor.x,p.y+p.h/2-r.anchor.y);r.omega=p.vx/r.length;}
 if(jump){p.vx=r.omega*r.length*Math.cos(r.angle);p.vy=-r.omega*r.length*Math.sin(r.angle)-220;p.kb=p.vx*.35;p.rope=null;return false;}
 const pump=(input.right?1:0)-(input.left?1:0);r.omega+=(-1500/r.length*Math.sin(r.angle)+pump*1.7)*dt;r.omega*=Math.exp(-.12*dt);r.omega=Math.max(-2.5,Math.min(2.5,r.omega));r.angle+=r.omega*dt;
 const nx=r.anchor.x+Math.sin(r.angle)*r.length-p.w/2,ny=r.anchor.y+Math.cos(r.angle)*r.length-p.h/2;
 if(l.platforms.some(q=>!q.disabled&&nx<q.x+q.w&&nx+p.w>q.x&&ny<q.y+q.h&&ny+p.h>q.y)){r.omega*=-.3;return true;}
 p.x=nx;p.y=ny;p.vx=r.omega*r.length*Math.cos(r.angle);p.vy=-r.omega*r.length*Math.sin(r.angle);p.ground=false;p.inv=Math.max(0,p.inv-dt);p.cooldown=Math.max(0,p.cooldown-dt);if(pump)p.dir=pump;return true;}
