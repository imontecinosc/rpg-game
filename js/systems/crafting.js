(function(U){
  U.craft=function(i){const r=U.recipes[i];if(!r||U.player.skills[r.skill]<r.lvl)return;for(const [id,q] of Object.entries(r.in))if(U.countItem(id)<q)return U.toast('Te faltan materiales.');for(const [id,q] of Object.entries(r.in))U.removeItem(id,q);for(const [id,q] of Object.entries(r.out))U.addItem(id,q);U.raiseSkill(r.skill,.35);U.toast('Fabricas '+r.name);U.ui.refreshAll();U.ui.refreshCraft(r.cat)};
})(window.Ultra=window.Ultra||{});
