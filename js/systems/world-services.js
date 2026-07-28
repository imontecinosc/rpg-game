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
          y = c.y + Math.sin(a) * (c.safe - 3),
          meleeWeapons = ['ironSword', 'dagger', 'greatSword', 'spear', 'mace', 'battleAxe'],
          weaponId = U.pick(meleeWeapons.filter(id => U.itemDefs[id]));
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
          equipment: {
            weapon: U.createEquipmentInstance(weaponId),
            chest: U.createEquipmentInstance(U.pick(['ironChest', 'copperChest', 'leatherChest'])),
            head: U.createEquipmentInstance(U.pick(['ironHelmet', 'copperHelmet', 'leatherHelmet'])),
            ...(U.itemDefs[weaponId]?.twoHand ? {} : { shield: U.createEquipmentInstance('shield') }),
          },
          skills: {
            Espada: 100,
            Esgrima: 100,
            'Armas contundentes': 100,
            Pelea: 100,
            'Dominio del escudo': 100,
          },
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
    U.terrain.mines.forEach((mine, i) => {
      const hasForge = U.terrain.stations.some(
        s => s.type === 'forge' && Math.hypot(s.x - mine.x, s.y - mine.y) < mine.r,
      );
      if (!hasForge)
        U.terrain.stations.push({
          type: 'forge',
          name: `Forja minera ${i + 1}`,
          x: mine.x + 1.5,
          y: mine.y + 1.5,
        });
    });
    U.npcs = U.npcs.filter(n => !U.terrain.mines.some(m => Math.hypot(n.x - m.x, n.y - m.y) < m.r));
    const animalTypes = new Set(['wolf', 'boar', 'bear', 'alphaWolf', 'armoredBoar']);
    const bossAnchors = [
      { x: -82, y: -88 },
      { x: 70, y: -60 },
      { x: 118, y: 18 },
    ];
    function spawnZone(types, cx, cy, radius, count, category = 'hostile') {
      let placed = 0,
        attempts = 0;
      while (placed < count && attempts++ < count * 80) {
        const a = U.rnd(0, Math.PI * 2),
          r = Math.sqrt(Math.random()) * radius,
          x = cx + Math.cos(a) * r,
          y = cy + Math.sin(a) * r,
          tooClose = U.enemies.some(e => {
            const distance = Math.hypot(e.x - x, e.y - y),
              otherAnimal = animalTypes.has(e.type);
            return distance < (category === 'animal' || otherAnimal ? 8 : 5);
          }),
          nearCity = U.cities.some(c => Math.hypot(c.x - x, c.y - y) < c.safe + 10),
          nearBoss = bossAnchors.some(b => Math.hypot(b.x - x, b.y - y) < 8);
        if (tooClose || nearCity || nearBoss) continue;
        U.spawnEnemy(U.pick(types), x, y);
        placed++;
      }
    }
    spawnZone(['wolf', 'boar', 'bear'], -142, 92, 34, 14, 'animal');
    spawnZone(['wolf', 'boar'], 134, 118, 29, 11, 'animal');
    spawnZone(['alphaWolf'], -176, 68, 22, 5, 'animal');
    spawnZone(['armoredBoar'], 172, 132, 22, 5, 'animal');
    spawnZone(['zombie', 'skeleton'], 64, -54, 22, 16);
    spawnZone(['bandit'], 108, -8, 28, 10);
    spawnZone(['spider', 'venomSpider'], 92, -42, 25, 10);
    spawnZone(['troll'], 126, 22, 25, 8);
    spawnZone(['caveCrawler'], 170, -112, 25, 10);
    spawnZone(['mireSpider'], -104, -112, 28, 9);
    spawnZone(['bogZombie'], -68, -96, 24, 8);
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
    // Minería y tala entrenan Fuerza únicamente al iniciar una recolección válida.
    U.raiseStat(type === 'fish' ? 'dex' : 'str', type === 'mine' ? 0.12 : 0.1);
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
