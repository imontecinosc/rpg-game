(function(U){
  U.setupWorld=function(){
    U.cities.forEach(c=>{U.npcs.push({type:'vendor',name:'Mercader de '+c.name,x:c.x+2,y:c.y+1,city:c.name,color:'#d0ab55',nameColor:'#69a9d8'},{type:'banker',name:'Banquero de '+c.name,x:c.x-2,y:c.y+1,city:c.name,color:'#d9d2b2',nameColor:'#69a9d8'},{type:'healer',name:'Sanador de '+c.name,x:c.x,y:c.y-2,city:c.name,color:'#ddd',nameColor:'#69a9d8'});for(let i=0;i<2;i++)U.npcs.push({type:'guard',name:'Guardia de '+c.name,x:c.x+U.rnd(-4,4),y:c.y+U.rnd(-4,4),city:c.name,color:'#8ea0b0',nameColor:'#69a9d8'})});
    const spots=[[25,-20],[34,-30],[48,-15],[58,-27],[70,-5],[76,-38]];
    for(let i=0;i<24;i++){const q=U.pick(spots);U.spawnEnemy(U.pick(['wolf','zombie','bandit']),q[0]+U.rnd(-6,6),q[1]+U.rnd(-6,6))}
    for(let i=0;i<6;i++)U.spawnEnemy('troll',62+U.rnd(-9,11),-24+U.rnd(-10,10));U.spawnEnemy('boss',70,4,true,'renowned')
  };
  U.getContextAction=function(){
    const p=U.player;
    let npc=U.npcs.find(n=>U.dist(p,n)<2.25);if(npc)return{type:'use',label:'Hablar',icon:'💬',target:npc};
    let corpse=U.state.corpses.find(c=>U.dist(p,c)<2.25);if(corpse)return{type:'use',label:'Saquear',icon:'🧰',target:corpse};
    const mine=U.terrain.mines.find(m=>Math.hypot(p.x-m.x,p.y-m.y)<m.r);if(mine)return{type:'mine',label:'Minar',icon:'⛏️'};
    const forest=U.terrain.forests.find(f=>Math.hypot(p.x-f.x,p.y-f.y)<f.r);if(forest)return{type:'wood',label:'Talar',icon:'🪓'};
    const water=U.terrain.water.find(w=>Math.hypot(p.x-w.x,p.y-w.y)<w.r+2);if(water)return{type:'fish',label:'Pescar',icon:'🎣'};
    const st=U.terrain.stations.find(s=>Math.hypot(p.x-s.x,p.y-s.y)<2.3);if(st)return{type:'station',label:'Artesanía',icon:'⚒️',target:st};
    return{type:'use',label:'Usar',icon:'✋'}
  };
  U.useAction=function(){const a=U.getContextAction();if(a.target?.items)return U.ui.openCorpse(a.target);if(a.target?.type&&['vendor','banker','healer','guard'].includes(a.target.type))return U.interactNpc(a.target);if(a.type==='station')return U.ui.openCraft(a.target.type);if(['mine','wood','fish'].includes(a.type))return U.gather(a.type);U.toast('No hay nada útil cerca.')};
  U.gather=function(type){if(U.player.bandaging)return;const times={mine:2.5,wood:2.1,fish:2.8};U.player.bandaging={t:times[type],total:times[type],gather:type};U.sound(type==='mine'?'mine':type==='wood'?'wood':'fish');U.toast(type==='mine'?'Golpeas la veta automáticamente…':type==='wood'?'Talas un árbol…':'Lanzas la caña…')};
  U.interactNpc=function(n){if(U.dist(U.player,n)>2.3)return U.toast('Acércate más.');if(n.type==='vendor')U.ui.openVendor(n);if(n.type==='banker')U.ui.openBank();if(n.type==='healer'){U.player.hp=U.player.maxHp;U.player.mana=U.player.maxMana;U.sound('heal');U.toast('El sanador restaura tus fuerzas.')}if(n.type==='guard')U.toast('“Mantén la paz dentro de '+n.city+'.”')};
})(window.Ultra=window.Ultra||{});