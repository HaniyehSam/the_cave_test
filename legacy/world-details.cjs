// Situations belong to stable world coordinates, independently of tile lifetime.
function district(x){if(x>=0&&x<12)return x;let n=Math.imul(x,0x45d9f3b);n=Math.imul(n^(n>>>16),0x45d9f3b);return((n^(n>>>16))>>>0)%12;}
function enrich(s,h){
 const {path:p,rect:r,circle:c,ellipse:el,label:l,group:g,person,cat,pot,chair,bicycle,bookshelf,windowAt,lamp,tree,white,solid}=h;
 const {tx,ty,kind}=s,uid=id=>`${tx},${ty}:${id}`,f=art=>s.fg+=art,b=art=>s.bg+=art;
 const guide=d=>p(d,'stroke="#a39e93" stroke-dasharray="2 6"');
 const region=(id,d,x,y,w,hh)=>s.regions.push({id:uid(id),d,x,y,w,h:hh});
 const event=(id,type,x,y,after,extra={})=>{s.events.push({id:uid(id),type,x,y,r:35,color:null,after,...extra});return uid(id);};
 const finish=(id,anchors,after)=>{const e=event(id,'complete',anchors[0][0],anchors[0][1],after,{anchors:anchors.map(([x,y])=>({x,y}))});return e;};
 const sparkle=(x,y)=>g(x,y,p('M-24 -13 v-12 M-30 -19 h12 M22 0 v-16 M14 -8 h16 M0 -27 v-8 M-4 -31 h8'));
 function bubble(x,y,lines){const w=Math.max(105,...lines.map(t=>t.length*6.4+22)),hh=lines.length*16+18;return{box:{x,y,w,h:hh+13},art:g(x,y,p(`M9 0 H${w-9} Q${w} 0 ${w} 9 V${hh-9} Q${w} ${hh} ${w-9} ${hh} H${w*.57} L${w*.49} ${hh+13} L${w*.5} ${hh} H9 Q0 ${hh} 0 ${hh-9} V9 Q0 0 9 0 Z`,white)+lines.map((t,i)=>l(11,20+i*16,t,10).replace('letter-spacing="1.8"','letter-spacing=".1"')).join(''))};}
 function actor(id,x,y,name,lines,opts={}){const bx=opts.bx??x-65,by=opts.by??y-125,bb=bubble(bx,by,lines),ab=bubble(bx,by,opts.after||lines);s.actors.push({id:uid(id),x,y,name,lines:lines.join(' '),afterLines:(opts.after||lines).join(' '),linked:opts.linked?uid(opts.linked):null,bubbleBefore:bb.art,bubbleAfter:ab.art,box:bb.box,choices:opts.choices||[]});if(opts.draw!==false)f(person(x,y,opts.pose||0,opts.scale||.85));}
 function shell(x,y,w,hh,title){b(r(x,y,w,hh,'fill="#fdfcf8" stroke="none"'));f(p(`M${x} 714 V${y} H${x+w} V714 M${x-7} ${y} H${x+w+7}`,'stroke-width="2.8"')+l(x+18,y+25,title,12));}
 function car(x,y,type=0,missing=false){let art=p(type===1?'M-96 -7 V-68 H85 L104 -18 V-7 Z M-88 -58 H27 V-26 H-88 Z M38 -58 H75 L92 -26 H38 Z':'M-94 -8 V-36 L-58 -44 L-28 -73 H31 L63 -43 L92 -33 V-8 Z M-48 -43 L-22 -66 H24 L48 -43 Z M1 -65 V-44',white)+c(-53,-7,17,white)+c(-53,-7,7)+p('M-25 -31 h15 M70 -26 h18 M-88 -27 h14');art+=missing?guide('M35 -7 a18 18 0 1 0 36 0 a18 18 0 1 0 -36 0'):c(53,-7,17,white)+c(53,-7,7);return g(x,y,art);}
 function books(x,y){return bookshelf(x,y)+cat(x+91,y-10);}
 function traffic(){
  // These geometry endpoints agree with both neighbouring sections.
  b(r(0,750,960,150,'fill="#efeee8" stroke="none"'));
  f(p('M0 825 H960','stroke="#969185" stroke-width="1" stroke-dasharray="45 75"'));
  const x=kind%2?170:765;f(car(x,865,kind%3===1?1:0));
  region('street-car',`M${x-89} 832 H${x+88} V853 H${x-89} Z`,x-89,832,177,21);
  f(p('M20 714 V537 M20 539 Q49 530 59 551 M43 553 H76 L68 538 H51 Z M20 580 H40','stroke-width="1.8"'));
  f(p('M0 94 Q240 124 480 94 Q720 64 960 94','stroke-width=".7"'));
  for(let i=0;i<3;i++){const x=tx*960+i*320;const a=((x*37)%71+71)%71;f(g(80+i*320,80-a*.3,p('M-7 0 q4 -6 7 0 q4 -6 7 0')));}
 }
 if(ty===0){
  if(kind>=6){
   s.items.push({id:uid('pigment'),type:'bucket',color:['coral','gold','blue','green','lavender','gold'][kind-6],x:kind===9?790:835,y:695});
   if(kind===6){
    shell(74,215,551,499,'THE SECOND CHANCE GARAGE');f(p('M74 420 H625 M345 215 V420','stroke-width="2.3"'));
    f(books(96,279)+chair(245,389)+lamp(321,410)+r(376,265,215,110)+guide('M391 282 H574 V357 H391 Z'));
    f(p('M100 713 V478 Q165 426 231 478 V713 M272 714 V476 H594 V714')+car(429,682,0,true)+p('M499 627 l-14 -44 M487 588 l-13 -10 M534 684 h34 M116 674 h95 M129 674 v-90 M196 674 v-90'));
    finish('wheel',[[465,675],[482,658],[498,675],[482,692]],c(482,675,17)+c(482,675,6)+p('M507 657 l17 -5 M509 670 h22'));
    event('mural','draw',480,316,sparkle(480,276),{r:95,minLength:45});region('mural','M379 268 H587 V371 H379 Z',379,268,208,103);
    actor('mechanic',665,703,'Rae',['Three wheels.','Nearly a car.'],{linked:'wheel',after:['Four wheels!','Where would you go?'],bx:645,by:565,choices:[{id:'camp',label:'To the woods',reply:'Then we need a roof tent.',art:g(428,610,p('M-47 0 L0 -58 L47 0 Z M0 -58 V0')+p('M-61 0 H61'))},{id:'garden',label:'Stay and plant something',reply:'A car can be a garden, too.',art:pot(412,609,25)+pot(453,610,30)}]});
    f(tree(816,714,.67));
   }else if(kind===7){
    shell(58,159,372,555,'BREAD / BED');f(p('M59 350 H430 M59 510 H430 M251 160 V350','stroke-width="2.5"'));
    f(p('M80 319 v-49 h127 v49 M87 320 v24 M201 319 v24 M85 265 h30 v13')+lamp(231,338)+r(282,226,110,81)+guide('M291 239 H382 V298 H291 Z'));
    f(p('M81 483 h326 M89 484 v24 M397 484 v24')+el(149,467,28,7)+el(229,467,28,7)+el(308,467,28,7));
    f(p('M78 678 V605 H412 V678 M78 627 H412 M126 627 V677 M228 627 V677 M331 627 V677')+el(244,596,39,6)+guide('M216 590 V565 H272 V590')+p('M94 579 h66 v-37 h-66 Z M111 554 h31'));
    event('cake','draw',244,570,p('M220 563 v-17 M244 562 v-20 M266 563 v-17')+c(244,537,3)+c(220,541,3)+c(266,541,3),{minLength:25,r:36});
    region('cake','M217 566 H271 V590 H217 Z',217,566,54,24);
    shell(514,332,387,382,'POST FOR EVERYWHERE');f(r(541,390,324,118)+r(542,542,176,112)+r(753,547,98,151)+p('M553 565 H701 M553 583 H701 M553 600 H701 M553 620 H701')+r(770,568,57,39));
    f(guide('M575 421 H662 V476 H575 Z'));event('postcard','draw',620,450,g(687,444,p('M0 0 L14 -8 L27 0 L14 11 Z M14 11 v19')+p('M18 26 q26 -7 34 6')),{minLength:30,r:43});
    actor('baker',461,706,'Nell',['A birthday.','No cake yet.'],{linked:'cake',after:['Enough candles.','Make a wish.'],bx:438,by:550});
    actor('postie',732,699,'Sol',['Where should this','letter go?'],{bx:689,by:400,choices:[{id:'moon',label:'To the moon',reply:'The night shift will take it.',art:g(799,473,p('M-28 0 Q-20 -31 10 -21 Q-6 -4 16 13 Q-14 24 -28 0')+p('M-37 -20 l-14 -13'))},{id:'sea',label:'To someone at sea',reply:'Bottles are a kind of envelope.',art:g(799,473,p('M-11 -21 h22 v9 l8 10 v37 h-38 V-2 l8 -10 Z M-19 10 h38')+p('M-10 -26 h20'))}]});
   }else if(kind===8){
    shell(63,163,490,551,'THE PICTURE HOUSE');f(p('M64 348 H552','stroke-width="2.5"')+bookshelf(91,229)+r(363,253,103,67)+c(391,239,17)+c(440,239,17)+p('M466 271 l47 -17 v49 l-47 -17'));
    f(r(103,389,412,192)+r(112,397,394,176,'stroke-dasharray="3 7" stroke="#aaa"'));
    for(let i=0;i<6;i++)f(chair(110+i*69,680));
    event('movie','draw',310,484,sparkle(113,400)+person(184,665,1,.8)+person(390,665,1,.8),{r:175,minLength:60});region('screen','M105 391 H513 V579 H105 Z',105,391,408,188);
    shell(626,359,280,355,'SPIN CYCLE');for(let i=0;i<3;i++)f(r(644+i*82,598,70,99)+c(679+i*82,650,25)+c(679+i*82,650,19)+p(`M${651+i*82} 610 h24`));
    f(p('M636 449 h264 M658 449 v47 h28 v-47 M762 449 v38 h36 v-38')+guide('M649 515 H881')+p('M641 504 v44 M889 504 v44'));
    finish('washing-line',[[650,515],[760,515],[881,515]],p('M650 515 H882')+g(754,516,p('M0 0 l-8 21 l17 6 l-3 31 h49 l-3 -31 l16 -6 l-8 -21 l-16 9 h-27 Z')));
    actor('projectionist',579,698,'Ivo',['The screen is yours.','I brought the chairs.'],{linked:'movie',after:['Best thing I have','seen all week.'],bx:553,by:244});
    actor('laundry',826,584,'Dee',['Everything is clean.','Nowhere to hang it.'],{linked:'washing-line',after:['Perfect drying weather.'],bx:649,by:540,draw:false});
   }else if(kind===9){
    f(tree(148,712,1.4)+tree(853,713,.9));f(p('M546 709 V481 L703 368 L877 481 V709 M535 482 H891 M550 602 H876','stroke-width="2.4"')+windowAt(587,501,69,75)+r(704,506,110,202)+p('M704 507 L814 708 M814 506 L704 708'));
    f(el(363,645,166,55)+p('M201 644 q161 60 325 0','stroke-width=".8"')+guide('M241 617 H477 M241 629 H477'));
    finish('pond-bridge',[[243,621],[355,621],[476,621]],p('M241 617 H477 M241 629 H477 M257 617 v12 M284 617 v12 M311 617 v12 M338 617 v12 M365 617 v12 M392 617 v12 M419 617 v12 M446 617 v12')+person(390,606,1,.7));
    event('pond','color',363,665,g(294,676,el(0,0,13,7)+c(13,-7,6)+p('M18 -8 l9 3 l-10 1'))+g(448,665,el(0,0,10,6)+c(10,-6,5)),{color:'blue',r:85});
    region('pond','M197 645 a166 55 0 1 0 332 0 a166 55 0 1 0 -332 0',197,590,332,110);
    event('orchard','color',148,325,[[-80,-30],[12,-55],[78,-17],[-29,28],[45,48]].map(([x,y])=>g(148+x,325+y,c(0,0,10)+p('M0 -10 q0 -8 6 -11'))).join(''),{color:'coral',r:115});
    f(p('M0 711 Q100 690 200 711 M520 711 Q715 691 960 711')+p('M578 700 l-10 -34 M578 682 l11 -13 M606 700 l-3 -34 M606 681 l-11 -8'));
    actor('pond-walker',493,707,'Ash',['The other bank','looks lovely.'],{linked:'pond-bridge',after:['Come on over.','The ducks agree.'],bx:371,by:469});
   }else if(kind===10){
    shell(110,199,628,515,'THE SCHOOL OF POSSIBLE THINGS');f(p('M110 433 H737 M436 200 V433','stroke-width="2.8"')+r(141,252,262,120)+r(150,260,245,103,'stroke-dasharray="2 7" stroke="#aaa"'));
    for(let i=0;i<3;i++)f(chair(166+i*85,405));
    f(bookshelf(481,258)+pot(656,385)+r(138,483,255,80));for(let i=0;i<5;i++)f(p(`M150 ${499+i*11} H382`,'stroke-width=".6"'));
    f(p('M130 684 H707 M130 691 H707 M445 680 V541 H681 V680 M452 550 H673')+c(565,629,38)+p('M565 590 v78 M530 629 h72')+person(431,667,1,.8));
    event('blackboard','draw',269,310,sparkle(149,247)+person(356,398,1,.7),{minLength:45,r:112});
    event('music','draw',265,527,g(343,610,p('M0 0 v-36 l22 -7 v32 M0 -31 l22 -7')+el(-6,0,7,4,solid)+el(16,-10,7,4,solid))+person(491,670,1,.9),{minLength:25,r:95});
    region('board','M143 254 H401 V370 H143 Z',143,254,258,116);
    actor('teacher',792,699,'Pip',['What shall we','make this room?'],{bx:750,by:477,choices:[{id:'garden',label:'A garden classroom',reply:'Every leaf is a different answer.',art:pot(613,677,35)+pot(674,674,30)+p('M605 651 q-20 -70 23 -89 M624 601 q29 -40 46 -13')},{id:'dance',label:'A dance floor',reply:'There are no wrong steps.',art:person(610,661,1)+person(678,656,1,.85)+p('M577 696 l18 -10 M665 696 l18 -10')}]});
    f(bicycle(854,689));
   }else{
    shell(62,303,389,411,'STARGAZERS');f(p('M80 303 Q91 147 254 147 Q414 147 435 303 M254 147 V303 M80 303 H435','stroke-width="2.4"')+p('M63 497 H451','stroke-width="2.5"'));
    f(p('M185 461 l53 -88 l77 7 M211 418 l-13 78 M211 418 l45 78')+guide('M238 373 L316 322 L332 342 L263 391'));
    finish('telescope',[[240,375],[316,326],[329,341],[263,388]],p('M238 373 L316 322 L332 342 L263 391 Z')+sparkle(347,316));
    f(bookshelf(84,560)+chair(323,663)+lamp(407,690));
    shell(532,167,359,547,'THE LIBRARY OF SMALL THINGS');for(let row=0;row<3;row++){f(p(`M533 ${352+row*169} H891`,'stroke-width="2.3"')+bookshelf(553,237+row*169)+chair(739,324+row*169)+lamp(860,337+row*169));}
    f(r(699,558,122,80)+guide('M710 569 H810 V628 H710 Z'));event('book','draw',759,597,sparkle(765,552),{minLength:35,r:48});region('book','M701 560 H819 V636 H701 Z',701,560,118,76);
    actor('astronomer',483,706,'Ada',['Something is missing','between here and there.'],{linked:'telescope',after:['There you are.','A whole other sky.'],bx:403,by:399});
   }
  }
  if(kind===0){
   event('picture','draw',524,308,sparkle(520,270),{r:28,minLength:25});
   finish('tea',[[419,441],[419,417]],g(419,424,p('M0 0 q-10 -9 0 -17 q8 -8 0 -16 M10 3 q-6 -7 1 -14')));
   actor('artist',460,370,'Jo',['What belongs','in this frame?'],{linked:'picture',after:['Yes. Keep that one.'],bx:321,by:245});
   actor('neighbour',611,707,'Mina',['This little gap','could be anything.'],{draw:false,bx:601,by:511,linked:'plant',after:['It is growing on me.'],choices:[{id:'garden',label:'Plant a tiny garden',reply:'I will bring the watering can.',art:pot(616,654,25)+pot(652,643,30)+pot(682,664,23)+p('M605 686 H691')},{id:'table',label:'Make a place to meet',reply:'One more chair. Always.',art:el(651,648,36,9)+p('M651 658 v39')+chair(608,681)+chair(680,681)}]});
  }else if(kind===1){
   actor('swing-watcher',600,705,'Kit',['I wonder how high','it could go.'],{linked:'swing',after:['Again!'],bx:532,by:540});
   event('bird-school','draw',786,527,g(787,527,p('M-15 0 q9 -17 15 0 q10 -17 17 0'))+sparkle(798,487),{r:60,minLength:24});
   actor('bird-teacher',897,707,'Wren',['One seat left','at flying school.'],{draw:false,linked:'bird-school',after:['A natural.'],bx:732,by:388});
  }else if(kind===2){
   event('destination','draw',339,608,g(377,657,p('M-22 -20 h44 v27 h-44 Z M-22 -20 L0 -4 L22 -20'))+sparkle(358,583),{r:58,minLength:30});
   f(r(276,577,123,54)+guide('M284 586 H392 V622 H284 Z'));
   actor('traveller',421,693,'Val',['A ticket to','somewhere new.'],{draw:false,linked:'destination',after:['I have never','been there before.'],bx:296,by:454,choices:[{id:'train',label:'Take the slow route',reply:'Good. I have a book.',art:g(470,645,r(-19,-25,38,27)+p('M0 -25 V2'))},{id:'bike',label:'Go by bicycle',reply:'We can stop whenever we like.',art:bicycle(589,690)}]});
  }else if(kind===3){
   actor('fisher',212,542,'Mo',['A line between','me and the river.'],{draw:false,linked:'fishing',after:['Hello, little one.'],bx:184,by:293});
   event('sail','draw',473,577,p('M475 600 V522')+sparkle(506,537),{r:45,minLength:35});f(guide('M478 531 L526 591 H478'));
  }else if(kind===4){
   actor('gardener',380,663,'Fern',['I planted something.','I forget what.'],{draw:false,linked:'flowers',after:['Of course. Those.'],bx:301,by:440,choices:[{id:'butterflies',label:'Leave a wild corner',reply:'A place for small visitors.',art:g(597,479,p('M0 0 q-32 -42 -35 -7 q-2 27 35 7 q32 -42 35 -7 q2 27 -35 7 M0 -5 v23'))},{id:'supper',label:'Grow supper',reply:'Then everyone is invited.',art:pot(600,574,40)+p('M600 547 v-48 M600 514 q-25 -20 -35 -5 M600 532 q30 -24 40 -13')}]});
  }else if(kind===5){
   const portrait=s.events.find(e=>e.id===uid('portrait'));if(portrait){portrait.type='draw';portrait.minLength=28;portrait.after=sparkle(552,249);}
   actor('sitter',475,343,'Lou',['Do I look like','a triangle today?'],{linked:'portrait',after:['An excellent likeness.'],bx:265,by:185});
   actor('radio-listener',310,657,'Bo',['This room could','use a song.'],{draw:false,linked:'radio',after:['That is my favourite.'],bx:264,by:552});
  }
  traffic();
 }else if(ty<0){
  const variant=Math.abs(tx+ty+1)%4;
  if(variant){s.bg='';s.fg='';s.events=[];s.regions=[];s.items=[];
   // Clouds live in shared air, without tile-shaped borders or horizon strips.
   for(let i=0;i<3;i++)f(g(160+i*290,150+(i%2)*520,p('M-80 12 Q-98 -12 -64 -27 Q-48 -66 -18 -33 Q20 -71 43 -29 Q88 -37 87 9 Q105 32 65 32 H-60 Z')));
   if(variant===1){
    f(g(386,395,p('M-133 0 L-27 -17 L7 -78 L33 -78 L21 -17 L116 0 L141 -30 L155 -30 L148 14 L-125 20 Z')+c(-45,0,7)+c(-13,-2,7)+c(20,-2,7)));
    f(p('M252 412 Q178 440 116 420')+r(70,433,260,122)+guide('M83 446 H317 V543 H83 Z'));
    event('banner','draw',199,495,sparkle(85,434)+g(580,367,p('M-10 0 q7 -11 10 0 q8 -12 13 0')),{minLength:45,r:108});region('banner','M72 435 H328 V553 H72 Z',72,435,256,118);
    actor('pilot',662,490,'Jules',['I can take your','message anywhere.'],{linked:'banner',after:['They will see it','from the ground.'],bx:598,by:358});f(g(660,488,el(0,17,57,11)+p('M-50 16 l-11 -21 M50 16 l11 -21')));
    s.items.push({id:uid('sky-paint'),type:'bucket',color:'blue',x:714,y:500});
   }else if(variant===2){
    f(p('M165 614 Q435 669 753 614 M184 616 L300 724 L438 669 L561 725 L729 618')+tree(358,614,.95)+pot(643,586,37));
    f(p('M530 611 V449 L617 385 L709 449 V611 M520 450 H717')+windowAt(549,471,49,67)+r(628,468,49,142)+guide('M456 615 L456 782 M485 615 L485 782'));
    finish('sky-ladder',[[456,633],[456,765]],p('M456 615 V782 M485 615 V782')+Array.from({length:9},(_,i)=>p(`M456 ${625+i*18} h29`)).join('')+person(473,758,1,.6));
    actor('sky-gardener',516,610,'Eli',['Visitors usually','need a ladder.'],{linked:'sky-ladder',after:['Mind the roots.'],bx:434,by:325});region('sky-house','M532 452 H707 V609 H532 Z',532,452,175,157);
    s.items.push({id:uid('sky-paint'),type:'bucket',color:'green',x:687,y:599});
   }else{
    f(g(306,374,p('M-54 -61 Q-103 4 -39 57 Q31 112 81 39 Q-8 57 -54 -61 Z'))+g(690,414,r(-38,-31,76,62)+p('M-38 0 h-60 M38 0 h60 M-98 -39 v78 h-47 v-78 Z M98 -39 v78 h47 v-78 Z M0 -31 v-28 M-17 -59 h34')));
    const stars=[[425,258],[514,301],[481,390],[570,435]];for(const [x,y]of stars)f(g(x,y,p('M0 -6 v12 M-6 0 h12')));f(guide('M425 258 L514 301 L481 390 L570 435'));
    finish('constellation',stars,p('M425 258 L514 301 L481 390 L570 435')+sparkle(565,445));
    actor('stargazer',370,572,'Nox',['I see a fox.','What do you see?'],{linked:'constellation',after:['I can see that, too.'],bx:251,by:483,choices:[{id:'bird',label:'A bird',reply:'A good night to fly.',art:g(610,247,p('M-40 0 Q-14 -39 0 0 Q25 -47 48 0 M0 0 l8 16 l-18 -3'))},{id:'boat',label:'A boat',reply:'A good night to sail.',art:g(610,247,p('M-42 0 h84 l-16 22 h-50 Z M0 0 V-66 L35 -6 H0'))}]});
    s.items.push({id:uid('sky-paint'),type:'bucket',color:'gold',x:698,y:409});
   }
  }else actor('balloonist',719,579,'Uma',['A very good day','to drift.'],{draw:false,linked:'rain',after:['I packed an umbrella.'],bx:616,by:646});
 }else{
  const variant=Math.abs(tx+ty-1)%4;
  if(variant){s.bg='';s.fg='';s.events=[];s.regions=[];s.items=[];
   f(p('M0 80 H960 M0 86 H960 M0 740 H960 M0 747 H960','stroke-width="2"'));
   for(let i=0;i<5;i++)f(p(`M${125+i*180} 0 q-32 92 14 164 l-24 66 M${131+i*180} 150 l45 37`));
   if(variant===1){
    f(p('M87 738 V372 Q93 267 219 267 H727 Q863 267 869 374 V738 M100 432 H857','stroke-width="2.7"'));
    for(let i=0;i<5;i++)f(g(150+i*144,420,p('M-6 0 v-48 M6 0 v-48 M-40 -48 Q0 -111 40 -48 Z')+c(-14,-59,4)+c(12,-69,5)));
    f(p('M135 667 H514 M151 669 V737 M495 669 V737')+el(329,650,49,12)+p('M287 649 v-43 h84 v43 M292 608 h72')+guide('M328 597 Q303 574 330 551'));
    finish('soup',[[329,592],[329,552]],p('M329 597 Q303 574 330 551 Q345 538 329 526')+person(224,701,1,.8)+person(484,701,1,.8));
    f(bookshelf(678,482)+chair(601,688)+pot(821,699));actor('cook',550,707,'Tess',['Underground soup.','Not quite warm yet.'],{linked:'soup',after:['There is enough','for everyone.'],bx:483,by:511});
    region('soup-pot','M288 609 H370 V646 H288 Z',288,609,82,37);
   }else if(variant===2){
    f(p('M83 737 V329 H882 V737 M83 463 H882 M377 330 V463','stroke-width="2.5"')+bookshelf(114,351)+r(423,354,178,78));
    f(p('M129 663 H405 M139 663 V734 M391 663 V734')+c(265,613,44)+c(265,613,13)+guide('M265 569 V657 M221 613 H309'));
    finish('waterwheel',[[265,574],[265,651],[226,613],[303,613]],p('M265 569 V657 M221 613 H309')+p('M315 615 H503 M503 615 V524 H717','stroke-width="3"'));
    f(r(569,523,219,180)+r(588,546,178,85)+p('M603 685 v-33 h22 v33 M643 685 v-33 h22 v33 M683 685 v-33 h22 v33')+guide('M600 561 H752 V616 H600 Z'));
    event('machine','draw',674,586,sparkle(719,525),{minLength:30,r:74});actor('engineer',463,703,'Ren',['The city runs on','small inventions.'],{linked:'waterwheel',after:['There it goes.'],bx:371,by:478});region('machine','M590 548 H764 V629 H590 Z',590,548,174,81);
   }else{
    f(p('M86 738 V282 H874 V738 M86 492 H874 M515 282 V738','stroke-width="2.8"')+bookshelf(116,343)+bookshelf(324,343)+bookshelf(552,333));
    f(el(701,428,84,35)+p('M634 420 l-30 -24 M659 405 l-14 -36 M692 396 v-35 M725 403 l20 -33 M756 414 l28 -24'));
    f(r(120,546,345,143)+guide('M137 561 H449 V672 H137 Z')+chair(605,675)+lamp(828,718)+cat(695,709));
    event('fossil-drawing','draw',290,612,sparkle(158,550),{r:139,minLength:45});region('fossil-frame','M122 548 H463 V687 H122 Z',122,548,341,139);
    actor('archivist',478,704,'Bea',['Nobody knows','what it looked like.'],{linked:'fossil-drawing',after:['I prefer your version.'],bx:300,by:463});
   }
   s.items.push({id:uid('below-paint'),type:'bucket',color:['lavender','coral','blue','gold'][variant],x:831,y:716});
  }else actor('underground-postie',644,711,'Rue',['Even the roots','get letters.'],{linked:'root-letter',after:['This one is for you.'],bx:570,by:525});
  // A service passage and a pipe cross section boundaries vertically.
  f(p('M19 0 V960 M42 0 V960 M925 0 V960','stroke-width="1.5"'));for(let y=0;y<960;y+=32)f(p(`M19 ${y} H42`));
  if(ty===1)f(p('M471 0 V52 H925','stroke-width="2"'));
 }
 for(const a of s.actors)for(const choice of a.choices){const lines=[''];for(const word of choice.reply.split(' ')){if((lines.at(-1)+' '+word).trim().length>25)lines.push(word);else lines[lines.length-1]=(lines.at(-1)+' '+word).trim();}choice.bubble=bubble(a.box.x,a.box.y,lines).art;}
 return s;
}
module.exports={enrich,district};
