'use strict';
// Fixed closer camera; world coordinates and saved paint remain unchanged.
const VIEW_SCALE=1.5;
const TILE=512, $=id=>document.getElementById(id), canvas=$('world'), ctx=canvas.getContext('2d');
const colors=[['Ink','#171717'],['Gold','#e9ba59'],['Coral','#d98268'],['Lavender','#ad9bbd'],['Blue','#75b6cb'],['Moss','#a6bd7c']];
let pigment=null,size=8,tool='brush',camera={x:0,y:0},strokes=[],redo=[],active=null,gesture=null,width=innerWidth,height=innerHeight;
const visible={background:true,drawing:true,foreground:true},paintTiles=new Map(),scenery=new Map();

const SAVE_KEY='the-cave-sketchbook-v1';
let worldSeed=731293;
try{const saved=JSON.parse(localStorage.getItem(SAVE_KEY)||'null');if(Number.isInteger(saved?.seed))worldSeed=saved.seed;}catch{}
CaveWorld.setSeed(worldSeed);
// New save slot preserves the earlier prototype without granting its tools here.
const collected=new Set();
const startingRooms=CaveWorld.region(0,0).rooms;
// Each pigment lives in a separate part of the cave; even the first requires exploring.
const bucketRegions=[[0,0],[1,0],[-1,0],[0,1],[0,-1],[1,1]];
function bucketPosition(index){
 const [rx,ry]=bucketRegions[index],region=CaveWorld.region(rx,ry);
 const rooms=region.rooms.slice(1).sort((a,b)=>Math.hypot(b.x,b.y)-Math.hypot(a.x,a.y));
 const room=rooms[index===0?0:(worldSeed>>>index)%rooms.length];
 // Keep collectible silhouettes clear of rock pillars.
 for(const [dx,dy] of [[0,0],[45,0],[-45,0],[0,45],[0,-45],[65,65],[-65,-65]]){
  const x=room.x+dx,y=room.y+dy;
  if(CaveWorld.contains(room,x,y)&&!region.pillars.some(p=>[[0,0],[-20,-30],[20,25]].some(([ox,oy])=>CaveWorld.contains(p,x+ox,y+oy))))return{x,y};
 }
 return{x:room.x,y:room.y};
}
const pickups=[{id:'brush',x:-115,y:35,type:'brush'},
 ...colors.map((_,i)=>({id:'bucket-'+i,...bucketPosition(i),type:'bucket',index:i})),
 {id:'brush-north',x:startingRooms[6].x,y:startingRooms[6].y,type:'brush'}];
const secrets=[{id:'flower',x:startingRooms[2].x+30,y:startingRooms[2].y,r:27,color:colors[5][1]},
 {id:'face',x:startingRooms[1].x-50,y:startingRooms[1].y,r:30,color:null},
 {id:'door',x:startingRooms[4].x,y:startingRooms[4].y-40,r:40,color:colors[1][1]},
 {id:'fish',x:startingRooms[6].x+30,y:startingRooms[6].y,r:40,color:colors[4][1]}];
let unlocked=new Set(),toastTimer;
function hasBrush(){return pickups.some(p=>p.type==='brush'&&collected.has(p.id));}
function canPaint(){return hasBrush()&&pigment!==null;}
function surface(w=TILE,h=TILE){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
function random(seed){return()=>{seed=(Math.imul(seed,1664525)+1013904223)|0;return(seed>>>0)/4294967296;};}
function line(c,points){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();}
// Draw whole world geometry into each tile: boundaries agree exactly across tiles.
function sceneryTile(tx,ty){const key=tx+','+ty;if(scenery.has(key))return scenery.get(key);
 const bg=surface(),fg=surface(),b=bg.getContext('2d'),f=fg.getContext('2d'),rng=random((tx*73856093)^(ty*19349663)^7419);
 const area={x:tx*TILE,y:ty*TILE,w:TILE,h:TILE},regions=CaveWorld.near(area);
 b.fillStyle='#fff';b.fillRect(0,0,TILE,TILE);b.strokeStyle='#111';b.lineWidth=1.3;
 // Raised stone marks belong above paint; flat grain belongs below it.
 const stones=[];for(let i=0;i<7;i++)stones.push({x:rng()*TILE,y:rng()*TILE});
 const grain=random((tx*374761393)^(ty*668265263)^931);b.fillStyle='#ddd';
 for(let i=0;i<35;i++)b.fillRect(grain()*TILE,grain()*TILE,1,1);
 f.fillStyle='#141414';f.fillRect(0,0,TILE,TILE);f.strokeStyle='#505050';f.lineWidth=.8;
 for(let i=0;i<10;i++){const x=rng()*TILE,y=rng()*TILE;line(f,[[x,y],[x+12,y+9],[x+9,y+20],[x+31,y+29]]);}
 f.save();f.translate(-area.x,-area.y);f.globalCompositeOperation='destination-out';
 for(const region of regions){for(const shape of region.shapes)CaveWorld.carve(f,shape);for(const gate of region.gates)if(unlocked.has(gate.id))for(const shape of gate.shapes)CaveWorld.carve(f,shape);}
 f.globalCompositeOperation='source-over';f.fillStyle='#141414';for(const region of regions)for(const pillar of region.pillars)CaveWorld.carve(f,pillar);f.restore();
 f.strokeStyle='#111';f.lineWidth=1.3;
 for(const {x,y} of stones){const wx=x+area.x,wy=y+area.y;
  const floor=regions.some(r=>r.shapes.some(s=>CaveWorld.contains(s,wx,wy))||r.gates.some(g=>unlocked.has(g.id)&&g.shapes.some(s=>CaveWorld.contains(s,wx,wy))));
  if(floor&&!regions.some(r=>r.pillars.some(p=>CaveWorld.contains(p,wx,wy))))line(f,[[x,y],[x+4,y-2],[x+9,y+1]]);
 }
 const tile={bg,fg};scenery.set(key,tile);if(scenery.size>100)scenery.delete(scenery.keys().next().value);return tile;}
function drawPassages(c,area){for(const region of CaveWorld.near(area))for(const gate of region.gates){if(unlocked.has(gate.id)){
 // A tiny unexpected inhabitant waits inside the uncovered chamber.
 c.save();c.translate(gate.end.x,gate.end.y);c.strokeStyle='#111';c.fillStyle='#fff';c.lineWidth=2;c.beginPath();c.arc(0,-19,10,0,Math.PI*2);c.fill();c.stroke();line(c,[[0,-9],[0,16],[-12,31]]);line(c,[[0,16],[13,31]]);line(c,[[-17,1],[0,4],[14,-9]]);c.beginPath();c.arc(-3,-21,1,0,Math.PI*2);c.arc(4,-21,1,0,Math.PI*2);c.stroke();c.restore();
 }else{c.save();c.translate(gate.x,gate.y);c.rotate(gate.angle);c.strokeStyle='#999';c.lineWidth=2;line(c,[[0,-26],[-6,-12],[4,-3],[-4,9],[2,25]]);line(c,[[4,-3],[14,-10],[18,-9]]);c.restore();}}}
function revealPassages(stroke,a,b){if(stroke.erase)return;const area={x:Math.min(a.x,b.x)-80,y:Math.min(a.y,b.y)-80,w:Math.abs(a.x-b.x)+160,h:Math.abs(a.y-b.y)+160};
 for(const region of CaveWorld.near(area))for(const gate of region.gates){if(unlocked.has(gate.id))continue;const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((gate.x-a.x)*dx+(gate.y-a.y)*dy)/(dx*dx+dy*dy||1)));if(Math.hypot(gate.x-a.x-t*dx,gate.y-a.y-t*dy)<gate.r+stroke.size/2){unlocked.add(gate.id);scenery.clear();}}}
function drawPickups(c,area){for(const p of pickups){if(collected.has(p.id)||p.x<area.x-60||p.y<area.y-60||p.x>area.x+area.w+60||p.y>area.y+area.h+60)continue;c.save();c.translate(p.x,p.y);c.strokeStyle='#111';c.fillStyle='#fff';c.lineWidth=2;c.lineJoin='round';
 if(p.type==='brush'){c.rotate(.45);c.beginPath();c.roundRect(-4,-7,8,39,3);c.fill();c.stroke();c.beginPath();c.moveTo(-8,-8);c.lineTo(-8,-24);c.lineTo(0,-31);c.lineTo(8,-24);c.lineTo(8,-8);c.closePath();c.fill();c.stroke();line(c,[[-7,-12],[7,-12]]);line(c,[[-3,-25],[-3,-16]]);line(c,[[2,-26],[2,-16]]);}
 else{c.beginPath();c.moveTo(-17,-10);c.lineTo(-13,19);c.quadraticCurveTo(0,25,13,19);c.lineTo(17,-10);c.closePath();c.fill();c.stroke();c.beginPath();c.ellipse(0,-10,17,5,0,0,Math.PI*2);c.fill();c.stroke();c.beginPath();c.arc(0,-9,13,Math.PI,0);c.stroke();c.fillStyle='#111';c.font='9px monospace';c.textAlign='center';c.fillText(colors[p.index][0].toLowerCase(),0,9);}
 c.restore();}}
function bounds(){return{x:camera.x-width/(2*VIEW_SCALE),y:camera.y-height/(2*VIEW_SCALE),w:width/VIEW_SCALE,h:height/VIEW_SCALE};}
function drawScene(c,area){c.save();c.translate(-area.x,-area.y);const minX=Math.floor(area.x/TILE),minY=Math.floor(area.y/TILE),maxX=Math.floor((area.x+area.w)/TILE),maxY=Math.floor((area.y+area.h)/TILE);
 for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){const t=sceneryTile(x,y);if(visible.background)c.drawImage(t.bg,x*TILE,y*TILE);}
 if(visible.background)drawSecrets(c,false);
 if(visible.drawing)for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){let t=paintTiles.get(x+','+y);if(t)c.drawImage(t,x*TILE,y*TILE);}
 if(visible.foreground){drawSecrets(c,true);for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++)c.drawImage(sceneryTile(x,y).fg,x*TILE,y*TILE);}
 drawPassages(c,area);drawPickups(c,area);c.restore();}
function drawSecrets(c,front){if(!front)return;for(const s of secrets){const found=unlocked.has(s.id);c.save();c.translate(s.x,s.y);c.strokeStyle='#111';c.fillStyle='#fff';c.lineWidth=2;c.lineCap='round';
 if(s.id==='face'){c.beginPath();c.ellipse(0,0,30,24,.15,0,Math.PI*2);c.fill();c.stroke();line(c,[[-12,-5],[-9,-4]]);line(c,[[8,-4],[11,-5]]);c.beginPath();if(found)c.arc(0,2,12,0,Math.PI);else {c.moveTo(-10,10);c.lineTo(10,10);}c.stroke();if(found){c.font='11px monospace';c.fillStyle='#111';c.fillText('oh. hello.',-32,-40);}}
 if(s.id==='flower'){line(c,[[0,24],[0,-3]]);line(c,[[0,15],[-13,7],[-5,18]]);if(found){for(let i=0;i<6;i++){let t=i*Math.PI/3;c.beginPath();c.ellipse(Math.cos(t)*12,Math.sin(t)*12-10,9,5,t,0,Math.PI*2);c.fill();c.stroke();}c.beginPath();c.arc(0,-10,5,0,Math.PI*2);c.fill();c.stroke();}else{line(c,[[0,-3],[8,-8],[15,-3],[14,5]]);}}
 if(s.id==='door'){c.beginPath();c.roundRect(-32,-50,64,95,[30,30,0,0]);c.fill();c.stroke();if(found){c.fillStyle='#111';c.fill();c.fillStyle='#fff';c.beginPath();c.arc(0,-23,8,0,Math.PI*2);c.fill();c.strokeStyle='#fff';line(c,[[0,-15],[0,12],[-9,28]]);line(c,[[0,12],[10,28]]);line(c,[[-13,-5],[0,0],[15,-16]]);}else{c.beginPath();c.arc(17,0,3,0,Math.PI*2);c.stroke();line(c,[[-7,-28],[0,-36],[7,-28],[0,-20],[-7,-28]]);}}
 if(s.id==='fish'){c.beginPath();c.ellipse(0,0,34,13,0,0,Math.PI*2);c.stroke();if(found){line(c,[[-12,0],[2,-7],[13,0],[2,7],[-12,0],[-20,-7],[-20,7],[-12,0]]);c.beginPath();c.arc(6,-1,1,0,Math.PI*2);c.stroke();}else line(c,[[-20,0],[-5,2],[8,-1],[22,1]]);}
 c.restore();}}
function render(){const dpr=Math.min(devicePixelRatio||1,2);ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,height);ctx.scale(VIEW_SCALE,VIEW_SCALE);drawScene(ctx,bounds());}
function resize(){width=innerWidth;height=innerHeight;const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);render();}addEventListener('resize',resize);
function worldPoint(e){return{x:(e.clientX-width/2)/VIEW_SCALE+camera.x,y:(e.clientY-height/2)/VIEW_SCALE+camera.y};}
function segment(stroke,a,b){revealPassages(stroke,a,b);let pad=stroke.size/2+2;for(let ty=Math.floor((Math.min(a.y,b.y)-pad)/TILE);ty<=Math.floor((Math.max(a.y,b.y)+pad)/TILE);ty++)for(let tx=Math.floor((Math.min(a.x,b.x)-pad)/TILE);tx<=Math.floor((Math.max(a.x,b.x)+pad)/TILE);tx++){const key=tx+','+ty;let tile=paintTiles.get(key);if(!tile){if(stroke.erase)continue;tile=surface();paintTiles.set(key,tile);}const c=tile.getContext('2d');c.save();c.translate(-tx*TILE,-ty*TILE);c.globalCompositeOperation=stroke.erase?'destination-out':'source-over';c.strokeStyle=stroke.color;c.fillStyle=stroke.color;c.lineWidth=stroke.size;c.lineCap='round';c.lineJoin='round';c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.stroke();c.beginPath();c.arc(b.x,b.y,stroke.size/2,0,Math.PI*2);c.fill();c.restore();}
 if(!stroke.erase)for(const s of secrets){if(unlocked.has(s.id)||(s.color&&s.color!==stroke.color))continue;const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((s.x-a.x)*dx+(s.y-a.y)*dy)/(dx*dx+dy*dy||1)));if(Math.hypot(s.x-a.x-t*dx,s.y-a.y-t*dy)<s.r+stroke.size/2)unlocked.add(s.id);}}
function updateUI(){const brush=hasBrush();$('brushTools').hidden=!brush;$('undo').disabled=!strokes.length;$('redo').disabled=!redo.length;
 for(const button of document.querySelectorAll('#palette button')){button.hidden=!collected.has('bucket-'+button.dataset.index);button.disabled=!brush;button.classList.toggle('active',button.dataset.color===pigment);}}
function rebuild(){paintTiles.clear();scenery.clear();unlocked.clear();for(const s of strokes){segment(s,s.points[0],s.points[0]);for(let i=1;i<s.points.length;i++)segment(s,s.points[i-1],s.points[i]);}updateUI();render();}
function toast(message){$('toast').textContent=message;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),3500);}
function persist(){try{localStorage.setItem('the-cave-sketchbook-v1',JSON.stringify({seed:worldSeed,strokes,collected:[...collected],pigment}));$('saveState').textContent='saved here';}catch{$('saveState').textContent='Storage full · export to keep your work';}}
function finish(){if(active){strokes.push(active);active=null;redo=[];updateUI();persist();}gesture=null;canvas.style.cursor=tool==='hand'?'grab':canPaint()?'none':'crosshair';}
canvas.addEventListener('mousedown',e=>{if(e.button===1)e.preventDefault();});
canvas.addEventListener('auxclick',e=>{if(e.button===1)e.preventDefault();});
canvas.addEventListener('contextmenu',e=>e.preventDefault());canvas.addEventListener('wheel',e=>e.preventDefault(),{passive:false});
canvas.addEventListener('pointerdown',e=>{if(gesture||![0,1].includes(e.button))return;e.preventDefault();canvas.setPointerCapture(e.pointerId);gesture={id:e.pointerId,x:e.clientX,y:e.clientY,pan:e.button===1||tool==='hand'};if(gesture.pan){canvas.style.cursor='grabbing';$('cursor').style.display='none';return;}const point=worldPoint(e),pickup=pickups.find(p=>!collected.has(p.id)&&Math.hypot(p.x-point.x,p.y-point.y)<35);
 if(pickup){collected.add(pickup.id);if(pickup.type==='bucket')pigment=colors[pickup.index][1];updateUI();persist();gesture=null;render();return;}
 if(!canPaint()){gesture=null;return;}active={color:pigment,size,erase:tool==='eraser',points:[worldPoint(e)]};const before=new Set(unlocked);segment(active,active.points[0],active.points[0]);announce(before);render();});
function announce(){updateUI();}
canvas.addEventListener('pointermove',e=>{const cursor=$('cursor');cursor.style.left=e.clientX+'px';cursor.style.top=e.clientY+'px';cursor.style.width=size*VIEW_SCALE+'px';cursor.style.height=size*VIEW_SCALE+'px';cursor.style.display=tool==='hand'||gesture?.pan||!canPaint()?'none':'block';if(!gesture||e.pointerId!==gesture.id)return;if(gesture.pan){camera.x-=(e.clientX-gesture.x)/VIEW_SCALE;camera.y-=(e.clientY-gesture.y)/VIEW_SCALE;gesture.x=e.clientX;gesture.y=e.clientY;}else if(active){const p=worldPoint(e),last=active.points.at(-1);if(Math.hypot(p.x-last.x,p.y-last.y)<1)return;const before=new Set(unlocked);segment(active,last,p);active.points.push(p);announce(before);}render();});
canvas.addEventListener('pointerup',e=>{if(gesture?.id===e.pointerId)finish();});canvas.addEventListener('pointercancel',finish);canvas.addEventListener('lostpointercapture',finish);canvas.addEventListener('pointerleave',()=>$('cursor').style.display='none');addEventListener('blur',finish);
function selectTool(t){if(t==='eraser'&&!canPaint())return;tool=t;$('eraser').classList.toggle('active',t==='eraser');$('hand').classList.toggle('active',t==='hand');canvas.style.cursor=t==='hand'?'grab':canPaint()?'none':'crosshair';}
for(const [index,[name,color]]of colors.entries()){const button=document.createElement('button');button.dataset.index=index;button.dataset.color=color;button.hidden=true;button.title=name+' paint';button.setAttribute('aria-label',name+' pigment');button.style.setProperty('--color',color);button.classList.toggle('active',color===pigment);button.onclick=()=>{if(!hasBrush()||!collected.has('bucket-'+index))return;pigment=color;selectTool('brush');document.querySelectorAll('#palette button').forEach(b=>b.classList.toggle('active',b===button));};$('palette').append(button);}
document.querySelectorAll('[data-size]').forEach(b=>b.onclick=()=>{size=+b.dataset.size;selectTool('brush');document.querySelectorAll('[data-size]').forEach(x=>x.classList.toggle('active',x===b));});
$('eraser').onclick=()=>selectTool(tool==='eraser'?'brush':'eraser');$('hand').onclick=()=>selectTool(tool==='hand'?'brush':'hand');
$('undo').onclick=()=>{finish();if(strokes.length){redo.push(strokes.pop());rebuild();persist();}};$('redo').onclick=()=>{finish();if(redo.length){strokes.push(redo.pop());rebuild();persist();}};
$('home').onclick=()=>{camera={x:0,y:0};render();};
addEventListener('keydown',e=>{if($('exportDialog').open||$('resetDialog').open||['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName))return;if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();(e.shiftKey?$('redo'):$('undo')).click();}else if(e.key.toLowerCase()==='e')$('eraser').click();else if(e.key.toLowerCase()==='h')$('hand').click();else if(['1','2','3'].includes(e.key))document.querySelectorAll('[data-size]')[+e.key-1].click();});
$('resetOpen').onclick=()=>$('resetDialog').showModal();
$('resetCancel').onclick=()=>$('resetDialog').close();
$('resetConfirm').onclick=()=>{
 // Remove only this prototype's saves; never clear other apps on the same origin.
 const nextSeed=(worldSeed+1+Math.floor(Math.random()*2147483646))|0;
 try{
  localStorage.setItem(SAVE_KEY,JSON.stringify({seed:nextSeed,strokes:[],collected:[],pigment:null}));
  for(const key of ['the-cave-v1','the-cave-v2'])localStorage.removeItem(key);
  location.reload();
 }catch{toast('Could not reset saved data. Please check browser storage access.');}
};
$('exportOpen').onclick=()=>$('exportDialog').showModal();
$('download').onclick=()=>{let area=bounds();if($('exportArea').value==='painting'){if(!strokes.length){toast('Paint something first, then export your painted area.');return;}let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;for(const s of strokes)for(const p of s.points){minX=Math.min(minX,p.x-s.size/2);minY=Math.min(minY,p.y-s.size/2);maxX=Math.max(maxX,p.x+s.size/2);maxY=Math.max(maxY,p.y+s.size/2);}area={x:Math.floor(minX)-32,y:Math.floor(minY)-32,w:Math.ceil(maxX-minX)+64,h:Math.ceil(maxY-minY)+64};}
 // Avoid an unbounded tile traversal if a painting spans an enormous distance.
 if(Math.ceil(area.w/TILE)*Math.ceil(area.h/TILE)>4096){toast('This area is too large. Export the current view instead.');return;}const scale=Math.min($('exportArea').value==='view'?VIEW_SCALE:1,4096/area.w,4096/area.h),out=surface(Math.ceil(area.w*scale),Math.ceil(area.h*scale)),c=out.getContext('2d');c.scale(scale,scale);drawScene(c,area);out.toBlob(blob=>{if(!blob){toast('Export failed. Please try again.');return;}const a=document.createElement('a'),url=URL.createObjectURL(blob);a.href=url;a.download='the-cave-'+Date.now()+'.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);$('exportDialog').close();toast('A little piece of the cave, saved.');},'image/png');};
try{const saved=JSON.parse(localStorage.getItem('the-cave-sketchbook-v1')||'null');if(saved){if(Array.isArray(saved.collected))for(const id of saved.collected)if(pickups.some(p=>p.id===id))collected.add(id);if(colors.some((c,i)=>c[1]===saved.pigment&&collected.has('bucket-'+i)))pigment=saved.pigment;if(Array.isArray(saved.strokes)&&saved.strokes.every(s=>s&&typeof s.color==='string'&&Number.isFinite(s.size)&&s.size>0&&s.size<=100&&Array.isArray(s.points)&&s.points.length&&s.points.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y))))strokes=saved.strokes;}}catch{$('saveState').textContent='saving unavailable';}
rebuild();resize();
