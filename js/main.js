(function(U){
  try{
    U.initCanvas();U.setupWorld();
    U.addItem('gold',350);U.addItem('bandage',20);U.addItem('potion',8);U.addItem('manaPotion',3);U.addItem('ironSword');U.addItem('greatSword');U.addItem('spear');U.addItem('bow');U.addItem('mace');U.addItem('gauntlets');U.addItem('shield');
    ['clothCap','clothNeck','clothShirt','clothSleeves','clothGloves','clothPants','clothBoots','ironHelmet','ironNeck','ironChest','ironArms','ironGloves','ironLegs','ironBoots','cloak','robe'].forEach(U.addItem);
    U.addItem('ironOre',12);U.addItem('wood',10);U.addItem('herb',8);U.addItem('arrow',40);
    U.normalizeInventory();
    const initialClothes={head:'clothCap',neck:'clothNeck',chest:'clothShirt',arms:'clothSleeves',gloves:'clothGloves',pants:'clothPants',boots:'clothBoots'};
    for(const [slot,id] of Object.entries(initialClothes)){const i=U.player.inventory.findIndex(it=>it.id===id);if(i>=0)U.player.equipment[slot]=U.player.inventory.splice(i,1)[0]}
    U.bindInput();U.ui.bind();U.ui.refreshAll();U.last=performance.now();requestAnimationFrame(U.loop);U.toast('V5.9 cargada. Equipamiento visual completo disponible para pruebas.');
  }catch(err){console.error(err);const box=document.querySelector('#error-box');box.hidden=false;box.textContent='Error de inicio: '+(err.stack||err.message||err)}
})(window.Ultra=window.Ultra||{});
