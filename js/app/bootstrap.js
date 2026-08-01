(function (U) {
  function equipInitialItems() {
    const initialEquipment = {
      head: 'clothCap', neck: 'clothNeck', chest: 'clothShirt', arms: 'clothSleeves',
      gloves: 'clothGloves', pants: 'clothPants', boots: 'clothBoots',
      weapon: 'ironSword', shield: 'shield',
    };
    Object.entries(initialEquipment).forEach(([slot, id]) => {
      const index = U.player.inventory.findIndex(item => item.id === id);
      if (index >= 0) U.player.equipment[slot] = U.player.inventory.splice(index, 1)[0];
    });
  }

  function seedNewGame() {
    U.addItem('gold', 100);
    U.addItem('bandage', 200);
    U.addItem('potion', 3);
    ['ironSword', 'shield', 'pickaxe', 'workAxe', 'staff'].forEach(id => U.addItem(id));
    ['clothCap', 'clothNeck', 'clothShirt', 'clothSleeves', 'clothGloves', 'clothPants', 'clothBoots']
      .forEach(id => U.addItem(id));
    U.normalizeInventory();
    equipInitialItems();
  }

  U.app = U.app || {};
  U.app.start = function () {
    try {
      U.initCanvas();
      U.setupWorld();
      seedNewGame();
      U.bindInput();
      U.ui.bind();
      U.ui.refreshAll();
      U.last = performance.now();
      U.events?.emit('app:ready', { player: U.player, state: U.state });
      requestAnimationFrame(U.loop);
      U.toast('Proyecto Ultra cargado. Arquitectura modular activa.');
    } catch (error) {
      console.error(error);
      const box = document.querySelector('#error-box');
      box.hidden = false;
      box.textContent = 'Error de inicio: ' + (error.stack || error.message || error);
    }
  };

  U.app.start();
})(window.Ultra = window.Ultra || {});
