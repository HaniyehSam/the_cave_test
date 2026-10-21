const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),World=require('./cave-world.js');
// Regeneration must be stable even after cache eviction, including negative regions.
const first=JSON.stringify(World.region(-2,3));for(let i=0;i<200;i++)World.region(i,10);assert.equal(JSON.stringify(World.region(-2,3)),first);
const shapes=new Set();for(let y=-2;y<3;y++)for(let x=-2;x<3;x++){const r=World.region(x,y);shapes.add(r.rooms.map(s=>[Math.round(s.rx),Math.round(s.ry)]).join(';'));assert(r.rooms.length>=4);assert(r.shapes.some(s=>s.kind==='tunnel'));}assert.equal(shapes.size,25);
const gate=World.region(0,0).gates[0];assert(gate.shapes.some(s=>World.contains(s,gate.x,gate.y)),'passage must open at its visible crack');assert(gate.shapes.some(s=>World.contains(s,gate.end.x,gate.end.y)));
assert(!World.near({x:gate.end.x,y:gate.end.y,w:1,h:1}).some(r=>r.shapes.some(s=>World.contains(s,gate.end.x,gate.end.y))),'starting secret chamber must actually be concealed');
// Run the app's real input handlers and stroke history using a minimal canvas/DOM double.
const handlers={},nodes=new Map(),storage={};const context=new Proxy({},{get:()=>()=>{}});
function element(id){if(nodes.has(id))return nodes.get(id);const n={id,style:{setProperty(){}},dataset:{},classList:{toggle(){},add(){},remove(){}},addEventListener(k,fn){handlers[id+':'+k]=fn;},getContext:()=>context,setPointerCapture(){},append(){},setAttribute(){},click(){this.onclick?.();}};nodes.set(id,n);return n;}
const env={CaveWorld:World,document:{getElementById:element,createElement:()=>element('temporary'+Math.random()),querySelectorAll:()=>[]},innerWidth:1000,innerHeight:700,devicePixelRatio:1,addEventListener(){},localStorage:{getItem:k=>storage[k]||null,setItem:(k,v)=>storage[k]=v,removeItem:k=>delete storage[k]},location:{reload(){env.didReload=true;}},requestAnimationFrame:()=>1,cancelAnimationFrame(){},setTimeout:()=>0,clearTimeout(){},console};vm.createContext(env);vm.runInContext(fs.readFileSync(__dirname+'/app.js','utf8'),env);
const run=s=>vm.runInContext(s,env);function event(button,x,y){return{button,pointerId:1,clientX:x,clientY:y,preventDefault(){}};}
handlers['world:pointerdown'](event(2,200,200));assert.equal(run('gesture'),null,'right button must not pan');
handlers['world:pointerdown'](event(1,200,200));handlers['world:pointermove'](event(1,250,230));handlers['world:pointerup'](event(1,250,230));assert.equal(run('camera.x'),-50/1.5);assert.equal(run('camera.y'),-30/1.5);assert.equal(run('strokes.length'),0);
run("collected.add('brush');collected.add('bucket-0');pigment=colors[0][1]");
env.testGate=gate;run("const testStroke={color:colors[0][1],size:8,erase:false,points:[{x:testGate.x,y:testGate.y}]};strokes.push(testStroke);rebuild();persist();");assert(run('unlocked.has(testGate.id)'));
element('undo').onclick();assert(!run('unlocked.has(testGate.id)'),'undo must reseal passage');element('redo').onclick();assert(run('unlocked.has(testGate.id)'),'redo must restore opening');
run('unlocked.clear();rebuild()');assert(run('unlocked.has(testGate.id)'),'saved stroke replay must restore opening');
assert(JSON.parse(storage['the-cave-sketchbook-v1']).strokes.length===1);
console.log('Passed: region variation, deterministic regeneration, concealed room, crack geometry, middle/right input, passage reveal, undo/redo, saved-stroke replay.');

// Infinite lazy generation: far positive and negative coordinates contain caves and secrets.
for(const [x,y] of [[100000,-100000],[-100000,100000],[9999,8888]]){const r=World.region(x,y);assert(r.rooms.length>=4);assert(r.gates.length>0);assert(Math.abs(r.rooms[0].x-x*World.CELL)<400);}
storage['unrelated-app']='keep';storage['the-cave-v1']='old';storage['the-cave-v2']='old';
const oldWorld=JSON.stringify(World.region(0,0));element('resetConfirm').onclick();
assert(env.didReload);assert.equal(storage['unrelated-app'],'keep');assert.equal(storage['the-cave-v1'],undefined);assert.equal(storage['the-cave-v2'],undefined);
const resetSave=JSON.parse(storage['the-cave-sketchbook-v1']);assert.equal(resetSave.strokes.length,0);assert.equal(resetSave.collected.length,0);assert.equal(resetSave.pigment,null);assert.notEqual(resetSave.seed,731293);
const fresh={...env};vm.createContext(fresh);vm.runInContext(fs.readFileSync(__dirname+'/app.js','utf8'),fresh);assert.equal(vm.runInContext('strokes.length+redo.length+collected.size+unlocked.size',fresh),0);assert.equal(vm.runInContext('camera.x+camera.y',fresh),0);assert.equal(vm.runInContext('worldSeed',fresh),resetSave.seed);
assert.notEqual(JSON.stringify(World.region(0,0)),oldWorld);const regenerated=JSON.stringify(World.region(0,0));World.setSeed(resetSave.seed);assert.equal(JSON.stringify(World.region(0,0)),regenerated);
console.log('Passed: distant generation, full reset, unrelated storage preservation, new cave seed, clean reload, stable seeded regeneration.');
// Buckets require travel and collecting either type produces no message.
const bucketList=vm.runInContext("pickups.filter(p=>p.type==='bucket')",fresh);
assert(bucketList.every(p=>Math.hypot(p.x,p.y)>400));
assert(bucketList.slice(1).every(p=>Math.hypot(p.x,p.y)>1400));
handlers['world:pointerdown'](event(0,500-115*1.5,350+35*1.5));handlers['world:pointerup'](event(0,500-115*1.5,350+35*1.5));
assert(vm.runInContext('hasBrush()',fresh));assert.equal(element('toast').textContent,undefined);
const ink=bucketList[0];handlers['world:pointerdown'](event(0,500+ink.x*1.5,350+ink.y*1.5));handlers['world:pointerup'](event(0,500+ink.x*1.5,350+ink.y*1.5));
assert(vm.runInContext('canPaint()',fresh));assert.equal(element('toast').textContent,undefined);
console.log('Passed: distant bucket placement and silent brush/bucket pickup.');

assert.equal(vm.runInContext('bounds().w',fresh),1000/1.5);assert.equal(vm.runInContext('worldPoint({clientX:650,clientY:350}).x',fresh),100);console.log('Passed: fixed 1.5x view and scaled pointer coordinates.');
// Touch painting, two-finger panning, cancellation, and no stray mark on release.
function touch(id,x,y){return{...event(0,x,y),pointerId:id,pointerType:'touch'};}
const beforeTouch=vm.runInContext('strokes.length',fresh);
handlers['world:pointerdown'](touch(11,500,350));handlers['world:pointermove'](touch(11,530,350));
assert(vm.runInContext('active!==null',fresh));
handlers['world:pointerdown'](touch(12,600,350));assert.equal(vm.runInContext('active',fresh),null);
handlers['world:pointermove'](touch(11,560,350));handlers['world:pointermove'](touch(12,630,350));
assert.equal(vm.runInContext('camera.x',fresh),-20);assert.equal(vm.runInContext('strokes.length',fresh),beforeTouch);
handlers['world:pointerup'](touch(12,630,350));handlers['world:pointermove'](touch(11,580,350));handlers['world:pointerup'](touch(11,580,350));assert.equal(vm.runInContext('strokes.length',fresh),beforeTouch);
handlers['world:pointerdown'](touch(13,500,350));handlers['world:pointermove'](touch(13,540,370));handlers['world:pointerup'](touch(13,540,370));assert.equal(vm.runInContext('strokes.length',fresh),beforeTouch+1);
handlers['world:pointerdown'](touch(14,500,350));handlers['world:pointermove'](touch(14,540,370));handlers['world:pointercancel'](touch(14,540,370));assert.equal(vm.runInContext('strokes.length',fresh),beforeTouch+1);assert.equal(vm.runInContext('touches.size',fresh),0);
console.log('Passed: touch draw, two-finger pan, rollback, release suppression, cancellation.');


// Wheel panning supports pixels, lines, and Shift for horizontal movement.
const wheelStart=vm.runInContext('camera.y',fresh);handlers['world:wheel']({deltaX:0,deltaY:90,deltaMode:0,preventDefault(){}});assert.equal(vm.runInContext('camera.y',fresh),wheelStart+60);
const wheelX=vm.runInContext('camera.x',fresh);handlers['world:wheel']({deltaX:0,deltaY:3,deltaMode:1,shiftKey:true,preventDefault(){}});assert.equal(vm.runInContext('camera.x',fresh),wheelX+32);
vm.runInContext("selectTool('hand')",fresh);const moves=vm.runInContext('strokes.length',fresh);handlers['world:pointerdown'](touch(41,500,350));handlers['world:pointermove'](touch(41,560,350));handlers['world:pointerup'](touch(41,560,350));assert.equal(vm.runInContext('strokes.length',fresh),moves);
handlers['world:pointerdown']({...event(0,500,350),pointerType:'pen'});handlers['world:pointermove']({...event(0,530,350),pointerType:'pen'});handlers['world:pointerup']({...event(0,530,350),pointerType:'pen'});assert.equal(vm.runInContext('strokes.length',fresh),moves+1);
console.log('Passed: wheel/Shift pan, one-finger Move mode, pen drawing while Move selected.');
