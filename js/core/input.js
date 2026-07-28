(function (U) {
  U.bindInput = function () {
    addEventListener('keydown', e => {
      const k = e.key.toLowerCase();
      U.input.keys[k] = true;
      if (e.repeat) return;
      if (e.key === ' ') {
        e.preventDefault();
        U.toggleAutoAttack();
      }
      if (e.key === 'Tab') {
        e.preventDefault();
        U.toggleBattle();
      }
      if ('123456'.includes(e.key)) U.castSpell(+e.key - 1);
      if (k === 'e') U.useAction();
      if (k === 'i') U.ui.openInventory();
      if (k === 'k') U.ui.openSkills();
      if (k === 'c') U.ui.openCraft();
      if (k === 'm') U.ui.openWorld();
    });
    addEventListener('keyup', e => (U.input.keys[e.key.toLowerCase()] = false));
    const joy = U.$('#joystick'),
      stick = U.$('#stick');
    let id = null;
    function set(e) {
      const r = joy.getBoundingClientRect(),
        dx = e.clientX - (r.left + r.width / 2),
        dy = e.clientY - (r.top + r.height / 2),
        m = Math.hypot(dx, dy) || 1,
        q = Math.min(r.width * 0.32, m);
      U.input.jx = (dx / m) * Math.min(1, m / (r.width * 0.32));
      U.input.jy = (dy / m) * Math.min(1, m / (r.width * 0.32));
      stick.style.transform = `translate(${(dx / m) * q}px,${(dy / m) * q}px)`;
    }
    function end(e) {
      if (id !== null && e.pointerId !== undefined && e.pointerId !== id) return;
      id = null;
      U.input.jx = U.input.jy = 0;
      stick.style.transform = '';
    }
    joy.addEventListener('pointerdown', e => {
      id = e.pointerId;
      joy.setPointerCapture(id);
      set(e);
    });
    joy.addEventListener('pointermove', e => {
      if (e.pointerId === id) set(e);
    });
    joy.addEventListener('pointerup', end);
    joy.addEventListener('pointercancel', end);
    U.canvas.addEventListener('pointerdown', e => {
      const r = U.canvas.getBoundingClientRect(),
        w = U.screenToWorld(e.clientX - r.left, e.clientY - r.top);
      let best = null,
        bd = 1.3;
      for (const en of U.enemies) {
        if (en.dead) continue;
        const d = Math.hypot(en.x - w.x, en.y - w.y);
        if (d < bd) {
          best = en;
          bd = d;
        }
      }
      for (const n of U.npcs) {
        const d = Math.hypot(n.x - w.x, n.y - w.y);
        if (d < bd) {
          best = n;
          bd = d;
        }
      }
      for (const c of U.state.corpses) {
        const d = Math.hypot(c.x - w.x, c.y - w.y);
        if (d < bd) {
          best = c;
          bd = d;
        }
      }
      if (best) {
        if (best.items) return U.ui.openCorpse(best);
        if (best.type && ['vendor', 'banker', 'healer', 'guard'].includes(best.type))
          return U.interactNpc(best);
        U.player.target = best;
        if (U.state.battle) U.state.autoAttack = true;
        U.ui.updateBattleUI();
        U.toast('Objetivo marcado: ' + best.name);
      } else {
        U.player.target = null;
        U.state.autoAttack = false;
        U.ui.updateBattleUI();
      }
    });
  };
})((window.Ultra = window.Ultra || {}));
