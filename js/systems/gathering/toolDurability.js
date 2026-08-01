(function (U) {
  const originalGather = U.gather;
  U.gather = function (type) {
    if (type === 'mine' || type === 'wood') {
      const equipped = U.player.equipment.weapon;
      const def = equipped && U.itemDefs[equipped.id];
      if (def?.toolAction !== type) {
        return U.toast(type === 'mine' ? 'Equipa una picota para minar.' : 'Equipa un hacha de tala para talar.');
      }
    }
    return originalGather(type);
  };

  U.damageEquippedTool = function (type, amount = 1) {
    const item = U.player.equipment.weapon;
    const def = item && U.itemDefs[item.id];
    if (!item || def?.toolAction !== type) return;

    item.durability = Math.max(0, (item.durability ?? def.durability ?? 1) - amount);
    U.events?.emit('durability:changed', { item, amount, current: item.durability });

    if (item.durability <= 0) {
      delete U.player.equipment.weapon;
      U.events?.emit('equipment:changed', { action: 'broken', slot: 'weapon', item });
      U.toast(`${def.name} se rompió.`);
    } else if (item.durability <= Math.ceil((def.durability || 1) * 0.2)) {
      U.toast(`${def.name}: durabilidad baja (${item.durability}).`);
    }
  };
})(window.Ultra = window.Ultra || {});
