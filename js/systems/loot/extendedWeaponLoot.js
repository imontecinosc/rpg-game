(function (U) {
  const originalKillEnemy = U.killEnemy;
  const weaponPool = ['dagger', 'greatMace', 'greatAxe', 'greatSpear', 'staff', 'pickaxe', 'workAxe'];

  U.killEnemy = function (enemy) {
    const before = U.state.corpses.length;
    originalKillEnemy(enemy);
    const corpse = U.state.corpses.slice(before)[0];
    if (!corpse) return;

    const chance = Math.min(.16, .025 + (enemy.danger || 1) * .012 + (enemy.boss ? .05 : 0));
    if (Math.random() < chance) {
      const id = U.pick(weaponPool);
      const item = U.createEquipmentInstance(id, { danger: enemy.danger || 1 });
      corpse.items.push(item);
      U.events?.emit('loot:generated', { enemy, corpse, item });
    }
  };
})(window.Ultra = window.Ultra || {});
