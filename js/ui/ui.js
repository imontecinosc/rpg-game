(function (U) {
  const ui = (U.ui = {});
  const slotNames = {
    head: 'Cabeza',
    neck: 'Cuello',
    amulet: 'Collar',
    chest: 'Pecho',
    arms: 'Brazos',
    gloves: 'Guantes',
    pants: 'Pantalón',
    boots: 'Botas',
    ring1: 'Anillo 1',
    ring2: 'Anillo 2',
    cloak: 'Capa',
    robe: 'Túnica',
    weapon: 'Arma',
    shield: 'Escudo',
  };
  const materialColors = {
    Cuero: '#704a32',
    Cobre: '#8c5538',
    Hierro: '#8d98a1',
    Oro: '#d6ad3e',
    Mithril: '#76529b',
    Tela: '#765a72',
    Madera: '#735439',
    Pergamino: '#d6bd83',
  };
  // Columna, icono fantasma y texto de ayuda de cada ranura de equipo.
  const slotMeta = {
    head: { col: 'izq', fa: '\u26d1\ufe0f', pide: 'Un casco o capucha.' },
    neck: {
      col: 'izq',
      fa: '\ud83e\udde3',
      pide: 'Protección de garganta: gorjal, cuello de cuero o pañuelo.',
    },
    amulet: { col: 'izq', fa: '\ud83d\udcdf', pide: 'Un amuleto.' },
    chest: { col: 'izq', fa: '\ud83e\udd4b', pide: 'Una pechera.' },
    arms: { col: 'izq', fa: '\ud83e\uddbe', pide: 'Brazales o mangas.' },
    gloves: { col: 'izq', fa: '\ud83e\udde4', pide: 'Guantes o manoplas.' },
    cloak: { col: 'der', fa: '\ud83e\udde5', pide: 'Una capa.' },
    robe: { col: 'der', fa: '\ud83e\udd7c', pide: 'Una túnica. Se lleva sobre la armadura.' },
    pants: { col: 'der', fa: '\ud83e\ude73', pide: 'Grebas o pantalones.' },
    boots: { col: 'der', fa: '\ud83e\udd7e', pide: 'Botas o zapatos.' },
    ring1: { col: 'der', fa: '\ud83d\udc8d', pide: 'Un anillo.' },
    ring2: { col: 'der', fa: '\ud83d\udc8d', pide: 'Un segundo anillo.' },
    weapon: { col: 'manos', fa: '\u2694\ufe0f', pide: 'Un arma.' },
    shield: { col: 'manos', fa: '\ud83d\udee1\ufe0f', pide: 'Un escudo.' },
  };
  ui.swatch = d =>
    `<i class="item-swatch" style="background:${d.visualColor || d.rarityColor || materialColors[d.material] || '#777'}"></i>`;
  ui.itemWeight = function (it) {
    const d = U.itemDefs[it.id] || {};
    const unit =
      d.weight ??
      ({
        currency: 0.01,
        resource: 0.2,
        consumable: 0.1,
        ammo: 0.03,
        weapon: 4,
        armor: 5,
        jewelry: 0.1,
        furniture: 12,
        decor: 3,
        contract: 0.1,
      }[d.type] ||
        1);
    return unit * (it.qty || 1);
  };
  ui.currentWeight = function () {
    return (
      U.player.inventory.reduce((n, it) => n + ui.itemWeight(it), 0) +
      Object.values(U.player.equipment)
        .filter(Boolean)
        .reduce((n, it) => n + ui.itemWeight(it), 0)
    );
  };
  ui.topSkills = function (limit = 3) {
    return Object.entries(U.player.skills)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, limit);
  };
  ui.combatStats = function () {
    const b = U.getEquipmentBonuses(),
      weapon = U.player.equipment.weapon,
      d = weapon ? U.itemDefs[weapon.id]?.damage || 4 : 4,
      mult = weapon ? U.qualityMultipliers[weapon.quality || 'Normal'] || 1 : 1;
    return { ...b, armor: b.armor, damage: Math.round(d * mult) + (b.weaponDamage || 0) };
  };
  ui.refreshCastBar = function () {
    const bar = U.$('#cast-bar');
    if (!bar) return;
    const c = U.player.casting;
    if (!c || !c.total) {
      bar.hidden = true;
      return;
    }
    const sp = U.spells.find(s => s.id === c.id);
    bar.hidden = false;
    U.$('#cast-name').textContent = sp ? sp.name : 'Canalizando';
    U.$('#cast-fill').style.width = `${U.clamp(((c.total - c.t) / c.total) * 100, 0, 100)}%`;
  };
  ui.refreshHUD = function () {
    const pct = (a, b) => `${U.clamp((a / b) * 100, 0, 100)}%`;
    ui.refreshCastBar();
    const velo = U.$('#death-veil');
    if (velo) velo.hidden = !U.player.dead;
    U.$('#hp-fill').style.width = pct(U.player.hp, U.player.maxHp);
    U.$('#mana-fill').style.width = pct(U.player.mana, U.player.maxMana);
    U.$('#stam-fill').style.width = pct(U.player.stam, U.player.maxStam);
    U.$('#hp-text').textContent = `${Math.ceil(U.player.hp)}/${U.player.maxHp}`;
    U.$('#mana-text').textContent = `${Math.ceil(U.player.mana)}/${U.player.maxMana}`;
    U.$('#stam-text').textContent = `${Math.ceil(U.player.stam)}/${U.player.maxStam}`;
    U.$('#potion-count').textContent = U.countItem('potion');
    const c = U.cities.reduce((a, b) => (U.dist(U.player, a) < U.dist(U.player, b) ? a : b));
    U.$('#location-name').textContent = c.name;
    U.$('#coords').textContent = `${U.player.x.toFixed(0)}, ${U.player.y.toFixed(0)}`;
    U.$('#special-60').disabled = U.player.skills.Espada < 60;
    U.$('#special-80').disabled = U.player.skills.Espada < 80;
    const total = Object.values(U.player.skills).reduce((a, b) => a + b, 0),
      weight = ui.currentWeight(),
      gold = U.countItem('gold');
    U.$('#player-name').textContent = U.player.name || 'Personaje';
    U.$('#player-state').textContent = U.player.dead
      ? 'Muerto'
      : U.state.battle
        ? 'Batalla'
        : U.player.newbie
          ? 'Protegido'
          : 'Paz';
    U.$('#player-state').className = U.state.battle
      ? 'battle-state'
      : U.player.newbie
        ? 'protected-state'
        : 'peace-state';
    U.$('#str-value').textContent = U.player.str;
    U.$('#dex-value').textContent = U.player.dex;
    U.$('#int-value').textContent = U.player.int;
    U.$('#weight-value').textContent = `${weight.toFixed(1)}/${U.player.maxWeight}`;
    U.$('#gold-value').textContent = gold;
    U.$('#hud-skill-total').textContent = total.toFixed(1);
    U.$('#quick-skills').innerHTML = ui
      .topSkills()
      .map(([name, v]) => `<span>${name} <b>${v.toFixed(1)}</b></span>`)
      .join('');
  };
  ui.updateBattleUI = function () {
    const b = U.$('#battle-btn'),
      a = U.$('#attack-btn');
    b.classList.toggle('battle', U.state.battle);
    b.classList.toggle('peace', !U.state.battle);
    b.innerHTML = U.state.battle ? '⚔️<span>Batalla</span>' : '🛡️<span>Paz</span>';
    a.hidden = !U.state.battle;
    a.style.display = U.state.battle ? 'grid' : 'none';
    a.disabled = !U.state.battle;
    a.classList.toggle('auto', U.state.autoAttack);
    const t = U.player.target;
    U.$('#target-card').hidden = !t || t.dead;
    U.$('#target-name').textContent = t?.name || '';
    U.$('#target-hp').textContent = t?.hp !== undefined ? `${Math.max(0, Math.ceil(t.hp))}/${t.maxHp}` : '';
    U.$('#auto-status').textContent = U.state.autoAttack ? 'Autoataque activo' : '';
  };
  ui.renderSpells = function () {
    const book = U.player.equipment.shield && U.itemDefs[U.player.equipment.shield.id]?.type === 'spellbook';
    const favorites = book ? U.player.favoriteSpells || [] : [];
    U.$('#spell-strip').innerHTML = U.spells
      .filter(s => favorites.includes(s.id) && (U.player.skills.Magia || 0) >= s.level)
      .map(
        (s, i) =>
          `<button class="spell ${U.state.selectedSpell === s.id ? 'active' : ''}" data-spell-id="${s.id}">${s.icon}<small>${s.name}</small></button>`,
      )
      .join('');
  };
  ui.refreshInventory = function () {
    U.normalizeInventory();
    const inv = U.$('#inventory-grid');
    U.$('#inventory-slots').textContent = `${U.player.inventory.length}/${U.INV_SLOTS} espacios`;
    inv.innerHTML = '';
    U.player.inventory.forEach((it, i) => {
      const d = U.itemDefs[it.id],
        b = document.createElement('button');
      const rareza = it.rarity || d.rarity || 'Común';
      b.className =
        'inv-slot' +
        (d.type === 'weapon' && ['Épico', 'Legendario'].includes(rareza) ? ' weapon-glow' : '') +
        (U.state.selectedInventoryIndex === i ? ' selected' : '');
      b.dataset.item = i;
      b.dataset.rarity = rareza;
      if (d.visualColor) b.style.setProperty('--item-color', d.visualColor);
      b.title = `${d.name} — ${rareza}`;
      b.setAttribute('aria-label', `${d.name}, ${rareza}`);
      b.innerHTML = `${d.icon}${it.qty > 1 ? `<b>${it.qty}</b>` : ''}`;
      inv.append(b);
    });
    // Casillas libres hasta el tope, para que la grilla no cambie de alto al usar objetos.
    for (let i = U.player.inventory.length; i < U.INV_SLOTS; i++) {
      const libre = document.createElement('div');
      libre.className = 'inv-slot libre';
      inv.append(libre);
    }
    // Las ranuras se reparten en dos columnas y una fila de manos.
    const arma = U.player.equipment.weapon,
      armaDef = arma && U.itemDefs[arma.id],
      escudoOcupado = !!(armaDef && armaDef.twoHand);
    const cols = { izq: '', der: '', manos: '' };
    U.equipmentSlots.forEach(sl => {
      const meta = slotMeta[sl];
      if (!meta) return;
      const it = U.player.equipment[sl],
        d = it && U.itemDefs[it.id],
        sel = U.state.selectedEquipmentSlot === sl ? ' selected' : '',
        bloqueada = sl === 'shield' && escudoOcupado && !it;
      let clase = 'equip-slot',
        rareza = '',
        cuerpo;
      if (d) {
        rareza = it.rarity || d.rarity || 'Común';
        cuerpo = d.icon;
      } else {
        clase += bloqueada ? ' bloqueada' : ' libre';
        cuerpo = `<span class="fantasma">${meta.fa}</span>`;
      }
      const titulo = d
        ? `${slotNames[sl]} — ${d.name}`
        : bloqueada
          ? `${slotNames[sl]} — ocupado por arma de dos manos`
          : `${slotNames[sl]} — vacío`;
      cols[meta.col] +=
        `<button class="${clase}${d?.type === 'weapon' && ['Épico', 'Legendario'].includes(rareza) ? ' weapon-glow' : ''}${sel}" data-slot="${sl}" data-rarity="${rareza}" ${d?.visualColor ? `style="--item-color:${d.visualColor}"` : ''} title="${titulo}" aria-label="${titulo}">${cuerpo}</button>`;
    });
    U.$('#equip-col-izq').innerHTML = cols.izq;
    U.$('#equip-col-der').innerHTML = cols.der;
    U.$('#equip-col-manos').innerHTML = cols.manos;
    const st = ui.combatStats(),
      peso = ui.currentWeight();
    U.$('#equip-resumen').innerHTML = [
      ['Armadura', Math.round(st.armor || 0)],
      ['Daño', st.damage],
      ['Carga', `${peso.toFixed(0)}/${U.player.maxWeight}`],
      ['Oro', U.countItem('gold')],
    ]
      .map(([k, v]) => `<div class="stat"><span>${k}</span><b>${v}</b></div>`)
      .join('');
    const cv = U.$('#paperdoll');
    if (cv && U.CharacterRenderer) {
      const c = cv.getContext('2d');
      c.clearRect(0, 0, cv.width, cv.height);
      c.save();
      c.translate(cv.width / 2, 276);
      U.CharacterRenderer.draw(
        c,
        U.CharacterAdapter.getState(U.player, { direction: 'down', pose: true, paperdoll: true }),
        1.34,
      );
      c.restore();
    }
  };
  ui.describeItem = function (it) {
    const d = U.itemDefs[it.id] || {},
      lines = [],
      rarity = it.rarity || d.rarity || 'Común',
      quality = it.quality || d.quality || 'Normal',
      mult = U.qualityMultipliers?.[quality] || 1;
    if (d.desc) lines.push(`<p>${d.desc}</p>`);
    if (d.slot)
      lines.push(
        `<span class="rarity-line" style="color:${U.rarityColors[rarity]}"><b>${rarity}</b> · ${Object.keys(it.bonuses || d.bonuses || {}).length} propiedades</span><span style="color:${U.qualityColors[quality]}"><b>Calidad:</b> ${quality}</span>`,
      );
    if (d.type) lines.push(`<span><b>Tipo:</b> ${d.type}</span>`);
    if (d.slot) lines.push(`<span><b>Ranura:</b> ${slotNames[d.slot] || d.slot}</span>`);
    if (d.material) lines.push(`<span><b>Material:</b> ${d.material}</span>`);
    if (d.damage) lines.push(`<span><b>Daño base:</b> ${Math.round(d.damage * mult)}</span>`);
    if (d.armor) lines.push(`<span><b>Armadura base:</b> ${Math.round(d.armor * mult)}</span>`);
    if (d.skill) lines.push(`<span><b>Habilidad:</b> ${d.skill}</span>`);
    if (d.durability)
      lines.push(
        `<span><b>Durabilidad:</b> ${it.durability ?? Math.round(d.durability * mult)}/${Math.round(d.durability * mult)}</span>`,
      );
    const req = Object.entries(d.requirements || {});
    if (req.length)
      lines.push(
        `<span class="requirements"><b>Requiere:</b> ${req.map(([k, v]) => k.toUpperCase() + ' ' + v).join(' · ')}</span>`,
      );
    const bonuses = Object.entries(it.bonuses || d.bonuses || {});
    if (bonuses.length)
      lines.push(
        `<div class="item-bonuses"><b>Propiedades mágicas</b>${bonuses.map(([k, v]) => `<span>◆ ${U.bonusLabels[k] || k} +${v}${['healthRegen', 'manaRegen', 'staminaRegen', 'critChance', 'critDamage', 'armorPen', 'physicalResist', 'magicResist', 'blockChance', 'moveSpeed', 'attackSpeed', 'lifeSteal', 'goldFind'].includes(k) ? '%' : ''}</span>`).join('')}</div>`,
      );
    else if (d.slot) lines.push('<div class="item-bonuses"><span>Sin propiedades mágicas</span></div>');
    if (d.twoHand) lines.push(`<span><b>Uso:</b> Dos manos</span>`);
    if (d.ranged) lines.push(`<span><b>Alcance:</b> A distancia</span>`);
    lines.push(`<span><b>Peso:</b> ${ui.itemWeight(it).toFixed(1)}</span>`);
    if (it.insured) lines.push(`<span class="insured"><b>Seguro:</b> Activo</span>`);
    return lines.join('');
  };
  ui.showItem = function (i) {
    U.state.selectedInventoryIndex = i;
    U.state.selectedEquipmentSlot = null;
    ui.refreshInventory();
    const it = U.player.inventory[i],
      d = it && U.itemDefs[it.id];
    if (!d) return;
    const learn = d.type === 'scroll' ? `<button data-learn-spell="${i}">Copiar al grimorio</button>` : '';
    U.$('#item-detail').innerHTML =
      `<h3>${d.icon} ${d.name}${it.qty > 1 ? ` ×${it.qty}` : ''}</h3><div class="item-description">${ui.describeItem(it)}</div><div class="detail-actions">${d.slot ? `<button data-equip="${i}">Equipar</button>` : ''}${learn}${d.insurable ? `<button data-insure="${i}">${it.insured ? 'Quitar seguro' : 'Asegurar'}</button>` : ''}<button data-drop="${i}">Soltar</button></div>`;
  };
  ui.showEquipped = function (slot) {
    U.state.selectedEquipmentSlot = slot;
    U.state.selectedInventoryIndex = null;
    ui.refreshInventory();
    const it = U.player.equipment[slot];
    if (!it) {
      const meta = slotMeta[slot];
      const arma = U.player.equipment.weapon,
        armaDef = arma && U.itemDefs[arma.id];
      if (slot === 'shield' && armaDef && armaDef.twoHand)
        return (U.$('#item-detail').innerHTML =
          `<h3>${slotNames[slot]}</h3><p class="slot-aviso">Tu arma es de dos manos, así que esta ranura queda ocupada. Equipa un arma de una mano para liberarla.</p>`);
      return (U.$('#item-detail').innerHTML =
        `<h3>${slotNames[slot]} · vacío</h3><p class="slot-pide">${(meta && meta.pide) || 'Ranura de equipo.'}</p>`);
    }
    const d = U.itemDefs[it.id];
    const spellbookControls =
      d.type === 'spellbook'
        ? `<div class="spellbook-list">${
            U.spells
              .filter(s => U.player.knownSpells.includes(s.id))
              .map(
                s =>
                  `<button data-favorite-spell="${s.id}" class="${U.player.favoriteSpells.includes(s.id) ? 'active' : ''}">${s.icon} ${s.name} · Magia ${s.level}</button>`,
              )
              .join('') || '<p>El grimorio aún está vacío.</p>'
          }</div>`
        : '';
    U.$('#item-detail').innerHTML =
      `<h3>${d.icon} ${d.name}</h3><div class="item-description">${ui.describeItem(it)}</div>${spellbookControls}<div class="detail-actions"><button data-unequip="${slot}">Desequipar</button>${d.insurable ? `<button data-eqinsure="${slot}">${it.insured ? 'Quitar seguro' : 'Asegurar'}</button>` : ''}</div>`;
  };
  ui.refreshSkills = function () {
    const total = Object.values(U.player.skills).reduce((a, b) => a + b, 0);
    U.$('#skill-total').textContent = total.toFixed(1) + ' total';
    U.$('#skills-list').innerHTML = Object.entries(U.SKILLS)
      .flatMap(([cat, arr]) =>
        arr.map(
          s =>
            `<div class="skill-row"><div><b>${s}</b><small>${cat} · ${U.skillDesc[s] || 'Habilidad especializada.'}</small></div><strong>${U.player.skills[s].toFixed(1)}</strong><button class="skill-lock" data-skill="${s}">${{ up: '↑', hold: '—', down: '↓' }[U.player.skillLocks[s]]}</button></div>`,
        ),
      )
      .join('');
  };
  const craftMaterial = function (r) {
    const outId = Object.keys(r.out)[0],
      d = U.itemDefs[outId] || {},
      input = Object.keys(r.in).find(id => /(Ingot|Leather|wood|Wood|Silk|Ore|hide|Hide)/.test(id));
    if (r.cat === 'Alquimia') return 'Alquimia';
    if (r.cat === 'Procesar') {
      if (/Curtir/.test(r.name)) return 'Pieles';
      if (/Fundir/.test(r.name)) return 'Metales';
      return 'Procesado';
    }
    return (
      d.material ||
      {
        ironIngot: 'Hierro',
        copperIngot: 'Cobre',
        goldIngot: 'Oro',
        mithrilIngot: 'Mithril',
        leather: 'Cuero común',
        trollLeather: 'Cuero de troll',
        boarLeather: 'Cuero de jabalí',
        bearLeather: 'Cuero de oso',
        wood: 'Madera común',
        oakWood: 'Roble',
        yewWood: 'Tejo',
        ironwood: 'Madera férrea',
      }[input] ||
      'Especiales'
    );
  };
  const craftFamily = function (r) {
    if (r.cat === 'Procesar') return 'Procesar';
    const d = U.itemDefs[Object.keys(r.out)[0]] || {};
    if (d.type === 'weapon') return 'Armas';
    if (d.type === 'armor' || d.type === 'clothing') return 'Armaduras';
    return 'Otros';
  };
  const craftPart = function (r) {
    const d = U.itemDefs[Object.keys(r.out)[0]] || {};
    return (
      slotNames[d.slot] ||
      { furniture: 'Muebles', consumable: 'Consumibles', resource: 'Materiales' }[d.type] ||
      r.name
    );
  };
  const craftButton = function (label, field, value, active) {
    return `<button data-craft-${field}="${value}" class="${active ? 'active' : ''}">${label}</button>`;
  };
  ui.craftSelection = { material: null, family: null, part: null };
  ui.refreshCraft = function (change) {
    const near = U.terrain.stations.filter(st => U.dist(U.player, st) < 2.4).map(st => st.type),
      map = {
        forge: ['Procesar', 'Herrería'],
        carpentry: ['Carpintería'],
        alchemy: ['Alquimia'],
        tailoring: ['Sastrería', 'Procesar'],
      },
      allowed = [...new Set(near.flatMap(x => map[x] || []))];
    if (!allowed.length) {
      ui.craftSelection = { material: null, family: null, part: null };
      U.$('#craft-tabs').innerHTML = '';
      U.$('#recipe-list').innerHTML =
        '<div class="craft-warning"><b>No estás cerca de una estación.</b><br>Herrería requiere yunque, Carpintería un banco, Alquimia una mesa y Sastrería una mesa de costura.</div>';
      return;
    }
    if (change && typeof change === 'object') ui.craftSelection = { ...ui.craftSelection, ...change };
    const available = U.recipes.filter(r => allowed.includes(r.cat)),
      materials = [...new Set(available.map(craftMaterial))],
      s = ui.craftSelection;
    if (!materials.includes(s.material)) {
      s.material = materials[0];
      s.family = null;
      s.part = null;
    }
    const byMaterial = available.filter(r => craftMaterial(r) === s.material),
      families = [...new Set(byMaterial.map(craftFamily))];
    if (!families.includes(s.family)) {
      s.family = families[0];
      s.part = null;
    }
    const byFamily = byMaterial.filter(r => craftFamily(r) === s.family),
      parts = [...new Set(byFamily.map(craftPart))];
    if (!parts.includes(s.part)) s.part = parts[0];
    const shown = byFamily.filter(r => craftPart(r) === s.part);
    U.$('#craft-tabs').innerHTML =
      `<div class="craft-level"><b>1. Material</b><div>${materials.map(x => craftButton(x, 'material', x, x === s.material)).join('')}</div></div><div class="craft-level"><b>2. Tipo</b><div>${families.map(x => craftButton(x, 'family', x, x === s.family)).join('')}</div></div><div class="craft-level"><b>3. Pieza</b><div>${parts.map(x => craftButton(x, 'part', x, x === s.part)).join('')}</div></div>`;
    U.$('#recipe-list').innerHTML =
      `<div class="craft-path">${s.material} <span>›</span> ${s.family} <span>›</span> ${s.part}</div>` +
      shown
        .map(r => {
          const ok =
            U.player.skills[r.skill] >= r.lvl &&
            Object.entries(r.in).every(([id, q]) => U.countItem(id) >= q);
          return `<div class="recipe"><div><b>${r.name}</b><br><small>${r.skill} ${r.lvl} · ${Object.entries(
            r.in,
          )
            .map(([id, q]) => q + ' ' + U.itemDefs[id].name)
            .join(
              ', ',
            )}</small></div><button data-recipe="${U.recipes.indexOf(r)}" ${ok ? '' : 'disabled'}>Fabricar</button></div>`;
        })
        .join('');
  };
  ui.drawMap = function () {
    const cv = U.$('#world-map'),
      c = cv.getContext('2d'),
      W = cv.width,
      H = cv.height,
      pad = 42;
    const minX = -105,
      maxX = 175,
      minY = -120,
      maxY = 95,
      s = (x, y) => ({
        x: pad + ((x - minX) / (maxX - minX)) * (W - pad * 2),
        y: pad + ((y - minY) / (maxY - minY)) * (H - pad * 2),
      });
    c.clearRect(0, 0, W, H);
    const bg = c.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#d8c592');
    bg.addColorStop(1, '#a98e5d');
    c.fillStyle = bg;
    c.fillRect(0, 0, W, H);
    c.fillStyle = '#5c492d22';
    for (let i = 0; i < 170; i++) {
      const x = (i * 83) % W,
        y = (i * 47) % H;
      c.fillRect(x, y, 1 + (i % 3), 1);
    }
    const land = [
      [70, 70],
      [175, 45],
      [315, 58],
      [430, 32],
      [575, 65],
      [730, 48],
      [858, 105],
      [880, 220],
      [840, 340],
      [745, 470],
      [590, 510],
      [455, 485],
      [340, 525],
      [195, 485],
      [95, 395],
      [50, 265],
    ];
    c.beginPath();
    land.forEach((p, i) => (i ? c.lineTo(...p) : c.moveTo(...p)));
    c.closePath();
    c.fillStyle = '#8e9a63';
    c.fill();
    c.strokeStyle = '#4f593c';
    c.lineWidth = 4;
    c.stroke();
    const blob = (x, y, rx, ry, col) => {
      c.fillStyle = col;
      c.beginPath();
      c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
      c.fill();
    };
    U.terrain.water.forEach(z => {
      const p = s(z.x, z.y);
      blob(p.x, p.y, z.r * 4.5, z.r * 2.4, '#567f91');
    });
    U.terrain.forests.forEach(z => {
      const p = s(z.x, z.y);
      for (let i = 0; i < 14; i++) {
        const a = i * 2.399,
          r = (i % 5) * 5;
        blob(p.x + Math.cos(a) * r, p.y + Math.sin(a) * r * 0.65, 7, 9, '#45623f');
      }
    });
    U.terrain.mines.forEach(z => {
      const p = s(z.x, z.y);
      for (let i = 0; i < 4; i++) {
        c.fillStyle = '#665d53';
        c.beginPath();
        c.moveTo(p.x - 18 + i * 10, p.y + 12);
        c.lineTo(p.x - 7 + i * 10, p.y - 14 - i * 2);
        c.lineTo(p.x + 3 + i * 10, p.y + 12);
        c.fill();
      }
    });
    c.strokeStyle = '#6f5837';
    c.lineWidth = 7;
    c.lineCap = 'round';
    for (const road of U.terrain.roads) {
      c.beginPath();
      road.forEach((pt, i) => {
        const p = s(pt[0], pt[1]);
        i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y);
      });
      c.stroke();
    }
    c.strokeStyle = '#c2ab70';
    c.lineWidth = 2;
    for (const road of U.terrain.roads) {
      c.beginPath();
      road.forEach((pt, i) => {
        const p = s(pt[0], pt[1]);
        i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y);
      });
      c.stroke();
    }
    const marker = (x, y, shape, col, label) => {
      const p = s(x, y);
      c.save();
      c.translate(p.x, p.y);
      c.fillStyle = col;
      c.strokeStyle = '#3a2c1d';
      c.lineWidth = 2;
      if (shape === 'city') {
        c.fillRect(-8, -8, 16, 16);
        c.strokeRect(-8, -8, 16, 16);
      } else {
        c.beginPath();
        c.moveTo(0, -11);
        c.lineTo(-10, 9);
        c.lineTo(10, 9);
        c.closePath();
        c.fill();
        c.stroke();
      }
      c.restore();
      c.font = 'bold 13px Georgia';
      c.fillStyle = '#2c2318';
      c.fillText(label, p.x + 13, p.y + 4);
    };
    U.cities.forEach(city => marker(city.x, city.y, 'city', '#efd17c', city.name));
    U.terrain.dungeons.forEach(d => marker(d.x, d.y, 'dungeon', d.friendly ? '#e9d6a4' : '#a84843', d.name));
    const pp = s(U.player.x, U.player.y);
    c.fillStyle = '#e6403a';
    c.strokeStyle = '#fff2ce';
    c.lineWidth = 3;
    c.beginPath();
    c.arc(pp.x, pp.y, 8, 0, Math.PI * 2);
    c.fill();
    c.stroke();
    c.font = 'bold 12px Georgia';
    c.fillStyle = '#2b2116';
    c.fillText(U.player.name || 'Pitiao', pp.x + 12, pp.y - 10);
    cv.onclick = e => {
      const r = cv.getBoundingClientRect(),
        mx = ((e.clientX - r.left) * W) / r.width,
        my = ((e.clientY - r.top) * H) / r.height;
      let best = null,
        bd = 30;
      for (const x of [...U.cities, ...U.terrain.dungeons]) {
        const p = s(x.x, x.y),
          d = Math.hypot(mx - p.x, my - p.y);
        if (d < bd) {
          best = x;
          bd = d;
        }
      }
      U.$('#map-info').innerHTML = best
        ? `<b>${best.name}</b><br>${best.style || best.desc || ''}${best.law ? `<br><span>${best.law}</span>` : ''}`
        : 'Selecciona una ciudad o mazmorra marcada.';
    };
  };
  ui.refreshWorld = function () {
    ui.drawMap();
  };
  ui.updateContextAction = function () {
    const a = U.getContextAction();
    const b = U.$('#use-btn');
    if (!b) return;
    b.innerHTML = `${a.icon}<span>${a.label}</span>`;
    b.classList.toggle('contextual', a.type !== 'use');
  };
  ui.openBank = function () {
    U.state.selectedBank = null;
    ui.refreshBank();
    U.$('#bank-dialog').showModal();
  };
  ui.refreshBank = function () {
    const draw = (arr, side) =>
      arr
        .map((it, i) => {
          const d = U.itemDefs[it.id];
          const sel =
            U.state.selectedBank && U.state.selectedBank.side === side && U.state.selectedBank.index === i;
          return `<button class="bank-slot ${sel ? 'selected' : ''}" data-bank-side="${side}" data-bank-index="${i}">${d.icon}<small>${d.name}${it.qty > 1 ? ' ×' + it.qty : ''}</small></button>`;
        })
        .join('') || '<p class="empty-bank">Vacío</p>';
    U.$('#bank-inventory').innerHTML = draw(U.player.inventory, 'inventory');
    U.$('#bank-storage').innerHTML = draw(U.state.bank, 'bank');
    const sel = U.state.selectedBank,
      btn = U.$('#bank-transfer-btn'),
      detail = U.$('#bank-detail');
    if (!sel) {
      detail.textContent = 'Selecciona un objeto para ver sus atributos.';
      btn.disabled = true;
      btn.textContent = 'Transferir';
      return;
    }
    const arr = sel.side === 'inventory' ? U.player.inventory : U.state.bank,
      it = arr[sel.index];
    if (!it) {
      U.state.selectedBank = null;
      return ui.refreshBank();
    }
    const d = U.itemDefs[it.id];
    detail.innerHTML = `<h3>${d.icon} ${d.name}${it.qty > 1 ? ' ×' + it.qty : ''}</h3><div class="item-description">${ui.describeItem(it)}</div>`;
    btn.disabled = false;
    btn.textContent = sel.side === 'inventory' ? 'Depositar en banco' : 'Retirar al inventario';
  };
  ui.refreshCharacter = function () {
    const total = Object.values(U.player.skills).reduce((a, b) => a + b, 0),
      weight = ui.currentWeight(),
      gold = U.countItem('gold'),
      stats = ui.combatStats(),
      city = U.cities.reduce((a, b) => (U.dist(U.player, a) < U.dist(U.player, b) ? a : b));
    U.$('#character-name').textContent = U.player.name || 'Personaje';
    U.$('#character-condition').textContent =
      (U.state.titles?.length ? 'Título: ' + U.state.titles.at(-1) + ' · ' : '') +
      'Estado: ' +
      (U.player.dead ? 'Muerto' : U.state.battle ? 'Batalla' : U.player.newbie ? 'Protegido' : 'Paz');
    U.$('#character-location').textContent = city.name;
    U.$('#sheet-str').textContent = U.player.str;
    U.$('#sheet-dex').textContent = U.player.dex;
    U.$('#sheet-int').textContent = U.player.int;
    U.$('#sheet-armor').textContent = stats.armor;
    U.$('#sheet-damage').textContent = stats.damage;
    U.$('#sheet-weight').textContent = `${weight.toFixed(1)}/${U.player.maxWeight}`;
    U.$('#sheet-gold').textContent = gold;
    U.$('#sheet-skill-cap').textContent = `${total.toFixed(1)} / ${U.SKILL_TOTAL_CAP || 700}`;
    U.$('#sheet-top-skills').innerHTML = ui
      .topSkills(8)
      .map(([name, v], i) => `<div><span>${i + 1}. ${name}</span><b>${v.toFixed(1)}</b></div>`)
      .join('');
    const effects = [];
    if (U.player.newbie) effects.push('Protección de jugador nuevo');
    if (U.state.battle) effects.push('Modo Batalla');
    if (U.player.bandaging) effects.push('Aplicando vendas');
    if (U.player.recoveryBoost > 0)
      effects.push(`Impulso de recuperación +10% (${Math.ceil(U.player.recoveryBoost)} s)`);
    U.$('#sheet-effects').textContent = effects.join(' · ') || 'Sin efectos activos.';
  };
  ui.setTopSelection = function (id) {
    U.$$('.top-buttons button').forEach(b => b.classList.toggle('selected', b.id === id));
  };
  ui.openCharacter = () => {
    ui.refreshCharacter();
    U.$('#character-dialog').showModal();
  };
  ui.openInventory = () => {
    ui.setTopSelection('inventory-btn');
    ui.refreshInventory();
    U.$('#inventory-dialog').showModal();
  };
  ui.openSkills = () => {
    ui.setTopSelection('skills-btn');
    ui.refreshSkills();
    U.$('#skills-dialog').showModal();
  };
  ui.openCraft = () => {
    ui.setTopSelection('craft-btn');
    ui.refreshCraft();
    U.$('#craft-dialog').showModal();
  };
  ui.openWorld = () => {
    ui.setTopSelection('world-btn');
    ui.refreshWorld();
    U.$('#world-dialog').showModal();
  };
  ui.recoverPlayerCorpse = function (c) {
    const recovered = c.items.length;
    for (const it of c.items) {
      const slot = it.recoverySlot;
      delete it.recoverySlot;
      if (slot) {
        if (U.player.equipment[slot]) U.player.inventory.push(U.player.equipment[slot]);
        U.player.equipment[slot] = it;
      } else U.player.inventory.push(it);
    }
    c.items.length = 0;
    U.normalizeInventory();
    U.state.corpses = U.state.corpses.filter(x => x !== c);
    U.state.currentCorpse = null;
    U.player.recoveryBoost = 0;
    U.state.selectedLoot = null;
    ui.refreshAll();
    U.toast(
      recovered
        ? `Recuperaste ${recovered} objetos y tu equipo anterior. El impulso de velocidad terminó.`
        : 'Recuperaste tu cadáver. El impulso de velocidad terminó.',
    );
  };
  ui.openCorpse = function (c) {
    if (U.dist(U.player, c) > 2.5) return U.toast('Acércate al cadáver.');
    if (c.isPlayerCorpse && c.owner === 'player') return ui.recoverPlayerCorpse(c);
    U.state.currentCorpse = c;
    U.state.selectedLoot = null;
    ui.refreshCorpse();
    if (!U.$('#corpse-dialog').open) U.$('#corpse-dialog').showModal();
  };
  ui.refreshCorpse = function () {
    const c = U.state.currentCorpse,
      sel = U.state.selectedLoot,
      grid = U.$('#corpse-items'),
      detail = U.$('#corpse-detail');
    if (!c) return;
    grid.innerHTML =
      c.items
        .map((it, i) => {
          const d = U.itemDefs[it.id];
          const rarity = it.rarity || d.rarity || 'Común',
            glow = d.type === 'weapon' && ['Épico', 'Legendario'].includes(rarity) ? ' weapon-glow' : '';
          return `<button class="loot-slot${glow} ${sel === i ? 'selected' : ''}" data-rarity="${rarity}" data-loot-select="${i}" title="${d.name}">${ui.swatch({ ...d, rarityColor: U.rarityColors[rarity] })}${d.icon}<small>${d.name}</small>${it.qty > 1 ? `<b>${it.qty}</b>` : ''}</button>`;
        })
        .join('') || '<div class="loot-slot empty">El cadáver está vacío.</div>';
    const it = c.items[sel],
      d = it && U.itemDefs[it.id];
    detail.innerHTML = d
      ? `<h3>${d.icon} ${d.name}${it.qty > 1 ? ' ×' + it.qty : ''}</h3><div class="item-description">${ui.describeItem(it)}</div><div class="detail-actions"><button data-loot-take="${sel}">Recoger</button></div>`
      : 'Selecciona un objeto para ver sus características.';
    U.$('#loot-all-btn').disabled = !c.items.length;
  };
  ui.openVendor = function (n) {
    U.state.vendor = n;
    U.state.selectedVendor = null;
    U.$('#vendor-title').textContent = n.name;
    ui.refreshVendor();
    U.$('#vendor-dialog').showModal();
  };
  ui.refreshVendor = function () {
    const goods = U.vendorCatalogs[U.state.vendor?.catalog] || U.vendorCatalogs.supplies;
    const sel = U.state.selectedVendor;
    U.$('#vendor-buy').innerHTML = goods
      .map((id, i) => {
        const d = U.itemDefs[id],
          on = sel && sel.side === 'buy' && sel.index === i;
        return `<button class="vendor-item ${on ? 'selected' : ''}" data-vendor-side="buy" data-vendor-index="${i}" data-vendor-id="${id}" title="${d.name}">${ui.swatch(d)}${d.icon}<small>${d.name}</small><b>${d.value || 20}</b></button>`;
      })
      .join('');
    const sellable = U.player.inventory
      .map((it, index) => ({ it, index }))
      .filter(x => U.itemDefs[x.it.id].value);
    U.$('#vendor-sell').innerHTML =
      sellable
        .map((x, i) => {
          const d = U.itemDefs[x.it.id],
            on = sel && sel.side === 'sell' && sel.inventoryIndex === x.index;
          return `<button class="vendor-item ${on ? 'selected' : ''}" data-vendor-side="sell" data-vendor-index="${i}" data-inventory-index="${x.index}">${d.icon}<small>${d.name}${x.it.qty > 1 ? ' ×' + x.it.qty : ''}</small><b>${Math.floor((d.value || 10) * 0.45)} oro</b></button>`;
        })
        .join('') || '<p>No tienes objetos vendibles.</p>';
    const detail = U.$('#vendor-detail'),
      btn = U.$('#vendor-action-btn');
    if (!sel) {
      detail.textContent = 'Selecciona un objeto para ver su descripción y atributos.';
      btn.disabled = true;
      return;
    }
    let it, d;
    if (sel.side === 'buy') {
      const id = goods[sel.index];
      it = { id, qty: 1 };
      d = U.itemDefs[id];
      btn.textContent = `Comprar por ${d.value || 20} oro`;
    } else {
      it = U.player.inventory[sel.inventoryIndex];
      if (!it) {
        U.state.selectedVendor = null;
        return ui.refreshVendor();
      }
      d = U.itemDefs[it.id];
      btn.textContent = `Vender por ${Math.floor((d.value || 10) * 0.45)} oro`;
    }
    detail.innerHTML = `<h3>${d.icon} ${d.name}</h3><div class="item-description">${ui.describeItem(it)}</div>`;
    btn.disabled = false;
  };
  ui.refreshAll = function () {
    ui.refreshHUD();
    ui.refreshInventory();
    ui.refreshSkills();
    ui.renderSpells();
    ui.updateBattleUI();
    ui.updateContextAction();
  };
  ui.bind = function () {
    const press = (el, fn) => {
      el.addEventListener('pointerdown', e => {
        e.preventDefault();
        fn();
        el.classList.add('pressed');
      });
      el.addEventListener('pointerup', () => el.classList.remove('pressed'));
      el.addEventListener('pointercancel', () => el.classList.remove('pressed'));
    };
    press(U.$('#battle-btn'), U.toggleBattle);
    press(U.$('#attack-btn'), U.toggleAutoAttack);
    press(U.$('#heal-btn'), U.healBandage);
    press(U.$('#use-btn'), U.useAction);
    press(U.$('#potion-btn'), U.usePotion);
    U.$('#portrait-btn').onclick = () => {
      const panel = U.$('#player-status');
      if (panel.classList.contains('collapsed')) {
        panel.classList.remove('collapsed');
        U.$('#collapse-status').textContent = '−';
        U.sound('ui');
      } else ui.openCharacter();
    };
    U.$('#collapse-status').onclick = e => {
      e.stopPropagation();
      const panel = U.$('#player-status');
      panel.classList.toggle('collapsed');
      U.$('#collapse-status').textContent = panel.classList.contains('collapsed') ? '+' : '−';
    };
    U.$('#skills-btn').onclick = ui.openSkills;
    U.$('#inventory-btn').onclick = ui.openInventory;
    U.$('#craft-btn').onclick = ui.openCraft;
    U.$('#world-btn').onclick = ui.openWorld;
    U.$('#settings-btn').onclick = () => {
      ui.setTopSelection('settings-btn');
      U.$('#sound-muted').checked = U.audio.muted;
      U.$('#sound-volume').value = Math.round(U.audio.volume * 100);
      U.$('#settings-dialog').showModal();
    };
    U.$('#sound-muted').onchange = e => {
      U.audio.mute(e.target.checked);
      if (!e.target.checked) U.sound('ui');
    };
    U.$('#sound-volume').oninput = e => {
      U.audio.setVolume(+e.target.value / 100);
    };
    U.$('#sort-btn').onclick = () => {
      U.player.inventory.sort((a, b) => U.itemDefs[a.id].name.localeCompare(U.itemDefs[b.id].name));
      ui.refreshInventory();
    };
    U.$$('[data-close]').forEach(
      b =>
        (b.onclick = () => {
          b.closest('dialog').close();
          ui.setTopSelection('');
        }),
    );
    document.addEventListener('click', e => {
      const t = e.target.closest('button');
      if (!t) return;
      if (t.dataset.spellId !== undefined) return U.castSpell(t.dataset.spellId);
      if (t.dataset.learnSpell !== undefined) return U.learnSpell(+t.dataset.learnSpell);
      if (t.dataset.favoriteSpell !== undefined) return U.toggleFavoriteSpell(t.dataset.favoriteSpell);
      if (t.dataset.item !== undefined) return ui.showItem(+t.dataset.item);
      if (t.dataset.slot) return ui.showEquipped(t.dataset.slot);
      if (t.dataset.equip !== undefined) return U.equip(+t.dataset.equip);
      if (t.dataset.unequip) return U.unequip(t.dataset.unequip);
      if (t.dataset.insure !== undefined) {
        U.player.inventory[+t.dataset.insure].insured = !U.player.inventory[+t.dataset.insure].insured;
        return ui.showItem(+t.dataset.insure);
      }
      if (t.dataset.eqinsure) {
        U.player.equipment[t.dataset.eqinsure].insured = !U.player.equipment[t.dataset.eqinsure].insured;
        return ui.showEquipped(t.dataset.eqinsure);
      }
      if (t.dataset.drop !== undefined) {
        U.player.inventory.splice(+t.dataset.drop, 1);
        return ui.refreshInventory();
      }
      if (t.dataset.skill) {
        const seq = ['up', 'hold', 'down'],
          s = t.dataset.skill;
        U.player.skillLocks[s] = seq[(seq.indexOf(U.player.skillLocks[s]) + 1) % 3];
        return ui.refreshSkills();
      }
      if (t.dataset.craftMaterial)
        return ui.refreshCraft({ material: t.dataset.craftMaterial, family: null, part: null });
      if (t.dataset.craftFamily) return ui.refreshCraft({ family: t.dataset.craftFamily, part: null });
      if (t.dataset.craftPart) return ui.refreshCraft({ part: t.dataset.craftPart });
      if (t.dataset.recipe !== undefined) return U.craft(+t.dataset.recipe);
      if (t.dataset.lootSelect !== undefined) {
        U.state.selectedLoot = +t.dataset.lootSelect;
        return ui.refreshCorpse();
      }
      if (t.dataset.lootTake !== undefined) {
        const c = U.state.currentCorpse,
          it = c?.items[+t.dataset.lootTake];
        if (it) {
          U.addItem(it.id, it.qty);
          c.items.splice(+t.dataset.lootTake, 1);
          U.state.selectedLoot = null;
          U.sound(it.id === 'gold' ? 'coin' : 'loot');
          ui.refreshCorpse();
          ui.refreshInventory();
        }
        return;
      }
      if (t.dataset.respawn) {
        const c = U.cities.find(x => x.name === t.dataset.respawn);
        U.player.respawn = { x: c.x, y: c.y, name: 'Centro de ' + c.name };
        return U.toast('Punto de control guardado.');
      }
      if (t.id === 'add-chest') {
        if (U.countItem('chestSmall') < 1) return U.toast('Necesitas un cofre pequeño.');
        U.removeItem('chestSmall', 1);
        U.state.houses[0].chests++;
        return ui.refreshWorld();
      }
      if (t.id === 'toggle-shop') {
        U.state.houses[0].shop = !U.state.houses[0].shop;
        return ui.refreshWorld();
      }
      if (t.id === 'deposit-all') {
        for (let i = U.player.inventory.length - 1; i >= 0; i--)
          if (U.itemDefs[U.player.inventory[i].id].type === 'resource')
            U.state.bank.push(U.player.inventory.splice(i, 1)[0]);
        ui.refreshWorld();
        U.sound('bank');
        return ui.refreshInventory();
      }
      if (t.id === 'withdraw-all') {
        U.player.inventory.push(...U.state.bank.splice(0));
        ui.refreshWorld();
        U.sound('bank');
        return ui.refreshInventory();
      }
      if (t.dataset.bankSide) {
        U.state.selectedBank = { side: t.dataset.bankSide, index: +t.dataset.bankIndex };
        return ui.refreshBank();
      }
      if (t.id === 'bank-transfer-btn') {
        const s = U.state.selectedBank;
        if (!s) return;
        const from = s.side === 'inventory' ? U.player.inventory : U.state.bank,
          to = s.side === 'inventory' ? U.state.bank : U.player.inventory,
          it = from.splice(s.index, 1)[0];
        if (it) to.push(it);
        U.sound('bank');
        U.state.selectedBank = null;
        ui.refreshBank();
        return ui.refreshInventory();
      }
      if (t.dataset.vendorSide) {
        U.state.selectedVendor = {
          side: t.dataset.vendorSide,
          index: +t.dataset.vendorIndex,
          inventoryIndex: t.dataset.inventoryIndex !== undefined ? +t.dataset.inventoryIndex : null,
        };
        return ui.refreshVendor();
      }
      if (t.id === 'vendor-action-btn') {
        const v = U.state.selectedVendor;
        if (!v) return;
        if (v.side === 'buy') {
          const goods = U.vendorCatalogs[U.state.vendor?.catalog] || U.vendorCatalogs.supplies,
            id = goods[v.index],
            price = U.itemDefs[id].value || 20;
          if (U.countItem('gold') < price) return U.toast('No tienes suficiente oro.');
          U.removeItem('gold', price);
          U.addItem(id);
          U.sound('buy');
        } else {
          const it = U.player.inventory[v.inventoryIndex];
          if (!it) return;
          const price = Math.floor((U.itemDefs[it.id].value || 10) * 0.45);
          U.player.inventory.splice(v.inventoryIndex, 1);
          U.addItem('gold', price);
          U.sound('sell');
        }
        U.state.selectedVendor = null;
        ui.refreshVendor();
        return ui.refreshAll();
      }
    });
    U.$('#loot-all-btn').onclick = () => {
      const c = U.state.currentCorpse;
      if (!c) return;
      for (const it of c.items) U.addItem(it.id, it.qty);
      c.items.length = 0;
      U.state.selectedLoot = null;
      U.sound('loot');
      ui.refreshCorpse();
      ui.refreshInventory();
      U.toast('Recogiste todo el botín.');
    };
    U.$('#save-btn').onclick = U.save;
    U.$('#load-btn').onclick = U.load;
    U.$('#reset-btn').onclick = U.reset;
  };
})((window.Ultra = window.Ultra || {}));
