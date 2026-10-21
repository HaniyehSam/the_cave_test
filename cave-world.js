/* Deterministic, spatially generated cave geometry. No repeating tunnel template. */
(function(root){
 const CELL=2600, cache=new Map();
 let worldSeed=731293;
 function setSeed(seed){worldSeed=seed|0;cache.clear();}
 function rngFor(x,y){let n=(Math.imul(x,73856093)+Math.imul(y,19349663)+worldSeed)|0;n=Math.imul(n^(n>>>16),0x45d9f3b);n^=n>>>16;return()=>{n=(Math.imul(n,1664525)+1013904223)|0;return(n>>>0)/4294967296;};}
 function hub(x,y){const r=rngFor(x,y);return{x:x*CELL+(x||y?(r()-.5)*650:0),y:y*CELL+(x||y?(r()-.5)*650:0)};}
 function room(x,y,rx,ry,r){const points=[];const phase=r()*6.28,rotation=r()*6.28;for(let i=0;i<48;i++){const a=i*Math.PI/24,k=1+.12*Math.sin(a*3+phase)+.06*Math.sin(a*7+phase*2),u=Math.cos(a)*rx*k,v=Math.sin(a)*ry*k;points.push([x+u*Math.cos(rotation)-v*Math.sin(rotation),y+u*Math.sin(rotation)+v*Math.cos(rotation)]);}return{kind:'room',x,y,rx,ry,points};}
 function tunnel(a,b,r,narrow=false){const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy),steps=Math.max(6,Math.ceil(len/70)),points=[],phase=r()*6.28,bend=(r()-.5)*Math.min(650,len*.65),base=narrow?22+r()*14:34+r()*57;
 for(let i=0;i<=steps;i++){const t=i/steps,off=Math.sin(t*Math.PI)*bend+Math.sin(t*Math.PI*3+phase)*Math.sin(t*Math.PI)*len*.065;points.push({x:a.x+dx*t-dy/len*off,y:a.y+dy*t+dx/len*off,r:base*(.8+.24*Math.sin(t*9+phase))});}return{kind:'tunnel',points};}
 function region(x,y){const key=x+','+y;if(cache.has(key))return cache.get(key);const r=rngFor(x,y),h=hub(x,y),rooms=[],shapes=[],gates=[],count=x===0&&y===0?7:4+Math.floor(r()*5),profile=Math.floor(r()*4);
 rooms.push(room(h.x,h.y,x===0&&y===0?265:140+r()*170,x===0&&y===0?245:110+r()*160,r));
 for(let i=1;i<count;i++){const angle=r()*Math.PI*2,rad=400+r()*700;rooms.push(room(h.x+Math.cos(angle)*rad,h.y+Math.sin(angle)*rad,profile===0?210+r()*200:70+r()*190,profile===1?60+r()*60:90+r()*190,r));}
 shapes.push(...rooms);
 // Connect each chamber to an earlier nearby chamber, then occasionally make a loop.
 for(let i=1;i<rooms.length;i++){let parent=0,d=Infinity;for(let j=0;j<i;j++){const n=Math.hypot(rooms[i].x-rooms[j].x,rooms[i].y-rooms[j].y);if(n<d){d=n;parent=j;}}shapes.push(tunnel(rooms[parent],rooms[i],r,r()<.4));}
 if(rooms.length>5)shapes.push(tunnel(rooms[1],rooms.at(-1),r,true));
 // Shared edges are generated only by their west/north owner, consistently across tiles.
 shapes.push(tunnel(h,hub(x+1,y),r,r()<.5));
 if(r()<.65||x===0)shapes.push(tunnel(h,hub(x,y+1),r,r()<.5));
 for(let i=0;i<2;i++){const base=rooms[1+i],a=r()*Math.PI*2,tip={x:base.x+Math.cos(a)*(350+r()*400),y:base.y+Math.sin(a)*(350+r()*400)};shapes.push(tunnel(base,tip,r,true));if(i===0)shapes.push(room(tip.x,tip.y,45,55,r));}
 // Black islands/pillars vary the silhouettes of larger chambers.
 const pillars=[];for(const rm of rooms.slice(1))if(rm.rx>180&&rm.ry>150&&r()<.6)pillars.push(room(rm.x+30,rm.y-15,25+r()*35,35+r()*35,r));
 const base=rooms[0];let angle=0,best=-Infinity,reach=850;
 // Prefer a solid-rock sector, rather than placing a secret over an existing tunnel.
 for(let i=0;i<24;i++){const a=i*Math.PI/12+r()*.15,length=700+r()*350;let score=0;
 for(let j=4;j<=12;j++){const px=base.x+Math.cos(a)*length*j/12,py=base.y+Math.sin(a)*length*j/12;if(!shapes.some(s=>contains(s,px,py)))score+=j>9?3:1;}
 if(score>best){best=score;angle=a;reach=length;}}
 const end={x:base.x+Math.cos(angle)*reach,y:base.y+Math.sin(angle)*reach};
 // The cue sits on a chamber wall. The full side passage stays rock until painted.
 const direction={x:Math.cos(angle),y:Math.sin(angle)};
 let distance=20;while(distance<500&&contains(base,base.x+direction.x*distance,base.y+direction.y*distance))distance+=3;
 const mouth={x:base.x+direction.x*(distance-5),y:base.y+direction.y*(distance-5)};
 const branch=[tunnel(mouth,end,r,true),room(end.x,end.y,110+r()*85,90+r()*70,r)];
 const gate={id:'passage:'+key,...mouth,r:34,angle,shapes:branch,end};gates.push(gate);
 const result={rooms,shapes,pillars,gates};cache.set(key,result);if(cache.size>180)cache.delete(cache.keys().next().value);return result;}
 function contains(shape,x,y){if(shape.kind==='room'){let inside=false;const p=shape.points;for(let i=0,j=p.length-1;i<p.length;j=i++)if((p[i][1]>y)!==(p[j][1]>y)&&x<(p[j][0]-p[i][0])*(y-p[i][1])/(p[j][1]-p[i][1])+p[i][0])inside=!inside;return inside;}for(let i=1;i<shape.points.length;i++){const a=shape.points[i-1],b=shape.points[i],dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((x-a.x)*dx+(y-a.y)*dy)/(dx*dx+dy*dy||1)));if(Math.hypot(x-a.x-t*dx,y-a.y-t*dy)<a.r+(b.r-a.r)*t)return true;}return false;}
 function near(area){const results=[];for(let y=Math.floor((area.y+CELL/2)/CELL)-1;y<=Math.floor((area.y+area.h+CELL/2)/CELL)+1;y++)for(let x=Math.floor((area.x+CELL/2)/CELL)-1;x<=Math.floor((area.x+area.w+CELL/2)/CELL)+1;x++)results.push(region(x,y));return results;}
 function carve(c,shape){if(shape.kind==='room'){c.beginPath();shape.points.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.closePath();c.fill();return;}const p=shape.points;for(let i=0;i<p.length;i++){const a=p[i];c.beginPath();c.arc(a.x,a.y,a.r,0,Math.PI*2);c.fill();if(!i)continue;const b=p[i-1],len=Math.hypot(a.x-b.x,a.y-b.y),nx=-(a.y-b.y)/len,ny=(a.x-b.x)/len;c.beginPath();c.moveTo(b.x+nx*b.r,b.y+ny*b.r);c.lineTo(a.x+nx*a.r,a.y+ny*a.r);c.lineTo(a.x-nx*a.r,a.y-ny*a.r);c.lineTo(b.x-nx*b.r,b.y-ny*b.r);c.closePath();c.fill();}}
 const api={CELL,region,near,contains,carve,setSeed};if(typeof module!=='undefined')module.exports=api;else root.CaveWorld=api;
})(typeof globalThis!=='undefined'?globalThis:this);

