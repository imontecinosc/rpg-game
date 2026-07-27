(function (U) {
  U.setupWorld = function () {
    U.cities.forEach(c => {
      const vendors = [
        ['magic', 'Escriba arcano', 8, 3, '#755c9b'],
        ['leather', 'Curtidor', 11, 9, '#855638'],
        ['iron', 'Armero', 3, 12, '#87919a'],
        ['weapons', 'Maestro de armas', -7, 12, '#9a7c55'],
        ['clothing', 'Sastre', -12, 5, '#735c83'],
        ['supplies', 'Proveedor', -12, -4, '#8b7655'],
        ['rare', 'Mercader de metales raros', 8, -10, '#a482b9'],
      ];
      vendors.forEach(([catalog, name, dx, dy, color]) =>
        U.npcs.push({
          type: 'vendor',
          catalog,
          name: name + ' de ' + c.name,
          x: c.x + dx,
          y: c.y + dy,
          city: c.name,
          color,
          nameColor: '#69a9d8',
        }),
      );
      U.npcs.push(
        {
          type: 'banker',
          name: 'Banquero de ' + c.name,
          x: c.x - 4,
          y: c.y + 3,
          city: c.name,
          color: '#d9d2b2',
          nameColor: '#69a9d8',
        },
        {
          type: 'healer',
          name: 'Sanador de ' + c.name,
          x: c.x + 2,
          y: c.y - 6,
          city: c.name,
          color: '#ddd',
          nameColor: '#69a9d8',
        },
      );
      for (let i = 0; i < 4; i++) {
        const a = (i * Math.PI) / 2 + 0.35,
          x = c.x + Math.cos(a) * (c.safe - 3),
          y = c.y + Math.sin(a) * (c.safe - 3);
        U.npcs.push({
          type: 'guard',
          name: 'Guardia de ' + c.name,
          x,
          y,
          homeX: x,
          homeY: y,
          city: c.name,
          color: '#8ea0b0',
          nameColor: '#69a9d8',
          speed: 4.15,
          attackCd: 0,
          attackAnim: 0,
          moving: false,
        });
      }
    });
    U.npcs.push({
      type: 'faction',
      name: 'Custodia Mara',
      x: 45,
      y: -38,
      city: 'Cementerio de los Susurros',
      color: '#6b596f',
      nameColor: '#c7a7e7',
    });
    const spots = [
      [34, -30],
      [58, -48],
      [70, -60],
      [82, -48],
      [104, 8],
      [126, -52],
      [-56, 48],
      [-72, -42],
    ];
    for (let i = 0; i < 58; i++) {
      const q = U.pick(spots);
      U.spawnEnemy(
        U.pick(['wolf', 'zombie', 'bandit', 'skeleton', 'boar', 'bear', 'spider']),
        q[0] + U.rnd(-8, 8),
        q[1] + U.rnd(-8, 8),
      );
    }
    for (let i = 0; i < 5; i++) U.spawnEnemy('alphaWolf', -82 + U.rnd(-12, 12), -54 + U.rnd(-10, 10));
    for (let i = 0; i < 5; i++) U.spawnEnemy('armoredBoar', 48 + U.rnd(-14, 14), 72 + U.rnd(-12, 12));
    for (let i = 0; i < 6; i++) U.spawnEnemy('venomSpider', 82 + U.rnd(-13, 13), -25 + U.rnd(-11, 11));
    for (let i = 0; i < 8; i++) U.spawnEnemy('troll', 108 + U.rnd(-12, 12), 8 + U.rnd(-12, 12));
    for (let i = 0; i < 12; i++) U.spawnEnemy('caveCrawler', 166 + U.rnd(-16, 16), -108 + U.rnd(-15, 15));
    for (let i = 0; i < 10; i++) U.spawnEnemy('mireSpider', -78 + U.rnd(-18, 18), -82 + U.rnd(-16, 16));
    for (let i = 0; i < 9; i++) U.spawnEnemy('bogZombie', -84 + U.rnd(-17, 17), -88 + U.rnd(-15, 15));
    U.spawnEnemy('veilKeeper', -82, -88, true, 'renowned');
    U.spawnEnemy('cryptBoss', 70, -60, true, 'renowned');
    U.spawnEnemy('boss', 118, 18, true, 'renowned');
  };
  U.getContextAction = function () {
    const p = U.player;
    let npc = U.npcs.find(n => U.dist(p, n) < 2.25);
    if (npc) return { type: 'use', label: 'Hablar', icon: '💬', target: npc };
    let corpse = U.state.corpses.find(c => U.dist(p, c) < 2.25);
    if (corpse) return { type: 'use', label: 'Saquear', icon: '🧰', target: corpse };
    const mine = U.terrain.mines.find(m => Math.hypot(p.x - m.x, p.y - m.y) < m.r);
    if (mine) return { type: 'mine', label: 'Minar', icon: '⛏️' };
    const forest = U.terrain.forests.find(f => Math.hypot(p.x - f.x, p.y - f.y) < f.r);
    if (forest) return { type: 'wood', label: 'Talar', icon: '🪓' };
    const water = U.terrain.water.find(w => Math.hypot(p.x - w.x, p.y - w.y) < w.r + 2);
    if (water) return { type: 'fish', label: 'Pescar', icon: '🎣' };
    const st = U.terrain.stations.find(s => Math.hypot(p.x - s.x, p.y - s.y) < 2.3);
    if (st) return { type: 'station', label: 'Artesanía', icon: '⚒️', target: st };
    return { type: 'use', label: 'Usar', icon: '✋' };
  };
  U.useAction = function () {
    const a = U.getContextAction();
    if (a.target?.items) return U.ui.openCorpse(a.target);
    if (a.target?.type && ['vendor', 'banker', 'healer', 'guard', 'faction'].includes(a.target.type))
      return U.interactNpc(a.target);
    if (a.type === 'station') return U.ui.openCraft(a.target.type);
    if (['mine', 'wood', 'fish'].includes(a.type)) return U.gather(a.type);
    U.toast('No hay nada útil cerca.');
  };
  U.gather = function (type) {
    if (U.player.bandaging) return;
    const rich =
        type === 'mine' &&
        U.terrain.mines.some(v => v.rich && Math.hypot(U.player.x - v.x, U.player.y - v.y) < v.r),
      times = { mine: rich ? 1.25 : 2.5, wood: 2.1, fish: 2.8 };
    U.player.bandaging = { t: times[type], total: times[type], gather: type };
    if (rich) {
      U.raiseSkill('Minería', 0.45);
      if (U.player.skills.Minería >= 70 && Math.random() < 0.08) U.addItem('mithrilOre', 1);
      if (Math.random() < 0.3) U.addItem('coal', 1);
    }
    U.raiseStat(type === 'fish' ? 'dex' : 'str', type === 'mine' ? 0.12 : 0.08);
    U.sound(type === 'mine' ? 'mine' : type === 'wood' ? 'wood' : 'fish');
    U.toast(
      type === 'mine'
        ? rich
          ? 'Trabajas una veta de entrenamiento rica…'
          : 'Golpeas la veta automáticamente…'
        : type === 'wood'
          ? 'Talas un árbol…'
          : 'Lanzas la caña…',
    );
  };
  U.interactNpc = function (n) {
    if (U.dist(U.player, n) > 2.3) return U.toast('Acércate más.');
    if (n.type === 'vendor') U.ui.openVendor(n);
    if (n.type === 'banker') U.ui.openBank();
    if (n.type === 'healer') {
      U.player.hp = U.player.maxHp;
      U.player.mana = U.player.maxMana;
      U.sound('heal');
      U.toast('El sanador restaura tus fuerzas.');
    }
    if (n.type === 'guard') U.toast('“Mantén la paz dentro de ' + n.city + '.”');
    if (n.type === 'faction')
      U.toast(
        'Mara: “Explora el cementerio y derrota a su guardián. Las recompensas de facción llegarán en la próxima expansión.”',
      );
  };
})((window.Ultra = window.Ultra || {}));
