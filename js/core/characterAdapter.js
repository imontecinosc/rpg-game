(function(U){
  const palettes={
    player:{gender:'male',skin:'#bb8d72',underwear:'#39414a',shirt:'#677386',pants:'#566479',tunic:'#7d586a',armor:'#8d98a1',cape:'#56303c',hair:'#3b2a24'},
    vendor:{gender:'male',skin:'#c29476',underwear:'#443a33',shirt:'#9a6b3d',pants:'#55483d',tunic:'#a87b45',armor:'#81786b',cape:'#553928',hair:'#493326'},
    banker:{gender:'male',skin:'#c79a7c',underwear:'#34302d',shirt:'#73654d',pants:'#403a36',tunic:'#b2a275',armor:'#817c70',cape:'#4b4033',hair:'#30251f'},
    healer:{gender:'female',skin:'#d0a188',underwear:'#625d56',shirt:'#d2c8ad',pants:'#6d655c',tunic:'#e2dcc9',armor:'#9c978d',cape:'#796e65',hair:'#7a6551'},
    guard:{gender:'male',skin:'#ad8068',underwear:'#303940',shirt:'#687785',pants:'#3e4850',tunic:'#596978',armor:'#8b99a3',cape:'#3d4753',hair:'#332821'},
    bandit:{gender:'male',skin:'#a87563',underwear:'#342d2e',shirt:'#71433d',pants:'#403739',tunic:'#633632',armor:'#706b66',cape:'#35282a',hair:'#251e1b'}
  };
  const beastPalettes={
    wolf:{body:'#6d675f',belly:'#878078',accent:'#d8d0c6'},
    boar:{body:'#5e4439',belly:'#7b5c50',accent:'#ead1a4'},
    bear:{body:'#56463e',belly:'#765f52',accent:'#d7c4af'},
    troll:{body:'#6f8660',belly:'#88a077',accent:'#c9d8bf'},
    boss:{body:'#607950',belly:'#82996f',accent:'#d4dfc9'},
    spider:{body:'#403a36',belly:'#6a625d',accent:'#cbb9a3'},
    zombie:{body:'#77856c',belly:'#9aaa89',accent:'#d8ceb7'},
    skeleton:{body:'#d5d0c5',belly:'#e6e0d5',accent:'#8a8374'}
  };
  const equipped=(actor,slot)=>!!actor.equipment?.[slot];
  function weapon(actor){
    const item=actor.equipment?.weapon;
    const def=item&&U.itemDefs[item.id];
    if(!def)return equipped(actor,'shield')?'swordShield':'none';
    let type=def.skill==='Arco'?'bow':def.skill==='Esgrima'?'spear':def.skill==='Armas contundentes'?'mace':def.skill==='Magia'?'staff':def.skill==='Pelea'?'none':'sword';
    if(def.twoHand)type=type==='sword'?'greatAxe':type;
    if(equipped(actor,'shield')&&['sword','spear','mace'].includes(type))type+='Shield';
    return type;
  }
  U.CharacterAdapter={
    getState(actor,options={}){
      const type=(actor.type||'').toLowerCase();
      if(beastPalettes[type]){
        return {beast:type==='boss'?'troll':type,palette:beastPalettes[type],time:actor.anim||0,dir:actor.facing||'right',action:(actor.attackAnim||0)>0?'attack':actor.moving?'walk':'idle',scale:actor.boss||actor.variant==='renowned'?1.22:1};
      }
      const player=actor===U.player;
      const base=player?palettes.player:(palettes[type]||palettes.vendor);
      return {
        base,time:actor.anim||0,dir:options.direction||actor.facing||'down',
        action:options.pose?'idle':(actor.attackAnim||0)>0?'melee':Math.hypot(actor.vx||0,actor.vy||0)>.1||actor.moving?'walk':'idle',
        weapon:player&&!options.paperdoll?weapon(actor):'none',
        hair:type==='guard'?'short':type==='healer'?'bun':'long',
        showClothes:true,
        clothes:{head:false,neck:false,shirt:true,arms:true,gloves:false,pants:true},
        equip:{helmet:player&&equipped(actor,'head'),neck:player&&equipped(actor,'neck'),torso:player&&equipped(actor,'chest'),arms:player&&equipped(actor,'arms'),gloves:player&&equipped(actor,'gloves'),legs:player&&equipped(actor,'pants'),boots:player&&equipped(actor,'boots')},
        cape:player&&equipped(actor,'cloak'),
        tunic:player&&equipped(actor,'robe')
      };
    }
  };
})(window.Ultra=window.Ultra||{});
