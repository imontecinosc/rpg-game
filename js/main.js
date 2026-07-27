(function(U){
  try{
    U.initCanvas();U.setupWorld();
    U.addItem('gold',350);U.addItem('bandage',20);U.addItem('potion',8);U.addItem('manaPotion',3);U.addItem('ironSword');U.addItem('greatSword');U.addItem('spear');U.addItem('bow');U.addItem('mace');U.addItem('gauntlets');U.addItem('shield');U.addItem('leatherChest');U.addItem('helmet');U.addItem('boots');U.addItem('ironOre',12);U.addItem('wood',10);U.addItem('herb',8);U.addItem('arrow',40);
    U.normalizeInventory();U.bindInput();U.ui.bind();U.ui.refreshAll();U.last=performance.now();requestAnimationFrame(U.loop);U.toast('V5.6 cargada. Progresión visible, comercio y banco por selección, criaturas Exaltadas y Notables.');
  }catch(err){console.error(err);const box=document.querySelector('#error-box');box.hidden=false;box.textContent='Error de inicio: '+(err.stack||err.message||err)}
})(window.Ultra=window.Ultra||{});
