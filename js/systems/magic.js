(function (U) {
  U.spells = [
    // cast = segundos de canalizacion antes de que el hechizo salga
    { id: 'fireball', name: 'Bola de fuego', icon: '🔥', mana: 14, cd: 1.1, range: 11, cast: 0.7 },
    { id: 'ice', name: 'Aguja de hielo', icon: '❄️', mana: 12, cd: 1, range: 10, cast: 0.45 },
    { id: 'lightning', name: 'Rayo', icon: '⚡', mana: 18, cd: 1.5, range: 9, cast: 1.05 },
    { id: 'curse', name: 'Veneno arcano', icon: '☠️', mana: 16, cd: 2, range: 8, cast: 0.8 },
    { id: 'heal', name: 'Luz vital', icon: '✨', mana: 20, cd: 2, range: 0, cast: 1.2 },
    { id: 'portal', name: 'Portal', icon: '🌀', mana: 28, cd: 8, range: 0, cast: 2.5 },
  ];
  U.selectSpell = i => {
    if (U.spells[i]) {
      U.state.selectedSpell = U.spells[i].id;
      U.ui.renderSpells();
    }
  };
  U.cancelCast = function (motivo) {
    if (!U.player.casting) return;
    U.player.casting = null;
    U.player.castAnim = 0;
    if (motivo) U.toast(motivo);
    if (U.ui && U.ui.refreshCastBar) U.ui.refreshCastBar();
  };
  U.castSpell = function (i) {
    if (Number.isInteger(i)) U.selectSpell(i);
    const sp = U.spells.find(s => s.id === U.state.selectedSpell);
    if (!sp) return;
    if (U.player.dead) return;
    if (U.player.casting) return U.toast('Ya estás canalizando un hechizo.');
    if (U.player.spellCd > 0 || U.player.mana < sp.mana) return U.toast('No puedes lanzar eso ahora.');
    if (sp.range > 0) {
      const t = U.player.target;
      if (!t || t.dead || !t.hp) return U.toast('Selecciona un enemigo.');
      if (U.dist(U.player, t) > sp.range) return U.toast('Objetivo fuera de alcance.');
    }
    const total = sp.cast || 0;
    if (!total) return U.finishCast(sp);
    // Canalizacion: el hechizo sale recien cuando el tiempo se cumple.
    U.player.casting = { id: sp.id, t: total, total };
    U.player.castAnim = total;
    if (U.ui && U.ui.refreshCastBar) U.ui.refreshCastBar();
  };
  U.finishCast = function (sp) {
    // Se revalida al terminar: el objetivo pudo morir o alejarse durante la canalizacion.
    if (U.player.mana < sp.mana) return U.cancelCast('Te quedaste sin maná.');
    if (sp.range > 0) {
      const t = U.player.target;
      if (!t || t.dead || !t.hp) return U.cancelCast('Perdiste el objetivo.');
      if (U.dist(U.player, t) > sp.range) return U.cancelCast('El objetivo se alejó.');
    }
    const colors = {
      fireball: '#ff7a20',
      ice: '#49a8ff',
      lightning: '#ffe34d',
      curse: '#a85de2',
      heal: '#8fffc1',
      portal: '#8262ea',
    };
    for (let n = 0; n < 14; n++)
      U.state.effects.push({
        type: 'particle',
        x: U.player.x + U.rnd(-0.5, 0.5),
        y: U.player.y + U.rnd(-0.5, 0.5),
        color: colors[sp.id],
        size: U.rnd(2, 4),
        life: 0.45,
      });
    if (sp.id === 'heal') {
      U.player.mana -= sp.mana;
      U.player.hp = Math.min(U.player.maxHp, U.player.hp + 35 + U.player.skills.Magia * 0.15);
      U.player.spellCd = sp.cd;
      return U.toast('La magia restaura tu vida.');
    }
    if (sp.id === 'portal') {
      U.player.mana -= sp.mana;
      U.player.spellCd = sp.cd;
      const valid = U.cities.filter(c => Math.hypot(c.x - U.player.x, c.y - U.player.y) > 12),
        dest = U.pick(valid);
      U.state.effects.push({ type: 'portal', x: U.player.x + 1, y: U.player.y, life: 300, dest });
      return U.toast('Abres un portal misterioso durante 5 minutos.');
    }
    const t = U.player.target;
    if (!t || t.dead || !t.hp) return U.toast('Selecciona un enemigo.');
    if (U.dist(U.player, t) > sp.range) return U.toast('Objetivo fuera de alcance.');
    U.player.mana -= sp.mana;
    U.player.spellCd = sp.cd;
    U.state.projectiles.push({ x: U.player.x, y: U.player.y, target: t, speed: 10, spell: sp });
    U.raiseSkill('Magia', 0.18);
    U.raiseStat('int', 0.16);
  };
})((window.Ultra = window.Ultra || {}));
