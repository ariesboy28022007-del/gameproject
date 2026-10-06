import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {networkInterfaces} from 'node:os';
import {Rooms} from './src/net/rooms.js';
export function createServer(){
 const root=resolve(import.meta.dirname),rooms=new Rooms(),streams=new Map(),limits=new Map();
 const send=(res,status,value)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(value));};
 const server=http.createServer(async(req,res)=>{try{
  const url=new URL(req.url,'http://localhost');
  if(url.pathname.startsWith('/api/')){
   if(req.headers.origin&&req.headers.origin!==`http://${req.headers.host}`&&req.headers.origin!==`https://${req.headers.host}`)return send(res,403,{error:'Недопустимый источник запроса'});
   if(url.pathname==='/api/events'&&req.method==='GET'){
    const token=url.searchParams.get('token'),{room}=rooms.get(token);
    if(streams.has(token))streams.get(token).end();
    res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache','Connection':'keep-alive','X-Accel-Buffering':'no'});res.write(`data: ${JSON.stringify(rooms.snapshot(room))}\n\n`);streams.set(token,res);req.on('close',()=>{if(streams.get(token)===res)streams.delete(token);});return;
   }
   if(req.method!=='POST')return send(res,405,{error:'Метод не поддерживается'});
   let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>4096)return send(res,413,{error:'Запрос слишком большой'});}const data=JSON.parse(raw||'{}');
   if(url.pathname==='/api/join'){
    const ip=req.socket.remoteAddress,now=Date.now(),l=limits.get(ip)||{time:now,count:0};if(now-l.time>60000){l.time=now;l.count=0;}limits.set(ip,l);if(++l.count>25)return send(res,429,{error:'Слишком много подключений. Подожди минуту.'});return send(res,200,rooms.join(data));
   }
   if(url.pathname==='/api/action'){rooms.action(req.headers.authorization?.replace(/^Bearer /,''),data);return send(res,200,{ok:true});}
   return send(res,404,{error:'Не найдено'});
  }
  if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405);return res.end();}
  const pathname=decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname);
  if(!(/^\/(index\.html|online\.html|style\.css|online\.css)$/.test(pathname)||/^\/src\/[\w/-]+\.js$/.test(pathname))||pathname.includes('..')){res.writeHead(404);return res.end('Not found');}
  const file=resolve(root,'.'+pathname);if(!file.startsWith(root+'/')){res.writeHead(403);return res.end();}const content=await readFile(file);res.writeHead(200,{'Content-Type':({'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript'})[extname(file)],'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});res.end(req.method==='HEAD'?undefined:content);
 }catch(e){if(!res.headersSent)send(res,400,{error:e.message==='Unexpected end of JSON input'?'Некорректный запрос':e.message});else res.end();}});
 let previous=performance.now(),acc=0,frames=0;const clock=setInterval(()=>{const now=performance.now();acc+=Math.min(.25,(now-previous)/1000);previous=now;while(acc>=1/60){rooms.tick();acc-=1/60;}if(++frames%3===0)for(const [token,res]of streams){const s=rooms.sessions.get(token);if(!s){res.end();streams.delete(token);continue;}if(res.writableLength>256000){res.destroy();streams.delete(token);continue;}res.write(`data: ${JSON.stringify(rooms.snapshot(s.room))}\n\n`);}if(frames%3600===0)for(const [ip,l]of limits)if(Date.now()-l.time>60000)limits.delete(ip);},1000/60);
 server.on('close',()=>{clearInterval(clock);for(const res of streams.values())res.end();});return {server,rooms};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){const port=Number(process.env.PORT||5173);createServer().server.listen(port,'0.0.0.0',()=>{console.log(`King of the Hill: http://localhost:${port}`);for(const list of Object.values(networkInterfaces()))for(const net of list||[])if(net.family==='IPv4'&&!net.internal)console.log(`Игрокам в одной сети: http://${net.address}:${port}`);});}
