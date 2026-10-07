import test from 'node:test';import assert from 'node:assert/strict';
import {ArenaAudio,GameAudio,audioSettings} from '../src/audio.js';import {Arena} from '../src/net/arena.js';
test('network audio deduplicates events, attenuates distant actions and skips reconnect history',()=>{
 const heard=[],a=new ArenaAudio({setActive(){},play:(...args)=>heard.push(args)}),p={x:0,y:0};
 a.consume({time:1,phase:'running',events:[{id:1,type:'jump',x:0,y:0}]},p);assert.equal(heard.length,0);
 const g={time:2,phase:'running',events:[{id:2,type:'hit',x:350,y:0}]};a.consume(g,p);a.consume(g,p);assert.deepEqual(heard,[['hit',.5]]);
 a.reset();a.consume(g,p);assert.equal(heard.length,1);a.consume({...g,time:0,events:[]},p);a.consume({...g,time:.1,events:[{id:1,type:'jump',x:0,y:0}]},p);assert.equal(heard.length,2);
});
test('server emits only actual actions and bounds audio event history',()=>{
 const g=new Arena([{id:'a'},{id:'b'}]);g.input('a',{jump:true,attack:true});g.step();assert.ok(g.snapshot().events.some(e=>e.type==='jump'));assert.ok(g.events.some(e=>e.type==='attack'));g.step();assert.equal(g.events.filter(e=>e.type==='jump').length,1);
 for(let i=0;i<110;i++)g.emit('hit',g.players[0]);assert.equal(g.events.length,96);
});
test('music and effects have independent volume and mute with hidden page',()=>{
 const a=new GameAudio({volume:0,musicVolume:18}),values={};a.context={currentTime:0};a.fx={gain:{setTargetAtTime(v){values.fx=v;}}};a.music={gain:{setTargetAtTime(v){values.music=v;}}};a.setActive(true);assert.equal(values.fx,0);assert.equal(values.music,.18);a.setVisible(false);assert.equal(values.music,0);a.setVisible(true);a.setActive(false);assert.equal(values.music,0);assert.deepEqual(audioSettings({volume:300,musicVolume:-5}),{volume:100,musicVolume:0});
});
