(function (U) {
  const SAVE_KEY = 'ultra_v727';
  const BACKUP_KEY = 'ultra_v727_backup';
  const AUTOSAVE_MS = 45000;

  U.state.rewardMetrics = U.state.rewardMetrics || {
    kills: 0,
    gold: 0,
    equipment: 0,
    rare5: 0,
    startedAt: Date.now(),
  };

  function snapshot() {
    return {
      version: 726,
      savedAt: Date.now(),
      player: { ...U.player, target: null, bandaging: null, casting: null, miningSession: null },
      state: { ...U.state, projectiles: [], effects: [], currentCorpse: null, vendor: null },
      enemies: U.enemies,
    };
  }

  function status(text) {
    const node = U.$('#save-status');
    if (node) node.textContent = text;
  }

  function writeSave(silent) {
    try {
      const current = localStorage.getItem(SAVE_KEY);
      if (current) localStorage.setItem(BACKUP_KEY, current);
      localStorage.setItem(SAVE_KEY, JSON.stringify(snapshot()));
      status(`Guardado: ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
      if (!silent) {
        U.sound('save');
        U.toast('Partida guardada con copia de seguridad.');
      }
      return true;
    } catch (error) {
      status('No se pudo guardar. Exporta una copia de la partida.');
      if (!silent) U.toast('No se pudo guardar la partida.');
      return false;
    }
  }

  const legacyLoad = U.load;
  U.save = () => writeSave(false);
  U.load = function () {
    const preferred =
      localStorage.getItem(SAVE_KEY) ||
      localStorage.getItem('ultra_v726') ||
      localStorage.getItem('ultra_v724');
    if (!preferred) return legacyLoad();
    try {
      const d = JSON.parse(preferred);
      if (!d.player || !d.state || !Array.isArray(d.enemies)) throw new Error('guardado incompleto');
      Object.assign(U.player, d.player);
      Object.assign(U.state, d.state);
      U.enemies.splice(0, U.enemies.length, ...d.enemies);
      U.normalizeInventory();
      U.ui.refreshAll();
      status('Partida V7.26 cargada correctamente.');
      U.toast('Partida cargada.');
    } catch (error) {
      const backup = localStorage.getItem(BACKUP_KEY);
      if (!backup) return U.toast('El guardado está dañado y no existe respaldo.');
      localStorage.setItem(SAVE_KEY, backup);
      U.toast('Se recuperó la copia de seguridad anterior.');
      U.load();
    }
  };

  U.exportSave = function () {
    const data = JSON.stringify(snapshot(), null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Proyecto-Ultra-partida-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    U.toast('Partida exportada.');
  };

  U.importSave = async function (file) {
    try {
      const d = JSON.parse(await file.text());
      if (!d.player || !d.state || !Array.isArray(d.enemies)) throw new Error('formato');
      localStorage.setItem(BACKUP_KEY, localStorage.getItem(SAVE_KEY) || '');
      localStorage.setItem(SAVE_KEY, JSON.stringify(d));
      U.load();
      U.toast('Partida importada.');
    } catch (error) {
      U.toast('El archivo no contiene una partida válida.');
    }
  };

  const oldKillEnemy = U.killEnemy;
  U.killEnemy = function (enemy) {
    const before = U.state.corpses.length;
    oldKillEnemy(enemy);
    const corpse = U.state.corpses.slice(before)[0];
    const metrics = U.state.rewardMetrics;
    metrics.kills++;
    for (const item of corpse?.items || []) {
      if (item.id === 'gold') metrics.gold += item.qty || 0;
      const def = U.itemDefs[item.id];
      if (def?.slot) {
        metrics.equipment++;
        if (Object.values(item.bonuses || {}).some(value => Number(value) >= 5)) metrics.rare5++;
      }
    }
    refreshBalance();
  };

  function refreshBalance() {
    const node = U.$('#balance-summary');
    if (!node) return;
    const m = U.state.rewardMetrics;
    const hours = Math.max(1 / 60, (Date.now() - m.startedAt) / 3600000);
    node.textContent =
      `Recompensas de esta prueba: ${m.kills} derrotados · ${Math.round(m.gold / hours)} oro/h · ` +
      `${(m.equipment / hours).toFixed(1)} piezas/h · ${m.rare5} piezas con afijo ≥5%.`;
  }

  // La potencia cambia la lectura visual del objeto además de su color.
  for (const def of Object.values(U.itemDefs)) {
    if (!def.slot) continue;
    const power =
      (def.damage || def.armor || 0) +
      Object.values(def.bonuses || {}).reduce((a, b) => a + Number(b || 0), 0);
    def.visualTier = power >= 32 ? 'maestro' : power >= 18 ? 'reforzado' : 'simple';
    def.visualMark = def.visualTier === 'maestro' ? '◆' : def.visualTier === 'reforzado' ? '◇' : '·';
  }

  const oldDescribe = U.ui.describeItem;
  U.ui.describeItem = function (item) {
    const def = U.itemDefs[item.id] || {};
    const identity = def.combatIdentity || def.identity;
    return (
      oldDescribe(item) +
      `<div class="item-identity"><b>Silueta:</b> ${def.visualMark || '·'} ${def.visualTier || 'simple'}` +
      `${identity ? `<br><b>Función:</b> ${identity}` : ''}</div>`
    );
  };

  // Separación suave: evita que los enemigos ocupen exactamente el mismo punto.
  const oldUpdate = U.update;
  U.update = function (dt) {
    oldUpdate(dt);
    const alive = U.enemies.filter(e => !e.dead);
    for (let i = 0; i < alive.length; i++) {
      for (let j = i + 1; j < alive.length; j++) {
        const a = alive[i],
          b = alive[j],
          dx = a.x - b.x,
          dy = a.y - b.y;
        const distance = Math.hypot(dx, dy);
        if (distance <= 0 || distance >= 0.72) continue;
        const push = (0.72 - distance) * 0.5;
        a.x += (dx / distance) * push;
        a.y += (dy / distance) * push;
        b.x -= (dx / distance) * push;
        b.y -= (dy / distance) * push;
      }
    }
  };

  addEventListener('pagehide', () => writeSave(true));
  setInterval(() => writeSave(true), AUTOSAVE_MS);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') writeSave(true);
  });

  const exportButton = U.$('#export-save-btn');
  const importButton = U.$('#import-save-btn');
  const importFile = U.$('#import-save-file');
  if (exportButton) exportButton.onclick = U.exportSave;
  if (importButton) importButton.onclick = () => importFile.click();
  if (importFile)
    importFile.onchange = () => {
      if (importFile.files[0]) U.importSave(importFile.files[0]);
      importFile.value = '';
    };
  if (U.$('#save-btn')) U.$('#save-btn').onclick = U.save;
  if (U.$('#load-btn')) U.$('#load-btn').onclick = U.load;
  refreshBalance();
})((window.Ultra = window.Ultra || {}));
