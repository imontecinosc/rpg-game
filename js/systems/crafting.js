(function(U){
  function craftedOptions(skill){
    const s=Math.min(100,U.player.skills[skill]||0),qRoll=Math.random(),quality=qRoll<s/800?'Obra maestra':qRoll<s/350?'Excepcional':qRoll<s/180?'Superior':'Normal';
    const rRoll=Math.random(),rarity=rRoll<s/2500?'Legendario':rRoll<s/900?'Épico':rRoll<s/350?'Raro':rRoll<s/140?'Poco común':'Común';
    return{quality,rarity,specialLegendary:rarity==='Legendario'&&quality==='Obra maestra'};
  }
  U.craft=function(i){const r=U.recipes[i];if(!r||U.player.skills[r.skill]<r.lvl)return;for(const [id,q] of Object.entries(r.in))if(U.countItem(id)<q)return U.toast('Te faltan materiales.');for(const [id,q] of Object.entries(r.in))U.removeItem(id,q);const options=craftedOptions(r.skill);for(const [id,q] of Object.entries(r.out))U.addItem(id,q,U.player.inventory,options);U.raiseSkill(r.skill,.35);U.toast(`Fabricas ${r.name}${U.itemDefs[Object.keys(r.out)[0]]?.slot?` · ${options.quality}, ${options.rarity}`:''}`);U.ui.refreshAll();U.ui.refreshCraft()};
})(window.Ultra=window.Ultra||{});
