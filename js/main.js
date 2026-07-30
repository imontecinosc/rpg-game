(function (U) {
  try {
    U.initCanvas();
    U.setupWorld();
    U.addItem('gold', 100);
    U.addItem('bandage', 200);
    U.addItem('potion', 3);
    U.addItem('ironSword');
    U.addItem('shield');
    [
      'clothCap',
      'clothNeck',
      'clothShirt',
      'clothSleeves',
      'clothGloves',
      'clothPants',
      'clothBoots',
    ].forEach(id => U.addItem(id));
    U.normalizeInventory();
    const initialClothes = {
      head: 'clothCap',
      neck: 'clothNeck',
      chest: 'clothShirt',
      arms: 'clothSleeves',
      gloves: 'clothGloves',
      pants: 'clothPants',
      boots: 'clothBoots',
      weapon: 'ironSword',
      shield: 'shield',
    };
    for (const [slot, id] of Object.entries(initialClothes)) {
      const i = U.player.inventory.findIndex(it => it.id === id);
      if (i >= 0) U.player.equipment[slot] = U.player.inventory.splice(i, 1)[0];
    }
    U.bindInput();
    U.ui.bind();
    U.ui.refreshAll();
    U.last = performance.now();
    requestAnimationFrame(U.loop);
    U.toast('V7.33 cargada. Vendaje aleatorio, Anatomía activa y NPC en movimiento.');
  } catch (err) {
    console.error(err);
    const box = document.querySelector('#error-box');
    box.hidden = false;
    box.textContent = 'Error de inicio: ' + (err.stack || err.message || err);
  }
})((window.Ultra = window.Ultra || {}));
