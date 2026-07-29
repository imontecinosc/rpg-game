(function (U) {
  const danger = ['#ffe45c', '#f39a3c', '#e3483e', '#9f2034', '#6b3d88'];
  const defs = {
    wolf: {
      name: 'Lobo gris',
      hp: 55,
      dmg: 6,
      speed: 2.8,
      color: '#776c5d',
      danger: 0,
      loot: [
        ['gold', 1],
        ['bandage', 0.25],
        ['leatherChest', 0.04],
        ['herb', 0.35],
      ],
    },
    zombie: {
      name: 'Muerto errante',
      hp: 85,
      dmg: 9,
      speed: 1.8,
      color: '#65725c',
      danger: 2,
      loot: [
        ['gold', 1],
        ['herb', 0.35],
        ['manaPotion', 0.1],
        ['ringLife', 0.025],
      ],
    },
    bandit: {
      name: 'Bandido gris',
      hp: 100,
      dmg: 11,
      speed: 2.2,
      color: '#7b5149',
      danger: 3,
      loot: [
        ['gold', 1],
        ['bandage', 0.55],
        ['ironSword', 0.08],
        ['helmet', 0.07],
        ['potion', 0.15],
      ],
    },
    skeleton: {
      name: 'Custodio óseo',
      hp: 115,
      dmg: 12,
      speed: 2,
      color: '#d5d0c5',
      danger: 4,
      loot: [
        ['gold', 1],
        ['boneShard', 0.75],
        ['blackIronSword', 0.06],
        ['boneChest', 0.035],
        ['scrollGrave', 0.025],
      ],
    },
    boar: {
      name: 'Jabalí montaraz',
      hp: 78,
      dmg: 9,
      speed: 2.5,
      color: '#5e4439',
      danger: 2,
      loot: [
        ['gold', 0.65],
        ['boarHide', 1],
        ['herb', 0.18],
        ['boarGloves', 0.025],
      ],
    },
    bear: {
      name: 'Oso pardo',
      hp: 165,
      dmg: 15,
      speed: 1.7,
      color: '#56463e',
      danger: 5,
      loot: [
        ['gold', 0.8],
        ['bearLeather', 1],
        ['potion', 0.12],
        ['bearCloak', 0.025],
      ],
    },
    spider: {
      name: 'Araña umbría',
      hp: 92,
      dmg: 11,
      speed: 2.7,
      color: '#403a36',
      danger: 4,
      loot: [
        ['gold', 0.55],
        ['spiderSilk', 1],
        ['manaPotion', 0.1],
        ['spiderRobe', 0.025],
      ],
    },
    alphaWolf: {
      name: 'Lobo alfa de ceniza',
      visualType: 'wolf',
      hp: 145,
      dmg: 14,
      speed: 3.45,
      color: '#4f5357',
      danger: 5,
      loot: [
        ['gold', 1],
        ['alphaFang', 1],
        ['bandage', 0.45],
        ['fangAmulet', 0.035],
      ],
    },
    armoredBoar: {
      name: 'Jabalí acorazado',
      visualType: 'boar',
      hp: 190,
      dmg: 16,
      speed: 2.35,
      color: '#4d3a30',
      danger: 5,
      loot: [
        ['gold', 0.8],
        ['boarTusk', 1],
        ['boarHide', 1],
        ['tuskShield', 0.03],
      ],
    },
    venomSpider: {
      name: 'Araña venenosa',
      visualType: 'spider',
      hp: 125,
      dmg: 14,
      speed: 3.05,
      color: '#514064',
      danger: 5,
      loot: [
        ['gold', 0.65],
        ['venomSac', 1],
        ['spiderSilk', 1],
        ['venomDagger', 0.03],
      ],
    },
    caveCrawler: {
      name: 'Acechador de veta',
      visualType: 'spider',
      hp: 150,
      dmg: 15,
      speed: 2.55,
      color: '#625675',
      danger: 5,
      loot: [
        ['gold', 0.7],
        ['coal', 1],
        ['ironOre', 0.85],
        ['copperOre', 0.5],
        ['mithrilOre', 0.09],
        ['mithrilSword', 0.008],
      ],
    },
    mireSpider: {
      name: 'Tejedora del Velo',
      visualType: 'spider',
      hp: 145,
      dmg: 15,
      speed: 2.75,
      color: '#59456e',
      danger: 5,
      loot: [
        ['gold', 0.55],
        ['spiderSilk', 1],
        ['veilEssence', 0.7],
        ['veilCloak', 0.018],
      ],
    },
    bogZombie: {
      name: 'Hundido del pantano',
      visualType: 'zombie',
      hp: 175,
      dmg: 16,
      speed: 1.65,
      color: '#566b55',
      danger: 5,
      loot: [
        ['gold', 0.7],
        ['herb', 0.65],
        ['veilEssence', 0.45],
        ['bogMace', 0.018],
      ],
    },
    veilKeeper: {
      name: 'Custodio del Velo',
      visualType: 'troll',
      hp: 580,
      dmg: 23,
      speed: 1.25,
      color: '#51436b',
      danger: 8,
      loot: [
        ['veilShroud', 0.06],
        ['gold', 1],
        ['veilEssence', 1],
        ['veilCloak', 0.32],
        ['bogMace', 0.24],
        ['contract115', 0.08],
      ],
    },
    troll: {
      name: 'Troll de piedra',
      hp: 180,
      dmg: 16,
      speed: 1.5,
      color: '#5e7851',
      danger: 5,
      loot: [
        ['trollHide', 1],
        ['gold', 1],
        ['greatSword', 0.055],
        ['shield', 0.075],
        ['contract110', 0.015],
      ],
    },
    boss: {
      name: 'Guardián del Umbral',
      hp: 650,
      dmg: 24,
      speed: 1.2,
      color: '#5e356f',
      danger: 8,
      loot: [
        ['umbralEdge', 0.05],
        ['ringLeech', 0.04],
        ['contract110', 0.45],
        ['contract115', 0.18],
        ['contract120', 0.05],
        ['ringLife', 0.25],
        ['gold', 1],
        ['greatSword', 0.2],
      ],
    },
    cryptBoss: {
      name: 'Custodio de la Cripta',
      hp: 520,
      dmg: 21,
      speed: 1.35,
      color: '#4a5150',
      danger: 7,
      loot: [
        ['cryptCrown', 0.06],
        ['boneShard', 1],
        ['scrollGrave', 0.5],
        ['boneChest', 0.35],
        ['blackIronSword', 0.32],
        ['gold', 1],
      ],
    },
  };
  U.spawnEnemy = function (type, x, y, boss = false, variant = null) {
    const base = defs[type] || defs[boss ? 'boss' : 'wolf'];
    let d = { ...base, danger: Math.max(1, Math.min(5, Math.ceil((base.danger + 1) / 2))) };
    variant =
      variant ||
      (!boss && Math.random() < 0.025 ? 'exalted' : !boss && Math.random() < 0.09 ? 'renowned' : null);
    if (variant === 'renowned')
      d = {
        ...d,
        name: d.name + ' [Notable]',
        hp: Math.round(d.hp * 3),
        dmg: Math.round(d.dmg * 1.8),
        speed: Math.min(4.35, d.speed * 1.25),
      };
    if (variant === 'exalted')
      d = {
        ...d,
        name: d.name + ' [Exaltado]',
        hp: Math.round(d.hp * 5),
        dmg: Math.round(d.dmg * 2.35),
        speed: Math.min(4.45, d.speed * 1.35),
        color: '#d8ad32',
      };
    U.enemies.push({
      ...d,
      type,
      visualType: d.visualType || type,
      boss,
      variant,
      nameColor: variant === 'exalted' ? '#f2c94c' : danger[d.danger - 1],
      x,
      y,
      homeX: x,
      homeY: y,
      maxHp: d.hp,
      attackCd: 0,
      dead: false,
      radius: boss ? 0.7 : variant === 'exalted' ? 0.62 : variant === 'renowned' ? 0.54 : 0.42,
      status: 'hostile',
      aggro: false,
      aggroRange: 11,
      leashRange: 26,
    });
  };
  U.toggleBattle = function () {
    U.state.battle = !U.state.battle;
    U.sound('ui');
    if (!U.state.battle) {
      U.state.autoAttack = false;
      U.player.target = null;
    }
    U.ui.updateBattleUI();
  };
  U.toggleAutoAttack = function () {
    if (!U.state.battle) return U.toast('Entra en modo Batalla.');
    if (!U.player.target || U.player.target.dead) return U.toast('Marca un enemigo primero.');
    U.state.autoAttack = !U.state.autoAttack;
    U.ui.updateBattleUI();
  };
  U.weaponTrainingStat = function (weapon) {
    if (weapon.trainingStat) return weapon.trainingStat;
    if (weapon.ranged || weapon.skill === 'Arco' || weapon.skill === 'Esgrima' || weapon.skill === 'Pelea')
      return 'dex';
    return ['Espada', 'Armas contundentes'].includes(weapon.skill) ? 'str' : null;
  };
  U.attack = function () {
    if (!U.state.battle || !U.player.target || U.player.target.dead) return false;
    const t = U.player.target,
      weaponItem = U.player.equipment.weapon,
      weapon = weaponItem ? U.itemDefs[weaponItem.id] : U.itemDefs.gauntlets,
      b = U.getEquipmentBonuses(),
      qualityMult = weaponItem ? U.qualityMultipliers[weaponItem.quality || 'Normal'] || 1 : 1,
      range = weapon.ranged ? 9 : weapon.skill === 'Esgrima' ? 1.85 : 1.45;
    if (U.dist(U.player, t) > range || U.player.attackCd > 0) return false;
    U.player.attackCd =
      (weapon.ranged ? 1.05 : weapon.twoHand ? 1.05 : 0.68) * (1 - Math.min(0.3, (b.attackSpeed || 0) / 100));
    U.player.attackAnim = 0.42;
    U.player.attackTotal = 0.42;
    U.player.attackType = weapon.skill || 'Pelea';
    U.sound(weapon.ranged ? 'ui' : 'sword');
    let dmg =
      weapon.damage * qualityMult +
      (b.weaponDamage || 0) +
      (U.player.skills[weapon.skill] || 20) * 0.07 +
      U.player.skills.Tácticas * 0.04 +
      U.rnd(-2, 3);
    const crit = Math.random() < (b.critChance || 0) / 100;
    if (crit) dmg *= 1.5 + (b.critDamage || 0) / 100;
    if (weapon.ranged) {
      if (U.countItem('arrow') < 1) {
        U.state.autoAttack = false;
        U.toast('No tienes flechas.');
        return false;
      }
      U.removeItem('arrow', 1);
      U.state.projectiles.push({
        x: U.player.x,
        y: U.player.y,
        target: t,
        speed: 12,
        damage: dmg,
        physical: true,
        crit,
      });
    } else U.hitEnemy(t, dmg, crit);
    if ((b.lifeSteal || 0) > 0)
      U.player.hp = Math.min(U.player.maxHp, U.player.hp + (dmg * b.lifeSteal) / 100);
    U.raiseSkill(weapon.skill, 0.11);
    U.raiseSkill('Tácticas', 0.07);
    // Golpear también entrena Anatomía: es conocimiento del cuerpo, igual
    // que curar. Cualquier acción relacionada al cuerpo la sube.
    U.raiseSkill('Anatomía', 0.05, { difficulty: (t.danger || 1) * 12, targetKey: 'combat-anatomia' });
    const trainingStat = U.weaponTrainingStat(weapon);
    if (trainingStat) U.raiseStat(trainingStat, weapon.twoHand ? 0.14 : 0.1);
    return true;
  };
  U.hitEnemy = function (t, dmg, crit = false) {
    dmg = Math.max(1, Math.round(dmg));
    t.hp -= dmg;
    t.hitAnim = 0.18;
    t.aggro = true;
    U.sound('hit');
    U.state.effects.push({
      type: 'float',
      x: t.x,
      y: t.y,
      text: (crit ? '¡CRÍTICO! ' : '') + '-' + dmg,
      color: crit ? '#ffe07b' : '#ffd4c8',
      life: 1,
    });
    if (t.hp <= 0) U.killEnemy(t);
  };
  U.killEnemy = function (t) {
    t.dead = true;
    t.hp = 0;
    t.deathAnim = 0.8;
    t.deathTotal = 0.8;
    U.sound('death');
    const items = [],
      goldFind = 1 + (U.getEquipmentBonuses().goldFind || 0) / 100;
    for (const [id, ch] of t.loot)
      if (Math.random() <= ch)
        items.push({
          id,
          qty:
            id === 'gold'
              ? Math.round(U.rnd(t.variant ? 45 : 18, t.boss ? 260 : t.variant ? 150 : 65) * goldFind)
              : 1,
          insured: false,
          uid: Math.random().toString(36).slice(2),
        });
    const scrollPool = [
      'scrollSpark',
      'scrollMend',
      'scrollIce',
      'scrollFire',
      'scrollWard',
      'scrollCurse',
      'scrollFrost',
      'scrollHeal',
      'scrollLightning',
      'scrollMeteor',
      'scrollDrain',
      'scrollStorm',
    ];
    const scrollTier = Math.min(scrollPool.length, Math.max(2, 2 + Math.floor((t.danger || 1) * 1.35)));
    const scrollChance = Math.min(0.32, 0.04 + (t.danger || 1) * 0.018 + (t.boss ? 0.12 : 0));
    if (Math.random() < scrollChance)
      items.push({
        id: U.pick(scrollPool.slice(0, scrollTier)),
        qty: 1,
        insured: false,
        uid: Math.random().toString(36).slice(2),
      });
    const equipmentChance = Math.min(
      0.48,
      0.1 +
        (t.danger - 1) * 0.025 +
        (t.variant === 'renowned' ? 0.12 : 0) +
        (t.variant === 'exalted' ? 0.23 : 0) +
        (t.boss ? 0.16 : 0),
    );
    if (Math.random() < equipmentChance) {
      const maxTier = Math.min(4, Math.max(0, Math.floor((t.danger - 1) / 2) + (t.variant ? 1 : 0))),
        rarityRoll = Math.random(),
        rarity =
          maxTier >= 4 && rarityRoll < (t.variant === 'exalted' || t.boss ? 0.08 : 0.015)
            ? 'Legendario'
            : maxTier >= 3 && rarityRoll < 0.25
              ? 'Épico'
              : maxTier >= 2 && rarityRoll < 0.55
                ? 'Raro'
                : maxTier >= 1
                  ? 'Poco común'
                  : 'Común',
        candidates = Object.keys(U.itemDefs).filter(id => {
          const d = U.itemDefs[id];
          return d.slot && ['weapon', 'armor', 'clothing', 'jewelry'].includes(d.type);
        }),
        id = U.pick(candidates),
        qualityRoll = Math.random(),
        quality =
          qualityRoll < 0.04 + t.danger * 0.012
            ? 'Obra maestra'
            : qualityRoll < 0.16 + t.danger * 0.018
              ? 'Excepcional'
              : qualityRoll < 0.42
                ? 'Superior'
                : 'Normal',
        generated = U.createEquipmentInstance(id, {
          rarity,
          quality,
          specialLegendary: rarity === 'Legendario' && (t.variant === 'exalted' || t.boss),
        });
      if (generated) {
        generated.uid = Math.random().toString(36).slice(2);
        items.push(generated);
      }
    }
    if (t.variant === 'renowned') {
      items.push({
        id: U.pick(['potion', 'manaPotion', 'ironIngot', 'copperIngot']),
        qty: Math.round(U.rnd(2, 6)),
        insured: false,
      });
      if (Math.random() < 0.35)
        items.push({ id: U.pick(['helmet', 'boots', 'cloak', 'shield']), qty: 1, insured: false });
    }
    if (t.variant === 'exalted') {
      items.push({ id: U.pick(['greatSword', 'ringLife', 'contract110']), qty: 1, insured: false });
      items.push({ id: 'gold', qty: Math.round(U.rnd(100, 260) * goldFind), insured: false });
    }
    U.state.corpses.push({ name: 'Cadáver de ' + t.name, x: t.x, y: t.y, items, life: 300, owner: 'player' });
    U.player.target = null;
    U.state.autoAttack = false;
    U.toast(t.name + ' ha muerto.');
    U.ui.updateBattleUI();
    t.respawnAt = Date.now() + U.RESPAWN_MS;
  };
  U.healBandage = function () {
    if (U.player.healCd > 0 || U.player.bandaging) return U.toast('No puedes vendarte todavía.');
    if (U.countItem('bandage') < 1) return U.toast('No tienes vendas.');
    U.removeItem('bandage', 1);
    U.player.bandaging = { t: 0.5, total: 0.5 };
    U.toast('Comienzas a vendarte…');
    U.sound('bandage');
    U.raiseSkill('Curar', 0.08);
  };
  U.usePotion = function () {
    if (U.countItem('potion') < 1) return U.toast('No tienes pociones.');
    U.removeItem('potion', 1);
    U.player.hp = Math.min(U.player.maxHp, U.player.hp + 45);
    U.sound('potion');
    U.toast('Bebes una poción.');
    U.ui.refreshHUD();
  };
})((window.Ultra = window.Ultra || {}));
