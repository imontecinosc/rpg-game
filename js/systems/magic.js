(function (U) {
  U.spells = [
    { id: 'spark', name: 'Chispa', icon: '✦', mana: 6, cd: 0.7, range: 7, cast: 0.25, level: 0 },
    {
      id: 'mend',
      name: 'Remiendo vital',
      icon: '✚',
      mana: 8,
      cd: 1,
      range: 0,
      cast: 0.4,
      level: 5,
      heal: 18,
    },
    { id: 'ice', name: 'Aguja de hielo', icon: '❄️', mana: 12, cd: 1, range: 10, cast: 0.45, level: 10 },
    { id: 'fireball', name: 'Bola de fuego', icon: '🔥', mana: 14, cd: 1.1, range: 11, cast: 0.7, level: 20 },
    {
      id: 'ward',
      name: 'Guarda arcana',
      icon: '◇',
      mana: 15,
      cd: 4,
      range: 0,
      cast: 0.8,
      level: 30,
      heal: 24,
    },
    { id: 'curse', name: 'Veneno arcano', icon: '☠️', mana: 16, cd: 2, range: 8, cast: 0.8, level: 40 },
    { id: 'frost', name: 'Nova de escarcha', icon: '❅', mana: 20, cd: 2.5, range: 8, cast: 1, level: 50 },
    { id: 'heal', name: 'Luz vital', icon: '✨', mana: 20, cd: 2, range: 0, cast: 1.2, level: 60, heal: 35 },
    { id: 'lightning', name: 'Rayo', icon: '⚡', mana: 18, cd: 1.5, range: 9, cast: 1.05, level: 70 },
    {
      id: 'meteor',
      name: 'Fragmento celeste',
      icon: '☄️',
      mana: 28,
      cd: 3.5,
      range: 12,
      cast: 1.6,
      level: 80,
    },
    { id: 'drain', name: 'Drenaje del Velo', icon: '◈', mana: 30, cd: 4, range: 9, cast: 1.8, level: 90 },
    { id: 'storm', name: 'Tormenta arcana', icon: '🌩️', mana: 38, cd: 5, range: 12, cast: 2.1, level: 100 },
  ];
  U.selectSpell = id => {
    const spell = U.spells.find(s => s.id === id);
    if (spell) {
      U.state.selectedSpell = spell.id;
      U.ui.renderSpells();
    }
  };
  U.hasEquippedSpellbook = () =>
    U.player.equipment.shield && U.itemDefs[U.player.equipment.shield.id]?.type === 'spellbook';
  U.learnSpell = function (inventoryIndex) {
    const it = U.player.inventory[inventoryIndex],
      d = it && U.itemDefs[it.id];
    if (!d?.spell) return;
    if (!U.hasEquippedSpellbook()) return U.toast('Equipa un grimorio antes de copiar el pergamino.');
    if (U.player.knownSpells.includes(d.spell)) return U.toast('Ese hechizo ya está escrito en tu grimorio.');
    U.player.knownSpells.push(d.spell);
    U.player.inventory.splice(inventoryIndex, 1);
    U.sound('magic');
    U.toast('Hechizo aprendido. Equípalo como favorito desde el grimorio.');
    U.ui.refreshAll();
  };
  U.toggleFavoriteSpell = function (id) {
    if (!U.hasEquippedSpellbook() || !U.player.knownSpells.includes(id)) return;
    const f = U.player.favoriteSpells;
    if (f.includes(id)) f.splice(f.indexOf(id), 1);
    else if (f.length < 6) f.push(id);
    else return U.toast('El grimorio admite hasta 6 hechizos favoritos.');
    U.state.selectedSpell = f[0] || null;
    U.ui.refreshAll();
  };
  U.cancelCast = function (motivo) {
    if (!U.player.casting) return;
    U.player.casting = null;
    U.player.castAnim = 0;
    if (motivo) U.toast(motivo);
    if (U.ui && U.ui.refreshCastBar) U.ui.refreshCastBar();
  };
  U.castSpell = function (id) {
    if (Number.isInteger(id)) id = U.player.favoriteSpells[id];
    if (typeof id === 'string') U.selectSpell(id);
    const sp = U.spells.find(s => s.id === U.state.selectedSpell);
    if (!sp) return;
    if (!U.hasEquippedSpellbook()) return U.toast('Debes equipar un grimorio.');
    if (!U.player.favoriteSpells.includes(sp.id) || !U.player.knownSpells.includes(sp.id))
      return U.toast('Ese hechizo no está equipado desde el grimorio.');
    if ((U.player.skills.Magia || 0) < sp.level) return U.toast(`Requiere Magia ${sp.level}.`);
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
    U.sound('cast');
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
      spark: '#ffe5a0',
      mend: '#9dffc3',
      ward: '#86c9ff',
      frost: '#7ccfff',
      meteor: '#ff984d',
      drain: '#a66be8',
      storm: '#c8a8ff',
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
    if (sp.heal) {
      U.player.mana -= sp.mana;
      U.player.hp = Math.min(U.player.maxHp, U.player.hp + sp.heal + U.player.skills.Magia * 0.15);
      U.player.spellCd = sp.cd;
      U.sound('heal');
      return U.toast('La magia restaura tu vida.');
    }
    const t = U.player.target;
    if (!t || t.dead || !t.hp) return U.toast('Selecciona un enemigo.');
    if (U.dist(U.player, t) > sp.range) return U.toast('Objetivo fuera de alcance.');
    U.player.mana -= sp.mana;
    U.player.spellCd = sp.cd;
    U.state.projectiles.push({ x: U.player.x, y: U.player.y, target: t, speed: 10, spell: sp });
    U.sound(sp.id);
    U.raiseSkill('Magia', 0.18);
    U.raiseStat('int', 0.16);
  };
})((window.Ultra = window.Ultra || {}));
