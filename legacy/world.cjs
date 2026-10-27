// Continuous vector world. Geometry is generated only for requested sections.
const {enrich,district}=require('./world-details.cjs');
const S=960,PAPER='#f8f7f2',INK='#292824';
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;');
const path=(d,extra='')=>`<path d="${d}" ${extra}/>`;
const rect=(x,y,w,h,extra='')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" ${extra}/>`;
const circle=(x,y,r,extra='')=>`<circle cx="${x}" cy="${y}" r="${r}" ${extra}/>`;
const ellipse=(x,y,rx,ry,extra='')=>`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" ${extra}/>`;
const text=(x,y,s,size=12,extra='')=>`<text x="${x}" y="${y}" font-size="${size}" ${extra}>${esc(s)}</text>`;
const group=(x,y,s,more='')=>`<g transform="translate(${x} ${y})" ${more}>${s}</g>`;
const solid=`fill="${INK}"`,white=`fill="${PAPER}"`;
const svg=s=>`<svg xmlns="http://www.w3.org/2000/svg" width="960" height="960" viewBox="0 0 960 960"><g fill="none" stroke="${INK}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${s}</g></svg>`;
const label=(x,y,s,size=12)=>text(x,y,s,size,`fill="${INK}" stroke="none" font-family="monospace" letter-spacing="1.8"`);
function random(seed){return()=>{seed=Math.imul(seed,1664525)+1013904223|0;return(seed>>>0)/4294967296;};}
function person(x,y,pose=0,scale=1){return `<g transform="translate(${x} ${y}) scale(${scale})">`+circle(0,-37,7,white)+path('M-4 -43 Q0 -49 6 -41',solid)+path('M0 -30 L-3 -9 M-3 -9 L-12 11 M-3 -9 L10 8 M-1 -24 L-14 -14 M-1 -24 L13 -27')+(pose?path('M13 -27 L23 -37'):'')+path('M-12 11 l-7 0 M10 8 l7 0')+'</g>';}
function cat(x,y){return group(x,y,path('M-14 9 Q-19 -4 -10 -12 L-12 -23 L-2 -17 L7 -22 L10 -10 Q20 6 8 11 Z',white)+path('M10 9 Q31 11 28 -6 M-8 -6 h2 M3 -6 h2 M-3 -1 l3 1 M-15 -3 l-9 -3 M9 -3 l9 -3'));}
function pot(x,y,w=32){return group(x,y,path(`M${-w/2} 0 H${w/2} L${w/2-4} 23 H${-w/2+4} Z`,white)+path('M0 0 V-27 M0 -12 Q-22 -29 -17 -12 Q-8 -7 0 -9 M0 -22 Q13 -43 20 -28 Q10 -15 0 -18'));}
function chair(x,y){return group(x,y,path('M0 0 L-3 -44 L28 -44 L28 0 M-3 -11 H31 M0 0 l-4 23 M27 0 l5 23 M3 -38 v23 M10 -38 v23 M18 -38 v23 M25 -38 v23'));}
function bicycle(x,y){return group(x,y,circle(-32,0,22)+circle(32,0,22)+path('M-32 0 L-10 -32 L6 0 Z M6 0 L24 -30 L-10 -32 M24 -30 L32 0 M24 -30 l-4 -14 h14 M-10 -32 l-3 -7 h-9 M-17 -39 h17 M6 0 l10 8'));}
function bookshelf(x,y){let s=rect(0,0,122,94);for(let row=0;row<3;row++){s+=path(`M0 ${row*31+30} h122`);for(let i=0;i<10;i++){let h=17+(i*7+row*3)%12;s+=rect(i*11+5,row*31+29-h,7,h);}}return group(x,y,s);}
function windowAt(x,y,w=45,h=64){return group(x,y,rect(0,0,w,h)+rect(4,4,w-8,h-8)+path(`M${w/2} 4 v${h-8} M4 ${h*.46} h${w-8} M-4 ${h+4} h${w+8}`));}
function lamp(x,y){return group(x,y,path('M0 0 v-65 M-15 0 h30 M-23 -65 h46 l-12 -35 h-22 Z'));}
function brick(x,y,w,h){let out='';for(let j=0;j<h;j+=17){out+=path(`M${x} ${y+j} h${w}`,'stroke-width=".5" stroke="#a3a19a"');for(let i=(j/17%2)*19;i<w;i+=38)out+=path(`M${x+i} ${y+j} v17`,'stroke-width=".5" stroke="#a3a19a"');}return out;}
function tree(x,y,scale=1){let s=path('M-15 0 Q-30 -90 -9 -178 L-43 -237 M-9 -178 Q4 -215 5 -291 M-9 -160 L48 -228 M-18 -101 L-75 -163 M-15 0 Q20 -81 15 -170 L60 -203 M15 -170 L20 -267 M-75 -163 L-91 -207 M48 -228 L64 -267','stroke-width="2.4"');s+=path('M-91 -125 Q-137 -118 -129 -160 Q-167 -190 -133 -216 Q-154 -253 -113 -269 Q-116 -306 -77 -307 Q-67 -344 -30 -326 Q8 -370 40 -331 Q90 -346 100 -306 Q145 -302 133 -262 Q173 -230 141 -200 Q158 -157 118 -151 Q96 -117 60 -143 M-105 -244 q13 -15 25 -8 M69 -290 q22 4 20 23 M-70 -285 q-6 -16 10 -23 M96 -190 q18 -5 23 9 M-91 -152 q-8 -17 6 -24','stroke-width="1.2"');for(let i=0;i<22;i++){let a=-105+(i*71%218),b=-155-(i*43%163);s+=path(`M${a} ${b} q-5 -8 -10 -4 M${a} ${b} q8 -10 13 -5`,'stroke-width=".6"');}return `<g transform="translate(${x} ${y}) scale(${scale})">${s}</g>`;}
function panel(){return '';}
function cityScene(tx,ty){const rnd=random(Math.imul(tx,78437)^Math.imul(ty,34679)^7291),kind=district(tx);let bg='',fg='',events=[],regions=[],items=[];
 const add=(id,type,x,y,r,color,after,extra={})=>events.push({id:`${tx},${ty}:${id}`,type,x,y,r,color,after,...extra});
 const colorable=(id,d,x,y,w,h)=>regions.push({id:`${tx},${ty}:${id}`,d,x,y,w,h});
 const ink=colorsForScene(kind);
 if(ty===0){
  bg+=panel(30,140,440,574,-.7)+panel(485,218,438,492,.8);
  fg+=path('M0 720 Q155 716 320 720 T640 720 T960 720 M0 750 H960','stroke-width="2.6"');
  fg+=path('M0 773 H960','stroke="#9b9890" stroke-width=".7"');
  for(let i=0;i<24;i++){let x=i*43+(tx%2)*11;fg+=path(`M${x} 720 l-7 30`,'stroke-width=".7"');}
  if(kind===0){
   // Tall narrow street facade, assembled beside an open apartment section.
   bg+=rect(73,252,218,462,`fill="#eeede7" stroke="none"`)+rect(306,226,280,488,`fill="#fffefa" stroke="none"`);
   fg+=path('M67 713 V249 L89 249 V224 H112 V197 H149 V180 H207 V197 H245 V224 H274 V249 H296 V713 M62 252 H301 M69 260 H290','stroke-width="2.5"');
   fg+=path('M150 180 V164 H207 V180 M157 164 V155 H200 V164 M139 208 H219 M93 274 H272 M90 534 H275');
   for(let row=0;row<3;row++)for(let col=0;col<2;col++)fg+=windowAt(101+col*100,290+row*81,62,62);
   fg+=rect(90,556,189,26,white)+label(110,574,'REPAIR / REIMAGINE',9)+rect(91,596,103,111)+rect(208,596,66,117)+path('M199 590 v124 M212 606 h58 M214 663 h7');
   fg+=path('M97 605 H185 M97 678 H185 M100 620 l15 22 l-9 20 M129 610 v59 M144 622 h27 M156 612 v43');
   fg+=label(105,698,'OPEN, USUALLY',7)+cat(242,545)+bicycle(60,688);
   // Rooftop, floor slabs and a continuous cutaway.
   fg+=path('M303 713 V225 L441 153 L590 225 V713 M298 227 H597 M307 385 H585 M307 546 H585 M307 708 H585','stroke-width="3.6"');
   fg+=path('M441 153 V135 M409 135 H472 M441 135 L416 115 M441 135 L464 112 M317 235 H573','stroke-width="1.5"');
   fg+=path('M317 385 v-11 h256 M317 546 v-11 h256','stroke-width=".8"');
   // Attic bedroom with empty picture frame, record player and sloping ceiling.
   fg+=rect(330,323,104,42)+path('M328 365 v16 M435 365 v16 M330 323 v-21 h104 v21 M336 312 q15 -15 32 0 v9 h-32 Z M376 309 h50 v15 M335 342 h95');
   fg+=rect(491,279,66,58)+rect(497,285,54,46,'stroke-dasharray="2 5" stroke="#aaa59c"')+label(505,348,'?',11);
   colorable('attic-picture','M498 286 H550 V330 H498 Z',498,286,52,44);
   colorable('bed-blanket','M369 325 H432 V364 H332 V341 H369 Z',332,325,100,39);
   colorable('fridge','M506 410 H561 V529 H506 Z',506,410,55,119);
   colorable('cupboard','M324 492 H440 V530 H324 Z',324,492,116,38);
   fg+=rect(466,357,102,18)+path('M474 375 v10 M560 375 v10')+ellipse(489,353,17,4)+path('M515 357 v-21 h25 v21 M538 336 l10 -12');
   // Kitchen: tiles, coffee, a fridge and a pipe that might be a face.
   fg+=rect(323,476,118,55)+path('M325 491 h115 M380 491 v40 M336 500 h13 M399 500 h13')+ellipse(351,469,24,6)+path('M351 462 v-17 q12 -8 16 2 M412 470 v-22 h17 v22 Z M429 451 q15 0 0 13');
   fg+=rect(505,409,57,121)+path('M506 456 h56 M515 422 v22 M515 469 v24')+rect(513,416,15,13)+label(515,425,'x',8);
   fg+=path('M331 424 h106 M339 424 v-16 h9 v16 M360 424 v-24 h12 v24 M394 424 v-14 h16 v14');
   fg+=chair(465,507)+person(472,495,0,.68);
   // Living room: room for the player's rug, poster, and pet.
   fg+=bookshelf(329,562)+lamp(562,697)+path('M464 687 v-40 q-5 -14 10 -14 h39 q15 0 13 14 v40 M464 677 h62 M472 687 v16 M518 687 v16 M474 636 v-24 h41 v24');
   fg+=ellipse(417,690,49,13,'stroke-dasharray="3 6" stroke="#9b978b"')+path('M333 673 h41 v-15 h-41 Z M338 674 v26 M367 674 v26');
   colorable('rug','M368 690 a49 13 0 1 0 98 0 a49 13 0 1 0 -98 0',368,677,98,26);
   fg+=pot(645,692,34)+path('M620 714 h49 M652 670 q14 -17 27 -8');
   add('plant','color',645,668,32,'green',group(645,665,path('M0 12 Q-12 -83 11 -114 M0 -28 Q-54 -66 -45 -32 Q-23 -8 0 -18 M4 -60 Q44 -104 52 -67 Q35 -37 4 -43 M8 -91 Q-23 -133 -30 -108 Q-27 -87 8 -80', 'fill="#f8f7f2"')+circle(11,-114,8)));
   // Garage face: its blank shutter is an invitation, not a prewritten task.
   fg+=path('M700 714 V454 L797 417 L914 454 V714 M712 713 V480 H901 V713 M695 455 H919','stroke-width="2.5"');
   for(let y=491;y<710;y+=14)fg+=path(`M716 ${y} h181`,'stroke-width=".7"');
   fg+=ellipse(760,463,16,8)+ellipse(850,463,16,8)+path('M729 714 v-32 q5 -9 10 0 v32 M871 714 v-32 q5 -9 10 0 v32');
   add('garage','color',800,579,66,null,ellipse(761,463,4,5,solid)+ellipse(849,463,4,5,solid)+path('M769 605 Q800 637 835 605','stroke-width="3"')+path('M730 715 q-20 30 -51 21 M879 715 q20 29 45 16','stroke-width="4"'));
   colorable('garage','M715 481 H898 V710 H715 Z',715,481,183,229);
   fg+=person(611,707,1,.85)+path('M602 657 q10 -12 20 -5')+label(725,445,'SMALL REPAIRS',9);
  }else if(kind===1){
   // Park with a huge tree, treehouse, incomplete swing, kiosk and varied urban details.
   bg+=panel(63,94,560,620,1.2);fg+='<defs><clipPath id="treehouse-cutout"><path clip-rule="evenodd" d="M0 0H960V960H0Z M240 342V221L355 160L480 221V342Z"/></clipPath></defs><g clip-path="url(#treehouse-cutout)">'+tree(370,714,1.75)+'</g>';
   fg+=path('M242 338 V222 L355 163 L476 222 V341 M236 224 H484 M245 340 H480','stroke-width="2.6"');
   fg+=windowAt(266,240,61,60)+rect(357,235,82,105)+path('M363 244 v86 M432 244 v86 M351 341 l-36 173 M372 341 l-36 173');
   for(let i=0;i<9;i++)fg+=path(`M${350-i*4} ${350+i*19} h20`);
   fg+=cat(303,216)+label(371,294,'ROOM',10)+label(370,309,'FOR YOU',10);
   fg+=path('M495 338 v66 M561 336 v66 M490 506 h77 v9 h-77 Z')+path('M495 405 V505 M561 405 V505','stroke-dasharray="2 8" stroke="#bab7ae"');
   add('swing','complete',528,458,65,null,person(529,505,0,.8)+path('M495 337 V506 M561 336 V506','stroke-width="2"'),{anchors:[{x:495,y:410},{x:495,y:495}]});
   fg+=path('M77 715 V539 H210 V715 M63 539 L142 475 L224 539 Z','stroke-width="2"')+rect(91,555,104,96)+label(100,574,'LOST &',12)+label(102,592,'FOUND',12);
   fg+=cat(124,641)+circle(170,618,12)+path('M163 617 h15 M170 611 v14')+label(107,689,'TAKE A LOOK',8);
   fg+=path('M658 711 V472 L781 424 L919 472 V711 M649 473 H927','stroke-width="2.4"');
   fg+=rect(674,490,225,126)+path('M747 490 v126 M823 490 v126 M674 550 h225')+label(694,653,'NIGHT SCHOOL',13)+label(713,674,'FOR BIRDS',12);
   for(let i=0;i<5;i++){fg+=group(696+i*39,594,ellipse(0,0,9,11,white)+circle(5,-11,6,white)+path('M10 -11 l8 2 l-8 2 M-3 10 v8 M2 11 v7'));}
   fg+=chair(711,703)+chair(812,703)+bicycle(597,690)+person(897,707,0,.8);
   colorable('treehouse','M246 225 H475 V337 H246 Z',246,225,229,112);
  }else if(kind===2){
   // A station/market collage, plus a shop whose windows can become eyes.
   fg+=path('M52 714 V316 H611 V714 M39 315 H627 M63 309 V271 H602 V309','stroke-width="2.5"')+label(177,297,'THE LONG WAY HOME',15);
   for(let i=0;i<4;i++){let x=76+i*134;fg+=path(`M${x} 713 V420 a51 51 0 0 1 102 0 V713 M${x+8} 711 V422 a43 43 0 0 1 86 0 V711`);fg+=path(`M${x} 540 h102 M${x+51} 370 v170`);}
   fg+=circle(329,344,20)+path('M329 329 v15 l11 7')+person(125,690,1,.8)+person(274,698,0,.9)+person(421,693,0,.85);
   fg+=path('M192 706 v-57 h31 v57 M186 706 h43 M233 705 l16 -30 h23 l15 30 Z');
   for(let i=0;i<11;i++)fg+=path(`M${74+i*47} 259 v-15 h22 v15`);
   fg+=path('M680 711 V260 L776 208 L907 260 V711 M676 261 H913 M685 436 H904','stroke-width="2.5"');
   fg+=windowAt(700,299,63,82)+windowAt(818,299,63,82)+rect(699,469,188,26)+label(720,487,'ODD / ENDS',12);
   fg+=rect(704,518,174,131)+path('M705 618 h172 M758 518 v131 M824 518 v131')+path('M703 711 v-43 h174 v43 M692 658 h198');
   add('shop','color',787,570,70,null,circle(732,344,10,solid)+circle(850,344,10,solid)+path('M749 640 Q790 677 836 640','stroke-width="3"'));
   fg+=pot(657,691)+bicycle(628,697)+cat(869,700);
   colorable('awning','M699 469 H887 V495 H699 Z',699,469,188,26);
  }else if(kind===3){
   // A canal, a bridge and a tiny houseboat assembled from separate paper scraps.
   bg+=panel(87,411,758,294,-1.1);
   fg+=path('M32 605 Q480 505 928 605 M32 619 Q480 519 928 619 M80 720 V610 M880 720 V610','stroke-width="3"');
   for(let i=0;i<21;i++){let x=45+i*43,y=605-83*Math.sin((x/960)*Math.PI);fg+=path(`M${x} ${y} v-50 M${x} ${y-50} q22 -5 43 -8`);}
   fg+=path('M340 696 l26 33 h245 l43 -33 Z M376 695 V634 h203 v61 M368 635 L404 603 H558 L590 635','stroke-width="2"')+windowAt(393,648,45,35)+windowAt(510,648,45,35)+rect(458,645,35,51)+pot(570,610,20)+cat(409,604);
   for(let i=0;i<9;i++){let x=80+i*99;fg+=path(`M${x} ${680+i%3*22} q18 -8 36 0 t36 0`,'stroke-width=".8"');}
   fg+=path('M127 537 V270 M116 272 H139 M127 285 Q165 280 166 310 V333 M151 334 H180 L173 311 H158 Z','stroke-width="2"')+person(212,542,1,.9)+bicycle(733,551)+person(661,536,0,.8);
   fg+=path('M213 509 l88 -102 M300 407 q44 18 30 77','stroke-dasharray="3 7" stroke="#a8a395"');
   add('fishing','complete',268,454,70,null,path('M213 509 L301 407 Q345 425 330 485')+group(330,489,path('M0 -7 Q-19 -5 -9 10 Q4 18 10 1 L20 5 L14 -7 L9 -1 Z')+circle(0,-2,1.5,solid)),{anchors:[{x:232,y:486},{x:288,y:422}]});
   fg+=tree(824,527,.8)+path('M68 500 V396 H149 V500 M74 407 H143 M76 418 H140 M76 430 H140 M76 442 H140 M76 454 H140')+label(81,481,'BOATS',8);
   colorable('houseboat','M377 636 H578 V694 H377 Z',377,636,201,58);
   colorable('boat-hull','M342 697 H651 L610 728 H368 Z',342,697,309,31);
   add('river','color',470,680,70,'blue',path('M415 670 q18 -8 36 0 t36 0 M501 684 q18 -8 36 0')+group(681,685,path('M-17 0 Q0 -18 18 0 Q0 18 -17 0 L-29 -11 V11 Z')+circle(10,-3,2,solid)));
  }else if(kind===4){
   // A glasshouse with a cafe, seed drawers and a very unfinished flowerbed.
   bg+=panel(125,235,620,470,.7);
   fg+=path('M146 714 V351 L434 190 L735 351 V714 M136 352 H745 M146 493 H735 M146 704 H735','stroke-width="2.5"');
   for(let i=0;i<6;i++){let x=171+i*106;fg+=path(`M${x} 351 V703 M${x} 351 L434 190`,'stroke-width="1"');}
   fg+=path('M176 663 H360 M184 664 V706 M351 664 V706')+pot(215,634,39)+pot(278,640,25)+pot(331,637,28);
   fg+=rect(509,606,196,91)+path('M509 630 h196 M509 652 h196 M509 674 h196 M560 606 v91 M610 606 v91 M659 606 v91');
   for(let row=0;row<4;row++)for(let col=0;col<4;col++)fg+=path(`M${524+col*49} ${618+row*22} h13`);
   fg+=label(539,588,'SEEDS & STORIES',10)+ellipse(437,614,47,12)+path('M437 626 V705')+chair(378,676)+chair(488,676)+person(380,663,0,.8)+path('M422 601 v-14 h15 v14 M435 590 q15 0 0 9');
   fg+=path('M186 534 v-27 M215 534 v-38 M244 534 v-24 M274 534 v-33 M182 535 h112','stroke-dasharray="2 5" stroke="#aaa"');
   add('flowers','color',235,520,60,null,Array.from({length:4},(_,i)=>group(186+i*29,507-i%2*11,circle(0,0,5)+ellipse(0,-11,6,9)+ellipse(11,0,9,6)+ellipse(0,11,6,9)+ellipse(-11,0,9,6))).join(''));
   fg+=label(343,329,'A GROWING COLLECTION',12)+pot(792,687,52)+tree(86,716,1.1)+cat(684,594);
   colorable('greenhouse-sign','M331 305 H536 V338 H331 Z',331,305,205,33);
   colorable('greenhouse-pot','M196 634 H234 L230 657 H200 Z',196,634,38,23);
  }else if(kind===5){
   // Six open rooms in a narrow, slightly improbable boarding house.
   bg+=panel(240,91,423,624,-.9);
   fg+=path('M252 714 V179 L452 93 L656 179 V714 M246 181 H662 M253 357 H657 M253 529 H657 M451 182 V714','stroke-width="3"');
   fg+=bookshelf(279,235)+chair(324,332)+lamp(418,346)+cat(352,343)+rect(493,251,130,69)+ellipse(553,286,38,26,'stroke-dasharray="3 7" stroke="#aaa"');
   fg+=label(511,336,'PORTRAIT OF…',8)+path('M281 489 v-36 h134 v36 M288 489 v32 M407 489 v32 M291 443 h33 v12 M330 444 h72 M281 454 v-31 M414 454 v-31');
   fg+=rect(487,449,132,65)+path('M490 470 H618 M550 471 V514 M494 459 h30 M574 459 h30')+pot(509,418,26)+pot(590,418,33);
   fg+=chair(310,672)+chair(389,672)+ellipse(350,625,45,14)+path('M350 638 v70')+person(310,657,1,.9);
   fg+=rect(495,555,115,137)+path('M503 565 h99 v32 H503 Z M511 612 h13 v33 h-13 Z M542 612 h13 v33 h-13 Z M573 612 h13 v33 h-13 Z')+label(513,584,'MOON RADIO',9);
   fg+=path('M672 684 V390 M672 411 h43 M714 411 v273 M673 443 h41 M673 474 h41 M673 505 h41 M673 536 h41 M673 567 h41 M673 598 h41 M673 629 h41 M673 660 h41');
   fg+=bicycle(180,690)+tree(816,716,1.1)+person(732,710,1,.85);
   add('portrait','color',552,286,40,null,ellipse(552,278,15,21)+path('M523 309 q29 -20 59 0 M544 274 h3 M557 274 h3 M548 289 q5 6 10 -1'));
   add('radio','color',553,636,42,'gold',path('M618 592 q38 -12 14 -39 M649 587 q41 -20 20 -57 M629 555 l22 -9 v-23 l-22 8 Z')+circle(631,555,5,solid));
   colorable('portrait','M495 253 H620 V318 H495 Z',495,253,125,65);
   colorable('bed','M283 456 H413 V488 H283 Z',283,456,130,32);
  }
  // Common rooftop laundry, wires and air: some fragments read as living things.
  fg+=path('M0 105 Q250 161 480 110 T960 105','stroke-width="1"');
  for(let i=0;i<5;i++){let x=535+i*52;fg+=path(`M${x} 112 l-6 36 h26 l-3 -33 M${x+3} 111 v10 M${x+14} 112 v8`);}
  fg+=path('M88 737 q24 10 41 0 M742 738 q18 9 32 0','stroke="#777" stroke-width="1"');
  // Cross-section below the street begins here and continues into the next band.
  fg+=path('M0 900 H960 M0 906 H960','stroke-width="2"');
  for(let i=0;i<6;i++){let x=40+i*150;fg+=path(`M${x} 908 q40 23 5 52 M${x+18} 925 l34 18`,'stroke-width="1" stroke="#777"');}
  fg+=rect(435,866,75,21)+path('M445 872 h55 M445 879 h55')+path('M471 887 v73','stroke-width="3"');
  if(tx===0){items.push({id:'brush',type:'brush',x:354,y:648},{id:'ink',type:'bucket',color:'ink',x:394,y:648});}
  else if(kind<6)items.push({id:`pigment:${tx},0`,type:'bucket',color:ink,x:[568,157,568,462,674,406][kind],y:[697,630,697,682,590,438][kind]});
 }else if(ty<0){
  const deep=-ty;
  bg+=panel(80,210,650,450,tx%2?1.5:-1.5);
  for(let i=0;i<5;i++){let x=80+i*185,y=170+(i%3)*140;fg+=group(x,y,path('M-58 20 Q-85 -3 -55 -22 Q-52 -63 -15 -41 Q18 -76 36 -34 Q84 -38 76 3 Q102 35 60 35 H-45 Z'));}
  fg+=group(280,520,path('M-140 0 Q-90 -65 35 -46 Q132 -50 170 10 Q95 72 -10 49 Q-92 45 -140 0 L-188 -44 L-178 45 Z')+circle(117,-4,5,solid)+path('M131 19 q-16 16 -36 0 M12 -40 Q10 -81 45 -93 M45 -93 q30 -18 45 5 M24 -51 q-32 -33 -43 -8'));
  fg+=path('M140 520 L79 639 M402 520 L467 648 M73 642 L473 650','stroke-dasharray="3 8" stroke="#b5b0a5"');
  add('sky-whale','complete',106,579,75,null,path('M140 520 L79 639 M402 520 L467 648 M73 642 L473 650')+person(265,645,1),{anchors:[{x:133,y:533},{x:85,y:625}]});
  fg+=group(719,520,ellipse(0,-82,62,84)+path('M-43 -23 l14 72 h58 l14 -72 M-29 49 v35 h58 v-35 Z M-20 58 v17 M-10 58 v17 M0 58 v17 M10 58 v17 M20 58 v17')+person(0,59,1,.65));
  add('rain','color',450,450,50,'blue',path('M415 499 l-14 30 M450 505 l-14 30 M485 499 l-14 30 M520 505 l-14 30 M437 551 l-14 30 M477 552 l-14 30')+group(484,601,path('M-28 0 Q0 -27 28 0 Z M0 0 v36 q0 12 -12 8',white)));
  colorable('rain-cloud','M392 470 Q365 447 395 428 Q398 387 435 409 Q468 374 486 416 Q534 412 526 453 Q552 485 510 485 H405 Z',365,374,187,111);
  colorable('balloon','M719 354 a62 84 0 1 0 0 168 a62 84 0 1 0 0 -168',657,354,124,168);
  items.push({id:`sky-paint:${tx},${ty}`,type:'bucket',color:tx%2?'blue':'gold',x:724,y:587});
 }else{
  bg+=panel(45,65,560,690,-.8)+panel(632,150,278,595,1);
  fg+=path('M0 80 H960 M0 84 H960','stroke-width="2"');
  for(let i=0;i<6;i++){let x=35+i*165;fg+=path(`M${x} 0 q-14 46 25 80 q28 82 -15 135 M${x+20} 97 l-45 55 M${x+18} 149 l32 34`);}
  fg+=path('M57 720 V308 Q78 237 174 236 H497 Q586 242 592 319 V720 M49 722 H603','stroke-width="3"');
  fg+=path('M79 720 V327 Q79 263 175 263 H493 Q568 268 568 327 V720');
  fg+=brick(87,330,476,39)+path('M91 672 H559 M91 693 H559 M91 706 H559','stroke-width="2"');
  for(let i=0;i<13;i++)fg+=path(`M${100+i*36} 680 l-8 42`);
  fg+=path('M106 655 V465 Q106 420 148 420 H506 Q547 424 547 465 V655 Z')+path('M114 470 H538 M114 596 H538 M173 420 V655 M438 420 V655');
  for(let i=0;i<4;i++){fg+=rect(192+i*56,492,43,55)+person(215+i*56,546,i%2,.58);}
  fg+=circle(156,657,17,solid)+circle(493,657,17,solid)+label(222,629,'NEXT STOP: MAYBE',11);
  fg+=path('M665 724 V309 L880 302 V724 M653 727 H896 M669 486 H883','stroke-width="2"')+bookshelf(700,337)+chair(758,461)+lamp(853,473)+cat(739,473);
  fg+=path('M699 696 v-87 h151 v87 M695 613 h159 M713 627 h38 v32 h-38 Z M773 626 h63 v34 h-63 Z')+label(712,686,'ROOT POST',12)+pot(855,688);
  fg+=group(778,233,ellipse(0,0,54,35)+path('M-44 -18 l-30 -26 M-25 -30 l-17 -34 M-2 -34 l-4 -38 M23 -30 l14 -33 M45 -16 l27 -22 M-36 9 q35 30 72 0'));
  fg+=path('M639 110 q30 84 2 124 q-29 58 2 92 M640 185 q-66 -26 -82 0 M641 257 q44 -30 63 -8');
  add('fossil','color',778,233,50,null,circle(760,222,4,solid)+circle(792,222,4,solid)+path('M757 241 q24 24 43 -3')+label(734,291,'still here.',10));
  add('root-letter','color',785,648,57,'coral',group(786,580,rect(-33,-22,66,43,white)+path('M-33 -22 L0 4 L33 -22 M-33 21 L-10 1 M33 21 L10 1')));
  colorable('train','M115 471 H537 V595 H115 Z',115,471,422,124);
  fg+=label(80,779,ty===1?'THE THINGS WE FORGOT ARE BUSY DOWN HERE':'UNDER THE UNDERNEATH',10);
  items.push({id:`below-paint:${tx},${ty}`,type:'bucket',color:tx%2?'coral':'lavender',x:844,y:457});
 }
 // Sparse paper grain stays beneath all marks, and does not bloat the scene DOM.
 for(let i=0;i<75;i++)bg+=circle(Math.round(rnd()*960),Math.round(rnd()*960),.45,'fill="#c5c2b7" stroke="none" opacity=".35"');
 const s=enrich({tx,ty,kind,bg,fg,items,events,regions,actors:[]},{path,rect,circle,ellipse,label,group,person,cat,pot,chair,bicycle,bookshelf,windowAt,lamp,tree,white,solid});
 return{...s,size:S,bg:svg(s.bg),fg:svg(s.fg),band:ty<0?'Above':ty>0?'Below':'Street'};
}
function colorsForScene(kind){return['coral','green','blue','coral','green','coral'][kind];}
module.exports={scene:cityScene,size:S,svg};
