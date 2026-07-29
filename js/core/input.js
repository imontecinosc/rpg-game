(function (U) {
  U.bindInput = function () {
    const isDesktopPointer = matchMedia('(pointer: fine)').matches;
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

    function objectAt(world) {
      let best = null;
      let bestDistance = 1.55;
      const candidates = [
        ...U.enemies.filter(enemy => !enemy.dead),
        ...U.npcs,
        ...U.state.corpses,
      ];
      for (const candidate of candidates) {
        const distance = Math.hypot(candidate.x - world.x, candidate.y - world.y);
        if (distance < bestDistance) {
          best = candidate;
          bestDistance = distance;
        }
      }
      return best;
    }

    function selectOrAct(best) {
      if (!best) {
        U.player.target = null;
        U.state.autoAttack = false;
        U.ui.updateBattleUI();
        return;
      }
      const distance = U.dist(U.player, best);
      if (best.items) {
        if (distance <= 2.6) return U.ui.openCorpse(best);
        U.player.target = best;
        return U.toast('Acércate al cadáver para saquearlo.');
      }
      const isNpc = U.npcs.includes(best);
      if (isNpc) {
        U.player.target = best;
        U.state.autoAttack = false;
        U.ui.updateBattleUI();
        if (distance <= 2.6) return U.interactNpc(best);
        return U.toast(`Objetivo: ${best.name}. Acércate para interactuar.`);
      }
      U.player.target = best;
      if (U.state.battle) U.state.autoAttack = true;
      U.ui.updateBattleUI();
      U.toast('Objetivo marcado: ' + best.name);
    }

    U.canvas.addEventListener('contextmenu', e => e.preventDefault());
    U.canvas.addEventListener('pointerdown', e => {
      const r = U.canvas.getBoundingClientRect(),
        world = U.screenToWorld(e.clientX - r.left, e.clientY - r.top);
      if (isDesktopPointer && e.button === 2) {
        e.preventDefault();
        U.input.moveTarget = world;
        return;
      }
      if (e.button !== 0) return;
      selectOrAct(objectAt(world));
    });
  };
})((window.Ultra = window.Ultra || {}));
