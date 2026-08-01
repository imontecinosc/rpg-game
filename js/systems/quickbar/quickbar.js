(function (U) {
  const HOTKEYS = ['1', '2', '3', '4', '5', 'q', 'r'];
  const defaults = [
    { id: 'ironSword' }, { id: 'shield' }, { id: 'pickaxe' }, { id: 'workAxe' },
    { id: 'bandage' }, { id: 'potion' }, null,
  ];

  U.quickbar = U.quickbar || {};
  U.quickbar.keys = HOTKEYS;
  U.state.quickSlots = Array.isArray(U.state.quickSlots) ? U.state.quickSlots : defaults;

  const refForItem = item => ({ id: item.id, uid: item.uid || null });
  const findInventoryIndex = ref => U.player.inventory.findIndex(item =>
    (ref.uid && item.uid === ref.uid) || (!ref.uid && item.id === ref.id));

  U.quickbar.syncFromInventory = function () {
    const equippedRefs = U.state.quickSlots.map(ref => ref && U.findEquippedSlotByRef(ref) ? ref : null);
    U.state.quickSlots = Array.from({ length: 7 }, (_, index) => {
      const inventoryItem = U.player.inventory[index];
      return inventoryItem ? refForItem(inventoryItem) : equippedRefs[index];
    });
    U.events?.emit('quickbar:changed', { slots: U.state.quickSlots });
  };

  U.quickbar.assign = function (index, item) {
    if (!item || !U.itemDefs[item.id] || index < 0 || index >= 7) return;
    U.state.quickSlots[index] = refForItem(item);
    U.events?.emit('quickbar:changed', { index, item, slots: U.state.quickSlots });
    U.ui.refreshQuickSlots?.();
    U.toast(`${U.itemDefs[item.id].name} asignado a ${HOTKEYS[index].toUpperCase()}.`);
  };

  U.quickbar.use = function (index) {
    const ref = U.state.quickSlots[index];
    if (!ref) return U.toast('Esta ranura está vacía.');
    const def = U.itemDefs[ref.id];
    if (!def) return;

    if (ref.id === 'bandage') return U.healBandage();
    if (ref.id === 'potion') return U.usePotion();
    if (ref.id === 'manaPotion') {
      if (U.countItem('manaPotion') < 1) return U.toast('No tienes pociones de maná.');
      U.removeItem('manaPotion', 1);
      U.player.mana = Math.min(U.player.maxMana, U.player.mana + 45);
      U.sound('heal');
      U.events?.emit('inventory:changed', { reason: 'consume', itemId: ref.id });
      U.ui.refreshAll();
      return;
    }

    if (!def.slot) return U.toast(`${def.name} no se puede equipar desde esta barra.`);
    const equippedSlot = U.findEquippedSlotByRef(ref);
    if (equippedSlot) return U.unequip(equippedSlot);
    const inventoryIndex = findInventoryIndex(ref);
    if (inventoryIndex < 0) return U.toast(`${def.name} no está en tu inventario.`);
    U.equip(inventoryIndex);
  };

  // Alias transitorios para sistemas antiguos.
  U.syncQuickSlotsFromInventory = U.quickbar.syncFromInventory;
  U.assignQuickSlot = U.quickbar.assign;
  U.useQuickSlot = U.quickbar.use;

  addEventListener('keydown', event => {
    if (event.repeat || event.ctrlKey || event.altKey || event.metaKey) return;
    const target = event.target;
    if (target && /input|textarea|select/i.test(target.tagName)) return;
    const index = HOTKEYS.indexOf(event.key.toLowerCase());
    if (index < 0) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    U.quickbar.use(index);
  }, true);
})(window.Ultra = window.Ultra || {});
