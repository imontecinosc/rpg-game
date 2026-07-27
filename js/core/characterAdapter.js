(function(U){
  const playerPalette={skin:'#bb8d72',shirt:'#677386',pants:'#566479',hair:'#3b2a24',tunic:'#7d586a',cape:'#56303c',armor:'#8d98a1'};
  const npcPalettes={
    vendor:{skin:'#c29476',shirt:'#9a6b3d',pants:'#55483d',hair:'#493326',tunic:'#a87b45',cape:'#553928',armor:'#81786b'},
    banker:{skin:'#c79a7c',shirt:'#73654d',pants:'#403a36',hair:'#30251f',tunic:'#b2a275',cape:'#4b4033',armor:'#817c70'},
    healer:{skin:'#d0a188',shirt:'#d2c8ad',pants:'#6d655c',hair:'#7a6551',tunic:'#e2dcc9',cape:'#796e65',armor:'#9c978d'},
    guard:{skin:'#ad8068',shirt:'#687785',pants:'#3e4850',hair:'#332821',tunic:'#596978',cape:'#3d4753',armor:'#8b99a3'},
    bandit:{skin:'#a87563',shirt:'#71433d',pants:'#403739',hair:'#251e1b',tunic:'#633632',cape:'#35282a',armor:'#706b66'},
    zombie:{skin:'#77856c',shirt:'#5c6252',pants:'#464940',hair:'#393b31',tunic:'#626756',cape:'#393d34',armor:'#73786d'}
  };
  U.CharacterAdapter={
    getState(actor,options={}){
      const player=actor===U.player;
      return {
        direction:options.direction||actor.facing||'down',
        moving:options.pose?false:Math.hypot(actor.vx||0,actor.vy||0)>.1||!!actor.moving,
        attacking:options.pose?false:(actor.attackAnim||0)>0,
        equipment:player?(actor.equipment||{}):{},
        showWeapon:player&&!options.paperdoll,
        role:player?'player':actor.type,
        colors:player?playerPalette:(npcPalettes[actor.type]||npcPalettes.vendor)
      };
    }
  };
})(window.Ultra=window.Ultra||{});
