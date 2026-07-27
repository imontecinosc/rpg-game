const canvas=document.querySelector('#game'),ctx=canvas.getContext('2d'),renderer=document.querySelector('#renderer');
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const world={w:2200,h:1600,time:0};
const ITEMS={
 sword:{id:'sword',name:'Espada de hierro',slot:'weapon',icon:'🗡️',weapon:'sword',desc:'Arma de una mano. Admite escudo.'},
 axe:{id:'axe',name:'Hacha de frontera',slot:'weapon',icon:'🪓',weapon:'axe',desc:'Hacha de una mano. Admite escudo.'},
 bow:{id:'bow',name:'Arco de cazador',slot:'weapon',icon:'🏹',weapon:'bow',desc:'Arma a distancia de dos manos.'},
 shield:{id:'shield',name:'Escudo redondo',slot:'offhand',icon:'🛡️',desc:'Protección para armas de una mano.'},
 spellbook:{id:'spellbook',name:'Grimorio de brasas',slot:'offhand',icon:'📕',desc:'Canaliza hechizos; incompatible con escudo.'},
 torso:{id:'torso',name:'Pechera de guardia',slot:'torso',icon:'🥋',desc:'Armadura de torso reforzada.'},
 cape:{id:'cape',name:'Capa granate',slot:'cape',icon:'♦️',desc:'Capa de viaje aprobada.'},
 boots:{id:'boots',name:'Botas reforzadas',slot:'boots',icon:'🥾',desc:'Botas de cuero endurecido.'},
 pants:{id:'pants',name:'Calzas oscuras',slot:'legs',icon:'👖',desc:'Protección ligera para las piernas.'},
 gloves:{id:'gloves',name:'Guantes de cuero',slot:'gloves',icon:'🧤',desc:'Protección para las manos.'},
 ring:{id:'ring',name:'Anillo de vigor',slot:'ring1',icon:'💍',desc:'+8 al vigor máximo.'},
 bones:{id:'bones',name:'Huesos antiguos',icon:'🦴',stack:true,desc:'Recurso de criaturas.'},
 arrows:{id:'arrows',name:'Flechas',icon:'➶',stack:true,desc:'Munición para arcos.'},
 potion:{id:'potion',name:'Poción menor',icon:'🧪',stack:true,desc:'Restaura vida.'},
 gold:{id:'gold',name:'Oro',icon:'●',stack:true,desc:'Moneda del reino.'}
};
const copyItem=(id,qty=1)=>({...ITEMS[id],uid:id+'-'+Math.random().toString(36).slice(2),qty});
const player={name:'Ignacio',title:'Aventurero de Quinta Normal',x:1010,y:840,dir:'down',moving:false,speed:190,hp:150,maxHp:150,mana:120,maxMana:120,stam:100,maxStam:100,battle:false,action:'idle',actionUntil:0,nextAttack:0,gold:35,potions:3,inventory:[copyItem('axe'),copyItem('bow'),copyItem('spellbook'),copyItem('bones',3),copyItem('arrows',20),copyItem('potion',3)],equipment:{weapon:copyItem('sword'),offhand:copyItem('shield'),torso:copyItem('torso'),cape:copyItem('cape'),boots:copyItem('boots'),legs:copyItem('pants'),gloves:copyItem('gloves'),head:null,neck:null,arms:null,ring1:null,ring2:null},skills:{Espadas:42.3,Magia:31.7,Curación:28.2,Lucha:20,Fencing:20,Arquería:20,'Armas contundentes':20,'Dominio del escudo':26.1,Confección:12.5,Herrería:10},skillModes:{},target:null,selectedItem:null,selectedSlot:null};
const enemies=[
 {id:1,type:'zombie',name:'Muerto errante',x:1510,y:980,hp:75,maxHp:75,alive:true,respawn:0,seen:false,speed:58,dir:'left'},
 {id:2,type:'mage',name:'Apóstata gris',x:1740,y:690,hp:95,maxHp:95,alive:true,respawn:0,seen:false,speed:52,dir:'down'},
 {id:3,type:'bandit',name:'Saqueador',x:1320,y:1240,hp:110,maxHp:110,alive:true,respawn:0,seen:false,speed:65,dir:'right'},
 {id:4,type:'skeleton',name:'Vigía de hueso',x:1880,y:1110,hp:82,maxHp:82,alive:true,respawn:0,seen:false,speed:58,dir:'up'}
];
const npcs=[
 {name:'Maese Orlan',role:'Armas',x:760,y:615,palette:{shirt:'#895f3f',pants:'#3c332c',cape:'#664434',hair:'#5b3a26'},dir:'down'},
 {name:'Hermana Lysa',role:'Magias',x:980,y:570,palette:{shirt:'#65507f',pants:'#302a3f',cape:'#4c355d',hair:'#bfa46d'},dir:'left'},
 {name:'Torren',role:'Armaduras',x:1190,y:615,palette:{shirt:'#5f7474',pants:'#2e3a3c',cape:'#3f5452',hair:'#4a3025'},dir:'right'},
 {name:'Banquero Real',role:'Banco',x:990,y:760,palette:{shirt:'#8a774d',pants:'#4d4330',cape:'#5f5136',hair:'#b4a07a'},dir:'down'},
 {name:'Guardia',role:'Guardia',x:680,y:850,palette:{shirt:'#64778c',pants:'#343d49',cape:'#415064',hair:'#6b4b35'},dir:'right'},
 {name:'Guardia',role:'Guardia',x:1280,y:850,palette:{shirt:'#64778c',pants:'#343d49',cape:'#415064',hair:'#33241e'},dir:'left'}
];
const SLOT_LABELS={head:'Cabeza',neck:'Cuello',torso:'Pechera',arms:'Brazos',gloves:'Guantes',cape:'Capa',weapon:'Arma principal',offhand:'Mano secundaria',legs:'Pantalón',boots:'Botas',ring1:'Anillo I',ring2:'Anillo II'};
const keys={},projectiles=[],floaters=[],corpses=[];
let camera={x:0,y:0},last=performance.now(),joy={x:0,y:0,active:false},rendererReady=false,rendererCanvas=null,rendererState={},openCorpse=null;
renderer.onload=()=>{rendererReady=true;rendererCanvas=renderer.contentDocument.querySelector('#canvas');syncRenderer(true)};
function resize(){canvas.width=innerWidth*devicePixelRatio;canvas.height=innerHeight*devicePixelRatio;ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0)}
addEventListener('resize',resize);resize();
function iso(x,y){return{x:(x-y)*.52-camera.x+innerWidth/2,y:(x+y)*.26-camera.y+innerHeight/2}}
function rendererWeapon(){const w=player.equipment.weapon?.weapon||'none',off=player.equipment.offhand?.id;if(w==='sword'&&off==='shield')return'swordShield';if(w==='axe')return off==='shield'?'axeShield':'axe';if(w==='bow')return'bow';if(!player.equipment.weapon&&off==='spellbook')return'spellbook';return w==='none'?'unarmed':w}
function syncRenderer(force=false){
 if(!rendererReady)return;const d=renderer.contentDocument,action=player.action==='walk'?'walk':player.action==='attack'?'melee':player.action==='cast'?'cast':'idle';
 const values={dirSelect:player.dir,actionSelect:action,weaponSelect:rendererWeapon()};
 for(const [id,val] of Object.entries(values)){if(force||rendererState[id]!==val){const el=d.getElementById(id);if(el&&[...el.options].some(o=>o.value===val)){el.value=val;el.dispatchEvent(new Event('change'))}rendererState[id]=val}}
 const toggles={toggleTorso:!!player.equipment.torso,toggleGloves:!!player.equipment.gloves,toggleCape:!!player.equipment.cape,toggleBoots:!!player.equipment.boots,toggleLegs:!!player.equipment.legs,toggleHelmet:!!player.equipment.head,toggleNeck:!!player.equipment.neck,toggleArms:!!player.equipment.arms};
 for(const [id,wanted] of Object.entries(toggles)){const b=d.getElementById(id);if(b){const active=b.classList.contains('active');if(active!==wanted)b.click()}}
}
function diamond(x,y,w,h,c,stroke='#0004'){const p=iso(x,y);ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(p.x,p.y-h/2);ctx.lineTo(p.x+w/2,p.y);ctx.lineTo(p.x,p.y+h/2);ctx.lineTo(p.x-w/2,p.y);ctx.closePath();ctx.fill();ctx.strokeStyle=stroke;ctx.stroke()}
function terrain(){ctx.fillStyle='#17251a';ctx.fillRect(0,0,innerWidth,innerHeight);for(let x=0;x<world.w;x+=80)for(let y=0;y<world.h;y+=80){const p=iso(x,y);if(p.x<-100||p.x>innerWidth+100||p.y<-60||p.y>innerHeight+60)continue;diamond(x,y,84,42,((x+y)/80)%2?'#233924':'#294128','#1b2d1d')}drawRoad();drawCity();drawCemetery()}
function drawRoad(){for(let i=300;i<1900;i+=58)diamond(i,820,68,34,'#6b6858');for(let y=430;y<1240;y+=58)diamond(980,y,68,34,'#716e5d')}
function building(x,y,w,h,color,label){const p=iso(x,y);ctx.fillStyle='#1117';ctx.beginPath();ctx.ellipse(p.x,p.y+18,w*.42,18,0,0,7);ctx.fill();ctx.fillStyle=color;ctx.fillRect(p.x-w/2,p.y-h,w,h);ctx.fillStyle='#392d25';ctx.beginPath();ctx.moveTo(p.x-w*.62,p.y-h);ctx.lineTo(p.x,p.y-h-48);ctx.lineTo(p.x+w*.62,p.y-h);ctx.closePath();ctx.fill();ctx.fillStyle='#dfcf9c';ctx.font='11px Georgia';ctx.textAlign='center';ctx.fillText(label,p.x,p.y-h-55)}
function drawCity(){building(710,560,90,72,'#78644e','ARMAS');building(980,510,92,74,'#665870','ARCANOS');building(1240,560,94,76,'#626c69','ARMADURAS');building(980,700,100,78,'#756843','BANCO');const a=iso(530,410),b=iso(530,1080),c=iso(1420,1080),d=iso(1420,410);ctx.strokeStyle='#8b8067';ctx.lineWidth=10;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.moveTo(c.x,c.y);ctx.lineTo(d.x,d.y);ctx.stroke()}
function drawCemetery(){for(const [x,y] of [[1660,900],[1740,970],[1810,860],[1900,1020]]){const p=iso(x,y);ctx.fillStyle='#77796c';ctx.fillRect(p.x-5,p.y-24,10,28);ctx.fillRect(p.x-11,p.y-18,22,7)}}
function limb(x1,y1,x2,y2,w,c){ctx.strokeStyle=c;ctx.lineWidth=w;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke()}
function drawHumanFigure(n,p,scale=.72){
 ctx.save();ctx.translate(p.x,p.y);ctx.scale(scale,scale);const pal=n.palette,s=Math.sin(world.time*3+(n.x||0))*(n.moving?5:1);
 ctx.fillStyle='#0007';ctx.beginPath();ctx.ellipse(0,6,22,8,0,0,7);ctx.fill();
 ctx.fillStyle=pal.cape;ctx.beginPath();ctx.moveTo(-16,-53);ctx.quadraticCurveTo(-20,-20,-17,-3);ctx.lineTo(0,7);ctx.lineTo(17,-3);ctx.quadraticCurveTo(20,-20,16,-53);ctx.closePath();ctx.fill();
 limb(-8,-21,-10+s,-1,10,pal.pants);limb(8,-21,10-s,-1,10,pal.pants);limb(-10+s,-1,-11+s,7,8,'#33291f');limb(10-s,-1,11-s,7,8,'#33291f');
 ctx.fillStyle=pal.shirt;ctx.beginPath();ctx.roundRect(-17,-56,34,39,8);ctx.fill();limb(-15,-48,-24+s*.25,-24,9,pal.shirt);limb(15,-48,24-s*.25,-24,9,pal.shirt);
 ctx.fillStyle='#bd8d6c';ctx.beginPath();ctx.arc(-25+s*.25,-21,5,0,7);ctx.arc(25-s*.25,-21,5,0,7);ctx.fill();ctx.beginPath();ctx.arc(0,-69,13,0,7);ctx.fill();
 ctx.fillStyle=pal.hair;ctx.beginPath();ctx.arc(0,-73,13,Math.PI,7);ctx.lineTo(12,-67);ctx.quadraticCurveTo(3,-62,-11,-67);ctx.closePath();ctx.fill();ctx.restore();
 ctx.fillStyle='#eadfc4';ctx.font='10px Georgia';ctx.textAlign='center';ctx.fillText(n.name,p.x,p.y-61);ctx.fillStyle='#aaa088';ctx.font='8px sans-serif';ctx.fillText(n.role,p.x,p.y-51)
}
function drawNpc(n){drawHumanFigure(n,iso(n.x,n.y),.72)}
function drawMonsterFigure(e,p){
 ctx.save();ctx.translate(p.x,p.y);const bob=Math.sin(world.time*5+e.id)*1.5;ctx.translate(0,bob);ctx.fillStyle='#0008';ctx.beginPath();ctx.ellipse(0,5,19,7,0,0,7);ctx.fill();
 if(e.type==='zombie'||e.type==='bandit'){drawHumanFigure({x:e.x,moving:true,name:'',role:'',palette:e.type==='zombie'?{shirt:'#596a55',pants:'#3d4938',cape:'#455342',hair:'#6f7768'}:{shirt:'#70483d',pants:'#3b302c',cape:'#55352f',hair:'#37251d'}},{x:0,y:0},.72)}
 else if(e.type==='skeleton'){ctx.strokeStyle='#c6c2aa';ctx.lineCap='round';limb(-6,-31,-10,-5,6,'#c6c2aa');limb(6,-31,10,-5,6,'#c6c2aa');limb(-7,-43,-19,-22,5,'#c6c2aa');limb(7,-43,19,-22,5,'#c6c2aa');ctx.beginPath();ctx.arc(0,-57,11,0,7);ctx.stroke();ctx.strokeRect(-11,-45,22,23)}
 else{ctx.fillStyle='#675174';ctx.beginPath();ctx.roundRect(-14,-45,28,44,9);ctx.fill();ctx.fillStyle='#a67d65';ctx.beginPath();ctx.arc(0,-56,12,0,7);ctx.fill();ctx.fillStyle='#33263a';ctx.beginPath();ctx.moveTo(-14,-63);ctx.lineTo(0,-83);ctx.lineTo(14,-63);ctx.closePath();ctx.fill()}
 ctx.restore();if(player.target===e){ctx.strokeStyle='#df5349';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(p.x,p.y-22,28,44,0,0,7);ctx.stroke()}ctx.fillStyle='#080b08';ctx.fillRect(p.x-23,p.y-70,46,5);ctx.fillStyle='#b94d44';ctx.fillRect(p.x-23,p.y-70,46*(e.hp/e.maxHp),5);ctx.fillStyle='#eee2c6';ctx.font='9px Georgia';ctx.textAlign='center';ctx.fillText(e.name,p.x,p.y-77)
}
function drawEnemy(e){if(e.alive)drawMonsterFigure(e,iso(e.x,e.y))}
function drawPlayer(){
 const p=iso(player.x,player.y);ctx.fillStyle='#0008';ctx.beginPath();ctx.ellipse(p.x,p.y+7,20,7,0,0,7);ctx.fill();
 if(rendererCanvas){ctx.save();ctx.translate(p.x,p.y+17);const scale=.47;ctx.scale(scale,scale);ctx.drawImage(rendererCanvas,390,335,200,340,-100,-280,200,340);ctx.restore()}else drawHumanFigure({x:player.x,moving:player.moving,name:'',role:'',palette:{shirt:'#7e5a55',pants:'#34343a',cape:'#6c3e43',hair:'#4c3024'}},p,.72);
}
function drawCorpses(){for(const c of corpses){const p=iso(c.x,c.y);ctx.fillStyle=c===openCorpse?'#75664b':'#3d4238';ctx.beginPath();ctx.ellipse(p.x,p.y,25,9,.2,0,7);ctx.fill();ctx.strokeStyle=c===openCorpse?'#e0c47b':'#777';ctx.stroke();ctx.fillStyle='#d0c09d';ctx.font='9px Georgia';ctx.textAlign='center';ctx.fillText(c.looted?'Cadáver vacío':`Cadáver de ${c.name}`,p.x,p.y-13)}}
function drawEffects(){for(const p of projectiles){const s=iso(p.x,p.y);ctx.fillStyle=p.kind==='magic'?'#ff8b3c':'#ded4b6';ctx.shadowBlur=16;ctx.shadowColor=ctx.fillStyle;ctx.beginPath();ctx.arc(s.x,s.y-26,p.kind==='magic'?7:3,0,7);ctx.fill();ctx.shadowBlur=0}for(const f of floaters){const s=iso(f.x,f.y);ctx.globalAlpha=clamp(f.life,0,1);ctx.fillStyle=f.color;ctx.font='bold 14px Georgia';ctx.textAlign='center';ctx.fillText(f.text,s.x,s.y-55-(1-f.life)*24);ctx.globalAlpha=1}}
function update(dt,t){
 world.time+=dt;let dx=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0)+joy.x,dy=(keys.KeyS||keys.ArrowDown?1:0)-(keys.KeyW||keys.ArrowUp?1:0)+joy.y;const m=Math.hypot(dx,dy);player.moving=m>.12;if(m){dx/=m;dy/=m;player.x=clamp(player.x+dx*player.speed*dt,250,2050);player.y=clamp(player.y+dy*player.speed*dt,250,1400);player.dir=Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up')}
 if(t>player.actionUntil)player.action=player.moving?'walk':'idle';player.mana=clamp(player.mana+4*dt,0,player.maxMana);player.stam=clamp(player.stam+9*dt,0,player.maxStam);
 for(const e of enemies){if(!e.alive){if(t>e.respawn){e.alive=true;e.hp=e.maxHp;e.x=e.spawnX||e.x;e.y=e.spawnY||e.y}continue}const d=dist(e,player);if(d<270&&player.x>1300){e.seen=true;if(d>42){e.dir=Math.abs(player.x-e.x)>Math.abs(player.y-e.y)?(player.x>e.x?'right':'left'):(player.y>e.y?'down':'up');e.x+=(player.x-e.x)/d*e.speed*dt;e.y+=(player.y-e.y)/d*e.speed*dt}else if(Math.random()<dt*.4){const hit=5+Math.random()*5;player.hp=clamp(player.hp-hit,0,player.maxHp);floater(player.x,player.y,'-'+Math.round(hit),'#e36b61')}}}
 if(player.battle&&player.target?.alive&&t>=player.nextAttack){const range=player.equipment.weapon?.weapon==='bow'?420:102;if(dist(player,player.target)<=range)autoAttack(t)}
 for(let i=projectiles.length-1;i>=0;i--){const p=projectiles[i];p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;const hit=enemies.find(e=>e.alive&&dist(e,p)<25);if(hit){damage(hit,p.damage,p.kind);projectiles.splice(i,1)}else if(p.life<=0)projectiles.splice(i,1)}
 for(let i=floaters.length-1;i>=0;i--){floaters[i].life-=dt;if(floaters[i].life<=0)floaters.splice(i,1)}
 camera.x+=(player.x-player.y)*.52-camera.x;camera.y+=(player.x+player.y)*.26-camera.y;syncRenderer();updateHud()
}
function floater(x,y,text,color='#f1d57d'){floaters.push({x,y,text,color,life:1})}
function gainSkill(name,amt=.1){if((player.skillModes[name]||'up')!=='up')return;const old=Math.floor(player.skills[name]);player.skills[name]=clamp(player.skills[name]+amt,0,100);if(Math.floor(player.skills[name])>old)toast(`¡${name} subió a ${Math.floor(player.skills[name])}!`)}
function addToBag(item){if(item.id==='gold'){player.gold+=item.qty;return}if(item.id==='potion')player.potions+=item.qty;const stack=player.inventory.find(i=>i.id===item.id&&i.stack);if(stack)stack.qty+=item.qty;else player.inventory.push({...item,uid:item.uid||item.id+'-'+Math.random().toString(36).slice(2)})}
function damage(e,amount,kind){e.hp-=amount;floater(e.x,e.y,'-'+Math.round(amount));gainSkill(kind==='magic'?'Magia':player.equipment.weapon?.weapon==='bow'?'Arquería':player.equipment.weapon?.weapon==='axe'?'Armas contundentes':'Espadas',.25);if(e.hp<=0){e.alive=false;e.respawn=performance.now()+120000;const drops=[copyItem('gold',8+e.id*4),copyItem('bones',e.type==='skeleton'?3:1),...(e.id%2?[copyItem(e.type==='mage'?'spellbook':'gloves')]:[copyItem('potion')])];corpses.push({id:crypto.randomUUID(),x:e.x,y:e.y,name:e.name,items:drops,looted:false,time:performance.now()});player.target=null;toast(`${e.name} derrotado · selecciona su cadáver`);renderAllPanels()}}
function autoAttack(t){const e=player.target;if(!e?.alive)return;player.nextAttack=t+(player.equipment.weapon?.weapon==='bow'?1100:760);player.action='attack';player.actionUntil=t+470;if(player.equipment.weapon?.weapon==='bow')shoot(e,'arrow',18);else damage(e,12+Math.random()*12,'melee')}
function attack(){if(!player.battle)return toast('Activa el modo Batalla');if(!player.target?.alive)return toast('Marca un objetivo');player.nextAttack=0;toast('Autoataque activo')}
function shoot(e,kind,damageValue){const d=dist(player,e);projectiles.push({x:player.x,y:player.y,vx:(e.x-player.x)/d*420,vy:(e.y-player.y)/d*420,life:1.3,kind,damage:damageValue})}
function magic(){const e=player.target;if(!player.battle||!e?.alive)return toast('Necesitas un objetivo marcado');if(player.mana<18)return toast('No tienes suficiente maná');player.mana-=18;player.action='cast';player.actionUntil=performance.now()+600;if(Math.random()<.82)shoot(e,'magic',24+Math.random()*14);else toast('El hechizo falló');gainSkill('Magia',.18)}
function heal(){if(player.mana<14)return toast('No tienes suficiente maná');player.mana-=14;const n=22+Math.round(Math.random()*14);player.hp=clamp(player.hp+n,0,player.maxHp);player.action='cast';player.actionUntil=performance.now()+550;floater(player.x,player.y,'+'+n,'#7ed58b');gainSkill('Curación',.2)}
function selectWorld(clientX,clientY){let best=null,bd=55;for(const e of enemies){if(!e.alive)continue;const p=iso(e.x,e.y),d=Math.hypot(clientX-p.x,clientY-p.y);if(d<bd){best=e;bd=d}}if(best){player.target=best;openCorpse=null;best.seen=true;player.battle=true;player.nextAttack=0;toast(`${best.name} marcado · autoataque activo`);return updateHud()}let body=null;bd=52;for(const c of corpses){const p=iso(c.x,c.y),d=Math.hypot(clientX-p.x,clientY-p.y);if(d<bd){body=c;bd=d}}if(body){openLoot(body)}}
function openLoot(c){openCorpse=c;if(dist(c,player)>110)return toast('Acércate al cadáver');openPanel('lootPanel');renderLoot()}
function takeCorpseItem(uid){const item=openCorpse?.items.find(i=>i.uid===uid);if(!item)return;addToBag(item);openCorpse.items=openCorpse.items.filter(i=>i.uid!==uid);openCorpse.looted=!openCorpse.items.length;toast(`Recoges ${item.name}`);renderLoot();renderCharacter()}
function use(){const c=corpses.find(c=>dist(c,player)<75&&!c.looted);if(c)return openLoot(c);const near=npcs.find(n=>dist(n,player)<105);if(near)return toast(`${near.name}: ${near.role==='Banco'?'Tienes '+player.gold+' monedas.':near.role==='Armas'?'Cada arma desarrolla una habilidad distinta.':near.role==='Magias'?'Un grimorio permite canalizar magia.':'Mantén la paz dentro de la ciudad.'}`);toast('No hay nada cerca para usar')}
function potion(){if(player.potions<=0)return toast('No quedan pociones');player.potions--;player.hp=clamp(player.hp+45,0,player.maxHp);floater(player.x,player.y,'+45','#7ed58b');updateHud()}
function equipmentCompatible(item){if(item.slot!=='offhand')return true;if(item.id==='shield')return ['sword','axe'].includes(player.equipment.weapon?.weapon);return item.id==='spellbook'&&!['bow'].includes(player.equipment.weapon?.weapon)}
function equipItem(uid){const i=player.inventory.findIndex(x=>x.uid===uid),item=player.inventory[i];if(!item?.slot)return toast('Este objeto no se equipa');if(!equipmentCompatible(item))return toast('No es compatible con el arma actual');let slot=item.slot;if(slot==='ring1'&&player.equipment.ring1)slot='ring2';const old=player.equipment[slot];player.inventory.splice(i,1);if(old)player.inventory.push(old);player.equipment[slot]=item;if(slot==='weapon'&&item.weapon==='bow'&&player.equipment.offhand){player.inventory.push(player.equipment.offhand);player.equipment.offhand=null}player.selectedItem=null;syncRenderer(true);renderCharacter();toast(`${item.name} equipado`)}
function unequipSlot(slot){const item=player.equipment[slot];if(!item)return;player.inventory.push(item);player.equipment[slot]=null;player.selectedSlot=null;syncRenderer(true);renderCharacter();toast(`${item.name} desequipado`)}
function dropSelected(){const uid=player.selectedItem,i=player.inventory.findIndex(x=>x.uid===uid);if(i<0)return;const [item]=player.inventory.splice(i,1);player.selectedItem=null;toast(`${item.name} soltado`);renderCharacter()}
function updateHud(){for(const [id,v,max] of [['hp',player.hp,player.maxHp],['mana',player.mana,player.maxMana],['stam',player.stam,player.maxStam]]){$(`#${id}Bar`).style.width=(v/max*100)+'%';$(`#${id}Txt`).textContent=`${Math.round(v)}/${max}`}$('#potions').textContent=player.potions;$('#miniName').textContent=player.name;$('#miniTitle').textContent=player.title;$('#battle').classList.toggle('active',player.battle);$('#battle small').textContent=player.battle?'Batalla':'Paz';const t=$('#target');if(player.target?.alive){t.classList.add('on');$('#targetName').textContent=player.target.name+' · AUTO';$('#targetHp').style.width=(player.target.hp/player.target.maxHp*100)+'%'}else t.classList.remove('on')}
function toast(text){const el=$('#toast');el.textContent=text;el.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove('show'),1800)}
function itemHtml(i,selected=false){return`<button class="item ${selected?'selected':''}" data-item="${i.uid}"><span class="item-icon">${i.icon}</span><b>${i.name}</b><small>${i.qty>1?'×'+i.qty:(i.slot?SLOT_LABELS[i.slot]:'Objeto')}</small></button>`}
function renderCharacter(){
 const area=$('#paperArea');area.querySelectorAll('.slot').forEach(e=>e.remove());for(const [slot,label] of Object.entries(SLOT_LABELS)){const i=player.equipment[slot],b=document.createElement('button');b.className=`slot s-${slot} ${i?'':'empty'} ${player.selectedSlot===slot?'selected':''}`;b.dataset.slot=slot;b.innerHTML=`<span class="icon">${i?.icon||'◇'}</span>${label}<b>${i?.name||'Vacío'}</b>`;area.appendChild(b)}
 $('#bagGold').textContent=`${player.gold} oro`;$('#bagGrid').innerHTML=player.inventory.map(i=>itemHtml(i,player.selectedItem===i.uid)).join('')||'<p>La mochila está vacía.</p>';const item=player.inventory.find(i=>i.uid===player.selectedItem),slotItem=player.selectedSlot&&player.equipment[player.selectedSlot];
 $('#itemDetail').innerHTML=item?`<b>${item.icon} ${item.name}</b><br>${item.desc}${item.slot?`<br>Ranura: ${SLOT_LABELS[item.slot]}`:''}`:slotItem?`<b>${slotItem.icon} ${slotItem.name}</b><br>${slotItem.desc}`:'Selecciona un objeto o una ranura equipada.';
 $('#itemActions').innerHTML=item?`${item.slot?'<button id="equipSelected" class="small-btn primary">Equipar</button>':''}<button id="dropSelected" class="small-btn danger">Soltar</button>`:slotItem?'<button id="unequipSelected" class="small-btn primary">Desequipar</button>':'';
 drawDoll()
}
function drawDoll(){const d=$('#doll'),dc=d.getContext('2d');dc.clearRect(0,0,d.width,d.height);if(rendererCanvas){syncRenderer(true);dc.save();dc.translate(90,270);dc.scale(.72,.72);dc.drawImage(rendererCanvas,390,335,200,340,-100,-330,200,340);dc.restore()}}
function renderLoot(){if(!openCorpse)return;$('#lootTitle').textContent=`Cadáver de ${openCorpse.name}`;$('#corpseGrid').innerHTML=openCorpse.items.map(i=>itemHtml(i)).join('')||'<p>El cadáver está vacío.</p>';$('#lootBagGrid').innerHTML=player.inventory.map(i=>itemHtml(i)).join('')||'<p>Mochila vacía.</p>';$('#takeAll').disabled=!openCorpse.items.length}
function renderProfile(){const strongest=Object.entries(player.skills).sort((a,b)=>b[1]-a[1]).slice(0,5);$('#profileTitle').textContent=player.title;$('#profileContent').innerHTML=`<div class="profile-grid"><div class="profile-card"><small>FUERZA</small><strong>50</strong></div><div class="profile-card"><small>DESTREZA</small><strong>50</strong></div><div class="profile-card"><small>INTELIGENCIA</small><strong>20</strong></div><div class="profile-card"><small>ORO</small><strong>${player.gold}</strong></div><div class="profile-card"><small>TÍTULO</small><strong>${player.title}</strong></div><div class="profile-card"><small>DESCUBIERTOS</small><strong>${enemies.filter(e=>e.seen).length}</strong></div></div><h3>Habilidades más fuertes</h3><table class="stats-table">${strongest.map(([n,v])=>`<tr><td>${n}</td><td>${v.toFixed(1)}</td></tr>`).join('')}</table>`}
function renderSkills(){$('#skillsGrid').innerHTML=Object.entries(player.skills).map(([n,v])=>`<div class="card"><b>${n}</b><span>${v.toFixed(1)}</span><button class="skillmode small-btn" data-skill="${n}">${player.skillModes[n]||'↑ Subir'}</button></div>`).join('')}
function renderCompendium(){const seen=[...new Map(enemies.filter(e=>e.seen).map(e=>[e.name,e])).values()];$('#compendiumGrid').innerHTML=seen.length?seen.map(e=>`<div class="card"><b>${e.name}</b><p>${e.type==='zombie'?'Humanoide corrupto de avance lento.':e.type==='skeleton'?'Criatura ósea del cementerio.':e.type==='mage'?'Hostil arcano de alcance.':'Humano hostil, rápido y resistente.'}</p></div>`).join(''):'<div class="card"><p>Aún no has descubierto criaturas.</p></div>'}
function renderAllPanels(){renderCharacter();renderSkills();renderCompendium();renderProfile();if(openCorpse)renderLoot()}
function openPanel(id){$$('.panel').forEach(p=>p.classList.remove('open'));$('#'+id).classList.add('open');renderAllPanels()}
function loop(now){const dt=Math.min(.033,(now-last)/1000);last=now;update(dt,now);terrain();for(const n of npcs)drawNpc(n);drawCorpses();for(const e of enemies)drawEnemy(e);drawPlayer();drawEffects();requestAnimationFrame(loop)}
document.addEventListener('keydown',e=>{keys[e.code]=true;if(['Space','Digit1','Digit2','Digit3','KeyE'].includes(e.code))e.preventDefault();if(e.code==='Space')$('#battle').click();if(e.code==='Digit1')attack();if(e.code==='Digit2')magic();if(e.code==='Digit3')heal();if(e.code==='KeyE')use()});
document.addEventListener('keyup',e=>keys[e.code]=false);
canvas.addEventListener('dblclick',e=>selectWorld(e.clientX,e.clientY));let lastTap=0;canvas.addEventListener('pointerup',e=>{if(performance.now()-lastTap<340)selectWorld(e.clientX,e.clientY);lastTap=performance.now()});
for(const [id,fn] of [['attack',attack],['magic',magic],['heal',heal],['use',use],['potion',potion]])$('#'+id).onclick=fn;
$('#battle').onclick=()=>{player.battle=!player.battle;if(!player.battle)player.target=null;else player.nextAttack=0;updateHud()};
$$('[data-panel]').forEach(b=>b.onclick=()=>openPanel(b.dataset.panel));$$('.close').forEach(b=>b.onclick=()=>b.closest('.panel').classList.remove('open'));$('#profileButton').onclick=()=>openPanel('profile');
document.addEventListener('click',e=>{const item=e.target.closest('[data-item]'),slot=e.target.closest('[data-slot]');if(item&&!e.target.closest('#corpseGrid')){player.selectedItem=item.dataset.item;player.selectedSlot=null;renderCharacter()}if(item&&e.target.closest('#corpseGrid'))takeCorpseItem(item.dataset.item);if(slot){player.selectedSlot=slot.dataset.slot;player.selectedItem=null;renderCharacter()}if(e.target.id==='equipSelected')equipItem(player.selectedItem);if(e.target.id==='dropSelected')dropSelected();if(e.target.id==='unequipSelected')unequipSlot(player.selectedSlot);if(e.target.matches('.skillmode')){const n=e.target.dataset.skill,m=['↑ Subir','— Mantener','↓ Bajar'],i=m.indexOf(player.skillModes[n]||m[0]);player.skillModes[n]=m[(i+1)%3];renderSkills()}});
$('#takeAll').onclick=()=>{if(!openCorpse)return;[...openCorpse.items].forEach(i=>addToBag(i));openCorpse.items=[];openCorpse.looted=true;toast('Has recogido todo');renderLoot();renderCharacter()};
const joyEl=$('#joy'),knob=$('#knob');function joyMove(e){const r=joyEl.getBoundingClientRect(),x=e.clientX-(r.left+r.width/2),y=e.clientY-(r.top+r.height/2),m=Math.min(38,Math.hypot(x,y)),a=Math.atan2(y,x);joy.x=Math.cos(a)*m/38;joy.y=Math.sin(a)*m/38;knob.style.transform=`translate(${joy.x*34}px,${joy.y*34}px)`}
joyEl.addEventListener('pointerdown',e=>{joy.active=true;joyEl.setPointerCapture(e.pointerId);joyMove(e)});joyEl.addEventListener('pointermove',e=>{if(joy.active)joyMove(e)});joyEl.addEventListener('pointerup',()=>{joy.active=false;joy.x=joy.y=0;knob.style.transform=''});
enemies.forEach(e=>{e.spawnX=e.x;e.spawnY=e.y});renderAllPanels();updateHud();requestAnimationFrame(loop);
