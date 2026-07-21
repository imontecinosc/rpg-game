"use strict";

const $ = id => document.getElementById(id);
const canvas = $("gameCanvas");
const ctx = canvas.getContext("2d");
const characterCanvas = $("characterCanvas");
const characterCtx = characterCanvas.getContext("2d");
const minimapCanvas = $("minimapCanvas");
const minimapCtx = minimapCanvas.getContext("2d");

const WORLD_SIZE = 200;
const TILE_W = 72;
const TILE_H = 36;
const VIEW = 18;
const INVENTORY_LIMIT = 30;
const ENEMY_RESPAWN = 120;

let started = false;
let paused = false;
let lastTime = 0;
let activeTouchId = null;
let selectedInventoryIndex = -1;
let selectedEquipmentInventoryIndex = -1;
let activeShop = null;
let currentCorpse = null;
let specialTimer = 180;

const camera = { x: 0, y: 0 };
const joystick = { x: 0, y: 0, active: false };

const skills = {
  swords: skill("Espadas"),
  tactics: skill("Tácticas"),
  anatomy: skill("Anatomía"),
  defense: skill("Defensa"),
  endurance: skill("Resistencia"),
  healing: skill("Curación"),
  magery: skill("Magia"),
  evaluating: skill("Evaluar inteligencia"),
  meditation: skill("Meditación"),
  magicResistance: skill("Resistencia mágica"),
  inscription: skill("Inscripción")
};

function skill(name){ return { name, value: 20, progress: 0 }; }

const itemTemplates = {
  oldSword:{name:"Espada vieja",icon:"🗡️",slot:"mainHand",type:"weapon",value:20,color:"#bfc6cf",stats:{damageMin:5,damageMax:9}},
  ironSword:{name:"Espada de hierro",icon:"⚔️",slot:"mainHand",type:"weapon",value:130,color:"#d4d7dc",stats:{damageMin:8,damageMax:14,accuracy:3}},
  flameSword:{name:"Espada ígnea",icon:"🔥",slot:"mainHand",type:"weapon",value:850,color:"#ff6a2a",stats:{damageMin:15,damageMax:24,accuracy:7}},
  wornBook:{name:"Grimorio gastado",icon:"📖",slot:"offHand",type:"book",value:25,color:"#6e3e75",stats:{magicPower:3}},
  arcaneBook:{name:"Grimorio arcano",icon:"📘",slot:"offHand",type:"book",value:320,color:"#3e68b6",stats:{magicPower:10,mana:12}},
  leatherChest:{name:"Pechera de cuero",icon:"🥋",slot:"chest",type:"armor",value:80,color:"#8a5a36",stats:{defense:4}},
  ironChest:{name:"Pechera de hierro",icon:"🛡️",slot:"chest",type:"armor",value:260,color:"#7c8792",stats:{defense:10,health:12}},
  crimsonChest:{name:"Pechera carmesí",icon:"🛡️",slot:"chest",type:"armor",value:700,color:"#8b2638",stats:{defense:15,health:20}},
  leatherArms:{name:"Brazos de cuero",icon:"🥋",slot:"arms",type:"armor",value:60,color:"#875733",stats:{defense:2}},
  ironArms:{name:"Brazos de hierro",icon:"🛡️",slot:"arms",type:"armor",value:180,color:"#7d8790",stats:{defense:5}},
  leatherGloves:{name:"Guantes de cuero",icon:"🧤",slot:"gloves",type:"armor",value:45,color:"#74452b",stats:{defense:1,accuracy:2}},
  mageGloves:{name:"Guantes arcanos",icon:"🧤",slot:"gloves",type:"armor",value:280,color:"#56408f",stats:{defense:2,magicPower:5}},
  leatherLegs:{name:"Pantalones de cuero",icon:"👖",slot:"legs",type:"armor",value:70,color:"#5d412e",stats:{defense:3}},
  ironLegs:{name:"Grebas de hierro",icon:"👖",slot:"legs",type:"armor",value:220,color:"#69747d",stats:{defense:7}},
  leatherBoots:{name:"Botas de cuero",icon:"🥾",slot:"boots",type:"armor",value:55,color:"#4f3424",stats:{defense:1,speed:.15}},
  silverBoots:{name:"Botas plateadas",icon:"🥾",slot:"boots",type:"armor",value:300,color:"#9ba7b3",stats:{defense:4,speed:.25}},
  silverNecklace:{name:"Collar de plata",icon:"📿",slot:"neck",type:"jewelry",value:180,color:"#c7d0d8",stats:{magicResistance:5}},
  accuracyRing:{name:"Anillo del halcón",icon:"💍",slot:"ring",type:"jewelry",value:340,color:"#d7b44f",stats:{accuracy:8}},
  vampireRing:{name:"Anillo carmesí",icon:"💍",slot:"ring",type:"jewelry",value:850,color:"#a52a4c",stats:{lifeSteal:.08,damageMin:2,damageMax:3}},
  manaRing:{name:"Anillo de meditación",icon:"💍",slot:"ring",type:"jewelry",value:500,color:"#5b6fd6",stats:{mana:15,manaRegen:1.5}},
  potion:{name:"Poción de curación",icon:"🧪",slot:null,type:"consumable",value:35,color:"#d13f4e",stats:{}},
  bone:{name:"Hueso antiguo",icon:"🦴",slot:null,type:"loot",value:14,color:"#d7d0b8",stats:{}},
  crystal:{name:"Cristal oscuro",icon:"🔮",slot:null,type:"loot",value:80,color:"#774db2",stats:{}}
};

function createItem(id){
  const t = itemTemplates[id];
  return {...t,id,uid:`${id}-${Date.now()}-${Math.random()}`,stats:{...(t.stats||{})}};
}

const player = {
  name:"Aldren", x:100, y:100, dirX:1, dirY:0, speed:4,
  health:100,maxHealth:100,mana:60,maxMana:60,stamina:80,maxStamina:80,
  gold:250,attackCooldown:0,magicCooldown:0,invulnerability:0,
  attackAnim:0,magicAnim:0,walkAnim:0,isMoving:false,dialogue:"",dialogueTimer:0,
  inventory:[createItem("potion"),createItem("potion"),createItem("potion"),createItem("leatherChest"),createItem("leatherGloves")],
  bank:[],
  equipment:{head:null,neck:null,chest:null,arms:null,gloves:null,legs:null,boots:null,
    mainHand:createItem("oldSword"),offHand:createItem("wornBook"),ring1:null,ring2:null}
};

const buildings = [
  {id:"bank",name:"Banco de Eldoria",x:96,y:96,w:8,h:8,doorX:100,doorY:104,color:"#75644d",roof:"#3f5066"},
  {id:"smith",name:"Herrería",x:112,y:94,w:9,h:8,doorX:116,doorY:102,color:"#704f39",roof:"#5c2c28"},
  {id:"mage",name:"Torre Arcana",x:82,y:92,w:8,h:10,doorX:86,doorY:102,color:"#544b72",roof:"#2d254e"},
  {id:"armor",name:"Armería",x:106,y:110,w:9,h:8,doorX:110,doorY:110,color:"#58616a",roof:"#3c454d"},
  {id:"tavern",name:"Taberna",x:86,y:110,w:9,h:8,doorX:90,doorY:110,color:"#75543d",roof:"#59332b"},
  {id:"chapel",name:"Capilla abandonada",x:154,y:40,w:10,h:10,doorX:159,doorY:50,color:"#4a4b50",roof:"#2f3033"}
];

const shops = {
  weaponShop:{name:"Herrería del León",items:["ironSword","flameSword","leatherGloves"]},
  magicShop:{name:"Torre Arcana",items:["arcaneBook","mageGloves","manaRing"]},
  armorShop:{name:"Armería Real",items:["leatherChest","ironChest","crimsonChest","ironArms","ironLegs","silverBoots","silverNecklace"]},
  generalShop:{name:"La Corona Dorada",items:["potion","potion","potion"]}
};

const npcs = [
  npc("Edwin, banquero",100,101,"bank","Tus pertenencias estarán seguras conmigo."),
  npc("Brom, herrero",116,99,"weaponShop","Tengo armas para todo tipo de guerrero."),
  npc("Selene, hechicera",86,98,"magicShop","Los secretos arcanos tienen un precio."),
  npc("Gareth, armero",110,114,"armorShop","Una armadura distinta cambia más que tu defensa."),
  npc("Mara, tabernera",90,114,"generalShop","Pociones y provisiones para el camino."),
  npc("Guardia de Eldoria",104,104,"talk","El cementerio se encuentra al nordeste.")
];

function npc(name,x,y,role,greeting){ return {name,x,y,role,greeting,dialogue:"",dialogueTimer:0,anim:Math.random()*10}; }

const cemetery = {x:140,y:24,w:45,h:45};
const enemies = [];
const projectiles = [];
const enemyProjectiles = [];
const particles = [];
const floatingTexts = [];
const corpses = [];

for(let i=0;i<8;i++) enemies.push(enemy(`Zombi ${i+1}`,"zombie",148+(i%4)*8,34+Math.floor(i/4)*18,55+i*5,7+i));
for(let i=0;i<3;i++) enemies.push(enemy(`Mago oscuro ${i+1}`,"mage",154+i*10,58-i*9,90+i*15,15+i*3));

function enemy(name,type,x,y,hp,damage){
  return {name,type,x,y,spawnX:x,spawnY:y,health:hp,maxHealth:hp,damage,speed:type==="zombie"?1.4:1.15,
  alive:true,respawnTimer:0,attackCooldown:0,castCooldown:1+Math.random()*2,hitFlash:0,anim:Math.random()*10,
  special:false,loot:[],dialogue:"",dialogueTimer:0};
}

function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function rand(a,b){return a+Math.random()*(b-a)}
function dist(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}
function worldToScreen(x,y,z=0){return{x:(x-y)*TILE_W/2+innerWidth/2+camera.x,y:(x+y)*TILE_H/2+innerHeight*.28+camera.y-z}}

function resize(){
  const dpr=Math.min(devicePixelRatio||1,2);
  canvas.width=Math.floor(innerWidth*dpr);canvas.height=Math.floor(innerHeight*dpr);
  canvas.style.width=innerWidth+"px";canvas.style.height=innerHeight+"px";
  ctx.setTransform(dpr,0,0,dpr,0,0);
}

function tileType(x,y){
  if(x<5||y<5||x>WORLD_SIZE-6||y>WORLD_SIZE-6)return"water";
  if(x>=cemetery.x&&x<cemetery.x+cemetery.w&&y>=cemetery.y&&y<cemetery.y+cemetery.h){
    if(x===cemetery.x||y===cemetery.y||x===cemetery.x+cemetery.w-1||y===cemetery.y+cemetery.h-1)return"cemeteryWall";
    return (x%5===0||y%6===0)?"cemeteryPath":"cemetery";
  }
  if(Math.abs(x-100)<=2||Math.abs(y-100)<=2||Math.abs(x-75)<=1||Math.abs(x-125)<=1||Math.abs(y-75)<=1||Math.abs(y-125)<=1)return"road";
  if(x>92&&x<108&&y>92&&y<108)return"plaza";
  return"grass";
}

function insideBuilding(ent,b){return ent.x>b.x+.5&&ent.y>b.y+.5&&ent.x<b.x+b.w-.5&&ent.y<b.y+b.h-.5}
function isBlocked(x,y){
  const t=tileType(Math.floor(x),Math.floor(y));
  if(t==="water"||t==="cemeteryWall")return true;
  for(const b of buildings){
    const inBounds=x>=b.x&&y>=b.y&&x<b.x+b.w&&y<b.y+b.h;
    if(!inBounds)continue;
    const nearDoor=Math.hypot(x-b.doorX,y-b.doorY)<1.2;
    const inside=x>b.x+.55&&y>b.y+.55&&x<b.x+b.w-.55&&y<b.y+b.h-.55;
    if(!inside&&!nearDoor)return true;
  }
  return false;
}

function equipmentStats(){
  const s={damageMin:1,damageMax:3,defense:0,accuracy:0,magicPower:0,magicResistance:0,health:0,mana:0,speed:0,manaRegen:0,lifeSteal:0};
  Object.values(player.equipment).filter(Boolean).forEach(it=>Object.entries(it.stats||{}).forEach(([k,v])=>s[k]=(s[k]||0)+v));
  return s;
}

function combatStats(){
  const e=equipmentStats();
  return{
    damageMin:e.damageMin+skills.tactics.value*.08,
    damageMax:e.damageMax+skills.tactics.value*.13+skills.anatomy.value*.04,
    defense:e.defense+skills.defense.value*.16,
    accuracy:clamp(38+skills.swords.value*.55+e.accuracy,30,96),
    magicPower:4+skills.magery.value*.18+skills.evaluating.value*.12+e.magicPower,
    magicAccuracy:clamp(42+skills.magery.value*.52+skills.evaluating.value*.12,35,97),
    attackSpeed:clamp(.65-skills.swords.value*.0015,.42,.65),
    magicResistance:e.magicResistance+skills.magicResistance.value*.18,
    manaRegen:1.8+skills.meditation.value*.06+e.manaRegen,
    lifeSteal:e.lifeSteal
  };
}

function updateDerived(){
  const e=equipmentStats();
  player.maxHealth=80+skills.endurance.value*1.2+e.health;
  player.maxMana=40+skills.magery.value*.8+e.mana;
  player.maxStamina=60+skills.endurance.value;
  player.speed=3.8+e.speed;
  player.health=Math.min(player.health,player.maxHealth);
  player.mana=Math.min(player.mana,player.maxMana);
  player.stamina=Math.min(player.stamina,player.maxStamina);
}

function showMessage(text){$("messageBox").textContent=text}
function speak(ent,text){ent.dialogue=text;ent.dialogueTimer=3.5}
function showSkillToast(s){const d=document.createElement("div");d.className="skill-toast";d.textContent=`${s.name} aumentó a ${s.value.toFixed(1)}`;$("skillToastContainer").appendChild(d);setTimeout(()=>d.remove(),3000)}
function gainSkill(id,effort){
  const s=skills[id]; if(!s||s.value>=100)return;
  s.progress+=effort*(1-s.value/110)*rand(.7,1.2);
  if(s.progress<1)return;
  s.progress-=1;s.value=Math.min(100,Math.round((s.value+.1)*10)/10);showSkillToast(s);renderSkills();
}

function updatePlayer(dt){
  let mx=joystick.y+joystick.x,my=joystick.y-joystick.x;
  const len=Math.hypot(mx,my);
  player.isMoving=len>.08&&!panelOpen();
  if(player.isMoving){
    mx/=len;my/=len;player.dirX=mx;player.dirY=my;
    const nx=player.x+mx*player.speed*dt, ny=player.y+my*player.speed*dt;
    if(!isBlocked(nx,player.y))player.x=nx;
    if(!isBlocked(player.x,ny))player.y=ny;
    player.walkAnim+=dt*10;player.stamina=Math.max(0,player.stamina-dt*2);
  }else player.stamina=Math.min(player.maxStamina,player.stamina+dt*7);
  const cs=combatStats();
  player.mana=Math.min(player.maxMana,player.mana+cs.manaRegen*dt);
  player.attackCooldown=Math.max(0,player.attackCooldown-dt);
  player.magicCooldown=Math.max(0,player.magicCooldown-dt);
  player.invulnerability=Math.max(0,player.invulnerability-dt);
  player.attackAnim=Math.max(0,player.attackAnim-dt*4.5);
  player.magicAnim=Math.max(0,player.magicAnim-dt*3.5);
  player.dialogueTimer=Math.max(0,player.dialogueTimer-dt);
  const tx=-((player.x-player.y)*TILE_W/2),ty=-((player.x+player.y)*TILE_H/2)+innerHeight*.17;
  camera.x+=(tx-camera.x)*dt*5;camera.y+=(ty-camera.y)*dt*5;
}

function moveEnemy(e,tx,ty,dt){
  const d=Math.hypot(tx-e.x,ty-e.y);if(d<.01)return;
  const dx=(tx-e.x)/d,dy=(ty-e.y)/d,nx=e.x+dx*e.speed*dt,ny=e.y+dy*e.speed*dt;
  if(!isBlocked(nx,e.y))e.x=nx;if(!isBlocked(e.x,ny))e.y=ny;
}

function updateEnemies(dt){
  for(const e of enemies){
    if(!e.alive){e.respawnTimer-=dt;if(e.respawnTimer<=0){e.alive=true;e.health=e.maxHealth;e.x=e.spawnX+rand(-1,1);e.y=e.spawnY+rand(-1,1)}continue}
    e.anim+=dt*4;e.hitFlash=Math.max(0,e.hitFlash-dt);e.attackCooldown=Math.max(0,e.attackCooldown-dt);e.castCooldown=Math.max(0,e.castCooldown-dt);e.dialogueTimer=Math.max(0,e.dialogueTimer-dt);
    const d=dist(e,player),home=Math.hypot(e.x-e.spawnX,e.y-e.spawnY);
    if(home>13){moveEnemy(e,e.spawnX,e.spawnY,dt);continue}
    if(d>10)continue;
    if(e.type==="zombie"||e.special){
      if(d>1)moveEnemy(e,player.x,player.y,dt);
      if(d<=1&&e.attackCooldown<=0){damagePlayer(e.damage,false);e.attackCooldown=e.special?.8:1.2}
    }else{
      if(d<3.2)moveEnemy(e,e.x-(player.x-e.x),e.y-(player.y-e.y),dt);
      else if(d>5.8)moveEnemy(e,player.x,player.y,dt);
      if(d<7&&e.castCooldown<=0){castEnemy(e);e.castCooldown=e.special?1.1:2.2}
    }
  }
  specialTimer-=dt;
  if(specialTimer<=0&&!enemies.some(e=>e.special&&e.alive)){spawnSpecial();specialTimer=240}
}

function spawnSpecial(){
  const e=enemy("Nigromante ancestral","mage",162,45,340,25);e.special=true;e.speed=1.35;e.loot=[createItem("vampireRing"),Math.random()<.5?createItem("flameSword"):createItem("manaRing")];
  enemies.push(e);speak(e,"Los vivos no deberían estar aquí.");showMessage("Un enemigo especial apareció en el cementerio.");
}

function castEnemy(e){
  const d=dist(e,player);enemyProjectiles.push({x:e.x,y:e.y,dx:(player.x-e.x)/d,dy:(player.y-e.y)/d,speed:e.special?6:4.5,damage:e.damage,life:2.3,special:e.special});
}

function attack(){
  if(!started||paused||panelOpen()||player.attackCooldown>0)return;
  const cs=combatStats();player.attackCooldown=cs.attackSpeed;player.attackAnim=1;
  gainSkill("swords",.7);gainSkill("tactics",.55);gainSkill("anatomy",.25);
  const target=nearestEnemy(1.6);if(!target){floating(player.x,player.y,"Sin objetivo","#ddd");return}
  if(Math.random()*100>cs.accuracy){floating(target.x,target.y,"Fallo","#ddd");return}
  const dmg=Math.round(rand(cs.damageMin,cs.damageMax));damageEnemy(target,dmg);
  if(cs.lifeSteal)player.health=Math.min(player.maxHealth,player.health+dmg*cs.lifeSteal);
}

function castMagic(){
  if(!started||paused||panelOpen()||player.magicCooldown>0)return;
  if(player.mana<14){speak(player,"Necesito más maná.");return}
  const cs=combatStats();player.mana-=14;player.magicCooldown=.72;player.magicAnim=1;
  gainSkill("magery",.75);gainSkill("evaluating",.45);gainSkill("meditation",.2);gainSkill("inscription",.1);
  let dx=player.dirX,dy=player.dirY;const t=nearestEnemy(7);
  if(t){const d=dist(player,t);dx=(t.x-player.x)/d;dy=(t.y-player.y)/d}
  projectiles.push({x:player.x,y:player.y,dx,dy,speed:7.5,life:1.5,damage:cs.magicPower+rand(1,5),accuracy:cs.magicAccuracy});
}

function nearestEnemy(max){let n=null,nd=Infinity;for(const e of enemies){if(!e.alive)continue;const d=dist(player,e);if(d<max&&d<nd){n=e;nd=d}}return n}
function damageEnemy(e,amount){
  e.health-=amount;e.hitFlash=.16;floating(e.x,e.y,`-${amount}`,"#ffd09a");burst(e.x,e.y,8);
  if(e.health<=0){e.health=0;e.alive=false;e.respawnTimer=ENEMY_RESPAWN;e.loot=e.special?e.loot:generateLoot(e);corpses.push({x:e.x,y:e.y,enemy:e,life:180});player.gold+=e.special?220:Math.floor(rand(6,30));showMessage(`${e.name} derrotado. Revisa su botín.`)}
}
function generateLoot(e){
  const loot=[];if(e.type==="zombie"){loot.push(createItem("bone"));if(Math.random()<.18)loot.push(createItem("potion"));if(Math.random()<.07)loot.push(createItem("accuracyRing"))}
  else{loot.push(createItem("crystal"));if(Math.random()<.12)loot.push(createItem("manaRing"))}return loot;
}
function damagePlayer(amount,magical){
  if(player.invulnerability>0)return;const cs=combatStats();
  const red=magical?cs.magicResistance*.004:cs.defense*.005;
  const dmg=Math.max(1,Math.round(amount*(1-clamp(red,0,.55))));player.health-=dmg;player.invulnerability=.5;floating(player.x,player.y,`-${dmg}`,"#ff8c8c");
  gainSkill(magical?"magicResistance":"defense",.55);
  if(player.health<=0){player.health=player.maxHealth;player.mana=player.maxMana;player.stamina=player.maxStamina;player.x=100;player.y=105;speak(player,"He regresado al banco.");}
}

function updateProjectiles(dt){
  for(let i=projectiles.length-1;i>=0;i--){
    const p=projectiles[i];p.x+=p.dx*p.speed*dt;p.y+=p.dy*p.speed*dt;p.life-=dt;let hit=false;
    for(const e of enemies){if(e.alive&&dist(p,e)<.6){if(Math.random()*100<=p.accuracy)damageEnemy(e,Math.round(p.damage));else floating(e.x,e.y,"Resistido","#cfc6ff");hit=true;break}}
    if(hit||p.life<=0||isBlocked(p.x,p.y))projectiles.splice(i,1);
  }
  for(let i=enemyProjectiles.length-1;i>=0;i--){
    const p=enemyProjectiles[i];p.x+=p.dx*p.speed*dt;p.y+=p.dy*p.speed*dt;p.life-=dt;
    if(dist(p,player)<.55){damagePlayer(p.damage,true);enemyProjectiles.splice(i,1);continue}
    if(p.life<=0||isBlocked(p.x,p.y))enemyProjectiles.splice(i,1);
  }
}

function burst(x,y,n){for(let i=0;i<n&&particles.length<180;i++)particles.push({x,y,ox:0,oy:0,vx:rand(-45,45),vy:rand(-75,-20),life:rand(.35,.75),size:rand(2,5)})}
function floating(x,y,text,color){floatingTexts.push({x,y,text,color,oy:0,life:1})}
function updateEffects(dt){
  for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.ox+=p.vx*dt;p.oy+=p.vy*dt;p.vy+=120*dt;p.life-=dt;if(p.life<=0)particles.splice(i,1)}
  for(let i=floatingTexts.length-1;i>=0;i--){const f=floatingTexts[i];f.oy-=28*dt;f.life-=dt;if(f.life<=0)floatingTexts.splice(i,1)}
  for(let i=corpses.length-1;i>=0;i--){corpses[i].life-=dt;if(corpses[i].life<=0)corpses.splice(i,1)}
}

function nearestNpc(){return npcs.find(n=>dist(n,player)<1.6)}
function nearestCorpse(){return corpses.find(c=>dist(c,player)<1.5&&c.enemy.loot.length)}
function interact(){
  if(panelOpen())return;
  const n=nearestNpc();if(n){speak(n,n.greeting);if(n.role==="bank")openBank();else if(shops[n.role])openShop(n.role);return}
  const c=nearestCorpse();if(c){openLoot(c);return}
  speak(player,"No hay nada cerca para usar.");
}
function usePotion(){
  if(player.health>=player.maxHealth){speak(player,"Mi salud ya está completa.");return}
  const i=player.inventory.findIndex(it=>it.id==="potion");if(i<0){speak(player,"No tengo pociones.");return}
  player.inventory.splice(i,1);const heal=Math.round(38+skills.healing.value*.5);player.health=Math.min(player.maxHealth,player.health+heal);gainSkill("healing",.8);floating(player.x,player.y,`+${heal}`,"#76e49a");
}

function zone(){
  const b=buildings.find(b=>insideBuilding(player,b));if(b)return{name:b.name,desc:"Interior del edificio."};
  if(player.x>=cemetery.x&&player.x<cemetery.x+cemetery.w&&player.y>=cemetery.y&&player.y<cemetery.y+cemetery.h)return{name:"Cementerio de los Caídos",desc:"Zona peligrosa con muertos y hechiceros."};
  if(player.x>90&&player.x<110&&player.y>90&&player.y<110)return{name:"Plaza del Banco",desc:"El centro seguro de Eldoria."};
  return{name:"Ciudad de Eldoria",desc:"Calles, comercios y hogares."};
}

function updateUI(){
  updateDerived();const z=zone(),cs=combatStats();
  $("healthBar").style.width=`${player.health/player.maxHealth*100}%`;$("manaBar").style.width=`${player.mana/player.maxMana*100}%`;$("staminaBar").style.width=`${player.stamina/player.maxStamina*100}%`;
  $("healthText").textContent=`${Math.ceil(player.health)} / ${Math.ceil(player.maxHealth)}`;$("manaText").textContent=`${Math.ceil(player.mana)} / ${Math.ceil(player.maxMana)}`;$("staminaText").textContent=`${Math.ceil(player.stamina)} / ${Math.ceil(player.maxStamina)}`;
  $("goldText").textContent=`${player.gold} oro`;$("zoneName").textContent=z.name;$("zoneDescription").textContent=z.desc;
  $("potionText").textContent=player.inventory.filter(it=>it.id==="potion").length;
  $("playerTitle").textContent=Object.values(skills).reduce((a,s)=>a+s.value,0)>400?"Aventurero experimentado":"Aprendiz aventurero";
  $("statDamage").textContent=`${Math.round(cs.damageMin)}–${Math.round(cs.damageMax)}`;$("statDefense").textContent=Math.round(cs.defense);$("statAccuracy").textContent=`${Math.round(cs.accuracy)}%`;$("statMagic").textContent=Math.round(cs.magicPower);
}
function updateHint(){const text=nearestNpc()?"Hablar / comerciar":nearestCorpse()?"Revisar botín":"";$("interactionHint").classList.toggle("hidden",!text);$("interactionHint").textContent=text}

function panelOpen(){return [...document.querySelectorAll(".panel-overlay")].some(p=>!p.classList.contains("hidden"))}
function closePanels(){document.querySelectorAll(".panel-overlay").forEach(p=>p.classList.add("hidden"));resetJoystick()}

function itemStatsHtml(item){const labels={damageMin:"Daño mínimo",damageMax:"Daño máximo",defense:"Defensa",accuracy:"Precisión",magicPower:"Poder mágico",magicResistance:"Resistencia mágica",health:"Vida",mana:"Maná",speed:"Velocidad",manaRegen:"Reg. maná",lifeSteal:"Robo de vida"};return Object.entries(item.stats||{}).map(([k,v])=>`<div><span>${labels[k]||k}</span><strong>+${k==="lifeSteal"?Math.round(v*100)+"%":v}</strong></div>`).join("")||"<p>Sin bonificaciones especiales.</p>"}
function slotForItem(item){if(item.slot!=="ring")return item.slot;return !player.equipment.ring1?"ring1":!player.equipment.ring2?"ring2":"ring1"}

function renderInventory(targetId="inventoryGrid",equipmentMode=false){
  const grid=$(targetId);grid.innerHTML="";
  player.inventory.forEach((item,i)=>{
    const b=document.createElement("button");b.className="inventory-slot";b.type="button";b.innerHTML=`<span>${item.icon}</span><small>${item.name}</small>`;
    b.onclick=()=>{
      if(equipmentMode){selectedEquipmentInventoryIndex=i;renderEquipmentInventoryDetails(item);renderInventory(targetId,true)}
      else{selectedInventoryIndex=i;renderInventoryDetails(item);renderInventory(targetId,false)}
    };
    if((equipmentMode?selectedEquipmentInventoryIndex:selectedInventoryIndex)===i)b.classList.add("selected");
    grid.appendChild(b);
  });
  for(let i=player.inventory.length;i<INVENTORY_LIMIT;i++){const e=document.createElement("div");e.className="inventory-slot";e.style.opacity=".25";grid.appendChild(e)}
  $("inventoryCapacity").textContent=`${player.inventory.length} / ${INVENTORY_LIMIT} objetos`;
  $("equipmentInventoryCapacity").textContent=`${player.inventory.length} / ${INVENTORY_LIMIT}`;
}

function renderInventoryDetails(item){
  $("inventoryDetails").innerHTML=`<h3>${item.name}</h3><p>${item.type}</p>${itemStatsHtml(item)}<div class="details-actions">${item.slot?'<button id="equipFromInventory">Equipar</button>':""}<button id="dropItem" class="danger">Soltar</button></div>`;
  const eq=$("equipFromInventory");if(eq)eq.onclick=()=>equipFromInventory(selectedInventoryIndex);
  $("dropItem").onclick=()=>{player.inventory.splice(selectedInventoryIndex,1);selectedInventoryIndex=-1;renderInventory()};
}
function renderEquipmentInventoryDetails(item){
  $("equipmentDetails").innerHTML=`<h3>${item.name}</h3><p>Color visual: <span style="color:${item.color}">${item.color}</span></p>${itemStatsHtml(item)}<div class="details-actions">${item.slot?'<button id="equipFromEquipment">Equipar</button>':""}</div>`;
  const b=$("equipFromEquipment");if(b)b.onclick=()=>equipFromInventory(selectedEquipmentInventoryIndex,true);
}

function equipFromInventory(index,fromEquipment=false){
  const item=player.inventory[index];if(!item||!item.slot)return;const slot=slotForItem(item),old=player.equipment[slot];player.equipment[slot]=item;player.inventory.splice(index,1);if(old)player.inventory.push(old);
  selectedInventoryIndex=-1;selectedEquipmentInventoryIndex=-1;renderEquipment();renderInventory("inventoryGrid");renderInventory("equipmentInventoryGrid",true);drawCharacterPreview();updateUI();
}
function unequip(slot){
  const item=player.equipment[slot];if(!item||player.inventory.length>=INVENTORY_LIMIT)return;player.inventory.push(item);player.equipment[slot]=null;renderEquipment();renderInventory("equipmentInventoryGrid",true);drawCharacterPreview();updateUI();
}
function renderEquipment(){
  Object.entries(player.equipment).forEach(([slot,item])=>{$(`slot-${slot}`).textContent=item?item.name:"Vacío"});
}
function renderSkills(){
  $("skillsList").innerHTML="";
  Object.values(skills).forEach(s=>{$("skillsList").insertAdjacentHTML("beforeend",`<div class="skill-row"><div class="skill-name"><strong>${s.name}</strong><small>${s.value.toFixed(1)}</small></div><div class="skill-track"><div class="skill-fill" style="width:${s.value}%"></div></div><strong>${s.value.toFixed(1)}</strong></div>`)});
}

function openShop(role){
  activeShop=shops[role];closePanels();$("shopPanel").classList.remove("hidden");$("shopTitle").textContent=activeShop.name;$("shopItems").innerHTML="";
  activeShop.items.forEach(id=>{const item=createItem(id),b=document.createElement("button");b.className="shop-item";b.innerHTML=`<span>${item.icon}</span><div><strong>${item.name}</strong><small>${item.value} oro</small></div><strong>Comprar</strong>`;
    b.onclick=()=>{$("shopDetails").innerHTML=`<h3>${item.name}</h3>${itemStatsHtml(item)}<div class="details-actions"><button id="buyItem">Comprar por ${item.value}</button></div>`;$("buyItem").onclick=()=>{if(player.inventory.length>=INVENTORY_LIMIT){speak(player,"Mi mochila está llena.");return}if(player.gold<item.value){speak(player,"No tengo suficiente oro.");return}player.gold-=item.value;player.inventory.push(createItem(id));updateUI()}};$("shopItems").appendChild(b)});
}
function openBank(){closePanels();$("bankPanel").classList.remove("hidden");renderBank()}
function renderBank(){
  const a=$("bankInventoryGrid"),b=$("bankStorageGrid");a.innerHTML="";b.innerHTML="";
  player.inventory.forEach((it,i)=>{const x=document.createElement("button");x.className="inventory-slot";x.innerHTML=`<span>${it.icon}</span><small>${it.name}</small>`;x.onclick=()=>{player.bank.push(player.inventory.splice(i,1)[0]);renderBank()};a.appendChild(x)});
  player.bank.forEach((it,i)=>{const x=document.createElement("button");x.className="inventory-slot";x.innerHTML=`<span>${it.icon}</span><small>${it.name}</small>`;x.onclick=()=>{if(player.inventory.length<INVENTORY_LIMIT){player.inventory.push(player.bank.splice(i,1)[0]);renderBank()}};b.appendChild(x)});
}
function openLoot(c){currentCorpse=c;closePanels();$("lootPanel").classList.remove("hidden");renderLoot()}
function renderLoot(){
  $("lootItems").innerHTML="";if(!currentCorpse)return;
  currentCorpse.enemy.loot.forEach((it,i)=>{const b=document.createElement("button");b.className="shop-item";b.innerHTML=`<span>${it.icon}</span><div><strong>${it.name}</strong><small>${it.type}</small></div><strong>Recoger</strong>`;b.onclick=()=>{if(player.inventory.length<INVENTORY_LIMIT){player.inventory.push(currentCorpse.enemy.loot.splice(i,1)[0]);renderLoot()}};$("lootItems").appendChild(b)});
}
$("takeAllLootButton").onclick=()=>{if(!currentCorpse)return;while(currentCorpse.enemy.loot.length&&player.inventory.length<INVENTORY_LIMIT)player.inventory.push(currentCorpse.enemy.loot.shift());renderLoot()};

function drawTile(x,y,type){
  const s=worldToScreen(x,y),colors={grass:(x+y)%2?"#304a38":"#35543d",road:(x+y)%2?"#5c5a56":"#67645f",plaza:"#777168",cemetery:"#303832",cemeteryPath:"#555650",cemeteryWall:"#252929",water:"#1d4053"};
  ctx.beginPath();ctx.moveTo(s.x,s.y);ctx.lineTo(s.x+TILE_W/2,s.y+TILE_H/2);ctx.lineTo(s.x,s.y+TILE_H);ctx.lineTo(s.x-TILE_W/2,s.y+TILE_H/2);ctx.closePath();ctx.fillStyle=colors[type]||"#34533d";ctx.fill();ctx.strokeStyle="#00000022";ctx.stroke();
  if(type==="cemetery"&&(x*7+y*11)%17===0){ctx.fillStyle="#77766d";ctx.fillRect(s.x-4,s.y+4,8,13)}
}
function drawBuilding(b){
  const inside=insideBuilding(player,b),alpha=inside?.18:1;
  for(let y=b.y;y<b.y+b.h;y++)for(let x=b.x;x<b.x+b.w;x++){const s=worldToScreen(x,y);ctx.beginPath();ctx.moveTo(s.x,s.y);ctx.lineTo(s.x+TILE_W/2,s.y+TILE_H/2);ctx.lineTo(s.x,s.y+TILE_H);ctx.lineTo(s.x-TILE_W/2,s.y+TILE_H/2);ctx.closePath();ctx.fillStyle=(x+y)%2?"#6a5f54":"#75695d";ctx.fill()}
  const top=worldToScreen(b.x,b.y,70),right=worldToScreen(b.x+b.w,b.y,70),bottom=worldToScreen(b.x+b.w,b.y+b.h,70),left=worldToScreen(b.x,b.y+b.h,70);
  ctx.save();ctx.globalAlpha=alpha;ctx.fillStyle=b.roof;ctx.beginPath();ctx.moveTo(top.x,top.y);ctx.lineTo(right.x,right.y);ctx.lineTo(bottom.x,bottom.y);ctx.lineTo(left.x,left.y);ctx.closePath();ctx.fill();ctx.restore();
  if(inside){const c=worldToScreen(b.x+b.w/2,b.y+b.h/2);ctx.fillStyle="#5b402d";ctx.fillRect(c.x-20,c.y-10,40,22)}
}
function armorColor(slot,def){return player.equipment[slot]?.color||def}
function drawCharacter(ent,color,isEnemy=false){
  const s=worldToScreen(ent.x,ent.y),bob=Math.sin(ent.anim||player.walkAnim)*2;
  ctx.fillStyle="#0006";ctx.beginPath();ctx.ellipse(s.x,s.y+5,16,7,0,0,Math.PI*2);ctx.fill();
  const chest=ent===player?armorColor("chest",color):color,legs=ent===player?armorColor("legs","#332f47"):color,arms=ent===player?armorColor("arms",chest):color,gloves=ent===player?armorColor("gloves","#6d4a32"):color,boots=ent===player?armorColor("boots","#3d2d23"):color;
  ctx.fillStyle=boots;ctx.fillRect(s.x-10,s.y-4,7,8);ctx.fillRect(s.x+3,s.y-4,7,8);
  ctx.fillStyle=legs;ctx.fillRect(s.x-11,s.y-19,9,18);ctx.fillRect(s.x+2,s.y-19,9,18);
  ctx.fillStyle=ent.hitFlash>0?"#fff":chest;ctx.beginPath();ctx.moveTo(s.x,s.y-44+bob);ctx.lineTo(s.x+17,s.y-18);ctx.lineTo(s.x-17,s.y-18);ctx.closePath();ctx.fill();
  ctx.fillStyle=arms;ctx.fillRect(s.x-22,s.y-38+bob,7,25);ctx.fillRect(s.x+15,s.y-38+bob,7,25);
  ctx.fillStyle=gloves;ctx.beginPath();ctx.arc(s.x-18,s.y-12,4,0,Math.PI*2);ctx.arc(s.x+18,s.y-12,4,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=isEnemy?"#9b846f":"#d5aa82";ctx.beginPath();ctx.arc(s.x,s.y-50+bob,9,0,Math.PI*2);ctx.fill();
  if(ent===player)drawPlayerGear(s,bob);
  if(isEnemy){ctx.fillStyle="#000b";ctx.fillRect(s.x-22,s.y-72,44,5);ctx.fillStyle=ent.special?"#b24acb":"#a94242";ctx.fillRect(s.x-22,s.y-72,44*ent.health/ent.maxHealth,5)}
  drawSpeech(ent,s);
}
function drawPlayerGear(s,bob){
  const weapon=player.equipment.mainHand,book=player.equipment.offHand;
  const angle=player.attackAnim>0?-1.8+(1-player.attackAnim)*2.8:-.65;
  ctx.save();ctx.translate(s.x+12,s.y-28+bob);ctx.rotate(angle);ctx.strokeStyle=weapon?.color||"#d7dce4";ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,-31);ctx.stroke();ctx.strokeStyle="#a77d42";ctx.beginPath();ctx.moveTo(-6,-2);ctx.lineTo(6,-2);ctx.stroke();ctx.restore();
  ctx.save();ctx.translate(s.x-14,s.y-25-player.magicAnim*12+bob);ctx.fillStyle=book?.color||"#643f77";ctx.fillRect(-9,-7,18,14);ctx.strokeStyle="#e0c46b";ctx.strokeRect(-9,-7,18,14);ctx.restore();
}
function drawSpeech(ent,s){
  if(!ent.dialogue||ent.dialogueTimer<=0)return;ctx.font="12px sans-serif";const w=Math.max(ctx.measureText(ent.dialogue).width,ctx.measureText(ent.name||player.name).width)+18;ctx.fillStyle="#050709dd";ctx.fillRect(s.x-w/2,s.y-94,w,39);ctx.textAlign="center";ctx.fillStyle="#eadbb3";ctx.fillText(ent.dialogue,s.x,s.y-77);ctx.fillStyle="#fff";ctx.font="bold 11px sans-serif";ctx.fillText(ent.name||player.name,s.x,s.y-61)
}
function drawProjectiles(){
  for(const p of projectiles){const s=worldToScreen(p.x,p.y,22);ctx.fillStyle="#ffad44";ctx.beginPath();ctx.arc(s.x,s.y,9,0,Math.PI*2);ctx.fill()}
  for(const p of enemyProjectiles){const s=worldToScreen(p.x,p.y,22);ctx.fillStyle=p.special?"#d558ff":"#734dcc";ctx.beginPath();ctx.arc(s.x,s.y,p.special?11:8,0,Math.PI*2);ctx.fill()}
}
function drawEffects(){
  for(const p of particles){const s=worldToScreen(p.x,p.y,18);ctx.globalAlpha=clamp(p.life*2,0,1);ctx.fillStyle="#e6bc67";ctx.fillRect(s.x+p.ox,s.y+p.oy,p.size,p.size)}
  ctx.globalAlpha=1;ctx.textAlign="center";ctx.font="bold 16px sans-serif";
  for(const f of floatingTexts){const s=worldToScreen(f.x,f.y,65);ctx.globalAlpha=f.life;ctx.fillStyle=f.color;ctx.fillText(f.text,s.x,s.y+f.oy)}ctx.globalAlpha=1;
}
function drawScene(){
  ctx.clearRect(0,0,innerWidth,innerHeight);ctx.fillStyle="#0b1217";ctx.fillRect(0,0,innerWidth,innerHeight);
  const sx=clamp(Math.floor(player.x-VIEW),0,WORLD_SIZE-1),ex=clamp(Math.ceil(player.x+VIEW),0,WORLD_SIZE-1),sy=clamp(Math.floor(player.y-VIEW),0,WORLD_SIZE-1),ey=clamp(Math.ceil(player.y+VIEW),0,WORLD_SIZE-1);
  for(let depth=sx+sy;depth<=ex+ey;depth++)for(let x=sx;x<=ex;x++){const y=depth-x;if(y>=sy&&y<=ey)drawTile(x,y,tileType(x,y))}
  const r=[];
  for(const b of buildings)if(Math.abs(b.x-player.x)<VIEW+12&&Math.abs(b.y-player.y)<VIEW+12)r.push({d:b.x+b.y+b.w+b.h,draw:()=>drawBuilding(b)});
  for(const n of npcs)if(Math.abs(n.x-player.x)<VIEW&&Math.abs(n.y-player.y)<VIEW)r.push({d:n.x+n.y,draw:()=>drawCharacter(n,"#8a653f")});
  for(const e of enemies)if(e.alive&&Math.abs(e.x-player.x)<VIEW&&Math.abs(e.y-player.y)<VIEW)r.push({d:e.x+e.y,draw:()=>drawCharacter(e,e.special?"#5d275f":e.type==="mage"?"#442d68":"#486240",true)});
  for(const c of corpses)if(Math.abs(c.x-player.x)<VIEW&&Math.abs(c.y-player.y)<VIEW)r.push({d:c.x+c.y-.1,draw:()=>{const s=worldToScreen(c.x,c.y);ctx.fillStyle="#342e2c";ctx.beginPath();ctx.ellipse(s.x,s.y,18,7,0,0,Math.PI*2);ctx.fill();if(c.enemy.loot.length){ctx.fillStyle="#e0b65d";ctx.font="bold 16px sans-serif";ctx.fillText("✦",s.x,s.y-13)}}});
  r.push({d:player.x+player.y,draw:()=>drawCharacter(player,"#274c72")});r.sort((a,b)=>a.d-b.d).forEach(o=>o.draw());drawProjectiles();drawEffects();
}
function drawCharacterPreview(){
  characterCtx.clearRect(0,0,260,330);characterCtx.fillStyle="#111820";characterCtx.fillRect(0,0,260,330);
  const chest=armorColor("chest","#274c72"),legs=armorColor("legs","#332f47"),arms=armorColor("arms",chest),gloves=armorColor("gloves","#6d4a32"),boots=armorColor("boots","#3d2d23");
  characterCtx.fillStyle=boots;characterCtx.fillRect(100,255,20,35);characterCtx.fillRect(140,255,20,35);
  characterCtx.fillStyle=legs;characterCtx.fillRect(100,205,20,55);characterCtx.fillRect(140,205,20,55);
  characterCtx.fillStyle=chest;characterCtx.beginPath();characterCtx.moveTo(130,90);characterCtx.lineTo(185,220);characterCtx.lineTo(75,220);characterCtx.closePath();characterCtx.fill();
  characterCtx.fillStyle=arms;characterCtx.fillRect(65,115,18,100);characterCtx.fillRect(177,115,18,100);
  characterCtx.fillStyle=gloves;characterCtx.beginPath();characterCtx.arc(74,215,11,0,Math.PI*2);characterCtx.arc(186,215,11,0,Math.PI*2);characterCtx.fill();
  characterCtx.fillStyle="#d5aa82";characterCtx.beginPath();characterCtx.arc(130,78,28,0,Math.PI*2);characterCtx.fill();
  characterCtx.strokeStyle=player.equipment.mainHand?.color||"#d7dce4";characterCtx.lineWidth=8;characterCtx.beginPath();characterCtx.moveTo(185,160);characterCtx.lineTo(225,55);characterCtx.stroke();
  characterCtx.fillStyle=player.equipment.offHand?.color||"#643f77";characterCtx.fillRect(35,145,45,34);
  characterCtx.fillStyle="#eadbb3";characterCtx.textAlign="center";characterCtx.font="bold 17px Georgia";characterCtx.fillText("Aldren",130,312);
}
function drawMinimap(){
  const sx=minimapCanvas.width/WORLD_SIZE,sy=minimapCanvas.height/WORLD_SIZE;minimapCtx.clearRect(0,0,minimapCanvas.width,minimapCanvas.height);
  for(let y=0;y<WORLD_SIZE;y+=2)for(let x=0;x<WORLD_SIZE;x+=2){const t=tileType(x,y),c={grass:"#38543c",road:"#716d65",plaza:"#8a857b",cemetery:"#343934",cemeteryPath:"#5d5c56",cemeteryWall:"#202323",water:"#24485c"};minimapCtx.fillStyle=c[t]||"#38543c";minimapCtx.fillRect(x*sx,y*sy,sx*2+1,sy*2+1)}
  minimapCtx.fillStyle="#fff";minimapCtx.beginPath();minimapCtx.arc(player.x*sx,player.y*sy,5,0,Math.PI*2);minimapCtx.fill();
}

function checkOrientation(){const portrait=innerHeight>innerWidth;$("rotateScreen").classList.toggle("hidden",!portrait);paused=portrait;if(portrait)resetJoystick()}
function moveJoystick(cx,cy){const r=$("joystick").getBoundingClientRect(),mx=r.left+r.width/2,my=r.top+r.height/2,max=r.width*.34;let dx=cx-mx,dy=cy-my,l=Math.hypot(dx,dy);if(l>max){dx=dx/l*max;dy=dy/l*max}joystick.x=dx/max;joystick.y=dy/max;$("joystickKnob").style.transform=`translate(${dx}px,${dy}px)`}
function resetJoystick(){activeTouchId=null;joystick.x=0;joystick.y=0;joystick.active=false;$("joystickKnob").style.transform="translate(0,0)"}
$("joystick").addEventListener("touchstart",e=>{e.preventDefault();if(activeTouchId!==null)return;const t=e.changedTouches[0];activeTouchId=t.identifier;joystick.active=true;moveJoystick(t.clientX,t.clientY)},{passive:false});
$("joystick").addEventListener("touchmove",e=>{e.preventDefault();const t=[...e.touches].find(t=>t.identifier===activeTouchId);if(t)moveJoystick(t.clientX,t.clientY)},{passive:false});
$("joystick").addEventListener("touchend",e=>{e.preventDefault();if([...e.changedTouches].some(t=>t.identifier===activeTouchId))resetJoystick()},{passive:false});
$("joystick").addEventListener("touchcancel",resetJoystick,{passive:false});

function bindTap(id,fn){let touched=false;const b=$(id);b.addEventListener("touchstart",e=>{e.preventDefault();touched=true;fn()},{passive:false});b.addEventListener("touchend",e=>{e.preventDefault();setTimeout(()=>touched=false,250)},{passive:false});b.addEventListener("click",e=>{e.preventDefault();if(!touched)fn()})}
bindTap("startButton",()=>{if(started)return;started=true;$("startScreen").classList.add("hidden");$("hud").classList.remove("hidden");camera.x=-((player.x-player.y)*TILE_W/2);camera.y=-((player.x+player.y)*TILE_H/2)+innerHeight*.17;lastTime=performance.now();requestAnimationFrame(loop)});
bindTap("attackButton",attack);bindTap("magicButton",castMagic);bindTap("interactButton",interact);bindTap("potionButton",usePotion);
bindTap("inventoryButton",()=>{closePanels();$("inventoryPanel").classList.remove("hidden");selectedInventoryIndex=-1;renderInventory()});
bindTap("equipmentButton",()=>{closePanels();$("equipmentPanel").classList.remove("hidden");selectedEquipmentInventoryIndex=-1;renderEquipment();renderInventory("equipmentInventoryGrid",true);drawCharacterPreview()});
bindTap("skillsButton",()=>{closePanels();$("skillsPanel").classList.remove("hidden");renderSkills()});
bindTap("mapButton",()=>{closePanels();$("mapPanel").classList.remove("hidden");drawMinimap()});
document.querySelectorAll("[data-close]").forEach(b=>b.onclick=closePanels);
document.querySelectorAll(".slot").forEach(b=>b.onclick=()=>unequip(b.dataset.slot));

function loop(t){
  const dt=Math.min(Math.max((t-lastTime)/1000,0),.033);lastTime=t;
  if(!paused){updatePlayer(dt);npcs.forEach(n=>{n.anim+=dt*2;n.dialogueTimer=Math.max(0,n.dialogueTimer-dt)});updateEnemies(dt);updateProjectiles(dt);updateEffects(dt)}
  updateUI();updateHint();drawScene();requestAnimationFrame(loop);
}

addEventListener("resize",()=>{resize();checkOrientation();if(!$("mapPanel").classList.contains("hidden"))drawMinimap()});
addEventListener("orientationchange",()=>setTimeout(()=>{resize();checkOrientation()},250));
document.addEventListener("visibilitychange",()=>{if(document.hidden)resetJoystick();lastTime=performance.now()});
canvas.addEventListener("contextmenu",e=>e.preventDefault());

resize();checkOrientation();updateDerived();updateUI();renderEquipment();renderSkills();drawCharacterPreview();drawScene();
