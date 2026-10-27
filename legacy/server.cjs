const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const {scene}=require('./world.cjs');
const root=__dirname,mime={'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.png':'image/png'};
const server=http.createServer((req,res)=>{
 let name;try{name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400);return res.end();}
 const tile=name.match(/^\/scene\/(-?\d+)\/(-?\d+)\.json$/);
 if(tile){const [x,y]=tile.slice(1).map(Number);if(!Number.isSafeInteger(x)||!Number.isSafeInteger(y)||Math.abs(x)>1e9||Math.abs(y)>1e9){res.writeHead(400);return res.end();}res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-cache'});return res.end(JSON.stringify(scene(x,y)));}
 if(!['/','/index.html','/app.js','/style.css','/mobile-preview.html'].includes(name)){res.writeHead(404);return res.end('Not found');}
 const file=path.join(root,name==='/'?'index.html':name.slice(1));fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);return res.end('Not found');}res.writeHead(200,{'Content-Type':mime[path.extname(file)],'Cache-Control':'no-cache'});res.end(data);});
});
if(require.main===module)server.listen(Number(process.env.PORT)||5174,'127.0.0.1',()=>console.log('Somewhere: http://127.0.0.1:5174'));
module.exports=server;
