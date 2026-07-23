(() => {
"use strict";
const $ = id => document.getElementById(id);
const canvas = $("gameCanvas");
const ctx = canvas.getContext("2d");
const mapCanvas = $("mapCanvas");
const mapCtx = mapCanvas.getContext("2d");
const SAVE_KEY = "proyecto_ultra_v4_4";
const LEGACY_SAVE_KEYS=["proyecto_ultra_v4_3","proyecto_ultra_v4_2","proyecto_ultra_v4_1","proyecto_ultra_v4"];
const WORLD = 256, TW = 42, TH = 21;
let started = true, paused = false, last = performance.now();
let battleMode = false, worldTime = 0.22, autosave = 0;
let selectedInventory = -1, selectedEquipment = null, selectedSkill = null;
let currentShop = null, currentShopMode = "buy", selectedShop = -1;
let selectedCraftGroup = null, selectedCraftRecipe = null;
let selectedLootCorpse = null, selectedLootIndex = -1;
let touchId = null, targetEnemy = null;
const keys = {}, explored = new Set(), floating = [], particles = [], projectiles = [], corpses = [], groundItems=[];
const discovered={enemies:new Set(),items:new Set(),regions:new Set(),recipes:new Set()};
const bank=[];
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
 swords:{name:"Espadas",group:"Combate",desc:"Dominio de espadas de una mano.",how:"Golpea enemigos adecuados usando espadas.",unlock:"60: Golpe poderoso · 80: Ignorar armadura"},
 fencing:{name:"Esgrima",group:"Combate",desc:"Uso veloz de dagas, kris y estoques.",how:"Ataca con armas de Esgrima.",unlock:"60: Estocada precisa · 80: Danza de cuchillas"},
 maces:{name:"Mazas",group:"Combate",desc:"Armas contundentes que castigan armaduras.",how:"Ataca con mazas y martillos.",unlock:"60: Golpe quebrador · 80: Impacto sísmico"},
 axes:{name:"Hachas",group:"Combate",desc:"Armas de gran daño y utilidad para tala.",how:"Ataca con hachas.",unlock:"60: Hendidura · 80: Ejecución circular"},
 spears:{name:"Lanzas",group:"Combate",desc:"Armas de alcance y control de distancia.",how:"Ataca con lanzas o picas.",unlock:"60: Barrido · 80: Embestida perforante"},
 archery:{name:"Arquería",group:"Combate",desc:"Uso de arcos normales y compuestos.",how:"Dispara flechas contra enemigos.",unlock:"60: Disparo perforante · 80: Lluvia de flechas"},
 unarmed:{name:"Combate sin armas",group:"Combate",desc:"Técnicas de puños y control corporal.",how:"Golpea sin arma principal.",unlock:"60: Golpe aturdidor · 80: Llave de combate"},
 shieldMastery:{name:"Dominio del escudo",group:"Combate",desc:"Mejora el bloqueo y reduce su coste de aguante.",how:"Bloquea ataques llevando un escudo.",unlock:"60: Guardia firme · 80: Contraataque"},
 endurance:{name:"Resistencia",group:"Combate",desc:"Mejora vida, aguante y estabilidad física.",how:"Combate y soporta daño de enemigos válidos.",unlock:"60: Guardia férrea · 80: Fortaleza absoluta"},
 magery:{name:"Magia",group:"Magia",desc:"Permite lanzar hechizos arcanos.",how:"Lanza hechizos útiles en situaciones válidas.",unlock:"60: Nova de hielo · 80: Cadena de relámpagos"},
 arcaneKnowledge:{name:"Conocimiento arcano",group:"Magia",desc:"Identifica propiedades mágicas y potencia hechizos.",how:"Examina objetos arcanos y utiliza magia.",unlock:"Mejora potencia y lectura de resistencias"},
 meditation:{name:"Meditación",group:"Magia",desc:"Aumenta la recuperación de maná.",how:"Recupera maná después de usar magia.",unlock:"Mejora regeneración de maná"},
 healing:{name:"Curación",group:"Magia",desc:"Tratamiento de heridas y magia restauradora.",how:"Cura daño real y trata estados.",unlock:"60: Regeneración · 80: Escudo vital"},
 magicResistance:{name:"Resistencia mágica",group:"Magia",desc:"Reduce daño y estados mágicos.",how:"Sobrevive a hechizos hostiles.",unlock:"60: Velo protector · 80: Voluntad inquebrantable"},
 inscription:{name:"Inscripción",group:"Magia",desc:"Crea pergaminos, runas y componentes arcanos.",how:"Fabrica objetos de inscripción.",unlock:"Permite recetas avanzadas"},
 mining:{name:"Minería",group:"Oficios",desc:"Extrae minerales de vetas.",how:"Usa un pico sobre vetas no agotadas.",unlock:"Permite minerales superiores"},
 blacksmithing:{name:"Herrería",group:"Oficios",desc:"Funde y fabrica equipo metálico.",how:"Trabaja lingotes en una forja.",unlock:"A 100, firma objetos forjados"},
 tailoring:{name:"Confección",group:"Oficios",desc:"Trata pieles y fabrica equipo de cuero o tela.",how:"Crea piezas de dificultad apropiada.",unlock:"A 100, firma tus creaciones"},
 lumbering:{name:"Leñería",group:"Oficios",desc:"Obtiene madera de árboles aprovechables.",how:"Usa un hacha sobre árboles maduros.",unlock:"Desbloquea maderas superiores"},
 carpentry:{name:"Carpintería",group:"Oficios",desc:"Fabrica escudos, muebles y componentes de madera.",how:"Trabaja madera en un banco de carpintero.",unlock:"Permite estructuras avanzadas"},
 bowcraft:{name:"Fabricación de arcos",group:"Oficios",desc:"Fabrica arcos, astiles y flechas.",how:"Combina madera, plumas y metales.",unlock:"Permite arcos compuestos"},
 alchemy:{name:"Alquimia",group:"Oficios",desc:"Crea pociones, aceites y antídotos.",how:"Combina reactivos mediante recetas.",unlock:"Permite preparados avanzados"},
 butchering:{name:"Despiece",group:"Exploración",desc:"Extrae materiales útiles de cadáveres de criaturas.",how:"Usa una herramienta de corte sobre cadáveres apropiados.",unlock:"Mejora cantidad y calidad de recursos"},
 tracking:{name:"Rastreo",group:"Exploración",desc:"Encuentra huellas y dirección de criaturas.",how:"Sigue rastros recientes del entorno.",unlock:"Permite rastrear objetivos raros"},
 perception:{name:"Percepción",group:"Exploración",desc:"Descubre trampas, secretos y entidades ocultas.",how:"Explora zonas peligrosas y examina objetos.",unlock:"Mejora detección contextual"}
}
const skills = {};
Object.keys(skillInfo).forEach(k=>skills[k]={value:k==="swords"?35:k==="unarmed"?20:k==="fencing"?18:k==="archery"?16:k==="shieldMastery"?15:k==="healing"?22:k==="magery"?24:k==="tailoring"?12:k==="mining"?10:k==="blacksmithing"?8:0,progress:0,state:"up"});

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
 ironSword:{name:"Espada de hierro",icon:"🗡️",type:"weapon",weaponSkill:"swords",slot:"mainHand",value:180,stack:false,stats:{damageMin:8,damageMax:13,accuracy:3},desc:"Espada equilibrada de hierro."},
 silverSword:{name:"Espada de plata",icon:"🗡️",type:"weapon",weaponSkill:"swords",slot:"mainHand",value:520,stack:false,stats:{damageMin:13,damageMax:19,undeadDamage:20},desc:"Inflige daño adicional a no muertos."},
 obsidianSword:{name:"Espada de obsidiana",icon:"🗡️",type:"weapon",weaponSkill:"swords",slot:"mainHand",value:1250,stack:false,stats:{damageMin:20,damageMax:29,critical:6},desc:"Arma pesada de filo oscuro."},
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
 dagger:{name:"Daga de hierro",icon:"🔪",type:"weapon",weaponSkill:"fencing",slot:"mainHand",value:145,stack:false,stats:{damageMin:5,damageMax:9,accuracy:6,critical:5,speed:18},desc:"Arma ligera para Esgrima."},
 kriss:{name:"Kris de acero",icon:"🔪",type:"weapon",weaponSkill:"fencing",slot:"mainHand",value:360,stack:false,stats:{damageMin:8,damageMax:13,accuracy:8,critical:8,speed:22},desc:"Hoja ondulada de gran precisión."},
 obsidianKriss:{name:"Kris de obsidiana",icon:"🔪",type:"weapon",weaponSkill:"fencing",slot:"mainHand",value:1080,stack:false,stats:{damageMin:15,damageMax:22,critical:14,speed:20},desc:"Kris avanzado."},
 shortBow:{name:"Arco corto",icon:"🏹",type:"weapon",weaponSkill:"archery",twoHanded:true,slot:"mainHand",value:180,stack:false,stats:{damageMin:7,damageMax:12,accuracy:5,range:12},desc:"Arco ligero."},
 longBow:{name:"Arco largo",icon:"🏹",type:"weapon",weaponSkill:"archery",twoHanded:true,slot:"mainHand",value:450,stack:false,stats:{damageMin:12,damageMax:19,accuracy:7,range:16},desc:"Arco potente."},
 compoundBow:{name:"Arco compuesto",icon:"🏹",type:"weapon",weaponSkill:"archery",twoHanded:true,slot:"mainHand",value:920,stack:false,stats:{damageMin:17,damageMax:25,accuracy:10,range:18},desc:"Arco avanzado."},
 arrow:{name:"Flecha común",icon:"➶",type:"ammo",value:2,stack:true,desc:"Munición para arcos."},
 reinforcedArrow:{name:"Flecha reforzada",icon:"➶",type:"ammo",value:6,stack:true,desc:"Flecha de mayor daño."},
 silverArrow:{name:"Flecha de plata",icon:"➶",type:"ammo",value:12,stack:true,desc:"Eficaz contra no muertos."},
 buckler:{name:"Broquel",icon:"🛡️",type:"shield",slot:"offHand",value:160,stack:false,stats:{defense:3,block:3,staminaCost:5},desc:"Escudo pequeño."},
 ironShield:{name:"Escudo de hierro",icon:"🛡️",type:"shield",slot:"offHand",value:420,stack:false,stats:{defense:8,block:8,staminaCost:8},desc:"Escudo equilibrado."},
 steelShield:{name:"Escudo de acero",icon:"🛡️",type:"shield",slot:"offHand",value:720,stack:false,stats:{defense:12,block:10,staminaCost:9},desc:"Escudo robusto."},
 obsidianShield:{name:"Escudo de obsidiana",icon:"🛡️",type:"shield",slot:"offHand",value:1500,stack:false,stats:{defense:18,block:12,staminaCost:11},desc:"Escudo oscuro."},
 mithrilShield:{name:"Escudo de mithril",icon:"🛡️",type:"shield",slot:"offHand",value:3200,stack:false,stats:{defense:24,block:15,staminaCost:7,magicResistance:10},desc:"El mejor escudo metálico."},
 goldOre:{name:"Mineral de oro",icon:"🟡",type:"material",value:95,stack:true,desc:"Metal valioso y mágico."},
 mithrilOre:{name:"Mineral de mithril",icon:"🔹",type:"material",value:260,stack:true,desc:"Mineral extremadamente raro."},
 goldIngot:{name:"Lingote de oro",icon:"🟨",type:"material",value:240,stack:true,desc:"Oro refinado."},
 mithrilIngot:{name:"Lingote de mithril",icon:"🔷",type:"material",value:650,stack:true,desc:"Mithril refinado."},
 hardenedLeather:{name:"Cuero endurecido",icon:"🟫",type:"material",value:60,stack:true,desc:"Cuero resistente."},
 scaledLeather:{name:"Cuero escamado",icon:"🟩",type:"material",value:110,stack:true,desc:"Cuero flexible y venenorresistente."},
 monstrousLeather:{name:"Cuero monstruoso",icon:"🟪",type:"material",value:190,stack:true,desc:"Cuero de criaturas peligrosas."},
 wyvernLeather:{name:"Cuero de wyvern",icon:"🐲",type:"material",value:340,stack:true,desc:"Cuero dracónico avanzado."},
 dragonLeather:{name:"Cuero de dragón",icon:"🐉",type:"material",value:700,stack:true,desc:"El mejor cuero."},
 mithrilChest:{name:"Pechera de mithril",icon:"🛡️",type:"armor",slot:"chest",value:4800,stack:false,stats:{defense:36,magicResistance:14,evasion:3},desc:"La mejor armadura metálica."},
 dragonChest:{name:"Pechera de cuero de dragón",icon:"🐉",type:"armor",slot:"chest",value:4300,stack:false,stats:{defense:31,magicResistance:16,evasion:8},desc:"La mejor armadura de cuero."},
 steelOre:{name:"Carbón mineral",icon:"◾",type:"material",value:34,stack:true,desc:"Se combina con hierro para producir acero."},
 steelIngot:{name:"Lingote de acero",icon:"▰",type:"material",value:125,stack:true,desc:"Aleación resistente de hierro y carbón."},
 wood:{name:"Madera común",icon:"🪵",type:"material",value:12,stack:true,desc:"Material de carpintería y arquería."},
 feather:{name:"Pluma",icon:"🪶",type:"material",value:4,stack:true,desc:"Material para fabricar flechas."},
 herb:{name:"Hierba medicinal",icon:"🌿",type:"material",value:16,stack:true,desc:"Reactivo básico de alquimia."},
 butcherKnife:{name:"Cuchillo de despiece",icon:"🔪",type:"tool",value:95,stack:false,desc:"Permite extraer recursos adicionales de cadáveres."},
 mace:{name:"Maza de hierro",icon:"🔨",type:"weapon",weaponSkill:"maces",slot:"mainHand",value:260,stack:false,stats:{damageMin:11,damageMax:17,accuracy:1,critical:3,speed:75,poiseDamage:18},desc:"Maza eficaz contra armaduras."},
 battleAxe:{name:"Hacha de batalla",icon:"🪓",type:"weapon",weaponSkill:"axes",slot:"mainHand",value:340,stack:false,stats:{damageMin:13,damageMax:20,accuracy:0,critical:5,speed:68},desc:"Hacha de gran daño."},
 spear:{name:"Lanza de acero",icon:"🔱",type:"weapon",weaponSkill:"spears",twoHanded:true,slot:"mainHand",value:480,stack:false,stats:{damageMin:12,damageMax:19,accuracy:7,critical:4,speed:80,range:2.5},desc:"Arma de alcance superior."},
 steelSword:{name:"Espada de acero",icon:"🗡️",type:"weapon",weaponSkill:"swords",slot:"mainHand",value:480,stack:false,stats:{damageMin:12,damageMax:18,accuracy:5,speed:88},desc:"Espada refinada y resistente."},
 steelChest:{name:"Pechera de acero",icon:"🛡️",type:"armor",slot:"chest",value:1150,stack:false,stats:{defense:24},desc:"Armadura de acero equilibrada."},
 necklace:{name:"Amuleto protector",icon:"📿",type:"jewelry",slot:"neck",value:480,stack:false,stats:{magicResistance:5},desc:"Amuleto con defensa arcana."},
 hardenedChest:{name:"Pechera de cuero endurecido",icon:"🥋",type:"armor",slot:"chest",value:430,stack:false,stats:{defense:11,health:8},desc:"Armadura resistente de nivel intermedio."},
 scaledChest:{name:"Pechera de cuero escamado",icon:"🥋",type:"armor",slot:"chest",value:780,stack:false,stats:{defense:16,magicResistance:5},desc:"Armadura flexible resistente al veneno y magia."},
 monstrousChest:{name:"Pechera de cuero monstruoso",icon:"🛡️",type:"armor",slot:"chest",value:1450,stack:false,stats:{defense:23,health:20},desc:"Armadura avanzada de criatura monstruosa."},
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
 walkPhase:0,state:"idle",aimX:0,aimY:1,guardBuff:0,counterReady:0,attributes:{strength:50,dexterity:50,intelligence:20},attributeProgress:{strength:0,dexterity:0,intelligence:0},
 inventory:[],equipment:{head:null,neck:null,chest:null,arms:null,gloves:null,legs:null,boots:null,mainHand:null,offHand:null,robe:null,cloak:null,ring1:null,ring2:null},
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
function statName(k){return({damageMin:"Daño mínimo",damageMax:"Daño máximo",defense:"Defensa",accuracy:"Precisión",health:"Vida",mana:"Maná",magicPower:"Poder mágico",magicResistance:"Resistencia mágica",evasion:"Agilidad defensiva",undeadDamage:"Daño a no muertos",critical:"Crítico"})[k]||k}
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
function blocked(x,y){
 const t=tileAt(Math.floor(x),Math.floor(y));if(t==="water")return true;
 for(const b of buildings){
  const margin=.38,door=1.35,cx=b.x+b.w/2,cy=b.y+b.h/2;
  const withinX=x>=b.x-margin&&x<=b.x+b.w+margin,withinY=y>=b.y-margin&&y<=b.y+b.h+margin;
  if(!withinX||!withinY)continue;
  const north=Math.abs(y-b.y)<margin&&Math.abs(x-cx)>door;
  const south=Math.abs(y-(b.y+b.h))<margin&&Math.abs(x-cx)>door;
  const west=Math.abs(x-b.x)<margin&&Math.abs(y-cy)>door;
  const east=Math.abs(x-(b.x+b.w))<margin&&Math.abs(y-cy)>door;
  if(north||south||west||east)return true;
 }
 for(const n of oreNodes)if(!n.depleted&&Math.hypot(x-n.x,y-n.y)<.55)return true;
 return false
}

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
addOres("copperOre",10,regions[3],0);addOres("ironOre",16,regions[3],20);addOres("silverOre",8,regions[3],45);addOres("goldOre",7,regions[3],60);addOres("obsidianOre",5,regions[3],75);addOres("mithrilOre",3,regions[3],95);

const shops = {
 blacksmith:{name:"Herrería de Brom",items:["pickaxe","butcherKnife","ironSword","steelSword","dagger","kriss","mace","battleAxe","spear","shortBow","longBow","arrow","buckler","ironShield","steelShield","ironHelm","ironChest","steelChest","potion"]},
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
 {id:"tailor-wyvern",profession:"tailoring",name:"Cuero de wyvern",material:"wyvernLeather",recipes:[
  ["Pechera de wyvern","bearChest",{wyvernLeather:10},80]
 ]},
 {id:"tailor-dragon",profession:"tailoring",name:"Cuero de dragón",material:"dragonLeather",recipes:[
  ["Pechera de cuero de dragón","dragonChest",{dragonLeather:12},100]
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
  ["Lingote de cobre","copperIngot",{copperOre:3},0,1],["Lingote de hierro","ironIngot",{ironOre:3},20,1],["Lingote de plata","silverIngot",{silverOre:3},45,1],["Lingote de oro","goldIngot",{goldOre:3},60,1],["Lingote de mithril","mithrilIngot",{mithrilOre:3},95,1],["Lingote de obsidiana","obsidianIngot",{obsidianOre:3},75,1]
 ]},
 {id:"smith-iron",profession:"blacksmithing",name:"Hierro",material:"ironIngot",recipes:[
  ["Espada de hierro","ironSword",{ironIngot:5},25],["Casco de hierro","ironHelm",{ironIngot:6},30],["Pechera de hierro","ironChest",{ironIngot:12},45]
 ]},
 {id:"smith-silver",profession:"blacksmithing",name:"Plata",material:"silverIngot",recipes:[
  ["Espada de plata","silverSword",{silverIngot:6},55]
 ]},
 {id:"smith-gold",profession:"blacksmithing",name:"Oro",material:"goldIngot",recipes:[
  ["Escudo ceremonial de oro","steelShield",{goldIngot:8},65]
 ]},
 {id:"smith-mithril",profession:"blacksmithing",name:"Mithril",material:"mithrilIngot",recipes:[
  ["Pechera de mithril","mithrilChest",{mithrilIngot:14},100],["Escudo de mithril","mithrilShield",{mithrilIngot:10},100]
 ]},
 {id:"smith-obsidian",profession:"blacksmithing",name:"Obsidiana",material:"obsidianIngot",recipes:[
  ["Espada de obsidiana","obsidianSword",{obsidianIngot:7},80]
 ]}
];

function seedInventory(){["potion","potion","potion","manaPotion","pickaxe","ironSword","leatherChest","buckler","arrow","arrow","arrow","arrow","arrow","arrow","arrow","arrow","arrow","arrow","arrow","arrow","rawHide","rawHide","rawHide","bone","bone","bone","ironOre","ironOre","ironOre"].forEach(id=>addItem(makeItem(id)));player.equipment.mainHand=player.inventory.splice(player.inventory.findIndex(i=>i.id==="ironSword"),1)[0];player.equipment.chest=player.inventory.splice(player.inventory.findIndex(i=>i.id==="leatherChest"),1)[0]}
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
function drawBuilding(b){
 for(let y=b.y;y<b.y+b.h;y++)for(let x=b.x;x<b.x+b.w;x++)drawDiamond(x,y,"#726d63");
 const cx=b.x+b.w/2,cy=b.y+b.h/2;
 for(let x=b.x;x<=b.x+b.w;x+=1.5)if(Math.abs(x-cx)>1.2){drawPillar(x,b.y,b.color);drawPillar(x,b.y+b.h,b.color)}
 for(let y=b.y+1;y<b.y+b.h;y+=1.5)if(Math.abs(y-cy)>1.2){drawPillar(b.x,y,b.color);drawPillar(b.x+b.w,y,b.color)}
}
function drawPillar(x,y,color){const p=screen(x,y);ctx.fillStyle=color;ctx.fillRect(p.x-4,p.y-26,8,27);ctx.fillStyle="#8e887d";ctx.fillRect(p.x-6,p.y-29,12,5)}
function drawGrass(x,y){const p=screen(x,y),s=Math.sin(performance.now()/700+x)*2;ctx.strokeStyle="#5b7d56";ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x+s,p.y-8);ctx.moveTo(p.x+3,p.y);ctx.lineTo(p.x+5+s,p.y-6);ctx.stroke()}
function drawOre(n){const p=screen(n.x,n.y),glow=.5+.5*Math.sin(performance.now()/500+n.phase);ctx.fillStyle=n.id==="copperOre"?"#a66d43":n.id==="ironOre"?"#8a8d8f":n.id==="silverOre"?"#d7d8d2":n.id==="goldOre"?"#d5af3a":n.id==="mithrilOre"?"#69cde0":"#332c3e";ctx.beginPath();ctx.moveTo(p.x-9,p.y);ctx.lineTo(p.x-5,p.y-13);ctx.lineTo(p.x+4,p.y-18);ctx.lineTo(p.x+10,p.y-3);ctx.closePath();ctx.fill();ctx.globalAlpha=.2*glow;ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(p.x,p.y-9,13,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1}

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
function drawCorpses(){
 corpses.forEach(c=>{const p=screen(c.x,c.y),has=(c.loot&&c.loot.length)||c.gold>0;ctx.fillStyle="#2c2524";ctx.beginPath();ctx.ellipse(p.x,p.y-2,15,6,-.2,0,Math.PI*2);ctx.fill();if(has){const pulse=.45+.35*Math.sin(performance.now()/350);ctx.strokeStyle=`rgba(230,195,111,${pulse})`;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(p.x,p.y-4,19,9,0,0,Math.PI*2);ctx.stroke();ctx.fillStyle="#e6c36f";ctx.font="12px Arial";ctx.textAlign="center";ctx.fillText("◆",p.x,p.y-15)}})
}
function drawEffects(){floating.forEach(f=>{const p=screen(f.x,f.y,f.z);ctx.globalAlpha=f.life;ctx.fillStyle=f.color;ctx.textAlign="center";ctx.font="bold 11px Arial";ctx.fillText(f.text,p.x,p.y);ctx.globalAlpha=1});particles.forEach(p=>{const s=screen(p.x,p.y,p.z);ctx.globalAlpha=p.life;ctx.fillStyle=p.color;ctx.fillRect(s.x,s.y,2,2);ctx.globalAlpha=1});projectiles.forEach(p=>{const s=screen(p.x,p.y,p.z);ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(s.x,s.y,4,0,Math.PI*2);ctx.fill()})}
function drawDayNight(){const v=Math.sin(worldTime*Math.PI*2),night=v<0?Math.abs(v):0;if(night>0){ctx.fillStyle=`rgba(5,10,30,${night*.58})`;ctx.fillRect(0,0,innerWidth,innerHeight)}if(isNight()){for(const n of npcs.filter(n=>n.role==="guard")){const p=screen(n.x,n.y);ctx.fillStyle="#e8b766aa";ctx.beginPath();ctx.arc(p.x,p.y-25,18,0,Math.PI*2);ctx.fill()}}}
function draw(){ctx.clearRect(0,0,innerWidth,innerHeight);drawWorld();const entities=[];npcs.forEach(n=>entities.push({y:n.x+n.y,fn:()=>drawHumanoid(n,false)}));enemies.filter(e=>e.alive).forEach(e=>entities.push({y:e.x+e.y,fn:()=>drawEnemy(e)}));entities.push({y:player.x+player.y,fn:drawPlayer});entities.sort((a,b)=>a.y-b.y).forEach(e=>e.fn());drawCorpses();drawEffects();drawDayNight()}

function updatePlayer(dt){
 let mx=stick.x+(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0),my=stick.y+(keys.s||keys.arrowdown?1:0)-(keys.w||keys.arrowup?1:0);
 const l=Math.hypot(mx,my);if(l>1){mx/=l;my/=l}const moving=Math.hypot(mx,my)>.08;player.state=moving?"walk":"idle";
 if(moving&&!panelOpen()){const wx=(my+mx)*.72,wy=(my-mx)*.72,nx=player.x+wx*4.1*dt,ny=player.y+wy*4.1*dt;if(!blocked(nx,player.y))player.x=nx;if(!blocked(player.x,ny))player.y=ny;player.dirX=wx;player.dirY=wy;player.aimX=wx;player.aimY=wy;player.walkPhase+=dt}
 player.attackCd=Math.max(0,player.attackCd-dt);player.magicCd=Math.max(0,player.magicCd-dt);player.healCd=Math.max(0,player.healCd-dt);player.attackAnim=Math.max(0,player.attackAnim-dt*3.8);player.guardBuff=Math.max(0,player.guardBuff-dt);player.counterReady=Math.max(0,player.counterReady-dt);player.castAnim=Math.max(0,player.castAnim-dt*3.4);player.hurtAnim=Math.max(0,player.hurtAnim-dt*4);player.mana=Math.min(player.maxMana,player.mana+(1.8+skills.meditation.value*.04)*(1+buffValue("manaRegen")/100)*dt);player.stamina=Math.min(100,player.stamina+12*dt);if(player.regen>0){player.regen-=dt;player.health=Math.min(player.maxHealth,player.health+7*dt)}if(player.vitalShield>0)player.vitalShield=Math.max(0,player.vitalShield-dt*2);
 player.notorietyTick+=dt;if(player.notoriety>0&&player.notorietyTick>=30){player.notorietyTick=0;player.notoriety=Math.max(0,player.notoriety-1)}
 reveal();const tx=-((player.x-player.y)*TW/2),ty=-((player.x+player.y)*TH/2)+innerHeight*.16;camera.x+=(tx-camera.x)*dt*5;camera.y+=(ty-camera.y)*dt*5
}
function updateNpcs(dt){
 const night=isNight();
 npcs.forEach(n=>{
  n.phase+=dt;n.attackAnim=Math.max(0,n.attackAnim-dt*3.5);n.hurtAnim=Math.max(0,n.hurtAnim-dt*4);
  let tx=night&&shops[n.role]?n.restX:n.homeX,ty=night&&shops[n.role]?n.restY:n.homeY;
  if(n.role==="guard"){
   const hostile=enemies.filter(e=>e.alive&&regionAt(e.x,e.y).type==="city"&&dist(n,e)<9).sort((a,b)=>dist(n,a)-dist(n,b))[0]||
    (player.notoriety>=10&&regionAt(player.x,player.y).type==="city"&&dist(n,player)<9?player:null);
   if(hostile){
    n.target=hostile;tx=hostile.x;ty=hostile.y;
    if(dist(n,hostile)<1.45&&n.attackAnim<=0){n.attackAnim=1;setTimeout(()=>{if(hostile===player){if(dist(n,player)<1.8)damagePlayer(18)}else if(hostile.alive&&dist(n,hostile)<1.8)damageEnemy(hostile,26)},180)}
   }else n.target=null
  }
  const d=Math.hypot(tx-n.x,ty-n.y);
  if(d>.18){n.state="walk";n.dirX=(tx-n.x)/d;n.dirY=(ty-n.y)/d;n.x+=n.dirX*1.4*dt;n.y+=n.dirY*1.4*dt}else n.state="idle"
 })
}
function updateEnemies(dt){
 enemies.forEach(e=>{if(!e.alive){e.respawn-=dt;if(e.respawn<=0){const ne=makeEnemy(e.id,e.homeX,e.homeY,e.level);Object.assign(e,ne)}return}e.phase+=dt;e.attackCd=Math.max(0,e.attackCd-dt);e.attackAnim=Math.max(0,e.attackAnim-dt*3.5);e.hurtAnim=Math.max(0,e.hurtAnim-dt*4);const d=dist(e,player);if(d<8){e.state="walk";if(d>1.3){const dx=(player.x-e.x)/d,dy=(player.y-e.y)/d;const nx=e.x+dx*e.speed*dt,ny=e.y+dy*e.speed*dt;if(!blocked(nx,e.y))e.x=nx;if(!blocked(e.x,ny))e.y=ny}else if(e.attackCd<=0){e.attackCd=1.1;e.attackAnim=1;setTimeout(()=>{if(e.alive&&dist(e,player)<1.7)damagePlayer(e.damage)},220)}}else{const h=Math.hypot(e.homeX-e.x,e.homeY-e.y);if(h>3){e.state="walk";e.x+=(e.homeX-e.x)/h*e.speed*.5*dt;e.y+=(e.homeY-e.y)/h*e.speed*.5*dt}else e.state="idle"}})
 oreNodes.forEach(n=>{if(n.depleted){n.respawn-=dt;if(n.respawn<=0)n.depleted=false}})
 corpses.forEach(c=>c.life-=dt);for(let i=corpses.length-1;i>=0;i--)if(corpses[i].life<=0)corpses.splice(i,1)
}
function updateEffects(dt){
 for(const f of floating){f.z+=dt*12;f.life-=dt*.7}
 for(let i=floating.length-1;i>=0;i--)if(floating[i].life<=0)floating.splice(i,1);
 for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;p.vz-=12*dt;p.life-=dt}
 for(let i=particles.length-1;i>=0;i--)if(particles[i].life<=0)particles.splice(i,1);
 for(const p of projectiles){
  if(p.vx!==undefined){
   const step=p.speed*dt;p.x+=p.vx*step;p.y+=p.vy*step;p.traveled+=step;p.z=18+Math.sin(performance.now()/100)*2;p.life-=dt;
   if(blocked(p.x,p.y)||p.traveled>=p.range){p.life=0;continue}
   if(p.owner==="player"){const hit=enemies.find(e=>e.alive&&Math.hypot(e.x-p.x,e.y-p.y)<.65);if(hit){damageEnemy(hit,p.damage);p.life=0}}
  }else{
   const d=Math.hypot(p.tx-p.x,p.ty-p.y);if(d<.25){p.hit();p.life=0}else{p.x+=(p.tx-p.x)/d*p.speed*dt;p.y+=(p.ty-p.y)/d*p.speed*dt;p.z=18+Math.sin(performance.now()/100)*2;p.life-=dt}
  }
 }
 for(let i=projectiles.length-1;i>=0;i--)if(projectiles[i].life<=0)projectiles.splice(i,1)
}

function isNight(){return worldTime>.5&&worldTime<.95}
function nearestEnemy(range=2){if(targetEnemy&&targetEnemy.alive&&dist(targetEnemy,player)<=range)return targetEnemy;return enemies.filter(e=>e.alive&&dist(e,player)<=range).sort((a,b)=>dist(a,player)-dist(b,player))[0]}
function currentWeapon(){return player.equipment.mainHand}
function currentCombatSkill(){const w=currentWeapon();return w?(w.weaponSkill||"swords"):"unarmed"}
function shieldEquipped(){const s=player.equipment.offHand;return s&&s.type==="shield"?s:null}
function attack(){
 if(!battleMode)return speak("Activa el modo batalla primero.");
 if(player.attackCd>0||panelOpen())return;
 const skill=currentCombatSkill(),weapon=currentWeapon();
 if(skill==="archery"){
  const ammoIndex=player.inventory.findIndex(i=>["arrow","reinforcedArrow","silverArrow"].includes(i.id));
  if(ammoIndex<0)return speak("No tienes flechas.");
  removeAmount(ammoIndex,1);const st=equipStats(),range=st.range||14,dx=player.aimX||0,dy=player.aimY||1,l=Math.hypot(dx,dy)||1;
  player.attackCd=.72;player.attackAnim=1;
  projectiles.push({kind:"arrow",x:player.x,y:player.y,z:20,vx:dx/l,vy:dy/l,speed:13,range,traveled:0,color:"#d6c49a",life:3,damage:Math.round(rand(st.damageMin,st.damageMax)+skills.archery.value*.18),owner:"player"});
  gain("archery",.55,1);gainAttribute("dexterity",.18);return
 }
 const reach=(weapon?.stats?.range||1.8),e=(targetEnemy&&targetEnemy.alive&&dist(targetEnemy,player)<=reach?targetEnemy:nearestEnemy(reach));if(!e)return speak("No hay un enemigo al alcance.");
 const st=equipStats(),weaponSkill=skills[skill]?.value||0,min=st.damageMin+weaponSkill*.08+player.attributes.strength*.04,max=st.damageMax+weaponSkill*.13+player.attributes.strength*.07;
 const speed=weapon?.stats?.speed||80;player.attackCd=Math.max(.28,1.05-speed/150);player.attackAnim=1;
 const hitChance=clamp(.72+(st.accuracy||0)/100+skills[skill].value/500,.55,.97);if(Math.random()>hitChance){floatText(e.x,e.y,"FALLO","#d5d5d5");return}let dmg=Math.round(rand(min,max)*(1+buffValue("damagePercent")/100));const crit=clamp((st.critical||0)+skills[skill].value*.06,0,35);if(Math.random()*100<crit){dmg=Math.round(dmg*1.6);floatText(e.x,e.y,"¡CRÍTICO!","#ffd67a")}if(player.counterReady>0){dmg=Math.round(dmg*1.4);player.counterReady=0}
 setTimeout(()=>{if(e.alive&&dist(e,player)<2.1)damageEnemy(e,dmg)},150);
 gain(skill,.55,e.level);gainAttribute(skill==="fencing"?"dexterity":"strength",.16)
}
function magic(){
 if(!battleMode)return speak("Activa el modo batalla primero.");
 if(player.magicCd>0)return;if(player.mana<15)return speak("No tienes suficiente maná.");
 let dx=player.aimX||0,dy=player.aimY||1,l=Math.hypot(dx,dy)||1;dx/=l;dy/=l;
 player.mana-=15;player.magicCd=.7;player.castAnim=1;
 projectiles.push({kind:"fireball",x:player.x,y:player.y,z:20,vx:dx,vy:dy,speed:10,range:21,traveled:0,color:"#ff8c54",life:4,damage:Math.round(18+skills.magery.value*.28+skills.arcaneKnowledge.value*.18),owner:"player"});
 gain("magery",.55,1);gainAttribute("intelligence",.2)
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
 if(main==="unarmed"){const e=nearestEnemy(2);if(!e)return speak("No hay enemigo.");damageEnemy(e,level===60?36:58)}
 if(main==="fencing"){const e=nearestEnemy(2);if(!e)return speak("No hay enemigo.");if(level===60)damageEnemy(e,48);else for(let i=0;i<3;i++)setTimeout(()=>damageEnemy(e,24),i*110)}
 if(main==="archery"){if(countItem("arrow")<1)return speak("No tienes flechas.");if(level===60)attack();else enemies.filter(e=>e.alive&&dist(e,player)<10).slice(0,5).forEach(e=>damageEnemy(e,30))}
 if(main==="shieldMastery"){if(!shieldEquipped())return speak("Necesitas un escudo.");if(level===60)player.guardBuff=7;else player.counterReady=8}
 if(main==="endurance"){if(level===60)player.vitalShield=70;else player.vitalShield=180}
}
function highestCombatSkill(){return["swords","unarmed","fencing","archery","magery","healing","shieldMastery","endurance"].sort((a,b)=>skills[b].value-skills[a].value)[0]}
function damageEnemy(e,n){if(!e.alive)return;e.health-=n;e.hurtAnim=1;floatText(e.x,e.y,"-"+n,"#ffd0c4");burst(e.x,e.y,e.color,10);if(e.health<=0)killEnemy(e)}
function damagePlayer(n){
 const shield=shieldEquipped();
 if(shield&&player.stamina>=Math.max(3,shield.stats.staminaCost||6)){
  const chance=Math.min(55,2+skills.shieldMastery.value*.34+(shield.stats.block||0)+(player.guardBuff>0?15:0));
  if(Math.random()*100<chance){
   player.stamina-=shield.stats.staminaCost||6;floatText(player.x,player.y,"BLOQUEADO","#ffe59a");burst(player.x,player.y,"#f4d36f",12);gain("shieldMastery",.72,1);
   if(skills.shieldMastery.value>=80)player.counterReady=3;return
  }
 }
 if(player.vitalShield>0){const block=Math.min(player.vitalShield,n);player.vitalShield-=block;n-=block;if(n<=0){floatText(player.x,player.y,"BLOQUEADO","#a8efbf");return}}
 const def=equipStats().defense;n=Math.max(1,Math.round(n-def*.18));player.health-=n;player.hurtAnim=1;floatText(player.x,player.y,"-"+n,"#ffb0a5");
 gain("defense",.25,1);gain("endurance",.18,1);gainAttribute("strength",.06);
 if(player.health<=0){player.health=player.maxHealth;player.mana=player.maxMana;player.x=124;player.y=126;player.gold=Math.max(0,player.gold-50);player.notoriety=Math.floor(player.notoriety/2);toast("Has reaparecido en Eldoria.")}
}
function killEnemy(e){
 e.alive=false;e.respawn=120;const loot=[];
 for(const id of e.loot)if(Math.random()<.68)loot.push(enhanceItem(makeItem(id),e.level*.45));
 if(Math.random()<.22)loot.push(enhanceItem(makeItem(choice(["ring","ironSword","dagger","shortBow","leatherChest"])),e.level*.45));
 if(Math.random()<.42)loot.push(makeItem("arrow",{count:Math.floor(rand(3,12))}));
 corpses.push({name:`Cadáver de ${e.name}`,x:e.x,y:e.y,life:300,loot,gold:Math.round(rand(6,20)*e.level)});
 player.honor+=e.tag==="criminal"||e.tag==="undead"?2:0;toast(`${e.name} derrotado. Revisa su cadáver.`)
}
function totalSkills(){return Object.values(skills).reduce((n,s)=>n+s.value,0)}
function gain(id,amount,targetLevel){
 const s=skills[id];if(!s||s.state!=="up"||s.value>=100)return;
 const cap=700;if(totalSkills()>=cap){const down=Object.entries(skills).filter(([k,v])=>v.state==="down"&&v.value>0);if(!down.length)return;const [dk,ds]=down.sort((a,b)=>b[1].value-a[1].value)[0];ds.value=Math.max(0,ds.value-amount*.45)}
 const diff=Math.max(.08,1-Math.max(0,s.value-(targetLevel||1)*10)/100);s.progress+=amount*diff;
 if(s.progress>=1){s.progress-=1;s.value=Math.min(100,s.value+.1);showLevel(`${skillInfo[id].name} subió a ${s.value.toFixed(1)}`)}
}
function gainAttribute(id,amount){
 const names={strength:"Fuerza",dexterity:"Destreza",intelligence:"Inteligencia"},icons={strength:"💪",dexterity:"🏃",intelligence:"🧠"};
 if(!player.attributeProgress)player.attributeProgress={strength:0,dexterity:0,intelligence:0};
 const total=player.attributes.strength+player.attributes.dexterity+player.attributes.intelligence;
 if(player.attributes[id]>=150||total>=300)return;
 player.attributeProgress[id]+=amount;
 if(player.attributeProgress[id]>=1){
  player.attributeProgress[id]-=1;const before=player.attributes[id];player.attributes[id]=Math.min(150,player.attributes[id]+1);
  showLevel(`⬆️ ${names[id]} subió a ${player.attributes[id]}`);
  if(Math.floor(player.attributes[id]/10)>Math.floor(before/10))toast(`${icons[id]} ${names[id]} alcanzó ${player.attributes[id]}`);
  derived()
 }
}
function floatText(x,y,text,color){floating.push({x,y,z:32,text,color,life:1})}
function burst(x,y,color,count){for(let i=0;i<count;i++)particles.push({x,y,z:15,vx:rand(-1.5,1.5),vy:rand(-1.5,1.5),vz:rand(3,9),life:rand(.4,.9),color})}
function speak(t){toast(t)}
function toast(t){const d=document.createElement("div");d.className="toast";d.textContent=t;$("toastArea").appendChild(d);setTimeout(()=>d.remove(),2800)}
function showLevel(t){const d=$("levelBanner");d.textContent=t;d.classList.remove("hidden");d.style.animation="none";void d.offsetWidth;d.style.animation="banner 2.7s both";setTimeout(()=>d.classList.add("hidden"),2800)}

function toggleBattleMode(){
 battleMode=!battleMode;const b=$("battleModeButton");
 b.innerHTML=battleMode?"<span>⚔️</span><small>Batalla</small>":"<span>🛡️</span><small>Paz</small>";
 b.classList.toggle("battle-active",battleMode);document.querySelectorAll(".combat-only").forEach(x=>x.classList.toggle("hidden",!battleMode));
 $("specialButtons").style.display=battleMode?"flex":"none";$("spellQuickbar").style.display=battleMode?"flex":"none";
 toast(battleMode?"Modo batalla activado.":"Modo paz activado.");updateSpecialButtons()
}
function updateSpecialButtons(){const main=highestCombatSkill(),name=skillInfo[main].name;[60,80].forEach(l=>{const b=$(l===60?"special60":"special80"),ok=skills[main].value>=l;b.classList.toggle("locked",!ok);b.querySelector("span").textContent=l;b.querySelector("small").textContent=ok?specialName(main,l):`${name} ${l}`})}
function specialName(skill,l){return({swords:{60:"Golpe poderoso",80:"Ignorar armadura"},magery:{60:"Nova de hielo",80:"Cadena eléctrica"},healing:{60:"Regeneración",80:"Escudo vital"},unarmed:{60:"Golpe aturdidor",80:"Llave de combate"},fencing:{60:"Estocada precisa",80:"Danza de cuchillas"},archery:{60:"Disparo perforante",80:"Lluvia de flechas"},shieldMastery:{60:"Guardia firme",80:"Contraataque"},endurance:{60:"Guardia férrea",80:"Fortaleza"}})[skill]?.[l]||"Especial"}

function nearbyNpc(){return npcs.filter(n=>dist(n,player)<2).sort((a,b)=>dist(a,player)-dist(b,player))[0]}
function nearbyOre(){return oreNodes.filter(n=>!n.depleted&&dist(n,player)<1.8).sort((a,b)=>dist(a,player)-dist(b,player))[0]}
function interact(){if(panelOpen())return;const ore=nearbyOre();if(ore)return mine(ore);const n=nearbyNpc();if(n)return openDialogue(n);const c=corpses.filter(c=>dist(c,player)<1.8)[0];if(c)return openLoot(c);speak("No hay nada para usar cerca.")}
function mine(node){if(!player.inventory.some(i=>i.id==="pickaxe"))return speak("Necesitas un pico.");if(skills.mining.value<node.required)return speak(`Requiere Minería ${node.required}.`);node.depleted=true;node.respawn=45;const amount=Math.random()<.25?2:1;addItem(makeItem(node.id,{count:amount}));gain("mining",.85,Math.max(1,node.required/15));burst(node.x,node.y,"#ddd",12);toast(`Obtuviste ${amount} ${itemDefs[node.id].name}.`)}
function openLoot(corpse){selectedLootCorpse=corpse;selectedLootIndex=-1;openPanel("lootPanel");renderLoot()}
function lootEntries(c){const arr=[...(c.loot||[])];if(c.gold>0)arr.unshift({id:"gold",uid:"gold",name:"Oro",icon:"🪙",type:"currency",count:c.gold,stack:true,value:1,rarity:"common",desc:"Monedas de oro."});return arr}
function renderLoot(){
 const c=selectedLootCorpse,g=$("lootGrid");g.innerHTML="";if(!c)return;$("lootTitle").textContent=c.name||"Cadáver";
 const entries=lootEntries(c);entries.forEach((it,i)=>{const b=document.createElement("button");b.className="item-card"+(selectedLootIndex===i?" selected":"");b.innerHTML=`<span>${it.icon}</span><small class="rarity-${it.rarity||"common"}">${it.name}</small>${it.count>1?`<b class="stack">×${it.count}</b>`:""}`;b.onclick=()=>{selectedLootIndex=i;renderLoot();renderLootDetails(it,i)};g.appendChild(b)});
 $("lootSummary").textContent=`${entries.length} tipo(s) de objeto`;if(!entries.length)$("lootDetails").innerHTML="<h3>Cadáver vacío</h3>"
}
function renderLootDetails(it,index){$("lootDetails").innerHTML=(it.id==="gold"?`<h3>🪙 Oro</h3><p>${it.count} monedas.</p>`:itemHtml(it))+`<div class="actions"><button id="takeLoot">Recoger</button><button id="takeAllLoot">Recoger todo</button></div>`;$("takeLoot").onclick=()=>takeLoot(index);$("takeAllLoot").onclick=takeAllLoot}
function takeLoot(index){
 const c=selectedLootCorpse,entries=lootEntries(c),it=entries[index];if(!it)return;
 if(it.id==="gold"){player.gold+=c.gold;c.gold=0}else{const offset=c.gold>0?1:0,obj=c.loot[index-offset];if(!addItem(obj))return toast("Inventario lleno.");c.loot.splice(index-offset,1)}
 selectedLootIndex=-1;renderLoot()
}
function takeAllLoot(){const c=selectedLootCorpse;if(c.gold>0){player.gold+=c.gold;c.gold=0}for(let i=c.loot.length-1;i>=0;i--)if(addItem(c.loot[i]))c.loot.splice(i,1);renderLoot()}
function openDialogue(n){closePanels();$("dialoguePanel").classList.remove("hidden");$("dialogueName").textContent=n.name;$("dialogueText").textContent=n.greeting;const box=$("dialogueOptions");box.innerHTML="";const add=(t,fn)=>{const b=document.createElement("button");b.textContent=t;b.onclick=fn;box.appendChild(b)};if(shops[n.role]){if(isNight()){add("Está descansando",()=>toast("Vuelve durante el día."))}else{add("Comprar",()=>openShop(n.role,"buy"));add("Vender",()=>openShop(n.role,"sell"))}}if(n.role==="bank")add("Abrir banco",()=>toast("El banco avanzado llegará en una revisión posterior."));add("Salir",closePanels)}
function openShop(role,mode){currentShop=role;currentShopMode=mode;selectedShop=-1;closePanels();$("shopPanel").classList.remove("hidden");$("shopTitle").textContent=shops[role].name;renderShop()}
function renderShop(){const list=$("shopList");list.innerHTML="";$("shopBuyTab").classList.toggle("active",currentShopMode==="buy");$("shopSellTab").classList.toggle("active",currentShopMode==="sell");const arr=currentShopMode==="buy"?shops[currentShop].items.map(id=>makeItem(id)):player.inventory;arr.forEach((it,i)=>{const r=document.createElement("button");r.className="list-row"+(selectedShop===i?" selected":"");const price=currentShopMode==="buy"?it.value:Math.floor(it.value*.45);r.innerHTML=`<span>${it.icon}</span><div><strong class="rarity-${it.rarity}">${it.name}</strong><small>${it.type}</small></div><b>${price} oro</b>`;r.onclick=()=>{selectedShop=i;renderShop();$("shopDetails").innerHTML=itemHtml(it)+`<div class="actions"><button id="shopAction">${currentShopMode==="buy"?"Comprar":"Vender"}</button></div>`;$("shopAction").onclick=()=>shopAction(i,it,price)};list.appendChild(r)})}
function shopAction(i,it,price){if(currentShopMode==="buy"){if(player.gold<price)return toast("No tienes suficiente oro.");player.gold-=price;addItem(makeItem(it.id));toast("Objeto comprado.")}else{removeAmount(i,1);player.gold+=price;toast("Objeto vendido.")}selectedShop=-1;renderShop()}

function openPanel(id){closePanels();$(id).classList.remove("hidden");paused=true}
function closePanels(){document.querySelectorAll(".overlay").forEach(x=>x.classList.add("hidden"));paused=false}
function panelOpen(){return ![...document.querySelectorAll(".overlay")].every(x=>x.classList.contains("hidden"))}
document.querySelectorAll("[data-close]").forEach(b=>b.onclick=closePanels);

function renderInventory(){const g=$("inventoryGrid");g.innerHTML="";player.inventory.forEach((it,i)=>{const b=document.createElement("button");b.className="item-card"+(selectedInventory===i?" selected":"");b.innerHTML=`<span>${it.icon}</span><small class="rarity-${it.rarity}">${it.name}</small>${it.stack&&it.count>1?`<b class="stack">×${it.count}</b>`:""}`;b.onclick=()=>{selectedInventory=i;renderInventory();renderInventoryDetails(it,i)};g.appendChild(b)});$("inventoryCapacity").textContent=`${player.inventory.length} / 36 espacios`;$("inventoryGold").textContent=`${player.gold} oro`;$("potionCount").textContent=countItem("potion")}
function renderInventoryDetails(it,i){let actions="";if(it.slot)actions+=`<button id="equipSelected">Equipar</button>`;if(it.type==="consumable")actions+=`<button id="useSelected">Usar</button>`;if(it.type==="scroll")actions+=`<button id="learnSelected">Añadir al spellbook</button>`;if(it.type==="material")actions+=`<button id="recipesSelected">Ver recetas</button>`;actions+=`<button id="dropSelected" class="danger">Soltar</button>`;$("inventoryDetails").innerHTML=itemHtml(it)+`<div class="actions">${actions}</div>`;if($("equipSelected"))$("equipSelected").onclick=()=>equipFromInventory(i);if($("useSelected"))$("useSelected").onclick=()=>{it.id==="potion"?potion():toast("Objeto usado.");renderInventory()};if($("learnSelected"))$("learnSelected").onclick=()=>learnScroll(i);if($("recipesSelected"))$("recipesSelected").onclick=()=>{$("craftButton").click()};$("dropSelected").onclick=()=>{const dropped=removeAmount(i,1);if(dropped)dropToGround(dropped);selectedInventory=-1;renderInventory();$("inventoryDetails").innerHTML="<h3>Selecciona un objeto</h3>"}}
function equipFromInventory(i){const it=player.inventory[i];if(!it.slot)return;const old=player.equipment[it.slot];player.equipment[it.slot]=player.inventory.splice(i,1)[0];
 if(it.twoHanded&&player.equipment.offHand){addItem(player.equipment.offHand);player.equipment.offHand=null}
 if(it.type==="shield"&&player.equipment.mainHand?.twoHanded){addItem(player.equipment.mainHand);player.equipment.mainHand=null}
 if(old)addItem(old);selectedInventory=-1;derived();renderInventory();toast(`${it.name} equipado.`)}
function renderEquipment(){const slots={head:"Cabeza",chest:"Pecho",arms:"Brazos",gloves:"Guantes",legs:"Piernas",boots:"Botas",mainHand:"Arma",offHand:"Grimorio/Escudo",robe:"Túnica",cloak:"Capa",ring:"Anillo"};const g=$("equipmentSlots");g.innerHTML="";Object.entries(slots).forEach(([slot,label])=>{const it=player.equipment[slot],b=document.createElement("button");b.className="equipment-slot"+(selectedEquipment===slot?" selected":"");b.innerHTML=`<span>${it?it.icon:"＋"}</span><small>${label}</small>`;b.onclick=()=>{selectedEquipment=slot;renderEquipment();renderEquipmentDetails(slot,it)};g.appendChild(b)})}
function renderEquipmentDetails(slot,it){if(!it){$("equipmentDetails").innerHTML="<h3>Espacio vacío</h3><p>Equipa un objeto desde el inventario.</p>";return}$("equipmentDetails").innerHTML=itemHtml(it)+`<div class="actions"><button id="unequipSelected">Desequipar</button><button id="dropEquipped" class="danger">Soltar</button></div>`;$("unequipSelected").onclick=()=>{if(player.inventory.length>=36)return toast("Inventario lleno.");addItem(it);player.equipment[slot]=null;derived();renderEquipment();renderEquipmentDetails(slot,null)};$("dropEquipped").onclick=()=>{dropToGround(it);player.equipment[slot]=null;derived();renderEquipment();renderEquipmentDetails(slot,null)}}
function renderSkills(){const list=$("skillsList");list.innerHTML="";Object.entries(skills).forEach(([id,s])=>{const b=document.createElement("button");b.className="list-row"+(selectedSkill===id?" selected":"");b.innerHTML=`<span>◆</span><div><strong>${skillInfo[id].name}</strong><small>${s.value.toFixed(1)} / 100</small><div class="skill-progress"><i style="width:${s.value}%"></i></div></div><b>${rank(s.value)}</b>`;b.onclick=()=>{selectedSkill=id;renderSkills();$("skillDetails").innerHTML=`<h3>${skillInfo[id].name}</h3><div class="stat"><span>Nivel</span><strong>${s.value.toFixed(1)} / 100</strong></div><div class="stat"><span>Rango</span><strong>${rank(s.value)}</strong></div><p>${skillInfo[id].desc}</p><h3>Cómo subirla</h3><p>${skillInfo[id].how}</p><h3>Desbloqueos</h3><p>${skillInfo[id].unlock}</p>`};list.appendChild(b)})}
function rank(v){return v>=100?"Gran maestro":v>=80?"Maestro":v>=60?"Experto":v>=40?"Competente":v>=20?"Aprendiz":"Novato"}

function renderCraftTree(){const tree=$("craftTree");tree.innerHTML="";const professions=[["tailoring","🧵 Confección"],["blacksmithing","🔨 Herrería"]];professions.forEach(([p,label])=>{const head=document.createElement("button");head.className="tree-button parent";head.textContent=label;head.onclick=()=>{tree.querySelectorAll(`[data-prof="${p}"]`).forEach(x=>x.classList.toggle("hidden"))};tree.appendChild(head);craftGroups.filter(g=>g.profession===p).forEach(g=>{const b=document.createElement("button");b.className="tree-button tree-child";b.dataset.prof=p;b.textContent=g.name;b.onclick=()=>{selectedCraftGroup=g.id;selectedCraftRecipe=null;renderCraftTree();renderCraftRecipes(g)};if(selectedCraftGroup===g.id)b.classList.add("selected");tree.appendChild(b)})})}
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

function renderSettings(tab="options"){document.querySelectorAll("[data-settings-tab]").forEach(b=>b.classList.toggle("active",b.dataset.settingsTab===tab));const c=$("settingsContent");if(tab==="options"){c.innerHTML=`<div class="setting-row"><span>Sonido</span><button id="soundToggle">${settings.sound?"Activado":"Silenciado"}</button></div><div class="setting-row"><span>Calidad gráfica</span><select id="qualitySelect"><option value="high">Alta</option><option value="medium">Media</option><option value="low">Baja</option></select></div><div class="setting-row"><span>Mostrar nombres</span><button id="namesToggle">${settings.showNames?"Sí":"No"}</button></div><div class="setting-row"><span>Mostrar barras de vida</span><button id="barsToggle">${settings.showBars?"Sí":"No"}</button></div><div class="setting-row"><span>Controles PC</span><strong>WASD · Espacio · F · Q · E · R · 1–4 · Z/X</strong></div><div class="setting-row"><span>Versión</span><strong>Proyecto Ultra V4.2 Consolidada</strong></div><div class="setting-row"><span>Partida</span><button id="resetGame" class="danger">Reiniciar partida</button></div>`;$("qualitySelect").value=settings.quality;$("soundToggle").onclick=()=>{settings.sound=!settings.sound;renderSettings("options")};$("qualitySelect").onchange=e=>settings.quality=e.target.value;$("namesToggle").onclick=()=>{settings.showNames=!settings.showNames;renderSettings("options")};$("barsToggle").onclick=()=>{settings.showBars=!settings.showBars;renderSettings("options")};$("resetGame").onclick=()=>openPanel("confirmReset")}else{const data=tab==="bestiary"?Object.values(enemyDefs).map(e=>({name:e.name,icon:e.body==="beast"?"🐺":e.body==="undead"?"💀":"👤",lines:[`Vida base: ${e.health}`,`Daño base: ${e.damage}`,`Loot: ${e.loot.map(i=>itemDefs[i]?.name).join(", ")}`]})):tab==="weapons"?Object.values(itemDefs).filter(i=>i.type==="weapon").map(i=>({name:i.name,icon:i.icon,lines:[i.desc,...Object.entries(i.stats||{}).map(([k,v])=>`${statName(k)}: ${v}`)]})):tab==="armor"?Object.values(itemDefs).filter(i=>i.type==="armor"||i.type==="cloth").map(i=>({name:i.name,icon:i.icon,lines:[i.desc,...Object.entries(i.stats||{}).map(([k,v])=>`${statName(k)}: ${v}`)]})):Object.values(itemDefs).filter(i=>i.type==="material").map(i=>({name:i.name,icon:i.icon,lines:[i.desc,`Valor: ${i.value}`]}));c.innerHTML=`<div class="compendium-grid">${data.map(d=>`<article class="compendium-card"><h4>${d.icon} ${d.name}</h4>${d.lines.map(l=>`<p>${l}</p>`).join("")}</article>`).join("")}</div>`}}
document.querySelectorAll("[data-settings-tab]").forEach(b=>b.onclick=()=>renderSettings(b.dataset.settingsTab));

function updateHud(){derived();$("healthBar").style.width=`${player.health/player.maxHealth*100}%`;$("manaBar").style.width=`${player.mana/player.maxMana*100}%`;$("staminaBar").style.width=`${player.stamina}%`;$("healthText").textContent=`${Math.round(player.health)} / ${Math.round(player.maxHealth)}`;$("manaText").textContent=`${Math.round(player.mana)} / ${Math.round(player.maxMana)}`;$("staminaText").textContent=`${Math.round(player.stamina)} / 100`;$("criminalIcon").textContent=player.notoriety>=10?"💀":"";const r=regionAt(player.x,player.y),hour=Math.floor(worldTime*24),min=Math.floor((worldTime*24-hour)*60);$("zoneName").textContent=`${isNight()?"🌙":"☀️"} ${r.name}`;$("worldClock").textContent=`${String(hour).padStart(2,"0")}:${String(min).padStart(2,"0")}`;$("potionCount").textContent=countItem("potion");const n=nearbyNpc(),o=nearbyOre();let hint=o?`Minar ${itemDefs[o.id].name}`:n?(shops[n.role]?`${isNight()?"Hablar con":"Comerciar con"} ${n.name}`:`Hablar con ${n.name}`):"";$("interactionHint").classList.toggle("hidden",!hint);$("interactionHint").textContent=hint;updateSpecialButtons()}
function save(){localStorage.setItem(SAVE_KEY,JSON.stringify({version:4.1,player:{...player},skills,worldTime,battleMode,explored:[...explored],settings}))}
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

/* ===== V4.2 CONSOLIDADA: CORRECCIONES Y SISTEMAS UNIFICADOS ===== */
craftGroups.push(
 {id:"smith-steel",profession:"blacksmithing",name:"Acero",material:"steelIngot",recipes:[["Lingote de acero","steelIngot",{ironIngot:1,steelOre:1},35,1],["Espada de acero","steelSword",{steelIngot:7},45,1],["Pechera de acero","steelChest",{steelIngot:14},60,1]]},
 {id:"tailor-hardened",profession:"tailoring",name:"Cuero endurecido",material:"hardenedLeather",recipes:[["Pechera endurecida","hardenedChest",{hardenedLeather:10},30,1]]},
 {id:"tailor-scaled",profession:"tailoring",name:"Cuero escamado",material:"scaledLeather",recipes:[["Pechera escamada","scaledChest",{scaledLeather:10},50,1]]},
 {id:"tailor-monstrous",profession:"tailoring",name:"Cuero monstruoso",material:"monstrousLeather",recipes:[["Pechera monstruosa","monstrousChest",{monstrousLeather:11},70,1]]}
);

let equipmentFilter="all",selectedEquipInventory=-1,selectedBankSide=null,selectedBankIndex=-1;
const SLOT_LABELS={head:"Cabeza",neck:"Cuello",chest:"Pecho",arms:"Brazos",gloves:"Guantes",legs:"Piernas",boots:"Botas",mainHand:"Arma",offHand:"Escudo / Grimorio",robe:"Túnica",cloak:"Capa",ring1:"Anillo I",ring2:"Anillo II"};
function migratePlayer(){
 player.equipment=player.equipment||{};if(player.equipment.ring&&!player.equipment.ring1)player.equipment.ring1=player.equipment.ring;delete player.equipment.ring;
 Object.keys(SLOT_LABELS).forEach(k=>{if(!(k in player.equipment))player.equipment[k]=null});
 Object.values(player.equipment).filter(Boolean).forEach(it=>discovered.items.add(it.id));player.inventory.forEach(it=>discovered.items.add(it.id));
 Object.keys(skills).forEach(k=>{if(!skills[k].state)skills[k].state="up"})
}
function slotForItem(it){if(it.slot==="ring")return player.equipment.ring1?"ring2":"ring1";return it.slot}
function dropToGround(it){groundItems.push({item:it,x:player.x+.35,y:player.y+.2,life:600});toast(`${it.name} quedó en el suelo.`)}
function nearbyGround(){return groundItems.find(g=>Math.hypot(g.x-player.x,g.y-player.y)<1.6)}
const originalInteract=interact;interact=function(){if(panelOpen())return;const g=nearbyGround();if(g){if(addItem(g.item)){groundItems.splice(groundItems.indexOf(g),1);discovered.items.add(g.item.id);toast(`${g.item.name} recogido.`)}else toast("Inventario lleno.");return}return originalInteract()};
const originalAddItem=addItem;addItem=function(it){const ok=originalAddItem(it);if(ok)discovered.items.add(it.id);return ok};
const originalDamageEnemy=damageEnemy;damageEnemy=function(e,n){targetEnemy=e;discovered.enemies.add(e.type);return originalDamageEnemy(e,n)};
const originalRegionAt=regionAt;regionAt=function(x,y){const r=originalRegionAt(x,y);if(r.name)discovered.regions.add(r.name);return r};
function getFacing(e){const x=e.dirX||e.aimX||0,y=e.dirY||e.aimY||1;if(Math.abs(x)>Math.abs(y))return x>0?"right":"left";return y>0?"down":"up"}
function drawPaperDoll(canvasEl){
 if(!canvasEl)return;const c=canvasEl.getContext("2d"),w=canvasEl.width,h=canvasEl.height;c.clearRect(0,0,w,h);c.save();c.translate(w/2,h*.78);c.scale(2.25,2.25);drawDollShape(c,player,"down",true);c.restore();
 c.textAlign="center";c.fillStyle="#d8c37e";c.font="14px Georgia";c.fillText(player.name,w/2,25)
}
function drawDollShape(c,e,facing,isPlayer){
 const moving=e.state==="walk",phase=e.walkPhase||e.phase||0,step=moving?Math.sin(phase*8):0,bob=moving?Math.abs(step)*2:Math.sin(performance.now()/800+phase)*.5;
 const attack=e.attackAnim||0,cast=e.castAnim||0,back=facing==="up",side=facing==="left"||facing==="right",flip=facing==="left"?-1:1;
 const eq=isPlayer?player.equipment:{};c.save();c.scale(flip,1);c.fillStyle="#0006";c.beginPath();c.ellipse(0,4,12,4,0,0,Math.PI*2);c.fill();
 const armor=eq.chest?.id?.includes("mithril")?"#83c5d1":eq.chest?.id?.includes("dragon")?"#7b3340":isPlayer?"#8c3c34":e.color||"#65717a";
 c.strokeStyle="#292526";c.lineWidth=5;c.beginPath();if(side){c.moveTo(-2,-12+bob);c.lineTo(-4+step*5,0);c.moveTo(3,-12+bob);c.lineTo(5-step*5,0)}else{c.moveTo(-4,-12+bob);c.lineTo(-5+step*5,-1);c.moveTo(4,-12+bob);c.lineTo(5-step*5,-1)}c.stroke();
 if(eq.cloak||back){c.fillStyle=eq.cloak?"#41304d":"#433039";c.beginPath();c.moveTo(0,-36+bob);c.lineTo(13,-10+bob);c.lineTo(-13,-10+bob);c.closePath();c.fill()}
 c.fillStyle=armor;c.beginPath();if(side){c.moveTo(-2,-36+bob);c.lineTo(8,-14+bob);c.lineTo(-7,-14+bob)}else{c.moveTo(0,-36+bob);c.lineTo(11,-13+bob);c.lineTo(-11,-13+bob)}c.closePath();c.fill();
 let arm=step*4;if(attack>0)arm=-17*Math.sin((1-attack)*Math.PI);c.strokeStyle=armor;c.lineWidth=5;c.beginPath();if(side){c.moveTo(2,-30+bob);c.lineTo(13+arm,-16+bob);c.moveTo(-2,-29+bob);c.lineTo(-8-arm*.3,-17+bob)}else{c.moveTo(-8,-30+bob);c.lineTo(-14-arm,-15+bob);c.moveTo(8,-30+bob);c.lineTo(14+arm,-15+bob)}c.stroke();
 c.fillStyle="#c59673";c.beginPath();c.arc(side?2:0,-42+bob,6,0,Math.PI*2);c.fill();c.fillStyle="#342326";if(back)c.fillRect(-6,-47+bob,12,7);else if(side)c.fillRect(-2,-48+bob,8,4);else c.fillRect(-5,-48+bob,10,3);
 const weapon=eq.mainHand||e.weapon;if(weapon){c.save();c.translate(side?14+arm:14+arm,-17+bob);c.rotate(attack>0?-1.7+(1-attack)*2.7:-.55);c.strokeStyle=weapon.weaponSkill==="axes"?"#b0b6b8":weapon.weaponSkill==="maces"?"#8c9397":"#d3d6da";c.lineWidth=3;c.beginPath();c.moveTo(0,2);c.lineTo(0,-21);c.stroke();if(weapon.weaponSkill==="archery"){c.beginPath();c.arc(-2,-10,7,-1.2,1.2);c.stroke()}c.restore()}
 if(eq.offHand?.type==="shield"){c.fillStyle="#586d78";c.strokeStyle="#d7c178";c.lineWidth=1.5;c.beginPath();c.arc(side?-8:-15,-19+bob,8,0,Math.PI*2);c.fill();c.stroke()}
 if(cast>0){c.fillStyle="#72b7ff";c.globalAlpha=cast;c.beginPath();c.arc(side?14:-15,-17+bob,5+3*Math.sin(cast*10),0,Math.PI*2);c.fill();c.globalAlpha=1}c.restore()
}
drawHumanoid=function(e,isPlayer=false){const p=screen(e.x,e.y),facing=getFacing(e);ctx.save();ctx.translate(p.x,p.y);if((e.hurtAnim||0)>0)ctx.rotate(Math.sin(e.hurtAnim*18)*.07);drawDollShape(ctx,e,facing,isPlayer);ctx.restore();if(settings.showNames&&!isPlayer){ctx.textAlign="center";ctx.font="bold 9px Arial";ctx.fillStyle=e.role==="guard"?"#77b5f2":shops[e.role]?"#efd074":"#93c0e5";ctx.fillText(e.name,p.x,p.y-58)}};
const oldDrawEffects=drawEffects;drawEffects=function(){
 floating.forEach(f=>{const p=screen(f.x,f.y,f.z);ctx.globalAlpha=f.life;ctx.fillStyle=f.color;ctx.textAlign="center";ctx.font="bold 11px Arial";ctx.fillText(f.text,p.x,p.y);ctx.globalAlpha=1});particles.forEach(p=>{const s=screen(p.x,p.y,p.z);ctx.globalAlpha=p.life;ctx.fillStyle=p.color;ctx.fillRect(s.x,s.y,2,2);ctx.globalAlpha=1});projectiles.forEach(p=>{const s=screen(p.x,p.y,p.z);if(p.kind==="fireball"){ctx.globalAlpha=.28;ctx.fillStyle="#ff7a3d";ctx.beginPath();ctx.arc(s.x-(p.vx||0)*8,s.y-(p.vy||0)*4,8,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1}ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(s.x,s.y,p.kind==="arrow"?2:5,0,Math.PI*2);ctx.fill()});
 groundItems.forEach(g=>{const p=screen(g.x,g.y);ctx.fillStyle=rarity[g.item.rarity||"common"].color;ctx.globalAlpha=.55+.3*Math.sin(performance.now()/350);ctx.beginPath();ctx.arc(p.x,p.y-5,7,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;ctx.font="13px Arial";ctx.textAlign="center";ctx.fillText(g.item.icon,p.x,p.y-8)})
};
const oldUpdateEffects=updateEffects;updateEffects=function(dt){oldUpdateEffects(dt);for(let i=groundItems.length-1;i>=0;i--){groundItems[i].life-=dt;if(groundItems[i].life<=0)groundItems.splice(i,1)}};
function equipmentItems(){return player.inventory.map((it,i)=>({it,i})).filter(({it})=>equipmentFilter==="all"||(equipmentFilter==="equipment"?!!it.slot:it.type===equipmentFilter))}
renderEquipment=function(){
 const g=$("equipmentSlots");g.innerHTML="";Object.entries(SLOT_LABELS).forEach(([slot,label])=>{const it=player.equipment[slot],b=document.createElement("button");b.className="equipment-slot"+(selectedEquipment===slot?" selected":"");b.dataset.slot=slot;b.innerHTML=`<span>${it?it.icon:"＋"}</span><small>${label}</small>`;b.onclick=()=>{selectedEquipment=slot;selectedEquipInventory=-1;renderEquipment();renderEquipmentDetails(slot,it)};g.appendChild(b)});
 const inv=$("equipmentInventoryGrid");inv.innerHTML="";equipmentItems().forEach(({it,i})=>{const b=document.createElement("button");b.className="item-card"+(selectedEquipInventory===i?" selected":"");b.innerHTML=`<span>${it.icon}</span><small class="rarity-${it.rarity}">${it.name}</small>${it.count>1?`<b class="stack">×${it.count}</b>`:""}`;b.onclick=()=>{selectedEquipInventory=i;selectedEquipment=null;renderEquipment();renderEquipInventoryDetails(it,i)};inv.appendChild(b)});
 $("equipmentCapacity").textContent=`${player.inventory.length} / 36 espacios`;$("equipmentGold").textContent=`${player.gold} oro`;const st=equipStats();$("characterStats").innerHTML=`<span>⚔ ${Math.round(st.damageMin)}–${Math.round(st.damageMax)}</span><span>🛡 ${Math.round(st.defense)}</span><span>✨ ${Math.round(st.magicResistance||0)}</span>`;drawPaperDoll($("paperDollCanvas"))
}
function comparisonHtml(it){const slot=slotForItem(it),old=player.equipment[slot];if(!old)return"";const keys=new Set([...Object.keys(old.stats||{}),...Object.keys(it.stats||{})]);let h='<h3>Comparación</h3>';keys.forEach(k=>{const d=(it.stats?.[k]||0)-(old.stats?.[k]||0);h+=`<div class="stat"><span>${statName(k)}</span><strong class="${d>=0?'rarity-uncommon':'rarity-common'}">${d>=0?'+':''}${d}</strong></div>`});return h}
function renderEquipInventoryDetails(it,i){$("equipmentDetails").innerHTML=itemHtml(it)+comparisonHtml(it)+`<div class="actions">${it.slot?'<button id="equipFromDoll">Equipar</button>':''}${it.type==="consumable"?'<button id="useFromDoll">Usar</button>':''}<button id="dropFromDoll" class="danger">Soltar</button></div>`;if($("equipFromDoll"))$("equipFromDoll").onclick=()=>{equipFromInventory(i);selectedEquipInventory=-1;renderEquipment()};if($("useFromDoll"))$("useFromDoll").onclick=()=>{it.id==="potion"?potion():toast("Objeto usado.");renderEquipment()};$("dropFromDoll").onclick=()=>{const d=removeAmount(i,1);if(d)dropToGround(d);selectedEquipInventory=-1;renderEquipment()}}
renderEquipmentDetails=function(slot,it){if(!it){$("equipmentDetails").innerHTML=`<h3>${SLOT_LABELS[slot]}</h3><p>Espacio vacío. Selecciona un objeto compatible de la mochila.</p>`;return}$("equipmentDetails").innerHTML=itemHtml(it)+`<div class="actions"><button id="unequipSelected">Desequipar</button><button id="dropEquipped" class="danger">Soltar</button></div>`;$("unequipSelected").onclick=()=>{if(player.inventory.length>=36)return toast("Inventario lleno.");addItem(it);player.equipment[slot]=null;derived();renderEquipment();renderEquipmentDetails(slot,null)};$("dropEquipped").onclick=()=>{dropToGround(it);player.equipment[slot]=null;derived();renderEquipment();renderEquipmentDetails(slot,null)}};
equipFromInventory=function(i){const it=player.inventory[i];if(!it?.slot)return;const slot=slotForItem(it),old=player.equipment[slot];player.equipment[slot]=player.inventory.splice(i,1)[0];player.equipment[slot].slot=slot;if(it.twoHanded&&player.equipment.offHand){addItem(player.equipment.offHand);player.equipment.offHand=null}if(it.type==="shield"&&player.equipment.mainHand?.twoHanded){addItem(player.equipment.mainHand);player.equipment.mainHand=null}if(old)addItem(old);derived();renderInventory();renderEquipment();toast(`${it.name} equipado.`)};
renderSkills=function(){const list=$("skillsList");list.innerHTML=`<div class="skill-cap-line"><span>Total de habilidades</span><strong>${totalSkills().toFixed(1)} / 700</strong></div>`;Object.entries(skills).sort((a,b)=>skillInfo[a[0]].group.localeCompare(skillInfo[b[0]].group)||skillInfo[a[0]].name.localeCompare(skillInfo[b[0]].name)).forEach(([id,s])=>{const b=document.createElement("button");b.className="list-row"+(selectedSkill===id?" selected":"");b.innerHTML=`<span>◆</span><div><strong>${skillInfo[id].name}</strong><small>${skillInfo[id].group} · ${s.value.toFixed(1)} / 100</small><div class="skill-progress"><i style="width:${s.value}%"></i></div></div><div><b>${rank(s.value)}</b><div class="skill-state"><button data-state="up" class="${s.state==='up'?'active':''}">↑</button><button data-state="lock" class="${s.state==='lock'?'active':''}">◆</button><button data-state="down" class="${s.state==='down'?'active':''}">↓</button></div></div>`;b.onclick=e=>{const state=e.target.dataset.state;if(state){e.stopPropagation();s.state=state;renderSkills();return}selectedSkill=id;renderSkills();$("skillDetails").innerHTML=`<h3>${skillInfo[id].name}</h3><div class="stat"><span>Nivel</span><strong>${s.value.toFixed(1)} / 100</strong></div><div class="stat"><span>Rango</span><strong>${rank(s.value)}</strong></div><div class="stat"><span>Estado</span><strong>${s.state==='up'?'Subir':s.state==='down'?'Bajar':'Mantener'}</strong></div><p>${skillInfo[id].desc}</p><h3>Cómo subirla</h3><p>${skillInfo[id].how}</p><h3>Desbloqueos</h3><p>${skillInfo[id].unlock}</p>`};list.appendChild(b)})};
function openBank(){openPanel("bankPanel");renderBank()}
function renderBank(){const a=$("bankInventory"),b=$("bankStorage");a.innerHTML=b.innerHTML="";player.inventory.forEach((it,i)=>a.appendChild(bankCard(it,"inventory",i)));bank.forEach((it,i)=>b.appendChild(bankCard(it,"bank",i)));$("bankDetails").innerHTML="<h3>Selecciona un objeto</h3>"}
function bankCard(it,side,i){const el=document.createElement("button");el.className="item-card"+(selectedBankSide===side&&selectedBankIndex===i?" selected":"");el.innerHTML=`<span>${it.icon}</span><small>${it.name}</small>${it.count>1?`<b class="stack">×${it.count}</b>`:""}`;el.onclick=()=>{selectedBankSide=side;selectedBankIndex=i;renderBank();$("bankDetails").innerHTML=itemHtml(it)+`<div class="actions"><button id="bankMove">${side==='inventory'?'Guardar':'Retirar'}</button></div>`;$("bankMove").onclick=()=>moveBank(side,i)};return el}
function moveBank(side,i){if(side==="inventory"){const it=player.inventory.splice(i,1)[0];bank.push(it)}else{if(player.inventory.length>=36)return toast("Inventario lleno.");player.inventory.push(bank.splice(i,1)[0])}selectedBankIndex=-1;renderBank()}
const oldOpenDialogue=openDialogue;openDialogue=function(n){if(n.role==="bank"&&!isNight())return openBank();return oldOpenDialogue(n)};
renderSettings=function(tab="options"){
 document.querySelectorAll("[data-settings-tab]").forEach(b=>b.classList.toggle("active",b.dataset.settingsTab===tab));const c=$("settingsContent");if(tab==="options"){c.innerHTML=`<div class="setting-row"><span>Sonido</span><button id="soundToggle">${settings.sound?"Activado":"Silenciado"}</button></div><div class="setting-row"><span>Calidad gráfica</span><select id="qualitySelect"><option value="high">Alta</option><option value="medium">Media</option><option value="low">Baja</option></select></div><div class="setting-row"><span>Mostrar nombres</span><button id="namesToggle">${settings.showNames?"Sí":"No"}</button></div><div class="setting-row"><span>Mostrar barras de vida</span><button id="barsToggle">${settings.showBars?"Sí":"No"}</button></div><div class="setting-row"><span>Controles PC</span><strong>WASD · Espacio · F · Q · E · R · 1–4 · Z/X</strong></div><div class="setting-row"><span>Versión</span><strong>Proyecto Ultra V4.2 Consolidada</strong></div><div class="setting-row"><span>Partida</span><button id="resetGame" class="danger">Reiniciar partida</button></div>`;$("qualitySelect").value=settings.quality;$("soundToggle").onclick=()=>{settings.sound=!settings.sound;renderSettings("options")};$("qualitySelect").onchange=e=>settings.quality=e.target.value;$("namesToggle").onclick=()=>{settings.showNames=!settings.showNames;renderSettings("options")};$("barsToggle").onclick=()=>{settings.showBars=!settings.showBars;renderSettings("options")};$("resetGame").onclick=()=>openPanel("confirmReset");return}
 let data=[];if(tab==="bestiary")data=Object.entries(enemyDefs).map(([id,e])=>discovered.enemies.has(id)?{name:e.name,icon:e.body==="beast"?"🐺":e.body==="undead"?"💀":"👤",lines:[`Vida base: ${e.health}`,`Daño base: ${e.damage}`,`Derrotados o descubiertos`]}:{name:"???",icon:"❔",lines:["Criatura no descubierta"]});else{const type=tab==="weapons"?i=>i.type==="weapon":tab==="armor"?i=>i.type==="armor"||i.type==="cloth":i=>i.type==="material";data=Object.entries(itemDefs).filter(([,i])=>type(i)).map(([id,i])=>discovered.items.has(id)?{name:i.name,icon:i.icon,lines:[i.desc,...Object.entries(i.stats||{}).map(([k,v])=>`${statName(k)}: ${v}`)]}:{name:"???",icon:"❔",lines:["Objeto no descubierto"]})}c.innerHTML=`<div class="compendium-grid">${data.map(d=>`<article class="compendium-card"><h4>${d.icon} ${d.name}</h4>${d.lines.map(l=>`<p>${l}</p>`).join("")}</article>`).join("")}</div>`
};
const oldUpdateHud=updateHud;updateHud=function(){oldUpdateHud();const ammo=$("ammoHud"),arch=currentCombatSkill()==="archery";ammo.classList.toggle("hidden",!arch);if(arch)ammo.textContent=countItem("arrow")+countItem("reinforcedArrow")+countItem("silverArrow");const g=nearbyGround();if(g){$("interactionHint").classList.remove("hidden");$("interactionHint").textContent=`Recoger ${g.item.name}`}};
save=function(){localStorage.setItem(SAVE_KEY,JSON.stringify({version:4.2,player:{...player},skills,worldTime,battleMode,explored:[...explored],settings,bank,groundItems,corpses,discovered:{enemies:[...discovered.enemies],items:[...discovered.items],regions:[...discovered.regions],recipes:[...discovered.recipes]},oreNodes:oreNodes.map(n=>({depleted:n.depleted,respawn:n.respawn}))}))};
load=function(){try{let raw=localStorage.getItem(SAVE_KEY);if(!raw)for(const k of LEGACY_SAVE_KEYS){raw=localStorage.getItem(k);if(raw)break}const d=JSON.parse(raw);if(!d)return;if(d.player)Object.assign(player,d.player);if(d.skills)Object.keys(skills).forEach(k=>Object.assign(skills[k],d.skills[k]||{}));worldTime=d.worldTime??worldTime;battleMode=!!d.battleMode;(d.explored||[]).forEach(x=>explored.add(x));Object.assign(settings,d.settings||{});(d.bank||[]).forEach(x=>bank.push(x));(d.groundItems||[]).forEach(x=>groundItems.push(x));(d.corpses||[]).forEach(x=>corpses.push(x));Object.entries(d.discovered||{}).forEach(([k,v])=>(v||[]).forEach(x=>discovered[k]?.add(x)));(d.oreNodes||[]).forEach((x,i)=>{if(oreNodes[i])Object.assign(oreNodes[i],x)})}catch(e){console.warn(e)}};
const oldBind=bind;bind=function(){oldBind();document.querySelectorAll("[data-equip-filter]").forEach(b=>b.onclick=()=>{equipmentFilter=b.dataset.equipFilter;document.querySelectorAll("[data-equip-filter]").forEach(x=>x.classList.toggle("active",x===b));renderEquipment()})};


/* ========================================================================
   V4.3 — NÚCLEO MODERNO
   Autoataque por objetivo, cargado manual, equilibrio, durabilidad,
   reparación, configuraciones rápidas y reglas definitivas de mano secundaria.
   ======================================================================== */

// Despiece deja de ser una habilidad: los recursos naturales aparecen en loot.
delete skillInfo.butchering;
delete skills.butchering;
if(itemDefs.butcherKnife) delete itemDefs.butcherKnife;
if(shops.blacksmith) shops.blacksmith.items = shops.blacksmith.items.filter(id=>id!=="butcherKnife");

// Nombres y especiales definitivos.
skillInfo.spears.unlock="60: Embestida · 80: Empalamiento";
skillInfo.axes.unlock="60: Hendidura · 80: Torbellino";
skillInfo.endurance.unlock="60: Segundo aliento · 80: Inquebrantable";
skillInfo.arcaneKnowledge.unlock="60: Lectura de debilidad · 80: Sobrecarga arcana";
skillInfo.magicResistance.unlock="60: Velo arcano · 80: Anulación";

// Grimorio físico, reactivos y kits.
itemDefs.grimoire={name:"Grimorio arcano",icon:"📖",type:"grimoire",slot:"offHand",value:420,stack:false,stats:{magicPower:7,mana:8},desc:"Ocupa la mano secundaria. Permite usar magia avanzada."};
itemDefs.arcaneReagent={name:"Reactivo arcano",icon:"✨",type:"material",value:28,stack:true,desc:"Consumido por hechizos avanzados."};
itemDefs.darkReagent={name:"Esencia sombría",icon:"🌑",type:"material",value:55,stack:true,desc:"Reactivo para futuras artes oscuras."};
itemDefs.repairKit={name:"Kit de reparación",icon:"🧰",type:"consumable",value:95,stack:true,desc:"Repara parcialmente un objeto equipado."};
if(shops.mage&&!shops.mage.items.includes("grimoire")) shops.mage.items.unshift("grimoire","arcaneReagent");
if(shops.blacksmith&&!shops.blacksmith.items.includes("repairKit")) shops.blacksmith.items.push("repairKit");

// Recursos de criaturas: siempre accesibles tras la victoria.
enemyDefs.wolf.loot=["rawHide","bone"];
enemyDefs.bear.loot=["bearHide","bone"];
enemyDefs.troll.loot=["trollHide","bone"];
enemyDefs.skeleton.loot=["bone","silverOre"];
enemyDefs.necromancer.loot=["boneDust","arcaneReagent","scrollIce"];
enemyDefs.swampWitch.loot=["shadowCloth","herb","arcaneReagent","scrollLightning"];

// Estado moderno del jugador.
player.maxPoise=100;
player.poise=100;
player.poiseBroken=0;
player.charging=false;
player.chargeTime=0;
player.autoAttack=true;
player.activeLoadout=0;
player.loadouts=[
 {mainHand:null,offHand:null,spells:["fireball","heal",null,null]},
 {mainHand:null,offHand:null,spells:["fireball","heal",null,null]}
];
player.loadoutCd=0;
player.repairBonus=0;

// Normaliza objetos antiguos o recién creados.
function isDurable(it){return !!it && ["weapon","armor","shield","tool","grimoire","jewelry","cloth"].includes(it.type)}
function baseDurability(it){
 if(!it)return 0;
 if(it.type==="weapon")return it.twoHanded?145:120;
 if(it.type==="shield")return 150;
 if(it.type==="armor")return 135;
 if(it.type==="tool")return 110;
 if(it.type==="grimoire")return 90;
 if(it.type==="jewelry")return 80;
 return 100
}
const makeItemV42=makeItem;
makeItem=function(id,opts={}){
 const it=makeItemV42(id,opts);
 if(isDurable(it)){
  it.maxDurability=opts.maxDurability||Math.round(baseDurability(it)*(it.rarity==="legendary"?1.3:it.rarity==="epic"?1.18:1));
  it.durability=opts.durability??it.maxDurability;
 }
 return it
};
function normalizeItem(it){
 if(!it)return it;
 if(isDurable(it)){
  it.maxDurability=it.maxDurability||baseDurability(it);
  it.durability=it.durability??it.maxDurability;
 }
 return it
}
function normalizeAllItems(){
 player.inventory.forEach(normalizeItem);
 Object.values(player.equipment).forEach(normalizeItem);
 bank.forEach(normalizeItem);
 groundItems.forEach(g=>normalizeItem(g.item));
 corpses.forEach(c=>(c.loot||[]).forEach(normalizeItem))
}
function durabilityRatio(it){return !isDurable(it)?1:Math.max(0,it.durability)/(it.maxDurability||1)}
function wearItem(it,amount){
 if(!isDurable(it)||it.durability<=0)return;
 it.durability=Math.max(0,it.durability-amount);
 if(it.durability===0)toast(`${it.name} quedó inutilizable hasta ser reparado.`)
}
function effectiveItemStats(it){
 const stats={...(it?.stats||{})};
 if(isDurable(it)&&durabilityRatio(it)<=0){
  Object.keys(stats).forEach(k=>stats[k]*=.25)
 }else if(isDurable(it)&&durabilityRatio(it)<.25){
  Object.keys(stats).forEach(k=>stats[k]*=.7)
 }
 return stats
}
equipStats=function(){
 const out={damageMin:3,damageMax:6,defense:0,accuracy:0,health:0,mana:0,magicPower:0,magicResistance:0,critical:0,speed:100,range:1.75,poiseDamage:8,staminaCost:8};
 Object.values(player.equipment).filter(Boolean).forEach(it=>Object.entries(effectiveItemStats(it)).forEach(([k,v])=>{
  if(k==="speed")out.speed=Math.min(out.speed,v);
  else if(k==="range")out.range=Math.max(out.range,v);
  else out[k]=(out[k]||0)+v
 }));
 return out
};
const itemHtmlV42=itemHtml;
itemHtml=function(it){
 let h=itemHtmlV42(it);
 if(isDurable(it)){
  const pct=Math.round(durabilityRatio(it)*100);
  h+=`<div class="stat"><span>Durabilidad</span><strong>${Math.round(it.durability)} / ${Math.round(it.maxDurability)}</strong></div>
  <div class="durability-track ${pct<25?'durability-low':''}"><i style="width:${pct}%"></i></div>`
 }
 return h
};
const statNameV42=statName;
statName=function(k){return({
 speed:"Velocidad",range:"Alcance",poiseDamage:"Daño de equilibrio",staminaCost:"Coste de aguante",
 block:"Bloqueo",durability:"Durabilidad",maxDurability:"Durabilidad máxima"
})[k]||statNameV42(k)};

// Reglas de mano secundaria.
function isOffhandExclusive(it){return it&&(it.type==="shield"||it.type==="grimoire")}
const equipFromInventoryV42=equipFromInventory;
equipFromInventory=function(i){
 const it=player.inventory[i];if(!it?.slot)return;
 normalizeItem(it);
 const slot=slotForItem(it);
 if(slot==="offHand"&&player.equipment.mainHand?.twoHanded){
  toast("Un arma de dos manos no permite mano secundaria.");return
 }
 if(it.twoHanded&&player.equipment.offHand){
  addItem(player.equipment.offHand);player.equipment.offHand=null
 }
 if(isOffhandExclusive(it)&&player.equipment.offHand&&player.equipment.offHand!==it){
  addItem(player.equipment.offHand);player.equipment.offHand=null
 }
 const old=player.equipment[slot];
 player.equipment[slot]=player.inventory.splice(i,1)[0];
 player.equipment[slot].slot=slot;
 if(old)addItem(old);
 derived();renderInventory();renderEquipment();captureLoadout(player.activeLoadout);
 toast(`${it.name} equipado.`)
};

// Dos configuraciones rápidas.
function itemUid(slot){return player.equipment[slot]?.uid||null}
function captureLoadout(index){
 if(!player.loadouts)player.loadouts=[{},{}];
 player.loadouts[index]={mainHand:itemUid("mainHand"),offHand:itemUid("offHand"),spells:[...player.equippedSpells]}
}
function findOwned(uid){
 if(!uid)return null;
 const inv=player.inventory.find(i=>i.uid===uid);if(inv)return{where:"inventory",item:inv,index:player.inventory.indexOf(inv)};
 for(const [slot,it] of Object.entries(player.equipment))if(it?.uid===uid)return{where:"equipment",item:it,slot};
 return null
}
function activateLoadout(index){
 if(player.loadoutCd>0)return toast("Espera antes de cambiar nuevamente.");
 if(index===player.activeLoadout)return;
 captureLoadout(player.activeLoadout);
 const desired=player.loadouts[index]||{};
 const equipUid=(uid,slot)=>{
  if(!uid){if(player.equipment[slot]){addItem(player.equipment[slot]);player.equipment[slot]=null}return}
  const found=findOwned(uid);if(!found)return;
  if(found.where==="equipment"&&found.slot===slot)return;
  if(found.where==="equipment"){player.equipment[found.slot]=null}
  else player.inventory.splice(found.index,1);
  if(player.equipment[slot])addItem(player.equipment[slot]);
  player.equipment[slot]=found.item
 };
 equipUid(desired.mainHand,"mainHand");
 if(player.equipment.mainHand?.twoHanded){
  if(player.equipment.offHand){addItem(player.equipment.offHand);player.equipment.offHand=null}
 }else equipUid(desired.offHand,"offHand");
 player.equippedSpells=[...(desired.spells||["fireball","heal",null,null])];
 player.activeLoadout=index;player.loadoutCd=1.25;derived();renderQuickbar();renderEquipment();
 toast(`Conjunto ${index===0?"I":"II"} activado.`)
}
function updateLoadoutButtons(){
 const a=$("loadout1"),b=$("loadout2");if(!a||!b)return;
 a.classList.toggle("active",player.activeLoadout===0);b.classList.toggle("active",player.activeLoadout===1)
}

// Equilibrio.
function enemyMaxPoise(e){return Math.round(35+e.level*14+e.maxHealth*.18)}
function ensurePoise(e){if(e.maxPoise==null)e.maxPoise=enemyMaxPoise(e);if(e.poise==null)e.poise=e.maxPoise;if(e.poiseBroken==null)e.poiseBroken=0}
enemies.forEach(ensurePoise);
function applyPoiseDamage(e,amount){
 ensurePoise(e);if(e.poiseBroken>0)return;
 e.poise-=amount;
 if(e.poise<=0){
  e.poise=0;e.poiseBroken=1.65;e.state="stagger";e.attackCd=Math.max(e.attackCd,1.5);
  floatText(e.x,e.y,"EQUILIBRIO ROTO","#ffe192");burst(e.x,e.y,"#e9c86b",18)
 }
}
const damageEnemyV42=damageEnemy;
damageEnemy=function(e,n,poise=0){
 if(!e?.alive)return;
 ensurePoise(e);
 const vulnerable=e.poiseBroken>0?1.35:1;
 damageEnemyV42(e,Math.round(n*vulnerable));
 if(e.alive&&poise>0)applyPoiseDamage(e,poise)
};

// Autoataque y ataque cargado.
function validTarget(){
 if(targetEnemy&&!targetEnemy.alive)targetEnemy=null;
 return targetEnemy
}
function targetRange(){return equipStats().range||1.75}
function weaponReady(){
 const w=currentWeapon();return !w||!isDurable(w)||w.durability>0
}
function ammoIndex(){
 return player.inventory.findIndex(i=>["arrow","reinforcedArrow","silverArrow"].includes(i.id))
}
function basicCooldown(st){return clamp((st.speed||100)/130,.38,1.2)}
function spendStamina(cost){if(player.stamina<cost){toast("No tienes suficiente aguante.");return false}player.stamina-=cost;return true}
function executeAttack(charged=false,manual=false){
 if(!battleMode||panelOpen()||player.attackCd>0)return false;
 const e=validTarget();if(!e)return manual&&toast("Selecciona un objetivo.");
 const skill=currentCombatSkill(),weapon=currentWeapon(),st=equipStats();
 if(!weaponReady())return toast("Tu arma necesita reparación.");
 const range=(st.range||1.75)+(charged?.25:0);
 const d=dist(player,e);
 if(d>range)return manual&&toast("El objetivo está fuera de alcance.");
 const staminaCost=(st.staminaCost||8)*(charged?2.05:1);
 if(!spendStamina(staminaCost))return false;
 player.aimX=e.x-player.x;player.aimY=e.y-player.y;player.dirX=player.aimX;player.dirY=player.aimY;
 player.attackAnim=1;player.attackCd=basicCooldown(st)*(charged?1.35:1);
 if(skill==="archery"){
  const ix=ammoIndex();if(ix<0){player.stamina+=staminaCost;return toast("No tienes flechas.")}
  removeAmount(ix,1);
  const l=Math.hypot(player.aimX,player.aimY)||1;
  projectiles.push({kind:"arrow",x:player.x,y:player.y,z:20,vx:player.aimX/l,vy:player.aimY/l,speed:13,range:st.range||16,traveled:0,color:"#d6c49a",life:3,
   damage:Math.round(rand(st.damageMin,st.damageMax)*(charged?1.65:1)+skills.archery.value*.18),poise:charged?18:5,owner:"player"});
 }else{
  const hitChance=clamp(72+(st.accuracy||0)+skills[skill].value*.18-e.level*2,35,96);
  const critChance=clamp(4+(st.critical||0)+skills[skill].value*.035,4,35);
  const base=rand(st.damageMin,st.damageMax)+skills[skill].value*.16+player.attributes.strength*.055;
  const crit=Math.random()*100<critChance;
  let dmg=Math.round(base*(charged?1.72:1)*(crit?1.55:1));
  if(player.counterReady>0){dmg=Math.round(dmg*1.4);player.counterReady=0}
  setTimeout(()=>{
   if(!e.alive||dist(player,e)>range+.45)return;
   if(Math.random()*100>hitChance)return floatText(e.x,e.y,"FALLO","#d7d7d7");
   damageEnemy(e,dmg,(st.poiseDamage||8)*(charged?2.35:1));
   if(crit)floatText(e.x,e.y,"CRÍTICO","#ffd269")
  },150)
 }
 if(weapon)wearItem(weapon,charged?1.25:.35);
 gain(skill,charged?.7:.35,e.level);gainAttribute(skill==="fencing"||skill==="archery"?"dexterity":"strength",charged?.12:.05);
 return true
}
attack=function(){return executeAttack(false,true)};
function beginCharge(){
 if(!battleMode||panelOpen()||!validTarget())return;
 player.charging=true;player.chargeTime=0;$("attackButton")?.classList.add("charging");$("attackLabel").textContent="Cargando"
}
function releaseCharge(){
 if(!player.charging)return;
 const charged=player.chargeTime>=.42;
 player.charging=false;$("attackButton")?.classList.remove("charging");$("attackLabel").textContent="Autoataque";
 if(charged)executeAttack(true,true);else executeAttack(false,true);
 player.chargeTime=0
}

// Proyectiles con equilibrio.
const updateEffectsV42=updateEffects;
updateEffects=function(dt){
 // Copia controlada del sistema anterior, añadiendo poise a proyectiles.
 for(const f of floating){f.z+=dt*12;f.life-=dt*.7}
 for(let i=floating.length-1;i>=0;i--)if(floating[i].life<=0)floating.splice(i,1);
 for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;p.vz-=12*dt;p.life-=dt}
 for(let i=particles.length-1;i>=0;i--)if(particles[i].life<=0)particles.splice(i,1);
 for(const p of projectiles){
  if(p.vx!==undefined){
   const step=p.speed*dt;p.x+=p.vx*step;p.y+=p.vy*step;p.traveled+=step;p.z=18+Math.sin(performance.now()/100)*2;p.life-=dt;
   if(blocked(p.x,p.y)||p.traveled>=p.range){p.life=0;continue}
   if(p.owner==="player"){
    const hit=enemies.find(e=>e.alive&&Math.hypot(e.x-p.x,e.y-p.y)<.65);
    if(hit){damageEnemy(hit,p.damage,p.poise||4);p.life=0}
   }
  }else{
   const d=Math.hypot(p.tx-p.x,p.ty-p.y);if(d<.25){p.hit();p.life=0}else{p.x+=(p.tx-p.x)/d*p.speed*dt;p.y+=(p.ty-p.y)/d*p.speed*dt;p.z=18+Math.sin(performance.now()/100)*2;p.life-=dt}
  }
 }
 for(let i=projectiles.length-1;i>=0;i--)if(projectiles[i].life<=0)projectiles.splice(i,1)
};

// Carga, autoataque y recuperación de equilibrio dentro del update.
const updatePlayerV42=updatePlayer;
updatePlayer=function(dt){
 updatePlayerV42(dt);
 player.loadoutCd=Math.max(0,(player.loadoutCd||0)-dt);
 if(player.charging)player.chargeTime=Math.min(1.4,player.chargeTime+dt);
 player.poiseBroken=Math.max(0,(player.poiseBroken||0)-dt);
 player.poise=Math.min(player.maxPoise,player.poise+10*dt);
 if(battleMode&&player.autoAttack&&!player.charging&&validTarget()&&player.attackCd<=0)executeAttack(false,false)
};
const updateEnemiesV42=updateEnemies;
updateEnemies=function(dt){
 updateEnemiesV42(dt);
 enemies.forEach(e=>{
  if(!e.alive)return;ensurePoise(e);
  e.poiseBroken=Math.max(0,e.poiseBroken-dt);
  if(e.poiseBroken<=0)e.poise=Math.min(e.maxPoise,e.poise+8*dt)
 })
};

// Armadura, escudos y durabilidad al recibir daño.
const damagePlayerV42=damagePlayer;
damagePlayer=function(n){
 if(player.poiseBroken>0)n*=1.2;
 const shield=shieldEquipped();
 const before=player.health;
 damagePlayerV42(n);
 if(shield&&player.health===before)wearItem(shield,.8);
 else{
  const armor=Object.values(player.equipment).filter(it=>it&&it.type==="armor");
  if(armor.length)wearItem(choice(armor),.28)
 }
 const poiseLoss=Math.max(4,n*.55);
 player.poise-=poiseLoss;
 if(player.poise<=0&&player.poiseBroken<=0){
  player.poise=0;player.poiseBroken=1.15;player.attackCd=Math.max(player.attackCd,1);
  player.charging=false;$("attackButton")?.classList.remove("charging");floatText(player.x,player.y,"EQUILIBRIO ROTO","#ffd97a")
 }
};

// Hechizos avanzados: grimorio y reactivos.
function hasGrimoire(){return player.equipment.offHand?.type==="grimoire"}
const castSpellV42=castSpell;
castSpell=function(id){
 const s=spellDefs[id];if(!s)return;
 const advanced=s.required>=60;
 if(advanced&&!hasGrimoire())return toast("Necesitas un grimorio equipado para este hechizo.");
 if(advanced&&countItem("arcaneReagent")<1)return toast("Necesitas un reactivo arcano.");
 if(advanced)consume("arcaneReagent",1);
 castSpellV42(id)
};

// Especiales ampliados.
highestCombatSkill=function(){
 return["swords","fencing","maces","axes","spears","archery","unarmed","shieldMastery","endurance","magery","healing","arcaneKnowledge","magicResistance"]
 .sort((a,b)=>(skills[b]?.value||0)-(skills[a]?.value||0))[0]
};
specialName=function(skill,l){return({
 swords:{60:"Golpe poderoso",80:"Ignorar armadura"},
 fencing:{60:"Estocada precisa",80:"Danza de cuchillas"},
 maces:{60:"Golpe quebrador",80:"Impacto sísmico"},
 axes:{60:"Hendidura",80:"Torbellino"},
 spears:{60:"Embestida",80:"Empalamiento"},
 archery:{60:"Disparo perforante",80:"Lluvia de flechas"},
 unarmed:{60:"Golpe aturdidor",80:"Llave de combate"},
 shieldMastery:{60:"Guardia firme",80:"Contraataque"},
 endurance:{60:"Segundo aliento",80:"Inquebrantable"},
 magery:{60:"Nova de hielo",80:"Cadena de relámpagos"},
 healing:{60:"Regeneración",80:"Escudo vital"},
 arcaneKnowledge:{60:"Lectura de debilidad",80:"Sobrecarga arcana"},
 magicResistance:{60:"Velo arcano",80:"Anulación"}
})[skill]?.[l]||"Especial"};
useSpecial=function(level){
 if(!battleMode)return speak("Activa el modo batalla.");
 const main=highestCombatSkill(),sk=skills[main];if(!sk||sk.value<level)return speak(`Requiere ${skillInfo[main].name} ${level}.`);
 const e=validTarget();
 if(["swords","fencing","maces","axes","spears","unarmed"].includes(main)&&!e)return speak("Selecciona un enemigo.");
 if(main==="swords")damageEnemy(e,level===60?55:48,level===60?26:15);
 if(main==="fencing"){if(level===60)damageEnemy(e,45,8);else for(let i=0;i<3;i++)setTimeout(()=>damageEnemy(e,22,5),i*105)}
 if(main==="maces"){if(level===60)damageEnemy(e,50,45);else enemies.filter(x=>x.alive&&dist(x,player)<3).forEach(x=>damageEnemy(x,42,50))}
 if(main==="axes"){if(level===60){damageEnemy(e,58,28)}else enemies.filter(x=>x.alive&&dist(x,player)<2.5).forEach(x=>damageEnemy(x,38,22))}
 if(main==="spears"){if(dist(e,player)>3)return speak("Objetivo fuera de alcance.");damageEnemy(e,level===60?46:68,level===60?22:35)}
 if(main==="unarmed")damageEnemy(e,level===60?36:58,level===60?30:20);
 if(main==="archery"){if(ammoIndex()<0)return speak("No tienes flechas.");if(level===60)executeAttack(true,true);else enemies.filter(x=>x.alive&&dist(x,player)<10).slice(0,5).forEach(x=>damageEnemy(x,30,12))}
 if(main==="shieldMastery"){if(!shieldEquipped())return speak("Necesitas un escudo.");if(level===60)player.guardBuff=7;else player.counterReady=8}
 if(main==="endurance"){if(level===60){player.stamina=Math.min(100,player.stamina+55);player.health=Math.min(player.maxHealth,player.health+25)}else{player.poise=player.maxPoise;player.vitalShield=150}}
 if(main==="magery"){if(level===60)enemies.filter(x=>x.alive&&dist(x,player)<3).forEach(x=>damageEnemy(x,30+skills.magery.value*.35,20));else enemies.filter(x=>x.alive&&dist(x,player)<8).slice(0,4).forEach((x,i)=>damageEnemy(x,Math.round((45+skills.magery.value*.25)*(1-i*.15)),12))}
 if(main==="healing"){if(level===60)player.regen=8;else player.vitalShield=110}
 if(main==="arcaneKnowledge"){if(level===60&&e){floatText(e.x,e.y,`DEF ${Math.round(e.level*4)} · RES ${Math.round(e.level*3)}`,"#a9d9ff")}else player.arcaneOverload=8}
 if(main==="magicResistance"){if(level===60)player.magicWard=8;else player.magicNullify=4}
};

// Reparación.
function repairCost(it){return Math.max(8,Math.ceil((it.maxDurability-it.durability)*Math.max(1,it.value/it.maxDurability)*.22))}
function repairItem(it,profession=null){
 if(!isDurable(it)||it.durability>=it.maxDurability)return toast("Este objeto no necesita reparación.");
 const cost=repairCost(it);
 if(player.gold<cost)return toast(`Necesitas ${cost} de oro.`);
 player.gold-=cost;it.durability=it.maxDurability;toast(`${it.name} reparado por ${cost} de oro.`);renderEquipment();renderInventory()
}
function repairAll(){
 const all=[...player.inventory,...Object.values(player.equipment).filter(Boolean)].filter(isDurable);
 const damaged=all.filter(i=>i.durability<i.maxDurability);if(!damaged.length)return toast("No hay objetos dañados.");
 const cost=damaged.reduce((n,i)=>n+repairCost(i),0);
 if(player.gold<cost)return toast(`Necesitas ${cost} de oro para reparar todo.`);
 player.gold-=cost;damaged.forEach(i=>i.durability=i.maxDurability);toast(`Todo el equipo fue reparado por ${cost} de oro.`);renderEquipment()
}
const openDialogueV42b=openDialogue;
openDialogue=function(n){
 if(n.role==="blacksmith"&&!isNight()){
  closePanels();$("dialoguePanel").classList.remove("hidden");$("dialogueName").textContent=n.name;$("dialogueText").textContent=n.greeting;
  const box=$("dialogueOptions");box.innerHTML="";
  const add=(t,fn)=>{const b=document.createElement("button");b.textContent=t;b.onclick=fn;box.appendChild(b)};
  add("Comprar",()=>openShop(n.role,"buy"));add("Vender",()=>openShop(n.role,"sell"));add("Reparar todo",repairAll);add("Salir",closePanels);return
 }
 return openDialogueV42b(n)
};

// Añade reparación a los paneles.
const renderEquipmentDetailsV42b=renderEquipmentDetails;
renderEquipmentDetails=function(slot,it){
 renderEquipmentDetailsV42b(slot,it);if(!it||!isDurable(it))return;
 const actions=$("equipmentDetails").querySelector(".actions");
 const b=document.createElement("button");b.textContent=`Reparar (${repairCost(it)} oro)`;b.disabled=it.durability>=it.maxDurability;b.onclick=()=>repairItem(it);actions.prepend(b)
};
const renderInventoryDetailsV42b=renderInventoryDetails;
renderInventoryDetails=function(it,i){
 renderInventoryDetailsV42b(it,i);if(!isDurable(it))return;
 const actions=$("inventoryDetails").querySelector(".actions");
 const b=document.createElement("button");b.textContent=`Reparar (${repairCost(it)} oro)`;b.disabled=it.durability>=it.maxDurability;b.onclick=()=>repairItem(it);actions.prepend(b)
};

// Loot: recursos naturales garantizados, rareza visual del cadáver.
const killEnemyV42b=killEnemy;
killEnemy=function(e){
 e.alive=false;e.respawn=120;const loot=[];
 for(const id of e.loot){
  const natural=["rawHide","bearHide","trollHide","bone","boneDust","herb","shadowCloth"].includes(id);
  if(natural||Math.random()<.68)loot.push(enhanceItem(makeItem(id,{count:natural&&Math.random()<.35?2:1}),e.level*.45))
 }
 if(Math.random()<.22)loot.push(enhanceItem(makeItem(choice(["ring","ironSword","dagger","shortBow","leatherChest"])),e.level*.45));
 if(Math.random()<.42)loot.push(makeItem("arrow",{count:Math.floor(rand(3,12))}));
 const highest=loot.reduce((best,it)=>["common","uncommon","rare","epic","legendary"].indexOf(it.rarity)>["common","uncommon","rare","epic","legendary"].indexOf(best)?it.rarity:best,"common");
 corpses.push({name:`Cadáver de ${e.name}`,x:e.x,y:e.y,life:300,loot,gold:Math.round(rand(6,20)*e.level),highestRarity:highest});
 player.honor+=e.tag==="criminal"||e.tag==="undead"?2:0;targetEnemy=null;toast(`${e.name} derrotado. Revisa su cadáver.`)
};
drawCorpses=function(){
 const colors={common:"210,210,210",uncommon:"108,204,129",rare:"101,168,242",epic:"189,120,235",legendary:"239,166,77"};
 corpses.forEach(c=>{
  const p=screen(c.x,c.y),has=(c.loot&&c.loot.length)||c.gold>0,clr=colors[c.highestRarity||"common"];
  ctx.fillStyle="#2c2524";ctx.beginPath();ctx.ellipse(p.x,p.y-2,15,6,-.2,0,Math.PI*2);ctx.fill();
  if(has){const pulse=.45+.35*Math.sin(performance.now()/350);ctx.strokeStyle=`rgba(${clr},${pulse})`;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(p.x,p.y-4,19,9,0,0,Math.PI*2);ctx.stroke();ctx.fillStyle=`rgb(${clr})`;ctx.font="12px Arial";ctx.textAlign="center";ctx.fillText("◆",p.x,p.y-15)}
 })
};

// Selección y lectura de objetivo/equilibrio.
const drawEnemyV42b=drawEnemy;
drawEnemy=function(e){
 drawEnemyV42b(e);ensurePoise(e);
 if(e===targetEnemy&&e.alive){
  const p=screen(e.x,e.y);ctx.strokeStyle="#f2d477";ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(p.x,p.y+1,19,8,0,0,Math.PI*2);ctx.stroke();
  if(e.poise<e.maxPoise||e.poiseBroken>0){ctx.fillStyle="#000b";ctx.fillRect(p.x-16,p.y-41,32,3);ctx.fillStyle=e.poiseBroken>0?"#f1c95e":"#b7a45e";ctx.fillRect(p.x-16,p.y-41,32*e.poise/e.maxPoise,3)}
 }
};

// HUD y equipo.
const updateHudV42b=updateHud;
updateHud=function(){
 updateHudV42b();
 const e=validTarget(),status=$("targetStatus");
 status.textContent=e?`${e.name} · ${Math.ceil(dist(player,e)*10)/10} casillas${e.poiseBroken>0?" · vulnerable":""}`:"Sin objetivo";
 const label=$("attackLabel");if(label&&!player.charging)label.textContent=e?"Autoataque":"Selecciona objetivo";
 updateLoadoutButtons()
};
const renderEquipmentV42b=renderEquipment;
renderEquipment=function(){renderEquipmentV42b();updateLoadoutButtons()};

// Guardado V4.3.
save=function(){
 captureLoadout(player.activeLoadout);
 localStorage.setItem(SAVE_KEY,JSON.stringify({version:4.3,player:{...player},skills,worldTime,battleMode,explored:[...explored],settings,bank,groundItems,corpses,
 discovered:{enemies:[...discovered.enemies],items:[...discovered.items],regions:[...discovered.regions],recipes:[...discovered.recipes]},
 oreNodes:oreNodes.map(n=>({depleted:n.depleted,respawn:n.respawn}))}))
};
const loadV42b=load;
load=function(){loadV42b();delete skills.butchering;normalizeAllItems();
 player.maxPoise=player.maxPoise||100;player.poise=player.poise??player.maxPoise;player.activeLoadout=player.activeLoadout||0;
 player.loadouts=player.loadouts||[{mainHand:null,offHand:null,spells:[...player.equippedSpells]},{mainHand:null,offHand:null,spells:[...player.equippedSpells]}]
};

// Controles: mantener para cargar; toque para golpe inmediato.
const bindV42b=bind;
bind=function(){
 bindV42b();
 const attackBtn=$("attackButton");
 attackBtn.onclick=null;
 let chargingPointer=null;
 attackBtn.addEventListener("pointerdown",e=>{e.preventDefault();chargingPointer=e.pointerId;attackBtn.setPointerCapture?.(e.pointerId);beginCharge()});
 const end=e=>{if(chargingPointer!==null&&e.pointerId!==chargingPointer)return;chargingPointer=null;releaseCharge()};
 attackBtn.addEventListener("pointerup",end);attackBtn.addEventListener("pointercancel",end);attackBtn.addEventListener("lostpointercapture",()=>{if(player.charging)releaseCharge()});
 $("loadout1").onclick=()=>activateLoadout(0);$("loadout2").onclick=()=>activateLoadout(1);
};

// Ajustes, versión y ayuda.
const renderSettingsV42b=renderSettings;
renderSettings=function(tab="options"){
 renderSettingsV42b(tab);
 if(tab==="options"){
  const rows=$("settingsContent");const extra=document.createElement("div");extra.className="setting-row";
  extra.innerHTML='<span>Combate</span><strong>Selecciona un objetivo para autoatacar. Mantén Atacar para cargar.</strong>';rows.insertBefore(extra,rows.lastElementChild);
  const version=[...rows.querySelectorAll(".setting-row")].find(r=>r.textContent.includes("Versión"));if(version)version.querySelector("strong").textContent="Proyecto Ultra V4.3 — Núcleo moderno"
 }
};


/* =====================================================================
   V4.4 — MAGIA UNIVERSAL, COOLDOWNS, HUD, AUDIO, TIENDA Y PWA
   ===================================================================== */

// ---------- Configuración central de balance ----------
const BALANCE={
 spellGlobalCooldown:.27,
 potionCooldown:7,
 fatigueDecay:3,
 fatigueManaStep:.075,
 fatiguePowerStep:.035,
 fatigueMax:3,
 special60:{cooldown:10,mana:10,stamina:24},
 special80:{cooldown:20,mana:22,stamina:34},
 magicBlockMaxReduction:.7,
 aoeSecondaryCritMultiplier:.45,
 aoeLifeStealMultiplier:.25
};

// ---------- Buffs contenidos: decimales, presupuestos y límites ----------
buffPool.length=0;
[
 ["healthPercent","Vida máxima",.5,8,1],["manaPercent","Maná máximo",.5,8,1],
 ["manaRegen","Regeneración de maná",.5,8,1],["healthRegen","Regeneración de vida",.5,6,1.25],
 ["staminaRegen","Regeneración de aguante",.5,8,1],["damagePercent","Daño físico",.5,6,1.5],
 ["magicDamage","Daño mágico",.5,6,1.5],["critical","Crítico",.5,5.5,1.7],
 ["accuracy","Precisión",.5,6,1.25],["resistance","Resistencia",.5,8,1],
 ["attackSpeedPercent","Velocidad de ataque",.5,5,2],["castSpeedPercent","Velocidad de lanzamiento",.5,5,2],
 ["cooldownReduction","Reducción de cooldown",.5,5,2.2],["lifeSteal","Robo de vida",.5,3.5,2.8],
 ["magicBlockChance","Bloqueo mágico",.5,4,3],["magicBlockReduction","Reducción al bloquear magia",.5,8,2]
].forEach(x=>buffPool.push(x));
const rarityBudget={common:0,uncommon:3.5,rare:7,epic:12,legendary:18};
randomBuffs=function(count,rar="uncommon"){
 const pool=[...buffPool],out=[],budget=rarityBudget[rar]||3.5;
 let spent=0;
 for(let i=0;i<count&&pool.length;i++){
  const ix=Math.floor(Math.random()*pool.length),b=pool.splice(ix,1)[0];
  const remaining=Math.max(.5,(budget-spent)/b[4]);
  const max=Math.min(b[3],remaining);
  if(max<.5)break;
  const value=Math.round(rand(b[2],max)*10)/10;
  spent+=value*b[4];out.push({id:b[0],name:b[1],value})
 }
 return out
};
enhanceItem=function(it,power=1){
 if(!it.slot)return it;it.rarity=randomRarity(power);
 const range=rarity[it.rarity].buffs,count=Math.floor(rand(range[0],range[1]+1));
 it.buffs=randomBuffs(count,it.rarity);return it
};

// ---------- Armas: velocidad y perfiles de área ----------
function weaponSeconds(it){
 const speed=it?.stats?.speed||100;return Math.round(clamp(speed/130,.38,1.35)*100)/100
}
function setWeaponProfile(id,profile){
 if(itemDefs[id])itemDefs[id].areaProfile=profile
}
Object.values(itemDefs).filter(i=>i.type==="weapon").forEach(i=>{
 i.attackSeconds=weaponSeconds(i);
 const old=i.desc||"";
 if(!old.includes("Velocidad de ataque"))i.desc=`${old}${old?" ":""}Velocidad de ataque: ${i.attackSeconds.toFixed(2).replace(".",",")} s.`
});
setWeaponProfile("greatsword",{type:"sweep",angle:115,radius:2.35,maxTargets:3,secondary:[.65,.42]});
setWeaponProfile("battleAxe",{type:"sweep",angle:95,radius:2.15,maxTargets:2,secondary:[.62]});
setWeaponProfile("warHammer",{type:"impact",radius:1.65,maxTargets:3,secondary:[.58,.38]});
setWeaponProfile("spear",{type:"line",length:3.3,width:.65,maxTargets:3,secondary:[.72,.48]});
const itemHtmlV44base=itemHtml;
itemHtml=function(it){
 let h=itemHtmlV44base(it);
 if(it?.type==="weapon"){
  h+=`<div class="weapon-profile"><p><strong>Velocidad de ataque:</strong> ${weaponSeconds(it).toFixed(2).replace(".",",")} s</p>`;
  if(it.areaProfile){
   const names={sweep:"Barrido frontal",impact:"Impacto de área",line:"Penetración lineal"};
   h+=`<p><strong>Tipo de ataque:</strong> ${names[it.areaProfile.type]}</p><p><strong>Objetivos máximos:</strong> ${it.areaProfile.maxTargets}</p>`
  }else h+=`<p><strong>Tipo de ataque:</strong> Objetivo individual</p>`;
  h+="</div>"
 }
 return h
};

// ---------- 6 hechizos y pergaminos ----------
Object.assign(spellDefs,{
 arcaneBolt:{name:"Proyectil arcano",icon:"🔹",skill:"magery",required:0,cost:2,offensive:true,basic:true,damage:11},
 explosion:{name:"Explosión",icon:"💥",skill:"magery",required:25,cost:24,offensive:true,damage:38,cooldown:1.4,advanced:true,aoe:1.8},
 incinerate:{name:"Incinerar",icon:"☄️",skill:"magery",required:35,cost:22,offensive:true,damage:24,cooldown:1.1,advanced:true,dot:{damage:5,ticks:4}},
 iceberg:{name:"Témpano",icon:"🧊",skill:"magery",required:20,cost:18,offensive:true,damage:27,cooldown:.8,slow:3},
 curse:{name:"Maldición",icon:"🟣",skill:"magery",required:30,cost:20,offensive:true,cooldown:2.2,debuff:{stats:.08,duration:8}},
 poison:{name:"Veneno",icon:"☠️",skill:"magery",required:20,cost:17,offensive:true,cooldown:1.2,dot:{damage:4,ticks:6}},
 spark:{name:"Chispa",icon:"⚡",skill:"magery",required:0,cost:8,offensive:true,damage:16,cooldown:.35},
 lightning:{name:"Rayo",icon:"🌩️",skill:"magery",required:40,cost:27,offensive:true,damage:43,cooldown:1.5,advanced:true},
 arcaneBarrier:{name:"Barrera arcana",icon:"🔷",skill:"magery",required:30,cost:24,offensive:false,cooldown:9},
 physicalProtection:{name:"Protección física",icon:"🛡️",skill:"magery",required:20,cost:20,offensive:false,cooldown:8}
});
const scrollMap={
 scrollExplosion:["Pergamino: Explosión","explosion",260],
 scrollIncinerate:["Pergamino: Incinerar","incinerate",290],
 scrollIceberg:["Pergamino: Témpano","iceberg",220],
 scrollCurse:["Pergamino: Maldición","curse",280],
 scrollPoison:["Pergamino: Veneno","poison",230],
 scrollSpark:["Pergamino: Chispa","spark",110],
 scrollLightningBolt:["Pergamino: Rayo","lightning",340],
 scrollBarrier:["Pergamino: Barrera arcana","arcaneBarrier",310],
 scrollProtection:["Pergamino: Protección física","physicalProtection",250]
};
Object.entries(scrollMap).forEach(([id,[name,spell,value]])=>{
 itemDefs[id]={name,icon:"📜",type:"scroll",value,stack:true,spell,desc:`Enseña ${spellDefs[spell].name}.`}
});
if(shops.mage){
 shops.mage.items=[...new Set([...shops.mage.items,...Object.keys(scrollMap)])]
}
enemyDefs.necromancer.loot=[...new Set([...enemyDefs.necromancer.loot,"scrollCurse","scrollExplosion"])];
enemyDefs.swampWitch.loot=[...new Set([...enemyDefs.swampWitch.loot,"scrollPoison","scrollIncinerate"])];
player.knownSpells=[...new Set([...(player.knownSpells||[]),"arcaneBolt","fireball","heal"])];
player.equippedSpells=[...(player.equippedSpells||[]).slice(0,6)];
while(player.equippedSpells.length<6)player.equippedSpells.push(null);
player.spellCooldowns=player.spellCooldowns||{};
player.spellFatigue=player.spellFatigue||{};
player.spellGlobalCd=0;
player.potionCd=0;
player.specialCooldowns=player.specialCooldowns||{60:0,80:0};

// ---------- Audio sintetizado ----------
const AudioSystem={
 ctx:null,master:.75,effects:.8,magic:.8,ui:.55,ambient:.35,enabled:true,
 unlock(){
  if(this.ctx)return;
  try{this.ctx=new (window.AudioContext||window.webkitAudioContext)()}catch(e){}
 },
 tone(freq=440,dur=.08,type="sine",volume=.12,slide=0,channel="effects"){
  if(!this.enabled)return;this.unlock();if(!this.ctx)return;
  const c=this.ctx,o=c.createOscillator(),g=c.createGain();
  o.type=type;o.frequency.setValueAtTime(freq,c.currentTime);
  if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(40,freq+slide),c.currentTime+dur);
  g.gain.setValueAtTime(volume*this.master*(this[channel]??1),c.currentTime);
  g.gain.exponentialRampToValueAtTime(.001,c.currentTime+dur);
  o.connect(g).connect(c.destination);o.start();o.stop(c.currentTime+dur)
 },
 sword(){this.tone(620,.07,"sawtooth",.11,-330);this.tone(230,.09,"triangle",.07,-80)},
 impact(){this.tone(105,.1,"square",.1,-45)},
 fire(){this.tone(310,.18,"sawtooth",.09,420,"magic")},
 ice(){this.tone(880,.18,"sine",.08,-350,"magic")},
 lightning(){this.tone(1250,.09,"square",.07,-760,"magic")},
 heal(){this.tone(440,.22,"sine",.08,310,"magic")},
 uiClick(){this.tone(520,.04,"sine",.05,60,"ui")},
 ready(){this.tone(700,.07,"sine",.05,180,"ui")}
};
addEventListener("pointerdown",()=>AudioSystem.unlock(),{once:true});

// ---------- Selección, paz y movimiento ----------
const toggleBattleV44base=toggleBattleMode;
toggleBattleMode=function(){
 toggleBattleV44base();
 if(!battleMode){
  targetEnemy=null;player.charging=false;player.chargeTime=0;
  $("attackButton")?.classList.remove("charging");
  if($("targetStatus"))$("targetStatus").textContent="Sin objetivo"
 }
 AudioSystem.uiClick()
};

// ---------- Proyectiles guiados y resolución ----------
function spellTarget(){
 return targetEnemy&&targetEnemy.alive?targetEnemy:null
}
function magicalBlock(e,raw){
 const shield=e.shield||null;
 const chance=shield?.magicBlockChance||e.magicBlockChance||0;
 const reduction=Math.min(BALANCE.magicBlockMaxReduction,shield?.magicBlockReduction||e.magicBlockReduction||0);
 if(chance>0&&Math.random()<chance){
  const dmg=Math.max(1,Math.round(raw*(1-reduction)));
  floatText(e.x,e.y,"BLOQUEO MÁGICO","#8ac8ff");return dmg
 }
 return raw
}
function resolveSpellHit(e,spell,damage){
 if(!e?.alive)return;
 const dodge=clamp((e.speed||1)*.025+(e.magicDodge||0),0,.16);
 if(Math.random()<dodge){floatText(e.x,e.y,"ESQUIVA","#d7f1ff");burst(e.x+.4,e.y,"#bdeaff",8);return}
 let dmg=magicalBlock(e,damage);
 const resist=clamp((e.magicResistance||e.level*.012),0,.38);
 if(resist>0){dmg=Math.max(1,Math.round(dmg*(1-resist)));if(resist>.15)floatText(e.x,e.y,"RESISTIDO","#bca8ff")}
 damageEnemy(e,dmg,spell.poise||5);
 if(spell.slow)e.slowUntil=performance.now()/1000+spell.slow;
 if(spell.debuff){e.cursedUntil=performance.now()/1000+spell.debuff.duration;e.cursePower=spell.debuff.stats;floatText(e.x,e.y,"MALDICIÓN","#bd80e8")}
 if(spell.dot){
  const token=(e.dotToken||0)+1;e.dotToken=token;
  for(let i=1;i<=spell.dot.ticks;i++)setTimeout(()=>{if(e.alive&&e.dotToken===token)damageEnemy(e,spell.dot.damage,1)},i*850)
 }
}
function launchHomingSpell(spell,target,damage){
 const start={x:player.x,y:player.y,z:20};
 projectiles.push({kind:"homingSpell",...start,target,spell,damage,speed:10,life:4,color:spell.icon==="🧊"?"#aee8ff":spell.icon.includes("⚡")||spell.name.includes("Rayo")?"#d8f4ff":"#ff8a45",owner:"player"})
}
const updateEffectsV44base=updateEffects;
updateEffects=function(dt){
 for(const f of floating){f.z+=dt*12;f.life-=dt*.7}
 for(let i=floating.length-1;i>=0;i--)if(floating[i].life<=0)floating.splice(i,1);
 for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;p.vz-=12*dt;p.life-=dt}
 for(let i=particles.length-1;i>=0;i--)if(particles[i].life<=0)particles.splice(i,1);
 for(const p of projectiles){
  if(p.kind==="homingSpell"){
   if(!p.target?.alive){p.life=0;continue}
   const dx=p.target.x-p.x,dy=p.target.y-p.y,d=Math.hypot(dx,dy)||1,step=p.speed*dt;
   p.x+=dx/d*step;p.y+=dy/d*step;p.z=19+Math.sin(performance.now()/85)*3;p.life-=dt;
   if(d<.45){resolveSpellHit(p.target,p.spell,p.damage);p.life=0;AudioSystem.impact()}
   continue
  }
  if(p.vx!==undefined){
   const step=p.speed*dt;p.x+=p.vx*step;p.y+=p.vy*step;p.traveled+=step;p.z=18+Math.sin(performance.now()/100)*2;p.life-=dt;
   if(blocked(p.x,p.y)||p.traveled>=p.range){p.life=0;continue}
   if(p.owner==="player"){
    const hit=enemies.find(e=>e.alive&&Math.hypot(e.x-p.x,e.y-p.y)<.65);
    if(hit){damageEnemy(hit,p.damage,p.poise||4);p.life=0}
   }
  }else{
   const d=Math.hypot(p.tx-p.x,p.ty-p.y);if(d<.25){p.hit();p.life=0}else{p.x+=(p.tx-p.x)/d*p.speed*dt;p.y+=(p.ty-p.y)/d*p.speed*dt;p.z=18+Math.sin(performance.now()/100)*2;p.life-=dt}
  }
 }
 for(let i=projectiles.length-1;i>=0;i--)if(projectiles[i].life<=0)projectiles.splice(i,1)
};

// ---------- Cooldowns, fatiga y lanzamiento universal ----------
function spellCooldownRemaining(id){return Math.max(0,player.spellCooldowns[id]||0)}
function cooldownAfterReduction(base){return base*(1-clamp(buffValue("cooldownReduction"),0,15)/100)}
function fatigueLevel(id){return Math.min(BALANCE.fatigueMax,player.spellFatigue[id]?.stacks||0)}
function applyFatigue(id){
 const now=performance.now()/1000,cur=player.spellFatigue[id]||{stacks:0,last:0};
 if(now-cur.last>BALANCE.fatigueDecay)cur.stacks=0;
 cur.stacks=Math.min(BALANCE.fatigueMax,cur.stacks+1);cur.last=now;player.spellFatigue[id]=cur
}
function decayOtherFatigue(id){
 Object.entries(player.spellFatigue).forEach(([k,v])=>{if(k!==id)v.stacks=Math.max(0,v.stacks-1)})
}
function canCastSpell(s,id){
 if(player.spellGlobalCd>0)return "Espera un instante.";
 if(spellCooldownRemaining(id)>0)return "Hechizo recuperándose.";
 if(skills[s.skill].value<s.required)return `Requiere ${skillInfo[s.skill].name} ${s.required}.`;
 if(s.advanced&&!hasGrimoire())return "Necesitas un grimorio equipado.";
 const fatigue=fatigueLevel(id),cost=Math.ceil(s.cost*(1+fatigue*BALANCE.fatigueManaStep));
 if(player.mana<cost)return "Maná insuficiente.";
 if(s.advanced&&countItem("arcaneReagent")<1)return "Necesitas un reactivo arcano.";
 return null
}
castSpell=function(id){
 if(!id)return;
 const s=spellDefs[id];if(!s)return;
 const reason=canCastSpell(s,id);if(reason)return toast(reason);
 const target=spellTarget();
 if(s.offensive&&!target){
  // Fuera de batalla o sin target: lanzamiento direccional.
  if(!battleMode)toast("Hechizo lanzado en la dirección del personaje.");
 }
 const fatigue=fatigueLevel(id),cost=Math.ceil(s.cost*(1+fatigue*BALANCE.fatigueManaStep));
 player.mana-=cost;player.spellGlobalCd=BALANCE.spellGlobalCooldown;
 player.spellCooldowns[id]=cooldownAfterReduction(s.cooldown||.35);
 if(s.advanced)consume("arcaneReagent",1);
 applyFatigue(id);decayOtherFatigue(id);player.castAnim=1;
 const power=(1-fatigue*BALANCE.fatiguePowerStep)*(1+buffValue("magicDamage")/100);
 const damage=Math.round((s.damage||0)+skills.magery.value*.22+player.attributes.intelligence*.09);
 if(id==="heal"){
  player.health=Math.min(player.maxHealth,player.health+Math.round((42+skills.healing.value*.35)*power));floatText(player.x,player.y,"CURACIÓN","#76e89b");AudioSystem.heal()
 }else if(id==="regeneration"){player.regen=8;AudioSystem.heal()}
 else if(id==="vitalShield"){player.vitalShield=100;AudioSystem.heal()}
 else if(id==="arcaneBarrier"){player.magicWard=8;AudioSystem.magic?.()}
 else if(id==="physicalProtection"){player.guardBuff=8;AudioSystem.uiClick()}
 else if(id==="iceNova"){
  enemies.filter(e=>e.alive&&dist(e,player)<3).forEach(e=>resolveSpellHit(e,s,Math.round((30+skills.magery.value*.3)*power)));AudioSystem.ice()
 }else if(id==="chainLightning"){
  const first=target||enemies.filter(e=>e.alive).sort((a,b)=>dist(a,player)-dist(b,player))[0];
  if(first)[first,...enemies.filter(e=>e.alive&&e!==first&&dist(e,first)<5).slice(0,3)].forEach((e,i)=>setTimeout(()=>resolveSpellHit(e,s,Math.round((48+skills.magery.value*.3)*(1-i*.16)*power)),i*110));
  AudioSystem.lightning()
 }else if(s.offensive){
  if(target)launchHomingSpell(s,target,Math.round(damage*power));
  else{
   const l=Math.hypot(player.dirX,player.dirY)||1;
   projectiles.push({kind:"freeSpell",x:player.x,y:player.y,z:20,vx:player.dirX/l,vy:player.dirY/l,speed:11,range:18,traveled:0,life:3,color:"#ff874a",owner:"player",damage:Math.round(damage*power),poise:5})
  }
  if(["iceberg"].includes(id))AudioSystem.ice();else if(["spark","lightning"].includes(id))AudioSystem.lightning();else AudioSystem.fire()
 }
 gain(s.skill,.55,1);renderQuickbar()
};

// ---------- Autoataque arcano ----------
function shouldArcaneAutoAttack(){
 const w=currentWeapon(),o=player.equipment.offHand;
 return battleMode&&targetEnemy?.alive&&(w?.type==="staff"||o?.type==="grimoire")
}
function arcaneAutoAttack(){
 if(!shouldArcaneAutoAttack()||player.attackCd>0)return false;
 const e=targetEnemy;if(dist(player,e)>16)return false;
 player.attackCd=.72;player.castAnim=1;
 launchHomingSpell(spellDefs.arcaneBolt,e,Math.round(10+skills.magery.value*.16+player.attributes.intelligence*.08));
 player.mana=Math.max(0,player.mana-(skills.magery.value>=80?0:1));AudioSystem.tone(650,.08,"sine",.05,180,"magic");return true
}

// ---------- Área física ----------
function angleDiff(a,b){let d=Math.abs(a-b)%(Math.PI*2);return d>Math.PI?Math.PI*2-d:d}
function targetsForArea(primary,profile){
 const facing=Math.atan2(primary.y-player.y,primary.x-player.x);
 return enemies.filter(e=>e.alive&&e!==primary).filter(e=>{
  const dx=e.x-player.x,dy=e.y-player.y,d=Math.hypot(dx,dy);
  if(profile.type==="sweep")return d<=profile.radius&&angleDiff(Math.atan2(dy,dx),facing)<=profile.angle*Math.PI/360;
  if(profile.type==="impact")return dist(e,primary)<=profile.radius;
  if(profile.type==="line"){
   const ux=Math.cos(facing),uy=Math.sin(facing),along=dx*ux+dy*uy,side=Math.abs(dx*(-uy)+dy*ux);
   return along>0&&along<=profile.length&&side<=profile.width
  }
  return false
 }).sort((a,b)=>dist(a,player)-dist(b,player)).slice(0,profile.maxTargets-1)
}
const executeAttackV44base=executeAttack;
executeAttack=function(charged=false,manual=false){
 const e=validTarget(),w=currentWeapon(),profile=w?.areaProfile||itemDefs[w?.id]?.areaProfile;
 const beforeCd=player.attackCd;
 const ok=executeAttackV44base(charged,manual);
 if(ok){AudioSystem.sword();
  if(e&&profile){
   const secondary=targetsForArea(e,profile);
   secondary.forEach((x,i)=>{
    const mult=(profile.secondary?.[i]??.35)*(charged?1.15:1);
    const st=equipStats(),base=rand(st.damageMin,st.damageMax)+skills[currentCombatSkill()].value*.15;
    setTimeout(()=>damageEnemy(x,Math.round(base*mult),(st.poiseDamage||8)*mult),160)
   })
  }
 }
 return ok
};

// ---------- Especiales consumen maná y cooldown ----------
const useSpecialV44base=useSpecial;
useSpecial=function(level){
 const cfg=level===60?BALANCE.special60:BALANCE.special80;
 if(player.specialCooldowns[level]>0)return toast("La habilidad especial aún se está recuperando.");
 if(player.mana<cfg.mana)return toast("No tienes suficiente maná.");
 if(player.stamina<cfg.stamina)return toast("No tienes suficiente aguante.");
 player.mana-=cfg.mana;player.stamina-=cfg.stamina;
 player.specialCooldowns[level]=cfg.cooldown;
 useSpecialV44base(level);AudioSystem.impact()
};

// ---------- Pociones y acciones al moverse ----------
const potionV44base=potion;
potion=function(){
 if(player.potionCd>0)return toast(`Pociones disponibles en ${player.potionCd.toFixed(1)} s.`);
 const before=countItem("potion");potionV44base();
 if(countItem("potion")<before){player.potionCd=BALANCE.potionCooldown;AudioSystem.heal()}
};

// ---------- Actualización de temporizadores ----------
const updatePlayerV44base=updatePlayer;
updatePlayer=function(dt){
 updatePlayerV44base(dt);
 player.spellGlobalCd=Math.max(0,player.spellGlobalCd-dt);
 player.potionCd=Math.max(0,player.potionCd-dt);
 [60,80].forEach(l=>player.specialCooldowns[l]=Math.max(0,(player.specialCooldowns[l]||0)-dt));
 Object.keys(player.spellCooldowns).forEach(k=>player.spellCooldowns[k]=Math.max(0,player.spellCooldowns[k]-dt));
 const now=performance.now()/1000;
 Object.values(player.spellFatigue).forEach(v=>{if(now-v.last>BALANCE.fatigueDecay)v.stacks=0});
 if(shouldArcaneAutoAttack()&&!player.charging&&player.attackCd<=0)arcaneAutoAttack()
};

// ---------- HUD de cooldown y seis slots ----------
renderQuickbar=function(){
 document.querySelectorAll("#spellQuickbar button").forEach((b,i)=>{
  const id=player.equippedSpells[i],s=id?spellDefs[id]:null;
  const mask=b.querySelector(".cooldown-mask"),time=b.querySelector(".cooldown-time");
  b.querySelector("span").textContent=s?s.icon:"＋";b.querySelector("small").textContent=i+1;
  b.title=s?`${s.name} · ${s.cost} maná`:`Espacio ${i+1}`;
  const rem=id?spellCooldownRemaining(id):0,total=s?(s.cooldown||.35):1,pct=clamp(rem/total,0,1);
  if(mask)mask.style.transform=`scaleY(${pct})`;
  if(time)time.textContent=rem>0?(rem<1?rem.toFixed(1):Math.ceil(rem)):"";
  b.classList.toggle("cooldown",rem>0);
  b.classList.remove("fatigue-1","fatigue-2","fatigue-3");
  const f=id?fatigueLevel(id):0;if(f)b.classList.add(`fatigue-${f}`);
  b.classList.toggle("no-resource",!!s&&player.mana<Math.ceil(s.cost*(1+f*BALANCE.fatigueManaStep)))
 })
};
renderSpellbook=function(){
 const known=$("knownSpells");known.innerHTML="";
 player.knownSpells.forEach(id=>{
  const s=spellDefs[id];if(!s)return;const b=document.createElement("button");b.className="list-row";
  b.innerHTML=`<span>${s.icon}</span><div><strong>${s.name}</strong><small>${s.cost} maná · ${s.required?`Magia ${s.required}`:"Básico"}</small></div><b>Equipar</b>`;
  b.onclick=()=>{const free=player.equippedSpells.findIndex(x=>!x);player.equippedSpells[free>=0?free:0]=id;renderSpellbook();renderQuickbar()};known.appendChild(b)
 });
 const eq=$("equippedSpells");eq.innerHTML="";
 for(let i=0;i<6;i++){const id=player.equippedSpells[i],s=id?spellDefs[id]:null,b=document.createElement("button");b.innerHTML=s?`${s.icon}<br>${s.name}`:"＋ Vacío";b.onclick=()=>{player.equippedSpells[i]=null;renderSpellbook();renderQuickbar()};eq.appendChild(b)}
 const sl=$("scrollList");sl.innerHTML="";
 player.inventory.forEach((it,i)=>{if(it.type!=="scroll")return;const b=document.createElement("button");b.className="list-row";b.innerHTML=`<span>📜</span><div><strong>${it.name}</strong><small>${it.count} disponible(s)</small></div><b>Aprender</b>`;b.onclick=()=>learnScroll(i);sl.appendChild(b)})
};

// ---------- Retrato y oro ----------
function drawPortrait(){
 const c=$("portraitCanvas");if(!c)return;const x=c.getContext("2d");x.clearRect(0,0,c.width,c.height);
 const low=player.health/player.maxHealth<.25;x.fillStyle=low?"#491f24":"#1c2b32";x.fillRect(0,0,c.width,c.height);
 x.fillStyle="#d1ad87";x.beginPath();x.arc(28,23,12,0,Math.PI*2);x.fill();
 x.fillStyle="#392b22";x.beginPath();x.arc(28,18,12,Math.PI,Math.PI*2);x.fill();
 const head=player.equipment.head;if(head){x.fillStyle=head.id?.includes("mithril")?"#b9d9df":"#7d858a";x.fillRect(16,12,24,8)}
 x.fillStyle=player.equipment.chest?.id?.includes("dragon")?"#71393a":"#7b3d36";x.fillRect(15,34,26,20);
 if(player.notoriety>=10){x.strokeStyle="#d14949";x.lineWidth=3;x.strokeRect(1.5,1.5,53,53)}
}
const updateHudV44base=updateHud;
updateHud=function(){
 updateHudV44base();$("hudGold").textContent=`🪙 ${Math.floor(player.gold).toLocaleString("es-CL")}`;
 drawPortrait();renderQuickbar();
 const s60=$("special60"),s80=$("special80");
 [[s60,60],[s80,80]].forEach(([b,l])=>{
  if(!b)return;const rem=player.specialCooldowns[l]||0;
  b.style.filter=rem>0?"grayscale(1)":"";
  if(rem>0)b.querySelector("small").textContent=`${rem<1?rem.toFixed(1):Math.ceil(rem)} s`
 })
};

// ---------- Tienda con cantidad y slider ----------
let shopQuantity=1;
renderShop=function(){
 const list=$("shopList");list.innerHTML="";$("shopBuyTab").classList.toggle("active",currentShopMode==="buy");$("shopSellTab").classList.toggle("active",currentShopMode==="sell");
 const arr=currentShopMode==="buy"?shops[currentShop].items.map(id=>makeItem(id)):player.inventory;
 arr.forEach((it,i)=>{
  const r=document.createElement("button");r.className="list-row"+(selectedShop===i?" selected":"");
  const price=currentShopMode==="buy"?it.value:Math.max(1,Math.floor(it.value*.45));
  const owned=countItem(it.id),amount=it.stack?it.count:1;
  r.innerHTML=`<span>${it.icon}</span><div><strong class="rarity-${it.rarity}">${it.name}${amount>1?` ×${amount}`:""}</strong><small>${it.type}${currentShopMode==="buy"?` · <span class="shop-owned">Tienes: ${owned}</span>`:""}</small></div><b>${price} oro</b>`;
  r.onclick=()=>{selectedShop=i;shopQuantity=1;renderShop();renderShopDetails(i,it,price)};list.appendChild(r)
 })
};
function renderShopDetails(i,it,price){
 const max=currentShopMode==="sell"?(it.stack?it.count:1):Math.max(1,Math.min(99,Math.floor(player.gold/Math.max(1,price))));
 const canMulti=!!it.stack;
 $("shopDetails").innerHTML=itemHtml(it)+`<div class="stat"><span>Tienes</span><strong>${countItem(it.id)}</strong></div>`+
 (canMulti?`<div class="quantity-panel"><label>Cantidad</label><div class="quantity-row"><input id="shopQtyRange" type="range" min="1" max="${max}" value="1"><input id="shopQtyNumber" type="number" min="1" max="${max}" value="1"></div><div class="quantity-shortcuts"><button data-q="-10">−10</button><button data-q="-1">−1</button><button data-q="1">+1</button><button data-q="10">+10</button><button data-max>Máx.</button></div></div>`:"")+
 `<div class="stat"><span>Total</span><strong id="shopTotal">${price} oro</strong></div><div class="actions"><button id="shopAction">${currentShopMode==="buy"?"Comprar 1":"Vender 1"}</button></div>`;
 const update=q=>{shopQuantity=clamp(Math.round(q)||1,1,max);const range=$("shopQtyRange"),num=$("shopQtyNumber");if(range)range.value=shopQuantity;if(num)num.value=shopQuantity;$("shopTotal").textContent=`${price*shopQuantity} oro`;$("shopAction").textContent=`${currentShopMode==="buy"?"Comprar":"Vender"} ${shopQuantity} por ${price*shopQuantity} oro`};
 if(canMulti){$("shopQtyRange").oninput=e=>update(e.target.value);$("shopQtyNumber").oninput=e=>update(e.target.value);$("shopDetails").querySelectorAll("[data-q]").forEach(b=>b.onclick=()=>update(shopQuantity+Number(b.dataset.q)));$("shopDetails").querySelector("[data-max]").onclick=()=>update(max)}
 $("shopAction").onclick=()=>shopAction(i,it,price,shopQuantity)
}
shopAction=function(i,it,price,qty=1){
 const total=price*qty;
 if(currentShopMode==="buy"){
  if(player.gold<total)return toast("No tienes suficiente oro.");
  player.gold-=total;addItem(makeItem(it.id,{count:it.stack?qty:1}));toast(`Compraste ${qty} ${it.name}.`)
 }else{
  const available=player.inventory[i];if(!available)return;
  qty=Math.min(qty,available.stack?available.count:1);removeAmount(i,qty);player.gold+=price*qty;toast(`Vendiste ${qty} ${it.name}.`)
 }
 selectedShop=-1;renderShop();AudioSystem.uiClick()
};

// ---------- Ajustes simplificados ----------
settings.masterVolume=settings.masterVolume??.75;settings.effectsVolume=settings.effectsVolume??.8;settings.magicVolume=settings.magicVolume??.8;settings.uiVolume=settings.uiVolume??.55;settings.ambientVolume=settings.ambientVolume??.35;
function syncAudioSettings(){
 AudioSystem.enabled=settings.sound!==false;AudioSystem.master=settings.masterVolume;AudioSystem.effects=settings.effectsVolume;AudioSystem.magic=settings.magicVolume;AudioSystem.ui=settings.uiVolume;AudioSystem.ambient=settings.ambientVolume
}
renderSettings=function(tab="graphics"){
 document.querySelectorAll("[data-settings-tab]").forEach(b=>b.classList.toggle("active",b.dataset.settingsTab===tab));
 const c=$("settingsContent");
 if(tab==="graphics"){
  c.innerHTML=`<details class="setting-accordion" open><summary>Opciones gráficas</summary><div class="setting-group">
   <div class="setting-control"><span>Calidad general</span><select id="qualitySelect"><option value="low">Baja</option><option value="medium">Media</option><option value="high">Alta</option></select></div>
   <div class="setting-control"><span>Partículas</span><select id="particlesSelect"><option value="low">Bajas</option><option value="medium">Medias</option><option value="high">Altas</option></select></div>
   <div class="setting-control"><span>Nombres</span><select id="namesSelect"><option value="yes">Mostrar</option><option value="no">Ocultar</option></select></div>
   <div class="setting-control"><span>Barras de vida</span><select id="barsSelect"><option value="yes">Mostrar</option><option value="no">Ocultar</option></select></div>
  </div></details>`;
  $("qualitySelect").value=settings.quality||"high";$("particlesSelect").value=settings.particles||"high";$("namesSelect").value=settings.showNames?"yes":"no";$("barsSelect").value=settings.showBars?"yes":"no";
  $("qualitySelect").onchange=e=>settings.quality=e.target.value;$("particlesSelect").onchange=e=>settings.particles=e.target.value;$("namesSelect").onchange=e=>settings.showNames=e.target.value==="yes";$("barsSelect").onchange=e=>settings.showBars=e.target.value==="yes"
 }else if(tab==="audio"){
  const row=(id,name,val)=>`<div class="setting-control"><span>${name}</span><input id="${id}" type="range" min="0" max="1" step=".05" value="${val}"></div>`;
  c.innerHTML=`<details class="setting-accordion" open><summary>Audio</summary><div class="setting-group">
   <div class="setting-control"><span>Audio general</span><select id="soundSelect"><option value="on">Activado</option><option value="off">Silenciado</option></select></div>
   ${row("masterVol","Volumen general",settings.masterVolume)}${row("effectsVol","Armas y efectos",settings.effectsVolume)}${row("magicVol","Magia",settings.magicVolume)}${row("ambientVol","Ambiente",settings.ambientVolume)}${row("uiVol","Interfaz",settings.uiVolume)}
  </div></details>`;
  $("soundSelect").value=settings.sound===false?"off":"on";$("soundSelect").onchange=e=>{settings.sound=e.target.value==="on";syncAudioSettings()};
  [["masterVol","masterVolume"],["effectsVol","effectsVolume"],["magicVol","magicVolume"],["ambientVol","ambientVolume"],["uiVol","uiVolume"]].forEach(([id,key])=>$(id).oninput=e=>{settings[key]=Number(e.target.value);syncAudioSettings()})
 }else if(tab==="game"){
  c.innerHTML=`<details class="setting-accordion" open><summary>Partida</summary><div class="setting-group">
   <div class="setting-control"><span>Guardar ahora</span><button id="saveNow">Guardar</button></div>
   <div class="setting-control"><span>Instalar como app</span><button id="installHelp">Ver instrucciones</button></div>
   <div class="setting-control"><span>Controles PC</span><strong>WASD · Espacio · F · Q/E/R · 1–6 · Z/X</strong></div>
   <div class="setting-control"><span>Versión</span><strong>Proyecto Ultra V4.4</strong></div>
   <div class="setting-control"><span>Reiniciar partida</span><button id="resetGame" class="danger">Borrar progreso</button></div>
  </div></details>`;
  $("saveNow").onclick=()=>{save();toast("Partida guardada.")};$("installHelp").onclick=()=>toast("En iPhone: Compartir → Añadir a pantalla de inicio → Abrir como app web.");$("resetGame").onclick=()=>openPanel("confirmReset")
 }else{
  c.innerHTML=`<details class="setting-accordion" open><summary>Compendio</summary><div class="setting-group"><p>Usa los accesos de Criaturas, Armas, Armaduras y Materiales desde las secciones del juego. Los descubrimientos permanecen guardados.</p></div></details>`
 }
};

// ---------- Altura visible real del iPhone ----------
function updateAppHeight(){
 const h=window.visualViewport?.height||window.innerHeight;document.documentElement.style.setProperty("--app-height",`${h}px`)
}
updateAppHeight();addEventListener("resize",updateAppHeight);window.visualViewport?.addEventListener("resize",updateAppHeight);

// ---------- Guardado y migración ----------
const loadV44base=load;
load=function(){
 loadV44base();
 player.knownSpells=[...new Set([...(player.knownSpells||[]),"arcaneBolt","fireball","heal"])];
 player.equippedSpells=[...(player.equippedSpells||[]).slice(0,6)];while(player.equippedSpells.length<6)player.equippedSpells.push(null);
 player.spellCooldowns=player.spellCooldowns||{};player.spellFatigue=player.spellFatigue||{};player.spellGlobalCd=0;player.potionCd=player.potionCd||0;player.specialCooldowns=player.specialCooldowns||{60:0,80:0};
 (player.loadouts||[]).forEach(l=>{l.spells=[...(l.spells||[]).slice(0,6)];while(l.spells.length<6)l.spells.push(null)});
 syncAudioSettings()
};

// ---------- Enlaces y teclas 1–6 ----------
const bindV44base=bind;
bind=function(){
 bindV44base();
 document.querySelectorAll("[data-settings-tab]").forEach(b=>b.onclick=()=>renderSettings(b.dataset.settingsTab));
 document.querySelectorAll("[data-spell-slot]").forEach((b,i)=>b.onclick=()=>castSpell(player.equippedSpells[i]));
 addEventListener("keydown",e=>{
  if(["INPUT","SELECT","TEXTAREA"].includes(document.activeElement?.tagName))return;
  if(["5","6"].includes(e.key))castSpell(player.equippedSpells[Number(e.key)-1])
 });
 $("settingsButton").onclick=()=>{openPanel("settingsPanel");renderSettings("graphics")}
};

// Registrar service worker.
if("serviceWorker" in navigator)addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));

load();migratePlayer();bind();toggleBattleMode();toggleBattleMode();renderQuickbar();derived();requestAnimationFrame(loop);
})();