const fs=require('node:fs'),path=require('node:path'),world=require('./world.cjs');
const directory=path.join(__dirname,'artwork');fs.mkdirSync(directory,{recursive:true});
for(const [name,x,y]of [['first-street',0,0],['treehouse',1,0],['station',2,0],['canal',3,0],['greenhouse',4,0],['boarding-house',5,0],['garage',6,0],['bakery-and-post',7,0],['cinema-and-laundry',8,0],['orchard-and-pond',9,0],['school-and-music',10,0],['observatory-and-library',11,0],['sky',0,-1],['air-mail',1,-1],['sky-garden',2,-1],['constellations',3,-1],['underneath',0,1],['mushroom-kitchen',1,1],['waterworks',2,1],['fossil-archive',3,1]]){
 const s=world.scene(x,y);
 fs.writeFileSync(path.join(directory,name+'.svg'),'<svg xmlns="http://www.w3.org/2000/svg" width="960" height="960" viewBox="0 0 960 960"><rect width="960" height="960" fill="#f8f7f2"/>'+s.bg+s.fg+world.svg(s.actors.map(a=>a.bubbleBefore).join(''))+'</svg>');
}
