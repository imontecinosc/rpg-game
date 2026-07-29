(function (U) {
  const QUEST = {
    title: 'La caravana de Hierrogris',
    wagon: { x: 43, y: 4 },
    camp: { x: 76, y: -3 },
    mine: { x: 108, y: -8 },
    objectives: [
      'Habla con Edric, administrador de Valdoria.',
      'Sigue el camino oriental y examina el carro destruido.',
      'Sigue las huellas hasta el campamento de los saqueadores.',
      'Libera al minero cautivo cuando el campamento sea seguro.',
      'Entra en la mina y encuentra al capataz.',
      'Derrota al Capitán de Hierrogris y recupera el artefacto.',
      'Regresa con Edric y decide el destino del Corazón.',
      'Misión completada.',
    ],
    hints: [
      'Edric te espera cerca del centro de Valdoria.',
      'El carro está al este de la ciudad. Usa el minimapa.',
      'Los saqueadores están más al este. Prepárate antes de acercarte.',
      'Derrota a los bandidos marcados y habla con Oren.',
      'La entrada minera está al nordeste del campamento.',
      'El capitán usa escudo: espera su ataque fuerte o usa magia.',
      'Edric te espera en Valdoria. La elección será permanente.',
      'El Comprador todavía no ha sido identificado.',
    ],
  };

  function q() {
    U.state.hierrogris ||= {
      stage: 0,
      accepted: false,
      inspectedWagon: false,
      campKills: 0,
      captainDefeated: false,
      choice: null,
      compendium: [],
      spawned: false,
      completedAt: null,
    };
    return U.state.hierrogris;
  }

  function addCompendium(id) {
    const state = q();
    if (!state.compendium.includes(id)) state.compendium.push(id);
  }

  function refreshTracker() {
    const state = q();
    const objective = document.querySelector('#quest-objective');
    const hint = document.querySelector('#quest-hint');
    const fill = document.querySelector('#quest-progress-fill');
    if (!objective) return;
    objective.textContent = QUEST.objectives[state.stage] || QUEST.objectives[0];
    hint.textContent = QUEST.hints[state.stage] || '';
    fill.style.width = `${Math.min(100, (state.stage / 7) * 100)}%`;
    document.querySelector('#quest-tracker')?.classList.toggle('complete', state.stage >= 7);
  }

  function advance(stage, message) {
    const state = q();
    if (stage <= state.stage) return;
    state.stage = stage;
    if (message) U.toast(message);
    refreshTracker();
    U.sound?.('ui');
  }

  function dialog(title, html, actions) {
    const d = document.querySelector('#quest-dialog');
    document.querySelector('#quest-dialog-title').textContent = title;
    document.querySelector('#quest-dialog-body').innerHTML = html;
    const host = document.querySelector('#quest-dialog-actions');
    host.innerHTML = '';
    actions.forEach(action => {
      const button = document.createElement('button');
      button.textContent = action.label;
      if (action.primary) button.className = 'primary';
      button.onclick = () => {
        action.run();
        d.close();
      };
      host.append(button);
    });
    d.showModal();
  }

  function spawnQuestBandit(role, name, x, y, props = {}) {
    U.spawnEnemy('bandit', x, y, !!props.boss, props.variant || null);
    const e = U.enemies[U.enemies.length - 1];
    Object.assign(e, {
      questId: props.questId || `hierrogris-${role}-${x}-${y}`,
      questRole: role,
      role,
      name,
      homeX: x,
      homeY: y,
      visualType: 'bandit',
      weaponVisual: props.weapon || 'sword',
      armorVisual: props.armor || 'leather',
      shieldVisual: !!props.shield,
      respawnLocked: true,
      hp: props.hp || e.hp,
      maxHp: props.hp || e.maxHp,
      dmg: props.dmg || e.dmg,
      speed: props.speed || e.speed,
      danger: props.danger || 3,
      loot: props.loot || e.loot,
      nameColor: props.boss ? '#f2c96d' : '#e39276',
    });
    return e;
  }

  function setupQuestWorld() {
    const state = q();
    if (state.spawned && U.npcs.some(n => n.questId === 'edric')) return;
    state.spawned = true;
    U.npcs.push(
      {
        questId: 'edric',
        type: 'quest',
        name: 'Edric, administrador',
        x: 4,
        y: 3,
        city: 'Valdoria',
        color: '#7f6841',
        nameColor: '#f2cf75',
        facing: 'left',
      },
      { questId: 'oren', type: 'quest', name: 'Oren, minero cautivo', x: 78, y: -2, color: '#766f62' },
      { questId: 'foreman', type: 'quest', name: 'Dagan, capataz', x: 110, y: -6, color: '#675d4f' },
    );
    const existing = new Set(U.enemies.map(e => e.questId).filter(Boolean));
    if (!existing.has('hierrogris-raider-1'))
      spawnQuestBandit('raider', 'Saqueador del camino', 72, -1, {
        questId: 'hierrogris-raider-1', weapon: 'shortSword', armor: 'leather', hp: 92, speed: 2.7,
      });
    if (!existing.has('hierrogris-spearman'))
      spawnQuestBandit('spearman', 'Lancero de Hierrogris', 76, -5, {
        questId: 'hierrogris-spearman', weapon: 'spear', armor: 'bracers', hp: 112, dmg: 12,
      });
    if (!existing.has('hierrogris-archer'))
      spawnQuestBandit('archer', 'Tirador encapuchado', 80, -1, {
        questId: 'hierrogris-archer', weapon: 'bow', armor: 'hood', hp: 78, speed: 2.4,
      });
    if (!existing.has('hierrogris-guardian'))
      spawnQuestBandit('guardian', 'Guardián del campamento', 79, -6, {
        questId: 'hierrogris-guardian', weapon: 'mace', armor: 'mail', shield: true, hp: 155, dmg: 14,
      });
    if (!existing.has('hierrogris-captain'))
      spawnQuestBandit('captain', 'Capitán de Hierrogris', 111, -9, {
        questId: 'hierrogris-captain', weapon: 'longSword', armor: 'plate', shield: true,
        boss: true, hp: 340, dmg: 18, danger: 6,
        loot: [['gold', 1], ['ironSword', .35], ['shield', .3], ['helmet', .22], ['potion', .5]],
      });
  }

  function talkEdric() {
    const state = q();
    if (state.stage === 0) {
      dialog('Edric · Caravana desaparecida',
        `<p>Una caravana de la mina de Hierrogris debía llegar hace dos días. Uno de sus caballos volvió solo, con las riendas cortadas.</p>
         <p>Encuentra el carro y averigua si los trabajadores siguen con vida. El camino sale por la puerta oriental.</p>`,
        [
          { label: 'Aceptar misión', primary: true, run: () => { state.accepted = true; advance(1, 'Misión iniciada: La caravana de Hierrogris.'); } },
          { label: 'Ahora no', run: () => {} },
        ]);
      return;
    }
    if (state.stage === 6) {
      dialog('El destino del Corazón',
        `<p>Edric observa el fragmento metálico. El sello no pertenece a ninguna mina conocida.</p>
         <p><b>¿Qué harás con el Corazón de Hierrogris?</b></p>`,
        [
          { label: 'Entregarlo a la ciudad', primary: true, run: () => finish('city') },
          { label: 'Llevarlo al herrero', run: () => finish('smith') },
          { label: 'Conservarlo', run: () => finish('keep') },
        ]);
      return;
    }
    if (state.stage >= 7) return U.toast('Edric: “La ciudad recuerda lo que hiciste por los mineros.”');
    U.toast(QUEST.objectives[state.stage]);
  }

  function finish(choice) {
    const state = q();
    state.choice = choice;
    state.completedAt = Date.now();
    if (choice === 'city') {
      U.player.gold += 450;
      U.state.reputation = (U.state.reputation || 0) + 20;
      U.addItem('potion', 3);
      U.toast('Recompensa: 450 oro, 20 reputación y 3 pociones.');
    } else if (choice === 'smith') {
      U.addItem('shield');
      U.addItem('ironIngot', 8);
      U.state.hierrogrisRecipes = true;
      U.toast('Recompensa: escudo reforzado, lingotes y recetas de Hierrogris.');
    } else {
      U.addItem('heartGreyiron');
      U.player.gold += 120;
      U.toast('Conservas el Corazón. Esta decisión tendrá consecuencias.');
    }
    addCompendium('el-comprador');
    advance(7, 'Misión completada: La caravana de Hierrogris.');
    U.ui?.refreshAll?.();
  }

  function inspectWagon() {
    const state = q();
    if (state.stage !== 1) return;
    state.inspectedWagon = true;
    addCompendium('saqueadores-camino-oriental');
    dialog('El carro destruido',
      `<p>Las cajas fueron abiertas con herramientas y una flecha marcada quedó clavada en la madera. No hay señales de que los mineros fueran abandonados aquí.</p>
       <p>El registro de carga menciona un objeto desconocido: <b>Corazón de Hierrogris</b>. Un rastro de huellas continúa al este.</p>`,
      [{ label: 'Seguir las huellas', primary: true, run: () => advance(2, 'Compendio actualizado: Saqueadores del Camino Oriental.') }]);
  }

  function talkOren() {
    const state = q();
    const alive = U.enemies.some(e => e.questId?.startsWith('hierrogris-') && e.questRole !== 'captain' && !e.dead);
    if (state.stage < 2) return U.toast('El minero no confía en desconocidos.');
    if (alive) return U.toast('Oren: “¡Primero acaba con los guardias del campamento!”');
    if (state.stage <= 3) {
      dialog('Oren · Minero liberado',
        `<p>Los bandidos no buscaban hierro. Obligaron al capataz Dagan a volver a la mina para encontrar un segundo fragmento del Corazón.</p>
         <p>Su capitán lleva un escudo robado y vigila la cámara interior.</p>`,
        [{ label: 'Ir a la mina', primary: true, run: () => advance(4, 'Objetivo actualizado: entra en la mina de Hierrogris.') }]);
    } else U.toast('Oren: “Dagan sigue dentro. La mina está al nordeste.”');
  }

  function talkForeman() {
    const state = q();
    if (state.stage < 4) return U.toast('Dagan: “No puedo irme mientras el capitán siga aquí.”');
    if (!state.captainDefeated) {
      advance(5, 'El Capitán de Hierrogris protege el fragmento.');
      return U.toast('Dagan: “Ataca después de su golpe fuerte; entonces baja el escudo.”');
    }
    if (state.stage < 6) {
      U.addItem('heartGreyiron');
      U.addItem('buyerNote');
      addCompendium('corazon-hierrogris');
      advance(6, 'Has recuperado el Corazón. Regresa con Edric.');
    } else U.toast('Dagan: “Lleva el Corazón a Valdoria. Yo sacaré a los demás.”');
  }

  U.itemDefs.heartGreyiron ||= {
    name: 'Corazón de Hierrogris', icon: '◆', type: 'quest', stack: false,
    desc: 'Fragmento metálico antiguo, tibio pese al aire de la mina.',
  };
  U.itemDefs.buyerNote ||= {
    name: 'Nota del Comprador', icon: '✉', type: 'quest', stack: false,
    desc: 'Ordena recuperar los fragmentos y evita revelar quién paga el encargo.',
  };

  const oldSetupWorld = U.setupWorld;
  U.setupWorld = function () {
    oldSetupWorld();
    setupQuestWorld();
  };

  const oldInteractNpc = U.interactNpc;
  U.interactNpc = function (n) {
    if (n?.questId === 'edric') return talkEdric();
    if (n?.questId === 'oren') return talkOren();
    if (n?.questId === 'foreman') return talkForeman();
    return oldInteractNpc(n);
  };

  const oldGetContext = U.getContextAction;
  U.getContextAction = function () {
    const state = q();
    if (state.stage === 1 && U.dist(U.player, QUEST.wagon) < 3)
      return { type: 'quest-wagon', label: 'Examinar carro', icon: '🔎' };
    const npc = U.npcs.find(n => n.questId && U.dist(U.player, n) < 2.4);
    if (npc) return { type: 'use', label: 'Hablar', icon: '💬', target: npc };
    return oldGetContext();
  };

  const oldUseContext = U.useContext;
  U.useContext = function () {
    const action = U.getContextAction();
    if (action.type === 'quest-wagon') return inspectWagon();
    if (action.target?.questId) return U.interactNpc(action.target);
    return oldUseContext();
  };

  const oldKillEnemy = U.killEnemy;
  U.killEnemy = function (enemy) {
    oldKillEnemy(enemy);
    const state = q();
    if (!enemy.questId) return;
    enemy.respawnAt = Number.MAX_SAFE_INTEGER;
    if (enemy.questRole === 'captain') {
      state.captainDefeated = true;
      if (state.stage >= 4) advance(5, 'El capitán ha caído. Habla con el capataz Dagan.');
    } else {
      state.campKills++;
      if (state.stage === 2) advance(3, 'Campamento encontrado: libera al minero cautivo.');
    }
  };

  const oldUpdate = U.update;
  U.update = function (dt) {
    oldUpdate(dt);
    const state = q();
    if (state.stage === 2 && U.dist(U.player, QUEST.camp) < 15) advance(3, 'Has encontrado el campamento bandido.');
    if (state.stage === 4 && U.dist(U.player, QUEST.mine) < 12) advance(5, 'Has entrado en la mina de Hierrogris.');
    for (const e of U.enemies) if (e.respawnLocked && e.dead) e.respawnAt = Number.MAX_SAFE_INTEGER;
  };

  function marker(c, x, y, color, label) {
    const p = U.worldToScreen(x, y, 20);
    const pulse = 1 + Math.sin(performance.now() / 260) * .12;
    c.save();
    c.translate(p.x, p.y);
    c.scale(pulse, pulse);
    c.fillStyle = color;
    c.strokeStyle = '#241b10';
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(0, -17); c.lineTo(10, -5); c.lineTo(0, 8); c.lineTo(-10, -5); c.closePath();
    c.fill(); c.stroke();
    c.font = 'bold 11px Arial'; c.textAlign = 'center'; c.fillStyle = '#f5ead0';
    c.strokeText(label, 0, -25); c.fillText(label, 0, -25);
    c.restore();
  }

  const oldDraw = U.draw;
  U.draw = function () {
    oldDraw();
    const state = q(), c = U.ctx;
    if (state.stage === 0) marker(c, 4, 3, '#d3a448', 'Edric');
    if (state.stage === 1) marker(c, QUEST.wagon.x, QUEST.wagon.y, '#d3a448', 'Carro');
    if (state.stage >= 2 && state.stage <= 3) marker(c, QUEST.camp.x, QUEST.camp.y, '#c35b4c', 'Campamento');
    if (state.stage >= 4 && state.stage <= 5) marker(c, QUEST.mine.x, QUEST.mine.y, '#c35b4c', 'Mina');
    if (state.stage === 6) marker(c, 4, 3, '#d3a448', 'Edric');
  };

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('#quest-dialog [data-close]').forEach(b => b.onclick = () => b.closest('dialog').close());
    refreshTracker();
  });
})((window.Ultra = window.Ultra || {}));
