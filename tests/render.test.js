import test from 'node:test';import assert from 'node:assert/strict';import {Renderer} from '../src/render.js';
test('lobby travel stays enabled despite OS reduced-motion and shifts in both directions',()=>{
 const old={document:globalThis.document,matchMedia:globalThis.matchMedia};const shifts=[];const ctx={drawImage(...a){shifts.push(a[1]);},save(){},restore(){},translate(){},fillRect(){},createLinearGradient(){return {addColorStop(){}};}};
 globalThis.document={createElement(){return {getContext(){return ctx;}};}};globalThis.matchMedia=()=>({matches:true});
 try{const r=Object.create(Renderer.prototype);Object.assign(r,{canvas:{width:800,height:600},c:ctx,w:800,h:600,background(){}});for(const [from,to,sign]of [[0,1,-1],[1,0,1]]){r.startTransition(from,to,10);assert.ok(r.transition);shifts.length=0;r.menuFrame(to,10.8);assert.ok(shifts[0]*sign>100);r.menuFrame(to,12);assert.equal(r.transition,null);}}finally{Object.assign(globalThis,old);}
});
