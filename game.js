"use strict";
const $=id=>document.getElementById(id);
const canvas=$("gameCanvas"),ctx=canvas.getContext("2d"),charCanvas=$("characterCanvas"),charCtx=charCanvas.getContext("2d"),mapCanvas=$("minimapCanvas"),mapCtx=mapCanvas.getContext("2d");
const WORLD=220,TW=40,TH=20,VIEW=34,LIMIT=30,SAVE="proyectoUltraV2",SPAWN={x:104,y:108};
let started=false,paused=false,last=0,touchId=null,selected=-1,selectedEquip=-1,currentCorpse=null,specialTimer=180,autosave=0,shake=0,hitStop=0;
const camera={x:0,y:0},stick={x:0,y:0};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),rand=(a,b)=>a+Math.random()*(b-a),choice=a=>a[Math.floor(Math.random()*a.length)],distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const screen=(x,y,z=0)=>({x:(x-y)*TW/2+innerWidth/2+camera.x,y:(x+y)*TH/2+innerHeight*.26+camera.y-z});
const skills={swords:s("Espadas"),tactics:s("Tácticas"),anatomy:s("Anatomía"),defense:s("Defensa"),endurance:s("Resistencia"),healing:s("Curación"),magery:s("Magia"),evaluating:s("Evaluar inteligencia"),meditation:s("Meditación"),magicResistance:s("Resistencia mágica"),inscription:s("Inscripción"),tailoring:s("Tailoring")};
function s(name){return{name,value:20,progress:0}}
const factions={guard:{name:"Guardia de Eldoria",value:0,desc:"Defiende ciudad y caminos."},hunters:{name:"Cazadores de no muertos",value:0,desc:"Combate cementerios y criptas."},arcane:{name:"Orden Arcana",value:0,desc:"Contiene la corrupción mágica."},rangers:{name:"Exploradores del Bosque",value:0,desc:"Vigila bestias y ruinas."}};
const quests=[
{id:"u1",faction:"hunters",name:"Silencio en el cementerio",desc:"Derrota 8 no muertos.",tag:"undead",goal:8,progress:0,rewardGold:180,rewardRep:18,status:"available"},
{id:"b1",faction:"guard",name:"Camino seguro",desc:"Derrota 6 criminales.",tag:"criminal",goal:6,progress:0,rewardGold:220,rewardRep:20,status:"available"},
{id:"f1",faction:"rangers",name:"Bestias descontroladas",desc:"Derrota 7 bestias.",tag:"beast",goal:7,progress:0,rewardGold:190,rewardRep:18,status:"available"},
{id:"c1",faction:"arcane",name:"La secta exterior",desc:"Derrota 5 cultistas.",tag:"cult",goal:5,progress:0,rewardGold:300,rewardRep:25,status:"available"}];
const templates={
oldSword:i("Espada vieja","🗡️","mainHand","arma",20,"#c6ccd4",{damageMin:5,damageMax:9}),
ironSword:i("Espada de hierro","⚔️","mainHand","arma",140,"#d7dbe0",{damageMin:9,damageMax:15,accuracy:3}),
axe:i("Hacha de saqueador","🪓","mainHand","arma",220,"#9d724a",{damageMin:12,damageMax:20}),
flameSword:i("Espada ígnea","🔥","mainHand","arma",900,"#ff6a2a",{damageMin:16,damageMax:25,accuracy:7}),
book:i("Grimorio gastado","📖","offHand","grimorio",25,"#6d4279",{magicPower:3}),
arcaneBook:i("Grimorio arcano","📘","offHand","grimorio",350,"#3f68bc",{magicPower:11,mana:14}),
leatherChest:i("Pechera de cuero","🥋","chest","armadura",80,"#8b5a36",{defense:4}),
ironChest:i("Pechera de hierro","🛡️","chest","armadura",280,"#7d8792",{defense:10,health:25}),
crimsonChest:i("Pechera carmesí","🛡️","chest","armadura",750,"#8b2638",{defense:16,health:40}),
leatherArms:i("Brazos de cuero","🥋","arms","armadura",65,"#875733",{defense:2}),
ironArms:i("Brazos de hierro","🛡️","arms","armadura",190,"#7d8790",{defense:5}),
gloves:i("Guantes de cuero","🧤","gloves","armadura",50,"#74452b",{defense:1,accuracy:2}),
mageGloves:i("Guantes arcanos","🧤","gloves","armadura",300,"#56408f",{defense:2,magicPower:5,healingPower:3}),
legs:i("Pantalones de cuero","👖","legs","armadura",75,"#5d412e",{defense:3}),
ironLegs:i("Grebas de hierro","👖","legs","armadura",230,"#69747d",{defense:7}),
boots:i("Botas de cuero","🥾","boots","armadura",55,"#4f3424",{defense:1,speed:.12}),
silverBoots:i("Botas plateadas","🥾","boots","armadura",320,"#9ba7b3",{defense:4,speed:.24}),
blueRobe:i("Túnica azul","👘","robe","túnica",180,"#305b9c",{magicPower:5,mana:10}),
healerRobe:i("Túnica del sanador","👘","robe","túnica",520,"#d6d0af",{magicPower:4,healingPower:10,mana:12}),
brownCloak:i("Capa de viajero","🧥","cloak","capa",120,"#6f4d35",{defense:2}),
blackCloak:i("Capa de sombra","🧥","cloak","capa",520,"#242630",{accuracy:6,speed:.18}),
whiteCloak:i("Capa honorable","🧥","cloak","capa",0,"#d8d4c8",{defense:5,healingPower:8}),
necklace:i("Collar de plata","📿","neck","joya",190,"#c7d0d8",{magicResistance:5}),
accuracyRing:i("Anillo del halcón","💍","ring","joya",360,"#d7b44f",{accuracy:8}),
vampireRing:i("Anillo carmesí","💍","ring","joya",900,"#a52a4c",{lifeSteal:.08,damageMin:2,damageMax:3}),
manaRing:i("Anillo de meditación","💍","ring","joya",520,"#5b6fd6",{mana:16,manaRegen:1.5}),
potion:i("Poción de curación","🧪",null,"consumible",35,"#d13f4e",{}),bone:i("Hueso antiguo","🦴",null,"material",14,"#d7d0b8",{}),hide:i("Piel resistente","🟫",null,"material",24,"#8b5a36",{}),fang:i("Colmillo","🦷",null,"material",28,"#e1d8bf",{}),venom:i("Glándula venenosa","🟢",null,"material",45,"#63a83f",{}),crystal:i("Cristal oscuro","🔮",null,"material",85,"#774db2",{}),insignia:i("Insignia criminal","🎖️",null,"trofeo",65,"#9b3838",{})
};
function i(name,icon,slot,type,value,color,stats){return{name,icon,slot,type,value,color,stats}}
function item(id){const t=templates[id];return{...t,id,uid:id+"-"+Date.now()+"-"+Math.random(),count:1,rarity:"common",buffs:[],quality:null,craftedBy:null,stats:{...t.stats}}}
const player={name:"Aldren",x:SPAWN.x,y:SPAWN.y,dirX:1,dirY:0,speed:4.1,health:220,maxHealth:220,mana:90,maxMana:90,stamina:100,maxStamina:100,gold:250,honor:0,attackCd:0,magicCd:0,healCd:0,invuln:0,attackAnim:0,magicAnim:0,healAnim:0,walkAnim:0,knockX:0,knockY:0,dialogue:"",dialogueTimer:0,attributes:{strength:50,dexterity:50,intelligence:20},attributeModes:{strength:"up",dexterity:"up",intelligence:"up"},knownSpells:["fireball","heal"],equippedSpells:["fireball","heal",null,null],inventory:[item("potion"),item("potion"),item("potion"),item("leatherChest"),item("gloves"),item("blueRobe"),item("brownCloak")],bank:[],equipment:{head:null,neck:null,chest:null,robe:null,cloak:null,arms:null,gloves:null,legs:null,boots:null,mainHand:item("oldSword"),offHand:item("book"),ring1:null,ring2:null}};
const cemetery={x:145,y:25,w:48,h:48,gateX:168,gateWidth:5},city={x:70,y:70,w:70,h:70};
const buildings=[b("bank","Banco de Eldoria",98,99,9,8,102,107,"#76634e","#3d4f65"),b("smith","Herrería",115,97,10,8,119,105,"#744f37","#5a2d28"),b("mage","Torre Arcana",82,96,9,10,86,106,"#554b73","#30274f"),b("armor","Armería",108,112,10,8,112,112,"#59626a","#3d464e"),b("tavern","Taberna",87,113,10,8,91,113,"#75543d","#59332b"),b("faction","Salón de las Facciones",97,84,13,8,103,92,"#635a4b","#4b3843")];
function b(id,name,x,y,w,h,doorX,doorY,wall,roof){return{id,name,x,y,w,h,doorX,doorY,wall,roof}}
const shops={weaponShop:{name:"Herrería del León",items:["ironSword","axe","flameSword"]},magicShop:{name:"Torre Arcana",items:["arcaneBook","mageGloves","manaRing","blueRobe","healerRobe"]},armorShop:{name:"Armería Real",items:["leatherChest","ironChest","crimsonChest","ironArms","ironLegs","silverBoots","necklace","brownCloak","blackCloak"]},generalShop:{name:"La Corona Dorada",items:["potion","potion","potion"]}};
const npcs=[n("Edwin, banquero",102,104,"bank","Tus pertenencias estarán seguras conmigo.","civilian"),n("Brom, herrero",119,102,"weaponShop","Tengo armas para todo tipo de guerrero.","civilian"),n("Selene, hechicera",86,102,"magicShop","Los secretos arcanos tienen un precio.","civilian"),n("Gareth, armero",112,116,"armorShop","Una armadura distinta cambia más que tu defensa.","civilian"),n("Mara, tabernera",91,117,"generalShop","Pociones y provisiones para el camino.","civilian"),n("Capitana Elira",101,88,"guardFaction","La Guardia recompensa a quienes limpian los caminos.","faction"),n("Hermano Vael",105,88,"hunterFaction","Los muertos vuelven a levantarse.","faction"),n("Maestra Lyra",101,90,"arcaneFaction","La corrupción arcana se extiende.","faction"),n("Rastreador Nym",105,90,"rangerFaction","El bosque está lleno de huellas peligrosas.","faction")];
function n(name,x,y,role,greeting,kind){return{name,x,y,spawnX:x,spawnY:y,role,greeting,kind,dialogue:"",dialogueTimer:0,anim:Math.random()*10,targetX:x,targetY:y,patrol:rand(1,4)}}
for(let k=0;k<20;k++)npcs.push(n(choice(["Ariana","Tomás","Helena","Dario","Iria","Nolan","Eva","Martín","Clara","Hugo"]),92+rand(0,28),93+rand(0,28),"ambient",choice(["Buen día.","La plaza está muy concurrida.","Las afueras son peligrosas.","Los comerciantes pagan bien."]),"civilian"));
for(let k=0;k<6;k++)npcs.push(n("Guardia "+(k+1),95+(k%3)*7,96+Math.floor(k/3)*14,"ambient","Mantén la paz.","guard"));
function type(id,name,tag,body,notoriety,hp,damage,speed,ai,loot,color,weapon=null){return{id,name,tag,body,notoriety,hp,damage,speed,ai,loot,color,weapon}}
const types=[
type("zombie","Zombi","undead","monster","gray",70,8,1.25,"melee","bone","#4f6844"),type("skeleton","Esqueleto","undead","monster","gray",62,9,1.55,"melee","bone","#b7b19d"),type("skeletonArcher","Arquero esqueleto","undead","monster","gray",55,10,1.35,"ranged","bone","#a8a28d"),type("ghoul","Necrófago","undead","monster","red",92,13,1.7,"melee","bone","#5d6b4b"),type("wraith","Espectro","undead","monster","red",105,15,1.45,"magic","crystal","#6e6d91"),type("darkMage","Mago oscuro","cult","human","red",95,16,1.2,"magic","crystal","#4e326a","staff"),type("necromancer","Nigromante","cult","human","red",145,21,1.1,"summoner","crystal","#632b68","staff"),type("graveKnight","Caballero sepulcral","undead","human","red",165,23,1.15,"heavy","insignia","#4e5359","sword"),
type("wolf","Lobo gris","beast","beast","gray",60,9,2,"pounce","fang","#71756c"),type("blackWolf","Lobo negro","beast","beast","red",82,12,2.1,"pounce","fang","#292d30"),type("bear","Oso pardo","beast","beast","gray",150,21,.95,"heavy","hide","#6f5039"),type("boar","Jabalí","beast","beast","gray",105,15,1.55,"charge","fang","#5b4938"),type("spider","Araña gigante","beast","beast","red",72,11,1.7,"poison","venom","#47553c"),type("serpent","Serpiente del bosque","beast","beast","red",55,10,1.8,"poison","venom","#507445"),
type("bandit","Bandido","criminal","human","gray",85,12,1.6,"melee","insignia","#724737","sword"),type("banditArcher","Arquero bandido","criminal","human","gray",75,13,1.45,"ranged","insignia","#6a553b","bow"),type("banditAxe","Saqueador con hacha","criminal","human","red",115,18,1.25,"heavy","insignia","#713b35","axe"),type("rogue","Pícaro renegado","criminal","human","red",78,14,2.05,"rogue","insignia","#3b4147","dagger"),type("deserter","Soldado desertor","criminal","human","gray",125,17,1.35,"melee","insignia","#55616b","sword"),type("mercenary","Mercenario rojo","criminal","human","red",155,22,1.35,"heavy","insignia","#7b3030","mace"),type("exileMage","Mago exiliado","cult","human","red",100,18,1.2,"magic","crystal","#3b4d7c","staff"),type("cultist","Cultista","cult","human","red",88,14,1.45,"melee","crystal","#5d334b","dagger"),type("cultArcher","Vigía del culto","cult","human","red",82,15,1.35,"ranged","crystal","#593548","bow"),type("cultHealer","Sanador corrupto","cult","human","red",90,11,1.15,"healer","crystal","#66536f","staff"),type("stoneGolem","Gólem de piedra","construct","monster","red",220,27,.75,"heavy","crystal","#77766d"),type("fireImp","Diablillo de fuego","demon","monster","red",68,15,1.9,"magic","crystal","#a64c2e"),type("troll","Trol de las ruinas","monster","monster","red",260,30,.75,"regenerator","hide","#58694b"),type("swampWitch","Bruja del pantano","cult","human","red",120,20,1.05,"magic","venom","#4e674b","staff"),type("drowned","Ahogado","undead","monster","gray",95,14,1.15,"melee","bone","#47646c"),type("assassin","Asesino buscado","criminal","human","red",135,25,1.95,"rogue","insignia","#292b31","dagger"),type("captain","Capitán bandido","criminal","human","red",230,30,1.3,"captain","insignia","#883c31","sword"),type("elemental","Elemental antiguo","construct","monster","red",240,29,.9,"magic","crystal","#5c7f93")];
const enemies=[],projectiles=[],enemyProjectiles=[],particles=[],texts=[],corpses=[];
function spawn(id,x,y,level=1,special=false){const t=types.find(v=>v.id===id),scale=1+(level-1)*.12;enemies.push({type:t,x,y,spawnX:x,spawnY:y,level,health:Math.round(t.hp*scale),maxHealth:Math.round(t.hp*scale),damage:Math.round(t.damage*scale),speed:t.speed,alive:true,respawn:0,attackCd:rand(0,1),castCd:rand(1,3),special,dialogue:"",dialogueTimer:0,anim:Math.random()*10,hitFlash:0,knockX:0,knockY:0,loot:[]})}
const groups=[["zombie",151,34,6],["skeleton",162,36,5],["skeletonArcher",180,42,3],["ghoul",154,57,3],["wraith",181,60,2],["darkMage",170,52,2],["necromancer",186,32,1],["graveKnight",188,67,1],["wolf",48,108,5],["blackWolf",38,95,3],["bear",45,75,2],["boar",55,140,4],["spider",35,130,4],["serpent",58,55,3],["bandit",150,105,5],["banditArcher",162,111,3],["banditAxe",174,103,2],["rogue",156,126,2],["deserter",138,142,3],["mercenary",171,138,2],["exileMage",55,170,2],["cultist",65,178,4],["cultArcher",76,171,2],["cultHealer",82,184,1],["stoneGolem",38,180,1],["fireImp",92,188,3],["troll",198,118,1],["swampWitch",192,155,1],["drowned",202,168,4],["assassin",187,96,1],["captain",168,120,1],["elemental",110,196,1]];
groups.forEach(([id,x,y,c])=>{for(let q=0;q<c;q++)spawn(id,x+rand(-5,5),y+rand(-5,5),1+Math.floor(q/3))});
const decor=[];for(let k=0;k<180;k++){const x=rand(12,WORLD-12),y=rand(12,WORLD-12);if(x>62&&x<148&&y>62&&y<148)continue;decor.push({x,y,type:choice(["tree","tree","bush","rock"])})}for(let k=0;k<44;k++)decor.push({x:85+rand(0,45),y:85+rand(0,45),type:choice(["barrel","crate","lamp","bench","cart"])});
function resize(){const d=Math.min(devicePixelRatio||1,2);canvas.width=innerWidth*d;canvas.height=innerHeight*d;canvas.style.width=innerWidth+"px";canvas.style.height=innerHeight+"px";ctx.setTransform(d,0,0,d,0,0)}
function gate(x,y){return y===cemetery.y+cemetery.h-1&&x>=cemetery.gateX&&x<cemetery.gateX+cemetery.gateWidth}
function tile(x,y){if(x<5||y<5||x>WORLD-6||y>WORLD-6)return"water";if(x>=cemetery.x&&x<cemetery.x+cemetery.w&&y>=cemetery.y&&y<cemetery.y+cemetery.h){const edge=x===cemetery.x||y===cemetery.y||x===cemetery.x+cemetery.w-1||y===cemetery.y+cemetery.h-1;if(edge&&!gate(x,y))return"wall";return x%6===0||y%6===0||gate(x,y)?"gravePath":"grave"}if(Math.abs(x-104)<=2||Math.abs(y-106)<=2||Math.abs(x-74)<=1||Math.abs(x-137)<=1||Math.abs(y-74)<=1||Math.abs(y-140)<=1)return"road";if(x>94&&x<114&&y>96&&y<116)return"plaza";if(x<65&&y>145)return"ruins";if(x>180&&y>145)return"swamp";return"grass"}
function inside(e,b){return e.x>b.x+.55&&e.y>b.y+.55&&e.x<b.x+b.w-.55&&e.y<b.y+b.h-.55}
function blocked(x,y){const t=tile(Math.floor(x),Math.floor(y));if(t==="water"||t==="wall")return true;for(const b of buildings){const bounds=x>=b.x&&y>=b.y&&x<b.x+b.w&&y<b.y+b.h;if(!bounds)continue;const door=Math.hypot(x-b.doorX,y-b.doorY)<1.25,interior=x>b.x+.55&&y>b.y+.55&&x<b.x+b.w-.55&&y<b.y+b.h-.55;if(!interior&&!door)return true}return false}
function equipStats(){const o={damageMin:1,damageMax:3,defense:0,accuracy:0,magicPower:0,magicResistance:0,health:0,mana:0,speed:0,manaRegen:0,lifeSteal:0,healingPower:0};Object.values(player.equipment).filter(Boolean).forEach(it=>Object.entries(it.stats).forEach(([k,v])=>o[k]=(o[k]||0)+v));return o}
function stats(){const e=equipStats();return{damageMin:e.damageMin+skills.tactics.value*.09,damageMax:e.damageMax+skills.tactics.value*.15+skills.anatomy.value*.05,defense:e.defense+skills.defense.value*.2,accuracy:clamp(38+skills.swords.value*.55+e.accuracy,30,96),magicPower:5+skills.magery.value*.2+skills.evaluating.value*.12+e.magicPower,magicAccuracy:clamp(42+skills.magery.value*.5+skills.evaluating.value*.14,35,97),magicResistance:e.magicResistance+skills.magicResistance.value*.2,manaRegen:1.8+skills.meditation.value*.06+e.manaRegen,lifeSteal:e.lifeSteal,healingPower:e.healingPower}}
function derived(){const e=equipStats();player.maxHealth=190+skills.endurance.value*1.5+e.health;player.maxMana=65+skills.magery.value*1.1+e.mana;player.speed=4.1+e.speed;player.health=Math.min(player.health,player.maxHealth);player.mana=Math.min(player.mana,player.maxMana)}
function msg(t){$("messageBox").textContent=t}function speak(e,t){e.dialogue=t;e.dialogueTimer=3.2}function toast(t){const d=document.createElement("div");d.className="skill-toast";d.textContent=t;$("skillToasts").appendChild(d);setTimeout(()=>d.remove(),2800)}
function gain(id,effort,difficulty=1){const sk=skills[id];if(sk.value>=100)return;sk.progress+=effort*clamp(difficulty-(sk.value-20)/120,.12,1)*rand(.65,1.15);if(sk.progress>=1){sk.progress-=1;sk.value=Math.min(100,Math.round((sk.value+.1)*10)/10);toast(sk.name+" aumentó a "+sk.value.toFixed(1))}}
function updatePlayer(dt){const len=Math.hypot(stick.x,stick.y);let mx=0,my=0;if(len>.08&&!panelOpen()){mx=(stick.y+stick.x)/Math.max(1,len);my=(stick.y-stick.x)/Math.max(1,len)}if(mx||my){player.dirX=mx;player.dirY=my;const nx=player.x+mx*player.speed*dt+player.knockX*dt,ny=player.y+my*player.speed*dt+player.knockY*dt;if(!blocked(nx,player.y))player.x=nx;if(!blocked(player.x,ny))player.y=ny;player.walkAnim+=dt*10}player.knockX*=Math.pow(.02,dt);player.knockY*=Math.pow(.02,dt);const st=stats();player.mana=Math.min(player.maxMana,player.mana+st.manaRegen*dt);player.stamina=Math.min(player.maxStamina,player.stamina+12*dt);player.attackCd=Math.max(0,player.attackCd-dt);player.magicCd=Math.max(0,player.magicCd-dt);player.healCd=Math.max(0,player.healCd-dt);player.invuln=Math.max(0,player.invuln-dt);player.attackAnim=Math.max(0,player.attackAnim-dt*4.8);player.magicAnim=Math.max(0,player.magicAnim-dt*3.5);player.healAnim=Math.max(0,player.healAnim-dt*2.8);player.dialogueTimer=Math.max(0,player.dialogueTimer-dt);const tx=-((player.x-player.y)*TW/2),ty=-((player.x+player.y)*TH/2)+innerHeight*.18;camera.x+=(tx-camera.x)*dt*5;camera.y+=(ty-camera.y)*dt*5}
function updateNpcs(dt){npcs.forEach(n=>{n.anim+=dt*2;n.dialogueTimer=Math.max(0,n.dialogueTimer-dt);if(n.role!=="ambient")return;n.patrol-=dt;if(n.patrol<=0){n.patrol=rand(2,5);n.targetX=n.spawnX+rand(-4,4);n.targetY=n.spawnY+rand(-4,4)}const d=Math.hypot(n.targetX-n.x,n.targetY-n.y);if(d>.2){const dx=(n.targetX-n.x)/d,dy=(n.targetY-n.y)/d,nx=n.x+dx*.7*dt,ny=n.y+dy*.7*dt;if(!blocked(nx,n.y))n.x=nx;if(!blocked(n.x,ny))n.y=ny}})}
function move(e,tx,ty,dt,m=1){const d=Math.hypot(tx-e.x,ty-e.y);if(d<.02)return;const dx=(tx-e.x)/d,dy=(ty-e.y)/d,nx=e.x+dx*e.speed*m*dt+e.knockX*dt,ny=e.y+dy*e.speed*m*dt+e.knockY*dt;if(!blocked(nx,e.y))e.x=nx;if(!blocked(e.x,ny))e.y=ny;e.knockX*=Math.pow(.03,dt);e.knockY*=Math.pow(.03,dt)}
function updateEnemies(dt){enemies.forEach(e=>{if(!e.alive){e.respawn-=dt;if(e.respawn<=0){e.alive=true;e.health=e.maxHealth;e.x=e.spawnX+rand(-2,2);e.y=e.spawnY+rand(-2,2);e.loot=[]}return}e.anim+=dt*4;e.hitFlash=Math.max(0,e.hitFlash-dt);e.attackCd=Math.max(0,e.attackCd-dt);e.castCd=Math.max(0,e.castCd-dt);e.dialogueTimer=Math.max(0,e.dialogueTimer-dt);if(e.type.ai==="regenerator")e.health=Math.min(e.maxHealth,e.health+dt*2);if(e.type.ai==="healer"&&e.castCd<=0){const a=enemies.find(x=>x.alive&&x!==e&&distance(x,e)<5&&x.health<x.maxHealth*.7);if(a){a.health=Math.min(a.maxHealth,a.health+25);float(a.x,a.y,"+25","#78e39c");e.castCd=4}}const d=distance(e,player),home=Math.hypot(e.x-e.spawnX,e.y-e.spawnY);if(home>16){move(e,e.spawnX,e.spawnY,dt);return}if(d>11)return;if(["ranged","magic","summoner","healer"].includes(e.type.ai)){if(d<3.4)move(e,e.x-(player.x-e.x),e.y-(player.y-e.y),dt);else if(d>6.2)move(e,player.x,player.y,dt);if(d<7&&e.castCd<=0){enemyAttack(e,true);e.castCd=e.type.ai==="ranged"?1.8:2.3}}else{if(d>1.1)move(e,player.x,player.y,dt,e.type.ai==="rogue"?1.18:1);if(d<=1.25&&e.attackCd<=0){enemyAttack(e,false);e.attackCd=e.type.ai==="heavy"?1.55:e.type.ai==="rogue"?.7:1.05}}});specialTimer-=dt;if(specialTimer<=0&&!enemies.some(e=>e.special&&e.alive)){spawn("captain",181,118,3,true);const e=enemies.at(-1);e.type={...e.type,name:"Varek, señor de los caminos"};e.maxHealth=e.health=420;e.damage=35;e.loot=[item("flameSword"),item("blackCloak")];speak(e,"Tu honor no te salvará.");msg("Un enemigo especial apareció en el campamento bandido.");specialTimer=260}}
function enemyAttack(e,ranged){if(ranged){const d=distance(e,player);enemyProjectiles.push({x:e.x,y:e.y,dx:(player.x-e.x)/d,dy:(player.y-e.y)/d,speed:e.type.ai==="ranged"?7:5,damage:e.damage,life:2.2,color:e.type.ai==="ranged"?"#c8b07b":"#7d52d3"})}else{damagePlayer(e.damage,e.type.ai==="magic",e);shake=Math.max(shake,e.type.ai==="heavy"?5:2)}}
function nearest(max){let n=null,d0=Infinity;enemies.forEach(e=>{if(!e.alive)return;const d=distance(player,e);if(d<max&&d<d0){n=e;d0=d}});return n}
function attack(){if(!started||paused||panelOpen()||player.attackCd>0)return;const st=stats(),target=nearest(1.65);if(!target){player.attackAnim=1;speak(player,"No tengo un enemigo al alcance.");return}if(player.stamina<9){speak(player,"Necesito recuperar el aliento.");return}player.stamina-=9;player.attackCd=.58;player.attackAnim=1;gain("swords",.7,target.level);gain("tactics",.45,target.level);if(Math.random()*100>st.accuracy){float(target.x,target.y,"Evadido","#ddd");burst(target.x,target.y,"#d8e0e8",7);return}const crit=Math.random()<.1+skills.anatomy.value*.0015,dmg=Math.round(rand(st.damageMin,st.damageMax)*(crit?1.65:1));gain("anatomy",crit?.55:.25,target.level);damageEnemy(target,dmg,crit);if(st.lifeSteal)player.health=Math.min(player.maxHealth,player.health+dmg*st.lifeSteal)}
function magic(){if(!started||paused||panelOpen()||player.magicCd>0)return;const target=nearest(8);if(!target){speak(player,"No tengo un objetivo mágico.");return}if(player.mana<16){speak(player,"Necesito más maná.");return}player.mana-=16;player.magicCd=.8;player.magicAnim=1;const st=stats(),d=distance(player,target);projectiles.push({x:player.x,y:player.y,dx:(target.x-player.x)/d,dy:(target.y-player.y)/d,speed:8,life:1.7,damage:st.magicPower+rand(4,10),accuracy:st.magicAccuracy,color:"#ff8a35"});gain("magery",.75,target.level);gain("inscription",.15,target.level)}
function heal(){if(!started||paused||panelOpen()||player.healCd>0)return;if(player.health>=player.maxHealth){speak(player,"Mi salud ya está completa.");return}if(player.mana<18){speak(player,"Necesito más maná.");return}player.mana-=18;player.healCd=8;player.healAnim=1;const st=stats(),amount=Math.round(rand(24,34)+skills.healing.value*.35+skills.magery.value*.12+st.healingPower);player.health=Math.min(player.maxHealth,player.health+amount);float(player.x,player.y,"+"+amount,"#76e89b");burst(player.x,player.y,"#76e89b",18);gain("healing",.8);gain("magery",.18)}
function damageEnemy(e,amount,crit=false){e.health-=amount;e.hitFlash=.14;const d=distance(player,e)||1;e.knockX=(e.x-player.x)/d*(crit?2.5:1.3);e.knockY=(e.y-player.y)/d*(crit?2.5:1.3);float(e.x,e.y,crit?"CRÍTICO "+amount:"-"+amount,crit?"#ffd36f":"#ffd0a0");burst(e.x,e.y,crit?"#ffd46f":"#d8e0e8",crit?16:8);shake=Math.max(shake,crit?7:3);hitStop=crit?.06:.025;if(e.health<=0)kill(e)}
function kill(e){if(!e.alive)return;e.health=0;e.alive=false;e.respawn=e.special?300:120;e.loot=e.loot.length?e.loot:loot(e);corpses.push({x:e.x,y:e.y,enemy:e,life:300});const gold=e.special?260:Math.round(rand(8,36));player.gold+=gold;if(["red","gray"].includes(e.type.notoriety)){const honor=e.type.notoriety==="red"?3:1;player.honor+=honor;const f=e.type.tag==="undead"?"hunters":e.type.tag==="criminal"?"guard":e.type.tag==="cult"?"arcane":"rangers";const rep=e.type.notoriety==="red"?4:2;factions[f].value+=rep;toast("Honor +"+honor+" · "+factions[f].name+" +"+rep)}quests.forEach(q=>{if(q.status==="active"&&q.tag===e.type.tag){q.progress=Math.min(q.goal,q.progress+1);if(q.progress>=q.goal){q.status="ready";toast("Misión completada: "+q.name)}}});burst(e.x,e.y,e.type.color,24);msg(e.type.name+" derrotado. Ganaste "+gold+" oro.")}
function loot(e){const a=[item(e.type.loot)];if(e.type.body==="human"&&Math.random()<.35)a.push(item(e.type.weapon==="axe"?"axe":e.type.weapon==="staff"?"arcaneBook":"ironSword"));if(Math.random()<.22)a.push(item("potion"));return a}
function damagePlayer(amount,magical,source){if(player.invuln>0)return;const st=stats(),red=magical?st.magicResistance*.004:st.defense*.005,dmg=Math.max(1,Math.round(amount*(1-clamp(red,0,.58))));player.health-=dmg;player.invuln=.38;float(player.x,player.y,"-"+dmg,"#ff8c8c");gain(magical?"magicResistance":"defense",.55,source?.level||1);gain("endurance",.18,source?.level||1);if(source){const d=distance(player,source)||1;player.knockX=(player.x-source.x)/d*1.8;player.knockY=(player.y-source.y)/d*1.8}if(player.health<=0){player.health=player.maxHealth;player.mana=player.maxMana;player.stamina=player.maxStamina;player.x=SPAWN.x;player.y=SPAWN.y;player.invuln=3;player.knockX=player.knockY=0;msg("Has reaparecido junto al banco. Conservas todo tu equipo y objetos.");speak(player,"He regresado a Eldoria.")}}
function potion(){if(player.health>=player.maxHealth){speak(player,"Mi salud ya está completa.");return}const ix=player.inventory.findIndex(v=>v.id==="potion");if(ix<0){speak(player,"No tengo pociones.");return}player.inventory.splice(ix,1);const amount=Math.round(48+skills.healing.value*.5);player.health=Math.min(player.maxHealth,player.health+amount);float(player.x,player.y,"+"+amount,"#76e89b");burst(player.x,player.y,"#76e89b",15);gain("healing",.6)}
function updateProjectiles(dt){for(let q=projectiles.length-1;q>=0;q--){const p=projectiles[q];p.x+=p.dx*p.speed*dt;p.y+=p.dy*p.speed*dt;p.life-=dt;let h=false;for(const e of enemies)if(e.alive&&distance(p,e)<.55){if(Math.random()*100<=p.accuracy){damageEnemy(e,Math.round(p.damage),Math.random()<.12);gain("evaluating",.45,e.level)}else float(e.x,e.y,"Resistido","#cfc6ff");h=true;break}if(h||p.life<=0||blocked(p.x,p.y))projectiles.splice(q,1)}for(let q=enemyProjectiles.length-1;q>=0;q--){const p=enemyProjectiles[q];p.x+=p.dx*p.speed*dt;p.y+=p.dy*p.speed*dt;p.life-=dt;if(distance(p,player)<.55){damagePlayer(p.damage,true,null);enemyProjectiles.splice(q,1);continue}if(p.life<=0||blocked(p.x,p.y))enemyProjectiles.splice(q,1)}}
function burst(x,y,color,count){for(let q=0;q<count;q++)particles.push({x,y,color,ox:0,oy:0,vx:rand(-60,60),vy:rand(-110,-25),life:rand(.35,1),max:1,size:rand(2,6)})}function float(x,y,text,color){texts.push({x,y,text,color,oy:0,life:1})}
function effects(dt){for(let q=particles.length-1;q>=0;q--){const p=particles[q];p.ox+=p.vx*dt;p.oy+=p.vy*dt;p.vy+=120*dt;p.life-=dt;if(p.life<=0)particles.splice(q,1)}for(let q=texts.length-1;q>=0;q--){const t=texts[q];t.oy-=28*dt;t.life-=dt;if(t.life<=0)texts.splice(q,1)}for(let q=corpses.length-1;q>=0;q--){corpses[q].life-=dt;if(corpses[q].life<=0)corpses.splice(q,1)}}
function nearbyNpc(){return npcs.find(n=>distance(n,player)<1.45)}function nearbyCorpse(){return corpses.find(c=>distance(c,player)<1.4&&c.enemy.loot.length)}
function interact(){if(panelOpen())return;const n=nearbyNpc();if(n){speak(n,n.greeting);if(n.role==="bank")openBank();else if(shops[n.role])openShop(n.role);else if(n.role.endsWith("Faction"))openFaction(n.role);return}const c=nearbyCorpse();if(c){openLoot(c);return}speak(player,"No hay nada cerca para usar.")}
function zone(){const b=buildings.find(v=>inside(player,v));if(b)return{name:b.name,desc:"Interior del edificio."};if(player.x>=cemetery.x&&player.x<cemetery.x+cemetery.w&&player.y>=cemetery.y&&player.y<cemetery.y+cemetery.h)return{name:"Cementerio de los Caídos",desc:"Zona de no muertos."};if(player.x<65&&player.y>145)return{name:"Ruinas del Culto",desc:"Magia corrupta y gólems."};if(player.x>180&&player.y>145)return{name:"Pantano Hundido",desc:"Brujas y ahogados."};if(player.x>city.x&&player.x<city.x+city.w&&player.y>city.y&&player.y<city.y+city.h)return{name:"Ciudad de Eldoria",desc:"Zona segura y comercial."};return{name:"Tierras exteriores",desc:"Criminales, bestias y monstruos."}}
function updateUI(){derived();const z=zone(),st=stats();$("healthFill").style.width=player.health/player.maxHealth*100+"%";$("manaFill").style.width=player.mana/player.maxMana*100+"%";$("staminaFill").style.width=player.stamina/player.maxStamina*100+"%";$("healthText").textContent=Math.ceil(player.health)+"/"+Math.ceil(player.maxHealth);$("manaText").textContent=Math.ceil(player.mana)+"/"+Math.ceil(player.maxMana);$("staminaText").textContent=Math.ceil(player.stamina)+"/"+Math.ceil(player.maxStamina);$("goldText").textContent=player.gold+" oro";$("zoneName").textContent=z.name;$("zoneDescription").textContent=z.desc;$("potionCount").textContent=player.inventory.filter(v=>v.id==="potion").length;$("playerTitle").textContent=player.honor>=80?"Campeón honorable":player.honor>=30?"Defensor reconocido":"Aprendiz aventurero";$("statDamage").textContent=Math.round(st.damageMin)+"–"+Math.round(st.damageMax);$("statDefense").textContent=Math.round(st.defense);$("statAccuracy").textContent=Math.round(st.accuracy)+"%";$("statMagic").textContent=Math.round(st.magicPower)}
function hint(){const t=nearbyNpc()?"Hablar / comerciar":nearbyCorpse()?"Revisar botín":"";$("interactionHint").classList.toggle("hidden",!t);$("interactionHint").textContent=t}
function panelOpen(){return[...document.querySelectorAll(".panel-overlay")].some(p=>!p.classList.contains("hidden"))}function closePanels(){document.querySelectorAll(".panel-overlay").forEach(p=>p.classList.add("hidden"));resetStick()}
const labels={damageMin:"Daño mín.",damageMax:"Daño máx.",defense:"Defensa",accuracy:"Precisión",magicPower:"Poder mágico",magicResistance:"Resistencia mágica",health:"Vida",mana:"Maná",speed:"Velocidad",manaRegen:"Reg. maná",lifeSteal:"Robo de vida",healingPower:"Curación"};
function statHtml(it){return Object.entries(it.stats).map(([k,v])=>'<div class="stat-line"><span>'+labels[k]+'</span><strong>+'+(k==="lifeSteal"?Math.round(v*100)+"%":v)+'</strong></div>').join("")||"<p>Sin bonificaciones.</p>"}
function slotButton(it,ix,sel,fn){const b=document.createElement("button");b.className="item-slot"+(sel===ix?" selected":"");b.innerHTML="<span>"+it.icon+"</span><small>"+it.name+"</small>";b.onclick=()=>fn(ix,it);return b}
function renderGrid(id,equip=false){const g=$(id);g.innerHTML="";player.inventory.forEach((it,ix)=>g.appendChild(slotButton(it,ix,equip?selectedEquip:selected,(n,v)=>{if(equip){selectedEquip=n;renderGrid(id,true);equipDetails(v)}else{selected=n;renderGrid(id,false);invDetails(v)}})));for(let q=player.inventory.length;q<LIMIT;q++){const d=document.createElement("div");d.className="item-slot";d.style.opacity=".22";g.appendChild(d)}$("inventoryCapacity").textContent=player.inventory.length+" / "+LIMIT;$("equipmentCapacity").textContent=player.inventory.length+" / "+LIMIT;$("inventoryGold").textContent=player.gold+" oro"}
function invDetails(it){$("inventoryDetails").innerHTML="<h3>"+it.name+"</h3><p>"+it.type+"</p>"+statHtml(it)+'<div class="detail-actions">'+(it.slot?'<button id="equipInv">Equipar</button>':it.id==="potion"?'<button id="usePot">Usar</button>':"")+'<button id="dropInv" class="danger">Soltar</button></div>';if($("equipInv"))$("equipInv").onclick=()=>equipItem(selected,false);if($("usePot"))$("usePot").onclick=potion;$("dropInv").onclick=()=>{player.inventory.splice(selected,1);selected=-1;renderGrid("inventoryGrid")}}
function equipDetails(it){$("equipmentDetails").innerHTML='<h3>'+it.name+'</h3><p style="color:'+it.color+'">Apariencia: '+it.color+"</p>"+statHtml(it)+(it.slot?'<div class="detail-actions"><button id="equipEq">Equipar</button></div>':"");if($("equipEq"))$("equipEq").onclick=()=>equipItem(selectedEquip,true)}
function targetSlot(it){if(it.slot!=="ring")return it.slot;return !player.equipment.ring1?"ring1":!player.equipment.ring2?"ring2":"ring1"}
function equipItem(ix,equipView){const it=player.inventory[ix];if(!it||!it.slot)return;const slot=targetSlot(it),old=player.equipment[slot];player.equipment[slot]=it;player.inventory.splice(ix,1);if(old)player.inventory.push(old);selected=selectedEquip=-1;renderEquipment();renderGrid(equipView?"equipmentInventoryGrid":"inventoryGrid",equipView);drawPreview();updateUI()}
function unequip(slot){const it=player.equipment[slot];if(!it||player.inventory.length>=LIMIT)return;player.inventory.push(it);player.equipment[slot]=null;renderEquipment();renderGrid("equipmentInventoryGrid",true);drawPreview()}
function renderEquipment(){Object.entries(player.equipment).forEach(([s,it])=>{$("slot-"+s).textContent=it?it.name:"Vacío"})}
function renderSkills(){$("skillsList").innerHTML=Object.values(skills).map(v=>'<div class="skill-row"><div><strong>'+v.name+'</strong><small>'+v.value.toFixed(1)+'</small></div><div class="progress-track"><div class="progress-fill" style="width:'+v.value+'%"></div></div><strong>'+v.value.toFixed(1)+"</strong></div>").join("")}
function rank(v){return v>=100?"Exaltado":v>=70?"Campeón":v>=45?"Honorable":v>=25?"Aliado":v>=10?"Reconocido":"Desconocido"}
function renderFactions(){$("honorValue").textContent=player.honor;$("factionsList").innerHTML=Object.values(factions).map(f=>'<div class="faction-row"><div><strong>'+f.name+'</strong><small>'+f.desc+'</small></div><div class="progress-track"><div class="progress-fill" style="width:'+clamp(f.value,0,100)+'%"></div></div><strong>'+f.value+" · "+rank(f.value)+"</strong></div>").join("")}
function renderQuests(){$("questsList").innerHTML=quests.map(q=>'<div class="quest-row"><div><strong>'+q.name+'</strong><small>'+q.desc+'</small></div><div><small>'+q.progress+"/"+q.goal+'</small><div class="progress-track"><div class="progress-fill" style="width:'+q.progress/q.goal*100+'%"></div></div></div><strong>'+({available:"Disponible",active:"Activa",ready:"Lista",completed:"Completada"}[q.status])+"</strong></div>").join("")}
function openShop(role){const sh=shops[role];closePanels();$("shopPanel").classList.remove("hidden");$("shopTitle").textContent=sh.name;$("shopItems").innerHTML="";sh.items.forEach(id=>{const it=item(id),r=document.createElement("div");r.className="shop-row";r.innerHTML="<span>"+it.icon+"</span><div><strong>"+it.name+"</strong><small>"+it.value+' oro</small></div><button>Ver</button>';r.querySelector("button").onclick=()=>{$("shopDetails").innerHTML="<h3>"+it.name+"</h3>"+statHtml(it)+'<div class="detail-actions"><button id="buy">Comprar por '+it.value+"</button></div>";$("buy").onclick=()=>{if(player.inventory.length>=LIMIT)return speak(player,"Mi mochila está llena.");if(player.gold<it.value)return speak(player,"No tengo suficiente oro.");player.gold-=it.value;player.inventory.push(item(id));updateUI()}};$("shopItems").appendChild(r)})}
function factionRole(r){return{guardFaction:"guard",hunterFaction:"hunters",arcaneFaction:"arcane",rangerFaction:"rangers"}[r]}
function openFaction(role){const id=factionRole(role),f=factions[id];closePanels();$("factionPanel").classList.remove("hidden");$("factionTitle").textContent=f.name;$("factionDetails").innerHTML="<h3>"+f.name+"</h3><p>Reputación: "+f.value+" ("+rank(f.value)+")</p><p>Honor: "+player.honor+"</p>";$("factionOptions").innerHTML="";quests.filter(q=>q.faction===id).forEach(q=>{const r=document.createElement("div");r.className="quest-row";r.innerHTML="<div><strong>"+q.name+"</strong><small>"+q.desc+"</small></div><span>"+q.progress+"/"+q.goal+"</span><button>"+(q.status==="available"?"Aceptar":q.status==="ready"?"Entregar":q.status==="active"?"Activa":"Completada")+"</button>";r.querySelector("button").onclick=()=>{if(q.status==="available"){q.status="active";toast("Misión aceptada: "+q.name)}else if(q.status==="ready"){q.status="completed";player.gold+=q.rewardGold;f.value+=q.rewardRep;toast("Recompensa: "+q.rewardGold+" oro y "+q.rewardRep+" reputación")}openFaction(role);renderQuests()};$("factionOptions").appendChild(r)})}
function openBank(){closePanels();$("bankPanel").classList.remove("hidden");renderBank()}function renderBank(){const a=$("bankInventory"),b=$("bankStorage");a.innerHTML=b.innerHTML="";player.inventory.forEach((it,ix)=>a.appendChild(slotButton(it,ix,-1,()=>{player.bank.push(player.inventory.splice(ix,1)[0]);renderBank()})));player.bank.forEach((it,ix)=>b.appendChild(slotButton(it,ix,-1,()=>{if(player.inventory.length<LIMIT){player.inventory.push(player.bank.splice(ix,1)[0]);renderBank()}})))}
function openLoot(c){currentCorpse=c;closePanels();$("lootPanel").classList.remove("hidden");renderLoot()}function renderLoot(){const g=$("lootItems");g.innerHTML="";if(!currentCorpse)return;currentCorpse.enemy.loot.forEach((it,ix)=>{const r=document.createElement("div");r.className="shop-row";r.innerHTML="<span>"+it.icon+"</span><div><strong>"+it.name+"</strong><small>"+it.type+"</small></div><button>Recoger</button>";r.querySelector("button").onclick=()=>{if(player.inventory.length<LIMIT){player.inventory.push(currentCorpse.enemy.loot.splice(ix,1)[0]);renderLoot()}};g.appendChild(r)})}
function drawTile(x,y,t){const p=screen(x,y),colors={grass:(x+y)%2?"#304a38":"#36543d",road:(x+y)%2?"#5f5d58":"#6b6862",plaza:"#787269",grave:"#303832",gravePath:"#555650",wall:"#45484a",water:"#1d4053",ruins:"#49443e",swamp:"#30433a"};ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x+TW/2,p.y+TH/2);ctx.lineTo(p.x,p.y+TH);ctx.lineTo(p.x-TW/2,p.y+TH/2);ctx.closePath();ctx.fillStyle=colors[t];ctx.fill();ctx.strokeStyle="#0002";ctx.stroke();if(t==="wall"){ctx.fillStyle="#67696a";ctx.fillRect(p.x-7,p.y-18,14,20);ctx.fillStyle="#888";ctx.fillRect(p.x-9,p.y-19,18,4)}}
function drawDecor(d){const p=screen(d.x,d.y);if(d.type==="tree"){ctx.fillStyle="#3e2c22";ctx.fillRect(p.x-2,p.y-24,4,26);ctx.fillStyle="#294532";ctx.beginPath();ctx.arc(p.x,p.y-31,13,0,Math.PI*2);ctx.fill()}else if(d.type==="bush"){ctx.fillStyle="#2d4933";ctx.beginPath();ctx.arc(p.x,p.y-7,7,0,Math.PI*2);ctx.fill()}else if(d.type==="rock"){ctx.fillStyle="#656762";ctx.beginPath();ctx.ellipse(p.x,p.y-4,7,5,0,0,Math.PI*2);ctx.fill()}else{ctx.fillStyle=d.type==="lamp"?"#333":"#735039";ctx.fillRect(p.x-5,p.y-13,10,13);if(d.type==="lamp"){ctx.fillStyle="#f2c769";ctx.beginPath();ctx.arc(p.x,p.y-16,4,0,Math.PI*2);ctx.fill()}}}
function drawBuilding(b){for(let y=b.y;y<b.y+b.h;y++)for(let x=b.x;x<b.x+b.w;x++)drawTile(x,y,"plaza");const a=screen(b.x,b.y),r=screen(b.x+b.w,b.y),bt=screen(b.x+b.w,b.y+b.h),l=screen(b.x,b.y+b.h),at=screen(b.x,b.y,46),rt=screen(b.x+b.w,b.y,46),btt=screen(b.x+b.w,b.y+b.h,46),lt=screen(b.x,b.y+b.h,46),insideNow=inside(player,b);ctx.save();ctx.globalAlpha=insideNow?.18:1;ctx.fillStyle=b.wall;[[a,r,rt,at],[r,bt,btt,rt],[bt,l,lt,btt]].forEach(poly=>{ctx.beginPath();ctx.moveTo(poly[0].x,poly[0].y);poly.slice(1).forEach(v=>ctx.lineTo(v.x,v.y));ctx.closePath();ctx.fill()});if(!insideNow){ctx.fillStyle=b.roof;ctx.beginPath();ctx.moveTo(at.x,at.y);ctx.lineTo(rt.x,rt.y);ctx.lineTo(btt.x,btt.y);ctx.lineTo(lt.x,lt.y);ctx.closePath();ctx.fill()}ctx.restore()}
function humanoid(e,color,enemy=false){const p=screen(e.x,e.y),bob=Math.sin(e.anim||player.walkAnim)*1.5,isP=e===player,cloak=isP?player.equipment.cloak?.color:null;ctx.fillStyle="#0006";ctx.beginPath();ctx.ellipse(p.x,p.y+3,10,4,0,0,Math.PI*2);ctx.fill();if(cloak){ctx.fillStyle=cloak;ctx.beginPath();ctx.moveTo(p.x,p.y-34+bob);ctx.lineTo(p.x+13,p.y-9);ctx.lineTo(p.x,p.y-2);ctx.lineTo(p.x-13,p.y-9);ctx.closePath();ctx.fill()}const chest=isP?(player.equipment.robe?.color||player.equipment.chest?.color||color):color,legs=isP?(player.equipment.legs?.color||"#332f47"):color,arms=isP?(player.equipment.arms?.color||chest):color,gloves=isP?(player.equipment.gloves?.color||"#6d4a32"):color,boots=isP?(player.equipment.boots?.color||"#3d2d23"):color;ctx.fillStyle=boots;ctx.fillRect(p.x-7,p.y-3,5,6);ctx.fillRect(p.x+2,p.y-3,5,6);ctx.fillStyle=legs;ctx.fillRect(p.x-8,p.y-14,6,12);ctx.fillRect(p.x+2,p.y-14,6,12);ctx.fillStyle=e.hitFlash>0?"#fff":chest;ctx.beginPath();ctx.moveTo(p.x,p.y-35+bob);ctx.lineTo(p.x+12,p.y-13);ctx.lineTo(p.x-12,p.y-13);ctx.closePath();ctx.fill();ctx.fillStyle=arms;ctx.fillRect(p.x-16,p.y-29+bob,5,18);ctx.fillRect(p.x+11,p.y-29+bob,5,18);ctx.fillStyle=gloves;ctx.beginPath();ctx.arc(p.x-14,p.y-10,3,0,Math.PI*2);ctx.arc(p.x+14,p.y-10,3,0,Math.PI*2);ctx.fill();ctx.fillStyle=enemy?"#a78b73":"#d5aa82";ctx.beginPath();ctx.arc(p.x,p.y-41+bob,6,0,Math.PI*2);ctx.fill();if(isP){ctx.save();ctx.translate(p.x+9,p.y-23+bob);ctx.rotate(player.attackAnim>0?-1.8+(1-player.attackAnim)*2.8:-.65);ctx.strokeStyle=player.equipment.mainHand?.color||"#ddd";ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,-22);ctx.stroke();ctx.restore()}if(enemy){ctx.fillStyle="#000b";ctx.fillRect(p.x-15,p.y-57,30,4);ctx.fillStyle=e.type.notoriety==="red"?"#c34646":"#929292";ctx.fillRect(p.x-15,p.y-57,30*e.health/e.maxHealth,4)}speech(e,p)}
function monster(e){const p=screen(e.x,e.y);ctx.fillStyle="#0006";ctx.beginPath();ctx.ellipse(p.x,p.y+2,12,5,0,0,Math.PI*2);ctx.fill();ctx.fillStyle=e.hitFlash>0?"#fff":e.type.color;if(e.type.body==="beast"){ctx.beginPath();ctx.ellipse(p.x,p.y-12,14,8,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(p.x+10,p.y-18,6,0,Math.PI*2);ctx.fill();ctx.fillRect(p.x-10,p.y-8,3,10);ctx.fillRect(p.x+6,p.y-8,3,10)}else{ctx.beginPath();ctx.arc(p.x,p.y-19,11,0,Math.PI*2);ctx.fill();ctx.fillRect(p.x-9,p.y-18,18,18)}ctx.fillStyle="#000b";ctx.fillRect(p.x-15,p.y-43,30,4);ctx.fillStyle=e.type.notoriety==="red"?"#c34646":"#929292";ctx.fillRect(p.x-15,p.y-43,30*e.health/e.maxHealth,4);speech(e,p)}
function speech(e,p){if(!e.dialogue||e.dialogueTimer<=0)return;ctx.font="9px sans-serif";const w=Math.max(ctx.measureText(e.dialogue).width,ctx.measureText(e.name||e.type?.name||player.name).width)+12;ctx.fillStyle="#050709dd";ctx.fillRect(p.x-w/2,p.y-72,w,29);ctx.textAlign="center";ctx.fillStyle="#eadbb3";ctx.fillText(e.dialogue,p.x,p.y-59);ctx.fillStyle="#fff";ctx.font="bold 8px sans-serif";ctx.fillText(e.name||e.type?.name||player.name,p.x,p.y-47)}
function drawProjectiles(){projectiles.forEach(p=>{const s=screen(p.x,p.y,16);ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(s.x,s.y,6,0,Math.PI*2);ctx.fill()});enemyProjectiles.forEach(p=>{const s=screen(p.x,p.y,16);ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(s.x,s.y,5,0,Math.PI*2);ctx.fill()})}
function drawEffects(){particles.forEach(p=>{const s=screen(p.x,p.y,14);ctx.globalAlpha=clamp(p.life,0,1);ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(s.x+p.ox,s.y+p.oy,p.size/2,0,Math.PI*2);ctx.fill()});ctx.globalAlpha=1;ctx.textAlign="center";ctx.font="bold 12px sans-serif";texts.forEach(t=>{const s=screen(t.x,t.y,48);ctx.globalAlpha=t.life;ctx.fillStyle=t.color;ctx.fillText(t.text,s.x,s.y+t.oy)});ctx.globalAlpha=1}
function draw(){ctx.clearRect(0,0,innerWidth,innerHeight);ctx.fillStyle="#0b1117";ctx.fillRect(0,0,innerWidth,innerHeight);const sx=clamp(Math.floor(player.x-VIEW),0,WORLD-1),ex=clamp(Math.ceil(player.x+VIEW),0,WORLD-1),sy=clamp(Math.floor(player.y-VIEW),0,WORLD-1),ey=clamp(Math.ceil(player.y+VIEW),0,WORLD-1);ctx.save();if(shake>0){ctx.translate(rand(-shake,shake),rand(-shake,shake));shake*=.82}for(let d=sx+sy;d<=ex+ey;d++)for(let x=sx;x<=ex;x++){const y=d-x;if(y>=sy&&y<=ey)drawTile(x,y,tile(x,y))}const r=[];decor.forEach(o=>{if(Math.abs(o.x-player.x)<VIEW&&Math.abs(o.y-player.y)<VIEW)r.push({d:o.x+o.y,f:()=>drawDecor(o)})});buildings.forEach(o=>{if(Math.abs(o.x-player.x)<VIEW+15&&Math.abs(o.y-player.y)<VIEW+15)r.push({d:o.x+o.y+o.w+o.h,f:()=>drawBuilding(o)})});npcs.forEach(o=>{if(Math.abs(o.x-player.x)<VIEW&&Math.abs(o.y-player.y)<VIEW)r.push({d:o.x+o.y,f:()=>humanoid(o,o.kind==="guard"?"#4d6273":o.kind==="faction"?"#6a4f71":"#865f42")})});enemies.forEach(o=>{if(o.alive&&Math.abs(o.x-player.x)<VIEW&&Math.abs(o.y-player.y)<VIEW)r.push({d:o.x+o.y,f:()=>o.type.body==="human"?humanoid(o,o.type.color,true):monster(o)})});corpses.forEach(c=>{if(Math.abs(c.x-player.x)<VIEW&&Math.abs(c.y-player.y)<VIEW)r.push({d:c.x+c.y-.1,f:()=>{const s=screen(c.x,c.y);ctx.fillStyle="#312c2a";ctx.beginPath();ctx.ellipse(s.x,s.y,10,4,0,0,Math.PI*2);ctx.fill();if(c.enemy.loot.length){ctx.fillStyle="#e4bd65";ctx.fillText("✦",s.x,s.y-8)}}})});r.push({d:player.x+player.y,f:()=>humanoid(player,"#274c72")});r.sort((a,b)=>a.d-b.d).forEach(o=>o.f());drawProjectiles();drawEffects();ctx.restore()}
function drawPreview(){charCtx.clearRect(0,0,210,260);charCtx.fillStyle="#111820";charCtx.fillRect(0,0,210,260);const chest=player.equipment.robe?.color||player.equipment.chest?.color||"#274c72",cloak=player.equipment.cloak?.color,legs=player.equipment.legs?.color||"#332f47",arms=player.equipment.arms?.color||chest,gloves=player.equipment.gloves?.color||"#6d4a32",boots=player.equipment.boots?.color||"#3d2d23";if(cloak){charCtx.fillStyle=cloak;charCtx.beginPath();charCtx.moveTo(105,65);charCtx.lineTo(155,195);charCtx.lineTo(55,195);charCtx.closePath();charCtx.fill()}charCtx.fillStyle=boots;charCtx.fillRect(78,210,18,28);charCtx.fillRect(114,210,18,28);charCtx.fillStyle=legs;charCtx.fillRect(78,160,18,55);charCtx.fillRect(114,160,18,55);charCtx.fillStyle=chest;charCtx.beginPath();charCtx.moveTo(105,70);charCtx.lineTo(150,175);charCtx.lineTo(60,175);charCtx.closePath();charCtx.fill();charCtx.fillStyle=arms;charCtx.fillRect(52,92,16,88);charCtx.fillRect(142,92,16,88);charCtx.fillStyle=gloves;charCtx.beginPath();charCtx.arc(60,180,10,0,Math.PI*2);charCtx.arc(150,180,10,0,Math.PI*2);charCtx.fill();charCtx.fillStyle="#d5aa82";charCtx.beginPath();charCtx.arc(105,58,24,0,Math.PI*2);charCtx.fill();charCtx.strokeStyle=player.equipment.mainHand?.color||"#ddd";charCtx.lineWidth=7;charCtx.beginPath();charCtx.moveTo(150,135);charCtx.lineTo(182,45);charCtx.stroke();charCtx.fillStyle="#eadbb3";charCtx.textAlign="center";charCtx.font="bold 15px Georgia";charCtx.fillText("Aldren",105,252)}
function drawMap(){const sx=mapCanvas.width/WORLD,sy=mapCanvas.height/WORLD;mapCtx.clearRect(0,0,mapCanvas.width,mapCanvas.height);for(let y=0;y<WORLD;y+=2)for(let x=0;x<WORLD;x+=2){const t=tile(x,y),c={grass:"#38543c",road:"#716d65",plaza:"#8a857b",grave:"#343934",gravePath:"#5d5c56",wall:"#57595b",water:"#24485c",ruins:"#544d44",swamp:"#30483e"};mapCtx.fillStyle=c[t];mapCtx.fillRect(x*sx,y*sy,sx*2+1,sy*2+1)}mapCtx.fillStyle="#fff";mapCtx.beginPath();mapCtx.arc(player.x*sx,player.y*sy,4,0,Math.PI*2);mapCtx.fill()}
function save(){localStorage.setItem(SAVE,JSON.stringify({player:{x:player.x,y:player.y,health:player.health,mana:player.mana,stamina:player.stamina,gold:player.gold,honor:player.honor,inventory:player.inventory,bank:player.bank,equipment:player.equipment},skills,factions,quests}))}
function load(){try{const d=JSON.parse(localStorage.getItem(SAVE));if(!d)return;Object.assign(player,d.player||{});Object.keys(d.skills||{}).forEach(k=>Object.assign(skills[k],d.skills[k]));Object.keys(d.factions||{}).forEach(k=>Object.assign(factions[k],d.factions[k]));(d.quests||[]).forEach(q=>{const l=quests.find(v=>v.id===q.id);if(l)Object.assign(l,q)})}catch(e){}}
function orientation(){const p=innerHeight>innerWidth;$("rotateScreen").classList.toggle("hidden",!p);paused=p;if(p)resetStick()}
function moveStick(cx,cy){const r=$("joystick").getBoundingClientRect(),mx=r.left+r.width/2,my=r.top+r.height/2,max=r.width*.34;let dx=cx-mx,dy=cy-my,l=Math.hypot(dx,dy);if(l>max){dx=dx/l*max;dy=dy/l*max}stick.x=dx/max;stick.y=dy/max;$("joystickKnob").style.transform="translate("+dx+"px,"+dy+"px)"}
function resetStick(){touchId=null;stick.x=stick.y=0;$("joystickKnob").style.transform="translate(0,0)"}
$("joystick").addEventListener("touchstart",e=>{e.preventDefault();if(touchId!==null)return;const t=e.changedTouches[0];touchId=t.identifier;moveStick(t.clientX,t.clientY)},{passive:false});$("joystick").addEventListener("touchmove",e=>{e.preventDefault();const t=[...e.touches].find(v=>v.identifier===touchId);if(t)moveStick(t.clientX,t.clientY)},{passive:false});$("joystick").addEventListener("touchend",e=>{e.preventDefault();if([...e.changedTouches].some(v=>v.identifier===touchId))resetStick()},{passive:false});
function tap(id,fn){let touched=false,b=$(id);b.addEventListener("touchstart",e=>{e.preventDefault();touched=true;fn()},{passive:false});b.addEventListener("touchend",e=>{e.preventDefault();setTimeout(()=>touched=false,220)},{passive:false});b.addEventListener("click",e=>{e.preventDefault();if(!touched)fn()})}
tap("startButton",()=>{if(started)return;started=true;$("startScreen").classList.add("hidden");$("hud").classList.remove("hidden");last=performance.now();requestAnimationFrame(loop)});tap("attackButton",()=>attack());tap("magicButton",()=>magic());tap("healButton",()=>heal());tap("interactButton",()=>interact());tap("potionButton",()=>potion());tap("inventoryButton",()=>{closePanels();$("inventoryPanel").classList.remove("hidden");selected=-1;renderGrid("inventoryGrid")});tap("equipmentButton",()=>{closePanels();$("equipmentPanel").classList.remove("hidden");selectedEquip=-1;renderEquipment();renderGrid("equipmentInventoryGrid",true);drawPreview()});tap("skillsButton",()=>{closePanels();$("skillsPanel").classList.remove("hidden");renderSkills()});tap("factionsButton",()=>{closePanels();$("factionsPanel").classList.remove("hidden");renderFactions()});tap("questsButton",()=>{closePanels();$("questsPanel").classList.remove("hidden");renderQuests()});tap("mapButton",()=>{closePanels();$("mapPanel").classList.remove("hidden");drawMap()});
document.querySelectorAll("[data-close]").forEach(b=>b.onclick=closePanels);document.querySelectorAll(".equipment-slot").forEach(b=>b.onclick=()=>unequip(b.dataset.slot));$("takeAllLoot").onclick=()=>{if(!currentCorpse)return;while(currentCorpse.enemy.loot.length&&player.inventory.length<LIMIT)player.inventory.push(currentCorpse.enemy.loot.shift());renderLoot()};
function loop(t){let dt=Math.min(Math.max((t-last)/1000,0),.033);last=t;if(hitStop>0){hitStop-=dt;dt=0}if(!paused){updatePlayer(dt);updateNpcs(dt);updateEnemies(dt);updateProjectiles(dt);effects(dt);autosave+=dt;if(autosave>12){autosave=0;save()}}updateUI();hint();draw();requestAnimationFrame(loop)}
addEventListener("resize",()=>{resize();orientation()});addEventListener("orientationchange",()=>setTimeout(()=>{resize();orientation()},250));document.addEventListener("visibilitychange",()=>{if(document.hidden){resetStick();save()}last=performance.now()});canvas.addEventListener("contextmenu",e=>e.preventDefault());
resize();load();orientation();derived();updateUI();renderEquipment();renderSkills();renderFactions();renderQuests();drawPreview();draw();


// ==================== PROYECTO ULTRA V3 ====================
const STACKABLE_TYPES=new Set(["consumible","material","trofeo","misión","recurso","pergamino"]);
const RARITIES=[
 {id:"common",name:"Común",color:"#e4e4e4",min:0,max:1},
 {id:"uncommon",name:"Poco común",color:"#69c77b",min:1,max:2},
 {id:"rare",name:"Raro",color:"#62a4ef",min:2,max:3},
 {id:"epic",name:"Épico",color:"#be77ef",min:3,max:4},
 {id:"legendary",name:"Legendario",color:"#f2a142",min:4,max:5}
];
const SPELLS={
 fireball:{name:"Bola de fuego",icon:"🔥",school:"Fuego",skill:"magery",required:0,cost:16,cooldown:.8},
 heal:{name:"Curación",icon:"✚",school:"Curación",skill:"healing",required:0,cost:18,cooldown:8},
 iceNova:{name:"Nova de hielo",icon:"❄️",school:"Hielo",skill:"magery",required:60,cost:32,cooldown:10},
 chainLightning:{name:"Cadena de relámpagos",icon:"⚡",school:"Energía",skill:"magery",required:80,cost:45,cooldown:14},
 regeneration:{name:"Regeneración",icon:"🌿",school:"Curación",skill:"healing",required:60,cost:28,cooldown:14},
 vitalShield:{name:"Escudo vital",icon:"🟢",school:"Protección",skill:"healing",required:80,cost:42,cooldown:18}
};
const scrollTemplateData={
 scrollIce:{name:"Pergamino: Nova de hielo",spell:"iceNova"},
 scrollLightning:{name:"Pergamino: Cadena de relámpagos",spell:"chainLightning"},
 scrollRegeneration:{name:"Pergamino: Regeneración",spell:"regeneration"},
 scrollShield:{name:"Pergamino: Escudo vital",spell:"vitalShield"}
};
Object.entries(scrollTemplateData).forEach(([id,d])=>templates[id]=i(d.name,"📜",null,"pergamino",120,"#d9c38c",{}));
templates.rawHide=i("Piel sin tratar","🟫",null,"material",15,"#8b5a36",{});
templates.treatedLeather=i("Cuero tratado","🟤",null,"material",35,"#81502f",{});
templates.thickLeather=i("Cuero resistente","🟫",null,"material",65,"#60412c",{});
templates.commonCloth=i("Tela común","🧶",null,"material",18,"#bda883",{});
templates.fineCloth=i("Tela fina","🧵",null,"material",48,"#d8cec0",{});
templates.shadowCloth=i("Tela sombría","🧵",null,"material",105,"#3b3447",{});
templates.leatherHelmet=i("Casco de cuero","⛑️","head","armadura",95,"#815131",{defense:3});
templates.leatherBootsCraft=i("Botas de cuero tratadas","🥾","boots","armadura",110,"#70452b",{defense:3});
templates.fineRobe=i("Túnica de tela fina","👘","robe","túnica",260,"#b9b3a7",{magicPower:6,mana:10});
templates.shadowCloak=i("Capa sombría","🧥","cloak","capa",640,"#302a3c",{accuracy:5,magicResistance:5});
templates.accuracyRing=i("Anillo del halcón","💍","ring","joya",360,"#d7b44f",{});
templates.vampireRing=i("Anillo carmesí","💍","ring","joya",900,"#a52a4c",{});

const BUFF_POOL={
 weapon:[["damagePercent","Daño físico",6,20],["critical","Crítico",4,14],["lifeSteal","Robo de vida",5,20],["attackSpeed","Velocidad de ataque",5,16],["accuracyPercent","Precisión",5,18],["armorIgnore","Ignorar armadura",4,16]],
 armor:[["healthPercent","Vida máxima",6,20],["healthRegen","Regeneración de vida",6,22],["physicalResist","Resistencia física",5,18],["magicResistPercent","Resistencia mágica",5,18],["staminaRegen","Regeneración de aguante",5,18]],
 gloves:[["accuracyPercent","Precisión",5,18],["critical","Crítico",4,14],["attackSpeed","Velocidad de ataque",5,16],["damagePercent","Daño físico",5,15],["healingPercent","Curación",6,20]],
 boots:[["moveSpeed","Velocidad de movimiento",4,14],["evasion","Evasión",4,14],["staminaRegen","Regeneración de aguante",6,20],["physicalResist","Resistencia física",4,12]],
 cloth:[["manaPercent","Maná máximo",6,22],["manaRegenPercent","Regeneración de maná",8,24],["magicDamage","Daño mágico",6,20],["healingPercent","Curación",6,20],["magicResistPercent","Resistencia mágica",5,18]],
 ring:[["manaRegenPercent","Regeneración de maná",10,24],["manaPercent","Maná máximo",10,22],["healthRegen","Regeneración de vida",10,24],["lifeSteal","Robo de vida",8,20],["damagePercent","Daño físico",5,16],["magicDamage","Daño mágico",5,18],["critical","Crítico",4,14],["evasion","Evasión",4,14],["healingPercent","Curación",6,20]]
};
function isStackable(it){return !!it&&STACKABLE_TYPES.has(it.type)}
function stackKey(it){return it.id+"|"+JSON.stringify(it.stats||{})}
function inventorySpaceFor(it,container=player.inventory){return isStackable(it)&&container.some(x=>isStackable(x)&&stackKey(x)===stackKey(it))||container.length<LIMIT}
function addItem(it,container=player.inventory){
 if(!it)return false;
 it.count=Math.max(1,it.count||1);
 if(isStackable(it)){
  const found=container.find(x=>isStackable(x)&&stackKey(x)===stackKey(it));
  if(found){found.count=(found.count||1)+it.count;return true}
 }
 if(container===player.inventory&&container.length>=LIMIT)return false;
 container.push(it);return true
}
function removeItemAmount(container,index,amount=1){
 const it=container[index];if(!it)return null;
 if(isStackable(it)&&(it.count||1)>amount){it.count-=amount;const copy={...it,count:amount,uid:it.id+"-"+Date.now()+"-"+Math.random()};return copy}
 return container.splice(index,1)[0]
}
function normalizeStacks(container){
 const out=[];for(const raw of container||[]){raw.count=Math.max(1,raw.count||1);if(isStackable(raw)){const f=out.find(x=>stackKey(x)===stackKey(raw));if(f){f.count+=raw.count;continue}}out.push(raw)}return out
}
function buffGroup(it){
 if(it.slot==="ring")return"ring";if(it.slot==="mainHand")return"weapon";if(it.slot==="gloves")return"gloves";if(it.slot==="boots")return"boots";if(["robe","cloak"].includes(it.slot))return"cloth";return"armor"
}
function rollBuffs(it,count){
 const pool=[...(BUFF_POOL[buffGroup(it)]||BUFF_POOL.armor)],used=new Set();it.buffs=[];
 for(let k=0;k<count&&pool.length;k++){let ix=Math.floor(Math.random()*pool.length),b=pool.splice(ix,1)[0];if(used.has(b[0]))continue;used.add(b[0]);it.buffs.push({id:b[0],name:b[1],value:Math.round(rand(b[2],b[3]))})}
 return it
}
function chooseRarity(power=1){
 const r=Math.random(),elite=power>=3;
 if(elite&&r<.08)return RARITIES[4];if(r<.04*power)return RARITIES[3];if(r<.14*power)return RARITIES[2];if(r<.42)return RARITIES[1];return RARITIES[0]
}
function enhanceLootEquipment(it,power=1){
 if(!it.slot)return it;const rarity=chooseRarity(power);it.rarity=rarity.id;it.color=rarity.color;
 const count=rarity.min===rarity.max?rarity.min:Math.floor(rand(rarity.min,rarity.max+1));
 rollBuffs(it,count);return it
}
function buffValue(id){let total=0;Object.values(player.equipment).filter(Boolean).forEach(it=>(it.buffs||[]).forEach(b=>{if(b.id===id)total+=b.value}));return total}
function itemDescription(it){
 let h=statHtml(it);
 if(it.rarity)h='<div class="stat-line"><span>Rareza</span><strong class="rarity-'+it.rarity+'">'+(RARITIES.find(r=>r.id===it.rarity)?.name||it.rarity)+'</strong></div>'+h;
 if(it.quality)h+='<div class="stat-line"><span>Calidad</span><strong>'+it.quality+'</strong></div>';
 (it.buffs||[]).forEach(b=>h+='<div class="stat-line"><span>'+b.name+'</span><strong>+'+b.value+'%</strong></div>');
 if(it.craftedBy)h+='<p><strong>Confeccionado por '+it.craftedBy+'</strong></p>';
 return h
}
function slotButton(it,ix,sel,fn){
 const b=document.createElement("button");b.className="item-slot"+(sel===ix?" selected":"");
 b.innerHTML="<span>"+it.icon+"</span><small class='rarity-"+(it.rarity||"common")+"'>"+it.name+"</small>"+(isStackable(it)&&it.count>1?"<b class='stack-count'>×"+it.count+"</b>":"");
 b.onclick=()=>fn(ix,it);return b
}
function renderGrid(id,equip=false){
 const g=$(id);g.innerHTML="";
 player.inventory.forEach((it,ix)=>g.appendChild(slotButton(it,ix,equip?selectedEquip:selected,(n,v)=>{if(equip){selectedEquip=n;renderGrid(id,true);equipDetails(v)}else{selected=n;renderGrid(id,false);invDetails(v)}})));
 for(let q=player.inventory.length;q<LIMIT;q++){const d=document.createElement("div");d.className="item-slot";d.style.opacity=".22";g.appendChild(d)}
 $("inventoryCapacity").textContent=player.inventory.length+" / "+LIMIT;$("equipmentCapacity").textContent=player.inventory.length+" / "+LIMIT;$("inventoryGold").textContent=player.gold+" oro"
}
function invDetails(it){
 const learn=isScroll(it)?'<button id="learnScroll">Añadir al spellbook</button>':"";
 $("inventoryDetails").innerHTML="<h3 class='rarity-"+(it.rarity||"common")+"'>"+it.name+"</h3><p>"+it.type+(isStackable(it)?" · "+it.count+" unidades":"")+"</p>"+itemDescription(it)+'<div class="detail-actions">'+learn+(it.slot?'<button id="equipInv">Equipar</button>':it.id==="potion"?'<button id="usePot">Usar</button>':"")+'<button id="dropInv" class="danger">Soltar</button></div>';
 if($("equipInv"))$("equipInv").onclick=()=>equipItem(selected,false);if($("usePot"))$("usePot").onclick=potion;if($("learnScroll"))$("learnScroll").onclick=()=>learnScrollAt(selected);
 $("dropInv").onclick=()=>{removeItemAmount(player.inventory,selected,isStackable(it)?1:999);selected=-1;renderGrid("inventoryGrid")}
}
function equipDetails(it){$("equipmentDetails").innerHTML='<h3 class="rarity-'+(it.rarity||"common")+'">'+it.name+"</h3>"+itemDescription(it)+(it.slot?'<div class="detail-actions"><button id="equipEq">Equipar</button></div>':"");if($("equipEq"))$("equipEq").onclick=()=>equipItem(selectedEquip,true)}
function potion(){
 if(player.health>=player.maxHealth){speak(player,"Mi salud ya está completa.");return}
 const ix=player.inventory.findIndex(v=>v.id==="potion");if(ix<0){speak(player,"No tengo pociones.");return}
 removeItemAmount(player.inventory,ix,1);const amount=Math.round(48+skills.healing.value*.5);player.health=Math.min(player.maxHealth,player.health+amount);float(player.x,player.y,"+"+amount,"#76e89b");burst(player.x,player.y,"#76e89b",15);gain("healing",.6)
}
function gain(id,effort,difficulty=1){
 const sk=skills[id];if(!sk||sk.value>=100)return;const before=Math.floor(sk.value);
 sk.progress+=effort*clamp(difficulty-(sk.value-20)/120,.12,1)*rand(.65,1.15);
 if(sk.progress>=1){sk.progress-=1;sk.value=Math.min(100,Math.round((sk.value+.1)*10)/10);toast(sk.name+" aumentó a "+sk.value.toFixed(1));
  const after=Math.floor(sk.value);if(after>before&&after%1===0)showLevelBanner(sk.name,after)}
}
function showLevelBanner(name,level){
 let extra="";if(level===60)extra=name==="Espadas"?"Golpe poderoso desbloqueado":name==="Magia"?"Nova de hielo desbloqueada":name==="Curación"?"Regeneración desbloqueada":"";if(level===80)extra=name==="Espadas"?"Ignorar armadura desbloqueado":name==="Magia"?"Cadena de relámpagos desbloqueada":name==="Curación"?"Escudo vital desbloqueado":"";
 const el=$("levelUpBanner");el.innerHTML="¡"+name+" subió a "+level+"!"+(extra?"<br><small>"+extra+"</small>":"");el.classList.remove("hidden");el.style.animation="none";void el.offsetWidth;el.style.animation="levelPop 2.6s ease both";setTimeout(()=>el.classList.add("hidden"),2600);audioTone(740,.12,"triangle")
}
function stats(){
 const e=equipStats(),a=player.attributes||{strength:50,dexterity:50,intelligence:20};
 const hpPct=buffValue("healthPercent")/100,manaPct=buffValue("manaPercent")/100;
 return{damageMin:(e.damageMin+skills.tactics.value*.09+a.strength*.035)*(1+buffValue("damagePercent")/100),damageMax:(e.damageMax+skills.tactics.value*.15+skills.anatomy.value*.05+a.strength*.06)*(1+buffValue("damagePercent")/100),defense:e.defense+skills.defense.value*.2,accuracy:clamp(38+skills.swords.value*.55+e.accuracy+a.dexterity*.05+buffValue("accuracyPercent"),30,98),magicPower:(5+skills.magery.value*.2+skills.evaluating.value*.12+e.magicPower+a.intelligence*.08)*(1+buffValue("magicDamage")/100),magicAccuracy:clamp(42+skills.magery.value*.5+skills.evaluating.value*.14,35,98),magicResistance:e.magicResistance+skills.magicResistance.value*.2+buffValue("magicResistPercent"),manaRegen:(1.8+skills.meditation.value*.06+e.manaRegen)*(1+buffValue("manaRegenPercent")/100),lifeSteal:e.lifeSteal+buffValue("lifeSteal")/100,healingPower:(e.healingPower+a.intelligence*.05)*(1+buffValue("healingPercent")/100),critical:Math.min(.35,.1+a.dexterity*.0005+buffValue("critical")/100),attackSpeed:1+buffValue("attackSpeed")/100,armorIgnore:buffValue("armorIgnore")/100,healthPct:hpPct,manaPct:manaPct,healthRegen:buffValue("healthRegen")/100,staminaRegen:buffValue("staminaRegen")/100,evasion:buffValue("evasion")/100}
}
function derived(){
 const e=equipStats(),a=player.attributes||{strength:50,dexterity:50,intelligence:20},st=stats();
 player.maxHealth=(120+a.strength*1.4+skills.endurance.value*.8+e.health)*(1+st.healthPct);
 player.maxMana=(35+a.intelligence*1.2+skills.magery.value*.5+e.mana)*(1+st.manaPct);
 player.speed=4.1+e.speed+buffValue("moveSpeed")*.008;player.health=Math.min(player.health,player.maxHealth);player.mana=Math.min(player.mana,player.maxMana)
}
function updatePlayer(dt){
 const len=Math.hypot(stick.x,stick.y);let mx=0,my=0;if(len>.08&&!panelOpen()){mx=(stick.y+stick.x)/Math.max(1,len);my=(stick.y-stick.x)/Math.max(1,len)}
 if(mx||my){player.dirX=mx;player.dirY=my;const nx=player.x+mx*player.speed*dt+player.knockX*dt,ny=player.y+my*player.speed*dt+player.knockY*dt;if(!blocked(nx,player.y))player.x=nx;if(!blocked(player.x,ny))player.y=ny;player.walkAnim+=dt*10}
 player.knockX*=Math.pow(.02,dt);player.knockY*=Math.pow(.02,dt);const st=stats();player.mana=Math.min(player.maxMana,player.mana+st.manaRegen*dt);player.health=Math.min(player.maxHealth,player.health+player.maxHealth*st.healthRegen*.002*dt);player.stamina=Math.min(player.maxStamina,player.stamina+(12*(1+st.staminaRegen))*dt);
 player.attackCd=Math.max(0,player.attackCd-dt);player.magicCd=Math.max(0,player.magicCd-dt);player.healCd=Math.max(0,player.healCd-dt);player.invuln=Math.max(0,player.invuln-dt);player.attackAnim=Math.max(0,player.attackAnim-dt*4.8);player.magicAnim=Math.max(0,player.magicAnim-dt*3.5);player.healAnim=Math.max(0,player.healAnim-dt*2.8);player.dialogueTimer=Math.max(0,player.dialogueTimer-dt);
 updateAttributeProgress(dt,!!(mx||my));revealMap();const tx=-((player.x-player.y)*TW/2),ty=-((player.x+player.y)*TH/2)+innerHeight*.18;camera.x+=(tx-camera.x)*dt*5;camera.y+=(ty-camera.y)*dt*5
}
const attributeProgress={strength:0,dexterity:0,intelligence:0};
function updateAttributeProgress(dt,moving){if(moving)attributeProgress.dexterity+=dt*.012}
function gainAttribute(id,amount){
 const a=player.attributes,m=player.attributeModes;if(m[id]!=="up"||a[id]>=150)return;
 const total=a.strength+a.dexterity+a.intelligence;if(total>=300){const down=Object.keys(a).find(k=>m[k]==="down"&&a[k]>10);if(!down)return;a[down]=Math.max(10,a[down]-.1)}
 attributeProgress[id]+=amount;if(attributeProgress[id]>=1){attributeProgress[id]-=1;a[id]=Math.min(150,Math.round((a[id]+.1)*10)/10);toast(attributeName(id)+" subió a "+a[id].toFixed(1))}
}
function attributeName(id){return{strength:"Fuerza",dexterity:"Destreza",intelligence:"Inteligencia"}[id]}
function attack(){
 if(!started||paused||panelOpen()||player.attackCd>0)return;const st=stats(),target=nearest(1.65);if(!target){player.attackAnim=1;speak(player,"No tengo un enemigo al alcance.");return}if(player.stamina<9){speak(player,"Necesito recuperar el aliento.");return}
 player.stamina-=9;player.attackCd=.58/st.attackSpeed;player.attackAnim=1;gain("swords",.7,target.level);gain("tactics",.45,target.level);gainAttribute("strength",.05);gainAttribute("dexterity",.025);
 if(Math.random()<st.evasion||Math.random()*100>st.accuracy){float(target.x,target.y,"Evadido","#ddd");burst(target.x,target.y,"#d8e0e8",7);return}
 const crit=Math.random()<st.critical,dmg=Math.round(rand(st.damageMin,st.damageMax)*(crit?1.65:1));gain("anatomy",crit?.55:.25,target.level);damageEnemy(target,dmg,crit);if(st.lifeSteal)player.health=Math.min(player.maxHealth,player.health+dmg*st.lifeSteal);audioTone(150,.06,"sawtooth")
}
function useSwordSpecial(kind){
 const target=nearest(1.8),st=stats();if(!target)return speak(player,"Necesito un enemigo al alcance.");
 if(kind===1){if(skills.swords.value<60)return speak(player,"Requiere Espadas 60.");if(player.stamina<28)return speak(player,"No tengo suficiente aguante.");player.stamina-=28;player.attackCd=8;damageEnemy(target,Math.round(rand(st.damageMin,st.damageMax)*1.8),true);float(target.x,target.y,"GOLPE PODEROSO","#ffd36f")}
 else{if(skills.swords.value<80)return speak(player,"Requiere Espadas 80.");if(player.stamina<34)return speak(player,"No tengo suficiente aguante.");player.stamina-=34;player.attackCd=12;damageEnemy(target,Math.round(rand(st.damageMin,st.damageMax)*1.35),true);float(target.x,target.y,"ARMADURA IGNORADA","#f1b36b")}
}
function isScroll(it){return it&&it.type==="pergamino"&&scrollTemplateData[it.id]}
function learnScrollAt(ix){
 const it=player.inventory[ix],data=scrollTemplateData[it?.id];if(!data)return;if(player.knownSpells.includes(data.spell))return speak(player,"Este hechizo ya está en mi spellbook.");
 player.knownSpells.push(data.spell);removeItemAmount(player.inventory,ix,1);showLevelBanner("Hechizo aprendido",SPELLS[data.spell].name);renderGrid("inventoryGrid");renderSpellbook()
}
function castSpell(id){
 const sp=SPELLS[id];if(!sp)return;if(skills[sp.skill].value<sp.required)return speak(player,"Requiere "+skills[sp.skill].name+" "+sp.required+".");
 if(id==="fireball")return magic();if(id==="heal")return heal();const st=stats();
 if(player.mana<sp.cost)return speak(player,"Necesito más maná.");player.mana-=sp.cost;
 if(id==="iceNova"){enemies.filter(e=>e.alive&&distance(e,player)<3.2).forEach(e=>{damageEnemy(e,Math.round(st.magicPower*.8+12),false);e.speed*=.72;setTimeout(()=>e.speed=e.type.speed,3500)});burst(player.x,player.y,"#86c9ff",32)}
 if(id==="chainLightning"){let candidates=enemies.filter(e=>e.alive&&distance(e,player)<8).sort((a,b)=>distance(a,player)-distance(b,player)).slice(0,4);candidates.forEach((e,k)=>damageEnemy(e,Math.round((st.magicPower+18)*[1,.8,.65,.5][k]),k===0));burst(player.x,player.y,"#d8e9ff",28)}
 if(id==="regeneration"){player.regeneration=8;float(player.x,player.y,"REGENERACIÓN","#76e89b")}
 if(id==="vitalShield"){player.vitalShield=Math.round(55+skills.healing.value*.7+skills.magery.value*.25);float(player.x,player.y,"ESCUDO "+player.vitalShield,"#b5efb6")}
 gain(sp.skill,.75);gainAttribute("intelligence",.06);audioTone(520,.12,"sine")
}
const originalDamagePlayer=damagePlayer;
damagePlayer=function(amount,magical,source){
 if(player.vitalShield>0){const absorbed=Math.min(player.vitalShield,amount);player.vitalShield-=absorbed;amount-=absorbed;float(player.x,player.y,"Absorbido "+Math.round(absorbed),"#b5efb6");if(amount<=0)return}
 originalDamagePlayer(amount,magical,source)
};
function updateStatusEffects(dt){if(player.regeneration>0){player.regeneration-=dt;player.regenTick=(player.regenTick||0)-dt;if(player.regenTick<=0){player.regenTick=1;const a=Math.round(5+skills.healing.value*.12);player.health=Math.min(player.maxHealth,player.health+a);float(player.x,player.y,"+"+a,"#76e89b")}}}
function randomEquipmentForEnemy(e){
 const human=e.type.body==="human",ids=human?["ironSword","axe","leatherChest","ironChest","gloves","legs","boots","accuracyRing","vampireRing","arcaneBook","blueRobe","blackCloak"]:["accuracyRing","vampireRing"];
 return enhanceLootEquipment(item(choice(ids)),e.special?4:e.level>=3?2.2:e.type.notoriety==="red"?1.6:1)
}
function loot(e){
 const a=[item(e.type.loot)];if(["beast","monster"].includes(e.type.body)&&["wolf","blackWolf","bear","boar","troll"].includes(e.type.id))a.push(item("rawHide"));
 if(e.type.body==="human"&&Math.random()<.48)a.push(randomEquipmentForEnemy(e));if(Math.random()<.18)a.push(item("potion"));
 if(["darkMage","necromancer","exileMage","cultHealer","swampWitch"].includes(e.type.id)&&Math.random()<.34)a.push(item(choice(Object.keys(scrollTemplateData))));
 return a
}
function kill(e){
 if(!e.alive)return;e.health=0;e.alive=false;e.respawn=e.special?300:120;e.loot=e.loot.length?e.loot:loot(e);corpses.push({x:e.x,y:e.y,enemy:e,life:300});
 const gold=e.special?260:Math.round(rand(8,36));player.gold+=gold;if(["red","gray"].includes(e.type.notoriety)){const honor=e.type.notoriety==="red"?3:1;player.honor+=honor;const f=e.type.tag==="undead"?"hunters":e.type.tag==="criminal"?"guard":e.type.tag==="cult"?"arcane":"rangers";const rep=e.type.notoriety==="red"?4:2;factions[f].value+=rep;toast("Honor +"+honor+" · "+factions[f].name+" +"+rep)}
 quests.forEach(q=>{if(q.status==="active"&&q.tag===e.type.tag){q.progress=Math.min(q.goal,q.progress+1);if(q.progress>=q.goal){q.status="ready";toast("Misión completada: "+q.name)}}});burst(e.x,e.y,e.type.color,24);msg(e.type.name+" derrotado. Ganaste "+gold+" oro.");audioTone(95,.15,"triangle")
}
function openNpcDialogue(npc){
 closePanels();$("dialoguePanel").classList.remove("hidden");$("dialogueTitle").textContent=npc.name;$("dialogueText").textContent=npc.greeting||"¿Qué necesitas?";const box=$("dialogueOptions");box.innerHTML="";
 const add=(text,fn)=>{const b=document.createElement("button");b.textContent=text;b.onclick=fn;box.appendChild(b)};
 if(shops[npc.role]){add("Comprar",()=>openShop(npc.role,"buy"));add("Vender",()=>openShop(npc.role,"sell"));add("Preguntar por rumores",()=>{$("dialogueText").textContent=choice(["Los bandidos se reúnen al este.","De noche aparecen espectros en el cementerio.","Algunas bestias dejan pieles útiles para Tailoring."])})}
 else if(npc.role==="bank")add("Abrir el banco",openBank);
 else if(npc.role.endsWith("Faction")){add("Ver encargos",()=>openFaction(npc.role));add("Preguntar por la facción",()=>{$("dialogueText").textContent=npc.greeting})}
 else add("Conversar",()=>{$("dialogueText").textContent=npc.greeting});
 add("Salir",closePanels)
}
function interact(){if(panelOpen())return;const npc=nearbyNpc();if(npc){speak(npc,npc.greeting);openNpcDialogue(npc);return}const c=nearbyCorpse();if(c){openLoot(c);return}speak(player,"No hay nada cerca para usar.")}
function openShop(role,mode="buy"){
 const sh=shops[role];closePanels();$("shopPanel").classList.remove("hidden");$("shopTitle").textContent=sh.name;$("shopDetails").innerHTML='<div class="shop-tabs"><button id="tabBuy">Comprar</button><button id="tabSell">Vender</button></div><p>Selecciona una fila para realizar la operación.</p>';
 $("tabBuy").onclick=()=>openShop(role,"buy");$("tabSell").onclick=()=>openShop(role,"sell");$("tab"+(mode==="buy"?"Buy":"Sell")).classList.add("active");const list=$("shopItems");list.innerHTML="";
 if(mode==="buy")sh.items.forEach(id=>{const it=item(id),r=document.createElement("div");r.className="shop-row";r.innerHTML="<span>"+it.icon+"</span><div><strong>"+it.name+"</strong><small>"+it.type+" · "+it.value+" oro</small></div><button>Comprar</button>";r.querySelector("button").onclick=()=>{if(player.gold<it.value)return speak(player,"No tengo suficiente oro.");const bought=item(id);if(!addItem(bought))return speak(player,"Mi mochila está llena.");player.gold-=it.value;updateUI();audioTone(630,.07,"sine")};list.appendChild(r)})
 else player.inventory.forEach((it,ix)=>{const price=Math.max(1,Math.floor(it.value*.45)),r=document.createElement("div");r.className="shop-row";r.innerHTML="<span>"+it.icon+"</span><div><strong>"+it.name+(isStackable(it)?" ×"+it.count:"")+"</strong><small>Recibes "+price+" oro por unidad</small></div><button>Vender 1</button>";r.querySelector("button").onclick=()=>{removeItemAmount(player.inventory,ix,1);player.gold+=price;openShop(role,"sell");updateUI()};list.appendChild(r)})
}
function renderBank(){
 const a=$("bankInventory"),b=$("bankStorage");a.innerHTML="";b.innerHTML="";
 player.inventory.forEach((it,ix)=>a.appendChild(slotButton(it,ix,-1,()=>{const moved=removeItemAmount(player.inventory,ix,isStackable(it)?it.count:1);addItem(moved,player.bank);renderBank()})));
 player.bank.forEach((it,ix)=>b.appendChild(slotButton(it,ix,-1,()=>{if(!inventorySpaceFor(it))return speak(player,"Mi mochila está llena.");const moved=removeItemAmount(player.bank,ix,isStackable(it)?it.count:1);addItem(moved);renderBank()})))
}
function renderLoot(){
 const g=$("lootItems");g.innerHTML="";if(!currentCorpse)return;
 currentCorpse.enemy.loot.forEach((it,ix)=>{const r=document.createElement("div");r.className="shop-row";r.innerHTML="<span>"+it.icon+"</span><div><strong class='rarity-"+(it.rarity||"common")+"'>"+it.name+(isStackable(it)&&it.count>1?" ×"+it.count:"")+"</strong><small>"+it.type+"</small></div><button>Recoger</button>";r.querySelector("button").onclick=()=>{if(!inventorySpaceFor(it))return speak(player,"Mi mochila está llena.");const moved=currentCorpse.enemy.loot.splice(ix,1)[0];addItem(moved);renderLoot();audioTone(820,.05,"sine")};g.appendChild(r)})
}
$("takeAllLoot").onclick=()=>{if(!currentCorpse)return;for(let ix=currentCorpse.enemy.loot.length-1;ix>=0;ix--){const it=currentCorpse.enemy.loot[ix];if(inventorySpaceFor(it)){addItem(currentCorpse.enemy.loot.splice(ix,1)[0])}}renderLoot()};
function pillarPositionsForBuilding(b){
 const out=[];for(let x=b.x;x<=b.x+b.w;x+=2){if(Math.abs(x-b.doorX)>1.3){out.push({x,y:b.y});out.push({x,y:b.y+b.h})}}for(let y=b.y+2;y<b.y+b.h;y+=2){out.push({x:b.x,y});out.push({x:b.x+b.w,y})}return out
}
const visiblePillars=[];buildings.forEach(b=>visiblePillars.push(...pillarPositionsForBuilding(b)));
for(let x=city.x;x<=city.x+city.w;x+=3){if(Math.abs(x-104)>3){visiblePillars.push({x,y:city.y});visiblePillars.push({x,y:city.y+city.h})}}
for(let y=city.y+3;y<city.y+city.h;y+=3){if(Math.abs(y-106)>3){visiblePillars.push({x:city.x,y});visiblePillars.push({x:city.x+city.w,y})}}
function blocked(x,y){
 const t=tile(Math.floor(x),Math.floor(y));if(t==="water"||t==="wall")return true;
 if(visiblePillars.some(p=>Math.hypot(x-p.x,y-p.y)<.42))return true;return false
}
function drawPillar(p){const s=screen(p.x,p.y);ctx.fillStyle="#6c6d6b";ctx.fillRect(s.x-4,s.y-20,8,21);ctx.fillStyle="#92938f";ctx.fillRect(s.x-6,s.y-22,12,5)}
function drawBuilding(b){
 for(let y=b.y;y<b.y+b.h;y++)for(let x=b.x;x<b.x+b.w;x++)drawTile(x,y,"plaza");
 const insideNow=inside(player,b);if(!insideNow){const at=screen(b.x,b.y,42),rt=screen(b.x+b.w,b.y,42),bt=screen(b.x+b.w,b.y+b.h,42),lt=screen(b.x,b.y+b.h,42);ctx.fillStyle=b.roof;ctx.beginPath();ctx.moveTo(at.x,at.y);ctx.lineTo(rt.x,rt.y);ctx.lineTo(bt.x,bt.y);ctx.lineTo(lt.x,lt.y);ctx.closePath();ctx.fill()}
}
function npcNameColor(e,enemy){
 if(enemy){if(e.special)return"#c982ff";return e.type.notoriety==="gray"?"#b7b7b7":e.type.tag==="cult"?"#e18a43":"#f06464"}
 if(e.kind==="faction"||shops[e.role])return"#f0ce70";if(e.kind==="guard")return"#76aef1";return"#8fc4ff"
}
function drawPermanentName(e,p,enemy=false){
 const name=enemy?(e.type.name+" [Nv. "+e.level+"]"):e.name;ctx.textAlign="center";ctx.font=(e.special?"bold 10px":"bold 8px")+" sans-serif";ctx.fillStyle="#000b";ctx.fillText(name,p.x+1,p.y-(enemy?63:54)+1);ctx.fillStyle=npcNameColor(e,enemy);ctx.fillText(name,p.x,p.y-(enemy?63:54));if(e.special){ctx.font="8px sans-serif";ctx.fillStyle="#d5a4ff";ctx.fillText("Élite",p.x,p.y-52)}
}
function humanoid(e,color,enemy=false){
 const p=screen(e.x,e.y),bob=Math.sin(e.anim||player.walkAnim)*1.5,isP=e===player,cloak=isP?player.equipment.cloak?.color:null,appearance=e.appearance||{};
 ctx.fillStyle="#0006";ctx.beginPath();ctx.ellipse(p.x,p.y+3,10,4,0,0,Math.PI*2);ctx.fill();if(cloak){ctx.fillStyle=cloak;ctx.beginPath();ctx.moveTo(p.x,p.y-34+bob);ctx.lineTo(p.x+13,p.y-9);ctx.lineTo(p.x,p.y-2);ctx.lineTo(p.x-13,p.y-9);ctx.closePath();ctx.fill()}
 const chest=isP?(player.equipment.robe?.color||player.equipment.chest?.color||color):(appearance.primary||color),legs=isP?(player.equipment.legs?.color||"#332f47"):(appearance.secondary||"#343a43"),arms=isP?(player.equipment.arms?.color||chest):chest,gloves=isP?(player.equipment.gloves?.color||"#6d4a32"):"#5d4234",boots=isP?(player.equipment.boots?.color||"#3d2d23"):"#2f2925";
 ctx.fillStyle=boots;ctx.fillRect(p.x-7,p.y-3,5,6);ctx.fillRect(p.x+2,p.y-3,5,6);ctx.fillStyle=legs;ctx.fillRect(p.x-8,p.y-14,6,12);ctx.fillRect(p.x+2,p.y-14,6,12);ctx.fillStyle=e.hitFlash>0?"#fff":chest;ctx.beginPath();ctx.moveTo(p.x,p.y-35+bob);ctx.lineTo(p.x+12,p.y-13);ctx.lineTo(p.x-12,p.y-13);ctx.closePath();ctx.fill();ctx.fillStyle=arms;ctx.fillRect(p.x-16,p.y-29+bob,5,18);ctx.fillRect(p.x+11,p.y-29+bob,5,18);ctx.fillStyle=gloves;ctx.beginPath();ctx.arc(p.x-14,p.y-10,3,0,Math.PI*2);ctx.arc(p.x+14,p.y-10,3,0,Math.PI*2);ctx.fill();ctx.fillStyle=appearance.skin|| (enemy?"#a78b73":"#d5aa82");ctx.beginPath();ctx.arc(p.x,p.y-41+bob,6,0,Math.PI*2);ctx.fill();
 if(appearance.hair){ctx.fillStyle=appearance.hair;ctx.fillRect(p.x-5,p.y-47+bob,10,3)}
 if(isP){ctx.save();ctx.translate(p.x+9,p.y-23+bob);ctx.rotate(player.attackAnim>0?-1.8+(1-player.attackAnim)*2.8:-.65);ctx.strokeStyle=player.equipment.mainHand?.color||"#ddd";ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,-22);ctx.stroke();ctx.restore()}
 else if(enemy&&e.type.weapon){ctx.strokeStyle=e.type.weapon==="staff"?"#8c6945":"#c7cbd0";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(p.x+10,p.y-18);ctx.lineTo(p.x+13,p.y-37);ctx.stroke()}
 if(enemy&&distance(e,player)<7){ctx.fillStyle="#000b";ctx.fillRect(p.x-15,p.y-57,30,4);ctx.fillStyle=e.type.notoriety==="red"?"#c34646":"#929292";ctx.fillRect(p.x-15,p.y-57,30*e.health/e.maxHealth,4)}
 if(!isP)drawPermanentName(e,p,enemy);speech(e,p)
}
function monster(e){
 const p=screen(e.x,e.y),scale=e.type.id==="troll"||e.type.id==="elemental"?1.35:e.type.id==="bear"?1.2:1;ctx.save();ctx.translate(p.x,p.y);ctx.scale(scale,scale);ctx.translate(-p.x,-p.y);ctx.fillStyle="#0006";ctx.beginPath();ctx.ellipse(p.x,p.y+2,12,5,0,0,Math.PI*2);ctx.fill();ctx.fillStyle=e.hitFlash>0?"#fff":e.type.color;if(e.type.body==="beast"){ctx.beginPath();ctx.ellipse(p.x,p.y-12,14,8,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(p.x+10,p.y-18,6,0,Math.PI*2);ctx.fill();ctx.fillRect(p.x-10,p.y-8,3,10);ctx.fillRect(p.x+6,p.y-8,3,10)}else{ctx.beginPath();ctx.arc(p.x,p.y-19,11,0,Math.PI*2);ctx.fill();ctx.fillRect(p.x-9,p.y-18,18,18)}ctx.restore();if(distance(e,player)<7){ctx.fillStyle="#000b";ctx.fillRect(p.x-15,p.y-43,30,4);ctx.fillStyle=e.type.notoriety==="red"?"#c34646":"#929292";ctx.fillRect(p.x-15,p.y-43,30*e.health/e.maxHealth,4)}drawPermanentName(e,{x:p.x,y:p.y+14},true);speech(e,p)
}
function assignAppearances(){
 const skin=["#d7aa82","#b97d58","#8c5d43","#e0b897"],hair=["#291b15","#6a4329","#b5a16e","#17191b"],primary=["#6f4335","#3d5d73","#71603e","#5a416d","#43705b"],secondary=["#292e35","#48372c","#403b4d"];
 npcs.forEach(n=>n.appearance={skin:choice(skin),hair:choice(hair),primary:choice(primary),secondary:choice(secondary)});
 enemies.filter(e=>e.type.body==="human").forEach(e=>e.appearance={skin:choice(skin),hair:choice(hair),primary:e.type.color,secondary:choice(secondary)})
}
function renderAttributes(){
 const a=player.attributes,m=player.attributeModes,total=a.strength+a.dexterity+a.intelligence;$("attributeTotal").textContent=total.toFixed(1)+" / 300";
 $("attributesList").innerHTML="";Object.keys(a).forEach(id=>{const row=document.createElement("div");row.className="attribute-row";row.innerHTML="<div><strong>"+attributeName(id)+"</strong><small>Máximo individual: 150</small></div><strong>"+a[id].toFixed(1)+"</strong><div class='attribute-controls'><button data-mode='up'>↑ Subir</button><button data-mode='locked'>— Bloquear</button><button data-mode='down'>↓ Bajar</button></div>";row.querySelectorAll("button").forEach(b=>{if(b.dataset.mode===m[id])b.classList.add("active");b.onclick=()=>{m[id]=b.dataset.mode;renderAttributes()}});$("attributesList").appendChild(row)})
}
function renderSpellbook(){
 $("knownSpells").innerHTML="";player.knownSpells.forEach(id=>{const sp=SPELLS[id],r=document.createElement("div");r.className="spell-row";r.innerHTML="<span>"+sp.icon+"</span><div><strong>"+sp.name+"</strong><small>"+sp.school+" · requiere "+sp.required+"</small></div><button>Equipar</button>";r.querySelector("button").onclick=()=>{const free=player.equippedSpells.findIndex(x=>!x);player.equippedSpells[free>=0?free:0]=id;renderSpellbook();renderQuickbar()};$("knownSpells").appendChild(r)});
 $("equippedSpells").innerHTML="";for(let k=0;k<4;k++){const id=player.equippedSpells[k],sp=id?SPELLS[id]:null,b=document.createElement("button");b.className="spell-slot";b.innerHTML=sp?"<span>"+sp.icon+"</span>"+sp.name:"<span>＋</span>Vacío";b.onclick=()=>{player.equippedSpells[k]=null;renderSpellbook();renderQuickbar()};$("equippedSpells").appendChild(b)}
 $("spellScrolls").innerHTML="";player.inventory.forEach((it,ix)=>{if(!isScroll(it))return;const sp=SPELLS[scrollTemplateData[it.id].spell],r=document.createElement("div");r.className="spell-row";r.innerHTML="<span>📜</span><div><strong>"+sp.name+"</strong><small>"+it.count+" disponible(s)</small></div><button>Aprender</button>";r.querySelector("button").onclick=()=>learnScrollAt(ix);$("spellScrolls").appendChild(r)})
}
function renderQuickbar(){document.querySelectorAll(".spell-quick").forEach((b,k)=>{const id=player.equippedSpells[k],sp=id?SPELLS[id]:null;b.textContent=sp?sp.icon:"＋";b.classList.toggle("locked",!sp||skills[sp.skill].value<sp.required)})}
const craftRecipes=[
 {id:"treat",name:"Tratar cuero",icon:"🟤",skill:0,materials:{rawHide:3},result:"treatedLeather",count:2},
 {id:"thick",name:"Cuero resistente",icon:"🟫",skill:40,materials:{treatedLeather:3},result:"thickLeather",count:1},
 {id:"helmet",name:"Casco de cuero",icon:"⛑️",skill:10,materials:{treatedLeather:3},result:"leatherHelmet"},
 {id:"chest",name:"Pechera de cuero",icon:"🥋",skill:25,materials:{treatedLeather:8},result:"leatherChest"},
 {id:"gloves",name:"Guantes de cuero",icon:"🧤",skill:15,materials:{treatedLeather:2},result:"gloves"},
 {id:"boots",name:"Botas de cuero tratadas",icon:"🥾",skill:20,materials:{treatedLeather:4},result:"leatherBootsCraft"},
 {id:"robe",name:"Túnica de tela fina",icon:"👘",skill:35,materials:{fineCloth:6},result:"fineRobe"},
 {id:"cloak",name:"Capa sombría",icon:"🧥",skill:75,materials:{shadowCloth:5,crystal:2},result:"shadowCloak"}
];
function materialCount(id){return player.inventory.filter(i=>i.id===id).reduce((n,i)=>n+(i.count||1),0)}
function consumeMaterial(id,count){for(let ix=player.inventory.length-1;ix>=0&&count>0;ix--){const it=player.inventory[ix];if(it.id!==id)continue;const take=Math.min(count,it.count||1);removeItemAmount(player.inventory,ix,take);count-=take}}
function qualityForCraft(recipe){const sk=skills.tailoring.value,chance=sk-recipe.skill+rand(-25,25);if(chance>55)return"Excepcional";if(chance>20)return"Bien confeccionada";return"Normal"}
function craft(recipe){
 if(skills.tailoring.value<recipe.skill)return speak(player,"Requiere Tailoring "+recipe.skill+".");for(const [id,c] of Object.entries(recipe.materials))if(materialCount(id)<c)return speak(player,"Faltan materiales.");
 const result=item(recipe.result);if(!inventorySpaceFor(result))return speak(player,"Mi mochila está llena.");Object.entries(recipe.materials).forEach(([id,c])=>consumeMaterial(id,c));result.count=recipe.count||1;
 if(result.slot){result.quality=qualityForCraft(recipe);let buffs=0;if(result.quality==="Bien confeccionada")buffs=Math.floor(rand(1,3));if(result.quality==="Excepcional")buffs=skills.tailoring.value>=100?Math.floor(rand(3,6)):Math.floor(rand(1,4));rollBuffs(result,buffs);result.rarity=buffs>=4?"legendary":buffs>=3?"epic":buffs>=2?"rare":buffs?"uncommon":"common";result.color=RARITIES.find(r=>r.id===result.rarity).color;if(skills.tailoring.value>=100)result.craftedBy=player.name}
 addItem(result);gain("tailoring",.9,Math.max(1,recipe.skill/30));renderCrafting();toast(result.name+" creado");audioTone(460,.1,"triangle")
}
function renderCrafting(){
 const list=$("craftRecipes");list.innerHTML="";craftRecipes.forEach(r=>{const row=document.createElement("div");row.className="recipe-row";row.innerHTML="<span>"+r.icon+"</span><div><strong>"+r.name+"</strong><small>Tailoring "+r.skill+"</small></div><button>Ver</button>";row.querySelector("button").onclick=()=>{$("craftDetails").innerHTML="<h3>"+r.name+"</h3>"+Object.entries(r.materials).map(([id,c])=>"<div class='stat-line'><span>"+templates[id].name+"</span><strong>"+materialCount(id)+" / "+c+"</strong></div>").join("")+'<div class="detail-actions"><button id="makeRecipe">Fabricar</button></div>';$("makeRecipe").onclick=()=>craft(r)};list.appendChild(row)})
}
let audioEnabled=true,audioCtx=null;
function audioTone(freq,duration,type="sine"){if(!audioEnabled)return;try{audioCtx=audioCtx||new (window.AudioContext||window.webkitAudioContext)();const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(.035,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+duration);o.connect(g);g.connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+duration)}catch(e){}}
const explored=new Set();
function revealMap(){const cx=Math.floor(player.x/3),cy=Math.floor(player.y/3);for(let y=-2;y<=2;y++)for(let x=-2;x<=2;x++)explored.add((cx+x)+","+(cy+y))}
function drawMap(){
 const sx=mapCanvas.width/WORLD,sy=mapCanvas.height/WORLD;mapCtx.clearRect(0,0,mapCanvas.width,mapCanvas.height);
 for(let y=0;y<WORLD;y+=2)for(let x=0;x<WORLD;x+=2){const known=explored.has(Math.floor(x/3)+","+Math.floor(y/3));if(!known){mapCtx.fillStyle="#080b0d";mapCtx.fillRect(x*sx,y*sy,sx*2+1,sy*2+1);continue}const t=tile(x,y),c={grass:"#38543c",road:"#716d65",plaza:"#8a857b",grave:"#343934",gravePath:"#5d5c56",wall:"#57595b",water:"#24485c",ruins:"#544d44",swamp:"#30483e"};mapCtx.fillStyle=c[t];mapCtx.fillRect(x*sx,y*sy,sx*2+1,sy*2+1)}
 mapCtx.fillStyle="#fff";mapCtx.beginPath();mapCtx.arc(player.x*sx,player.y*sy,4,0,Math.PI*2);mapCtx.fill();mapCtx.fillStyle="#fff";mapCtx.font="12px sans-serif";mapCtx.fillText("Explorado: "+Math.round(explored.size/(Math.ceil(WORLD/3)**2)*100)+"%",10,18)
}
let dayClock=.28;
function drawDayNight(){const night=Math.max(0,Math.abs(dayClock-.5)*2-.3);if(night>0){ctx.fillStyle="rgba(8,18,39,"+(night*.42)+")";ctx.fillRect(0,0,innerWidth,innerHeight)}}
function save(){
 localStorage.setItem(SAVE,JSON.stringify({saveVersion:3,player:{x:player.x,y:player.y,health:player.health,mana:player.mana,stamina:player.stamina,gold:player.gold,honor:player.honor,inventory:player.inventory,bank:player.bank,equipment:player.equipment,attributes:player.attributes,attributeModes:player.attributeModes,knownSpells:player.knownSpells,equippedSpells:player.equippedSpells},skills,factions,quests,explored:[...explored],dayClock}))
}
const oldLoad=load;
load=function(){oldLoad();player.inventory=normalizeStacks(player.inventory);player.bank=normalizeStacks(player.bank);try{const d=JSON.parse(localStorage.getItem(SAVE));if(d?.explored)d.explored.forEach(v=>explored.add(v));if(typeof d?.dayClock==="number")dayClock=d.dayClock}catch(e){}}
function loop(t){
 let dt=Math.min(Math.max((t-last)/1000,0),.033);last=t;if(hitStop>0){hitStop-=dt;dt=0}
 if(!paused){dayClock=(dayClock+dt/720)%1;updatePlayer(dt);updateNpcs(dt);updateEnemies(dt);updateProjectiles(dt);effects(dt);updateStatusEffects(dt);autosave+=dt;if(autosave>12){autosave=0;save()}}
 updateUI();hint();draw();visiblePillars.forEach(drawPillar);drawDayNight();requestAnimationFrame(loop)
}
assignAppearances();
setTimeout(()=>{player.inventory=normalizeStacks(player.inventory);renderQuickbar();},0);

tap("statsButton",()=>{closePanels();$("statsPanel").classList.remove("hidden");renderAttributes()});
tap("spellbookButton",()=>{closePanels();$("spellbookPanel").classList.remove("hidden");renderSpellbook()});
tap("craftButton",()=>{closePanels();$("craftPanel").classList.remove("hidden");renderCrafting()});
tap("audioButton",()=>{audioEnabled=!audioEnabled;$("audioButton").textContent=audioEnabled?"🔊":"🔇"});
tap("swordSpecial1",()=>useSwordSpecial(1));tap("swordSpecial2",()=>useSwordSpecial(2));
document.querySelectorAll(".spell-quick").forEach((b,k)=>b.addEventListener("click",()=>{const id=player.equippedSpells[k];if(id)castSpell(id)}));

player.inventory=normalizeStacks(player.inventory);player.bank=normalizeStacks(player.bank);assignAppearances();renderQuickbar();
