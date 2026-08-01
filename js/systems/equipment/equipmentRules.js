(function (U) {
  const originalEquip = U.equip;

  U.findEquippedSlotByRef = function (ref) {
    if (!ref) return null;
    return U.equipmentSlots.find(slot => {
      const item = U.player.equipment[slot];
      return item && ((ref.uid && item.uid === ref.uid) || (!ref.uid && item.id === ref.id));
    }) || null;
  };

  U.equip = function (index) {
    const item = U.player.inventory[index];
    const def = item && U.itemDefs[item.id];
    if (!def || !def.slot) return;

    const missing = Object.entries(def.requirements || {})
      .find(([key, value]) => (U.player[key] || 0) < value);
    if (missing) return U.toast(`Necesitas ${missing[0].toUpperCase()} ${missing[1]} para equiparlo.`);

    let slot = def.slot;
    if (slot === 'ring1' && U.player.equipment.ring1) slot = 'ring2';

    const offItem = U.player.equipment.shield;
    const offDef = offItem && U.itemDefs[offItem.id];
    const weaponItem = U.player.equipment.weapon;
    const weaponDef = weaponItem && U.itemDefs[weaponItem.id];

    if (slot === 'weapon' && (def.twoHand || def.ranged) && offItem) {
      const compatibleSpellbook = def.allowSpellbook && offDef?.type === 'spellbook';
      if (!compatibleSpellbook) {
        U.player.inventory.push(offItem);
        delete U.player.equipment.shield;
      }
    }

    if (slot === 'shield' && weaponDef && (weaponDef.twoHand || weaponDef.ranged)) {
      const compatibleSpellbook = def.type === 'spellbook' && weaponDef.allowSpellbook;
      if (!compatibleSpellbook) return U.toast('Ese objeto de mano secundaria no puede combinarse con el arma equipada.');
    }

    if (U.player.equipment[slot]) U.player.inventory.push(U.player.equipment[slot]);
    U.player.equipment[slot] = item;
    U.player.inventory.splice(index, 1);
    U.sound('equip');
    U.events?.emit('equipment:changed', { action: 'equip', slot, item });
    U.ui.refreshAll();
  };

  const originalUnequip = U.unequip;
  U.unequip = function (slot) {
    const item = U.player.equipment[slot];
    if (!item) return;
    originalUnequip(slot);
    U.events?.emit('equipment:changed', { action: 'unequip', slot, item });
  };
})(window.Ultra = window.Ultra || {});
