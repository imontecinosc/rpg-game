(function(U){
  U.spells=[
    {id:'fireball',name:'Bola de fuego',icon:'🔥',mana:14,cd:1.1,range:11},
    {id:'ice',name:'Aguja de hielo',icon:'❄️',mana:12,cd:1,range:10},
    {id:'lightning',name:'Rayo',icon:'⚡',mana:18,cd:1.5,range:9},
    {id:'curse',name:'Veneno arcano',icon:'☠️',mana:16,cd:2,range:8},
    {id:'heal',name:'Luz vital',icon:'✨',mana:20,cd:2,range:0},
    {id:'portal',name:'Portal',icon:'🌀',mana:28,cd:8,range:0}
  ];
  U.selectSpell=i=>{if(U.spells[i]){U.state.selectedSpell=U.spells[i].id;U.ui.renderSpells()}};
  U.castSpell=function(i){
    if(Number.isInteger(i))U.selectSpell(i);
    const sp=U.spells.find(s=>s.id===U.state.selectedSpell);if(!sp)return;
    if(U.player.spellCd>0||U.player.mana<sp.mana)return U.toast('No puedes lanzar eso ahora.');
    const colors={fireball:'#ff7a20',ice:'#49a8ff',lightning:'#ffe34d',curse:'#a85de2',heal:'#8fffc1',portal:'#8262ea'};
    for(let n=0;n<14;n++)U.state.effects.push({type:'particle',x:U.player.x+U.rnd(-.5,.5),y:U.player.y+U.rnd(-.5,.5),color:colors[sp.id],size:U.rnd(2,4),life:.45});
    if(sp.id==='heal'){U.player.mana-=sp.mana;U.player.hp=Math.min(U.player.maxHp,U.player.hp+35+U.player.skills.Magia*.15);U.player.spellCd=sp.cd;return U.toast('La magia restaura tu vida.')}
    if(sp.id==='portal'){U.player.mana-=sp.mana;U.player.spellCd=sp.cd;const valid=U.cities.filter(c=>Math.hypot(c.x-U.player.x,c.y-U.player.y)>12),dest=U.pick(valid);U.state.effects.push({type:'portal',x:U.player.x+1,y:U.player.y,life:300,dest});return U.toast('Abres un portal misterioso durante 5 minutos.')}
    const t=U.player.target;if(!t||t.dead||!t.hp)return U.toast('Selecciona un enemigo.');
    if(U.dist(U.player,t)>sp.range)return U.toast('Objetivo fuera de alcance.');
    U.player.mana-=sp.mana;U.player.spellCd=sp.cd;U.player.attackAnim=.28;
    U.state.projectiles.push({x:U.player.x,y:U.player.y,target:t,speed:10,spell:sp});
    U.raiseSkill('Magia',.18);
  };
})(window.Ultra=window.Ultra||{});
