"use strict";

// ---- js/data/skills.js ----
const SKILL_CAP = 650;
const SKILLS = [
  ['combat','Arco',50],['combat','Esgrima',20],['combat','Armas contundentes',20],['combat','Espada',50],['combat','Pelea',20],['combat','Tácticas',50],['combat','Anatomía',20],['combat','Curar',20],['combat','Bloquear',20],['combat','Resistencia mágica',20],
  ['magic','Magia',20],['magic','Nigromancia',0],['magic','Devoción',0],['magic','Concentración',20],['magic','Hablar con espíritus',0],
  ['craft','Alquimia',0],['craft','Herrería',20],['craft','Flechería',0],['craft','Carpintería',0],['craft','Sastrería',0],['craft','Inscripción',0],['craft','Cartografía',0],['craft','Cocina',0],['craft','Minería',20],['craft','Tala',0],['craft','Pesca',0],['craft','Conocimiento de armas',20],
  ['bard','Música',0],['bard','Discordia',0],['bard','Pacificación',0],['bard','Provocación',0],
  ['nature','Domar',0],['nature','Conocimiento animal',0],['nature','Veterinaria',0],['nature','Rastrear',0],['nature','Acampar',0],['nature','Dominio de bestias',0],
  ['stealth','Ocultarse',0],['stealth','Sigilo',0],['stealth','Robar',0],['stealth','Hurgar',0],['stealth','Detectar ocultos',0],['stealth','Ganzúas',0],['stealth','Desactivar trampas',0],['stealth','Envenenar',0]
].map(([group,name,value])=>({group,name,value,cap:100,locked:false}));

const SKILL_GROUPS={combat:'Combate',magic:'Magia',craft:'Artesanía y recolección',bard:'Bardo',nature:'Naturaleza',stealth:'Sigilo y crimen'};


// ---- js/data/items.js ----
const ITEMS={
  iron_sword:{id:'iron_sword',name:'Espada de hierro',icon:'🗡️',type:'weapon',slot:'weapon',stack:false,power:8,skill:'Espada',insured:false,description:'Espada equilibrada de una mano.'},
  oak_shield:{id:'oak_shield',name:'Escudo reforzado',icon:'🛡️',type:'armor',slot:'shield',stack:false,armor:5,skill:'Bloquear',insured:false,description:'Escudo de madera reforzado con hierro.'},
  leather_chest:{id:'leather_chest',name:'Pechera de cuero',icon:'🥋',type:'armor',slot:'chest',stack:false,armor:3,insured:false,description:'Armadura ligera de cuero.'},
  bandage:{id:'bandage',name:'Vendas',icon:'🩹',type:'consumable',stack:true,maxStack:999,description:'Detiene sangrado y recupera vida.'},
  health_potion:{id:'health_potion',name:'Poción de vida',icon:'🧪',type:'consumable',stack:true,maxStack:99,description:'Recupera vida de inmediato.'},
  iron_ore:{id:'iron_ore',name:'Mena de hierro',icon:'🪨',type:'resource',stack:true,maxStack:9999,description:'Debe fundirse para obtener lingotes.'},
  iron_ingot:{id:'iron_ingot',name:'Lingote de hierro',icon:'▰',type:'resource',stack:true,maxStack:9999,description:'Metal común para herrería.'},
  copper_ore:{id:'copper_ore',name:'Mena de cobre',icon:'🟫',type:'resource',stack:true,maxStack:9999,description:'Mena que requiere experiencia para extraer con constancia.'},
  copper_ingot:{id:'copper_ingot',name:'Lingote de cobre',icon:'▰',type:'resource',stack:true,maxStack:9999,description:'Metal trabajado de nivel medio.'},
  troll_hide:{id:'troll_hide',name:'Piel de troll',icon:'🟩',type:'resource',stack:true,maxStack:9999,description:'Piel gruesa de criatura monstruosa.'},
  troll_leather:{id:'troll_leather',name:'Cuero de troll',icon:'🟢',type:'resource',stack:true,maxStack:9999,description:'Material resistente para sastrería avanzada.'},
  gold:{id:'gold',name:'Oro',icon:'🪙',type:'currency',stack:true,maxStack:999999,description:'El oro transportado cae en el cadáver.'},
  skill_contract_110:{id:'skill_contract_110',name:'Contrato mágico 110',icon:'📜',type:'contract',stack:false,description:'Eleva el límite de una habilidad a 110.'}
};
const createItem=(id,qty=1,extra={})=>({uid:crypto.randomUUID?.()||`${Date.now()}-${Math.random()}`,id,qty,...extra});


// ---- js/data/recipes.js ----
const RECIPES=[
  {id:'smelt_iron',category:'Fundición',name:'Fundir hierro',skill:'Herrería',level:0,needs:{iron_ore:3},gives:{iron_ingot:1}},
  {id:'smelt_copper',category:'Fundición',name:'Fundir cobre',skill:'Herrería',level:0,needs:{copper_ore:3},gives:{copper_ingot:1}},
  {id:'cure_troll',category:'Sastrería',name:'Curar piel de troll',skill:'Sastrería',level:0,needs:{troll_hide:2},gives:{troll_leather:1}},
  {id:'iron_sword',category:'Herrería',name:'Espada de hierro',skill:'Herrería',level:20,needs:{iron_ingot:8},gives:{iron_sword:1}},
  {id:'leather_chest',category:'Sastrería',name:'Pechera de cuero',skill:'Sastrería',level:15,needs:{troll_leather:6},gives:{leather_chest:1}},
  {id:'bandages',category:'Sastrería',name:'Vendas',skill:'Sastrería',level:0,needs:{troll_leather:1},gives:{bandage:4}},
  {id:'health_potion',category:'Alquimia',name:'Poción de vida',skill:'Alquimia',level:0,needs:{troll_hide:1},gives:{health_potion:1}}
];


// ---- js/character/inventory.js ----

class Inventory{
  constructor(capacity=60){this.capacity=capacity;this.items=[]}
  add(id,qty=1,extra={}){const def=ITEMS[id];if(!def)return false;if(def.stack){const stack=this.items.find(i=>i.id===id);if(stack){stack.qty+=qty;return true}}if(this.items.length>=this.capacity)return false;this.items.push(createItem(id,qty,extra));return true}
  count(id){return this.items.filter(i=>i.id===id).reduce((n,i)=>n+i.qty,0)}
  has(needs){return Object.entries(needs).every(([id,q])=>this.count(id)>=q)}
  remove(id,qty=1){let left=qty;for(let i=this.items.length-1;i>=0&&left>0;i--){const it=this.items[i];if(it.id!==id)continue;const take=Math.min(left,it.qty);it.qty-=take;left-=take;if(it.qty<=0)this.items.splice(i,1)}return left===0}
  consume(uid,qty=1){const i=this.items.findIndex(x=>x.uid===uid);if(i<0)return false;this.items[i].qty-=qty;if(this.items[i].qty<=0)this.items.splice(i,1);return true}
  byUid(uid){return this.items.find(i=>i.uid===uid)}
  sort(){this.items.sort((a,b)=>(ITEMS[a.id].type+ITEMS[a.id].name).localeCompare(ITEMS[b.id].type+ITEMS[b.id].name))}
}


// ---- js/character/equipment.js ----

const EQUIPMENT_SLOTS=['head','neck','chest','arms','hands','pants','boots','ring1','ring2','cloak','robe','weapon','shield'];
class Equipment{
  constructor(){this.slots=Object.fromEntries(EQUIPMENT_SLOTS.map(s=>[s,null]))}
  equip(item,inventory){const def=ITEMS[item.id];let slot=def.slot;if(slot==='ring')slot=this.slots.ring1?'ring2':'ring1';if(!slot||!(slot in this.slots))return false;const previous=this.slots[slot];this.slots[slot]=item;inventory.items=inventory.items.filter(i=>i.uid!==item.uid);if(previous)inventory.items.push(previous);return true}
  unequip(slot,inventory){const item=this.slots[slot];if(!item||inventory.items.length>=inventory.capacity)return false;inventory.items.push(item);this.slots[slot]=null;return true}
  armor(){return Object.values(this.slots).filter(Boolean).reduce((n,i)=>n+(ITEMS[i.id].armor||0),0)}
  weapon(){return this.slots.weapon?ITEMS[this.slots.weapon.id]:null}
}


// ---- js/character/skills.js ----

class SkillBook{
  constructor(){this.skills=SKILLS.map(s=>({...s}))}
  get(name){return this.skills.find(s=>s.name===name)}
  total(){return this.skills.reduce((a,s)=>a+s.value,0)}
  gain(name,amount=.1){const s=this.get(name);if(!s||s.locked||s.value>=s.cap)return false;const room=SKILL_CAP-this.total();if(room<=0)return false;const before=s.value;s.value=Math.min(s.cap,s.value,SKILL_CAP-this.total()+s.value+amount);return s.value>before}
}


// ---- js/character/player.js ----

class Player{
  constructor(){this.x=520;this.y=480;this.radius=14;this.speed=175;this.color='#d2b48c';this.hp=100;this.maxHp=100;this.mana=60;this.maxMana=60;this.stamina=100;this.maxStamina=100;this.dead=false;this.battle=false;this.facing={x:1,y:0};this.inventory=new Inventory(60);this.equipment=new Equipment();this.skills=new SkillBook();this.cooldowns={attack:0,spell:0,heal:0};this.checkpoint={x:520,y:480};this.inventory.add('iron_sword');this.inventory.add('oak_shield');this.inventory.add('leather_chest');this.inventory.add('bandage',12);this.inventory.add('health_potion',4);this.inventory.add('iron_ore',18);this.inventory.add('troll_hide',6);this.inventory.add('gold',220)}
  update(dt,input,world){if(this.dead)return;let dx=input.x,dy=input.y;if(dx||dy){const len=Math.hypot(dx,dy)||1;dx/=len;dy/=len;this.facing={x:dx,y:dy};this.x+=dx*this.speed*dt;this.y+=dy*this.speed*dt;world.clamp(this)}this.cooldowns.attack=Math.max(0,this.cooldowns.attack-dt);this.cooldowns.spell=Math.max(0,this.cooldowns.spell-dt);this.cooldowns.heal=Math.max(0,this.cooldowns.heal-dt);this.stamina=Math.min(this.maxStamina,this.stamina+15*dt);this.mana=Math.min(this.maxMana,this.mana+5*dt)}
}


// ---- js/world/corpses.js ----
class Corpse{constructor(x,y,owner,items=[]){this.x=x;this.y=y;this.owner=owner;this.items=items;this.created=performance.now();this.radius=16;this.looted=false}}


// ---- js/world/loot.js ----
function enemyLoot(enemy){if(enemy.type==='troll')return [{id:'troll_hide',qty:2+Math.floor(Math.random()*3)},{id:'gold',qty:35+Math.floor(Math.random()*60)}];return [{id:'gold',qty:12+Math.floor(Math.random()*25)},{id:Math.random()<.35?'bandage':'iron_ore',qty:1+Math.floor(Math.random()*3)}]}


// ---- js/world/entities.js ----
class Enemy{
  constructor(x,y,type='bandit'){this.x=x;this.y=y;this.radius=13;this.type=type;this.hp=type==='troll'?85:45;this.maxHp=this.hp;this.speed=type==='troll'?55:80;this.damage=type==='troll'?15:8;this.color=type==='troll'?'#5b7f4e':'#8a3c35';this.dead=false;this.attackCd=0;this.loot=false}
  update(dt,player,world){if(this.dead)return;this.attackCd=Math.max(0,this.attackCd-dt);const d=Math.hypot(player.x-this.x,player.y-this.y);if(d<260&&!player.dead){if(d>28){this.x+=(player.x-this.x)/d*this.speed*dt;this.y+=(player.y-this.y)/d*this.speed*dt;world.clamp(this)}else if(this.attackCd===0){player.hp=Math.max(0,player.hp-this.damage);this.attackCd=1.2;if(player.hp<=0)player.dead=true}}}
}
const makeEnemies=()=>[
  new Enemy(1050,420),new Enemy(1110,500),new Enemy(1270,610),new Enemy(1460,530),new Enemy(1390,880,'troll'),new Enemy(1250,990,'troll')
];


// ---- js/world/map.js ----
class WorldMap{
  constructor(){this.width=1800;this.height=1300;this.city={x:310,y:260,w:620,h:430};this.safeDungeon={x:1180,y:180,w:360,h:260};this.mine={x:1050,y:760,w:420,h:300};this.trees=Array.from({length:65},(_,i)=>({x:80+(i*131)%1650,y:90+(i*223)%1150,r:18+((i*7)%10)}));this.rocks=Array.from({length:24},(_,i)=>({x:980+(i*83)%500,y:730+(i*117)%340,r:15}));this.houses=[...Array(12)].map((_,i)=>({x:350+(i%4)*135,y:315+Math.floor(i/4)*105,w:85,h:65}));}
  clamp(e){e.x=Math.max(e.radius,Math.min(this.width-e.radius,e.x));e.y=Math.max(e.radius,Math.min(this.height-e.radius,e.y))}
  inRect(x,y,r){return x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h}
  isCity(x,y){return this.inRect(x,y,this.city)}
  draw(ctx,camera){ctx.save();ctx.translate(-camera.x,-camera.y);ctx.fillStyle='#263120';ctx.fillRect(0,0,this.width,this.height);ctx.fillStyle='#7b725a';ctx.fillRect(this.city.x,this.city.y,this.city.w,this.city.h);ctx.fillStyle='#463a2c';ctx.fillRect(this.city.x+270,this.city.y,this.city.w-540,this.city.h);ctx.fillRect(this.city.x,this.city.y+185,this.city.w,this.city.h-370);ctx.strokeStyle='#99866c';ctx.lineWidth=10;ctx.strokeRect(this.city.x,this.city.y,this.city.w,this.city.h);ctx.fillStyle='#252b29';ctx.fillRect(this.safeDungeon.x,this.safeDungeon.y,this.safeDungeon.w,this.safeDungeon.h);ctx.strokeStyle='#607b73';ctx.lineWidth=5;ctx.strokeRect(this.safeDungeon.x,this.safeDungeon.y,this.safeDungeon.w,this.safeDungeon.h);ctx.fillStyle='#6b5a43';ctx.fillRect(this.mine.x,this.mine.y,this.mine.w,this.mine.h);ctx.fillStyle='#342b22';ctx.font='16px system-ui';ctx.fillText('Ciudad de Valdora',this.city.x+15,this.city.y+28);ctx.fillStyle='#b8d8cd';ctx.fillText('Mazmorra amistosa',this.safeDungeon.x+16,this.safeDungeon.y+28);ctx.fillStyle='#e6d0a3';ctx.fillText('Cantera y minas',this.mine.x+16,this.mine.y+28);for(const h of this.houses){ctx.fillStyle='#4b3527';ctx.fillRect(h.x,h.y,h.w,h.h);ctx.fillStyle='#6f4b36';ctx.beginPath();ctx.moveTo(h.x-7,h.y);ctx.lineTo(h.x+h.w/2,h.y-28);ctx.lineTo(h.x+h.w+7,h.y);ctx.closePath();ctx.fill();ctx.fillStyle='#d9bf82';ctx.fillRect(h.x+34,h.y+38,17,27)}for(const t of this.trees){ctx.fillStyle='#3c2b1e';ctx.fillRect(t.x-4,t.y,t.r*.35,t.r);ctx.fillStyle='#274627';ctx.beginPath();ctx.arc(t.x,t.y,t.r,0,Math.PI*2);ctx.fill()}for(const r of this.rocks){ctx.fillStyle='#77736a';ctx.beginPath();ctx.arc(r.x,r.y,r.r,0,Math.PI*2);ctx.fill()}ctx.restore()}
}


// ---- js/core/camera.js ----
class Camera{constructor(canvas,world){this.canvas=canvas;this.world=world;this.x=0;this.y=0}update(target){this.x=Math.max(0,Math.min(this.world.width-this.canvas.width,target.x-this.canvas.width/2));this.y=Math.max(0,Math.min(this.world.height-this.canvas.height,target.y-this.canvas.height/2))}}


// ---- js/core/input.js ----
class Input{
  constructor(){this.keys=new Set();this.touch={x:0,y:0};this.root=document.getElementById('joystick');this.knob=document.getElementById('joystick-knob');addEventListener('keydown',e=>this.keys.add(e.key.toLowerCase()));addEventListener('keyup',e=>this.keys.delete(e.key.toLowerCase()));this.root.addEventListener('pointerdown',e=>{this.root.setPointerCapture(e.pointerId);this.move(e)});this.root.addEventListener('pointermove',e=>{if(this.root.hasPointerCapture(e.pointerId))this.move(e)});this.root.addEventListener('pointerup',e=>{this.root.releasePointerCapture(e.pointerId);this.touch={x:0,y:0};this.knob.style.transform='translate(0,0)'})}
  move(e){const r=this.root.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;let dx=e.clientX-cx,dy=e.clientY-cy;const max=r.width*.3,l=Math.hypot(dx,dy)||1;if(l>max){dx=dx/l*max;dy=dy/l*max}this.touch={x:dx/max,y:dy/max};this.knob.style.transform=`translate(${dx}px,${dy}px)`}
  vector(){let x=this.touch.x,y=this.touch.y;if(this.keys.has('a')||this.keys.has('arrowleft'))x-=1;if(this.keys.has('d')||this.keys.has('arrowright'))x+=1;if(this.keys.has('w')||this.keys.has('arrowup'))y-=1;if(this.keys.has('s')||this.keys.has('arrowdown'))y+=1;return{x,y}}
}


// ---- js/systems/combat.js ----

class CombatSystem{
  constructor(game){this.game=game}
  nearest(range=120){const p=this.game.player;return this.game.enemies.filter(e=>!e.dead).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y)).find(e=>Math.hypot(e.x-p.x,e.y-p.y)<=range)}
  attack(){const p=this.game.player;if(p.dead||p.cooldowns.attack>0)return;const target=this.nearest(95);if(!target){this.game.toast('No hay objetivo en alcance');return}const weapon=p.equipment.weapon();const damage=7+(weapon?.power||2)+p.skills.get(weapon?.skill||'Pelea').value*.035;target.hp-=Math.round(damage);p.cooldowns.attack=.55;p.stamina=Math.max(0,p.stamina-7);p.skills.gain(weapon?.skill||'Pelea',.12);p.skills.gain('Tácticas',.06);this.game.floatText(target.x,target.y,`-${Math.round(damage)}`);if(target.hp<=0){target.dead=true;const loot=enemyLoot(target);this.game.corpses.push(new Corpse(target.x,target.y,'criatura',loot));this.game.toast(`${target.type==='troll'?'Troll':'Bandido'} derrotado`,'good')}}
  spell(){const p=this.game.player;if(p.dead||p.cooldowns.spell>0||p.mana<14)return this.game.toast('No puedes lanzar magia');const target=this.nearest(240);if(!target)return this.game.toast('No hay objetivo para el hechizo');target.hp-=18;p.mana-=14;p.cooldowns.spell=1.2;p.skills.gain('Magia',.15);p.skills.gain('Concentración',.04);this.game.projectiles.push({x:p.x,y:p.y,target,life:.45});this.game.floatText(target.x,target.y,'-18 🔥');if(target.hp<=0){target.dead=true;this.game.corpses.push(new Corpse(target.x,target.y,'criatura',enemyLoot(target)))}}
}


// ---- js/systems/healing.js ----
class HealingSystem{constructor(game){this.game=game}bandage(){const p=this.game.player;if(p.dead||p.cooldowns.heal>0)return;const item=p.inventory.items.find(i=>i.id==='bandage');if(!item)return this.game.toast('No tienes vendas');p.inventory.consume(item.uid);p.cooldowns.heal=2.5;this.game.toast('Aplicando vendas…');setTimeout(()=>{if(!p.dead){p.hp=Math.min(p.maxHp,p.hp+28);p.skills.gain('Curar',.12);p.skills.gain('Anatomía',.04);this.game.toast('Heridas estabilizadas','good');this.game.ui.renderAll()}},1500)}potion(){const p=this.game.player;const item=p.inventory.items.find(i=>i.id==='health_potion');if(!item)return this.game.toast('No tienes pociones');p.inventory.consume(item.uid);p.hp=Math.min(p.maxHp,p.hp+35);this.game.toast('Poción consumida','good');this.game.ui.renderAll()}}


// ---- js/systems/gathering.js ----
class GatheringSystem{constructor(game){this.game=game;this.busy=false}gather(){if(this.busy)return;const {player:p,world}=this.game;if(!world.inRect(p.x,p.y,world.mine))return this.game.toast('Debes estar en la zona minera');this.busy=true;let hits=0;this.game.toast('Comienzas a extraer…');const timer=setInterval(()=>{if(p.dead){clearInterval(timer);this.busy=false;return}hits++;this.game.floatText(p.x,p.y-18,'⛏️');if(hits>=5){clearInterval(timer);this.busy=false;const copper=Math.random()<Math.min(.5,p.skills.get('Minería').value/120);p.inventory.add(copper?'copper_ore':'iron_ore',copper?2:5);p.skills.gain('Minería',.18);this.game.toast(copper?'Encontraste cobre':'Obtuviste mena de hierro','good');this.game.ui.renderAll()}},340)}}


// ---- js/systems/crafting.js ----

class CraftingSystem{constructor(game){this.game=game}recipes(){return RECIPES}craft(recipe){const p=this.game.player;const skill=p.skills.get(recipe.skill);if((skill?.value||0)<recipe.level)return this.game.toast(`Necesitas ${recipe.skill} ${recipe.level}`,'bad');if(!p.inventory.has(recipe.needs))return this.game.toast('Faltan materiales','bad');for(const[id,q]of Object.entries(recipe.needs))p.inventory.remove(id,q);for(const[id,q]of Object.entries(recipe.gives))p.inventory.add(id,q);p.skills.gain(recipe.skill,.2);this.game.toast(`${recipe.name} creado`,'good');this.game.ui.renderAll()}}


// ---- js/ui/inventory-menu.js ----

const SLOT_NAMES={head:'Cabeza',neck:'Cuello',chest:'Pechera',arms:'Brazos',hands:'Guantes',pants:'Pantalones',boots:'Botas',ring1:'Anillo I',ring2:'Anillo II',cloak:'Capa',robe:'Túnica',weapon:'Arma',shield:'Escudo'};
class InventoryMenu{
  constructor(game){this.game=game;this.dialog=document.getElementById('inventory-dialog');this.grid=document.getElementById('inventory-grid');this.equipment=document.getElementById('equipment-slots');this.detail=document.getElementById('item-detail');this.selected=null;document.getElementById('open-inventory').addEventListener('click',()=>{this.render();this.dialog.showModal()});document.getElementById('sort-inventory').addEventListener('click',()=>{game.player.inventory.sort();this.render()})}
  render(){const p=this.game.player;document.getElementById('inventory-weight').textContent=`Slots ${p.inventory.items.length}/${p.inventory.capacity}`;this.grid.innerHTML='';p.inventory.items.forEach(item=>{const d=ITEMS[item.id],b=document.createElement('button');b.className='inv-slot'+(this.selected===item.uid?' selected':'');b.innerHTML=`${d.icon}<small>${d.stack&&item.qty>1?item.qty:''}</small>`;b.title=d.name;b.addEventListener('click',()=>{this.selected=item.uid;this.render();this.showDetail(item)});b.addEventListener('dblclick',()=>{if(d.slot&&p.equipment.equip(item,p.inventory)){this.selected=null;this.render();this.game.toast(`${d.name} equipado`,'good')}});this.grid.append(b)});this.equipment.innerHTML='';for(const slot of EQUIPMENT_SLOTS){const item=p.equipment.slots[slot],d=item?ITEMS[item.id]:null,b=document.createElement('button');b.className='equipment-slot';b.innerHTML=`<b>${SLOT_NAMES[slot]}</b>${d?`${d.icon} ${d.name}`:'Vacío'}`;if(item)b.addEventListener('click',()=>{p.equipment.unequip(slot,p.inventory);this.render()});this.equipment.append(b)}document.getElementById('potion-count').textContent=p.inventory.count('health_potion')}
  showDetail(item){const d=ITEMS[item.id];this.detail.innerHTML=`<strong>${d.icon} ${d.name}</strong><p>${d.description||''}</p>${d.slot?'<button id="equip-selected">Equipar</button>':''}`;const btn=document.getElementById('equip-selected');if(btn)btn.addEventListener('click',()=>{if(this.game.player.equipment.equip(item,this.game.player.inventory)){this.selected=null;this.render()}})}
}


// ---- js/ui/skills-menu.js ----

class SkillsMenu{constructor(game){this.game=game;this.dialog=document.getElementById('skills-dialog');this.list=document.getElementById('skills-list');document.getElementById('open-skills').addEventListener('click',()=>{this.render();this.dialog.showModal()})}render(){const book=this.game.player.skills;document.getElementById('skill-total').textContent=`${book.total().toFixed(1)} / ${SKILL_CAP}`;this.list.innerHTML='';for(const[group,label]of Object.entries(SKILL_GROUPS)){const title=document.createElement('h3');title.textContent=label;title.style.gridColumn='1/-1';title.style.margin='8px 0 0';this.list.append(title);book.skills.filter(s=>s.group===group).forEach(s=>{const row=document.createElement('div');row.className='skill-row';row.innerHTML=`<div>${s.name}<small>Máximo actual: ${s.cap}</small></div><strong>${s.value.toFixed(1)}</strong>`;this.list.append(row)})}}}


// ---- js/ui/crafting-menu.js ----

class CraftingMenu{constructor(game){this.game=game;this.dialog=document.getElementById('crafting-dialog');this.nav=document.getElementById('crafting-categories');this.list=document.getElementById('recipe-list');this.active=null;document.getElementById('open-crafting').addEventListener('click',()=>{this.render();this.dialog.showModal()})}render(){const recipes=this.game.crafting.recipes(),cats=[...new Set(recipes.map(r=>r.category))];if(!this.active)this.active=cats[0];this.nav.innerHTML='';cats.forEach(c=>{const b=document.createElement('button');b.textContent=c;b.classList.toggle('active',c===this.active);b.addEventListener('click',()=>{this.active=c;this.render()});this.nav.append(b)});this.list.innerHTML='';recipes.filter(r=>r.category===this.active).forEach(r=>{const needs=Object.entries(r.needs).map(([id,q])=>`${ITEMS[id].name} ×${q}`).join(', ');const card=document.createElement('article');card.className='recipe-card';card.innerHTML=`<div><h3>${r.name}</h3><p>${needs}</p><p>${r.skill} ${r.level}</p></div><button>Crear</button>`;card.querySelector('button').addEventListener('click',()=>this.game.crafting.craft(r));this.list.append(card)})}}


// ---- js/ui/hud.js ----

class UI{
  constructor(game){this.game=game;this.inventory=new InventoryMenu(game);this.skills=new SkillsMenu(game);this.crafting=new CraftingMenu(game);document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>b.closest('dialog').close()));document.getElementById('battle-toggle').addEventListener('click',()=>{game.player.battle=!game.player.battle;this.renderHud()});document.getElementById('attack-btn').addEventListener('click',()=>game.combat.attack());document.getElementById('spell-btn').addEventListener('click',()=>game.combat.spell());document.getElementById('heal-btn').addEventListener('click',()=>game.healing.bandage());document.getElementById('potion-btn').addEventListener('click',()=>game.healing.potion());document.getElementById('gather-btn').addEventListener('click',()=>game.gathering.gather());document.getElementById('use-btn').addEventListener('click',()=>game.use());addEventListener('keydown',e=>{if(e.code==='Space')game.combat.attack();if(e.key==='1')game.combat.spell();if(e.key==='2')game.healing.bandage()})}
  renderHud(){const p=this.game.player;for(const[name,val,max]of [['hp',p.hp,p.maxHp],['mana',p.mana,p.maxMana],['stamina',p.stamina,p.maxStamina]]){document.getElementById(`${name}-bar`).style.width=`${val/max*100}%`;document.getElementById(`${name}-text`).textContent=`${Math.round(val)}/${max}`}const btn=document.getElementById('battle-toggle');btn.textContent=p.battle?'⚔️':'🛡️';btn.classList.toggle('active',p.battle);document.getElementById('potion-count').textContent=p.inventory.count('health_potion')}
  renderAll(){this.renderHud();this.inventory.render();if(this.skills.dialog.open)this.skills.render();if(this.crafting.dialog.open)this.crafting.render()}
}


// ---- js/core/game.js ----

class Game{
  constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.world=new WorldMap();this.player=new Player();this.enemies=makeEnemies();this.corpses=[];this.projectiles=[];this.texts=[];this.input=new Input();this.camera=new Camera(canvas,this.world);this.combat=new CombatSystem(this);this.healing=new HealingSystem(this);this.gathering=new GatheringSystem(this);this.crafting=new CraftingSystem(this);this.ui=new UI(this);this.last=performance.now();this.resize();addEventListener('resize',()=>this.resize());this.ui.renderAll();requestAnimationFrame(t=>this.loop(t))}
  resize(){const dpr=Math.min(devicePixelRatio||1,2),r=this.canvas.getBoundingClientRect();this.canvas.width=Math.round(r.width*dpr);this.canvas.height=Math.round(r.height*dpr);this.ctx.setTransform(dpr,0,0,dpr,0,0);this.canvas.widthCss=r.width;this.canvas.heightCss=r.height;this.camera.canvas={width:r.width,height:r.height}}
  loop(now){const dt=Math.min(.033,(now-this.last)/1000);this.last=now;this.update(dt);this.draw();requestAnimationFrame(t=>this.loop(t))}
  update(dt){const p=this.player;if(p.dead){this.handleDeath()}else{p.update(dt,this.input.vector(),this.world);for(const e of this.enemies)e.update(dt,p,this.world)}this.camera.update(p);for(const pr of this.projectiles)pr.life-=dt;this.projectiles=this.projectiles.filter(p=>p.life>0);for(const t of this.texts)t.life-=dt;this.texts=this.texts.filter(t=>t.life>0);this.ui.renderHud()}
  handleDeath(){if(this.deathHandled)return;this.deathHandled=true;const dropped=[];for(const item of [...this.player.inventory.items]){const def=ITEMS[item.id];if((def.type==='weapon'||def.type==='armor')&&item.insured)continue;dropped.push({id:item.id,qty:item.qty});this.player.inventory.items=this.player.inventory.items.filter(i=>i.uid!==item.uid)}for(const[slot,item]of Object.entries(this.player.equipment.slots)){if(!item)continue;const def=ITEMS[item.id];if(!item.insured){dropped.push({id:item.id,qty:1});this.player.equipment.slots[slot]=null}}this.corpses.push({x:this.player.x,y:this.player.y,owner:'jugador',items:dropped,radius:17});this.toast('Has muerto. Tu equipo no asegurado quedó en el cuerpo.','bad');setTimeout(()=>{this.player.x=this.player.checkpoint.x;this.player.y=this.player.checkpoint.y;this.player.hp=this.player.maxHp;this.player.mana=this.player.maxMana;this.player.stamina=this.player.maxStamina;this.player.dead=false;this.deathHandled=false;this.ui.renderAll()},1400)}
  use(){const p=this.player;const corpse=this.corpses.find(c=>Math.hypot(c.x-p.x,c.y-p.y)<45&&c.items.length);if(corpse){for(const it of corpse.items)p.inventory.add(it.id,it.qty);corpse.items=[];this.toast('Cadáver saqueado','good');this.ui.renderAll();return}if(this.world.isCity(p.x,p.y)){p.checkpoint={x:p.x,y:p.y};this.toast('Punto de control guardado en la ciudad','good');return}this.toast('No hay nada que usar')}
  toast(text,type=''){const el=document.createElement('div');el.className=`toast ${type}`;el.textContent=text;document.getElementById('toast-stack').append(el);setTimeout(()=>el.remove(),2200)}
  floatText(x,y,text){this.texts.push({x,y,text,life:1})}
  draw(){const ctx=this.ctx,w=this.canvas.widthCss,h=this.canvas.heightCss;ctx.clearRect(0,0,w,h);this.world.draw(ctx,this.camera);ctx.save();ctx.translate(-this.camera.x,-this.camera.y);for(const c of this.corpses){ctx.fillStyle=c.items.length?'#3b201c':'#25211f';ctx.beginPath();ctx.ellipse(c.x,c.y,18,9,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#d8c7a4';ctx.font='11px system-ui';ctx.fillText(c.items.length?'Cadáver':'Vacío',c.x-22,c.y-13)}for(const e of this.enemies){if(e.dead)continue;ctx.fillStyle=e.color;ctx.beginPath();ctx.arc(e.x,e.y,e.radius,0,Math.PI*2);ctx.fill();ctx.fillStyle='#1b1210';ctx.fillRect(e.x-16,e.y-22,32,4);ctx.fillStyle='#b94239';ctx.fillRect(e.x-16,e.y-22,32*(e.hp/e.maxHp),4)}for(const pr of this.projectiles){const t=1-pr.life/.45;ctx.fillStyle='#ff8a35';ctx.beginPath();ctx.arc(pr.x+(pr.target.x-pr.x)*t,pr.y+(pr.target.y-pr.y)*t,7,0,Math.PI*2);ctx.fill()}const p=this.player;ctx.fillStyle=p.dead?'#6f6258':p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.radius,0,Math.PI*2);ctx.fill();ctx.strokeStyle=p.battle?'#c84d42':'#d8b56a';ctx.lineWidth=3;ctx.stroke();ctx.strokeStyle='#eee';ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x+p.facing.x*22,p.y+p.facing.y*22);ctx.stroke();for(const t of this.texts){ctx.globalAlpha=t.life;ctx.fillStyle='#ffe4a8';ctx.font='bold 14px system-ui';ctx.fillText(t.text,t.x,t.y-(1-t.life)*28);ctx.globalAlpha=1}ctx.restore()}
}


(function startProyectoUltra(){
  const boot=()=>{
    try {
      const canvas=document.getElementById('game-canvas');
      if(!canvas) throw new Error('No se encontró game-canvas');
      window.__proyectoUltraGame=new Game(canvas);
      document.documentElement.dataset.gameReady='true';
    } catch(error) {
      console.error(error);
      const box=document.createElement('pre');
      box.textContent='Error al iniciar el juego:\n'+(error?.stack||error);
      Object.assign(box.style,{position:'fixed',left:'12px',right:'12px',top:'90px',zIndex:'9999',padding:'12px',whiteSpace:'pre-wrap',background:'#2a1111',color:'#ffd6d6',border:'1px solid #a44',borderRadius:'10px',maxHeight:'60vh',overflow:'auto'});
      document.body.appendChild(box);
    }
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
