(function (U) {
  'use strict';
  U.VERSION = '7.27';

  const $ = selector => document.querySelector(selector);
  const minimap = $('#minimap');
  const minimapPanel = $('#minimap-panel');
  const mm = minimap?.getContext('2d');
  let minimapClock = 0;

  function hostileCandidates() {
    return (U.enemies || [])
      .filter(enemy => !enemy.dead)
      .sort((a, b) => U.dist(U.player, a) - U.dist(U.player, b));
  }

  U.cycleTarget = function () {
    const candidates = hostileCandidates();
    if (!candidates.length) return U.toast('No hay enemigos cercanos.');
    const nearby = candidates.filter(enemy => U.dist(U.player, enemy) <= 12);
    const pool = nearby.length ? nearby : candidates.slice(0, 1);
    const index = pool.indexOf(U.player.target);
    U.player.target = pool[(index + 1) % pool.length];
    if (!U.state.battle) U.toggleBattle();
    U.state.autoAttack = true;
    U.ui.updateBattleUI();
    U.toast(`Objetivo: ${U.player.target.name} · ${U.dist(U.player, U.player.target).toFixed(1)} m`);
  };

  function quickAction(action) {
    if (action === 'bandage') return U.healBandage();
    if (action === 'potion') return U.usePotion();
    if (action === 'use') return U.useAction();
    if (action === 'special60') return U.useSpecial(60);
  }

  $('#cycle-target').addEventListener('click', U.cycleTarget);
  $('#quickbar').addEventListener('click', event => {
    const button = event.target.closest('[data-quick]');
    if (button) quickAction(button.dataset.quick);
  });
  $('#minimap-toggle').addEventListener('click', () => {
    minimapPanel.classList.toggle('collapsed');
    $('#minimap-toggle').textContent = minimapPanel.classList.contains('collapsed') ? '+' : '−';
  });
  addEventListener('keydown', event => {
    if (event.repeat) return;
    if (event.key === '7') quickAction('bandage');
    if (event.key === '8') quickAction('potion');
    if (event.key.toLowerCase() === 'q') U.cycleTarget();
  });

  function dot(ctx, x, y, radius, color) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }

  function drawMinimap() {
    if (!mm || minimapPanel.classList.contains('collapsed')) return;
    const w = minimap.width,
      h = minimap.height,
      radius = 18;
    mm.clearRect(0, 0, w, h);
    mm.fillStyle = '#171a16';
    mm.fillRect(0, 0, w, h);
    mm.strokeStyle = 'rgba(206,190,150,.13)';
    mm.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
      mm.beginPath();
      mm.moveTo(0, i * 24 + 8);
      mm.lineTo(w, i * 24 + 8);
      mm.stroke();
    }
    const project = object => ({
      x: w / 2 + (object.x - U.player.x) * (w / (radius * 2)),
      y: h / 2 + (object.y - U.player.y) * (h / (radius * 2)),
    });
    for (const station of U.terrain?.stations || []) {
      if (U.dist(U.player, station) > radius) continue;
      const p = project(station);
      dot(mm, p.x, p.y, 2.5, '#d7af5d');
    }
    for (const corpse of U.state?.corpses || []) {
      if (U.dist(U.player, corpse) > radius) continue;
      const p = project(corpse);
      dot(mm, p.x, p.y, 2, '#a89b88');
    }
    for (const enemy of U.enemies || []) {
      if (enemy.dead || U.dist(U.player, enemy) > 8) continue;
      const p = project(enemy);
      dot(
        mm,
        p.x,
        p.y,
        enemy === U.player.target ? 4 : 2.2,
        enemy === U.player.target ? '#ffd36e' : '#b84d47',
      );
    }
    dot(mm, w / 2, h / 2, 4, '#78b8ee');
    mm.strokeStyle = '#e7ddc2';
    mm.strokeRect(0.5, 0.5, w - 1, h - 1);
    $('#minimap-zone').textContent = $('#location-name')?.textContent || 'Valdoria';
  }

  const previousUpdate = U.update;
  U.update = function (dt) {
    previousUpdate(dt);
    minimapClock -= dt;
    if (minimapClock <= 0) {
      minimapClock = 0.2;
      drawMinimap();
    }
    const target = U.player.target;
    const targetButton = $('#cycle-target');
    targetButton.classList.toggle('active', !!target && !target.dead);
    targetButton.querySelector('span').textContent =
      target && !target.dead ? `${target.name} ${U.dist(U.player, target).toFixed(1)}m` : 'Objetivo';
    const card = $('#target-card');
    if (target && !target.dead) {
      const distance = U.dist(U.player, target);
      card.dataset.range = distance <= 2 ? 'near' : distance <= 9 ? 'medium' : 'far';
      const status = $('#auto-status');
      if (status)
        status.textContent =
          distance > 9 ? 'Fuera de alcance' : U.state.autoAttack ? 'Autoataque activo' : 'Marcado';
    }
  };

  const previousHitEnemy = U.hitEnemy;
  U.hitEnemy = function (target, damage, critical) {
    previousHitEnemy(target, damage, critical);
    const text = critical ? 'CRÍTICO' : damage <= 0 ? 'BLOQUEADO' : null;
    if (text)
      U.state.effects.push({
        type: 'float',
        x: target.x,
        y: target.y,
        text,
        color: critical ? '#ffd36e' : '#9ec9e8',
        life: 1,
      });
  };
})((window.Ultra = window.Ultra || {}));
