(function (U) {
  const palettes = {
    player: {
      gender: 'male',
      skin: '#bb8d72',
      underwear: '#39414a',
      shirt: '#677386',
      pants: '#566479',
      tunic: '#7d586a',
      armor: '#8d98a1',
      cape: '#56303c',
      hair: '#3b2a24',
    },
    vendor: {
      gender: 'male',
      skin: '#c29476',
      underwear: '#443a33',
      shirt: '#9a6b3d',
      pants: '#55483d',
      tunic: '#a87b45',
      armor: '#81786b',
      cape: '#553928',
      hair: '#493326',
    },
    banker: {
      gender: 'male',
      skin: '#c79a7c',
      underwear: '#34302d',
      shirt: '#73654d',
      pants: '#403a36',
      tunic: '#b2a275',
      armor: '#817c70',
      cape: '#4b4033',
      hair: '#30251f',
    },
    healer: {
      gender: 'female',
      skin: '#d0a188',
      underwear: '#625d56',
      shirt: '#d2c8ad',
      pants: '#6d655c',
      tunic: '#e2dcc9',
      armor: '#9c978d',
      cape: '#796e65',
      hair: '#7a6551',
    },
    guard: {
      gender: 'male',
      skin: '#ad8068',
      underwear: '#303940',
      shirt: '#687785',
      pants: '#3e4850',
      tunic: '#596978',
      armor: '#8b99a3',
      cape: '#3d4753',
      hair: '#332821',
    },
    bandit: {
      gender: 'male',
      skin: '#a87563',
      underwear: '#342d2e',
      shirt: '#71433d',
      pants: '#403739',
      tunic: '#633632',
      armor: '#706b66',
      cape: '#35282a',
      hair: '#251e1b',
    },
  };
  const beastPalettes = {
    wolf: { body: '#6d675f', belly: '#878078', accent: '#d8d0c6' },
    boar: { body: '#5e4439', belly: '#7b5c50', accent: '#ead1a4' },
    bear: { body: '#56463e', belly: '#765f52', accent: '#d7c4af' },
    troll: { body: '#6f8660', belly: '#88a077', accent: '#c9d8bf' },
    boss: { body: '#607950', belly: '#82996f', accent: '#d4dfc9' },
    spider: { body: '#403a36', belly: '#6a625d', accent: '#cbb9a3' },
    zombie: { body: '#77856c', belly: '#9aaa89', accent: '#d8ceb7' },
    skeleton: { body: '#d5d0c5', belly: '#e6e0d5', accent: '#8a8374' },
    cryptboss: { body: '#485352', belly: '#707b76', accent: '#d8d0bc' },
  };
  const equipped = (actor, slot) => !!actor.equipment?.[slot];
  const layer = (actor, slot) => {
    const item = actor.equipment?.[slot];
    return item && U.itemDefs[item.id]?.visualLayer;
  };
  const materialColors = {
    // Metales
    Cobre: '#8c5538',
    Hierro: '#8d98a1',
    'Hierro ennegrecido': '#4a4e54',
    Oro: '#d6ad3e',
    Plata: '#c3c9cf',
    Mithril: '#76529b',
    // Cueros y pieles
    Cuero: '#704a32',
    'Cuero de jabalí': '#7b5c50',
    'Cuero de oso': '#56463e',
    'Cuero de troll': '#6b7355',
    'Piel de jabalí': '#8a6a55',
    // Telas y sedas
    Tela: '#7d7466',
    'Seda de araña': '#7d7486',
    'Seda del Velo': '#5b3d78',
    // Mixtos
    'Cuero y tela': '#6b5644',
    'Hierro y cuero': '#7a7267',
    // Otros
    Hueso: '#d5d0c5',
    Madera: '#735439',
    Pergamino: '#d6c9a0',
    Esencia: '#9fd8c8',
  };
  function equippedColor(actor, type, fallback) {
    const items = Object.values(actor.equipment || {}).filter(Boolean);
    const found = items
      .map(it => U.itemDefs[it.id])
      .find(d => d && d.type === type && (d.visualColor || materialColors[d.material]));
    return found ? found.visualColor || materialColors[found.material] : fallback;
  }
  function slotColor(actor, slot, fallback) {
    const item = actor.equipment?.[slot];
    const def = item && U.itemDefs[item.id];
    return (def && (def.visualColor || materialColors[def.material])) || fallback;
  }
  function weaponHands(actor) {
    const item = actor.equipment?.weapon;
    const def = item && U.itemDefs[item.id];
    const offDef = actor.equipment?.shield && U.itemDefs[actor.equipment.shield.id];
    const offItem = offDef?.type === 'spellbook' ? 'spellbook' : equipped(actor, 'shield') ? 'shield' : 'none';
    if (!def) return { main: 'none', off: offItem };
    const name = `${def.name || ''} ${item.id || ''}`.toLowerCase();
    let main = 'none';
    if (def.skill === 'Arco') main = 'bow';
    else if (def.skill === 'Espada') main = def.twoHand ? 'greatSword' : 'sword';
    else if (def.skill === 'Esgrima') {
      if (/daga|kriss|colmillo|ponzoñ/.test(name)) main = 'dagger';
      else main = def.twoHand ? 'greatSpear' : 'spear';
    } else if (def.skill === 'Armas contundentes') {
      const axe = /hacha/.test(name);
      main = axe ? (def.twoHand ? 'greatAxe' : 'axe') : def.twoHand ? 'greatMace' : 'mace';
    } else if (def.skill === 'Magia') main = 'staff';
    const off =
      offItem === 'spellbook'
        ? 'spellbook'
        : equipped(actor, 'shield') && !def.twoHand && !def.ranged && main !== 'staff'
          ? 'shield'
          : 'none';
    return { main, off };
  }
  function weapon(actor) {
    const hands = weaponHands(actor);
    if (hands.off === 'spellbook') return hands.main === 'staff' ? 'spellbookStaff' : 'spellbook';
    if (hands.main === 'none') return hands.off === 'shield' ? 'shieldOnly' : 'none';
    if (hands.off === 'shield' && ['sword', 'dagger', 'spear', 'mace'].includes(hands.main))
      return `${hands.main}Shield`;
    return hands.main;
  }
  U.CharacterAdapter = {
    getState(actor, options = {}) {
      const type = (actor.visualType || actor.type || '').toLowerCase();
      if (beastPalettes[type]) {
        const variantScale = actor.variant === 'exalted' ? 1.45 : actor.variant === 'renowned' ? 1.25 : 1;
        const palette =
          actor.variant === 'exalted'
            ? { body: '#d8ad32', belly: '#f0c95d', accent: '#fff0a6' }
            : beastPalettes[type];
        return {
          beast: type === 'boss' || type === 'cryptboss' ? 'troll' : type,
          palette,
          time: actor.anim || 0,
          dir: actor.facing || 'right',
          action: (actor.attackAnim || 0) > 0 ? 'attack' : actor.moving ? 'walk' : 'idle',
          // Avance del propio golpe, 0 a 1, para que la animacion no dependa del reloj global.
          attackProgress: Math.max(0, Math.min(1, 1 - (actor.attackAnim || 0) / (actor.attackTotal || 0.45))),
          // Las bestias tambien reaccionan al golpe y caen al morir.
          hit: Math.min(1, (actor.hitAnim || 0) / 0.18),
          death: Math.max(0, Math.min(1, 1 - (actor.deathAnim || 0) / (actor.deathTotal || 0.8))),
          dying: !!actor.dead && (actor.deathAnim || 0) > 0,
          scale: actor.boss ? 1.22 : variantScale,
        };
      }
      const player = actor === U.player;
      const source = player ? palettes.player : palettes[type] || palettes.vendor;
      const hands = weaponHands(actor);
      const exalted = actor.variant === 'exalted';
      const base = exalted
        ? {
            ...source,
            shirt: '#d8ad32',
            pants: '#b88719',
            tunic: '#e4bd45',
            armor: '#f0c95d',
            cape: '#8f6814',
            hair: '#6d4b0d',
            weapon: '#fff0a6',
          }
        : {
            ...source,
            armor: equippedColor(actor, 'armor', source.armor),
            weapon: equippedColor(actor, 'weapon', source.armor),
          };
      return {
        base,
        time: actor.anim || 0,
        dir: options.direction || actor.facing || 'down',
        weaponColor: equippedColor(actor, 'weapon', '#d8dfe2'),
        weaponGlow:
          actor.equipment?.weapon?.rarity === 'Legendario'
            ? 'legendary'
            : actor.equipment?.weapon?.rarity === 'Épico'
              ? 'epic'
              : null,
        action: options.pose
          ? 'idle'
          : (actor.castAnim || 0) > 0
            ? 'cast'
            : (actor.attackAnim || 0) > 0
              ? 'melee'
              : Math.hypot(actor.vx || 0, actor.vy || 0) > 0.1 || actor.moving
                ? 'walk'
                : 'idle',
        // 0 a 1: cuanta energia lleva juntada la canalizacion en curso.
        castProgress:
          options.pose || !actor.casting || !actor.casting.total
            ? 0
            : Math.max(0, Math.min(1, (actor.casting.total - actor.casting.t) / actor.casting.total)),
        attackProgress: options.pose
          ? 0
          : Math.max(0, Math.min(1, 1 - (actor.attackAnim || 0) / (actor.attackTotal || 0.42))),
        // 0 a 1: avance de la reaccion al golpe y de la caida al morir.
        hit: options.pose ? 0 : Math.min(1, (actor.hitAnim || 0) / 0.22),
        death: options.pose
          ? 0
          : Math.max(0, Math.min(1, 1 - (actor.deathAnim || 0) / (actor.deathTotal || 0.8))),
        dying: !options.pose && !!actor.dead && (actor.deathAnim || 0) > 0,
        weapon: player || type === 'guard' ? weapon(actor) : 'none',
        main: hands.main,
        off: hands.off,
        shieldColor: slotColor(actor, 'shield', '#756a5e'),
        shield:
          (player || type === 'guard') &&
          equipped(actor, 'shield') &&
          U.itemDefs[actor.equipment?.shield?.id]?.type !== 'spellbook' &&
          !U.itemDefs[actor.equipment?.weapon?.id]?.twoHand &&
          !U.itemDefs[actor.equipment?.weapon?.id]?.ranged,
        hair: player ? 'ponytail' : type === 'guard' ? 'short' : type === 'healer' ? 'bun' : 'long',
        showClothes:
          !player ||
          ['head', 'neck', 'chest', 'arms', 'gloves', 'pants', 'boots'].some(
            slot => layer(actor, slot) === 'clothing',
          ),
        clothes: player
          ? {
              head: layer(actor, 'head') === 'clothing',
              neck: layer(actor, 'neck') === 'clothing',
              shirt: layer(actor, 'chest') === 'clothing',
              arms: layer(actor, 'arms') === 'clothing',
              gloves: layer(actor, 'gloves') === 'clothing',
              pants: layer(actor, 'pants') === 'clothing',
              boots: layer(actor, 'boots') === 'clothing',
            }
          : { head: false, neck: false, shirt: true, arms: true, gloves: false, pants: true, boots: false },
        equip: {
          helmet: player && layer(actor, 'head') === 'armor',
          neck: player && layer(actor, 'neck') === 'armor',
          torso: player && layer(actor, 'chest') === 'armor',
          arms: player && layer(actor, 'arms') === 'armor',
          gloves: player && layer(actor, 'gloves') === 'armor',
          legs: player && layer(actor, 'pants') === 'armor',
          boots: player && layer(actor, 'boots') === 'armor',
        },
        cape: player && equipped(actor, 'cloak'),
        tunic: player && equipped(actor, 'robe'),
        scale: player ? 1 : actor.variant === 'exalted' ? 1.45 : actor.variant === 'renowned' ? 1.25 : 1,
      };
    },
  };
})((window.Ultra = window.Ultra || {}));
