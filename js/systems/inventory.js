(function (U) {
  function uid() {
    return (crypto.randomUUID && crypto.randomUUID()) || Math.random().toString(36).slice(2);
  }
  U.addItem = function (id, qty = 1, to = U.player.inventory, options = {}) {
    const d = U.itemDefs[id];
    if (!d) return false;
    // Tope de casillas. Solo aplica al inventario del jugador: banco y cadaveres
    // no tienen limite. Un apilable que ya existe no ocupa una casilla nueva.
    if (to === U.player.inventory && U.INV_SLOTS) {
      const apilaEnExistente = d.stack && to.some(i => i.id === id);
      if (!apilaEnExistente) {
        const libres = U.INV_SLOTS - to.length;
        if (libres <= 0) {
          if (U.toast) U.toast('Inventario lleno. No cabe ' + d.name + '.');
          return false;
        }
        if (!d.stack && qty > libres) {
          if (U.toast) U.toast('Inventario lleno. Solo caben ' + libres + ' de ' + d.name + '.');
          qty = libres;
        }
      }
    }
    if (d.stack) {
      const f = to.find(i => i.id === id);
      if (f) {
        f.qty = (f.qty || 1) + qty;
        return true;
      }
      to.push({ id, qty, insured: false, uid: uid() });
      return true;
    }
    for (let n = 0; n < qty; n++) {
      const generated =
        d.slot && U.createEquipmentInstance
          ? U.createEquipmentInstance(id, options)
          : { id, qty: 1, insured: false };
      to.push({ ...generated, uid: uid() });
    }
    return true;
  };
  U.countItem = (id, from = U.player.inventory) =>
    from.filter(i => i.id === id).reduce((s, i) => s + (i.qty || 1), 0);
  U.removeItem = function (id, qty = 1, from = U.player.inventory) {
    for (let i = from.length - 1; i >= 0 && qty > 0; i--) {
      const it = from[i];
      if (it.id !== id) continue;
      const take = Math.min(qty, it.qty || 1);
      it.qty = (it.qty || 1) - take;
      qty -= take;
      if (it.qty <= 0) from.splice(i, 1);
    }
    return qty === 0;
  };
  U.normalizeInventory = function () {
    const src = [...U.player.inventory],
      out = [];
    for (const it of src) {
      const d = U.itemDefs[it.id];
      if (!d) continue;
      const q = Math.max(1, Number(it.qty) || 1);
      if (d.stack) {
        const f = out.find(x => x.id === it.id);
        if (f) f.qty += q;
        else out.push({ ...it, qty: q });
      } else
        for (let n = 0; n < q; n++) {
          const base =
            d.slot && U.createEquipmentInstance
              ? U.createEquipmentInstance(it.id, {
                  rarity: it.rarity || d.rarity,
                  quality: it.quality || d.quality,
                  bonuses: it.bonuses || d.bonuses,
                })
              : {};
          out.push({ ...base, ...it, qty: 1, uid: it.uid || uid() });
        }
    }
    U.player.inventory = out;
  };
  U.equip = function (i) {
    const it = U.player.inventory[i],
      d = it && U.itemDefs[it.id];
    if (!d || !d.slot) return;
    const missing = Object.entries(d.requirements || {}).find(([k, v]) => (U.player[k] || 0) < v);
    if (missing) return U.toast(`Necesitas ${missing[0].toUpperCase()} ${missing[1]} para equiparlo.`);
    let slot = d.slot;
    if (slot === 'ring1' && U.player.equipment.ring1) slot = 'ring2';
    if ((d.twoHand || d.ranged) && U.player.equipment.shield) {
      U.player.inventory.push(U.player.equipment.shield);
      delete U.player.equipment.shield;
    }
    if (slot === 'shield' && U.player.equipment.weapon) {
      const weaponDef = U.itemDefs[U.player.equipment.weapon.id];
      if (weaponDef && (weaponDef.twoHand || weaponDef.ranged))
        return U.toast('Arcos, ballestas y armas a dos manos impiden usar escudo.');
    }
    if (U.player.equipment[slot]) U.player.inventory.push(U.player.equipment[slot]);
    U.player.equipment[slot] = it;
    U.player.inventory.splice(i, 1);
    U.sound('equip');
    U.ui.refreshAll();
  };
  U.unequip = function (slot) {
    if (!U.player.equipment[slot]) return;
    U.player.inventory.push(U.player.equipment[slot]);
    delete U.player.equipment[slot];
    U.sound('unequip');
    U.ui.refreshAll();
  };
})((window.Ultra = window.Ultra || {}));
