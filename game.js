(() => {
"use strict";
const $ = id => document.getElementById(id);
const canvas = $("gameCanvas");
const ctx = canvas.getContext("2d");
const mapCanvas = $("mapCanvas");
const mapCtx = mapCanvas.getContext("2d");
const SAVE_KEY = "proyecto_ultra_v4";
const WORLD = 256, TW = 42, TH = 21;
let started = true, paused = false, last = performance.now();
let battleMode = false, worldTime = 0.22, autosave = 0;
let selectedInventory = -1, selectedEquipment = null, selectedSkill = null;
let currentShop = null, currentShopMode = "buy", selectedShop = -1;
let selectedCraftGroup = null, selectedCraftRecipe = null;
let touchId = null, targetEnemy = null;
const keys = {}, explored = new Set(), floating = [], particles = [], projectiles = [], corpses = [];
const camera = {x:0,y:0};
const stick = {x:0,y:0};
const settings = {sound:true,quality:"high",showNames:true,showBars:true};

const rarity = {
 common:{name:"Común",color:"#e5e5e5",buffs:[0,0]},
 uncommon:{name:"Poco común",color:"#6ccd81",buffs:[1,2]},
 rare:{name:"Raro",color:"#65a8f2",buffs:[2,3]},
 epic:{name:"Épico",color:"#bd78eb",buffs:[3,4]},
 legendary:{name:"Legendario",color:"#efa64d",buffs:[4,5]}
};

const skillInfo = {
 swords:{name:"Espadas",desc:"Dominio de armas de filo. Mejora precisión y daño físico.",how:"Golpea enemigos válidos usando una espada. Los enemigos débiles entregan menos progreso.",unlock:"60: Golpe poderoso · 80: Ignorar armadura"},
 tactics:{name:"Tácticas",desc:"Conocimiento del combate y posicionamiento.",how:"Realiza ataques acertados y combate enemigos de nivel adecuado.",unlock:"Mejora el daño general"},
 anatomy:{name:"Anatomía",desc:"Conocimiento de puntos débiles.",how:"Consigue impactos críticos y examina enemigos.",unlock:"Mejora críticos y curación"},
 defense:{name:"Defensa",desc:"Capacidad de bloquear y reducir daño.",how:"Recibe ataques usando armadura o escudo.",unlock:"60: Guardia férrea · 80: Fortaleza absoluta"},
 endurance:{name:"Resistencia",desc:"Aguante físico y recuperación.",how:"Combate, corre y resiste daño sin quedar agotado.",unlock:"60: Guardia férrea · 80: Fortaleza absoluta"},
 magery:{name:"Magia",desc:"Poder y precisión de hechizos arcanos.",how:"Lanza hechizos válidos contra enemigos o sobre ti mismo.",unlock:"60: Nova de hielo · 80: Cadena de relámpagos"},
 healing:{name:"Curación",desc:"Recuperación de vida y magia protectora.",how:"Cúrate cuando falte vida y usa efectos restauradores.",unlock:"60: Regeneración · 80: Escudo vital"},
 meditation:{name:"Meditación",desc:"Recuperación de maná.",how:"Recupera maná después de lanzar hechizos.",unlock:"Mejora regeneración de maná"},
 inscription:{name:"Inscripción",desc:"Creación de pergaminos y componentes mágicos.",how:"Crea pergaminos y objetos arcanos.",unlock:"Permite recetas avanzadas"},
 tailoring:{name:"Tailoring",desc:"Confección de cuero, tela, capas y túnicas.",how:"Trata pieles y fabrica equipo de dificultad apropiada.",unlock:"A 100, firma tus creaciones"},
 mining:{name:"Minería",desc:"Extracción de minerales y materiales de veta.",how:"Usa un pico sobre vetas no agotadas.",unlock:"Permite minerales superiores"},
 blacksmithing:{name:"Herrería",desc:"Fundición y fabricación de armas y armaduras metálicas.",how:"Funde minerales y trabaja lingotes en una forja.",unlock:"A 100, firma tus objetos forjados"}
};
const skills = {};
Object.keys(skillInfo).forEach(k => skills[k] = {value:k==="swords"?35:k==="tactics"?28:k==="healing"?22:k==="magery"?24:k==="tailoring"?12:k==="mining"?10:k==="blacksmithing"?8:18,progress:0});

const itemDefs = {
 potion:{name:"Poción de curación",icon:"🧪",type:"consumable",value:45,stack:true,desc:"Recupera 55 puntos de vida."},
 manaPotion:{name:"Poción de maná",icon:"🔷",type:"consumable",value:60,stack:true,desc:"Recupera 45 puntos de maná."},
 bone:{name:"Hueso",icon:"🦴",type:"material",value:5,stack:true,desc:"Material de alquimia, inscripción y recetas oscuras."},
 boneDust:{name:"Polvo de hueso",icon:"⚱️",type:"material",value:20,stack:true,desc:"Ingrediente refinado para talismanes y pergaminos."},
 rawHide:{name:"Piel sin tratar",icon:"🟫",type:"material",value:12,stack:true,desc:"Puede convertirse en cuero normal."},
 bearHide:{name:"Piel de oso",icon:"🐻",type:"material",value:38,stack:true,desc:"Piel gruesa para armaduras resistentes."},
 trollHide:{name:"Piel de troll",icon:"👹",type:"material",value:90,stack:true,desc:"Material raro de gran resistencia."},
 leather:{name:"Cuero normal",icon:"🟤",type:"material",value:28,stack:true,desc:"Cuero tratado para armadura ligera."},
 bearLeather:{name:"Cuero de oso",icon:"🟫",type:"material",value:75,stack:true,desc:"Cuero grueso para equipo robusto."},
 trollLeather:{name:"Cuero de troll",icon:"🟩",type:"material",value:160,stack:true,desc:"Cuero regenerativo de alto nivel."},
 cloth:{name:"Tela común",icon:"🧶",type:"material",value:18,stack:true,desc:"Tela para prendas básicas."},
 fineCloth:{name:"Tela fina",icon:"🧵",type:"material",value:48,stack:true,desc:"Tela de alta calidad."},
 shadowCloth:{name:"Tela sombría",icon:"🕸️",type:"material",value:120,stack:true,desc:"Tela encantada de origen oscuro."},
 copperOre:{name:"Mineral de cobre",icon:"🪨",type:"material",value:14,stack:true,desc:"Se funde para crear lingotes de cobre."},
 ironOre:{name:"Mineral de hierro",icon:"⛏️",type:"material",value:24,stack:true,desc:"Mineral principal para herrería."},
 silverOre:{name:"Mineral de plata",icon:"⚪",type:"material",value:60,stack:true,desc:"Útil contra no muertos."},
 obsidianOre:{name:"Obsidiana",icon:"⬛",type:"material",value:120,stack:true,desc:"Mineral volcánico para equipo avanzado."},
 copperIngot:{name:"Lingote de cobre",icon:"🟧",type:"material",value:38,stack:true,desc:"Metal refinado."},
 ironIngot:{name:"Lingote de hierro",icon:"⬜",type:"material",value:65,stack:true,desc:"Metal refinado para armas y armaduras."},
 silverIngot:{name:"Lingote de plata",icon:"◻️",type:"material",value:145,stack:true,desc:"Metal refinado contra no muertos."},
 obsidianIngot:{name:"Lingote de obsidiana",icon:"◼️",type:"material",value:270,stack:true,desc:"Material de herrería superior."},
 pickaxe:{name:"Pico de minero",icon:"⛏️",type:"tool",value:110,stack:false,desc:"Permite extraer minerales."},
 ironSword:{name:"Espada de hierro",icon:"⚔️",type:"weapon",slot:"mainHand",value:180,stack:false,stats:{damageMin:8,damageMax:13,accuracy:3},desc:"Espada equilibrada de hierro."},
 silverSword:{name:"Espada de plata",icon:"🗡️",type:"weapon",slot:"mainHand",value:520,stack:false,stats:{damageMin:13,damageMax:19,undeadDamage:20},desc:"Inflige daño adicional a no muertos."},
 obsidianSword:{name:"Espada de obsidiana",icon:"⚔️",type:"weapon",slot:"mainHand",value:1250,stack:false,stats:{damageMin:20,damageMax:29,critical:6},desc:"Arma pesada de filo oscuro."},
 leatherHelm:{name:"Casco de cuero",icon:"⛑️",type:"armor",slot:"head",value:100,stack:false,stats:{defense:3},desc:"Protección ligera."},
 leatherChest:{name:"Pechera de cuero",icon:"🥋",type:"armor",slot:"chest",value:190,stack:false,stats:{defense:7},desc:"Armadura flexible."},
 bearChest:{name:"Pechera de cuero de oso",icon:"🥋",type:"armor",slot:"chest",value:520,stack:false,stats:{defense:13,health:12},desc:"Armadura gruesa de cazador."},
 trollChest:{name:"Pechera de cuero de troll",icon:"🛡️",type:"armor",slot:"chest",value:1150,stack:false,stats:{defense:20,health:25},desc:"Armadura rara con propiedades regenerativas."},
 ironHelm:{name:"Casco de hierro",icon:"🪖",type:"armor",slot:"head",value:260,stack:false,stats:{defense:7},desc:"Casco metálico."},
 ironChest:{name:"Pechera de hierro",icon:"🛡️",type:"armor",slot:"chest",value:720,stack:false,stats:{defense:18},desc:"Armadura pesada de hierro."},
 robe:{name:"Túnica de tela fina",icon:"👘",type:"cloth",slot:"robe",value:330,stack:false,stats:{mana:18,magicPower:6},desc:"Prenda para usuarios de magia."},
 cloak:{name:"Capa sombría",icon:"🧥",type:"cloth",slot:"cloak",value:790,stack:false,stats:{magicResistance:8,evasion:4},desc:"Capa de tela encantada."},
 ring:{name:"Anillo arcano",icon:"💍",type:"jewelry",slot:"ring",value:620,stack:false,stats:{},desc:"Puede contener entre uno y cinco buffs."},
 scrollIce:{name:"Pergamino: Nova de hielo",icon:"📜",type:"scroll",value:220,stack:true,spell:"iceNova",desc:"Añade Nova de hielo al spellbook."},
 scrollLightning:{name:"Pergamino: Cadena de relámpagos",icon:"📜",type:"scroll",value:450,stack:true,spell:"chainLightning",desc:"Añade Cadena de relámpagos al spellbook."}
};
const buffPool = [
 ["healthPercent","Vida máxima",6,20],["manaPercent","Maná máximo",8,22],["manaRegen","Regeneración de maná",8,24],
 ["healthRegen","Regeneración de vida",7,22],["lifeSteal","Robo de vida",6,19],["damagePercent","Daño físico",5,18],
 ["magicDamage","Daño mágico",6,20],["critical","Crítico",4,14],["accuracy","Precisión",5,18],["resistance","Resistencia",5,18]
];

const player = {
 name:"Aldren",x:124,y:126,dirX:0,dirY:1,health:220,maxHealth:220,mana:92,maxMana:92,stamina:100,maxStamina:100,
 gold:450,honor:0,notoriety:0,notorietyTick:0,attackCd:0,magicCd:0,healCd:0,attackAnim:0,castAnim:0,hurtAnim:0,
 walkPhase:0,state:"idle",attributes:{strength:50,dexterity:50,intelligence:20},
 inventory:[],equipment:{head:null,chest:null,arms:null,gloves:null,legs:null,boots:null,mainHand:null,offHand:null,robe:null,cloak:null,ring:null},
 knownSpells:["fireball","heal"],equippedSpells:["fireball","heal",null,null],vitalShield:0,regen:0
};

const spellDefs = {
 fireball:{name:"Bola de fuego",icon:"🔥",skill:"magery",required:0,cost:15,offensive:true},
 heal:{name:"Curación",icon:"✚",skill:"healing",required:0,cost:18,offensive:false},
 iceNova:{name:"Nova de hielo",icon:"❄️",skill:"magery",required:60,cost:32,offensive:true},
 chainLightning:{name:"Cadena de relámpagos",icon:"⚡",skill:"magery",required:80,cost:45,offensive:true},
 regeneration:{name:"Regeneración",icon:"🌿",skill:"healing",required:60,cost:28,offensive:false},
 vitalShield:{name:"Escudo vital",icon:"🟢",skill:"healing",required:80,cost:42,offensive:false}
};

function makeItem(id, opts={}) {
 const d=itemDefs[id]; if(!d) throw new Error("Item inexistente: "+id);
 return {id,uid:id+"-"+Date.now()+"-"+Math.random(),count:opts.count||1,rarity:opts.rarity||"common",quality:opts.quality||null,buffs:opts.buffs||[],craftedBy:opts.craftedBy||null,...d,stats:{...(d.stats||{}),...(opts.stats||{})}};
}
function randomBuffs(count){const pool=[...buffPool],out=[];for(let i=0;i<count&&pool.length;i++){const ix=Math.floor(Math.random()*pool.length),b=pool.splice(ix,1)[0];out.push({id:b[0],name:b[1],value:Math.round(rand(b[2],b[3]))})}return out}
function randomRarity(power=1){const r=Math.random();if(r<.025*power)return"legendary";if(r<.08*power)return"epic";if(r<.19*power)return"rare";if(r<.48)return"uncommon";return"common"}
function enhanceItem(it,power=1){if(!it.slot)return it;it.rarity=randomRarity(power);const range=rarity[it.rarity].buffs,count=Math.floor(rand(range[0],range[1]+1));it.buffs=randomBuffs(count);return it}
function addItem(it){if(it.stack){const f=player.inventory.find(x=>x.id===it.id&&x.stack);if(f){f.count+=it.count;return true}}if(player.inventory.length>=36)return false;player.inventory.push(it);return true}
function removeAmount(index,amount=1){const it=player.inventory[index];if(!it)return null;if(it.stack&&it.count>amount){it.count-=amount;return {...it,count:amount,uid:it.id+"-"+Date.now()}}return player.inventory.splice(index,1)[0]}
function countItem(id){return player.inventory.filter(i=>i.id===id).reduce((n,i)=>n+i.count,0)}
function consume(id,count){for(let i=player.inventory.length-1;i>=0&&count>0;i--){const it=player.inventory[i];if(it.id!==id)continue;const take=Math.min(count,it.count);removeAmount(i,take);count-=take}}
function equipStats(){const out={damageMin:3,damageMax:6,defense:0,accuracy:0,health:0,mana:0,magicPower:0,magicResistance:0,evasion:0};Object.values(player.equipment).filter(Boolean).forEach(it=>Object.entries(it.stats||{}).forEach(([k,v])=>out[k]=(out[k]||0)+v));return out}
function buffValue(id){let n=0;Object.values(player.equipment).filter(Boolean).forEach(it=>(it.buffs||[]).forEach(b=>{if(b.id===id)n+=b.value}));return n}
function derived(){const e=equipStats();player.maxHealth=(130+player.attributes.strength*1.5+e.health)*(1+buffValue("healthPercent")/100);player.maxMana=(35+player.attributes.intelligence*1.2+e.mana)*(1+buffValue("manaPercent")/100);player.health=Math.min(player.health,player.maxHealth);player.mana=Math.min(player.mana,player.maxMana)}
function itemHtml(it){let h=`<h3 class="rarity-${it.rarity}">${it.icon} ${it.name}</h3><p>${it.desc||""}</p><div class="stat"><span>Rareza</span><strong class="rarity-${it.rarity}">${rarity[it.rarity].name}</strong></div>`;Object.entries(it.stats||{}).forEach(([k,v])=>h+=`<div class="stat"><span>${statName(k)}</span><strong>+${v}</strong></div>`);(it.buffs||[]).forEach(b=>h+=`<div class="stat"><span>${b.name}</span><strong>+${b.value}%</strong></div>`);if(it.quality)h+=`<div class="stat"><span>Calidad</span><strong>${it.quality}</strong></div>`;if(it.craftedBy)h+=`<p><strong>${it.craftedBy}</strong></p>`;return h}
function statName(k){return({damageMin:"Daño mínimo",damageMax:"Daño máximo",defense:"Defensa",accuracy:"Precisión",health:"Vida",mana:"Maná",magicPower:"Poder mágico",magicResistance:"Resistencia mágica",evasion:"Evasión",undeadDamage:"Daño a no muertos",critical:"Crítico"})[k]||k}
function rand(a,b){return a+Math.random()*(b-a)}function clamp(v,a,b){return Math.max(a,Math.min(b,v))}function dist(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}function choice(a){return a[Math.floor(Math.random()*a.length)]}

const regions = [
 {name:"Ciudad de Eldoria",x:112,y:112,w:28,h:28,color:"#76726a",type:"city"},
 {name:"Bosque del Susurro",x:65,y:75,w:55,h:60,color:"#31543b",type:"forest"},
 {name:"Cementerio Antiguo",x:155,y:70,w:44,h:45,color:"#343a36",type:"grave"},
 {name:"Minas Quebradas",x:185,y:145,w:48,h:60,color:"#4d4943",type:"mine"},
 {name:"Pantano Umbrío",x:55,y:165,w:60,h:55,color:"#29433b",type:"swamp"},
 {name:"Ruinas del Norte",x:108,y:24,w:50,h:38,color:"#534b43",type:"ruins"}
];
function regionAt(x,y){return regions.find(r=>x>=r.x&&y>=r.y&&x<r.x+r.w&&y<r.y+r.h)||{name:"Tierras Salvajes",type:"wild"}}
function tileAt(x,y){if(x<2||y<2||x>WORLD-3||y>WORLD-3)return"water";const r=regionAt(x,y);if(r.type==="city"){if(Math.abs(x-126)<3||Math.abs(y-126)<3)return"road";return"plaza"}if(r.type==="grave")return((x+y)%7===0)?"gravePath":"grave";if(r.type==="mine")return"stone";if(r.type==="swamp")return Math.sin(x*.25+y*.31)>.55?"water":"swamp";if(r.type==="ruins")return"ruins";if(r.type==="forest")return"forest";return Math.sin(x*.08)+Math.cos(y*.11)>.85?"forest":"grass"}
function blocked(x,y){const t=tileAt(Math.floor(x),Math.floor(y));if(t==="water")return true;for(const b of buildings){if(x>b.x&&x<b.x+b.w&&y>b.y&&y<b.y+b.h){const door=Math.abs(x-b.doorX)<1.1&&Math.abs(y-(b.y+b.h))<1.5;if(!door)return true}}for(const n of oreNodes)if(!n.depleted&&Math.hypot(x-n.x,y-n.y)<.55)return true;return false}

const buildings = [
 {name:"Herrería",x:116,y:116,w:7,h:6,doorX:119.5,color:"#5e5143"},
 {name:"Sastrería",x:128,y:116,w:7,h:6,doorX:131.5,color:"#57465f"},
 {name:"Banco",x:116,y:130,w:7,h:6,doorX:119.5,color:"#4d5b63"},
 {name:"Torre Arcana",x:128,y:130,w:7,h:6,doorX:131.5,color:"#40546d"}
];

const npcDefs = {
 blacksmith:{name:"Brom, herrero",role:"blacksmith",color:"#a45d42",weapon:"hammer",greeting:"Puedo venderte equipo y trabajar metales."},
 tailor:{name:"Selene, sastre",role:"tailor",color:"#745986",weapon:null,greeting:"Las buenas telas y pieles cuentan historias."},
 banker:{name:"Gareth, banquero",role:"bank",color:"#5b7080",weapon:null,greeting:"Tu oro estará seguro conmigo."},
 mage:{name:"Mara, arcanista",role:"mage",color:"#436997",weapon:"staff",greeting:"Tengo pergaminos y objetos arcanos."},
 guard:{name:"Guardia de Eldoria",role:"guard",color:"#426f9d",weapon:"sword",greeting:"Mantén la paz dentro de la ciudad."}
};
function makeNpc(type,x,y,restX=x,restY=y){const d=npcDefs[type];return{...d,type,x,y,homeX:x,homeY:y,restX,restY,dirX:0,dirY:1,state:"idle",phase:Math.random()*6,attackAnim:0,hurtAnim:0,health:type==="guard"?180:100,maxHealth:type==="guard"?180:100,target:null}}
const npcs = [
 makeNpc("blacksmith",119.5,123,118,118),makeNpc("tailor",131.5,123,133,118),makeNpc("banker",119.5,137,118,132),makeNpc("mage",131.5,137,133,132),
 makeNpc("guard",112,126,112,126),makeNpc("guard",140,126,140,126),makeNpc("guard",126,112,126,112),makeNpc("guard",126,140,126,140)
];

const enemyDefs = {
 bandit:{name:"Bandido",body:"human",color:"#87483d",health:75,damage:9,speed:2.1,loot:["bone","potion","ironSword"],tag:"criminal"},
 archer:{name:"Arquero bandido",body:"human",color:"#6d593b",health:60,damage:8,speed:2,loot:["cloth","potion"],tag:"criminal",ranged:true},
 wolf:{name:"Lobo gris",body:"beast",color:"#777b7e",health:58,damage:8,speed:2.8,loot:["rawHide"],tag:"beast"},
 bear:{name:"Oso pardo",body:"beast",color:"#76513b",health:130,damage:15,speed:1.6,loot:["bearHide"],tag:"beast"},
 skeleton:{name:"Esqueleto",body:"undead",color:"#c8c2a4",health:70,damage:10,speed:1.8,loot:["bone","silverOre"],tag:"undead"},
 necromancer:{name:"Nigromante",body:"human",color:"#66477c",health:105,damage:16,speed:1.5,loot:["boneDust","scrollIce"],tag:"undead",ranged:true},
 troll:{name:"Troll",body:"monster",color:"#557455",health:220,damage:22,speed:1.25,loot:["trollHide"],tag:"monster"},
 swampWitch:{name:"Bruja del pantano",body:"human",color:"#556b63",health:115,damage:17,speed:1.5,loot:["shadowCloth","scrollLightning"],tag:"cult",ranged:true}
};
function makeEnemy(id,x,y,level=1){const d=enemyDefs[id],night=isNight(),mul=night?1.2:1;return{id,type:id,...d,x,y,homeX:x,homeY:y,level,health:d.health*mul,maxHealth:d.health*mul,damage:d.damage*mul,speed:d.speed,alive:true,state:"idle",phase:Math.random()*6,attackCd:rand(0,1),attackAnim:0,hurtAnim:0,respawn:0,nightSpawn:night}}
const enemies=[];
function spawnGroup(id,region,count,level){for(let i=0;i<count;i++)enemies.push(makeEnemy(id,region.x+rand(3,region.w-3),region.y+rand(3,region.h-3),level))}
spawnGroup("bandit",regions[1],14,1);spawnGroup("archer",regions[1],7,2);spawnGroup("skeleton",regions[2],15,2);spawnGroup("necromancer",regions[2],4,4);spawnGroup("troll",regions[3],6,5);spawnGroup("wolf",regions[1],10,1);spawnGroup("bear",regions[1],5,3);spawnGroup("swampWitch",regions[4],7,4);

const oreNodes=[];
function addOres(id,count,region,required){for(let i=0;i<count;i++)oreNodes.push({id,x:region.x+rand(4,region.w-4),y:region.y+rand(4,region.h-4),required,depleted:false,respawn:0,phase:Math.random()*6})}
addOres("copperOre",10,regions[3],0);addOres("ironOre",16,regions[3],20);addOres("silverOre",8,regions[3],45);addOres("obsidianOre",5,regions[3],75);

const shops = {
 blacksmith:{name:"Herrería de Brom",items:["pickaxe","ironSword","ironHelm","ironChest","potion"]},
 tailor:{name:"Sastrería de Selene",items:["leatherHelm","leatherChest","robe","cloak","cloth","fineCloth"]},
 mage:{name:"Tienda Arcana de Mara",items:["manaPotion","ring","scrollIce","scrollLightning"]},
 bank:{name:"Banco",items:[]}
};

const craftGroups = [
 {id:"tailor-normal",profession:"tailoring",name:"Cuero normal",material:"leather",recipes:[
  ["Casco de cuero","leatherHelm",{leather:3},10],["Pechera de cuero","leatherChest",{leather:8},25]
 ]},
 {id:"tailor-bear",profession:"tailoring",name:"Cuero de oso",material:"bearLeather",recipes:[
  ["Casco de oso","leatherHelm",{bearLeather:4},40],["Pechera de oso","bearChest",{bearLeather:9},45]
 ]},
 {id:"tailor-troll",profession:"tailoring",name:"Cuero de troll",material:"trollLeather",recipes:[
  ["Casco de troll","leatherHelm",{trollLeather:5},75],["Pechera de troll","trollChest",{trollLeather:10},80]
 ]},
 {id:"tailor-cloth",profession:"tailoring",name:"Telas",material:"cloth",recipes:[
  ["Túnica de tela fina","robe",{fineCloth:6},35],["Capa sombría","cloak",{shadowCloth:5,boneDust:2},75]
 ]},
 {id:"processing",profession:"tailoring",name:"Tratamiento de pieles",material:"rawHide",recipes:[
  ["Cuero normal","leather",{rawHide:3},0,2],["Cuero de oso","bearLeather",{bearHide:2},35,1],["Cuero de troll","trollLeather",{trollHide:2},70,1],["Polvo de hueso","boneDust",{bone:3},20,1]
 ]},
 {id:"smelt",profession:"blacksmithing",name:"Fundición",material:"ironOre",recipes:[
  ["Lingote de cobre","copperIngot",{copperOre:3},0,1],["Lingote de hierro","ironIngot",{ironOre:3},20,1],["Lingote de plata","silverIngot",{silverOre:3},45,1],["Lingote de obsidiana","obsidianIngot",{obsidianOre:3},75,1]
 ]},
 {id:"smith-iron",profession:"blacksmithing",name:"Hierro",material:"ironIngot",recipes:[
  ["Espada de hierro","ironSword",{ironIngot:5},25],["Casco de hierro","ironHelm",{ironIngot:6},30],["Pechera de hierro","ironChest",{ironIngot:12},45]
 ]},
 {id:"smith-silver",profession:"blacksmithing",name:"Plata",material:"silverIngot",recipes:[
  ["Espada de plata","silverSword",{silverIngot:6},55]
 ]},
 {id:"smith-obsidian",profession:"blacksmithing",name:"Obsidiana",material:"obsidianIngot",recipes:[
  ["Espada de obsidiana","obsidianSword",{obsidianIngot:7},80]
 ]}
];

function seedInventory(){["potion","potion","potion","manaPotion","pickaxe","ironSword","leatherChest","rawHide","rawHide","rawHide","bone","bone","bone","ironOre","ironOre","ironOre"].forEach(id=>addItem(makeItem(id)));player.equipment.mainHand=player.inventory.splice(player.inventory.findIndex(i=>i.id==="ironSword"),1)[0];player.equipment.chest=player.inventory.splice(player.inventory.findIndex(i=>i.id==="leatherChest"),1)[0]}
seedInventory();

function screen(x,y,z=0){return{x:(x-y)*TW/2+camera.x+innerWidth/2,y:(x+y)*TH/2+camera.y+innerHeight/2-z}}
function worldFromScreen(sx,sy){const a=(sx-innerWidth/2-camera.x)/(TW/2),b=(sy-innerHeight/2-camera.y)/(TH/2);return{x:(a+b)/2,y:(b-a)/2}}
function resize(){canvas.width=innerWidth*devicePixelRatio;canvas.height=innerHeight*devicePixelRatio;ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0)}
addEventListener("resize",resize);resize();

function drawDiamond(x,y,color){const p=screen(x,y);ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(p.x,p.y-TH/2);ctx.lineTo(p.x+TW/2,p.y);ctx.lineTo(p.x,p.y+TH/2);ctx.lineTo(p.x-TW/2,p.y);ctx.closePath();ctx.fill()}
function tileColor(t){return({grass:"#35573c",forest:"#2c4e35",road:"#77746b",plaza:"#807b70",grave:"#303733",gravePath:"#575a54",stone:"#4c4944",swamp:"#29433a",ruins:"#514942",water:"#21485b"})[t]}
function drawWorld(){
 const center=worldFromScreen(innerWidth/2,innerHeight/2),rx=Math.ceil(innerWidth/TW)+6,ry=Math.ceil(innerHeight/TH)+6;
 for(let y=Math.max(0,Math.floor(center.y-ry));y<Math.min(WORLD,Math.ceil(center.y+ry));y++)for(let x=Math.max(0,Math.floor(center.x-rx));x<Math.min(WORLD,Math.ceil(center.x+rx));x++){const t=tileAt(x,y);drawDiamond(x,y,tileColor(t));if(t==="water"){const p=screen(x,y);ctx.strokeStyle=`rgba(125,190,210,${.15+.1*Math.sin(performance.now()/500+x+y)})`;ctx.beginPath();ctx.moveTo(p.x-10,p.y);ctx.lineTo(p.x+10,p.y);ctx.stroke()}if((t==="forest"||t==="grass")&&(x*37+y*13)%31===0)drawGrass(x+.4,y+.4)}
 buildings.forEach(drawBuilding);oreNodes.filter(n=>!n.depleted).forEach(drawOre);
}
function drawBuilding(b){for(let y=b.y;y<b.y+b.h;y++)for(let x=b.x;x<b.x+b.w;x++)drawDiamond(x,y,"#726d63");const corners=[[b.x,b.y],[b.x+b.w,b.y],[b.x,b.y+b.h],[b.x+b.w,b.y+b.h]];corners.forEach(([x,y])=>drawPillar(x,y,b.color));for(let x=b.x+1;x<b.x+b.w;x+=2){drawPillar(x,b.y,b.color);if(Math.abs(x-b.doorX)>1)drawPillar(x,b.y+b.h,b.color)}}
function drawPillar(x,y,color){const p=screen(x,y);ctx.fillStyle=color;ctx.fillRect(p.x-4,p.y-26,8,27);ctx.fillStyle="#8e887d";ctx.fillRect(p.x-6,p.y-29,12,5)}
function drawGrass(x,y){const p=screen(x,y),s=Math.sin(performance.now()/700+x)*2;ctx.strokeStyle="#5b7d56";ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x+s,p.y-8);ctx.moveTo(p.x+3,p.y);ctx.lineTo(p.x+5+s,p.y-6);ctx.stroke()}
function drawOre(n){const p=screen(n.x,n.y),glow=.5+.5*Math.sin(performance.now()/500+n.phase);ctx.fillStyle=n.id==="copperOre"?"#a66d43":n.id==="ironOre"?"#8a8d8f":n.id==="silverOre"?"#d7d8d2":"#332c3e";ctx.beginPath();ctx.moveTo(p.x-9,p.y);ctx.lineTo(p.x-5,p.y-13);ctx.lineTo(p.x+4,p.y-18);ctx.lineTo(p.x+10,p.y-3);ctx.closePath();ctx.fill();ctx.globalAlpha=.2*glow;ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(p.x,p.y-9,13,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1}

function drawHumanoid(e,isPlayer=false){
 const p=screen(e.x,e.y),moving=e.state==="walk",phase=e.walkPhase||e.phase||0,step=moving?Math.sin(phase*8):Math.sin(performance.now()/900+phase)*.15;
 const bob=moving?Math.abs(Math.sin(phase*8))*2:Math.sin(performance.now()/800+phase)*.7;
 const attack=e.attackAnim||0,cast=e.castAnim||0,hurt=e.hurtAnim||0;
 ctx.save();ctx.translate(p.x,p.y);
 if(hurt>0)ctx.rotate(Math.sin(hurt*18)*.07);
 ctx.fillStyle="#0006";ctx.beginPath();ctx.ellipse(0,4,11,4,0,0,Math.PI*2);ctx.fill();
 const primary=isPlayer?"#8c3c34":e.color||"#65717a",secondary=isPlayer?"#3e2830":"#333a40",skin="#c59673";
 const legL=step*5,legR=-step*5,armL=-step*4,armR=step*4;
 ctx.strokeStyle="#2b2524";ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(-4,-12+bob);ctx.lineTo(-5+legL,-1);ctx.moveTo(4,-12+bob);ctx.lineTo(5+legR,-1);ctx.stroke();
 ctx.fillStyle=primary;ctx.beginPath();ctx.moveTo(0,-36+bob);ctx.lineTo(11,-13+bob);ctx.lineTo(-11,-13+bob);ctx.closePath();ctx.fill();
 ctx.strokeStyle=primary;ctx.lineWidth=5;ctx.beginPath();let aL=armL,aR=armR;if(attack>0)aR=-18*Math.sin((1-attack)*Math.PI);if(cast>0){aL=-8;aR=8}ctx.moveTo(-8,-30+bob);ctx.lineTo(-14+aL,-15+bob);ctx.moveTo(8,-30+bob);ctx.lineTo(14+aR,-15+bob);ctx.stroke();
 ctx.fillStyle=skin;ctx.beginPath();ctx.arc(0,-42+bob,6,0,Math.PI*2);ctx.fill();ctx.fillStyle=isPlayer?"#402728":"#29231f";ctx.fillRect(-5,-48+bob,10,3);
 if(isPlayer||e.weapon){ctx.save();ctx.translate(13+aR,-17+bob);ctx.rotate(attack>0?-1.7+(1-attack)*2.7:-.55);ctx.strokeStyle=e.weapon==="staff"?"#906c42":"#d3d6da";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,2);ctx.lineTo(0,-20);ctx.stroke();ctx.restore()}
 if(cast>0){ctx.fillStyle="#72b7ff";ctx.globalAlpha=cast;ctx.beginPath();ctx.arc(-15,-17+bob,5+3*Math.sin(cast*10),0,Math.PI*2);ctx.fill();ctx.globalAlpha=1}
 ctx.restore();
 if(settings.showNames&&!isPlayer){ctx.textAlign="center";ctx.font="bold 8px Arial";ctx.fillStyle=e.role==="guard"?"#77b5f2":shops[e.role]?"#efd074":"#93c0e5";ctx.fillText(e.name,p.x,p.y-57)}
}
function drawEnemy(e){
 const p=screen(e.x,e.y),phase=e.phase,step=e.state==="walk"?Math.sin(phase*8):0,bob=e.state==="walk"?Math.abs(step)*2:Math.sin(performance.now()/800+phase)*.6;
 if(e.body==="human")drawHumanoid(e,false);else{ctx.save();ctx.translate(p.x,p.y);ctx.fillStyle="#0006";ctx.beginPath();ctx.ellipse(0,4,12,5,0,0,Math.PI*2);ctx.fill();ctx.fillStyle=e.hurtAnim>0?"#fff":e.color;if(e.body==="beast"){ctx.beginPath();ctx.ellipse(0,-11+bob,14,8,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(10,-17+bob,6,0,Math.PI*2);ctx.fill();ctx.strokeStyle=e.color;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-8,-7+bob);ctx.lineTo(-8+step*5,1);ctx.moveTo(7,-7+bob);ctx.lineTo(7-step*5,1);ctx.stroke()}else if(e.body==="undead"){ctx.strokeStyle=e.color;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,-31+bob);ctx.lineTo(0,-8+bob);ctx.moveTo(-9,-23+bob);ctx.lineTo(9,-20+bob);ctx.moveTo(0,-8+bob);ctx.lineTo(-7,0);ctx.moveTo(0,-8+bob);ctx.lineTo(7,0);ctx.stroke();ctx.fillStyle=e.color;ctx.beginPath();ctx.arc(0,-37+bob,6,0,Math.PI*2);ctx.fill()}else{ctx.beginPath();ctx.arc(0,-23+bob,12,0,Math.PI*2);ctx.fill();ctx.fillRect(-10,-22+bob,20,22)}ctx.restore()}
 if(settings.showNames){ctx.textAlign="center";ctx.font="bold 8px Arial";ctx.fillStyle=e.level>=5?"#cf8cff":"#f06c64";ctx.fillText(`${e.name} [Nv. ${e.level}]`,p.x,p.y-52)}
 if(settings.showBars&&dist(e,player)<7){ctx.fillStyle="#000c";ctx.fillRect(p.x-16,p.y-47,32,4);ctx.fillStyle="#bd4444";ctx.fillRect(p.x-16,p.y-47,32*e.health/e.maxHealth,4)}
}
function drawPlayer(){drawHumanoid(player,true);const p=screen(player.x,player.y);if(player.vitalShield>0){ctx.strokeStyle="#9fe2b5aa";ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(p.x,p.y-25,23,36,0,0,Math.PI*2);ctx.stroke()}}
function drawEffects(){floating.forEach(f=>{const p=screen(f.x,f.y,f.z);ctx.globalAlpha=f.life;ctx.fillStyle=f.color;ctx.textAlign="center";ctx.font="bold 11px Arial";ctx.fillText(f.text,p.x,p.y);ctx.globalAlpha=1});particles.forEach(p=>{const s=screen(p.x,p.y,p.z);ctx.globalAlpha=p.life;ctx.fillStyle=p.color;ctx.fillRect(s.x,s.y,2,2);ctx.globalAlpha=1});projectiles.forEach(p=>{const s=screen(p.x,p.y,p.z);ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(s.x,s.y,4,0,Math.PI*2);ctx.fill()})}
function drawDayNight(){const v=Math.sin(worldTime*Math.PI*2),night=v<0?Math.abs(v):0;if(night>0){ctx.fillStyle=`rgba(5,10,30,${night*.58})`;ctx.fillRect(0,0,innerWidth,innerHeight)}if(isNight()){for(const n of npcs.filter(n=>n.role==="guard")){const p=screen(n.x,n.y);ctx.fillStyle="#e8b766aa";ctx.beginPath();ctx.arc(p.x,p.y-25,18,0,Math.PI*2);ctx.fill()}}}
function draw(){ctx.clearRect(0,0,innerWidth,innerHeight);drawWorld();const entities=[];npcs.forEach(n=>entities.push({y:n.x+n.y,fn:()=>drawHumanoid(n,false)}));enemies.filter(e=>e.alive).forEach(e=>entities.push({y:e.x+e.y,fn:()=>drawEnemy(e)}));entities.push({y:player.x+player.y,fn:drawPlayer});entities.sort((a,b)=>a.y-b.y).forEach(e=>e.fn());drawEffects();drawDayNight()}

function updatePlayer(dt){
 let mx=stick.x+(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0),my=stick.y+(keys.s||keys.arrowdown?1:0)-(keys.w||keys.arrowup?1:0);
 const l=Math.hypot(mx,my);if(l>1){mx/=l;my/=l}const moving=Math.hypot(mx,my)>.08;player.state=moving?"walk":"idle";
 if(moving&&!panelOpen()){const wx=(my+mx)*.72,wy=(my-mx)*.72,nx=player.x+wx*4.1*dt,ny=player.y+wy*4.1*dt;if(!blocked(nx,player.y))player.x=nx;if(!blocked(player.x,ny))player.y=ny;player.dirX=wx;player.dirY=wy;player.walkPhase+=dt}
 player.attackCd=Math.max(0,player.attackCd-dt);player.magicCd=Math.max(0,player.magicCd-dt);player.healCd=Math.max(0,player.healCd-dt);player.attackAnim=Math.max(0,player.attackAnim-dt*3.8);player.castAnim=Math.max(0,player.castAnim-dt*3.4);player.hurtAnim=Math.max(0,player.hurtAnim-dt*4);player.mana=Math.min(player.maxMana,player.mana+(1.8+skills.meditation.value*.04)*(1+buffValue("manaRegen")/100)*dt);player.stamina=Math.min(100,player.stamina+12*dt);if(player.regen>0){player.regen-=dt;player.health=Math.min(player.maxHealth,player.health+7*dt)}if(player.vitalShield>0)player.vitalShield=Math.max(0,player.vitalShield-dt*2);
 player.notorietyTick+=dt;if(player.notoriety>0&&player.notorietyTick>=30){player.notorietyTick=0;player.notoriety=Math.max(0,player.notoriety-1)}
 reveal();const tx=-((player.x-player.y)*TW/2),ty=-((player.x+player.y)*TH/2)+innerHeight*.16;camera.x+=(tx-camera.x)*dt*5;camera.y+=(ty-camera.y)*dt*5
}
function updateNpcs(dt){
 const night=isNight();npcs.forEach(n=>{n.phase+=dt;n.attackAnim=Math.max(0,n.attackAnim-dt*3.5);n.hurtAnim=Math.max(0,n.hurtAnim-dt*4);let tx=night&&shops[n.role]?n.restX:n.homeX,ty=night&&shops[n.role]?n.restY:n.homeY;if(n.role==="guard"&&player.notoriety>=10&&regionAt(player.x,player.y).type==="city"&&dist(n,player)<8){n.target=player;tx=player.x;ty=player.y;if(dist(n,player)<1.4&&n.attackAnim<=0){n.attackAnim=1;damagePlayer(14)}}else n.target=null;const d=Math.hypot(tx-n.x,ty-n.y);if(d>.18){n.state="walk";n.dirX=(tx-n.x)/d;n.dirY=(ty-n.y)/d;n.x+=n.dirX*1.25*dt;n.y+=n.dirY*1.25*dt}else n.state="idle"})
}
function updateEnemies(dt){
 enemies.forEach(e=>{if(!e.alive){e.respawn-=dt;if(e.respawn<=0){const ne=makeEnemy(e.id,e.homeX,e.homeY,e.level);Object.assign(e,ne)}return}e.phase+=dt;e.attackCd=Math.max(0,e.attackCd-dt);e.attackAnim=Math.max(0,e.attackAnim-dt*3.5);e.hurtAnim=Math.max(0,e.hurtAnim-dt*4);const d=dist(e,player);if(d<8){e.state="walk";if(d>1.3){const dx=(player.x-e.x)/d,dy=(player.y-e.y)/d;const nx=e.x+dx*e.speed*dt,ny=e.y+dy*e.speed*dt;if(!blocked(nx,e.y))e.x=nx;if(!blocked(e.x,ny))e.y=ny}else if(e.attackCd<=0){e.attackCd=1.1;e.attackAnim=1;setTimeout(()=>{if(e.alive&&dist(e,player)<1.7)damagePlayer(e.damage)},220)}}else{const h=Math.hypot(e.homeX-e.x,e.homeY-e.y);if(h>3){e.state="walk";e.x+=(e.homeX-e.x)/h*e.speed*.5*dt;e.y+=(e.homeY-e.y)/h*e.speed*.5*dt}else e.state="idle"}})
 oreNodes.forEach(n=>{if(n.depleted){n.respawn-=dt;if(n.respawn<=0)n.depleted=false}})
 corpses.forEach(c=>c.life-=dt);for(let i=corpses.length-1;i>=0;i--)if(corpses[i].life<=0)corpses.splice(i,1)
}
function updateEffects(dt){for(const f of floating){f.z+=dt*12;f.life-=dt*.7}for(let i=floating.length-1;i>=0;i--)if(floating[i].life<=0)floating.splice(i,1);for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;p.vz-=12*dt;p.life-=dt}for(let i=particles.length-1;i>=0;i--)if(particles[i].life<=0)particles.splice(i,1);for(const p of projectiles){const d=Math.hypot(p.tx-p.x,p.ty-p.y);if(d<.25){p.hit();p.life=0}else{p.x+=(p.tx-p.x)/d*p.speed*dt;p.y+=(p.ty-p.y)/d*p.speed*dt;p.z=18+Math.sin(performance.now()/100)*2;p.life-=dt}}for(let i=projectiles.length-1;i>=0;i--)if(projectiles[i].life<=0)projectiles.splice(i,1)}

function isNight(){return worldTime>.5&&worldTime<.95}
function nearestEnemy(range=2){if(targetEnemy&&targetEnemy.alive&&dist(targetEnemy,player)<=range)return targetEnemy;return enemies.filter(e=>e.alive&&dist(e,player)<=range).sort((a,b)=>dist(a,player)-dist(b,player))[0]}
function attack(){
 if(!battleMode)return speak("Activa el modo batalla primero.");if(player.attackCd>0||panelOpen())return;const e=nearestEnemy(1.7);if(!e)return speak("No hay un enemigo al alcance.");const st=equipStats(),min=st.damageMin+skills.tactics.value*.08+player.attributes.strength*.04,max=st.damageMax+skills.tactics.value*.13+player.attributes.strength*.07;player.attackCd=.62;player.attackAnim=1;const dmg=Math.round(rand(min,max)*(1+buffValue("damagePercent")/100));setTimeout(()=>{if(e.alive&&dist(e,player)<2)damageEnemy(e,dmg)},190);gain("swords",.55,e.level);gain("tactics",.3,e.level)
}
function magic(){
 if(!battleMode)return speak("Activa el modo batalla primero.");if(player.magicCd>0)return;const e=nearestEnemy(7);if(!e)return speak("No hay objetivo.");if(player.mana<15)return speak("No tienes suficiente maná.");player.mana-=15;player.magicCd=.9;player.castAnim=1;projectiles.push({x:player.x,y:player.y,z:20,tx:e.x,ty:e.y,speed:9,color:"#ff8c54",life:2,hit:()=>damageEnemy(e,Math.round(18+skills.magery.value*.35))});gain("magery",.55,e.level)
}
function heal(){
 if(player.healCd>0)return;if(player.health>=player.maxHealth)return speak("Tu vida está completa.");if(player.mana<18)return speak("No tienes suficiente maná.");player.mana-=18;player.healCd=6;player.castAnim=1;const n=Math.round(35+skills.healing.value*.55);player.health=Math.min(player.maxHealth,player.health+n);floatText(player.x,player.y,"+"+n,"#74e69a");gain("healing",.6,1)
}
function potion(){const ix=player.inventory.findIndex(i=>i.id==="potion");if(ix<0)return speak("No tienes pociones.");if(player.health>=player.maxHealth)return speak("Tu vida está completa.");removeAmount(ix,1);player.health=Math.min(player.maxHealth,player.health+55);floatText(player.x,player.y,"+55","#76e89b")}
function useSpecial(level){
 if(!battleMode)return speak("Activa el modo batalla.");const main=highestCombatSkill();if(skills[main].value<level)return speak(`Requiere ${skillInfo[main].name} ${level}.`);
 if(main==="swords"){const e=nearestEnemy(2);if(!e)return speak("No hay enemigo al alcance.");if(level===60)damageEnemy(e,Math.round((equipStats().damageMax+20)*1.8));else{e.armorIgnored=3;damageEnemy(e,Math.round((equipStats().damageMax+18)*1.35))}}
 if(main==="magery"){if(level===60)enemies.filter(e=>e.alive&&dist(e,player)<3).forEach(e=>damageEnemy(e,25+skills.magery.value*.4));else enemies.filter(e=>e.alive&&dist(e,player)<8).slice(0,4).forEach((e,i)=>damageEnemy(e,Math.round((42+skills.magery.value*.3)*(1-i*.15))))}
 if(main==="healing"){if(level===60){player.regen=8;floatText(player.x,player.y,"REGENERACIÓN","#7ee6a0")}else{player.vitalShield=100;floatText(player.x,player.y,"ESCUDO VITAL","#a8efbf")}}
 if(main==="endurance"||main==="defense"){if(level===60)player.vitalShield=70;else player.vitalShield=180}
}
function highestCombatSkill(){return["swords","magery","healing","endurance"].sort((a,b)=>skills[b].value-skills[a].value)[0]}
function damageEnemy(e,n){if(!e.alive)return;e.health-=n;e.hurtAnim=1;floatText(e.x,e.y,"-"+n,"#ffd0c4");burst(e.x,e.y,e.color,10);if(e.health<=0)killEnemy(e)}
function damagePlayer(n){if(player.vitalShield>0){const block=Math.min(player.vitalShield,n);player.vitalShield-=block;n-=block;if(n<=0)return}const def=equipStats().defense+skills.defense.value*.18;n=Math.max(1,Math.round(n-def*.18));player.health-=n;player.hurtAnim=1;floatText(player.x,player.y,"-"+n,"#ffb0a5");gain("defense",.25,1);gain("endurance",.18,1);if(player.health<=0){player.health=player.maxHealth;player.mana=player.maxMana;player.x=124;player.y=126;player.gold=Math.max(0,player.gold-50);player.notoriety=Math.floor(player.notoriety/2);toast("Has reaparecido en Eldoria.")}}
function killEnemy(e){e.alive=false;e.respawn=120;const loot=[];for(const id of e.loot){if(Math.random()<.68)loot.push(id)}if(Math.random()<.22)loot.push(choice(["ring","ironSword","leatherChest"]));loot.forEach(id=>addItem(enhanceItem(makeItem(id),e.level*.45)));corpses.push({x:e.x,y:e.y,life:300,loot});player.gold+=Math.round(rand(6,20)*e.level);player.honor+=e.tag==="criminal"||e.tag==="undead"?2:0;toast(`${e.name} derrotado.`)}
function gain(id,amount,level=1){const s=skills[id],before10=Math.floor(s.value/10),beforeInt=Math.floor(s.value);const scale=clamp(1-(s.value-level*12)/130,.08,1);s.progress+=amount*scale;if(s.progress>=1){s.progress-=1;s.value=Math.min(100,Math.round((s.value+.1)*10)/10);if(Math.floor(s.value)>beforeInt)showLevel(`${s.name||skillInfo[id].name} subió a ${Math.floor(s.value)}`)}const after10=Math.floor(s.value/10);if(after10>before10)toast(`⬆️ ${skillInfo[id].name} alcanzó ${after10*10}`)}
function floatText(x,y,text,color){floating.push({x,y,z:32,text,color,life:1})}
function burst(x,y,color,count){for(let i=0;i<count;i++)particles.push({x,y,z:15,vx:rand(-1.5,1.5),vy:rand(-1.5,1.5),vz:rand(3,9),life:rand(.4,.9),color})}
function speak(t){toast(t)}
function toast(t){const d=document.createElement("div");d.className="toast";d.textContent=t;$("toastArea").appendChild(d);setTimeout(()=>d.remove(),2800)}
function showLevel(t){const d=$("levelBanner");d.textContent=t;d.classList.remove("hidden");d.style.animation="none";void d.offsetWidth;d.style.animation="banner 2.7s both";setTimeout(()=>d.classList.add("hidden"),2800)}

function toggleBattleMode(){battleMode=!battleMode;const b=$("battleModeButton");b.innerHTML=battleMode?"<span>🗡️</span><small>Paz</small>":"<span>🛡️</span><small>Batalla</small>";b.classList.toggle("battle-active",battleMode);document.querySelectorAll(".combat-only").forEach(x=>x.classList.toggle("hidden",!battleMode));$("specialButtons").style.display=battleMode?"flex":"none";$("spellQuickbar").style.display=battleMode?"flex":"none";toast(battleMode?"Modo batalla activado.":"Modo paz activado.");updateSpecialButtons()}
function updateSpecialButtons(){const main=highestCombatSkill(),name=skillInfo[main].name;[60,80].forEach(l=>{const b=$(l===60?"special60":"special80"),ok=skills[main].value>=l;b.classList.toggle("locked",!ok);b.querySelector("span").textContent=l;b.querySelector("small").textContent=ok?specialName(main,l):`${name} ${l}`})}
function specialName(skill,l){return({swords:{60:"Golpe poderoso",80:"Ignorar armadura"},magery:{60:"Nova de hielo",80:"Cadena eléctrica"},healing:{60:"Regeneración",80:"Escudo vital"},endurance:{60:"Guardia férrea",80:"Fortaleza"}})[skill]?.[l]||"Especial"}

function nearbyNpc(){return npcs.filter(n=>dist(n,player)<2).sort((a,b)=>dist(a,player)-dist(b,player))[0]}
function nearbyOre(){return oreNodes.filter(n=>!n.depleted&&dist(n,player)<1.8).sort((a,b)=>dist(a,player)-dist(b,player))[0]}
function interact(){if(panelOpen())return;const ore=nearbyOre();if(ore)return mine(ore);const n=nearbyNpc();if(n)return openDialogue(n);const c=corpses.filter(c=>dist(c,player)<1.8)[0];if(c)return toast("El botín ya fue transferido automáticamente.");speak("No hay nada para usar cerca.")}
function mine(node){if(!player.inventory.some(i=>i.id==="pickaxe"))return speak("Necesitas un pico.");if(skills.mining.value<node.required)return speak(`Requiere Minería ${node.required}.`);node.depleted=true;node.respawn=45;const amount=Math.random()<.25?2:1;addItem(makeItem(node.id,{count:amount}));gain("mining",.85,Math.max(1,node.required/15));burst(node.x,node.y,"#ddd",12);toast(`Obtuviste ${amount} ${itemDefs[node.id].name}.`)}
function openDialogue(n){closePanels();$("dialoguePanel").classList.remove("hidden");$("dialogueName").textContent=n.name;$("dialogueText").textContent=n.greeting;const box=$("dialogueOptions");box.innerHTML="";const add=(t,fn)=>{const b=document.createElement("button");b.textContent=t;b.onclick=fn;box.appendChild(b)};if(shops[n.role]){if(isNight()){add("Está descansando",()=>toast("Vuelve durante el día."))}else{add("Comprar",()=>openShop(n.role,"buy"));add("Vender",()=>openShop(n.role,"sell"))}}if(n.role==="bank")add("Abrir banco",()=>toast("El banco avanzado llegará en una revisión posterior."));add("Salir",closePanels)}
function openShop(role,mode){currentShop=role;currentShopMode=mode;selectedShop=-1;closePanels();$("shopPanel").classList.remove("hidden");$("shopTitle").textContent=shops[role].name;renderShop()}
function renderShop(){const list=$("shopList");list.innerHTML="";$("shopBuyTab").classList.toggle("active",currentShopMode==="buy");$("shopSellTab").classList.toggle("active",currentShopMode==="sell");const arr=currentShopMode==="buy"?shops[currentShop].items.map(id=>makeItem(id)):player.inventory;arr.forEach((it,i)=>{const r=document.createElement("button");r.className="list-row"+(selectedShop===i?" selected":"");const price=currentShopMode==="buy"?it.value:Math.floor(it.value*.45);r.innerHTML=`<span>${it.icon}</span><div><strong class="rarity-${it.rarity}">${it.name}</strong><small>${it.type}</small></div><b>${price} oro</b>`;r.onclick=()=>{selectedShop=i;renderShop();$("shopDetails").innerHTML=itemHtml(it)+`<div class="actions"><button id="shopAction">${currentShopMode==="buy"?"Comprar":"Vender"}</button></div>`;$("shopAction").onclick=()=>shopAction(i,it,price)};list.appendChild(r)})}
function shopAction(i,it,price){if(currentShopMode==="buy"){if(player.gold<price)return toast("No tienes suficiente oro.");player.gold-=price;addItem(makeItem(it.id));toast("Objeto comprado.")}else{removeAmount(i,1);player.gold+=price;toast("Objeto vendido.")}selectedShop=-1;renderShop()}

function openPanel(id){closePanels();$(id).classList.remove("hidden");paused=true}
function closePanels(){document.querySelectorAll(".overlay").forEach(x=>x.classList.add("hidden"));paused=false}
function panelOpen(){return ![...document.querySelectorAll(".overlay")].every(x=>x.classList.contains("hidden"))}
document.querySelectorAll("[data-close]").forEach(b=>b.onclick=closePanels);

function renderInventory(){const g=$("inventoryGrid");g.innerHTML="";player.inventory.forEach((it,i)=>{const b=document.createElement("button");b.className="item-card"+(selectedInventory===i?" selected":"");b.innerHTML=`<span>${it.icon}</span><small class="rarity-${it.rarity}">${it.name}</small>${it.stack&&it.count>1?`<b class="stack">×${it.count}</b>`:""}`;b.onclick=()=>{selectedInventory=i;renderInventory();renderInventoryDetails(it,i)};g.appendChild(b)});$("inventoryCapacity").textContent=`${player.inventory.length} / 36 espacios`;$("inventoryGold").textContent=`${player.gold} oro`;$("potionCount").textContent=countItem("potion")}
function renderInventoryDetails(it,i){let actions="";if(it.slot)actions+=`<button id="equipSelected">Equipar</button>`;if(it.type==="consumable")actions+=`<button id="useSelected">Usar</button>`;if(it.type==="scroll")actions+=`<button id="learnSelected">Añadir al spellbook</button>`;if(it.type==="material")actions+=`<button id="recipesSelected">Ver recetas</button>`;actions+=`<button id="dropSelected" class="danger">Soltar</button>`;$("inventoryDetails").innerHTML=itemHtml(it)+`<div class="actions">${actions}</div>`;if($("equipSelected"))$("equipSelected").onclick=()=>equipFromInventory(i);if($("useSelected"))$("useSelected").onclick=()=>{it.id==="potion"?potion():toast("Objeto usado.");renderInventory()};if($("learnSelected"))$("learnSelected").onclick=()=>learnScroll(i);if($("recipesSelected"))$("recipesSelected").onclick=()=>{$("craftButton").click()};$("dropSelected").onclick=()=>{removeAmount(i,1);selectedInventory=-1;renderInventory();$("inventoryDetails").innerHTML="<h3>Selecciona un objeto</h3>"}}
function equipFromInventory(i){const it=player.inventory[i];if(!it.slot)return;const old=player.equipment[it.slot];player.equipment[it.slot]=player.inventory.splice(i,1)[0];if(old)addItem(old);selectedInventory=-1;derived();renderInventory();toast(`${it.name} equipado.`)}
function renderEquipment(){const slots={head:"Cabeza",chest:"Pecho",arms:"Brazos",gloves:"Guantes",legs:"Piernas",boots:"Botas",mainHand:"Arma",offHand:"Grimorio/Escudo",robe:"Túnica",cloak:"Capa",ring:"Anillo"};const g=$("equipmentSlots");g.innerHTML="";Object.entries(slots).forEach(([slot,label])=>{const it=player.equipment[slot],b=document.createElement("button");b.className="equipment-slot"+(selectedEquipment===slot?" selected":"");b.innerHTML=`<span>${it?it.icon:"＋"}</span><small>${label}</small>`;b.onclick=()=>{selectedEquipment=slot;renderEquipment();renderEquipmentDetails(slot,it)};g.appendChild(b)})}
function renderEquipmentDetails(slot,it){if(!it){$("equipmentDetails").innerHTML="<h3>Espacio vacío</h3><p>Equipa un objeto desde el inventario.</p>";return}$("equipmentDetails").innerHTML=itemHtml(it)+`<div class="actions"><button id="unequipSelected">Desequipar</button><button id="dropEquipped" class="danger">Soltar</button></div>`;$("unequipSelected").onclick=()=>{if(player.inventory.length>=36)return toast("Inventario lleno.");addItem(it);player.equipment[slot]=null;derived();renderEquipment();renderEquipmentDetails(slot,null)};$("dropEquipped").onclick=()=>{player.equipment[slot]=null;derived();renderEquipment();renderEquipmentDetails(slot,null)}}
function renderSkills(){const list=$("skillsList");list.innerHTML="";Object.entries(skills).forEach(([id,s])=>{const b=document.createElement("button");b.className="list-row"+(selectedSkill===id?" selected":"");b.innerHTML=`<span>◆</span><div><strong>${skillInfo[id].name}</strong><small>${s.value.toFixed(1)} / 100</small><div class="skill-progress"><i style="width:${s.value}%"></i></div></div><b>${rank(s.value)}</b>`;b.onclick=()=>{selectedSkill=id;renderSkills();$("skillDetails").innerHTML=`<h3>${skillInfo[id].name}</h3><div class="stat"><span>Nivel</span><strong>${s.value.toFixed(1)} / 100</strong></div><div class="stat"><span>Rango</span><strong>${rank(s.value)}</strong></div><p>${skillInfo[id].desc}</p><h3>Cómo subirla</h3><p>${skillInfo[id].how}</p><h3>Desbloqueos</h3><p>${skillInfo[id].unlock}</p>`};list.appendChild(b)})}
function rank(v){return v>=100?"Legendario":v>=80?"Gran maestro":v>=60?"Maestro":v>=30?"Experto":"Aprendiz"}

function renderCraftTree(){const tree=$("craftTree");tree.innerHTML="";const professions=[["tailoring","🧵 Tailoring"],["blacksmithing","🔨 Herrería"]];professions.forEach(([p,label])=>{const head=document.createElement("button");head.className="tree-button parent";head.textContent=label;head.onclick=()=>{tree.querySelectorAll(`[data-prof="${p}"]`).forEach(x=>x.classList.toggle("hidden"))};tree.appendChild(head);craftGroups.filter(g=>g.profession===p).forEach(g=>{const b=document.createElement("button");b.className="tree-button tree-child";b.dataset.prof=p;b.textContent=g.name;b.onclick=()=>{selectedCraftGroup=g.id;selectedCraftRecipe=null;renderCraftTree();renderCraftRecipes(g)};if(selectedCraftGroup===g.id)b.classList.add("selected");tree.appendChild(b)})})}
function renderCraftRecipes(group){const list=$("craftRecipeList");list.innerHTML="";group.recipes.forEach((r,i)=>{const [name,id,mats,req,count=1]=r,b=document.createElement("button");b.className="list-row"+(selectedCraftRecipe===i?" selected":"");b.innerHTML=`<span>${itemDefs[id].icon}</span><div><strong>${name}</strong><small>${skillInfo[group.profession].name} ${req}</small></div><b>${Object.entries(mats).map(([m,c])=>`${c} ${itemDefs[m].name}`).join(", ")}</b>`;b.onclick=()=>{selectedCraftRecipe=i;renderCraftRecipes(group);renderCraftDetails(group,r)};list.appendChild(b)})}
function craftQuality(skill,req){const d=skill-req+rand(-20,20);return d>55?"Excepcional":d>20?"Bien confeccionada":"Normal"}
function renderCraftDetails(group,r){const [name,id,mats,req,count=1]=r;const sk=skills[group.profession].value,possible=Object.entries(mats).every(([m,c])=>countItem(m)>=c)&&sk>=req;let h=`<h3>${itemDefs[id].icon} ${name}</h3><p>${itemDefs[id].desc}</p><div class="stat"><span>Habilidad requerida</span><strong>${req}</strong></div><div class="stat"><span>Habilidad actual</span><strong>${sk.toFixed(1)}</strong></div><h3>Materiales</h3>`;Object.entries(mats).forEach(([m,c])=>h+=`<div class="stat"><span>${itemDefs[m].name}</span><strong>${countItem(m)} / ${c}</strong></div>`);h+=`<h3>Resultado posible</h3><p>Calidad normal, bien confeccionada o excepcional. Las mejores calidades pueden recibir buffs.</p><div class="actions"><button id="craftNow" ${possible?"":"disabled"}>Fabricar</button></div>`;$("craftDetails").innerHTML=h;$("craftNow").onclick=()=>craftItem(group,r)}
function craftItem(group,r){const [name,id,mats,req,count=1]=r;if(skills[group.profession].value<req)return toast("Habilidad insuficiente.");if(!Object.entries(mats).every(([m,c])=>countItem(m)>=c))return toast("Faltan materiales.");Object.entries(mats).forEach(([m,c])=>consume(m,c));const q=craftQuality(skills[group.profession].value,req),it=makeItem(id,{count,quality:q});if(it.slot){let buffs=q==="Normal"?0:q==="Bien confeccionada"?Math.floor(rand(1,3)):skills[group.profession].value>=100?Math.floor(rand(3,6)):Math.floor(rand(1,4));it.buffs=randomBuffs(buffs);it.rarity=buffs>=4?"legendary":buffs>=3?"epic":buffs>=2?"rare":buffs?"uncommon":"common";if(skills[group.profession].value>=100)it.craftedBy=group.profession==="tailoring"?`Confeccionado por ${player.name}`:`Forjado por ${player.name}`}addItem(it);gain(group.profession,.95,Math.max(1,req/15));toast(`${name} creado: ${q}.`);renderCraftDetails(group,r)}

function renderSpellbook(){const known=$("knownSpells");known.innerHTML="";player.knownSpells.forEach(id=>{const s=spellDefs[id],b=document.createElement("button");b.className="list-row";b.innerHTML=`<span>${s.icon}</span><div><strong>${s.name}</strong><small>Requiere ${skillInfo[s.skill].name} ${s.required}</small></div><b>Equipar</b>`;b.onclick=()=>{const free=player.equippedSpells.findIndex(x=>!x);player.equippedSpells[free>=0?free:0]=id;renderSpellbook();renderQuickbar()};known.appendChild(b)});const eq=$("equippedSpells");eq.innerHTML="";for(let i=0;i<4;i++){const id=player.equippedSpells[i],s=id?spellDefs[id]:null,b=document.createElement("button");b.innerHTML=s?`${s.icon}<br>${s.name}`:"＋ Vacío";b.onclick=()=>{player.equippedSpells[i]=null;renderSpellbook();renderQuickbar()};eq.appendChild(b)}const sl=$("scrollList");sl.innerHTML="";player.inventory.forEach((it,i)=>{if(it.type!=="scroll")return;const b=document.createElement("button");b.className="list-row";b.innerHTML=`<span>📜</span><div><strong>${it.name}</strong><small>${it.count} disponible(s)</small></div><b>Aprender</b>`;b.onclick=()=>learnScroll(i);sl.appendChild(b)})}
function learnScroll(i){const it=player.inventory[i],id=it.spell;if(player.knownSpells.includes(id))return toast("Ya conoces este hechizo.");player.knownSpells.push(id);removeAmount(i,1);showLevel(`Hechizo aprendido: ${spellDefs[id].name}`);renderSpellbook();renderInventory()}
function castSpell(id){if(!id)return;const s=spellDefs[id];if(skills[s.skill].value<s.required)return toast(`Requiere ${skillInfo[s.skill].name} ${s.required}.`);if(s.offensive&&!battleMode)return toast("Activa el modo batalla.");if(id==="fireball")return magic();if(id==="heal")return heal();if(player.mana<s.cost)return toast("Maná insuficiente.");player.mana-=s.cost;if(id==="iceNova")enemies.filter(e=>e.alive&&dist(e,player)<3).forEach(e=>damageEnemy(e,30+skills.magery.value*.3));if(id==="chainLightning")enemies.filter(e=>e.alive&&dist(e,player)<8).slice(0,4).forEach((e,i)=>damageEnemy(e,Math.round((45+skills.magery.value*.25)*(1-i*.15))));if(id==="regeneration")player.regen=8;if(id==="vitalShield")player.vitalShield=100;gain(s.skill,.65,1)}
function renderQuickbar(){document.querySelectorAll("#spellQuickbar button").forEach((b,i)=>{const id=player.equippedSpells[i],s=id?spellDefs[id]:null;b.innerHTML=s?`<span>${s.icon}</span><small>${i+1}</small>`:`<span>＋</span><small>${i+1}</small>`})}

function reveal(){const cx=Math.floor(player.x/3),cy=Math.floor(player.y/3);for(let y=-3;y<=3;y++)for(let x=-3;x<=3;x++)explored.add(`${cx+x},${cy+y}`)}
function drawMap(){mapCtx.clearRect(0,0,mapCanvas.width,mapCanvas.height);const sx=mapCanvas.width/WORLD,sy=mapCanvas.height/WORLD;for(let y=0;y<WORLD;y+=3)for(let x=0;x<WORLD;x+=3){const known=explored.has(`${Math.floor(x/3)},${Math.floor(y/3)}`);mapCtx.fillStyle=known?tileColor(tileAt(x,y)):"#070a0b";mapCtx.fillRect(x*sx,y*sy,sx*3+1,sy*3+1)}mapCtx.fillStyle="#fff";mapCtx.beginPath();mapCtx.arc(player.x*sx,player.y*sy,4,0,Math.PI*2);mapCtx.fill();mapCtx.fillStyle="#fff";mapCtx.font="12px Arial";mapCtx.fillText(`Explorado: ${Math.round(explored.size/(Math.ceil(WORLD/3)**2)*100)}%`,10,18)}

function renderSettings(tab="options"){document.querySelectorAll("[data-settings-tab]").forEach(b=>b.classList.toggle("active",b.dataset.settingsTab===tab));const c=$("settingsContent");if(tab==="options"){c.innerHTML=`<div class="setting-row"><span>Sonido</span><button id="soundToggle">${settings.sound?"Activado":"Silenciado"}</button></div><div class="setting-row"><span>Calidad gráfica</span><select id="qualitySelect"><option value="high">Alta</option><option value="medium">Media</option><option value="low">Baja</option></select></div><div class="setting-row"><span>Mostrar nombres</span><button id="namesToggle">${settings.showNames?"Sí":"No"}</button></div><div class="setting-row"><span>Mostrar barras de vida</span><button id="barsToggle">${settings.showBars?"Sí":"No"}</button></div><div class="setting-row"><span>Controles PC</span><strong>WASD · Espacio · F · Q · E · R · 1–4 · Z/X</strong></div><div class="setting-row"><span>Versión</span><strong>Proyecto Ultra V4.0</strong></div><div class="setting-row"><span>Partida</span><button id="resetGame" class="danger">Reiniciar partida</button></div>`;$("qualitySelect").value=settings.quality;$("soundToggle").onclick=()=>{settings.sound=!settings.sound;renderSettings("options")};$("qualitySelect").onchange=e=>settings.quality=e.target.value;$("namesToggle").onclick=()=>{settings.showNames=!settings.showNames;renderSettings("options")};$("barsToggle").onclick=()=>{settings.showBars=!settings.showBars;renderSettings("options")};$("resetGame").onclick=()=>openPanel("confirmReset")}else{const data=tab==="bestiary"?Object.values(enemyDefs).map(e=>({name:e.name,icon:e.body==="beast"?"🐺":e.body==="undead"?"💀":"👤",lines:[`Vida base: ${e.health}`,`Daño base: ${e.damage}`,`Loot: ${e.loot.map(i=>itemDefs[i]?.name).join(", ")}`]})):tab==="weapons"?Object.values(itemDefs).filter(i=>i.type==="weapon").map(i=>({name:i.name,icon:i.icon,lines:[i.desc,...Object.entries(i.stats||{}).map(([k,v])=>`${statName(k)}: ${v}`)]})):tab==="armor"?Object.values(itemDefs).filter(i=>i.type==="armor"||i.type==="cloth").map(i=>({name:i.name,icon:i.icon,lines:[i.desc,...Object.entries(i.stats||{}).map(([k,v])=>`${statName(k)}: ${v}`)]})):Object.values(itemDefs).filter(i=>i.type==="material").map(i=>({name:i.name,icon:i.icon,lines:[i.desc,`Valor: ${i.value}`]}));c.innerHTML=`<div class="compendium-grid">${data.map(d=>`<article class="compendium-card"><h4>${d.icon} ${d.name}</h4>${d.lines.map(l=>`<p>${l}</p>`).join("")}</article>`).join("")}</div>`}}
document.querySelectorAll("[data-settings-tab]").forEach(b=>b.onclick=()=>renderSettings(b.dataset.settingsTab));

function updateHud(){derived();$("healthBar").style.width=`${player.health/player.maxHealth*100}%`;$("manaBar").style.width=`${player.mana/player.maxMana*100}%`;$("staminaBar").style.width=`${player.stamina}%`;$("healthText").textContent=`${Math.round(player.health)} / ${Math.round(player.maxHealth)}`;$("manaText").textContent=`${Math.round(player.mana)} / ${Math.round(player.maxMana)}`;$("staminaText").textContent=`${Math.round(player.stamina)} / 100`;$("criminalIcon").textContent=player.notoriety>=10?"💀":"";const r=regionAt(player.x,player.y),hour=Math.floor(worldTime*24),min=Math.floor((worldTime*24-hour)*60);$("zoneName").textContent=`${isNight()?"🌙":"☀️"} ${r.name}`;$("worldClock").textContent=`${String(hour).padStart(2,"0")}:${String(min).padStart(2,"0")}`;$("potionCount").textContent=countItem("potion");const n=nearbyNpc(),o=nearbyOre();let hint=o?`Minar ${itemDefs[o.id].name}`:n?(shops[n.role]?`${isNight()?"Hablar con":"Comerciar con"} ${n.name}`:`Hablar con ${n.name}`):"";$("interactionHint").classList.toggle("hidden",!hint);$("interactionHint").textContent=hint;updateSpecialButtons()}
function save(){localStorage.setItem(SAVE_KEY,JSON.stringify({version:4,player:{...player},skills,worldTime,battleMode,explored:[...explored],settings}))}
function load(){try{const d=JSON.parse(localStorage.getItem(SAVE_KEY));if(!d)return;if(d.player)Object.assign(player,d.player);if(d.skills)Object.keys(skills).forEach(k=>Object.assign(skills[k],d.skills[k]||{}));worldTime=d.worldTime??worldTime;battleMode=!!d.battleMode;(d.explored||[]).forEach(x=>explored.add(x));Object.assign(settings,d.settings||{})}catch(e){console.warn(e)}}
function loop(t){const dt=Math.min(.033,(t-last)/1000||0);last=t;if(!paused){worldTime=(worldTime+dt/720)%1;updatePlayer(dt);updateNpcs(dt);updateEnemies(dt);updateEffects(dt);autosave+=dt;if(autosave>12){autosave=0;save()}}draw();updateHud();requestAnimationFrame(loop)}

function bind(){
 $("battleModeButton").onclick=toggleBattleMode;$("attackButton").onclick=attack;$("magicButton").onclick=magic;$("healButton").onclick=heal;$("interactButton").onclick=interact;$("potionButton").onclick=potion;$("special60").onclick=()=>useSpecial(60);$("special80").onclick=()=>useSpecial(80);
 $("inventoryButton").onclick=()=>{openPanel("inventoryPanel");renderInventory()};$("equipmentButton").onclick=()=>{openPanel("equipmentPanel");renderEquipment()};$("skillsButton").onclick=()=>{openPanel("skillsPanel");renderSkills()};$("craftButton").onclick=()=>{openPanel("craftPanel");renderCraftTree();$("craftRecipeList").innerHTML="";$("craftDetails").innerHTML="<h3>Selecciona una categoría</h3>"};$("spellbookButton").onclick=()=>{openPanel("spellbookPanel");renderSpellbook()};$("mapButton").onclick=()=>{openPanel("mapPanel");drawMap()};$("settingsButton").onclick=()=>{openPanel("settingsPanel");renderSettings("options")};
 $("shopBuyTab").onclick=()=>{currentShopMode="buy";selectedShop=-1;renderShop()};$("shopSellTab").onclick=()=>{currentShopMode="sell";selectedShop=-1;renderShop()};$("confirmResetButton").onclick=()=>{localStorage.removeItem(SAVE_KEY);location.reload()};
 document.querySelectorAll("[data-spell-slot]").forEach((b,i)=>b.onclick=()=>castSpell(player.equippedSpells[i]));
 addEventListener("keydown",e=>{if(["INPUT","SELECT","TEXTAREA"].includes(document.activeElement?.tagName))return;keys[e.key.toLowerCase()]=true;if(e.code==="Space"){e.preventDefault();attack()}if(e.key.toLowerCase()==="f")interact();if(e.key.toLowerCase()==="q")magic();if(e.key.toLowerCase()==="e")heal();if(e.key.toLowerCase()==="r")potion();if(["1","2","3","4"].includes(e.key))castSpell(player.equippedSpells[Number(e.key)-1]);if(e.key.toLowerCase()==="z")useSpecial(60);if(e.key.toLowerCase()==="x")useSpecial(80);if(e.key.toLowerCase()==="i")$("inventoryButton").click();if(e.key.toLowerCase()==="o")$("equipmentButton").click();if(e.key.toLowerCase()==="k")$("skillsButton").click();if(e.key.toLowerCase()==="c")$("craftButton").click();if(e.key.toLowerCase()==="b")$("spellbookButton").click();if(e.key.toLowerCase()==="m")$("mapButton").click();if(e.key==="Escape")closePanels()});
 addEventListener("keyup",e=>keys[e.key.toLowerCase()]=false);
 const base=$("joystickBase"),knob=$("joystickKnob");base.addEventListener("pointerdown",e=>{touchId=e.pointerId;base.setPointerCapture(touchId);moveStick(e)});base.addEventListener("pointermove",e=>{if(e.pointerId===touchId)moveStick(e)});base.addEventListener("pointerup",e=>{if(e.pointerId===touchId){touchId=null;stick.x=stick.y=0;knob.style.transform=""}});function moveStick(e){const r=base.getBoundingClientRect(),dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2),l=Math.hypot(dx,dy),m=Math.min(35,l),nx=l?dx/l:0,ny=l?dy/l:0;stick.x=nx*m/35;stick.y=ny*m/35;knob.style.transform=`translate(${nx*m}px,${ny*m}px)`}
 canvas.addEventListener("pointerdown",e=>{if(panelOpen())return;const w=worldFromScreen(e.clientX,e.clientY);const target=enemies.filter(x=>x.alive&&Math.hypot(x.x-w.x,x.y-w.y)<1.2).sort((a,b)=>Math.hypot(a.x-w.x,a.y-w.y)-Math.hypot(b.x-w.x,b.y-w.y))[0];if(target){targetEnemy=target;toast(`Objetivo: ${target.name}`)}})
}
load();bind();toggleBattleMode();toggleBattleMode();renderQuickbar();derived();requestAnimationFrame(loop);
})();