'use strict';
const $=id=>document.getElementById(id),canvas=$('world'),ctx=canvas.getContext('2d');
const paintLayer=document.createElement('canvas'),hitContext=document.createElement('canvas').getContext('2d');
const SECTION=960,TILE=512,SCALE=1.12,PAPER='#f8f7f2',INK='#292824';
const COLORS={ink:INK,coral:'#d47d63',gold:'#d7b74c',green:'#7b9464',blue:'#679cad',lavender:'#a08aaf'};
let camera={x:innerWidth<650?400:480,y:innerWidth<650?570:450},width=innerWidth,height=innerHeight,dpr=1;
let strokes=[],redo=[],collected=new Set(),unlocked=new Set(),color='ink',brushSize=7,mode='draw',tool='brush';
let active=null,dirty=true,space=false,penSeen=false,ready=false,saveTimer,statusTimer,db=null;
const scenes=new Map(),requests=new Map(),queue=[],desired=new Set(),paintTiles=new Map(),strokeIndex=new Map(),pointers=new Map();
let liveRequests=0;
let decisions={},dialogueActor=null,exportToken=0;
const explored=new Map();
function status(message){$('status').textContent=message;clearTimeout(statusTimer);if(message)statusTimer=setTimeout(()=>$('status').textContent='',6000);}
function bounds(){return{x:camera.x-width/SCALE/2,y:camera.y-height/SCALE/2,w:width/SCALE,h:height/SCALE};}
function point(e){return{x:camera.x+(e.clientX-width/2)/SCALE,y:camera.y+(e.clientY-height/2)/SCALE};}
function home(){finish();camera={x:width<650?400:480,y:width<650?570:450};updateScenes();persist();dirty=true;}
function key(x,y){return`${x},${y}`;}
function visibleSections(buffer=0){const b=bounds(),out=[];for(let y=Math.floor(b.y/SECTION)-buffer;y<=Math.floor((b.y+b.h)/SECTION)+buffer;y++)for(let x=Math.floor(b.x/SECTION)-buffer;x<=Math.floor((b.x+b.w)/SECTION)+buffer;x++)out.push({x,y,k:key(x,y)});return out;}
function imageFromSVG(svg){return new Promise((resolve,reject)=>{const url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'})),im=new Image();im.onload=()=>{URL.revokeObjectURL(url);resolve(im);};im.onerror=()=>{URL.revokeObjectURL(url);reject(Error('Could not read section artwork'));};im.src=url;});}
function effectSVG(content){return`<svg xmlns="http://www.w3.org/2000/svg" width="960" height="960" viewBox="0 0 960 960"><g fill="none" stroke="${INK}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${content}</g></svg>`;}
function effectContent(s){return s.events.filter(e=>unlocked.has(e.id)).map(e=>e.after).join('')+(s.actors||[]).map(a=>{const choice=a.choices.find(c=>c.id===decisions[a.id]);return (choice?.art||'')+(choice?.bubble||(a.linked&&unlocked.has(a.linked)?a.bubbleAfter:a.bubbleBefore));}).join('');}
async function effects(s){const revision=++s.revision,content=effectContent(s);if(!content){s.effect=null;dirty=true;return;}const im=await imageFromSVG(effectSVG(content));if(revision===s.revision){s.effect=im;dirty=true;}}
function updateScenes(){
 const all=visibleSections(1),visible=new Set(visibleSections().map(t=>t.k));desired.clear();all.forEach(t=>desired.add(t.k));
 for(const [k,r]of requests)if(!desired.has(k))r.abort();
 queue.length=0;
 all.sort((a,b)=>(visible.has(b.k)-visible.has(a.k))||(Math.hypot(a.x*SECTION+480-camera.x,a.y*SECTION+480-camera.y)-Math.hypot(b.x*SECTION+480-camera.x,b.y*SECTION+480-camera.y)));
 for(const t of all){if(scenes.has(t.k)){const s=scenes.get(t.k);scenes.delete(t.k);scenes.set(t.k,s);}else if(!requests.has(t.k))queue.push(t);}
 for(const [k]of scenes)if(!desired.has(k))scenes.delete(k);
 rememberView();pump();
}
function pump(){
 while(liveRequests<3&&queue.length){const t=queue.shift();if(!desired.has(t.k)||requests.has(t.k)||scenes.has(t.k))continue;const control=new AbortController();requests.set(t.k,control);liveRequests++;
  (async()=>{try{const response=await fetch(`scene/${t.x}/${t.y}.json`,{signal:control.signal});if(!response.ok)throw Error('Section unavailable');const s=await response.json();const [bg,fg]=await Promise.all([imageFromSVG(s.bg),imageFromSVG(s.fg)]);if(!desired.has(t.k)||control.signal.aborted)return;s.bg=bg;s.fg=fg;s.effect=null;s.revision=0;s.regionPaths=s.regions.map(r=>new Path2D(r.d));scenes.set(t.k,s);await effects(s);rememberView();dirty=true;}catch(error){if(error.name!=='AbortError'){status('This part could not load. Move back to try again.');console.error(error);}}finally{requests.delete(t.k);liveRequests--;if(control.signal.aborted&&desired.has(t.k)&&!scenes.has(t.k))queue.push(t);pump();}})();
 }
 const missing=visibleSections().filter(t=>!scenes.has(t.k)).length;$('loading').textContent=missing?'unfolding…':'';
}
function resize(){width=innerWidth;height=innerHeight;dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);dirty=true;if(ready)updateScenes();}
function tileKeys(box){const out=[];for(let y=Math.floor(box.y/TILE);y<=Math.floor((box.y+box.h)/TILE);y++)for(let x=Math.floor(box.x/TILE);x<=Math.floor((box.x+box.w)/TILE);x++)out.push(key(x,y));return out;}
function strokeBounds(s){if(s.fill)return{x:s.offset.x+s.region.x,y:s.offset.y+s.region.y,w:s.region.w,h:s.region.h};let x=Infinity,y=Infinity,r=-Infinity,b=-Infinity;for(const p of s.points){x=Math.min(x,p.x);y=Math.min(y,p.y);r=Math.max(r,p.x);b=Math.max(b,p.y);}const pad=s.size/2+2;return{x:x-pad,y:y-pad,w:r-x+pad*2,h:b-y+pad*2};}
function indexStroke(s,i){s.box=strokeBounds(s);for(const k of tileKeys(s.box)){if(!strokeIndex.has(k))strokeIndex.set(k,[]);strokeIndex.get(k).push(i);paintTiles.delete(k);}}
function renderStroke(c,s){c.save();c.globalCompositeOperation=s.erase?'destination-out':'source-over';c.strokeStyle=c.fillStyle=COLORS[s.color]||INK;c.lineWidth=s.size;c.lineCap=c.lineJoin='round';if(s.fill){c.translate(s.offset.x,s.offset.y);c.fill(new Path2D(s.region.d));}else if(s.points.length===1){c.beginPath();c.arc(s.points[0].x,s.points[0].y,s.size/2,0,Math.PI*2);c.fill();}else{c.beginPath();s.points.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.stroke();}c.restore();}
function getPaintTile(k){if(paintTiles.has(k)){const tile=paintTiles.get(k);paintTiles.delete(k);paintTiles.set(k,tile);return tile;}const [x,y]=k.split(',').map(Number),tile=document.createElement('canvas');tile.width=tile.height=TILE;const c=tile.getContext('2d');c.translate(-x*TILE,-y*TILE);for(const i of strokeIndex.get(k)||[])renderStroke(c,strokes[i]);paintTiles.set(k,tile);while(paintTiles.size>32)paintTiles.delete(paintTiles.keys().next().value);return tile;}
function itemVisible(item){return item.type==='brush'?!collected.has('brush'):!collected.has(item.color);}
function drawItem(c,item){if(!itemVisible(item))return;c.save();c.translate(item.x,item.y);c.lineWidth=1.7;c.strokeStyle=INK;c.fillStyle=PAPER;c.lineCap='round';if(item.type==='brush'){c.rotate(.4);c.beginPath();c.moveTo(-4,-9);c.lineTo(-3,-38);c.quadraticCurveTo(0,-42,3,-38);c.lineTo(4,-9);c.closePath();c.fill();c.stroke();c.fillStyle=INK;c.fillRect(-5,-9,10,8);c.beginPath();c.moveTo(-5,-1);c.quadraticCurveTo(-13,14,-2,16);c.quadraticCurveTo(8,17,5,-1);c.closePath();c.fill();c.stroke();c.strokeStyle=PAPER;c.beginPath();c.moveTo(-3,1);c.lineTo(-4,10);c.stroke();}else{c.fillStyle=COLORS[item.color];c.beginPath();c.roundRect(-13,-17,26,29,3);c.fill();c.stroke();c.fillStyle=PAPER;c.beginPath();c.ellipse(0,-17,13,4,0,0,Math.PI*2);c.fill();c.stroke();c.beginPath();c.arc(0,-17,17,Math.PI,Math.PI*2);c.stroke();c.fillStyle=COLORS[item.color];c.beginPath();c.ellipse(0,-17,9,2,0,0,Math.PI*2);c.fill();}c.restore();}
function render(target=ctx,ratio=dpr){
 target.setTransform(ratio,0,0,ratio,0,0);target.fillStyle=PAPER;target.fillRect(0,0,width,height);target.translate(width/2-camera.x*SCALE,height/2-camera.y*SCALE);target.scale(SCALE,SCALE);
 const visible=visibleSections();for(const t of visible){const s=scenes.get(t.k);if(s)target.drawImage(s.bg,t.x*SECTION,t.y*SECTION,SECTION,SECTION);}
 // Paint has its own transparent tiled surface, beneath all structural outlines.
 const pw=Math.ceil(width*ratio),ph=Math.ceil(height*ratio);if(paintLayer.width!==pw||paintLayer.height!==ph){paintLayer.width=pw;paintLayer.height=ph;}const p=paintLayer.getContext('2d');p.setTransform(1,0,0,1,0,0);p.clearRect(0,0,pw,ph);p.setTransform(ratio*SCALE,0,0,ratio*SCALE,(width/2-camera.x*SCALE)*ratio,(height/2-camera.y*SCALE)*ratio);
 for(const k of tileKeys(bounds())){if(!strokeIndex.has(k))continue;const [x,y]=k.split(',').map(Number);p.drawImage(getPaintTile(k),x*TILE,y*TILE);}
 if(active)renderStroke(p,active);
 target.save();target.setTransform(1,0,0,1,0,0);target.drawImage(paintLayer,0,0);target.restore();
 for(const t of visible){const s=scenes.get(t.k);if(!s)continue;target.drawImage(s.fg,t.x*SECTION,t.y*SECTION,SECTION,SECTION);if(s.effect)target.drawImage(s.effect,t.x*SECTION,t.y*SECTION,SECTION,SECTION);target.save();target.translate(t.x*SECTION,t.y*SECTION);s.items.forEach(i=>drawItem(target,i));target.restore();}
}
function frame(){if(dirty){dirty=false;render();}requestAnimationFrame(frame);}
function canDraw(){return collected.has('brush')&&Object.keys(COLORS).some(k=>collected.has(k));}
function updateUI(){
 $('draw').setAttribute('aria-pressed',mode==='draw');$('move').setAttribute('aria-pressed',mode==='move');$('erase').setAttribute('aria-pressed',tool==='erase');$('fill').setAttribute('aria-pressed',tool==='fill');
 canvas.classList.toggle('moving',mode==='move'||space);document.querySelector('.paint-tools').hidden=!canDraw();$('undo').disabled=!strokes.length;$('redo').disabled=!redo.length;
 $('palette').replaceChildren();for(const [id,hex]of Object.entries(COLORS)){if(!collected.has(id))continue;const b=document.createElement('button');b.style.setProperty('--pigment',hex);b.title=id;b.setAttribute('aria-label',id+' paint');b.setAttribute('aria-pressed',color===id);b.onclick=()=>{color=id;tool='brush';mode='draw';updateUI();persist();};$('palette').append(b);}
 $('sizeDot').style.width=$('sizeDot').style.height=`${brushSize===7?6:brushSize===17?10:16}px`;
}
function pick(p){for(const s of scenes.values())for(const item of s.items){if(itemVisible(item)&&Math.hypot(p.x-(s.tx*SECTION+item.x),p.y-(s.ty*SECTION+item.y))<27/SCALE){collected.add(item.type==='brush'?'brush':item.color);if(item.type==='bucket')color=item.color;updateUI();persist();dirty=true;return true;}}for(const s of scenes.values())for(const a of s.actors||[]){const x=p.x-s.tx*SECTION,y=p.y-s.ty*SECTION,bb=a.box;if(Math.hypot(x-a.x,y-(a.y-25))<26||x>=bb.x&&x<=bb.x+bb.w&&y>=bb.y&&y<=bb.y+bb.h){showDialogue(a,s);return true;}}closeDialogue();return false;}
function segmentDistance(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1)));return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);}
function touches(s,x,y,r){if(s.fill){const lx=x-s.offset.x,ly=y-s.offset.y;return hitContext.isPointInPath(new Path2D(s.region.d),lx,ly);}const p={x,y};if(s.points.length===1)return Math.hypot(x-s.points[0].x,y-s.points[0].y)<r+s.size/2;return s.points.some((a,i)=>i&&segmentDistance(p,s.points[i-1],a)<r+s.size/2);}
function drawingLength(s,x,y,r){if(s.fill||s.erase)return 0;let length=0;for(let i=1;i<s.points.length;i++){const a=s.points[i-1],b=s.points[i];if(segmentDistance({x,y},a,b)<r)length+=Math.min(r*2,Math.hypot(a.x-b.x,a.y-b.y));}return length;}
function findReactions(s){s.triggers=[];if(s.erase)return;for(const scene of scenes.values())for(const e of scene.events){if(unlocked.has(e.id)||e.color&&e.color!==s.color)continue;const ox=scene.tx*SECTION,oy=scene.ty*SECTION,history=()=>[...strokes,s].filter(t=>!t.erase&&(!e.color||t.color===e.color));let hit=false;if(e.type==='complete'){if(!s.fill&&e.anchors.some(p=>touches(s,p.x+ox,p.y+oy,16)))hit=e.anchors.every(p=>history().some(t=>!t.fill&&touches(t,p.x+ox,p.y+oy,16)));}else if(e.type==='draw'){if(!s.fill&&touches(s,e.x+ox,e.y+oy,e.r))hit=history().reduce((sum,t)=>sum+drawingLength(t,e.x+ox,e.y+oy,e.r),0)>=(e.minLength||25);}else hit=touches(s,e.x+ox,e.y+oy,e.r);if(hit){s.triggers.push(e.id);unlocked.add(e.id);}}for(const scene of scenes.values())effects(scene).catch(console.error);}
function rebuild(){strokeIndex.clear();paintTiles.clear();unlocked.clear();strokes.forEach((s,i)=>{indexStroke(s,i);(s.triggers||[]).forEach(id=>unlocked.add(id));});for(const s of scenes.values())effects(s).catch(console.error);dirty=true;updateUI();}
function commit(s){findReactions(s);strokes.push(s);redo=[];indexStroke(s,strokes.length-1);dirty=true;updateUI();persist();}
function finish(){if(active){const s=active;active=null;commit(s);}}
function startStroke(p){if(!canDraw())return;active={color,size:brushSize,erase:tool==='erase',points:[p]};dirty=true;}
function fillAt(p){if(!canDraw())return;const tx=Math.floor(p.x/SECTION),ty=Math.floor(p.y/SECTION),s=scenes.get(key(tx,ty));if(!s)return;for(let i=s.regions.length-1;i>=0;i--){if(hitContext.isPointInPath(s.regionPaths[i],p.x-tx*SECTION,p.y-ty*SECTION)){commit({fill:true,color,region:s.regions[i],offset:{x:tx*SECTION,y:ty*SECTION}});return;}}}
function setMode(next){finish();mode=next;if(next==='draw')penSeen=false;updateUI();}
function pan(dx,dy){camera.x-=dx/SCALE;camera.y-=dy/SCALE;dirty=true;updateScenes();persist();}
function centroid(){const fingers=[...pointers.values()].filter(p=>p.type==='touch');return fingers.length?{x:fingers.reduce((a,p)=>a+p.x,0)/fingers.length,y:fingers.reduce((a,p)=>a+p.y,0)/fingers.length}:null;}
canvas.addEventListener('pointerdown',e=>{
 if(!ready||e.button===2)return;e.preventDefault();canvas.setPointerCapture(e.pointerId);if(e.pointerType==='pen')penSeen=true;
 const p={x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,type:e.pointerType,action:'draw'};pointers.set(e.pointerId,p);
 const touchCount=[...pointers.values()].filter(v=>v.type==='touch').length;
 if(e.pointerType==='touch'&&touchCount>1){active=null;for(const v of pointers.values())if(v.type==='touch')v.action='multi';dirty=true;return;}
 if(e.button===1||mode==='move'||space||e.pointerType==='touch'&&(penSeen||!canDraw())){finish();p.action='pan';canvas.classList.add('dragging');return;}
 if(pick(point(e))){p.action='picked';return;}if(tool==='fill'){fillAt(point(e));p.action='filled';return;}startStroke(point(e));
});
canvas.addEventListener('pointermove',e=>{
 const p=pointers.get(e.pointerId);if(!p)return;e.preventDefault();const old=centroid(),dx=e.clientX-p.x,dy=e.clientY-p.y;p.x=e.clientX;p.y=e.clientY;
 if(p.action==='multi'){const next=centroid();if(old&&next)pan(next.x-old.x,next.y-old.y);return;}
 if(p.action==='pan'){finish();pan(dx,dy);return;}
 if(p.action!=='draw')return;if(!canDraw())return;const samples=e.getCoalescedEvents?.()||[e];for(const sample of samples.length?samples:[e]){const w=point(sample);if(!active)startStroke(w);else{const last=active.points.at(-1);if(Math.hypot(w.x-last.x,w.y-last.y)>.8)active.points.push(w);}}dirty=true;
});
function pointerEnd(e,canceled=false){const p=pointers.get(e.pointerId);if(!p)return;if(p.action==='draw'){if(canceled){active=null;dirty=true;}else finish();}if(!canceled&&p.action==='pan'&&Math.hypot(p.x-p.startX,p.y-p.startY)<8)pick(point(e));pointers.delete(e.pointerId);if(p.action==='multi')for(const remaining of pointers.values())if(remaining.type==='touch')remaining.action='pan';if(!pointers.size)canvas.classList.remove('dragging');}
canvas.addEventListener('pointerup',e=>pointerEnd(e));canvas.addEventListener('pointercancel',e=>pointerEnd(e,true));canvas.addEventListener('lostpointercapture',e=>pointerEnd(e,true));
canvas.addEventListener('wheel',e=>{e.preventDefault();if(e.ctrlKey||e.metaKey)return;finish();const factor=e.deltaMode===1?18:e.deltaMode===2?height:1;const dx=e.shiftKey&&!e.deltaX?e.deltaY:e.deltaX,dy=e.shiftKey&&!e.deltaX?0:e.deltaY;pan(-dx*factor,-dy*factor);},{passive:false});
canvas.addEventListener('contextmenu',e=>e.preventDefault());
function undo(){active=null;if(!strokes.length)return;redo.push(strokes.pop());rebuild();persist();}
function redoStroke(){if(!redo.length)return;strokes.push(redo.pop());rebuild();persist();}
function closeDialogue(){dialogueActor=null;$('dialogue').hidden=true;}
function showDialogue(actor,scene){
 dialogueActor=actor.id;const selected=actor.choices.find(c=>c.id===decisions[actor.id]);$('speaker').textContent=actor.name;$('dialogueText').textContent=selected?.reply||(actor.linked&&unlocked.has(actor.linked)?actor.afterLines:actor.lines);$('dialogueChoices').replaceChildren();
 for(const choice of actor.choices){const button=document.createElement('button');button.textContent=choice.label;button.setAttribute('aria-pressed',decisions[actor.id]===choice.id);button.onclick=()=>{decisions[actor.id]=choice.id;effects(scene).catch(console.error);showDialogue(actor,scene);persist();};$('dialogueChoices').append(button);}
 $('dialogue').hidden=false;
}
function intersection(a,b){const x=Math.max(a.x,b.x),y=Math.max(a.y,b.y),right=Math.min(a.x+a.w,b.x+b.w),bottom=Math.min(a.y+a.h,b.y+b.h);return right>x&&bottom>y?{x,y,w:right-x,h:bottom-y}:null;}
function rememberBox(box){let changed=false;if(!box||!Number.isFinite(box.x+box.y+box.w+box.h)||box.w<=0||box.h<=0)return false;for(let y=Math.floor(box.y/SECTION);y<=Math.floor((box.y+box.h)/SECTION);y++)for(let x=Math.floor(box.x/SECTION);x<=Math.floor((box.x+box.w)/SECTION);x++){const b=intersection(box,{x:x*SECTION,y:y*SECTION,w:SECTION,h:SECTION});if(!b)continue;const k=key(x,y),old=explored.get(k);if(old){const left=Math.min(old.x,b.x),top=Math.min(old.y,b.y),right=Math.max(old.x+old.w,b.x+b.w),bottom=Math.max(old.y+old.h,b.y+b.h);if(left===old.x&&top===old.y&&right===old.x+old.w&&bottom===old.y+old.h)continue;explored.set(k,{x:left,y:top,w:right-left,h:bottom-top});}else explored.set(k,b);changed=true;}return changed;}
function rememberView(){if(!ready)return;const view=bounds();let changed=false;for(const t of visibleSections())if(scenes.has(t.k)){const b=intersection(view,{x:t.x*SECTION,y:t.y*SECTION,w:SECTION,h:SECTION});if(b)changed=rememberBox(b)||changed;}if(changed)persist();}
function exportPlan(entries=[...explored]){if(!entries.length)return null;let x=Infinity,y=Infinity,right=-Infinity,bottom=-Infinity;for(const [,b]of entries){x=Math.min(x,b.x);y=Math.min(y,b.y);right=Math.max(right,b.x+b.w);bottom=Math.max(bottom,b.y+b.h);}const w=right-x,h=bottom-y,max=width<650?4096:8192,scale=Math.min(1,max/w,max/h,Math.sqrt(20000000/(w*h)));return{x,y,w,h,scale,pw:Math.max(1,Math.ceil(w*scale)),ph:Math.max(1,Math.ceil(h*scale))};}
function updateExportInfo(){const plan=$('exportArea').value==='explored'?exportPlan():{pw:Math.round(width*dpr),ph:Math.round(height*dpr),scale:1};$('exportInfo').textContent=plan?`${plan.pw} × ${plan.ph} px${plan.scale<1?' · scaled to fit one PNG':''}`:'Explore a little first.';}
async function exportScene(k){if(scenes.has(k))return scenes.get(k);const [x,y]=k.split(',').map(Number),response=await fetch(`scene/${x}/${y}.json`);if(!response.ok)throw Error('A section could not load. Please try again.');const s=await response.json();[s.bg,s.fg]=await Promise.all([imageFromSVG(s.bg),imageFromSVG(s.fg)]);return s;}
async function buildExploredExport(entries,token,progress=()=>{}){
 const plan=exportPlan(entries);if(!plan)throw Error('Explore a little first.');const out=document.createElement('canvas');out.width=plan.pw;out.height=plan.ph;const c=out.getContext('2d');c.fillStyle=PAPER;c.fillRect(0,0,out.width,out.height);c.setTransform(plan.scale,0,0,plan.scale,-plan.x*plan.scale,-plan.y*plan.scale);
 const paint=document.createElement('canvas');paint.width=paint.height=SECTION;const pc=paint.getContext('2d');let count=0;
 for(const [k,visited]of entries){if(token!==exportToken)throw Error('Export cancelled.');const s=await exportScene(k),sx=s.tx*SECTION,sy=s.ty*SECTION,content=effectContent(s),overlay=content?await imageFromSVG(effectSVG(content)):null;if(token!==exportToken)throw Error('Export cancelled.');
  pc.setTransform(1,0,0,1,0,0);pc.clearRect(0,0,SECTION,SECTION);pc.translate(-sx,-sy);for(const pk of tileKeys({x:sx,y:sy,w:SECTION,h:SECTION})){if(!strokeIndex.has(pk))continue;const [px,py]=pk.split(',').map(Number);pc.drawImage(getPaintTile(pk),px*TILE,py*TILE);}
  c.save();c.beginPath();c.rect(visited.x,visited.y,visited.w,visited.h);c.clip();c.drawImage(s.bg,sx,sy,SECTION,SECTION);c.drawImage(paint,sx,sy);c.drawImage(s.fg,sx,sy,SECTION,SECTION);if(overlay)c.drawImage(overlay,sx,sy,SECTION,SECTION);c.translate(sx,sy);s.items.forEach(i=>drawItem(c,i));c.restore();progress(++count,entries.length);
 }
 return out;
}
async function downloadPicture(){
 finish();const token=++exportToken,area=$('exportArea').value;const entries=[...explored];$('download').disabled=true;$('exportArea').disabled=true;$('exportProgress').textContent='Preparing your picture…';
 try{let out;if(area==='explored')out=await buildExploredExport(entries,token,(n,total)=>{$('exportProgress').textContent=`Drawing your world… ${n} / ${total}`;});else{if(visibleSections().some(t=>!scenes.has(t.k)))throw Error('Wait for the visible area to load, then try again.');await Promise.all(visibleSections().map(t=>effects(scenes.get(t.k))));out=document.createElement('canvas');out.width=Math.round(width*dpr);out.height=Math.round(height*dpr);render(out.getContext('2d'));}
  if(token!==exportToken)return;const blob=await new Promise(resolve=>out.toBlob(resolve,'image/png'));if(token!==exportToken)return;if(!blob)throw Error('This picture could not be saved. Try a smaller view.');const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`somewhere-${area==='explored'?'explored':'view'}.png`;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);$('exportProgress').textContent='Your PNG is ready.';
 }catch(error){if(token===exportToken)$('exportProgress').textContent=error.message;}finally{if(token===exportToken){$('download').disabled=false;$('exportArea').disabled=false;}}
}
async function openStore(){return new Promise((resolve,reject)=>{const req=indexedDB.open('somewhere-paper-world-v1',1);req.onupgradeneeded=()=>req.result.createObjectStore('book');req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}
function transaction(mode,operation){return new Promise((resolve,reject)=>{const tx=db.transaction('book',mode),req=operation(tx.objectStore('book'));let value;req.onsuccess=()=>value=req.result;tx.oncomplete=()=>resolve(value);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});}
function persist(){clearTimeout(saveTimer);if(!db||!ready)return;saveTimer=setTimeout(save,350);}
async function save(){if(!db||!ready)return;try{await transaction('readwrite',s=>s.put({strokes,collected:[...collected],camera,color,brushSize,decisions,explored:[...explored]},'state'));}catch{status('Storage is full. Save a PNG to keep this picture.');}}
async function boot(){try{db=await openStore();const saved=await transaction('readonly',s=>s.get('state'));if(saved){strokes=Array.isArray(saved.strokes)?saved.strokes:[];collected=new Set(saved.collected||[]);decisions=saved.decisions||{};for(const [k,b]of saved.explored||[])explored.set(k,b);if(!saved.explored)for(const s of strokes)rememberBox(strokeBounds(s));if(saved.camera&&Number.isFinite(saved.camera.x)&&Number.isFinite(saved.camera.y))camera=saved.camera;color=COLORS[saved.color]?saved.color:'ink';brushSize=[7,17,32].includes(saved.brushSize)?saved.brushSize:7;}}catch{status('Browser storage is unavailable. Save a PNG before leaving.');}ready=true;rebuild();resize();updateScenes();}
$('draw').onclick=()=>{tool='brush';setMode('draw');};$('move').onclick=()=>setMode('move');$('erase').onclick=()=>{tool=tool==='erase'?'brush':'erase';setMode('draw');};$('fill').onclick=()=>{tool=tool==='fill'?'brush':'fill';setMode('draw');};$('size').onclick=()=>{brushSize=[7,17,32][([7,17,32].indexOf(brushSize)+1)%3];updateUI();persist();};$('undo').onclick=undo;$('redo').onclick=redoStroke;$('home').onclick=home;
$('reset').onclick=()=>{finish();closeDialogue();$('resetDialog').showModal();};$('cancelReset').onclick=()=>$('resetDialog').close();$('confirmReset').onclick=async()=>{clearTimeout(saveTimer);active=null;strokes=[];redo=[];collected.clear();unlocked.clear();explored.clear();decisions={};color='ink';tool='brush';mode='draw';closeDialogue();rebuild();home();await save();$('resetDialog').close();};
$('export').onclick=()=>{finish();closeDialogue();rememberView();$('exportProgress').textContent='';$('exportDialog').showModal();updateExportInfo();};
$('closeDialogue').onclick=closeDialogue;$('exportArea').onchange=updateExportInfo;$('download').onclick=downloadPicture;$('closeExport').onclick=()=>$('exportDialog').close();$('exportDialog').addEventListener('close',()=>{exportToken++;$('download').disabled=false;$('exportArea').disabled=false;});
addEventListener('keydown',e=>{if($('resetDialog').open||$('exportDialog').open)return;const k=e.key.toLowerCase();if(k==='escape'){closeDialogue();return;}if((e.ctrlKey||e.metaKey)&&k==='z'){e.preventDefault();e.shiftKey?redoStroke():undo();}else if(k===' '){e.preventDefault();space=true;finish();updateUI();}else if(k==='h')setMode('move');else if(k==='b'){tool='brush';setMode('draw');}else if(k==='e')$('erase').click();else if(k==='f')$('fill').click();else if(['arrowup','arrowdown','arrowleft','arrowright'].includes(k)){e.preventDefault();pan(k==='arrowleft'?90:k==='arrowright'?-90:0,k==='arrowup'?90:k==='arrowdown'?-90:0);}});
addEventListener('keyup',e=>{if(e.key===' '){space=false;updateUI();}});addEventListener('blur',()=>{finish();pointers.clear();space=false;canvas.classList.remove('dragging');updateUI();save();});addEventListener('resize',resize);document.addEventListener('visibilitychange',()=>{if(document.hidden){finish();save();}});
resize();updateUI();requestAnimationFrame(frame);boot();
