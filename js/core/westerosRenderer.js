(function (U) {
  'use strict';

  /*
   * Renderer humano V7.17.
   * Formas, rig y jerarquías proceden de Westeros V5, corregido según index(37).
   * El renderer anterior se conserva como respaldo para bestias.
   */
  let ctx = null;
  const state = {
    tab: 'humans',
    dir: 'down',
    action: 'idle',
    main: 'none',
    off: 'none',
    hair: 'short',
    showClothes: true,
    clothes: { head: false, neck: false, shirt: true, arms: true, gloves: false, pants: true, boots: false },
    showCape: false,
    showTunic: false,
    equip: {
      helmet: false,
      neck: false,
      torso: false,
      arms: false,
      gloves: false,
      legs: false,
      boots: false,
    },
    armorSet: 'placas',
    tunicSet: 'maestre',
    capeSet: 'invierno',
    weaponSet: 'norte',
    weaponColor: '#c2c9ce',
    shieldColor: '#756a5e',
    paused: false,
  };

  const RIG = {
    headTop: -146,
    headBot: -106,
    headCy: -126,
    neckTop: -104,
    neckBot: -92,
    shoulderY: -90,
    shoulderX: 27,
    chestY: -56,
    waistY: -14,
    hipY: 28,
    hipX: 13,
    elbowY: -30,
    handY: 16,
    kneeY: 72,
    footY: 116,
  };

  /* ══════════════════════════════════════════════════════════════════
   2 · MODELO DE EQUIPAMIENTO (slots + reglas)
   ══════════════════════════════════════════════════════════════════ */
  const MAIN = {
    none: { name: 'Sin arma', hands: 0, kind: 'empty' },
    sword: { name: 'Espada', hands: 1, kind: 'blade', reach: 118, arc: 'slash' },
    dagger: { name: 'Daga', hands: 1, kind: 'blade', reach: 38, arc: 'stab' },
    mace: { name: 'Maza', hands: 1, kind: 'blunt', reach: 100, arc: 'slash' },
    axe: { name: 'Hacha', hands: 1, kind: 'blade', reach: 104, arc: 'slash' },
    spear: { name: 'Lanza', hands: 1, kind: 'polearm', reach: 148, arc: 'stab' },
    greatSword: { name: 'Mandoble', hands: 2, kind: 'blade', reach: 150, arc: 'slash' },
    greatMace: { name: 'Gran maza', hands: 2, kind: 'blunt', reach: 142, arc: 'slash' },
    greatAxe: { name: 'Gran hacha', hands: 2, kind: 'blade', reach: 146, arc: 'slash' },
    greatSpear: { name: 'Pica', hands: 2, kind: 'polearm', reach: 196, arc: 'stab' },
    bow: { name: 'Arco', hands: 2, kind: 'ranged', reach: 0, arc: 'shoot' },
    staff: { name: 'Báculo', hands: 2, kind: 'focus', reach: 132, arc: 'cast', tag: 'staff' },
  };
  const OFF = {
    none: { name: 'Vacía', kind: 'empty' },
    shield: { name: 'Escudo', kind: 'shield' },
    spellbook: { name: 'Spellbook', kind: 'focus', tag: 'spellbook' },
    dagger: { name: 'Daga (dual)', kind: 'blade' },
    axe: { name: 'Hacha (dual)', kind: 'blade' },
    sword: { name: 'Espada (dual)', kind: 'blade' },
    mace: { name: 'Maza (dual)', kind: 'blunt' },
  };
  const isTwoHanded = id => (MAIN[id]?.hands || 0) === 2;

  /* Regla única de compatibilidad. Devuelve null si es válido, o el motivo. */
  function combineError(main, off) {
    if (off === 'none') {
      if (main === 'none') return null;
      return null;
    }
    if (off === 'spellbook') {
      if (main === 'none' || main === 'staff') return null;
      return 'El spellbook solo se lleva solo o con báculo.';
    }
    if (main === 'staff') return 'El báculo solo se combina con spellbook.';
    if (isTwoHanded(main)) return `${MAIN[main].name} ocupa las dos manos.`;
    if (main === 'none' && off !== 'shield') return 'Un arma secundaria necesita arma principal.';
    return null;
  }
  /* Auto-corrección: al cambiar un slot, ajusta el otro si quedó inválido. */
  function normalizeLoadout(changed) {
    const e = combineError(state.main, state.off);
    if (!e) return null;
    if (changed === 'main') {
      state.off =
        state.main === 'staff'
          ? 'spellbook'
          : isTwoHanded(state.main)
            ? 'none'
            : state.main === 'none'
              ? 'none'
              : 'none';
      if (state.main === 'none') state.off = 'none';
    } else {
      if (state.off === 'spellbook') state.main = state.main === 'staff' ? 'staff' : 'none';
      else if (isTwoHanded(state.main) || state.main === 'staff') state.main = 'sword';
      else if (state.main === 'none') state.main = 'sword';
    }
    return e;
  }
  const hasShield = () => state.off === 'shield';
  const hasSpellbook = () => state.off === 'spellbook';
  const isDualWield = () => ['dagger', 'axe', 'sword', 'mace'].includes(state.off);
  const usesTwoHandGrip = () => isTwoHanded(state.main) && state.main !== 'bow';

  /* ══════════════════════════════════════════════════════════════════
   3 · SISTEMA DE ANIMACIÓN — clips con curvas propias
   ══════════════════════════════════════════════════════════════════ */
  const CLIPS = {
    idle: { dur: 2.6, loop: true },
    walk: { dur: 0.92, loop: true },
    melee: { dur: 0.78, loop: true },
    cast: { dur: 1.55, loop: true },
    hurt: { dur: 0.7, loop: true },
    death: { dur: 1.7, loop: false },
  };
  /* Canales de pose. Todo lo que dibuja lee de aquí, nunca de time directo. */
  const P = {
    bob: 0,
    breath: 0,
    torsoTwist: 0,
    torsoLean: 0,
    headTilt: 0,
    headY: 0,
    legPhase: 0,
    armPhase: 0,
    swing: 0,
    thrust: 0,
    guard: 0,
    castCharge: 0,
    castBurst: 0,
    recoil: 0,
    flash: 0,
    fall: 0,
    alpha: 1,
    sink: 0,
    capeLift: 0,
    capeSway: 0,
  };
  let clipT = 0,
    clipDone = false;
  const eOutCubic = t => 1 - Math.pow(1 - t, 3);
  const eInCubic = t => t * t * t;
  const eOutBack = t => {
    const c = 2.2;
    return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
  };
  const eOutElastic = t =>
    t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -9 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;
  const eInOut = t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  const seg01 = (t, a, b) => Math.max(0, Math.min(1, (t - a) / (b - a)));

  function resetPose() {
    for (const k in P) P[k] = 0;
    P.alpha = 1;
  }

  function updateAnim(dt) {
    if (state.paused) dt = 0;
    const act = state.tab === 'humans' ? state.action : state.beastAction;
    const clip = CLIPS[act] || CLIPS.idle;
    clipT += dt;
    if (clipT >= clip.dur) {
      if (clip.loop) clipT %= clip.dur;
      else {
        clipT = clip.dur;
        clipDone = true;
      }
    }
    const t = clipT / clip.dur; // 0..1 normalizado
    resetPose();

    if (act === 'idle') {
      /* Respiración en dos tiempos + micro balanceo + peso alternado */
      P.breath = Math.sin(t * Math.PI * 2);
      P.bob = Math.sin(t * Math.PI * 2) * 1.8 + Math.sin(t * Math.PI * 4) * 0.5;
      P.torsoTwist = Math.sin(t * Math.PI * 2) * 0.022;
      P.torsoLean = Math.sin(t * Math.PI * 2 + 0.7) * 0.015;
      P.headTilt = Math.sin(t * Math.PI * 2 + 1.1) * 0.035;
      P.headY = Math.sin(t * Math.PI * 2) * 1.1;
      P.armPhase = Math.sin(t * Math.PI * 2) * 0.9;
      P.legPhase = 0;
      P.guard = 0.12 + Math.sin(t * Math.PI * 2) * 0.05;
      P.capeSway = Math.sin(t * Math.PI * 2 + 0.4) * 2.2;
      P.capeLift = 0.05;
    } else if (act === 'walk') {
      /* Ciclo de marcha: contacto → paso → contacto → paso */
      const ph = t * Math.PI * 2;
      P.legPhase = Math.sin(ph);
      P.armPhase = -Math.sin(ph) * 1.15; // brazos contrarios
      P.bob = Math.abs(Math.sin(ph)) * 7.5 - 3; // sube en el paso
      P.torsoTwist = Math.sin(ph) * 0.075; // rotación de hombros
      P.torsoLean = 0.045; // inclinación al avanzar
      P.headTilt = -Math.sin(ph) * 0.03;
      P.headY = Math.abs(Math.sin(ph)) * 2.2;
      P.breath = Math.sin(ph * 0.5);
      P.guard = 0.18;
      P.capeSway = Math.sin(ph - 0.6) * 7;
      P.capeLift = 0.35 + Math.abs(Math.sin(ph)) * 0.18;
    } else if (act === 'melee') {
      /* 3 fases: carga (0–.30) · impacto (.30–.46) · recuperación (.46–1) */
      if (t < 0.3) {
        const k = eOutCubic(seg01(t, 0, 0.3));
        P.swing = -0.55 * k; // retrocede el arma
        P.torsoTwist = -0.16 * k;
        P.torsoLean = -0.05 * k;
        P.armPhase = -1.5 * k;
        P.bob = -2 * k;
        P.guard = 0.1;
      } else if (t < 0.46) {
        const k = eInCubic(seg01(t, 0.3, 0.46));
        P.swing = -0.55 + 2.05 * k; // latigazo
        P.torsoTwist = -0.16 + 0.42 * k;
        P.torsoLean = -0.05 + 0.16 * k;
        P.armPhase = -1.5 + 4.2 * k;
        P.thrust = k;
        P.bob = -2 + 7 * k;
        P.headTilt = 0.1 * k;
        P.guard = 0.1;
      } else {
        const k = eOutElastic(seg01(t, 0.46, 1));
        P.swing = 1.5 - 1.42 * k;
        P.torsoTwist = 0.26 - 0.26 * k;
        P.torsoLean = 0.11 - 0.11 * k;
        P.armPhase = 2.7 - 2.7 * k;
        P.thrust = 1 - k;
        P.bob = 5 - 5 * k;
        P.headTilt = 0.1 - 0.1 * k;
        P.guard = 0.1 + 0.08 * k;
      }
      P.breath = Math.sin(t * Math.PI * 2);
      P.capeSway = P.swing * 9;
      P.capeLift = 0.3 + Math.abs(P.swing) * 0.25;
    } else if (act === 'cast') {
      /* Acumulación (0–.62) · descarga (.62–.78) · asentar (.78–1) */
      if (t < 0.62) {
        const k = eOutCubic(seg01(t, 0, 0.62));
        P.castCharge = k;
        P.armPhase = 2.6 * k;
        P.torsoLean = -0.06 * k;
        P.bob = -3 * k + Math.sin(t * Math.PI * 14) * 0.9 * k; // vibración
        P.headTilt = -0.08 * k;
        P.headY = -2.5 * k;
        P.capeLift = 0.25 + 0.45 * k;
      } else if (t < 0.78) {
        const k = seg01(t, 0.62, 0.78);
        P.castCharge = 1 - k * 0.65;
        P.castBurst = Math.sin(k * Math.PI);
        P.armPhase = 2.6 + 1.5 * eInCubic(k);
        P.torsoLean = -0.06 + 0.18 * k;
        P.bob = -3 + 9 * k;
        P.headTilt = -0.08 + 0.16 * k;
        P.capeLift = 0.7 + 0.5 * Math.sin(k * Math.PI);
      } else {
        const k = eOutCubic(seg01(t, 0.78, 1));
        P.castCharge = 0.35 * (1 - k);
        P.castBurst = 0;
        P.armPhase = 4.1 - 4.1 * k;
        P.torsoLean = 0.12 - 0.12 * k;
        P.bob = 6 - 6 * k;
        P.headTilt = 0.08 - 0.08 * k;
        P.capeLift = 0.7 - 0.65 * k;
      }
      P.breath = Math.sin(t * Math.PI * 2);
      P.capeSway = Math.sin(t * Math.PI * 6) * 3.5;
    } else if (act === 'hurt') {
      /* Impulso brusco + decaimiento oscilante */
      const k = Math.pow(1 - t, 2.1);
      P.recoil = Math.sin(t * Math.PI * 7) * k;
      P.flash = Math.pow(1 - Math.min(1, t * 4), 2);
      P.torsoLean = -0.3 * k;
      P.torsoTwist = -0.18 * k;
      P.headTilt = -0.34 * k;
      P.headY = 3.5 * k;
      P.bob = -5 * k;
      P.armPhase = -2.2 * k;
      P.legPhase = 0.5 * k;
      P.guard = 0.05;
      P.capeSway = -12 * k;
      P.capeLift = 0.45 * k;
    } else if (act === 'death') {
      /* Impacto → tambaleo → derrumbe → asentamiento */
      if (t < 0.18) {
        // impacto
        const k = eOutCubic(seg01(t, 0, 0.18));
        P.recoil = Math.sin(k * Math.PI * 3) * (1 - k);
        P.flash = Math.pow(1 - k, 2);
        P.torsoLean = -0.34 * k;
        P.headTilt = -0.42 * k;
        P.bob = -6 * k;
        P.armPhase = -2.6 * k;
      } else if (t < 0.42) {
        // tambaleo, rodillas ceden
        const k = eInOut(seg01(t, 0.18, 0.42));
        P.torsoLean = -0.34 + 0.62 * k;
        P.headTilt = -0.42 + 0.3 * k;
        P.bob = -6 + 16 * k;
        P.sink = 10 * k;
        P.legPhase = Math.sin(k * Math.PI * 2) * 0.8;
        P.armPhase = -2.6 + 1.2 * k;
      } else if (t < 0.8) {
        // caída
        const k = eInCubic(seg01(t, 0.42, 0.8));
        P.fall = k;
        P.torsoLean = 0.28 + 0.3 * k;
        P.headTilt = -0.12 - 0.55 * k;
        P.sink = 10 + 38 * k;
        P.armPhase = -1.4 - 2.4 * k;
        P.legPhase = 0.8 - 1.6 * k;
        P.alpha = 1;
      } else {
        // asentamiento + desvanecer
        const k = eOutCubic(seg01(t, 0.8, 1));
        P.fall = 1 + 0.06 * Math.sin(k * Math.PI * 2) * (1 - k);
        P.torsoLean = 0.58;
        P.headTilt = -0.67;
        P.sink = 48 + 4 * k;
        P.armPhase = -3.8;
        P.legPhase = -0.8;
        P.alpha = 1 - 0.45 * k;
      }
      P.capeSway = P.fall * 16;
      P.capeLift = P.fall * 0.6;
    }
  }

  /* ══════════════════════════════════════════════════════════════════
   4 · UTILIDADES DE DIBUJO
   ══════════════════════════════════════════════════════════════════ */
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  function shade(hex, amt) {
    if (!hex || hex[0] !== '#') return hex;
    const n = parseInt(hex.slice(1), 16);
    return `rgb(${clamp(((n >> 16) & 255) + amt, 0, 255)},${clamp(((n >> 8) & 255) + amt, 0, 255)},${clamp((n & 255) + amt, 0, 255)})`;
  }
  function ell(x, y, rx, ry, c, rot = 0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  function seg(x1, y1, x2, y2, w, c, cap = 'round') {
    ctx.strokeStyle = c;
    ctx.lineWidth = w;
    ctx.lineCap = cap;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  function rr(x, y, w, h, r, fill, stroke) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
  }
  function poly(pts, fill, stroke, lw = 1.3) {
    ctx.beginPath();
    pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
    ctx.closePath();
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = lw;
      ctx.stroke();
    }
  }

  /* ══════════════════════════════════════════════════════════════════
   5 · ARTE DE ARMAS — origen local (0,0) = CENTRO DE LA EMPUÑADURA
   Así el arma queda siempre anclada al centro de la mano.
   ══════════════════════════════════════════════════════════════════ */
  const O = 'rgba(20,14,11,.48)';
  function studs(pts, c, r = 1.9) {
    ctx.fillStyle = c;
    pts.forEach(([x, y]) => {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    });
  }
  function escamaFila(y, ancho, off, c, paso = 6.8, alto = 8.5) {
    for (let x = -ancho + off; x <= ancho - 3; x += paso) {
      ctx.beginPath();
      ctx.moveTo(x - 3.2, y);
      ctx.quadraticCurveTo(x, y + alto, x + 3.2, y);
      ctx.closePath();
      ctx.fillStyle = c;
      ctx.fill();
      ctx.strokeStyle = O;
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }
  }
  /* Bandas perpendiculares a un hueso: sirve para brazos y piernas. */
  function bandasHueso(a, b, ancho, n, c, grosor = 1.2) {
    const dx = b.x - a.x,
      dy = b.y - a.y,
      L = Math.hypot(dx, dy) || 1;
    const nx = -dy / L,
      ny = dx / L;
    ctx.strokeStyle = c;
    ctx.lineWidth = grosor;
    for (let i = 1; i <= n; i++) {
      const t = i / (n + 1),
        px = a.x + dx * t,
        py = a.y + dy * t;
      ctx.beginPath();
      ctx.moveTo(px - nx * ancho, py - ny * ancho);
      ctx.lineTo(px + nx * ancho, py + ny * ancho);
      ctx.stroke();
    }
  }
  function tachasHueso(a, b, n, c, r = 1.8) {
    const pts = [];
    for (let i = 1; i <= n; i++) {
      const t = i / (n + 1);
      pts.push([a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t]);
    }
    studs(pts, c, r);
  }
  /* Casco: corona común por dirección; cada set le agrega lo suyo. */
  function coronaCasco(dir, c, alto = 0, ancho = 0) {
    const top = RIG.headTop,
      cy = RIG.headCy,
      w = 16 + ancho,
      t = top - 7 - alto;
    if (dir === 'down')
      poly(
        [
          [-w, cy + 2],
          [-w, top + 2],
          [-9, t],
          [9, t],
          [w, top + 2],
          [w, cy + 2],
          [10, cy - 3],
          [-10, cy - 3],
        ],
        c,
        O,
        1.5,
      );
    else if (dir === 'up')
      poly(
        [
          [-w, cy + 6],
          [-w, top + 2],
          [-9, t],
          [9, t],
          [w, top + 2],
          [w, cy + 6],
          [0, cy + 10],
        ],
        c,
        O,
        1.5,
      );
    else
      poly(
        [
          [-w - 1, cy + 2],
          [-w, top + 1],
          [-6, t - 1],
          [9, top - 3],
          [w - 1, cy - 1],
          [9, cy - 4],
          [-11, cy - 4],
        ],
        c,
        O,
        1.5,
      );
  }

  const SETS = {
    /* ─────────────── METAL 1 · Placas del Norte ─────────────── */
    placas: {
      nombre: 'Placas del Norte',
      familia: 'metal',
      limb: (b, f) => shade(b.armor, f ? -4 : -16),
      hand: b => shade(b.armor, -18),
      torso(b) {
        const c = b.armor,
          hi = shade(c, 20),
          dk = shade(c, -20);
        poly(
          [
            [-10, RIG.neckBot - 2],
            [-26, -84],
            [-32, RIG.shoulderY + 16],
            [-30, RIG.chestY],
            [-24, RIG.waistY],
            [-21, 6],
            [21, 6],
            [24, RIG.waistY],
            [30, RIG.chestY],
            [32, RIG.shoulderY + 16],
            [26, -84],
            [10, RIG.neckBot - 2],
          ],
          c,
          O,
          1.6,
        );
        seg(0, -84, 0, 4, 2.4, hi);
        seg(2.5, -84, 2.5, 4, 1, 'rgba(0,0,0,.3)');
        [-62, -44, -26].forEach(y => seg(-28, y, 28, y, 1.4, dk));
        for (let i = 0; i < 3; i++) rr(-22 + i * 1.5, 8 + i * 8, 44 - i * 3, 11, 2, shade(c, -8 - i * 4), O);
        studs(
          [
            [-23, -64],
            [23, -64],
            [-25, -46],
            [25, -46],
            [-25, -28],
            [25, -28],
          ],
          hi,
        );
      },
      pauldron(s, b) {
        const c = b.armor;
        for (let i = 0; i < 3; i++)
          poly(
            [
              [-11 * s, -6 + i * 7],
              [12 * s, -9 + i * 7],
              [13 * s, 1 + i * 7],
              [-10 * s, 4 + i * 7],
            ],
            shade(c, -i * 9),
            O,
            1.3,
          );
        studs([[8 * s, -4]], shade(c, 20), 2);
      },
      helmet(dir, b) {
        const c = b.armor,
          hi = shade(c, 22),
          dk = shade(c, -14),
          top = RIG.headTop,
          cy = RIG.headCy;
        coronaCasco(dir, c);
        if (dir === 'down') {
          seg(0, top - 6, 0, cy - 2, 2.4, hi);
          seg(-16, cy - 1, 16, cy - 1, 1.6, dk);
          poly(
            [
              [-16, cy - 1],
              [-10, cy - 1],
              [-9, cy + 13],
              [-15, cy + 10],
            ],
            shade(c, -12),
            O,
            1.2,
          );
          poly(
            [
              [16, cy - 1],
              [10, cy - 1],
              [9, cy + 13],
              [15, cy + 10],
            ],
            shade(c, -12),
            O,
            1.2,
          );
          poly(
            [
              [-2.6, cy - 2],
              [2.6, cy - 2],
              [2.1, cy + 9],
              [-2.1, cy + 9],
            ],
            shade(c, -4),
            O,
            1.1,
          );
        } else if (dir === 'up') {
          seg(0, top - 6, 0, cy + 8, 2.4, hi);
          seg(-15, cy - 4, 15, cy - 4, 1.6, dk);
          studs(
            [
              [-9, cy - 8],
              [9, cy - 8],
              [0, top + 6],
            ],
            hi,
          );
        } else {
          seg(-6, top - 6, -13, cy - 3, 2.2, hi);
          poly(
            [
              [-16, cy - 2],
              [-9, cy - 2],
              [-8, cy + 12],
              [-15, cy + 9],
            ],
            shade(c, -12),
            O,
            1.2,
          );
          poly(
            [
              [9, cy - 3],
              [14, cy - 1],
              [13, cy + 7],
              [8, cy + 6],
            ],
            shade(c, -6),
            O,
            1.1,
          );
          seg(-16, cy - 1, 14, cy - 2, 1.5, dk);
        }
      },
      neck(b) {
        poly(
          [
            [-13, RIG.neckBot + 2],
            [-11, RIG.neckTop + 1],
            [11, RIG.neckTop + 1],
            [13, RIG.neckBot + 2],
            [9, RIG.neckBot + 5],
            [-9, RIG.neckBot + 5],
          ],
          shade(b.armor, -10),
          O,
          1.4,
        );
        studs(
          [
            [-8, RIG.neckBot],
            [8, RIG.neckBot],
          ],
          shade(b.armor, 20),
          1.5,
        );
      },
      armPlate(sh, el, hd, f, b) {
        const c = b.armor;
        ctx.save();
        ctx.lineCap = 'butt';
        ctx.strokeStyle = f ? shade(c, -4) : shade(c, -16);
        ctx.lineWidth = 12;
        ctx.beginPath();
        ctx.moveTo(sh.x, sh.y + 3);
        ctx.lineTo(el.x, el.y - 4);
        ctx.stroke();
        ctx.strokeStyle = shade(c, -10);
        ctx.lineWidth = 9;
        ctx.beginPath();
        ctx.moveTo(el.x, el.y + 4);
        ctx.lineTo(hd.x, hd.y - 4);
        ctx.stroke();
        ctx.restore();
        ctx.fillStyle = shade(c, -2);
        ctx.strokeStyle = O;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(el.x, el.y, 6.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      },
      glove(hd, f, b) {
        ell(hd.x, hd.y, 5.6, 5.6, shade(b.armor, -18));
        studs([[hd.x, hd.y - 1]], shade(b.armor, 8), 1.6);
      },
      legPlate(hip, knee, foot, f, b) {
        const c = b.armor;
        ctx.save();
        ctx.lineCap = 'butt';
        ctx.strokeStyle = shade(c, -8);
        ctx.lineWidth = 11;
        ctx.beginPath();
        ctx.moveTo(hip.x, hip.y + 2);
        ctx.lineTo(knee.x, knee.y - 6);
        ctx.stroke();
        ctx.strokeStyle = shade(c, -16);
        ctx.lineWidth = 9;
        ctx.beginPath();
        ctx.moveTo(knee.x, knee.y + 6);
        ctx.lineTo(foot.x, foot.y - 4);
        ctx.stroke();
        ctx.restore();
        ctx.fillStyle = shade(c, -4);
        ctx.strokeStyle = O;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(knee.x, knee.y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      },
      boot(knee, foot, b) {
        ctx.save();
        ctx.strokeStyle = shade(b.armor, -24);
        ctx.lineWidth = 10;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(foot.x - (foot.x - knee.x) * 0.3, foot.y - 14);
        ctx.lineTo(foot.x, foot.y);
        ctx.stroke();
        ctx.restore();
      },
      sole: b => shade(b.armor, -24),
    },

    /* ─────────────── METAL 2 · Escamas de Valyria ─────────────── */
    escamas: {
      nombre: 'Escamas de Valyria',
      familia: 'metal',
      limb: (b, f) => shade(b.armor, f ? -10 : -22),
      hand: b => shade(b.armor, -16),
      torso(b) {
        const c = b.armor,
          hi = shade(c, 26),
          dk = shade(c, -24);
        poly(
          [
            [-9, RIG.neckBot],
            [-25, -84],
            [-29, RIG.shoulderY + 18],
            [-28, RIG.chestY],
            [-24, RIG.waistY],
            [-22, 14],
            [22, 14],
            [24, RIG.waistY],
            [28, RIG.chestY],
            [29, RIG.shoulderY + 18],
            [25, -84],
            [9, RIG.neckBot],
          ],
          dk,
          O,
          1.4,
        );
        for (let f = 0, y = -84; y < 12; f++, y += 8) {
          const ancho = y < RIG.chestY ? 26 : y < RIG.waistY ? 27 : 23;
          escamaFila(y, ancho, f % 2 ? 3.4 : 0, shade(c, f % 2 ? 4 : -6));
        }
        poly(
          [
            [-14, RIG.neckBot - 4],
            [-11, RIG.neckTop + 2],
            [11, RIG.neckTop + 2],
            [14, RIG.neckBot - 4],
            [10, RIG.neckBot + 4],
            [-10, RIG.neckBot + 4],
          ],
          shade(c, 10),
          O,
          1.4,
        );
        seg(-12, RIG.neckBot, 12, RIG.neckBot, 1.2, hi);
      },
      pauldron(s, b) {
        const c = b.armor;
        ell(0, -2, 13, 10, shade(c, 6));
        ctx.strokeStyle = O;
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.ellipse(0, -2, 13, 10, 0, 0, Math.PI * 2);
        ctx.stroke();
        ell(0, -5, 6, 3.4, shade(c, 22));
        for (let i = 0; i < 2; i++) escamaFila(2 + i * 6, 10, i % 2 ? 2.5 : 0, shade(c, -6 - i * 6), 6, 6);
      },
      helmet(dir, b) {
        const c = b.armor,
          hi = shade(c, 24),
          top = RIG.headTop,
          cy = RIG.headCy;
        coronaCasco(dir, c, 3);
        // cofia de escamas bajo la corona
        if (dir !== 'up')
          for (let i = 0; i < 2; i++)
            escamaFila(
              cy - 1 + i * 6,
              dir === 'down' ? 16 : 15,
              i % 2 ? 3 : 0,
              shade(c, -8 - i * 6),
              6.4,
              6.4,
            );
        if (dir === 'down') {
          seg(0, top - 9, 0, cy - 4, 2.6, hi);
          poly(
            [
              [-3, cy - 4],
              [3, cy - 4],
              [2.2, cy + 11],
              [-2.2, cy + 11],
            ],
            shade(c, 2),
            O,
            1.1,
          );
          studs(
            [
              [-12, cy - 4],
              [12, cy - 4],
            ],
            hi,
            1.6,
          );
        } else if (dir === 'up') {
          seg(0, top - 9, 0, cy + 8, 2.6, hi);
          for (let i = 0; i < 2; i++)
            escamaFila(cy - 6 + i * 6, 15, i % 2 ? 3 : 0, shade(c, -6 - i * 6), 6.4, 6.4);
        } else {
          seg(-6, top - 9, -13, cy - 3, 2.4, hi);
          poly(
            [
              [9, cy - 4],
              [15, cy - 2],
              [14, cy + 8],
              [8, cy + 7],
            ],
            shade(c, -4),
            O,
            1.1,
          );
        }
      },
      neck(b) {
        const c = b.armor;
        poly(
          [
            [-14, RIG.neckBot + 3],
            [-12, RIG.neckTop - 2],
            [12, RIG.neckTop - 2],
            [14, RIG.neckBot + 3],
            [10, RIG.neckBot + 6],
            [-10, RIG.neckBot + 6],
          ],
          shade(c, 8),
          O,
          1.5,
        );
        seg(-12, RIG.neckTop + 3, 12, RIG.neckTop + 3, 1.2, shade(c, 26));
        seg(-13, RIG.neckBot + 1, 13, RIG.neckBot + 1, 1.2, shade(c, -18));
      },
      armPlate(sh, el, hd, f, b) {
        const c = b.armor;
        ctx.save();
        ctx.lineCap = 'butt';
        ctx.strokeStyle = f ? shade(c, -8) : shade(c, -20);
        ctx.lineWidth = 11.5;
        ctx.beginPath();
        ctx.moveTo(sh.x, sh.y + 3);
        ctx.lineTo(el.x, el.y - 3);
        ctx.stroke();
        ctx.strokeStyle = shade(c, -14);
        ctx.lineWidth = 9;
        ctx.beginPath();
        ctx.moveTo(el.x, el.y + 3);
        ctx.lineTo(hd.x, hd.y - 4);
        ctx.stroke();
        ctx.restore();
        // la escama se sugiere con bandas curvas cortas
        bandasHueso(sh, el, 5, 4, shade(c, f ? 10 : -2), 1.1);
        bandasHueso(el, hd, 4, 3, shade(c, f ? 6 : -6), 1);
        ctx.fillStyle = shade(c, 4);
        ctx.strokeStyle = O;
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.arc(el.x, el.y, 5.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      },
      glove(hd, f, b) {
        const c = b.armor;
        ell(hd.x, hd.y, 5.8, 5.4, shade(c, -16));
        ell(hd.x, hd.y - 1.6, 4.2, 2.4, shade(c, 6));
      },
      legPlate(hip, knee, foot, f, b) {
        const c = b.armor;
        ctx.save();
        ctx.lineCap = 'butt';
        ctx.strokeStyle = shade(c, -12);
        ctx.lineWidth = 11;
        ctx.beginPath();
        ctx.moveTo(hip.x, hip.y + 2);
        ctx.lineTo(knee.x, knee.y - 5);
        ctx.stroke();
        ctx.strokeStyle = shade(c, -20);
        ctx.lineWidth = 9;
        ctx.beginPath();
        ctx.moveTo(knee.x, knee.y + 5);
        ctx.lineTo(foot.x, foot.y - 4);
        ctx.stroke();
        ctx.restore();
        bandasHueso(hip, knee, 5.5, 5, shade(c, 2), 1.1);
        bandasHueso(knee, foot, 4.5, 4, shade(c, -4), 1);
        ctx.fillStyle = shade(c, 6);
        ctx.strokeStyle = O;
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.arc(knee.x, knee.y, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      },
      boot(knee, foot, b) {
        const c = b.armor;
        ctx.save();
        ctx.strokeStyle = shade(c, -20);
        ctx.lineWidth = 9.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(foot.x - (foot.x - knee.x) * 0.3, foot.y - 15);
        ctx.lineTo(foot.x, foot.y);
        ctx.stroke();
        ctx.restore();
        escamaFila(foot.y - 12, 5, 0, shade(c, 4), 5.5, 5);
      },
      sole: b => shade(b.armor, -20),
    },

    /* ─────────────── METAL 3 · Brigantina de la Guardia ─────────────── */
    brigantina: {
      nombre: 'Brigantina de la Guardia',
      familia: 'metal',
      limb: (b, f) => shade(b.armor, f ? -40 : -52),
      hand: b => shade(b.armor, -46),
      torso(b) {
        const c = b.armor,
          tela = shade(c, -46),
          hi = shade(c, 24);
        poly(
          [
            [-10, RIG.neckBot - 2],
            [-26, -84],
            [-31, RIG.shoulderY + 17],
            [-29, RIG.chestY],
            [-24, RIG.waistY],
            [-22, 20],
            [22, 20],
            [24, RIG.waistY],
            [29, RIG.chestY],
            [31, RIG.shoulderY + 17],
            [26, -84],
            [10, RIG.neckBot - 2],
          ],
          tela,
          O,
          1.5,
        );
        ctx.fillStyle = shade(c, 14);
        for (let y = -78; y < 16; y += 11)
          for (let x = -22; x <= 22; x += 11) {
            ctx.beginPath();
            ctx.arc(x + (Math.round((y + 78) / 11) % 2 ? 5.5 : 0), y, 1.5, 0, Math.PI * 2);
            ctx.fill();
          }
        poly(
          [
            [-8, -80],
            [8, -80],
            [10, RIG.waistY],
            [0, -6],
            [-10, RIG.waistY],
          ],
          shade(c, 4),
          O,
          1.4,
        );
        seg(0, -76, 0, -12, 1.6, hi);
        poly(
          [
            [-26, 18],
            [26, 18],
            [24, 26],
            [-24, 26],
          ],
          shade(c, -10),
          O,
          1.2,
        );
        const t = [];
        for (let x = -21; x <= 21; x += 7) t.push([x, 22]);
        studs(t, hi, 1.7);
        seg(-24, -80, 20, -34, 5, shade(c, -52));
        seg(24, -80, -20, -34, 5, shade(c, -56));
        studs(
          [
            [-24, -80],
            [24, -80],
            [20, -34],
            [-20, -34],
          ],
          '#8a6820',
          2.4,
        );
      },
      pauldron(s, b) {
        const c = b.armor,
          tela = shade(c, -46);
        poly(
          [
            [-10 * s, -8],
            [13 * s, -2],
            [12 * s, 10],
            [-11 * s, 4],
          ],
          tela,
          O,
          1.3,
        );
        studs(
          [
            [3 * s, 0],
            [3 * s, 6],
          ],
          shade(c, 20),
          1.7,
        );
      },
      helmet(dir, b) {
        const c = b.armor,
          hi = shade(c, 20),
          top = RIG.headTop,
          cy = RIG.headCy;
        // capacete abierto con ala: sin visera, se ve la cara
        const w = 17;
        if (dir === 'down') {
          poly(
            [
              [-w, cy - 6],
              [-w + 2, top + 4],
              [-8, top - 4],
              [8, top - 4],
              [w - 2, top + 4],
              [w, cy - 6],
            ],
            c,
            O,
            1.5,
          );
          poly(
            [
              [-w - 5, cy - 6],
              [w + 5, cy - 6],
              [w + 2, cy - 1],
              [-w - 2, cy - 1],
            ],
            shade(c, -14),
            O,
            1.3,
          );
          seg(0, top - 3, 0, cy - 7, 2.2, hi);
          studs(
            [
              [-11, cy - 9],
              [11, cy - 9],
            ],
            hi,
            1.6,
          );
        } else if (dir === 'up') {
          poly(
            [
              [-w, cy - 2],
              [-w + 2, top + 4],
              [-8, top - 4],
              [8, top - 4],
              [w - 2, top + 4],
              [w, cy - 2],
              [0, cy + 4],
            ],
            c,
            O,
            1.5,
          );
          poly(
            [
              [-w - 5, cy - 2],
              [w + 5, cy - 2],
              [w + 2, cy + 3],
              [-w - 2, cy + 3],
            ],
            shade(c, -14),
            O,
            1.3,
          );
          seg(0, top - 3, 0, cy + 2, 2.2, hi);
        } else {
          poly(
            [
              [-w - 1, cy - 6],
              [-w + 1, top + 3],
              [-6, top - 5],
              [9, top - 1],
              [w - 3, cy - 6],
            ],
            c,
            O,
            1.5,
          );
          poly(
            [
              [-w - 5, cy - 6],
              [w + 3, cy - 6],
              [w, cy - 1],
              [-w - 2, cy - 1],
            ],
            shade(c, -14),
            O,
            1.3,
          );
          seg(-6, top - 3, -12, cy - 7, 2, hi);
        }
      },
      neck(b) {
        const c = b.armor;
        poly(
          [
            [-13, RIG.neckBot + 3],
            [-11, RIG.neckTop + 4],
            [11, RIG.neckTop + 4],
            [13, RIG.neckBot + 3],
            [9, RIG.neckBot + 6],
            [-9, RIG.neckBot + 6],
          ],
          shade(c, -44),
          O,
          1.4,
        );
        studs(
          [
            [-7, RIG.neckBot + 1],
            [0, RIG.neckBot],
            [7, RIG.neckBot + 1],
          ],
          shade(c, 16),
          1.6,
        );
      },
      armPlate(sh, el, hd, f, b) {
        const c = b.armor,
          tela = shade(c, f ? -40 : -52);
        ctx.save();
        ctx.lineCap = 'butt';
        ctx.strokeStyle = tela;
        ctx.lineWidth = 12;
        ctx.beginPath();
        ctx.moveTo(sh.x, sh.y + 3);
        ctx.lineTo(el.x, el.y - 4);
        ctx.stroke();
        ctx.strokeStyle = shade(c, -48);
        ctx.lineWidth = 9;
        ctx.beginPath();
        ctx.moveTo(el.x, el.y + 4);
        ctx.lineTo(hd.x, hd.y - 4);
        ctx.stroke();
        ctx.restore();
        tachasHueso(sh, el, 3, shade(c, 16), 1.6);
        tachasHueso(el, hd, 2, shade(c, 12), 1.5);
        // codera de cuero, no de placa
        ctx.fillStyle = shade(c, -34);
        ctx.strokeStyle = O;
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.arc(el.x, el.y, 5.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      },
      glove(hd, f, b) {
        const c = b.armor;
        ell(hd.x, hd.y, 5.4, 5.4, shade(c, -46));
        studs(
          [
            [hd.x - 1.6, hd.y - 1],
            [hd.x + 1.8, hd.y - 1],
          ],
          shade(c, 14),
          1.3,
        );
      },
      legPlate(hip, knee, foot, f, b) {
        const c = b.armor;
        ctx.save();
        ctx.lineCap = 'butt';
        ctx.strokeStyle = shade(c, -44);
        ctx.lineWidth = 11;
        ctx.beginPath();
        ctx.moveTo(hip.x, hip.y + 2);
        ctx.lineTo(knee.x, knee.y - 6);
        ctx.stroke();
        ctx.strokeStyle = shade(c, -50);
        ctx.lineWidth = 9;
        ctx.beginPath();
        ctx.moveTo(knee.x, knee.y + 6);
        ctx.lineTo(foot.x, foot.y - 4);
        ctx.stroke();
        ctx.restore();
        tachasHueso(hip, knee, 3, shade(c, 14), 1.6);
        // rodillera de placa: es la unica pieza dura visible
        ctx.fillStyle = shade(c, 2);
        ctx.strokeStyle = O;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(knee.x, knee.y, 6.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      },
      boot(knee, foot, b) {
        const c = b.armor;
        ctx.save();
        ctx.strokeStyle = shade(c, -50);
        ctx.lineWidth = 10;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(foot.x - (foot.x - knee.x) * 0.3, foot.y - 13);
        ctx.lineTo(foot.x, foot.y);
        ctx.stroke();
        ctx.restore();
        seg(foot.x - 5, foot.y - 8, foot.x + 5, foot.y - 8, 1.6, shade(c, -30));
      },
      sole: b => shade(b.armor, -54),
    },

    /* ─────────────── CUERO 1 · Jubón acolchado ─────────────── */
    jubon: {
      nombre: 'Jubón acolchado',
      familia: 'cuero',
      limb: (b, f) => shade(b.armor, f ? 4 : -12),
      hand: b => shade(b.armor, -14),
      torso(b) {
        const c = b.armor,
          hi = shade(c, 20),
          dk = shade(c, -24);
        poly(
          [
            [-9, RIG.neckBot],
            [-25, -84],
            [-30, RIG.shoulderY + 17],
            [-28, RIG.chestY],
            [-23, RIG.waistY],
            [-21, 16],
            [21, 16],
            [23, RIG.waistY],
            [28, RIG.chestY],
            [30, RIG.shoulderY + 17],
            [25, -84],
            [9, RIG.neckBot],
          ],
          c,
          O,
          1.5,
        );
        ctx.strokeStyle = dk;
        ctx.lineWidth = 1.3;
        for (let x = -18; x <= 18; x += 9) {
          ctx.beginPath();
          ctx.moveTo(x, -80);
          ctx.quadraticCurveTo(x * 1.12, RIG.chestY, x, 14);
          ctx.stroke();
        }
        ctx.strokeStyle = 'rgba(0,0,0,.28)';
        ctx.lineWidth = 0.9;
        [-58, -36, -14].forEach(y => {
          ctx.beginPath();
          for (let x = -20; x < 20; x += 5) {
            ctx.moveTo(x, y);
            ctx.lineTo(x + 3, y);
          }
          ctx.stroke();
        });
        poly(
          [
            [-13, RIG.neckBot - 2],
            [-9, RIG.neckTop + 4],
            [9, RIG.neckTop + 4],
            [13, RIG.neckBot - 2],
            [8, RIG.neckBot + 6],
            [-8, RIG.neckBot + 6],
          ],
          hi,
          O,
          1.3,
        );
        rr(-22, RIG.waistY + 6, 44, 8, 2, dk, O);
        rr(-5, RIG.waistY + 5, 10, 10, 2, '#8a6820', '#5f4712');
      },
      pauldron(s, b) {
        const c = b.armor;
        poly(
          [
            [-9 * s, -7],
            [12 * s, -3],
            [11 * s, 9],
            [-10 * s, 5],
          ],
          shade(c, -6),
          O,
          1.3,
        );
        ctx.strokeStyle = shade(c, -22);
        ctx.lineWidth = 1;
        [0, 1, 2].forEach(i => seg(-7 * s, -4 + i * 4, 10 * s, -6 + i * 4, 1, shade(c, -22)));
      },
      helmet(dir, b) {
        const c = b.armor,
          hi = shade(c, 18),
          top = RIG.headTop,
          cy = RIG.headCy;
        // capucha acolchada blanda, no casco
        const w = 17;
        if (dir === 'down') {
          poly(
            [
              [-w, cy + 4],
              [-w + 1, top + 6],
              [-9, top - 2],
              [9, top - 2],
              [w - 1, top + 6],
              [w, cy + 4],
              [10, cy - 2],
              [-10, cy - 2],
            ],
            c,
            O,
            1.5,
          );
          ctx.strokeStyle = shade(c, -24);
          ctx.lineWidth = 1.1;
          [-8, 0, 8].forEach(x => {
            ctx.beginPath();
            ctx.moveTo(x, top - 1);
            ctx.lineTo(x * 1.3, cy - 2);
            ctx.stroke();
          });
          seg(-w, cy + 2, w, cy + 2, 1.5, hi);
        } else if (dir === 'up') {
          poly(
            [
              [-w, cy + 7],
              [-w + 1, top + 6],
              [-9, top - 2],
              [9, top - 2],
              [w - 1, top + 6],
              [w, cy + 7],
              [0, cy + 11],
            ],
            c,
            O,
            1.5,
          );
          ctx.strokeStyle = shade(c, -24);
          ctx.lineWidth = 1.1;
          [-8, 0, 8].forEach(x => {
            ctx.beginPath();
            ctx.moveTo(x, top - 1);
            ctx.lineTo(x * 1.2, cy + 7);
            ctx.stroke();
          });
        } else {
          poly(
            [
              [-w - 1, cy + 4],
              [-w + 1, top + 5],
              [-6, top - 3],
              [9, top + 1],
              [w - 3, cy + 2],
              [9, cy - 3],
              [-11, cy - 3],
            ],
            c,
            O,
            1.5,
          );
          ctx.strokeStyle = shade(c, -24);
          ctx.lineWidth = 1.1;
          ctx.beginPath();
          ctx.moveTo(-6, top - 1);
          ctx.lineTo(-13, cy - 1);
          ctx.stroke();
        }
      },
      neck(b) {
        const c = b.armor;
        poly(
          [
            [-13, RIG.neckBot + 2],
            [-10, RIG.neckTop + 3],
            [10, RIG.neckTop + 3],
            [13, RIG.neckBot + 2],
            [8, RIG.neckBot + 6],
            [-8, RIG.neckBot + 6],
          ],
          shade(c, 16),
          O,
          1.3,
        );
        seg(-11, RIG.neckBot + 1, 11, RIG.neckBot + 1, 1, shade(c, -24));
      },
      armPlate(sh, el, hd, f, b) {
        const c = b.armor;
        ctx.save();
        ctx.lineCap = 'round';
        ctx.strokeStyle = shade(c, f ? 2 : -14);
        ctx.lineWidth = 12.5;
        ctx.beginPath();
        ctx.moveTo(sh.x, sh.y + 2);
        ctx.lineTo(el.x, el.y);
        ctx.stroke();
        ctx.strokeStyle = shade(c, f ? -4 : -18);
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.moveTo(el.x, el.y);
        ctx.lineTo(hd.x, hd.y - 3);
        ctx.stroke();
        ctx.restore();
        bandasHueso(sh, el, 5.5, 4, shade(c, -22), 1.1);
        bandasHueso(el, hd, 4.5, 3, shade(c, -24), 1);
      },
      glove(hd, f, b) {
        ell(hd.x, hd.y, 5.4, 5.4, shade(b.armor, -14));
        seg(hd.x - 4, hd.y - 3, hd.x + 4, hd.y - 3, 1.2, shade(b.armor, 10));
      },
      legPlate(hip, knee, foot, f, b) {
        const c = b.armor;
        ctx.save();
        ctx.lineCap = 'round';
        ctx.strokeStyle = shade(c, f ? 0 : -16);
        ctx.lineWidth = 12.5;
        ctx.beginPath();
        ctx.moveTo(hip.x, hip.y + 2);
        ctx.lineTo(knee.x, knee.y);
        ctx.stroke();
        ctx.strokeStyle = shade(c, -12);
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.moveTo(knee.x, knee.y);
        ctx.lineTo(foot.x, foot.y - 4);
        ctx.stroke();
        ctx.restore();
        bandasHueso(hip, knee, 6, 5, shade(c, -24), 1.1);
        bandasHueso(knee, foot, 5, 4, shade(c, -26), 1);
      },
      boot(knee, foot, b) {
        ctx.save();
        ctx.strokeStyle = shade(b.armor, -22);
        ctx.lineWidth = 10.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(foot.x - (foot.x - knee.x) * 0.3, foot.y - 11);
        ctx.lineTo(foot.x, foot.y);
        ctx.stroke();
        ctx.restore();
        seg(foot.x - 5, foot.y - 9, foot.x + 5, foot.y - 9, 1.4, shade(b.armor, 6));
      },
      sole: b => shade(b.armor, -26),
    },

    /* ─────────────── CUERO 2 · Coraza de tiras ─────────────── */
    tiras: {
      nombre: 'Coraza de tiras',
      familia: 'cuero',
      limb: (b, f) => shade(b.armor, f ? -2 : -18),
      hand: b => shade(b.armor, -20),
      torso(b) {
        const c = b.armor,
          dk = shade(c, -28);
        poly(
          [
            [-9, RIG.neckBot],
            [-24, -84],
            [-29, RIG.shoulderY + 17],
            [-27, RIG.chestY],
            [-22, RIG.waistY],
            [-20, 14],
            [20, 14],
            [22, RIG.waistY],
            [27, RIG.chestY],
            [29, RIG.shoulderY + 17],
            [24, -84],
            [9, RIG.neckBot],
          ],
          '#241c17',
          O,
          1.3,
        );
        let i = 0;
        for (let y = -80; y < 12; y += 10, i++) {
          const w = y < RIG.chestY ? 27 : y < RIG.waistY ? 28 : 23;
          rr(-w, y, w * 2, 7.5, 2.4, shade(c, i % 2 ? 2 : -8), O);
          ctx.fillStyle = 'rgba(0,0,0,.22)';
          ctx.fillRect(-w, y + 6.2, w * 2, 1.3);
        }
        [-11, 11].forEach(x => {
          rr(x - 3.4, -84, 6.8, 98, 2, dk, O);
          const t = [];
          for (let y = -72; y < 8; y += 20) t.push([x, y]);
          studs(t, '#8a6820', 1.9);
        });
        [-1, 1].forEach(s => {
          rr(20 * s - 5, RIG.shoulderY - 2, 10, 9, 2, '#8a6820', '#5f4712');
          ell(20 * s, RIG.shoulderY + 2.5, 2, 2, '#d9b856');
        });
      },
      pauldron(s, b) {
        const c = b.armor;
        for (let k = 0; k < 3; k++) rr(s < 0 ? -12 : 1, -6 + k * 7, 11, 5.5, 2, shade(c, -4 - k * 6), O);
      },
      helmet(dir, b) {
        const c = b.armor,
          top = RIG.headTop,
          cy = RIG.headCy,
          w = 16;
        // casquete de cuero con tiras verticales
        if (dir === 'down') {
          poly(
            [
              [-w, cy + 2],
              [-w, top + 4],
              [-9, top - 3],
              [9, top - 3],
              [w, top + 4],
              [w, cy + 2],
              [10, cy - 3],
              [-10, cy - 3],
            ],
            shade(c, -10),
            O,
            1.4,
          );
          [-11, -4, 3, 10].forEach(x =>
            rr(x - 2.4, top - 2, 4.8, cy + 2 - (top - 2), 2, shade(c, x % 2 ? 2 : -4), O),
          );
          seg(-w, cy - 1, w, cy - 1, 1.6, shade(c, 14));
        } else if (dir === 'up') {
          poly(
            [
              [-w, cy + 6],
              [-w, top + 4],
              [-9, top - 3],
              [9, top - 3],
              [w, top + 4],
              [w, cy + 6],
              [0, cy + 10],
            ],
            shade(c, -10),
            O,
            1.4,
          );
          [-11, -4, 3, 10].forEach(x =>
            rr(x - 2.4, top - 2, 4.8, cy + 5 - (top - 2), 2, shade(c, x % 2 ? 2 : -4), O),
          );
        } else {
          poly(
            [
              [-w - 1, cy + 2],
              [-w, top + 3],
              [-6, top - 4],
              [9, top],
              [w - 2, cy - 1],
              [9, cy - 4],
              [-11, cy - 4],
            ],
            shade(c, -10),
            O,
            1.4,
          );
          [-11, -4, 3].forEach(x => rr(x - 2.4, top, 4.8, cy - 1 - top, 2, shade(c, x % 2 ? 2 : -4), O));
        }
      },
      neck(b) {
        const c = b.armor;
        for (let k = 0; k < 2; k++)
          rr(-12 + k, RIG.neckTop + 2 + k * 6, 24 - k * 2, 5, 2, shade(c, -4 - k * 8), O);
      },
      armPlate(sh, el, hd, f, b) {
        const c = b.armor;
        ctx.save();
        ctx.lineCap = 'butt';
        ctx.strokeStyle = '#241c17';
        ctx.lineWidth = 12;
        ctx.beginPath();
        ctx.moveTo(sh.x, sh.y + 3);
        ctx.lineTo(el.x, el.y - 3);
        ctx.stroke();
        ctx.strokeStyle = '#241c17';
        ctx.lineWidth = 9.5;
        ctx.beginPath();
        ctx.moveTo(el.x, el.y + 3);
        ctx.lineTo(hd.x, hd.y - 4);
        ctx.stroke();
        // tiras: bandas gruesas separadas sobre la base oscura
        ctx.lineWidth = 5;
        for (let i = 1; i <= 4; i++) {
          const t = i / 5;
          ctx.strokeStyle = shade(c, i % 2 ? 0 : -10);
          const x = sh.x + (el.x - sh.x) * t,
            y = sh.y + (el.y - sh.y) * t;
          ctx.beginPath();
          ctx.moveTo(x - 5, y);
          ctx.lineTo(x + 5, y);
          ctx.stroke();
        }
        ctx.lineWidth = 4.2;
        for (let i = 1; i <= 3; i++) {
          const t = i / 4;
          ctx.strokeStyle = shade(c, i % 2 ? -4 : -14);
          const x = el.x + (hd.x - el.x) * t,
            y = el.y + (hd.y - el.y) * t;
          ctx.beginPath();
          ctx.moveTo(x - 4.4, y);
          ctx.lineTo(x + 4.4, y);
          ctx.stroke();
        }
        ctx.restore();
        ctx.fillStyle = shade(c, -18);
        ctx.strokeStyle = O;
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.arc(el.x, el.y, 5.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      },
      glove(hd, f, b) {
        const c = b.armor;
        ell(hd.x, hd.y, 5.4, 5.4, shade(c, -20));
        seg(hd.x - 4.4, hd.y - 2, hd.x + 4.4, hd.y - 2, 2, shade(c, 0));
        seg(hd.x - 4.4, hd.y + 2, hd.x + 4.4, hd.y + 2, 2, shade(c, -10));
      },
      legPlate(hip, knee, foot, f, b) {
        const c = b.armor;
        ctx.save();
        ctx.lineCap = 'butt';
        ctx.strokeStyle = '#241c17';
        ctx.lineWidth = 12;
        ctx.beginPath();
        ctx.moveTo(hip.x, hip.y + 2);
        ctx.lineTo(knee.x, knee.y - 5);
        ctx.stroke();
        ctx.strokeStyle = '#241c17';
        ctx.lineWidth = 9.5;
        ctx.beginPath();
        ctx.moveTo(knee.x, knee.y + 5);
        ctx.lineTo(foot.x, foot.y - 4);
        ctx.stroke();
        ctx.lineWidth = 5.4;
        for (let i = 1; i <= 5; i++) {
          const t = i / 6;
          ctx.strokeStyle = shade(c, i % 2 ? 0 : -10);
          const x = hip.x + (knee.x - hip.x) * t,
            y = hip.y + (knee.y - hip.y) * t;
          ctx.beginPath();
          ctx.moveTo(x - 5.6, y);
          ctx.lineTo(x + 5.6, y);
          ctx.stroke();
        }
        ctx.restore();
        ctx.fillStyle = shade(c, -16);
        ctx.strokeStyle = O;
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.arc(knee.x, knee.y, 6.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      },
      boot(knee, foot, b) {
        const c = b.armor;
        ctx.save();
        ctx.strokeStyle = shade(c, -24);
        ctx.lineWidth = 10;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(foot.x - (foot.x - knee.x) * 0.3, foot.y - 13);
        ctx.lineTo(foot.x, foot.y);
        ctx.stroke();
        ctx.restore();
        [0, 5, 10].forEach(d =>
          seg(foot.x - 5, foot.y - d - 2, foot.x + 5, foot.y - d - 2, 1.5, shade(c, d ? -6 : 6)),
        );
      },
      sole: b => shade(b.armor, -28),
    },

    /* ─────────────── CUERO 3 · Cuero tachonado ─────────────── */
    tachonado: {
      nombre: 'Cuero tachonado',
      familia: 'cuero',
      limb: (b, f) => shade(b.armor, f ? 0 : -16),
      hand: b => shade(b.armor, -18),
      metal: '#9aa0a6',
      torso(b) {
        const c = b.armor,
          dk = shade(c, -26),
          m = this.metal;
        poly(
          [
            [-9, RIG.neckBot],
            [-25, -84],
            [-30, RIG.shoulderY + 17],
            [-28, RIG.chestY],
            [-23, RIG.waistY],
            [-21, 18],
            [21, 18],
            [23, RIG.waistY],
            [28, RIG.chestY],
            [30, RIG.shoulderY + 17],
            [25, -84],
            [9, RIG.neckBot],
          ],
          c,
          O,
          1.5,
        );
        const t = [];
        for (let y = -76, f = 0; y < 14; y += 10, f++)
          for (let x = -19 + (f % 2 ? 5 : 0); x <= 19; x += 10) t.push([x, y]);
        studs(t, m, 2.1);
        ctx.fillStyle = 'rgba(255,255,255,.28)';
        t.forEach(([x, y]) => {
          ctx.beginPath();
          ctx.arc(x - 0.7, y - 0.7, 0.9, 0, Math.PI * 2);
          ctx.fill();
        });
        poly(
          [
            [-28, -78],
            [-20, -86],
            [24, -6],
            [16, 2],
          ],
          shade(c, -14),
          O,
          1.4,
        );
        studs(
          [
            [-22, -76],
            [-12, -58],
            [-2, -40],
            [8, -22],
            [18, -4],
          ],
          m,
          1.9,
        );
        rr(-23, RIG.waistY + 8, 46, 11, 2, dk, O);
        rr(-8, RIG.waistY + 6, 16, 15, 3, '#8a6820', '#5f4712');
        ell(0, RIG.waistY + 13.5, 3.4, 3.4, '#d9b856');
      },
      pauldron(s, b) {
        const c = b.armor;
        poly(
          [
            [-10 * s, -9],
            [14 * s, -1],
            [12 * s, 12],
            [-11 * s, 5],
          ],
          shade(c, -8),
          O,
          1.3,
        );
        studs(
          [
            [4 * s, -2],
            [4 * s, 6],
          ],
          this.metal,
          1.9,
        );
      },
      helmet(dir, b) {
        const c = b.armor,
          top = RIG.headTop,
          cy = RIG.headCy,
          w = 16.5,
          m = this.metal;
        if (dir === 'down') {
          poly(
            [
              [-w, cy + 2],
              [-w, top + 3],
              [-9, top - 4],
              [9, top - 4],
              [w, top + 3],
              [w, cy + 2],
              [10, cy - 3],
              [-10, cy - 3],
            ],
            c,
            O,
            1.5,
          );
          studs(
            [
              [-10, top + 4],
              [0, top + 1],
              [10, top + 4],
              [-12, cy - 8],
              [0, cy - 10],
              [12, cy - 8],
            ],
            m,
            1.8,
          );
          seg(-w, cy - 1, w, cy - 1, 1.8, shade(c, -24));
        } else if (dir === 'up') {
          poly(
            [
              [-w, cy + 6],
              [-w, top + 3],
              [-9, top - 4],
              [9, top - 4],
              [w, top + 3],
              [w, cy + 6],
              [0, cy + 10],
            ],
            c,
            O,
            1.5,
          );
          studs(
            [
              [-10, top + 4],
              [0, top + 1],
              [10, top + 4],
              [-10, cy - 2],
              [10, cy - 2],
            ],
            m,
            1.8,
          );
        } else {
          poly(
            [
              [-w - 1, cy + 2],
              [-w, top + 2],
              [-6, top - 5],
              [9, top - 1],
              [w - 2, cy - 1],
              [9, cy - 4],
              [-11, cy - 4],
            ],
            c,
            O,
            1.5,
          );
          studs(
            [
              [-9, top + 3],
              [2, top + 1],
              [-12, cy - 7],
              [6, cy - 6],
            ],
            m,
            1.8,
          );
        }
      },
      neck(b) {
        const c = b.armor;
        poly(
          [
            [-13, RIG.neckBot + 2],
            [-11, RIG.neckTop + 2],
            [11, RIG.neckTop + 2],
            [13, RIG.neckBot + 2],
            [9, RIG.neckBot + 6],
            [-9, RIG.neckBot + 6],
          ],
          shade(c, -8),
          O,
          1.4,
        );
        studs(
          [
            [-7, RIG.neckBot - 1],
            [0, RIG.neckBot - 2],
            [7, RIG.neckBot - 1],
          ],
          this.metal,
          1.7,
        );
      },
      armPlate(sh, el, hd, f, b) {
        const c = b.armor;
        ctx.save();
        ctx.lineCap = 'round';
        ctx.strokeStyle = shade(c, f ? -2 : -18);
        ctx.lineWidth = 12;
        ctx.beginPath();
        ctx.moveTo(sh.x, sh.y + 2);
        ctx.lineTo(el.x, el.y);
        ctx.stroke();
        ctx.strokeStyle = shade(c, f ? -8 : -22);
        ctx.lineWidth = 9.5;
        ctx.beginPath();
        ctx.moveTo(el.x, el.y);
        ctx.lineTo(hd.x, hd.y - 3);
        ctx.stroke();
        ctx.restore();
        tachasHueso(sh, el, 4, this.metal, 1.8);
        tachasHueso(el, hd, 3, this.metal, 1.6);
        ctx.fillStyle = shade(c, -20);
        ctx.strokeStyle = O;
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.arc(el.x, el.y, 5.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        studs([[el.x, el.y]], this.metal, 1.7);
      },
      glove(hd, f, b) {
        ell(hd.x, hd.y, 5.6, 5.6, shade(b.armor, -18));
        studs(
          [
            [hd.x - 1.8, hd.y - 1.4],
            [hd.x + 1.8, hd.y - 1.4],
            [hd.x, hd.y + 1.8],
          ],
          this.metal,
          1.3,
        );
      },
      legPlate(hip, knee, foot, f, b) {
        const c = b.armor;
        ctx.save();
        ctx.lineCap = 'round';
        ctx.strokeStyle = shade(c, f ? -4 : -20);
        ctx.lineWidth = 12;
        ctx.beginPath();
        ctx.moveTo(hip.x, hip.y + 2);
        ctx.lineTo(knee.x, knee.y);
        ctx.stroke();
        ctx.strokeStyle = shade(c, -14);
        ctx.lineWidth = 9.5;
        ctx.beginPath();
        ctx.moveTo(knee.x, knee.y);
        ctx.lineTo(foot.x, foot.y - 4);
        ctx.stroke();
        ctx.restore();
        tachasHueso(hip, knee, 4, this.metal, 1.8);
        ctx.fillStyle = shade(c, -18);
        ctx.strokeStyle = O;
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.arc(knee.x, knee.y, 6.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        studs([[knee.x, knee.y]], this.metal, 1.8);
      },
      boot(knee, foot, b) {
        const c = b.armor;
        ctx.save();
        ctx.strokeStyle = shade(c, -22);
        ctx.lineWidth = 10.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(foot.x - (foot.x - knee.x) * 0.3, foot.y - 13);
        ctx.lineTo(foot.x, foot.y);
        ctx.stroke();
        ctx.restore();
        studs(
          [
            [foot.x - 3, foot.y - 9],
            [foot.x + 3, foot.y - 9],
            [foot.x, foot.y - 4],
          ],
          this.metal,
          1.4,
        );
      },
      sole: b => shade(b.armor, -26),
    },
  };

  /* ─────────────── TÚNICAS ─────────────── */
  const TUNICS = {
    maestre: {
      nombre: 'Túnica de maestre',
      draw(b, dir) {
        const c = b.tunic,
          dk = shade(c, -28),
          sw = P.capeSway * 0.4 + P.legPhase * 2.0;
        poly(
          [
            [-24, -84],
            [-30, RIG.shoulderY + 18],
            [-28, RIG.waistY],
            [-30, 20],
            [-34, 104 + sw],
            [34, 104 + sw],
            [30, 20],
            [28, RIG.waistY],
            [30, RIG.shoulderY + 18],
            [24, -84],
            [8, RIG.neckBot],
            [0, -74],
            [-8, RIG.neckBot],
          ],
          c,
          dk,
          1.5,
        );
        seg(-8, RIG.neckBot, 0, -74, 1.6, dk);
        seg(0, -74, 8, RIG.neckBot, 1.6, dk);
        ctx.strokeStyle = dk;
        ctx.lineWidth = 1.2;
        [-18, -6, 6, 18].forEach(x => {
          ctx.beginPath();
          ctx.moveTo(x * 0.8, RIG.waistY + 14);
          ctx.quadraticCurveTo(x, 60, x * 1.25, 102 + sw);
          ctx.stroke();
        });
        [-1, 1].forEach(s =>
          poly(
            [
              [26 * s, RIG.shoulderY + 2],
              [38 * s, RIG.shoulderY + 16],
              [40 * s, RIG.elbowY + 16],
              [26 * s, RIG.elbowY + 10],
              [24 * s, RIG.chestY],
            ],
            shade(c, -6),
            dk,
            1.3,
          ),
        );
        ctx.strokeStyle = '#8a7040';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-26, RIG.waistY + 10);
        ctx.quadraticCurveTo(0, RIG.waistY + 17, 26, RIG.waistY + 10);
        ctx.stroke();
        seg(-4, RIG.waistY + 15, -7, RIG.waistY + 34, 2.4, '#8a7040');
        seg(4, RIG.waistY + 15, 7, RIG.waistY + 32, 2.4, '#8a7040');
        if (dir !== 'up') {
          ctx.fillStyle = '#b8a05a';
          ctx.strokeStyle = '#6d5a2a';
          ctx.lineWidth = 1;
          for (let k = -4; k <= 4; k++) {
            ctx.beginPath();
            ctx.arc(k * 4.6, RIG.neckBot + 3 + Math.abs(k) * 1.5, 2.4, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          }
        }
      },
    },
    sobreveste: {
      nombre: 'Sobreveste heráldica',
      draw(b, dir) {
        const c = b.tunic,
          dk = shade(c, -30),
          hi = shade(c, 20),
          franja = shade(c, 34),
          sw = P.capeSway * 0.5 + P.legPhase * 2.5;
        poly(
          [
            [-25, -84],
            [-31, RIG.shoulderY + 18],
            [-28, RIG.waistY],
            [-27, 14],
            [-30, 86 + sw],
            [-6, 90 + sw],
            [-3, 26],
            [3, 26],
            [6, 90 + sw],
            [30, 86 + sw],
            [27, 14],
            [28, RIG.waistY],
            [31, RIG.shoulderY + 18],
            [25, -84],
            [8, RIG.neckBot],
            [0, -76],
            [-8, RIG.neckBot],
          ],
          c,
          dk,
          1.5,
        );
        poly(
          [
            [-9, -80],
            [9, -80],
            [9, 22],
            [-9, 22],
          ],
          franja,
          dk,
          1.2,
        );
        poly(
          [
            [0, -58],
            [7, -46],
            [0, -34],
            [-7, -46],
          ],
          shade(c, -46),
          hi,
          1.3,
        );
        [-1, 1].forEach(s =>
          poly(
            [
              [20 * s, RIG.shoulderY - 2],
              [32 * s, RIG.shoulderY + 6],
              [30 * s, RIG.chestY + 6],
              [22 * s, RIG.chestY],
            ],
            shade(c, -10),
            dk,
            1.3,
          ),
        );
        for (let x = -24; x < 24; x += 8) rr(x, RIG.waistY + 7, 7, 10, 1.5, '#7a6636', '#4e3f1c');
        rr(-7, RIG.waistY + 5, 14, 14, 2, '#8a6820', '#5f4712');
        ell(0, RIG.waistY + 12, 3, 3, '#d9b856');
        ctx.strokeStyle = hi;
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(-28, 74 + sw);
        ctx.lineTo(-8, 86 + sw);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(28, 74 + sw);
        ctx.lineTo(8, 86 + sw);
        ctx.stroke();
      },
    },
    cruzada: {
      nombre: 'Túnica cruzada',
      draw(b, dir) {
        const c = b.tunic,
          dk = shade(c, -30),
          hi = shade(c, 18),
          sw = P.capeSway * 0.4 + P.legPhase * 2.0;
        poly(
          [
            [-24, -84],
            [-29, RIG.shoulderY + 18],
            [-27, RIG.waistY],
            [-26, 12],
            [-28, 66 + sw],
            [28, 66 + sw],
            [26, 12],
            [27, RIG.waistY],
            [29, RIG.shoulderY + 18],
            [24, -84],
            [0, RIG.neckBot],
          ],
          shade(c, -14),
          dk,
          1.4,
        );
        poly(
          [
            [24, -84],
            [29, RIG.shoulderY + 18],
            [27, RIG.waistY],
            [26, 12],
            [28, 64 + sw],
            [-10, 60 + sw],
            [-16, RIG.waistY],
            [-6, -72],
            [6, RIG.neckBot - 2],
          ],
          c,
          dk,
          1.5,
        );
        ctx.strokeStyle = hi;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(6, RIG.neckBot - 2);
        ctx.lineTo(-6, -72);
        ctx.lineTo(-16, RIG.waistY);
        ctx.lineTo(-10, 60 + sw);
        ctx.stroke();
        ctx.fillStyle = shade(c, -44);
        ctx.beginPath();
        ctx.moveTo(-26, RIG.waistY + 4);
        ctx.quadraticCurveTo(0, RIG.waistY + 13, 26, RIG.waistY + 2);
        ctx.lineTo(26, RIG.waistY + 13);
        ctx.quadraticCurveTo(0, RIG.waistY + 24, -26, RIG.waistY + 15);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,.35)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ell(20, RIG.waistY + 13, 5.5, 5, shade(c, -52));
        poly(
          [
            [22, RIG.waistY + 16],
            [30, RIG.waistY + 48 + sw],
            [24, RIG.waistY + 50 + sw],
            [18, RIG.waistY + 18],
          ],
          shade(c, -48),
          dk,
          1.1,
        );
        [-1, 1].forEach(s =>
          poly(
            [
              [25 * s, RIG.shoulderY + 2],
              [34 * s, RIG.shoulderY + 12],
              [32 * s, RIG.elbowY - 4],
              [23 * s, RIG.chestY + 4],
            ],
            shade(c, -8),
            dk,
            1.3,
          ),
        );
      },
    },
  };

  /* ─────────────── CAPAS ─────────────── */
  const CAPES = {
    invierno: {
      nombre: 'Capa de invierno',
      draw(b, dir) {
        const c = dir === 'up' ? shade(b.cape, 10) : b.cape,
          dk = shade(b.cape, -32);
        const sway = P.capeSway,
          lift = P.capeLift;
        const top = RIG.shoulderY + 2,
          hem = (dir === 'up' ? 104 : 126) - lift * 16;
        ctx.fillStyle = c;
        ctx.strokeStyle = dk;
        ctx.lineWidth = 1.7;
        ctx.beginPath();
        ctx.moveTo(-27, top);
        ctx.lineTo(-40 - lift * 4, top + 18);
        ctx.quadraticCurveTo(-48 - lift * 10, 24 + sway, -40 - lift * 8, hem - 46 + sway);
        ctx.quadraticCurveTo(-32, hem - 14, -16 + sway * 0.3, hem + sway * 1.3);
        ctx.quadraticCurveTo(0, hem - 8, 16 + sway * 0.3, hem + sway * 1.3);
        ctx.quadraticCurveTo(32, hem - 14, 40 + lift * 8, hem - 46 + sway);
        ctx.quadraticCurveTo(48 + lift * 10, 24 + sway, 40 + lift * 4, top + 18);
        ctx.lineTo(27, top);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = 'rgba(0,0,0,.26)';
        ctx.lineWidth = 1.6;
        [-20, -7, 7, 20].forEach(x => {
          ctx.beginPath();
          ctx.moveTo(x * 0.75, top + 20);
          ctx.quadraticCurveTo(x * 1.1, hem - 56, x * 1.5 + sway * 0.4, hem - 10 + sway);
          ctx.stroke();
        });
      },
      collar(b, dir) {
        const col = b.cape,
          dk = shade(col, -30),
          y = RIG.shoulderY + 2;
        // cuello de piel: bultos irregulares
        for (let x = -26; x <= 26; x += 6.5)
          ell(x, y + 2 + Math.sin(x * 0.6) * 1.4, 5, 4.4, shade(col, x % 13 ? 30 : 20));
        poly(
          [
            [-26, y + 2],
            [-11, y - 5],
            [11, y - 5],
            [26, y + 2],
            [22, y + 9],
            [0, y + 3],
            [-22, y + 9],
          ],
          'rgba(0,0,0,0)',
          dk,
          1.3,
        );
        if (dir !== 'up') {
          ctx.fillStyle = '#c9a84c';
          ctx.strokeStyle = '#7a5a18';
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.arc(0, y + 6, 4.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
      },
    },
    corte: {
      nombre: 'Manto de corte',
      draw(b, dir) {
        const c = b.cape,
          dk = shade(c, -34);
        const sway = P.capeSway,
          lift = P.capeLift;
        const top = RIG.shoulderY + 2,
          hem = 132 - lift * 14;
        ctx.fillStyle = c;
        ctx.strokeStyle = dk;
        ctx.lineWidth = 1.7;
        ctx.beginPath();
        ctx.moveTo(26, top - 4);
        ctx.quadraticCurveTo(46 + lift * 8, top + 30, 44 + sway * 0.4, hem - 52 + sway);
        ctx.quadraticCurveTo(38, hem - 16, 18 + sway, hem + sway);
        ctx.quadraticCurveTo(-4, hem - 12, -24 + sway * 0.6, hem - 38 + sway);
        ctx.quadraticCurveTo(-34 - lift * 6, hem - 72, -22, top + 22);
        ctx.lineTo(-6, top + 4);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = 'rgba(0,0,0,.24)';
        ctx.lineWidth = 1.3;
        [
          [18, top + 18],
          [6, top + 26],
          [-6, top + 34],
        ].forEach(([x, y]) => {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.quadraticCurveTo(x + 16, hem - 60, x + 22 + sway * 0.4, hem - 16 + sway);
          ctx.stroke();
        });
        ctx.strokeStyle = shade(c, 40);
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.moveTo(-6, top + 4);
        ctx.quadraticCurveTo(-22, top + 40, -24 + sway * 0.6, hem - 38 + sway);
        ctx.stroke();
      },
      collar(b, dir) {
        const col = b.cape,
          y = RIG.shoulderY + 2;
        // solo el hombro derecho: broche grande
        poly(
          [
            [6, y - 2],
            [26, y - 4],
            [28, y + 8],
            [8, y + 7],
          ],
          shade(col, 24),
          shade(col, -30),
          1.3,
        );
        ctx.fillStyle = '#c9a84c';
        ctx.strokeStyle = '#7a5a18';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(20, y + 3, 5.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#f0d878';
        ctx.beginPath();
        ctx.arc(18.5, y + 1.5, 2.1, 0, Math.PI * 2);
        ctx.fill();
      },
    },
    capucha: {
      nombre: 'Capa con capucha',
      draw(b, dir) {
        const c = b.cape,
          dk = shade(c, -32);
        const sway = P.capeSway,
          lift = P.capeLift;
        const top = RIG.shoulderY + 2,
          hem = 92 - lift * 12;
        ctx.fillStyle = c;
        ctx.strokeStyle = dk;
        ctx.lineWidth = 1.7;
        ctx.beginPath();
        ctx.moveTo(-25, top);
        ctx.lineTo(-34 - lift * 3, top + 16);
        ctx.quadraticCurveTo(-40 - lift * 8, 26 + sway, -33, hem - 32 + sway);
        ctx.quadraticCurveTo(-24, hem - 8, -12 + sway * 0.3, hem + sway);
        ctx.quadraticCurveTo(0, hem - 6, 12 + sway * 0.3, hem + sway);
        ctx.quadraticCurveTo(24, hem - 8, 33, hem - 32 + sway);
        ctx.quadraticCurveTo(40 + lift * 8, 26 + sway, 34 + lift * 3, top + 16);
        ctx.lineTo(25, top);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = 'rgba(0,0,0,.22)';
        ctx.lineWidth = 1.2;
        [-14, 0, 14].forEach(x => {
          ctx.beginPath();
          ctx.moveTo(x * 0.8, top + 18);
          ctx.quadraticCurveTo(x, hem - 44, x * 1.3 + sway * 0.3, hem - 8 + sway);
          ctx.stroke();
        });
      },
      collar(b, dir) {
        const col = b.cape,
          dk = shade(col, -30),
          y = RIG.shoulderY + 2;
        poly(
          [
            [-24, y + 2],
            [-10, y - 4],
            [10, y - 4],
            [24, y + 2],
            [20, y + 9],
            [0, y + 4],
            [-20, y + 9],
          ],
          shade(col, 18),
          dk,
          1.3,
        );
      },
      /* La capucha se dibuja DESPUÉS de la cabeza. */
      hood(b, dir) {
        const c = b.cape,
          dk = shade(c, -34),
          hi = shade(c, 14);
        const top = RIG.headTop,
          cy = RIG.headCy;
        if (dir === 'up') {
          poly(
            [
              [-22, RIG.neckBot + 4],
              [-24, cy + 4],
              [-16, top - 6],
              [0, top - 12],
              [16, top - 6],
              [24, cy + 4],
              [22, RIG.neckBot + 4],
              [0, RIG.neckBot + 8],
            ],
            c,
            dk,
            1.6,
          );
          ctx.strokeStyle = dk;
          ctx.lineWidth = 1.3;
          ctx.beginPath();
          ctx.moveTo(0, top - 10);
          ctx.lineTo(0, RIG.neckBot + 6);
          ctx.stroke();
          return;
        }
        const w = dir === 'down' ? 21 : 20;
        poly(
          [
            [-w, RIG.neckBot + 4],
            [-w - 2, cy + 4],
            [-16, top - 4],
            [0, top - 10],
            [16, top - 4],
            [w + 2, cy + 4],
            [w, RIG.neckBot + 4],
            [13, RIG.neckBot - 2],
            [0, RIG.neckBot + 2],
            [-13, RIG.neckBot - 2],
          ],
          c,
          dk,
          1.6,
        );
        poly(
          [
            [-13, RIG.neckBot - 2],
            [-15, cy - 2],
            [0, cy - 14],
            [15, cy - 2],
            [13, RIG.neckBot - 2],
            [0, RIG.neckBot + 2],
          ],
          'rgba(6,6,9,.82)',
        );
        if (dir === 'down') {
          ell(-6, cy - 1, 1.9, 1.6, '#c8b89a');
          ell(6, cy - 1, 1.9, 1.6, '#c8b89a');
        } else {
          ell(2, cy - 1, 1.9, 1.6, '#c8b89a');
        }
        seg(-w + 1, RIG.neckBot + 3, w - 1, RIG.neckBot + 3, 2.2, hi);
        ctx.strokeStyle = '#8a7040';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-12, RIG.neckBot + 6);
        ctx.quadraticCurveTo(0, RIG.neckBot + 12, 12, RIG.neckBot + 6);
        ctx.stroke();
      },
    },
  };

  const SET = () => SETS[state.armorSet] || SETS.placas;
  const TUN = () => TUNICS[state.tunicSet] || TUNICS.maestre;
  const CAP = () => CAPES[state.capeSet] || CAPES.invierno;

  /* ── Piezas comunes, con estilo por familia ── */
  function cuero(x1, y1, x2, y2, w, c) {
    seg(x1, y1, x2, y2, w, c, 'butt');
  }
  function cordel(y0, y1, c, paso = 3.4) {
    ctx.strokeStyle = c;
    ctx.lineWidth = 1.5;
    for (let y = y0; y < y1; y += paso) {
      ctx.beginPath();
      ctx.moveTo(-3.4, y);
      ctx.lineTo(3.4, y + 1.6);
      ctx.stroke();
    }
  }
  function estrias(y0, y1, c, paso = 4) {
    ctx.strokeStyle = c;
    ctx.lineWidth = 1.8;
    for (let y = y0; y < y1; y += paso) {
      ctx.beginPath();
      ctx.moveTo(-3.2, y);
      ctx.lineTo(3.2, y);
      ctx.stroke();
    }
  }
  /* Ondas del acero valyrio: una linea sinuosa a lo largo de la hoja. */
  function ondas(largo, ancho, c) {
    ctx.strokeStyle = c;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (let i = 0; i <= 10; i++) {
      const t = i / 10,
        y = -largo * t,
        x = Math.sin(t * 7.2) * ancho * 0.34;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke();
  }
  /* Mellas del acero de los Fosos: muescas en un borde. */
  function mellas(largo, ancho, c, n = 4) {
    ctx.fillStyle = c;
    for (let i = 0; i < n; i++) {
      const y = -largo * (0.28 + i * 0.16);
      ctx.beginPath();
      ctx.moveTo(ancho / 2, y);
      ctx.lineTo(ancho / 2 + 2.6, y - 2.2);
      ctx.lineTo(ancho / 2, y - 4.4);
      ctx.closePath();
      ctx.fill();
    }
  }

  const ARMAS = {
    /* ─────────────────────────────────────────────────────────────
   FORJA DEL NORTE — acero funcional, sin adorno. Hoja ancha,
   guarda recta, pomo de disco, empuñadura de cuero.
   ───────────────────────────────────────────────────────────── */
    norte: {
      nombre: 'Forja del Norte',
      sword() {
        seg(0, 10, 0, -118, 7.5, shade(state.weaponColor, 0));
        seg(0, -14, 0, -106, 2.4, shade(state.weaponColor, -41));
        poly(
          [
            [0, -130],
            [-4, -114],
            [4, -114],
          ],
          shade(state.weaponColor, 34),
        );
        seg(-16, -11, 16, -11, 7.5, '#93794a');
        seg(-14, -13, 14, -13, 3, '#c0a566');
        cuero(0, -8, 0, 9, 6, '#48301a');
        estrias(-6, 9, '#331f10');
        ell(0, 12, 5.6, 5, '#8b7040');
        ell(0, 12, 2.6, 2.3, '#c2a45e');
      },
      greatSword() {
        seg(0, 14, 0, -150, 9, shade(state.weaponColor, 0));
        seg(0, -18, 0, -136, 3, shade(state.weaponColor, -41));
        poly(
          [
            [0, -166],
            [-5, -146],
            [5, -146],
          ],
          shade(state.weaponColor, 34),
        );
        seg(-22, -15, 22, -15, 8.5, '#93794a');
        seg(-19, -18, 19, -18, 3.2, '#c0a566');
        cuero(0, -12, 0, 13, 6.5, '#48301a');
        estrias(-10, 13, '#331f10');
        ell(0, 17, 6.2, 5.6, '#8b7040');
        ell(0, 17, 2.8, 2.5, '#c2a45e');
      },
      dagger() {
        seg(0, 7, 0, -32, 5, shade(state.weaponColor, 7));
        poly(
          [
            [0, -42],
            [-3.4, -30],
            [3.4, -30],
          ],
          shade(state.weaponColor, 34),
        );
        seg(-8, -6, 8, -6, 5, '#93794a');
        cuero(0, -4, 0, 7, 4.4, '#48301a');
        ell(0, 9, 4, 3.6, '#8b7040');
      },
      mace() {
        seg(0, 12, 0, -86, 7, '#4c331c');
        estrias(-4, 10, '#331f10');
        ell(0, -98, 13, 16, shade(state.weaponColor, -84));
        for (let i = 0; i < 6; i++) {
          const a = (i * Math.PI) / 3;
          seg(
            Math.cos(a) * 8,
            -98 + Math.sin(a) * 10,
            Math.cos(a) * 16,
            -98 + Math.sin(a) * 18,
            4,
            shade(state.weaponColor, -51),
          );
        }
        ell(0, 14, 5, 4.6, '#8b7040');
      },
      greatMace() {
        seg(0, 16, 0, -124, 9, '#4c331c');
        estrias(-6, 14, '#331f10');
        ell(0, -140, 17, 21, shade(state.weaponColor, -84));
        for (let i = 0; i < 6; i++) {
          const a = (i * Math.PI) / 3;
          seg(
            Math.cos(a) * 11,
            -140 + Math.sin(a) * 14,
            Math.cos(a) * 21,
            -140 + Math.sin(a) * 24,
            5,
            shade(state.weaponColor, -51),
          );
        }
        ell(0, 18, 5.8, 5.2, '#8b7040');
      },
      axe() {
        seg(0, 12, 0, -92, 7, '#4c331c');
        estrias(-4, 10, '#331f10');
        poly(
          [
            [0, -84],
            [26, -96],
            [32, -122],
            [13, -114],
            [0, -126],
          ],
          shade(state.weaponColor, -29),
          shade(state.weaponColor, -104),
          1.8,
        );
        ell(0, 14, 5, 4.6, '#8b7040');
      },
      greatAxe() {
        seg(0, 16, 0, -132, 9, '#4c331c');
        estrias(-6, 14, '#331f10');
        poly(
          [
            [0, -122],
            [36, -138],
            [42, -168],
            [17, -158],
            [0, -172],
          ],
          shade(state.weaponColor, -29),
          shade(state.weaponColor, -104),
          2,
        );
        poly(
          [
            [0, -122],
            [-36, -138],
            [-42, -168],
            [-17, -158],
            [0, -172],
          ],
          shade(state.weaponColor, -41),
          shade(state.weaponColor, -104),
          2,
        );
        ell(0, 18, 5.8, 5.2, '#8b7040');
      },
      spear() {
        seg(0, 16, 0, -128, 6, '#7a5730');
        poly(
          [
            [0, -150],
            [9, -126],
            [0, -112],
            [-9, -126],
          ],
          shade(state.weaponColor, 10),
          shade(state.weaponColor, -83),
          1.6,
        );
        seg(-7, -118, 7, -118, 2.4, '#93794a');
        ell(0, 18, 4.2, 4, '#4c331c');
      },
      greatSpear() {
        seg(0, 24, 0, -168, 8.5, '#6d4d2a');
        seg(0, 16, 0, -158, 3.6, '#9a7040');
        poly(
          [
            [0, -200],
            [13, -166],
            [0, -146],
            [-13, -166],
          ],
          shade(state.weaponColor, 21),
          shade(state.weaponColor, -95),
          1.9,
        );
        ell(0, 27, 5.4, 5, '#4c331c');
      },
      bow() {
        ctx.strokeStyle = '#7a5730';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(0, -58);
        ctx.quadraticCurveTo(23, -30, 0, 0);
        ctx.quadraticCurveTo(23, 30, 0, 58);
        ctx.stroke();
        ctx.strokeStyle = '#cfcabe';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -58);
        ctx.lineTo(0, 58);
        ctx.stroke();
        rr(-5, -8, 10, 16, 4, '#48301a');
      },
      staff() {
        seg(0, 14, 0, -124, 8, '#6b4a2c');
        ctx.strokeStyle = '#54381f';
        ctx.lineWidth = 1.6;
        for (let g = -110; g < 8; g += 22) {
          ctx.beginPath();
          ctx.moveTo(-4, g);
          ctx.lineTo(4, g + 4);
          ctx.stroke();
        }
        const glow = 0.35 + P.castCharge * 0.65;
        ell(0, -140, 13 + P.castCharge * 4, 13 + P.castCharge * 4, `rgba(126,102,231,${glow})`);
        ell(0, -140, 8, 8, '#8f79ef');
        ell(-3, -143, 3.4, 3, 'rgba(255,255,255,.5)');
        ell(0, 17, 5, 4.6, '#4c331c');
      },
      spellbook() {
        rr(-15, -20, 30, 40, 5, '#4e2f28', '#28150f');
        rr(-10, -14, 9, 28, 2, '#cdbd9c', '#5f4f36');
        rr(1, -14, 9, 28, 2, '#cdbd9c', '#5f4f36');
        rr(-2.5, -18, 5, 36, 2, '#6d4830');
        const g = 0.25 + P.castCharge * 0.6;
        ell(0, 0, 10 + P.castCharge * 8, 10 + P.castCharge * 8, `rgba(140,180,255,${g * 0.5})`);
      },
      /* Rodela redonda de tablas con umbo y refuerzo de hierro. */
      shield() {
        const rx = 22,
          ry = 29;
        ell(0, 0, rx, ry, '#6e6357');
        ell(0, 0, rx - 4, ry - 5, '#7c7064');
        ctx.strokeStyle = '#c6a862';
        ctx.lineWidth = 3.4;
        ctx.beginPath();
        ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = '#5a5049';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(0, -ry + 4);
        ctx.lineTo(0, ry - 4);
        ctx.stroke();
        ell(0, 0, 6, 6, '#9b8757');
        ell(-1.5, -1.5, 2.4, 2.4, '#c9b071');
      },
    },

    /* ─────────────────────────────────────────────────────────────
   ACERO DE VALYRIA — hoja angosta y larga con ondas del plegado,
   guarda curvada hacia la hoja, pomo con gema, herrajes de oro.
   ───────────────────────────────────────────────────────────── */
    valyria: {
      nombre: 'Acero de Valyria',
      sword() {
        poly(
          [
            [-3.2, -8],
            [3.2, -8],
            [2.4, -112],
            [0, -130],
            [-2.4, -112],
          ],
          shade(state.weaponColor, 13),
          shade(state.weaponColor, -47),
          1.3,
        );
        ondas(112, 7, '#7f8b95');
        ctx.strokeStyle = shade(state.weaponColor, 37);
        ctx.lineWidth = 1;
        seg(-1.6, -16, -1.6, -104, 1, shade(state.weaponColor, 37));
        poly(
          [
            [-15, -10],
            [-4, -13],
            [4, -13],
            [15, -10],
            [9, -17],
            [-9, -17],
          ],
          '#d9b856',
          '#8a6820',
          1.4,
        );
        cuero(0, -8, 0, 8, 5.4, '#3a2438');
        cordel(-6, 8, '#6d4a5e');
        ell(0, 11, 5, 4.6, '#d9b856');
        ell(0, 11, 2.4, 2.2, '#7f58d9');
      },
      greatSword() {
        poly(
          [
            [-4, -12],
            [4, -12],
            [3, -142],
            [0, -166],
            [-3, -142],
          ],
          shade(state.weaponColor, 13),
          shade(state.weaponColor, -47),
          1.4,
        );
        ondas(142, 9, '#7f8b95');
        poly(
          [
            [-21, -14],
            [-5, -18],
            [5, -18],
            [21, -14],
            [12, -22],
            [-12, -22],
          ],
          '#d9b856',
          '#8a6820',
          1.5,
        );
        cuero(0, -12, 0, 12, 6, '#3a2438');
        cordel(-10, 12, '#6d4a5e');
        ell(0, 16, 5.8, 5.2, '#d9b856');
        ell(0, 16, 2.8, 2.5, '#7f58d9');
      },
      dagger() {
        poly(
          [
            [-2.4, -6],
            [2.4, -6],
            [1.8, -30],
            [0, -44],
            [-1.8, -30],
          ],
          shade(state.weaponColor, 18),
          shade(state.weaponColor, -47),
          1.2,
        );
        ondas(30, 5, '#7f8b95');
        poly(
          [
            [-8, -5],
            [-2, -8],
            [2, -8],
            [8, -5],
            [5, -10],
            [-5, -10],
          ],
          '#d9b856',
          '#8a6820',
          1.3,
        );
        cuero(0, -4, 0, 7, 4.2, '#3a2438');
        ell(0, 9, 3.8, 3.4, '#d9b856');
        ell(0, 9, 1.8, 1.6, '#7f58d9');
      },
      mace() {
        seg(0, 12, 0, -88, 6, '#4a3a2e');
        cordel(-4, 10, '#6d4a5e');
        // cabeza de gajos, no de puas
        for (let i = 0; i < 6; i++) {
          const a = (i * Math.PI) / 3;
          poly(
            [
              [0, -92],
              [Math.cos(a) * 13, -100 + Math.sin(a) * 8],
              [0, -116],
            ],
            shade(state.weaponColor, -10),
            shade(state.weaponColor, -67),
            1.2,
          );
        }
        ell(0, -104, 7, 8, '#d9b856');
        ell(0, -104, 3, 3.4, '#7f58d9');
        ell(0, 14, 4.8, 4.4, '#d9b856');
      },
      greatMace() {
        seg(0, 16, 0, -126, 8, '#4a3a2e');
        cordel(-6, 14, '#6d4a5e');
        for (let i = 0; i < 6; i++) {
          const a = (i * Math.PI) / 3;
          poly(
            [
              [0, -130],
              [Math.cos(a) * 17, -142 + Math.sin(a) * 11],
              [0, -164],
            ],
            shade(state.weaponColor, -10),
            shade(state.weaponColor, -67),
            1.4,
          );
        }
        ell(0, -147, 9, 10, '#d9b856');
        ell(0, -147, 4, 4.4, '#7f58d9');
        ell(0, 18, 5.4, 5, '#d9b856');
      },
      axe() {
        seg(0, 12, 0, -94, 6, '#4a3a2e');
        cordel(-4, 10, '#6d4a5e');
        // filo en media luna
        ctx.fillStyle = shade(state.weaponColor, -10);
        ctx.strokeStyle = shade(state.weaponColor, -67);
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(0, -86);
        ctx.quadraticCurveTo(30, -96, 28, -124);
        ctx.quadraticCurveTo(14, -114, 0, -124);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        poly(
          [
            [-3, -88],
            [3, -88],
            [3, -122],
            [-3, -122],
          ],
          '#d9b856',
          '#8a6820',
          1.2,
        );
        ell(0, 14, 4.8, 4.4, '#d9b856');
      },
      greatAxe() {
        seg(0, 16, 0, -134, 8, '#4a3a2e');
        cordel(-6, 14, '#6d4a5e');
        ctx.fillStyle = shade(state.weaponColor, -10);
        ctx.strokeStyle = shade(state.weaponColor, -67);
        ctx.lineWidth = 1.8;
        [1, -1].forEach(s => {
          ctx.beginPath();
          ctx.moveTo(0, -124);
          ctx.quadraticCurveTo(40 * s, -138, 38 * s, -170);
          ctx.quadraticCurveTo(18 * s, -156, 0, -170);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        });
        poly(
          [
            [-3.4, -124],
            [3.4, -124],
            [3.4, -170],
            [-3.4, -170],
          ],
          '#d9b856',
          '#8a6820',
          1.3,
        );
        ell(0, 18, 5.4, 5, '#d9b856');
      },
      spear() {
        seg(0, 16, 0, -124, 5, '#5a4636');
        poly(
          [
            [0, -152],
            [7, -128],
            [0, -108],
            [-7, -128],
          ],
          shade(state.weaponColor, 18),
          shade(state.weaponColor, -47),
          1.5,
        );
        ondas(20, 5, '#7f8b95');
        // alerones bajo la punta
        poly(
          [
            [-9, -118],
            [0, -124],
            [9, -118],
            [0, -112],
          ],
          '#d9b856',
          '#8a6820',
          1.2,
        );
        ell(0, 18, 4, 3.8, '#d9b856');
      },
      greatSpear() {
        seg(0, 24, 0, -164, 7, '#5a4636');
        seg(0, 16, 0, -154, 2.8, '#d9b856');
        poly(
          [
            [0, -202],
            [11, -166],
            [0, -142],
            [-11, -166],
          ],
          shade(state.weaponColor, 27),
          shade(state.weaponColor, -67),
          1.8,
        );
        poly(
          [
            [-12, -154],
            [0, -162],
            [12, -154],
            [0, -146],
          ],
          '#d9b856',
          '#8a6820',
          1.3,
        );
        ell(0, 27, 5, 4.6, '#d9b856');
      },
      bow() {
        // recurvado: la doble curva es la marca
        ctx.strokeStyle = '#5a4636';
        ctx.lineWidth = 5.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-6, -62);
        ctx.quadraticCurveTo(20, -40, 12, -16);
        ctx.quadraticCurveTo(4, 0, 12, 16);
        ctx.quadraticCurveTo(20, 40, -6, 62);
        ctx.stroke();
        ctx.strokeStyle = '#e4dccb';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(-6, -62);
        ctx.lineTo(-6, 62);
        ctx.stroke();
        rr(-4, -9, 10, 18, 5, '#d9b856', '#8a6820');
        ell(-6, -62, 2.4, 2.4, '#d9b856');
        ell(-6, 62, 2.4, 2.4, '#d9b856');
      },
      staff() {
        seg(0, 14, 0, -118, 6.5, '#5a4636');
        cordel(-4, 12, '#6d4a5e');
        // corona de tres puntas que sostiene la gema
        [-1, 0, 1].forEach(s => seg(s * 8, -118, s * 11, -136, 2.6, '#d9b856'));
        const glow = 0.35 + P.castCharge * 0.65;
        ell(0, -142, 12 + P.castCharge * 5, 12 + P.castCharge * 5, `rgba(127,88,217,${glow})`);
        ell(0, -142, 7, 7.6, '#8f79ef');
        ell(-2.6, -145, 3, 2.6, 'rgba(255,255,255,.55)');
        ell(0, 17, 4.8, 4.4, '#d9b856');
      },
      spellbook() {
        rr(-15, -20, 30, 40, 4, '#2f2a44', '#16122a');
        rr(-10, -14, 9, 28, 2, '#e2dcc8', '#6f6a52');
        rr(1, -14, 9, 28, 2, '#e2dcc8', '#6f6a52');
        rr(-2.5, -18, 5, 36, 2, '#d9b856');
        ell(0, -24, 3.4, 3, '#7f58d9');
        const g = 0.25 + P.castCharge * 0.6;
        ell(0, 0, 10 + P.castCharge * 8, 10 + P.castCharge * 8, `rgba(150,130,255,${g * 0.55})`);
      },
      /* Escudo de cometa: alto, estrecho abajo, con division heraldica. */
      shield() {
        ctx.fillStyle = shade(state.weaponColor, -57);
        ctx.strokeStyle = '#d9b856';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-19, -26);
        ctx.quadraticCurveTo(0, -32, 19, -26);
        ctx.lineTo(16, 8);
        ctx.quadraticCurveTo(0, 34, -16, 8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        // mitad izquierda mas oscura: division heraldica
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(-19, -26);
        ctx.quadraticCurveTo(0, -32, 19, -26);
        ctx.lineTo(16, 8);
        ctx.quadraticCurveTo(0, 34, -16, 8);
        ctx.closePath();
        ctx.clip();
        ctx.fillStyle = '#5a1818';
        ctx.fillRect(-20, -34, 20, 70);
        ctx.restore();
        ctx.strokeStyle = '#d9b856';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(0, -30);
        ctx.lineTo(0, 31);
        ctx.stroke();
        ell(0, -8, 4.4, 4.4, '#d9b856');
        ell(-1.2, -9.4, 1.8, 1.8, '#f0d878');
      },
    },

    /* ─────────────────────────────────────────────────────────────
   HIERRO DE LOS FOSOS — armas de gladiador. Piezas dispares,
   filos mellados, empuñadura de cordel, remates de hueso.
   ───────────────────────────────────────────────────────────── */
    fosos: {
      nombre: 'Hierro de los Fosos',
      sword() {
        // hoja asimetrica: un borde recto, el otro mellado
        poly(
          [
            [-3.6, -8],
            [3.6, -8],
            [4.4, -100],
            [0, -122],
            [-3.2, -100],
          ],
          shade(state.weaponColor, -41),
          shade(state.weaponColor, -99),
          1.5,
        );
        mellas(100, 8, shade(state.weaponColor, -99), 4);
        seg(-1.4, -16, -1.4, -92, 1, shade(state.weaponColor, -13));
        // guarda torcida, una sola rama
        poly(
          [
            [-6, -10],
            [15, -14],
            [16, -8],
            [-5, -5],
          ],
          '#6b6157',
          '#3d3831',
          1.4,
        );
        cuero(0, -6, 0, 10, 5.6, '#2f2620');
        cordel(-4, 10, '#8a7a5e', 3);
        poly(
          [
            [-4, 12],
            [4, 12],
            [3, 18],
            [-3, 18],
          ],
          '#cfc7b4',
          '#8a8270',
          1.2,
        );
      },
      greatSword() {
        poly(
          [
            [-4.6, -12],
            [4.6, -12],
            [5.4, -128],
            [0, -152],
            [-4, -128],
          ],
          shade(state.weaponColor, -41),
          shade(state.weaponColor, -99),
          1.6,
        );
        mellas(128, 10, shade(state.weaponColor, -99), 5);
        poly(
          [
            [-8, -14],
            [20, -19],
            [21, -12],
            [-7, -8],
          ],
          '#6b6157',
          '#3d3831',
          1.5,
        );
        cuero(0, -10, 0, 14, 6.2, '#2f2620');
        cordel(-8, 14, '#8a7a5e', 3);
        poly(
          [
            [-5, 16],
            [5, 16],
            [4, 24],
            [-4, 24],
          ],
          '#cfc7b4',
          '#8a8270',
          1.3,
        );
      },
      dagger() {
        // hoja curva de despojo
        ctx.fillStyle = shade(state.weaponColor, -39);
        ctx.strokeStyle = shade(state.weaponColor, -99);
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(-2.6, -5);
        ctx.lineTo(2.6, -5);
        ctx.quadraticCurveTo(6, -24, 0, -40);
        ctx.quadraticCurveTo(-3, -24, -2.6, -5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        mellas(28, 5, shade(state.weaponColor, -99), 2);
        seg(-7, -4, 7, -4, 4, '#6b6157');
        cuero(0, -2, 0, 8, 4.4, '#2f2620');
        cordel(-1, 8, '#8a7a5e', 3);
        ell(0, 10, 3.6, 3.2, '#cfc7b4');
      },
      mace() {
        seg(0, 12, 0, -84, 7.5, '#4a3b2c');
        cordel(-4, 10, '#8a7a5e', 3.2);
        // piedra atada con correas, no cabeza forjada
        poly(
          [
            [-13, -92],
            [-6, -108],
            [8, -110],
            [14, -96],
            [9, -84],
            [-8, -84],
          ],
          '#7a726a',
          '#4a4540',
          1.8,
        );
        seg(-12, -96, 13, -98, 2.4, '#3a2f24');
        seg(-10, -88, 11, -90, 2.4, '#3a2f24');
        // un par de puas de hueso
        poly(
          [
            [8, -110],
            [13, -122],
            [15, -108],
          ],
          '#cfc7b4',
          '#8a8270',
          1.2,
        );
        poly(
          [
            [-13, -92],
            [-20, -100],
            [-11, -84],
          ],
          '#cfc7b4',
          '#8a8270',
          1.2,
        );
        ell(0, 14, 5, 4.6, '#4a3b2c');
      },
      greatMace() {
        seg(0, 16, 0, -120, 9.5, '#4a3b2c');
        cordel(-6, 14, '#8a7a5e', 3.2);
        poly(
          [
            [-17, -130],
            [-8, -152],
            [10, -154],
            [18, -136],
            [12, -120],
            [-10, -120],
          ],
          '#7a726a',
          '#4a4540',
          2,
        );
        seg(-16, -136, 17, -138, 2.8, '#3a2f24');
        seg(-13, -126, 15, -128, 2.8, '#3a2f24');
        poly(
          [
            [10, -154],
            [17, -170],
            [20, -152],
          ],
          '#cfc7b4',
          '#8a8270',
          1.3,
        );
        poly(
          [
            [-17, -130],
            [-26, -140],
            [-14, -120],
          ],
          '#cfc7b4',
          '#8a8270',
          1.3,
        );
        ell(0, 18, 5.6, 5, '#4a3b2c');
      },
      axe() {
        seg(0, 12, 0, -90, 7.5, '#4a3b2c');
        cordel(-4, 10, '#8a7a5e', 3.2);
        // hoja de una pieza tosca, con muescas
        poly(
          [
            [0, -80],
            [24, -88],
            [30, -116],
            [16, -108],
            [10, -118],
            [0, -112],
          ],
          shade(state.weaponColor, -41),
          shade(state.weaponColor, -99),
          2,
        );
        seg(0, -84, 0, -110, 3, '#3a2f24');
        poly(
          [
            [0, -112],
            [-6, -126],
            [3, -120],
          ],
          '#cfc7b4',
          '#8a8270',
          1.2,
        );
        ell(0, 14, 5, 4.6, '#4a3b2c');
      },
      greatAxe() {
        seg(0, 16, 0, -128, 9.5, '#4a3b2c');
        cordel(-6, 14, '#8a7a5e', 3.2);
        poly(
          [
            [0, -118],
            [34, -130],
            [40, -162],
            [22, -152],
            [14, -164],
            [0, -156],
          ],
          shade(state.weaponColor, -41),
          shade(state.weaponColor, -99),
          2.2,
        );
        poly(
          [
            [0, -118],
            [-30, -128],
            [-34, -152],
            [-18, -146],
            [0, -152],
          ],
          shade(state.weaponColor, -54),
          shade(state.weaponColor, -99),
          2,
        );
        seg(0, -122, 0, -154, 3.4, '#3a2f24');
        poly(
          [
            [0, -156],
            [-8, -174],
            [5, -166],
          ],
          '#cfc7b4',
          '#8a8270',
          1.3,
        );
        ell(0, 18, 5.6, 5, '#4a3b2c');
      },
      spear() {
        seg(0, 16, 0, -122, 6.5, '#4a3b2c');
        cordel(-4, 12, '#8a7a5e', 3.2);
        // punta de hueso atada al asta
        poly(
          [
            [0, -148],
            [7, -124],
            [0, -110],
            [-7, -124],
          ],
          '#cfc7b4',
          '#8a8270',
          1.6,
        );
        seg(-6, -116, 6, -116, 2.6, '#3a2f24');
        seg(-5, -110, 5, -110, 2.4, '#3a2f24');
        ell(0, 18, 4.2, 4, '#4a3b2c');
      },
      greatSpear() {
        seg(0, 24, 0, -162, 8, '#4a3b2c');
        cordel(-6, 20, '#8a7a5e', 3.4);
        poly(
          [
            [0, -198],
            [11, -164],
            [0, -140],
            [-11, -164],
          ],
          shade(state.weaponColor, -41),
          shade(state.weaponColor, -99),
          1.9,
        );
        mellas(34, 10, shade(state.weaponColor, -99), 2);
        seg(-8, -148, 8, -148, 2.8, '#3a2f24');
        poly(
          [
            [-14, -138],
            [0, -146],
            [14, -138],
            [0, -132],
          ],
          '#cfc7b4',
          '#8a8270',
          1.2,
        );
        ell(0, 27, 5.2, 4.8, '#4a3b2c');
      },
      bow() {
        // arco corto y desigual, con envoltura de cordel
        ctx.strokeStyle = '#5c4630';
        ctx.lineWidth = 6.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(2, -52);
        ctx.quadraticCurveTo(24, -26, 0, -2);
        ctx.quadraticCurveTo(22, 26, -2, 54);
        ctx.stroke();
        ctx.strokeStyle = '#b8ab90';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(2, -52);
        ctx.lineTo(-2, 54);
        ctx.stroke();
        rr(-5, -9, 11, 18, 3, '#2f2620', '#191410');
        cordel(-8, 8, '#8a7a5e', 3.4);
        ell(2, -52, 2.6, 2.6, '#cfc7b4');
        ell(-2, 54, 2.6, 2.6, '#cfc7b4');
      },
      staff() {
        // rama nudosa con craneo atado
        ctx.strokeStyle = '#5c4630';
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(0, 14);
        ctx.quadraticCurveTo(-5, -40, 2, -84);
        ctx.quadraticCurveTo(6, -104, 0, -120);
        ctx.stroke();
        ctx.strokeStyle = '#42301f';
        ctx.lineWidth = 2;
        [-100, -72, -44, -16].forEach(y => {
          ctx.beginPath();
          ctx.moveTo(-4, y);
          ctx.lineTo(4, y + 5);
          ctx.stroke();
        });
        // craneo pequeno
        ell(0, -132, 10, 11, '#cfc7b4');
        ell(-3.4, -131, 2.4, 2.8, '#2a241c');
        ell(3.4, -131, 2.4, 2.8, '#2a241c');
        poly(
          [
            [-4, -125],
            [4, -125],
            [3, -121],
            [-3, -121],
          ],
          '#b8b09c',
          '#8a8270',
          1,
        );
        const glow = 0.3 + P.castCharge * 0.7;
        ell(0, -132, 13 + P.castCharge * 6, 14 + P.castCharge * 6, `rgba(120,196,120,${glow * 0.42})`);
        cordel(-6, 12, '#8a7a5e', 3.4);
        ell(0, 17, 4.8, 4.4, '#4a3b2c');
      },
      spellbook() {
        // atado de pergaminos, no libro encuadernado
        rr(-14, -19, 28, 38, 2, '#5a4a30', '#2e2416');
        [-8, 0, 8].forEach(x => rr(x - 3.4, -16, 6.8, 32, 2, '#cdbd9c', '#6b5a3c'));
        seg(-15, -4, 15, -4, 3, '#3a2f24');
        seg(-15, 6, 15, 6, 3, '#3a2f24');
        const g = 0.25 + P.castCharge * 0.6;
        ell(0, 0, 10 + P.castCharge * 8, 10 + P.castCharge * 8, `rgba(150,200,140,${g * 0.45})`);
      },
      /* Broquel: chico, golpeado, con pua central. */
      shield() {
        const r = 17;
        ell(0, 0, r, r, '#6b6157');
        ell(0, 0, r - 3, r - 3, '#7a7066');
        ctx.strokeStyle = '#4a4540';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.stroke();
        // planchas remachadas dispares
        poly(
          [
            [-r + 2, -4],
            [0, -r + 3],
            [6, -2],
            [-2, 7],
          ],
          '#5f564d',
          '#3d3831',
          1.2,
        );
        ctx.fillStyle = '#8a8270';
        [
          [-10, -8],
          [9, -9],
          [11, 7],
          [-9, 9],
        ].forEach(([x, y]) => {
          ctx.beginPath();
          ctx.arc(x, y, 1.8, 0, Math.PI * 2);
          ctx.fill();
        });
        // pua central
        ell(0, 0, 6, 6, shade(state.weaponColor, -51));
        poly(
          [
            [0, -14],
            [-4, -2],
            [4, -2],
          ],
          shade(state.weaponColor, -13),
          shade(state.weaponColor, -99),
          1.2,
        );
      },
    },
  };
  const ARMA = () => ARMAS[state.weaponSet] || ARMAS.norte;

  const ART = {
    sword() {
      seg(0, 10, 0, -118, 7.5, shade(state.weaponColor, -2));
      ctx.strokeStyle = shade(state.weaponColor, -22);
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(0, -14);
      ctx.lineTo(0, -106);
      ctx.stroke();
      poly(
        [
          [0, -130],
          [-4, -114],
          [4, -114],
        ],
        shade(state.weaponColor, 25),
      );
      seg(-16, -11, 16, -11, 7.5, '#93794a');
      seg(-14, -13, 14, -13, 3, '#c0a566');
      seg(0, -8, 0, 9, 6, '#48301a', 'butt');
      ctx.strokeStyle = '#331f10';
      ctx.lineWidth = 1.8;
      for (let g = -6; g < 9; g += 4) {
        ctx.beginPath();
        ctx.moveTo(-3.2, g);
        ctx.lineTo(3.2, g);
        ctx.stroke();
      }
      ell(0, 12, 5.6, 5, '#8b7040');
      ell(0, 12, 2.6, 2.3, '#c2a45e');
    },
    greatSword() {
      seg(0, 14, 0, -150, 9, shade(state.weaponColor, -2));
      ctx.strokeStyle = shade(state.weaponColor, -22);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, -18);
      ctx.lineTo(0, -136);
      ctx.stroke();
      poly(
        [
          [0, -166],
          [-5, -146],
          [5, -146],
        ],
        shade(state.weaponColor, 25),
      );
      seg(-22, -15, 22, -15, 8.5, '#93794a');
      seg(-19, -18, 19, -18, 3.2, '#c0a566');
      seg(0, -12, 0, 13, 6.5, '#48301a', 'butt');
      ell(0, 17, 6.2, 5.6, '#8b7040');
      ell(0, 17, 2.8, 2.5, '#c2a45e');
    },
    dagger() {
      seg(0, 7, 0, -32, 5, shade(state.weaponColor, 3));
      poly(
        [
          [0, -42],
          [-3.4, -30],
          [3.4, -30],
        ],
        shade(state.weaponColor, 25),
      );
      seg(-8, -6, 8, -6, 5, '#93794a');
      seg(0, -4, 0, 7, 4.4, '#48301a', 'butt');
      ell(0, 9, 4, 3.6, '#8b7040');
    },
    mace() {
      seg(0, 12, 0, -86, 7, '#4c331c');
      ell(0, -98, 13, 16, '#6d757b');
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        seg(
          Math.cos(a) * 8,
          -98 + Math.sin(a) * 10,
          Math.cos(a) * 16,
          -98 + Math.sin(a) * 18,
          4,
          shade(state.weaponColor, -14),
        );
      }
      ell(0, 14, 5, 4.6, '#8b7040');
    },
    greatMace() {
      seg(0, 16, 0, -124, 9, '#4c331c');
      ell(0, -140, 17, 21, '#6d757b');
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        seg(
          Math.cos(a) * 11,
          -140 + Math.sin(a) * 14,
          Math.cos(a) * 21,
          -140 + Math.sin(a) * 24,
          5,
          shade(state.weaponColor, -14),
        );
      }
      ell(0, 18, 5.8, 5.2, '#8b7040');
    },
    axe() {
      seg(0, 12, 0, -92, 7, '#4c331c');
      poly(
        [
          [0, -84],
          [26, -96],
          [32, -122],
          [13, -114],
          [0, -126],
        ],
        shade(state.weaponColor, -8),
        shade(state.weaponColor, -42),
        1.8,
      );
      ell(0, 14, 5, 4.6, '#8b7040');
    },
    greatAxe() {
      seg(0, 16, 0, -132, 9, '#4c331c');
      poly(
        [
          [0, -122],
          [36, -138],
          [42, -168],
          [17, -158],
          [0, -172],
        ],
        shade(state.weaponColor, -8),
        shade(state.weaponColor, -42),
        2,
      );
      poly(
        [
          [0, -122],
          [-36, -138],
          [-42, -168],
          [-17, -158],
          [0, -172],
        ],
        shade(state.weaponColor, -22),
        shade(state.weaponColor, -42),
        2,
      );
      ell(0, 18, 5.8, 5.2, '#8b7040');
    },
    spear() {
      seg(0, 16, 0, -128, 6, '#7a5730');
      poly(
        [
          [0, -150],
          [9, -126],
          [0, -112],
          [-9, -126],
        ],
        shade(state.weaponColor, 7),
        shade(state.weaponColor, -38),
        1.6,
      );
      ell(0, 18, 4.2, 4, '#4c331c');
    },
    greatSpear() {
      seg(0, 24, 0, -168, 8.5, '#6d4d2a');
      seg(0, 16, 0, -158, 3.6, '#9a7040');
      poly(
        [
          [0, -200],
          [13, -166],
          [0, -146],
          [-13, -166],
        ],
        shade(state.weaponColor, 14),
        shade(state.weaponColor, -34),
        1.9,
      );
      ell(0, 27, 5.4, 5, '#4c331c');
    },
    bow() {
      ctx.strokeStyle = '#7a5730';
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(0, -58);
      ctx.quadraticCurveTo(23, -30, 0, 0);
      ctx.quadraticCurveTo(23, 30, 0, 58);
      ctx.stroke();
      ctx.strokeStyle = '#cfcabe';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -58);
      ctx.lineTo(0, 58);
      ctx.stroke();
      rr(-5, -8, 10, 16, 4, '#48301a');
    },
    staff() {
      seg(0, 14, 0, -124, 8, '#6b4a2c');
      ctx.strokeStyle = '#54381f';
      ctx.lineWidth = 1.6;
      for (let g = -110; g < 8; g += 22) {
        ctx.beginPath();
        ctx.moveTo(-4, g);
        ctx.lineTo(4, g + 4);
        ctx.stroke();
      }
      const glow = 0.35 + P.castCharge * 0.65;
      ell(0, -140, 13 + P.castCharge * 4, 13 + P.castCharge * 4, `rgba(126,102,231,${glow})`);
      ell(0, -140, 8, 8, '#8f79ef');
      ell(-3, -143, 3.4, 3, 'rgba(255,255,255,.5)');
      ell(0, 17, 5, 4.6, '#4c331c');
    },
    spellbook() {
      rr(-15, -20, 30, 40, 5, '#4e2f28', '#28150f');
      rr(-10, -14, 9, 28, 2, '#cdbd9c', '#5f4f36');
      rr(1, -14, 9, 28, 2, '#cdbd9c', '#5f4f36');
      rr(-2.5, -18, 5, 36, 2, '#6d4830');
      const g = 0.25 + P.castCharge * 0.6;
      ell(0, 0, 10 + P.castCharge * 8, 10 + P.castCharge * 8, `rgba(140,180,255,${g * 0.5})`);
    },
    shield() {
      const rx = 22,
        ry = 29;
      ell(0, 0, rx, ry, shade(state.shieldColor, -12));
      ell(0, 0, rx - 4, ry - 5, state.shieldColor);
      ctx.strokeStyle = shade(state.shieldColor, 34);
      ctx.lineWidth = 3.4;
      ctx.beginPath();
      ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = shade(state.shieldColor, -28);
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(0, -ry + 4);
      ctx.lineTo(0, ry - 4);
      ctx.stroke();
      ell(0, 0, 6, 6, shade(state.shieldColor, 12));
      ell(-1.5, -1.5, 2.4, 2.4, shade(state.shieldColor, 42));
    },
  };
  /* Ancla universal: dibuja el arma con su empuñadura en (hx,hy). */
  function drawWeaponAt(id, hx, hy, angle) {
    if (!id || id === 'none') return;
    const fam = ARMA();
    const dibujo = fam[id] || ART[id];
    if (!dibujo) return;
    ctx.save();
    ctx.translate(hx, hy);
    ctx.rotate(angle);
    dibujo.call(fam);
    ctx.restore();
  }

  /* ══════════════════════════════════════════════════════════════════
   6 · ÁNGULOS DE ARMA POR DIRECCIÓN Y CLIP
   ══════════════════════════════════════════════════════════════════ */
  function weaponAngle(dir, id) {
    const m = MAIN[id] || OFF[id] || {};
    const stab = m.arc === 'stab';
    const base =
      dir === 'down' ? (stab ? 0.1 : 0.3) : dir === 'up' ? (stab ? 2.24 : 2.36) : stab ? 0.92 : 1.06;
    const sw = P.swing * (stab ? 0.55 : 1.05) + P.thrust * (stab ? 0.3 : 0.18);
    return dir === 'up' ? base - sw : base + sw;
  }

  /* ══════════════════════════════════════════════════════════════════
   7 · PARTES DEL CUERPO
   ══════════════════════════════════════════════════════════════════ */
  const eqOn = p => !!state.equip[p],
    clothOn = p => state.showClothes && !!state.clothes[p];

  function torsoPath() {
    poly([
      [-9, RIG.neckBot],
      [-24, -84],
      [-31, RIG.shoulderY + 16],
      [-29, RIG.chestY],
      [-23, RIG.waistY],
      [-20, 8],
      [-22, RIG.hipY],
      [22, RIG.hipY],
      [20, 8],
      [23, RIG.waistY],
      [29, RIG.chestY],
      [31, RIG.shoulderY + 16],
      [24, -84],
      [9, RIG.neckBot],
    ]);
  }
  function sidePath() {
    poly([
      [-9, RIG.neckBot],
      [-13, -82],
      [-15, RIG.chestY],
      [-12, RIG.waistY],
      [-10, 8],
      [-13, RIG.hipY],
      [15, RIG.hipY],
      [16, 8],
      [17, RIG.waistY],
      [18, RIG.chestY],
      [16, -82],
      [9, RIG.neckBot],
    ]);
  }

  function drawBody(base, side = false) {
    const path = side ? sidePath : torsoPath,
      br = P.breath * 1.1;
    ctx.save();
    ctx.translate(0, -br * 0.4);
    ctx.fillStyle = base.skin;
    ctx.strokeStyle = 'rgba(20,14,11,.42)';
    ctx.lineWidth = 1.3;
    path();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,.16)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, -84);
    ctx.lineTo(0, RIG.chestY + 6);
    ctx.stroke();
    if (clothOn('shirt')) {
      ctx.save();
      path();
      ctx.clip();
      ctx.fillStyle = base.shirt;
      ctx.fillRect(-36, RIG.neckBot - 6, 72, 160);
      ctx.strokeStyle = 'rgba(0,0,0,.14)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-21, -80);
      ctx.lineTo(-18, 20);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(21, -80);
      ctx.lineTo(18, 20);
      ctx.stroke();
      ctx.restore();
      ctx.strokeStyle = 'rgba(20,14,11,.3)';
      ctx.lineWidth = 1.2;
      path();
      ctx.stroke();
    }
    if (clothOn('pants'))
      rr(side ? -12 : -21, RIG.hipY - 4, side ? 28 : 42, 18, 5, base.underwear, 'rgba(20,14,11,.35)');
    ctx.restore();
  }
  function drawNeck(base) {
    poly(
      [
        [-8, RIG.neckTop],
        [8, RIG.neckTop],
        [9, RIG.neckBot],
        [-9, RIG.neckBot],
      ],
      shade(base.skin, -8),
      'rgba(0,0,0,.3)',
    );
    ctx.strokeStyle = 'rgba(0,0,0,.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-4, RIG.neckTop + 2);
    ctx.lineTo(-7, RIG.neckBot);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(4, RIG.neckTop + 2);
    ctx.lineTo(7, RIG.neckBot);
    ctx.stroke();
    if (eqOn('neck')) {
      SET().neck(base);
    } else if (clothOn('neck')) {
      poly(
        [
          [-12, RIG.neckBot + 4],
          [-10, RIG.neckTop + 3],
          [10, RIG.neckTop + 3],
          [12, RIG.neckBot + 4],
          [0, RIG.neckBot + 1],
        ],
        shade(base.shirt, -8),
        'rgba(0,0,0,.25)',
      );
    }
  }
  function drawTorsoArmor(base) {
    if (!eqOn('torso')) return;
    SET().torso(base);
  }
  function drawPauldron(sx, sy, side, base) {
    if (!eqOn('torso')) return;
    const s2 = side === 'left' ? -1 : 1;
    ctx.save();
    ctx.translate(sx, sy);
    SET().pauldron(s2, base);
    ctx.restore();
  }
  function drawHelmet(dir, base) {
    if (!eqOn('helmet')) return;
    ctx.save();
    SET().helmet(dir, base);
    ctx.restore();
  }
  function frontHair(base) {
    const c = base.hair,
      hi = shade(c, 24),
      dk = shade(c, -18),
      top = RIG.headTop;
    if (state.hair === 'bald') {
      ctx.fillStyle = 'rgba(255,255,255,.04)';
      ctx.beginPath();
      ctx.ellipse(-3, top + 9, 5, 3, -0.3, 0, Math.PI * 2);
      ctx.fill();
      return;
    }
    if (state.hair === 'mohawk') {
      poly(
        [
          [-4, top + 5],
          [-2, top - 16],
          [2, top - 16],
          [4, top + 5],
        ],
        c,
        dk,
        1.2,
      );
      return;
    }
    poly(
      [
        [-14, top + 12],
        [-14, top],
        [0, top - 6],
        [14, top],
        [14, top + 12],
        [9, top + 7],
        [0, top + 11],
        [-9, top + 7],
      ],
      c,
      dk,
      1.2,
    );
    ctx.strokeStyle = hi;
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(-7, top + 1);
    ctx.lineTo(-5, top + 9);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(6, top + 1);
    ctx.lineTo(4, top + 9);
    ctx.stroke();
    if (state.hair === 'bun') {
      ctx.fillStyle = c;
      ctx.strokeStyle = dk;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(0, top - 8, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }
  /* Pelo trasero corto/moño/coleta: va bajo el casco */
  function backHair(base) {
    const c = base.hair,
      dk = shade(c, -18),
      top = RIG.headTop;
    if (state.hair === 'bald' || state.hair === 'mohawk' || state.hair === 'long') return;
    if (state.hair === 'short') rr(-14, top, 28, 16, 4, c, dk);
    else if (state.hair === 'ponytail') {
      rr(-14, top, 28, 15, 4, c, dk);
      seg(0, top + 14, 0, -80, 7, c);
      ell(0, -72, 6, 10, c);
    } else if (state.hair === 'bun') {
      rr(-14, top, 28, 15, 4, c, dk);
      ell(0, top - 8, 7, 7, c);
    }
  }
  /* Melena larga: ÚNICA pieza que se dibuja POR ENCIMA de la capa */
  function longHair(base, dir) {
    if (state.hair !== 'long') return;
    const c = base.hair,
      dk = shade(c, -18),
      top = RIG.headTop,
      fl = P.capeSway * 0.35;
    if (dir === 'right' || dir === 'left') {
      ctx.save();
      if (dir === 'left') ctx.scale(-1, 1);
      poly(
        [
          [-15, top + 4],
          [-17, -74 + fl * 0.4],
          [-9, -64],
          [-2, -70],
          [-4, top + 10],
        ],
        c,
        dk,
        1.2,
      );
      ctx.restore();
      return;
    }
    poly(
      [
        [-15, top + 2],
        [-18 - fl * 0.3, -70 + fl * 0.5],
        [-9, -60],
        [0, -66],
        [9, -60],
        [18 + fl * 0.3, -70 + fl * 0.5],
        [15, top + 2],
      ],
      c,
      dk,
      1.2,
    );
    ctx.strokeStyle = shade(c, 20);
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(-8, top + 6);
    ctx.lineTo(-11, -66);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(8, top + 6);
    ctx.lineTo(11, -66);
    ctx.stroke();
  }
  function drawHead(dir, base) {
    const cy = RIG.headCy,
      top = RIG.headTop,
      bot = RIG.headBot;
    ctx.save();
    ctx.translate(0, P.headY);
    ctx.rotate(P.headTilt * (dir === 'left' ? -1 : 1));
    if (dir === 'up') {
      poly(
        [
          [-12, top + 4],
          [12, top + 4],
          [14, cy - 2],
          [12, cy + 8],
          [6, bot],
          [-6, bot],
          [-12, cy + 8],
          [-14, cy - 2],
        ],
        base.skin,
        'rgba(0,0,0,.32)',
      );
      backHair(base);
    } else if (dir === 'down') {
      poly(
        [
          [-12, top + 4],
          [12, top + 4],
          [14, cy - 2],
          [12, cy + 8],
          [6, bot],
          [-6, bot],
          [-12, cy + 8],
          [-14, cy - 2],
        ],
        base.skin,
        'rgba(0,0,0,.32)',
      );
      ctx.fillStyle = 'rgba(0,0,0,.10)';
      poly(
        [
          [-13, cy],
          [-8, cy + 3],
          [-11, cy + 8],
        ],
        'rgba(0,0,0,.10)',
      );
      poly(
        [
          [13, cy],
          [8, cy + 3],
          [11, cy + 8],
        ],
        'rgba(0,0,0,.10)',
      );
      rr(-11, cy - 6, 8, 6, 2, 'rgba(0,0,0,.13)');
      rr(3, cy - 6, 8, 6, 2, 'rgba(0,0,0,.13)');
      const blink = state.action === 'death' ? 1 : Math.sin(clipT * 3.1) > 0.985 ? 1 : 0;
      if (blink) {
        seg(-8, cy - 3, -4, cy - 3, 1.6, '#15100d');
        seg(4, cy - 3, 8, cy - 3, 1.6, '#15100d');
      } else {
        ell(-6, cy - 3, 1.9, 1.8, '#15100d');
        ell(6, cy - 3, 1.9, 1.8, '#15100d');
        ctx.fillStyle = 'rgba(255,255,255,.28)';
        ctx.beginPath();
        ctx.arc(-6.4, cy - 3.6, 0.7, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(5.6, cy - 3.6, 0.7, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.strokeStyle = shade(base.hair, 14);
      ctx.lineWidth = 2.2;
      ctx.lineCap = 'round';
      const brow = P.recoil * 2 + (state.action === 'melee' ? P.thrust * 1.6 : 0);
      ctx.beginPath();
      ctx.moveTo(-10, cy - 7 + brow);
      ctx.lineTo(-3, cy - 8);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(10, cy - 7 + brow);
      ctx.lineTo(3, cy - 8);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(0,0,0,.24)';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(-1, cy - 4);
      ctx.lineTo(-1.5, cy + 4);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(0,0,0,.34)';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(-2.5, cy + 5);
      ctx.lineTo(2.5, cy + 5);
      ctx.stroke();
      const open = Math.max(
        P.thrust * 2.6,
        P.recoil > 0 ? Math.abs(P.recoil) * 3 : 0,
        state.action === 'death' ? 2 : 0,
      );
      ctx.strokeStyle = 'rgba(0,0,0,.42)';
      ctx.lineWidth = 1.4;
      if (open > 0.6) {
        ell(0, cy + 11, 3.4, 1 + open, 'rgba(20,8,6,.75)');
      } else {
        ctx.beginPath();
        ctx.moveTo(-3.5, cy + 11);
        ctx.lineTo(3.5, cy + 11);
        ctx.stroke();
      }
      if (base.gender === 'male') {
        poly(
          [
            [-11, cy + 6],
            [11, cy + 6],
            [8, bot - 1],
            [-8, bot - 1],
          ],
          shade(base.hair, 8) + '70',
        );
        rr(-5, cy + 7, 10, 2.5, 1, shade(base.hair, 8) + '88');
        ctx.strokeStyle = 'rgba(130,80,60,.38)';
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(11, cy - 4);
        ctx.lineTo(13, cy + 4);
        ctx.stroke();
      }
      frontHair(base);
    } else {
      ctx.save();
      if (dir === 'left') ctx.scale(-1, 1);
      poly(
        [
          [-11, top + 4],
          [10, top + 5],
          [13, cy - 2],
          [12, cy + 6],
          [5, bot],
          [-8, bot - 2],
          [-12, cy + 4],
          [-13, cy - 4],
        ],
        base.skin,
        'rgba(0,0,0,.32)',
      );
      ell(7, cy - 3, 1.8, 1.8, '#15100d');
      ctx.strokeStyle = shade(base.hair, 14);
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(3, cy - 8);
      ctx.lineTo(10, cy - 7);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(0,0,0,.3)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(11, cy + 2);
      ctx.lineTo(13, cy + 4);
      ctx.stroke();
      const open = Math.max(P.thrust * 2.4, Math.abs(P.recoil) * 3, state.action === 'death' ? 2 : 0);
      if (open > 0.6) ell(9, cy + 10, 2.6, 1 + open, 'rgba(20,8,6,.75)');
      else {
        ctx.beginPath();
        ctx.moveTo(7, cy + 11);
        ctx.lineTo(12, cy + 10);
        ctx.stroke();
      }
      if (base.gender === 'male')
        poly(
          [
            [-9, cy + 5],
            [12, cy + 6],
            [6, bot],
            [-8, bot - 2],
          ],
          shade(base.hair, 8) + '70',
        );
      const c = base.hair,
        dk = shade(c, -18);
      if (state.hair !== 'bald') {
        if (state.hair === 'mohawk')
          poly(
            [
              [-3, top + 2],
              [1, top - 18],
              [5, top + 2],
            ],
            c,
            dk,
            1.2,
          );
        else {
          poly(
            [
              [-14, top + 14],
              [-13, top - 1],
              [0, top - 7],
              [11, top + 1],
              [9, top + 9],
              [-2, top + 6],
              [-8, top + 13],
            ],
            c,
            dk,
            1.2,
          );
          if (state.hair === 'ponytail') {
            seg(-13, top + 12, -19, -74, 6, c);
            ell(-20, -66, 6, 9, c);
          }
          if (state.hair === 'bun') ell(-9, top - 4, 7, 7, c);
        }
      }
      ctx.restore();
    }
    drawHelmet(dir, base);
    ctx.restore();
  }

  /* ── EXTREMIDADES ── */
  function armColors(base, front) {
    const S = SET();
    return {
      limb: eqOn('arms')
        ? S.limb(base, front)
        : clothOn('arms')
          ? shade(base.shirt, front ? 8 : -12)
          : shade(base.skin, front ? 6 : -6),
      hand: eqOn('gloves')
        ? S.hand(base, front)
        : clothOn('gloves')
          ? shade(base.shirt, -18)
          : shade(base.skin, front ? 10 : -12),
    };
  }
  function drawArm(shoulder, elbow, hand, front, base) {
    const c = armColors(base, front);
    seg(shoulder.x, shoulder.y, elbow.x, elbow.y, 11, c.limb);
    seg(elbow.x, elbow.y, hand.x, hand.y, 9.5, c.hand);
    if (eqOn('arms')) SET().armPlate(shoulder, elbow, hand, front, base);
    if (eqOn('gloves')) SET().glove(hand, front, base);
    else ell(hand.x, hand.y, 5.2, 5.2, c.hand);
    return { x: hand.x, y: hand.y };
  }
  /* Devuelve el joint de la mano; el arma se ancla exactamente ahí. */
  function armPose(side, dir, weaponArm) {
    const s = side === 'left' ? -1 : 1;
    const up = dir === 'up';
    const sw = (weaponArm ? P.armPhase : -P.armPhase * 0.55) * s * (up ? -1 : 1);
    const two = usesTwoHandGrip() && weaponArm;
    const cast = P.castCharge * (weaponArm ? 1 : 0.55);
    const sh = { x: s * RIG.shoulderX, y: RIG.shoulderY + 8 };
    const el = { x: s * (RIG.shoulderX + 7) + sw * 2.6 * s, y: RIG.elbowY + sw * 3.0 - cast * 22 };
    const hd = {
      x: s * (RIG.shoulderX + 12) + sw * 4.4 * s - (two ? s * 10 : 0),
      y: RIG.handY + sw * 5.0 - cast * 46 - (two ? 8 : 0),
    };
    return { sh, el, hd };
  }
  function drawLeg(xF, front, base, dir) {
    const ph = P.legPhase * (front ? 1 : -1) * 8.5;
    const skin = front ? shade(base.skin, 6) : shade(base.skin, -8);
    const cl = front ? shade(base.pants, 10) : shade(base.pants, -12);
    const col = eqOn('legs')
      ? front
        ? shade(base.armor, -2)
        : shade(base.armor, -16)
      : clothOn('pants')
        ? cl
        : skin;
    const hip = { x: xF, y: RIG.hipY + P.sink * 0.25 };
    const knee = { x: xF + (front ? 2 : -2) + ph * 0.26, y: RIG.kneeY + ph * 0.55 + P.sink * 0.5 };
    const foot = { x: xF + (front ? 6 : -6) + ph * 0.72, y: RIG.footY - Math.abs(ph) * 0.3 + P.sink * 0.2 };
    seg(hip.x, hip.y, knee.x, knee.y, 13, col);
    seg(knee.x, knee.y, foot.x, foot.y, 10, col);
    if (eqOn('legs')) SET().legPlate(hip, knee, foot, front, base);
    if (eqOn('boots')) SET().boot(knee, foot, base);
    ell(foot.x, foot.y + 7, 11.5, 5, eqOn('boots') ? SET().sole(base) : '#2e241d');
  }
  function drawTunic(base, dir) {
    if (!state.showTunic) return;
    TUN().draw(base, dir);
  }
  function drawCape(base, dir) {
    if (!state.showCape) return;
    ctx.save();
    CAP().draw(base, dir);
    ctx.restore();
  }
  function drawCapeCollar(base, dir) {
    if (!state.showCape) return;
    CAP().collar(base, dir);
  }
  /* La capucha va sobre la cabeza, asi que se dibuja al final. */
  function drawCapeHood(base, dir) {
    if (!state.showCape) return;
    const c = CAP();
    if (c.hood) c.hood(base, dir);
  }
  function fxSlash(x, y, rot) {
    if (P.thrust <= 0.02) return;
    const a = P.thrust;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.strokeStyle = `rgba(255,238,190,${0.45 * a})`;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.arc(0, 0, 66, -1.55, -0.02);
    ctx.stroke();
    ctx.strokeStyle = `rgba(255,255,225,${0.3 * a})`;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(0, 0, 74, -1.7, -0.1);
    ctx.stroke();
    ctx.restore();
  }
  function fxMagic(x, y) {
    const c = P.castCharge,
      b = P.castBurst;
    if (c <= 0.01 && b <= 0.01) return;
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + clipT * 3.2,
        r = (16 + c * 14) * (1 - b * 0.4) + b * 46;
      ell(
        x + Math.cos(a) * r,
        y + Math.sin(a) * r,
        3.2 + c * 2 + b * 2,
        3.2 + c * 2 + b * 2,
        `rgba(140,185,255,${0.3 + c * 0.4})`,
      );
    }
    ell(x, y, 10 + c * 18 + b * 40, 10 + c * 18 + b * 40, `rgba(120,170,255,${0.12 + c * 0.2 + b * 0.28})`);
    if (b > 0.01) {
      ctx.strokeStyle = `rgba(200,225,255,${b * 0.6})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y, 30 + b * 58, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  function fxHurt() {
    if (P.flash <= 0.01) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = `rgba(210,60,50,${P.flash * 0.42})`;
    ctx.fillRect(-60, RIG.headTop - 20, 120, 300);
    ctx.restore();
    for (let i = 0; i < 6; i++) {
      const a = -0.6 - i * 0.42,
        d = (1 - P.flash) * 40 + 10;
      ell(
        Math.cos(a) * d,
        RIG.chestY + Math.sin(a) * d,
        3.4 * P.flash + 1,
        3.4 * P.flash + 1,
        `rgba(168,40,36,${P.flash * 0.8})`,
      );
    }
  }

  /* ══════════════════════════════════════════════════════════════════
   8 · COMPOSICIÓN POR DIRECCIÓN
   Jerarquías recuperadas de index(37):
   · Abajo: capa y pelo trasero quedan detrás del cuerpo.
   · Arriba: la capa cruza por delante del cuerpo y las extremidades.
   · Laterales: capa y melena forman la silueta posterior.
   El cuello/broche de la capa se separa del paño para poder quedar al frente.
   ══════════════════════════════════════════════════════════════════ */
  function offHandItem() {
    return state.off === 'none' ? null : state.off;
  }
  function mainHandItem() {
    return state.main === 'none' ? null : state.main;
  }

  function composeDown(base) {
    /* Fondo: la capa y todo el cabello posterior quedan detrás del cuerpo. */
    drawCape(base, 'down');
    backHair(base);
    longHair(base, 'down');
    drawLeg(-11, false, base, 'down');
    drawLeg(11, true, base, 'down');
    const L = armPose('left', 'down', false);
    drawArm(L.sh, L.el, L.hd, false, base);
    drawPauldron(L.sh.x, L.sh.y - 4, 'left', base);
    drawBody(base);
    drawNeck(base);
    drawTorsoArmor(base);
    drawTunic(base, 'down');
    /* El broche pertenece al frente aunque el paño de la capa quede atrás. */
    drawCapeCollar(base, 'down');
    /* mano secundaria */
    if (hasShield()) drawWeaponAt('shield', L.hd.x, L.hd.y, 0);
    else if (hasSpellbook()) drawWeaponAt('spellbook', L.hd.x, L.hd.y, 0.12);
    else if (isDualWield()) drawWeaponAt(state.off, L.hd.x, L.hd.y, -0.34 - P.swing * 0.5);
    /* mano principal */
    const R = armPose('right', 'down', true);
    drawArm(R.sh, R.el, R.hd, true, base);
    drawPauldron(R.sh.x, R.sh.y - 4, 'right', base);
    const m = mainHandItem();
    if (m) {
      const ang = m === 'bow' ? Math.PI / 2 : weaponAngle('down', m);
      drawWeaponAt(m, R.hd.x, R.hd.y, ang);
      if (MAIN[m].arc === 'slash' || MAIN[m].arc === 'stab') fxSlash(R.hd.x + 24, R.hd.y - 56, -0.56);
      if (m === 'staff') fxMagic(R.hd.x + Math.sin(ang) * 118, R.hd.y - Math.cos(ang) * 118);
    }
    if (hasSpellbook() && !m) fxMagic(L.hd.x, L.hd.y - 6);
    drawHead('down', base);
  }
  function composeUp(base) {
    /* En la vista posterior, escudo y brazo secundario parten al fondo. */
    const L = armPose('left', 'up', false);
    if (hasShield()) drawWeaponAt('shield', L.hd.x, L.hd.y, 0);
    drawArm(L.sh, L.el, L.hd, false, base);
    drawPauldron(L.sh.x, L.sh.y - 4, 'left', base);
    drawLeg(-11, false, base, 'up');
    drawLeg(11, true, base, 'up');
    drawBody(base);
    drawNeck(base);
    drawTorsoArmor(base);
    drawTunic(base, 'up');
    if (hasSpellbook()) drawWeaponAt('spellbook', L.hd.x, L.hd.y, -0.12);
    else if (isDualWield()) drawWeaponAt(state.off, L.hd.x, L.hd.y, 3.5 + P.swing * 0.4);
    const R = armPose('right', 'up', true);
    drawArm(R.sh, R.el, R.hd, true, base);
    drawPauldron(R.sh.x, R.sh.y - 4, 'right', base);
    const m = mainHandItem();
    if (m) {
      const ang = m === 'bow' ? Math.PI / 2 : weaponAngle('up', m);
      drawWeaponAt(m, R.hd.x, R.hd.y, ang);
      if (MAIN[m].arc === 'slash' || MAIN[m].arc === 'stab') fxSlash(R.hd.x + 24, R.hd.y - 48, 2.34);
      if (m === 'staff') fxMagic(R.hd.x + Math.sin(ang) * 118, R.hd.y - Math.cos(ang) * 118);
    }
    /* Hacia arriba, la capa sí cruza por delante del cuerpo y las armas. */
    drawCape(base, 'up');
    drawCapeCollar(base, 'up');
    longHair(base, 'up');
    drawHead('up', base);
  }
  function composeSide(base, dir) {
    const flip = dir === 'left';
    ctx.save();
    if (flip) ctx.scale(-1, 1);
    /* La silueta posterior se establece antes que cuerpo y extremidades. */
    drawCape(base, dir);
    longHair(base, 'right');
    /* Escudo al fondo en ambos perfiles. */
    if (hasShield()) drawWeaponAt('shield', 16, -14, 0);
    /* brazo trasero */
    const rearLimb = eqOn('arms')
      ? shade(base.armor, -16)
      : clothOn('arms')
        ? shade(base.shirt, -12)
        : shade(base.skin, -8);
    const rearHand = eqOn('gloves')
      ? shade(base.armor, -18)
      : clothOn('gloves')
        ? shade(base.shirt, -18)
        : shade(base.skin, -12);
    const rs = P.armPhase * -1;
    seg(2, RIG.shoulderY + 8, 15, RIG.elbowY + rs * 2.2, 10, rearLimb);
    seg(15, RIG.elbowY + rs * 2.2, 22, RIG.handY + rs * 3.4, 9, rearHand);
    ell(22, RIG.handY + rs * 3.4, 5.2, 5.2, rearHand);
    if (isDualWield()) drawWeaponAt(state.off, 22, RIG.handY + rs * 3.4, -0.86 - P.swing * 0.4);
    /* pierna trasera */
    drawLeg(4, false, base, dir);
    drawBody(base, true);
    drawPauldron(2, RIG.shoulderY + 4, 'right', base);
    /* pierna delantera */
    drawLeg(-6, true, base, dir);
    drawNeck(base);
    drawTorsoArmor(base);
    drawTunic(base, dir);
    drawCapeCollar(base, dir);
    /* brazo delantero + arma */
    const fLimb = eqOn('arms')
      ? shade(base.armor, -4)
      : clothOn('arms')
        ? shade(base.shirt, 8)
        : shade(base.skin, 6);
    const fs = P.armPhase,
      cast = P.castCharge;
    const el = { x: -3 + fs * 3.2, y: RIG.elbowY + fs * 2.4 - cast * 20 };
    const hd = { x: 14 + fs * 6.4, y: RIG.handY + fs * 4.2 - cast * 44 };
    const frontHand = eqOn('gloves')
      ? shade(base.armor, -18)
      : clothOn('gloves')
        ? shade(base.shirt, -18)
        : shade(base.skin, 10);
    seg(-3, RIG.shoulderY + 8, el.x, el.y, 10, fLimb);
    seg(el.x, el.y, hd.x, hd.y, 9, frontHand);
    ell(hd.x, hd.y, 5.2, 5.2, frontHand);
    if (hasSpellbook()) drawWeaponAt('spellbook', hd.x, hd.y, 0.1);
    const m = mainHandItem();
    if (m) {
      const ang = m === 'bow' ? Math.PI / 2 : weaponAngle('side', m);
      drawWeaponAt(m, hd.x, hd.y, ang);
      if (MAIN[m].arc === 'slash' || MAIN[m].arc === 'stab') fxSlash(hd.x + 20, hd.y - 40, 0.9);
      if (m === 'staff') fxMagic(hd.x + Math.sin(ang) * 118, hd.y - Math.cos(ang) * 118);
    }
    if (hasSpellbook() && !m) fxMagic(hd.x, hd.y);
    ctx.restore();
    drawHead(dir, base);
  }

  function drawHuman(base) {
    ctx.save();
    ctx.globalAlpha = P.alpha;
    ctx.translate(0, -P.bob + P.sink);
    ctx.rotate(P.fall * (Math.PI / 2) * 0.92 + P.torsoLean * 0.35 + P.recoil * 0.05);
    ctx.translate(P.recoil * 3, 0);
    ctx.scale(0.92, 0.92);
    ctx.save();
    ctx.rotate(P.torsoTwist * 0.5);
    if (state.dir === 'down') composeDown(base);
    else if (state.dir === 'up') composeUp(base);
    else composeSide(base, state.dir);
    ctx.restore();
    fxHurt();
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  function parseHands(v) {
    if (v.main || v.off) {
      return { main: v.main || 'none', off: v.off || 'none' };
    }
    const weapon = v.weapon || 'none';
    const composite = {
      swordShield: ['sword', 'shield'],
      daggerShield: ['dagger', 'shield'],
      maceShield: ['mace', 'shield'],
      spearShield: ['spear', 'shield'],
      spellbookStaff: ['staff', 'spellbook'],
      shieldOnly: ['none', 'shield'],
      spellbook: ['none', 'spellbook'],
    };
    if (composite[weapon]) return { main: composite[weapon][0], off: composite[weapon][1] };
    return { main: weapon, off: v.shield ? 'shield' : 'none' };
  }

  function applyVisual(v) {
    const hands = parseHands(v);
    state.tab = 'humans';
    state.dir = v.dir || 'down';
    state.main = MAIN[hands.main] ? hands.main : 'none';
    state.off = OFF[hands.off] ? hands.off : 'none';
    state.hair = v.hair || 'short';
    state.weaponColor = v.weaponColor || '#c2c9ce';
    state.shieldColor = v.shieldColor || '#756a5e';
    state.armorSet = SETS[v.armorSet] ? v.armorSet : 'placas';
    state.tunicSet = TUNICS[v.tunicSet] ? v.tunicSet : 'maestre';
    state.capeSet = CAPES[v.capeSet] ? v.capeSet : 'invierno';
    state.weaponSet = ARMAS[v.weaponSet] ? v.weaponSet : 'norte';
    state.showClothes = v.showClothes !== false;
    state.clothes = {
      head: !!v.clothes?.head,
      neck: !!v.clothes?.neck,
      shirt: v.clothes?.shirt !== false,
      arms: v.clothes?.arms !== false,
      gloves: !!v.clothes?.gloves,
      pants: v.clothes?.pants !== false,
      boots: !!v.clothes?.boots,
    };
    state.showCape = !!v.cape;
    state.showTunic = !!v.tunic;
    state.equip = {
      helmet: !!v.equip?.helmet,
      neck: !!v.equip?.neck,
      torso: !!v.equip?.torso,
      arms: !!v.equip?.arms,
      gloves: !!v.equip?.gloves,
      legs: !!v.equip?.legs,
      boots: !!v.equip?.boots,
    };

    let action = v.action || 'idle';
    // El adaptador manda 'attack' para las bestias, pero el clip se llama
    // 'melee'. Sin esta linea la criatura caia a idle y no atacaba nunca.
    if (action === 'attack') action = 'melee';
    if (v.dying) action = 'death';
    else if ((v.hit || 0) > 0.001) action = 'hurt';
    state.action = CLIPS[action] ? action : 'idle';

    const clip = CLIPS[state.action];
    if (state.action === 'melee') clipT = clamp(v.attackProgress || 0, 0, 1) * clip.dur;
    else if (state.action === 'cast') clipT = clamp(v.castProgress || 0, 0, 1) * clip.dur;
    else if (state.action === 'hurt') clipT = (1 - clamp(v.hit || 0, 0, 1)) * clip.dur;
    else if (state.action === 'death') clipT = clamp(v.death || 0, 0, 1) * clip.dur;
    else {
      const actorTime = Number.isFinite(v.time) ? Math.max(0, v.time) : performance.now() / 1000;
      clipT = actorTime % clip.dur;
    }
    clipDone = false;
    updateAnim(0);
  }

  /* ── Helpers de anatomía ── */
  function pata2(a, b, c, w1, w2, col, garra) {
    seg(a.x, a.y, b.x, b.y, w1, col);
    seg(b.x, b.y, c.x, c.y, w2, shade(col, -8));
    if (garra) {
      ctx.fillStyle = garra;
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(c.x + i * 3, c.y);
        ctx.lineTo(c.x + i * 3 + 2.5, c.y + 7);
        ctx.lineTo(c.x + i * 3 - 1, c.y + 6);
        ctx.closePath();
        ctx.fill();
      }
    }
  }
  function colaSeg(x, y, n, largo, grosor, col, curva) {
    let px = x,
      py = y;
    for (let i = 0; i < n; i++) {
      const t = (i + 1) / n;
      const nx = px - largo / n,
        ny = py + Math.sin(t * 2.4 + curva * 0.12) * curva * 0.5 - t * 4;
      seg(px, py, nx, ny, grosor * (1 - t * 0.72), col);
      px = nx;
      py = ny;
    }
    return { x: px, y: py };
  }
  function alaMembrana(x, y, esc, hueso, memb, abre) {
    ctx.save();
    ctx.translate(x, y);
    const a = 0.35 + abre * 0.85;
    const p = [
      [0, 0],
      [-52 * esc * Math.cos(a), -46 * esc * Math.sin(a) - 14 * esc],
      [-88 * esc, -18 * esc - abre * 22 * esc],
      [-72 * esc, 26 * esc],
      [-34 * esc, 30 * esc],
    ];
    poly(p, memb, shade(memb, -30), 1.6);
    ctx.strokeStyle = hueso;
    ctx.lineWidth = 3.4 * esc;
    [1, 2, 3].forEach(i => {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(p[i][0], p[i][1]);
      ctx.stroke();
    });
    ctx.lineWidth = 2 * esc;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(p[4][0], p[4][1]);
    ctx.stroke();
    ctx.restore();
  }
  function craneoM(x, y, r, col, ojo, brillo) {
    ell(x, y, r, r * 1.12, col);
    poly(
      [
        [x - r * 0.5, y + r * 0.5],
        [x + r * 0.5, y + r * 0.5],
        [x + r * 0.34, y + r * 1.05],
        [x - r * 0.34, y + r * 1.05],
      ],
      shade(col, -8),
    );
    const s = r * 0.42;
    ell(x - s, y - r * 0.1, r * 0.28, r * 0.32, '#100c0a');
    ell(x + s, y - r * 0.1, r * 0.28, r * 0.32, '#100c0a');
    if (brillo > 0) {
      ell(x - s, y - r * 0.1, r * 0.2, r * 0.22, ojo);
      ell(x + s, y - r * 0.1, r * 0.2, r * 0.22, ojo);
      ell(x - s, y - r * 0.1, r * 0.42, r * 0.44, `rgba(${brillo})`);
      ell(x + s, y - r * 0.1, r * 0.42, r * 0.44, `rgba(${brillo})`);
    }
    ctx.strokeStyle = shade(col, -24);
    ctx.lineWidth = 1.2;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(x + i * r * 0.3, y + r * 0.5);
      ctx.lineTo(x + i * r * 0.26, y + r * 1.02);
      ctx.stroke();
    }
  }
  function costillas(x, y, w, h, n, col) {
    ctx.strokeStyle = col;
    ctx.lineWidth = 3.2;
    seg(x, y, x, y + h, 4.2, shade(col, -6));
    for (let i = 0; i < n; i++) {
      const yy = y + 4 + (i * (h - 6)) / n,
        ww = w * (1 - Math.abs(i - n / 2.4) / (n * 1.5));
      ctx.beginPath();
      ctx.moveTo(x, yy);
      ctx.quadraticCurveTo(x - ww, yy + 3, x - ww * 0.72, yy + 9);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, yy);
      ctx.quadraticCurveTo(x + ww, yy + 3, x + ww * 0.72, yy + 9);
      ctx.stroke();
    }
  }
  function harapos(x, y, w, h, col, sway, n = 6) {
    ctx.fillStyle = col;
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1),
        px = x - w + 2 * w * t;
      const largo = h * (0.62 + 0.38 * Math.abs(Math.sin(i * 1.7)));
      ctx.beginPath();
      ctx.moveTo(px - w / n, y);
      ctx.lineTo(px + w / n, y);
      ctx.lineTo(px + (w / n) * 0.5 + sway * t, y + largo);
      ctx.lineTo(px - (w / n) * 0.5 + sway * t, y + largo * 0.86);
      ctx.closePath();
      ctx.fill();
    }
  }
  function bruma(x, y, r, col, t, n = 5) {
    for (let i = 0; i < n; i++) {
      const a = t * 0.9 + i * 1.26;
      ell(
        x + Math.cos(a) * r * 0.5,
        y + Math.sin(a * 0.7) * r * 0.3 + i * 3,
        r * (0.66 - i * 0.09),
        r * (0.4 - i * 0.05),
        col,
      );
    }
  }
  function ojosBrillo(x, y, sep, r, col, halo) {
    ell(x - sep, y, r * 2.1, r * 2.1, halo);
    ell(x + sep, y, r * 2.1, r * 2.1, halo);
    ell(x - sep, y, r, r, col);
    ell(x + sep, y, r, r, col);
  }

  /* ── Marcha según el plan corporal ── */
  function marcha(plan) {
    const w = P.legPhase,
      base = {
        th: P.thrust,
        br: P.breath,
        bob: P.bob,
        cast: P.castCharge,
        t: clipT,
        resp: 1 + P.breath * 0.022,
      };
    if (plan === 'quad' || plan === 'dragon')
      return {
        ...base,
        patas: [w, -w, -w, w],
        pitch: w * 0.03,
        cuello: -w * 3.2,
        cola: Math.sin(clipT * 4.2) * 9 + w * 7,
        cabeza: -Math.abs(w) * 2,
      };
    if (plan === 'flota')
      return {
        ...base,
        patas: [],
        flote: Math.sin(clipT * 1.9) * 5.5,
        harapo: Math.sin(clipT * 2.3) * 8 + w * 6,
        cola: 0,
        cabeza: Math.sin(clipT * 1.6) * 1.6,
      };
    // Las piernas salen de legPhase, pero los brazos de armPhase: asi se mueven
    // tambien al respirar en idle y al cargar el golpe, no solo al caminar.
    const a = P.armPhase;
    if (plan === 'aracnido')
      return { ...base, patas: [w, -w, w * 0.6, -w * 0.6], pitch: 0, cola: 0, cabeza: -Math.abs(w) * 1.2 };
    return {
      ...base,
      patas: [w, -w],
      brazos: [-a * 0.5, a * 0.5],
      lean: P.torsoLean,
      cola: w * 5,
      cabeza: -Math.abs(w) * 1.8 - P.headY * 0.4,
    };
  }

  const MONSTRUOS = {
    /* ═════════ CUADRÚPEDOS ═════════ */
    wolf: {
      nombre: 'Lobo Fantasma',
      desc: 'Lobo gigante del Norte. Pelaje de nieve y ojos de invierno.',
      plan: 'quad',
      col: {
        body: '#ddd8d0',
        belly: '#eeeae4',
        dk: '#b4aea4',
        ojo: '#8fd0e8',
        halo: 'rgba(143,208,232,.22)',
      },
      draw(A, c) {
        const dk = c.dk;
        // patas traseras y delanteras: pares diagonales
        const P4 = [
          [-46, 14],
          [-22, 16],
          [24, 16],
          [48, 12],
        ];
        P4.forEach(([x, y], i) => {
          const o = A.patas[i] * 13;
          pata2(
            { x, y },
            { x: x + o * 0.3, y: y + 34 },
            { x: x + o * 0.62, y: y + 64 },
            10,
            8,
            dk,
            '#f2eee8',
          );
        });
        colaSeg(-52, -6, 5, 44, 11, c.body, A.cola);
        // cuerpo
        ctx.save();
        ctx.scale(1, A.resp);
        rr(-52, -24, 100, 46, 20, c.body, 'rgba(0,0,0,.22)');
        rr(-40, -6, 78, 24, 12, c.belly, 'rgba(0,0,0,.12)');
        // lomo erizado
        ctx.strokeStyle = shade(c.body, -16);
        ctx.lineWidth = 2;
        for (let x = -40; x < 34; x += 9) {
          ctx.beginPath();
          ctx.moveTo(x, -24);
          ctx.lineTo(x + 3, -32 - Math.abs(A.patas[0]) * 2);
          ctx.stroke();
        }
        ctx.restore();
        // cuello y cabeza
        const hx = 56 + A.th * 22,
          hy = -20 + A.cuello + A.cabeza;
        seg(38, -16, hx - 8, hy + 6, 26, c.body);
        ell(hx, hy, 23, 19, c.body);
        poly(
          [
            [hx + 14, hy - 4],
            [hx + 38 + A.th * 10, hy + 2],
            [hx + 14, hy + 9],
          ],
          c.body,
          'rgba(0,0,0,.2)',
          1.3,
        );
        ell(hx + 34 + A.th * 10, hy + 2, 3.4, 3, '#2a2420');
        poly(
          [
            [hx - 12, hy - 16],
            [hx - 6, hy - 38],
            [hx + 3, hy - 16],
          ],
          c.body,
          'rgba(0,0,0,.2)',
          1.2,
        );
        poly(
          [
            [hx + 8, hy - 16],
            [hx + 18, hy - 36],
            [hx + 21, hy - 14],
          ],
          c.body,
          'rgba(0,0,0,.2)',
          1.2,
        );
        ojosBrillo(hx + 8, hy - 4, 7, 2.6, c.ojo, c.halo);
        // mandíbula abierta al atacar
        if (A.th > 0.06) {
          poly(
            [
              [hx + 14, hy + 6],
              [hx + 40 + A.th * 12, hy + 10 + A.th * 12],
              [hx + 14, hy + 12],
            ],
            '#5a2028',
          );
          ctx.fillStyle = '#f6f2ec';
          for (let i = 0; i < 4; i++) {
            const tx = hx + 18 + i * 6;
            poly(
              [
                [tx, hy + 5],
                [tx + 2.4, hy + 11],
                [tx + 4.8, hy + 5],
              ],
              '#f6f2ec',
            );
          }
        }
      },
    },

    bear: {
      nombre: 'Oso de Invierno',
      desc: 'Bestia colosal de las tierras heladas. Nada la detiene.',
      plan: 'quad',
      col: { body: '#2e2820', belly: '#3e3428', dk: '#221d17', ojo: '#d8a24c', halo: 'rgba(216,162,76,.18)' },
      draw(A, c) {
        const dk = c.dk;
        const P4 = [
          [-58, 26],
          [-26, 30],
          [30, 30],
          [62, 24],
        ];
        P4.forEach(([x, y], i) => {
          const o = A.patas[i] * 15;
          pata2(
            { x, y },
            { x: x + o * 0.3, y: y + 40 },
            { x: x + o * 0.6, y: y + 74 },
            16,
            13,
            dk,
            '#cbbfa8',
          );
        });
        ctx.save();
        ctx.scale(1, A.resp);
        // giba del lomo: la marca del oso
        ctx.fillStyle = c.body;
        ctx.beginPath();
        ctx.moveTo(-72, 10);
        ctx.quadraticCurveTo(-40, -46, 0, -38);
        ctx.quadraticCurveTo(46, -32, 74, 4);
        ctx.lineTo(74, 30);
        ctx.lineTo(-72, 34);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,.24)';
        ctx.lineWidth = 1.6;
        ctx.stroke();
        rr(-56, 2, 112, 28, 12, c.belly, 'rgba(0,0,0,.14)');
        ctx.restore();
        const hx = 82 + A.th * 26,
          hy = -6 + A.cuello * 0.6 + A.cabeza;
        seg(58, -14, hx - 10, hy - 4, 34, c.body);
        ell(hx, hy, 32, 28, c.body);
        ell(hx + 22, hy + 10, 15, 12, shade(c.body, 10));
        ell(hx + 34, hy + 12, 4, 3.4, '#17120f');
        ell(hx - 8, hy - 26, 10, 9, c.body);
        ell(hx + 18, hy - 26, 10, 9, c.body);
        ojosBrillo(hx + 12, hy - 4, 9, 3, c.ojo, c.halo);
        if (A.th > 0.06) {
          poly(
            [
              [hx + 16, hy + 14],
              [hx + 40 + A.th * 14, hy + 20],
              [hx + 16, hy + 22],
            ],
            '#4a1820',
          );
          ctx.fillStyle = '#e8e0cc';
          [0, 1, 2].forEach(i =>
            poly(
              [
                [hx + 20 + i * 7, hy + 13],
                [hx + 23 + i * 7, hy + 20],
                [hx + 26 + i * 7, hy + 13],
              ],
              '#e8e0cc',
            ),
          );
          // zarpazo
          seg(hx - 30, hy + 30, hx + 18 + A.th * 30, hy + 6 - A.th * 24, 13, dk);
        }
      },
    },

    drake: {
      nombre: 'Drake',
      desc: 'Reptil de las cuevas. Alas cortas, no vuela: acecha.',
      plan: 'quad',
      col: {
        body: '#4a6650',
        belly: '#7a8c62',
        dk: '#33463a',
        ojo: '#e8c24c',
        halo: 'rgba(232,194,76,.2)',
        memb: '#5c4030',
      },
      draw(A, c) {
        const dk = c.dk;
        colaSeg(-56, -4, 7, 72, 14, c.body, A.cola * 1.4);
        const P4 = [
          [-40, 16],
          [-14, 20],
          [26, 20],
          [50, 14],
        ];
        P4.forEach(([x, y], i) => {
          const o = A.patas[i] * 12;
          pata2(
            { x, y },
            { x: x + o * 0.3 - 4, y: y + 32 },
            { x: x + o * 0.58, y: y + 58 },
            11,
            9,
            dk,
            '#d8cc9c',
          );
        });
        // alas cortas plegadas
        [
          [-6, -26],
          [14, -24],
        ].forEach(([x, y], i) => {
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(-0.5 + A.th * 0.5 + i * 0.14);
          alaMembrana(0, 0, 0.42, dk, c.memb, 0.12 + A.th * 0.4);
          ctx.restore();
        });
        ctx.save();
        ctx.scale(1, A.resp);
        ctx.fillStyle = c.body;
        ctx.beginPath();
        ctx.moveTo(-54, -6);
        ctx.quadraticCurveTo(-16, -32, 22, -28);
        ctx.quadraticCurveTo(48, -24, 58, -4);
        ctx.lineTo(56, 20);
        ctx.lineTo(-52, 22);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,.26)';
        ctx.lineWidth = 1.6;
        ctx.stroke();
        rr(-42, 0, 88, 20, 9, c.belly, 'rgba(0,0,0,.12)');
        // escudetes del lomo
        ctx.fillStyle = dk;
        for (let x = -46; x < 48; x += 11)
          poly(
            [
              [x, -24],
              [x + 5, -34 - Math.abs(A.patas[1]) * 2],
              [x + 10, -24],
            ],
            dk,
          );
        ctx.restore();
        const hx = 68 + A.th * 24,
          hy = -18 + A.cuello + A.cabeza;
        seg(50, -14, hx - 8, hy + 4, 20, c.body);
        ell(hx, hy, 20, 15, c.body);
        poly(
          [
            [hx + 12, hy - 2],
            [hx + 40 + A.th * 12, hy + 4],
            [hx + 12, hy + 10],
          ],
          c.body,
          'rgba(0,0,0,.22)',
          1.3,
        );
        poly(
          [
            [hx - 6, hy - 12],
            [hx + 2, hy - 30],
            [hx + 10, hy - 12],
          ],
          dk,
        );
        poly(
          [
            [hx + 8, hy - 11],
            [hx + 18, hy - 26],
            [hx + 20, hy - 9],
          ],
          dk,
        );
        ojosBrillo(hx + 8, hy - 3, 6, 2.4, c.ojo, c.halo);
        if (A.th > 0.06) {
          poly(
            [
              [hx + 12, hy + 6],
              [hx + 42 + A.th * 14, hy + 14 + A.th * 10],
              [hx + 12, hy + 13],
            ],
            '#3a1418',
          );
          ctx.fillStyle = '#e2d8a8';
          [0, 1, 2, 3].forEach(i =>
            poly(
              [
                [hx + 16 + i * 6, hy + 5],
                [hx + 18 + i * 6, hy + 12],
                [hx + 21 + i * 6, hy + 5],
              ],
              '#e2d8a8',
            ),
          );
        }
      },
    },

    dragon: {
      nombre: 'Dragón',
      desc: 'Señor del cielo. Cuello largo, alas de tormenta, aliento de fuego.',
      plan: 'dragon',
      col: {
        body: '#5a2030',
        belly: '#8c4a3c',
        dk: '#3e1420',
        ojo: '#f0c040',
        halo: 'rgba(240,192,64,.24)',
        memb: '#7a2c30',
      },
      draw(A, c) {
        const dk = c.dk;
        colaSeg(-72, -14, 9, 110, 17, c.body, A.cola * 1.7);
        // ala trasera
        ctx.save();
        ctx.translate(-18, -52);
        ctx.rotate(-0.34 + A.th * 0.34 + A.br * 0.05);
        alaMembrana(0, 0, 0.92, dk, shade(c.memb, -16), 0.5 + A.br * 0.16 + A.th * 0.3);
        ctx.restore();
        const P4 = [
          [-44, 26],
          [-16, 30],
          [28, 30],
          [54, 24],
        ];
        P4.forEach(([x, y], i) => {
          const o = A.patas[i] * 14;
          pata2(
            { x, y },
            { x: x + o * 0.3 - 4, y: y + 42 },
            { x: x + o * 0.58, y: y + 76 },
            15,
            12,
            dk,
            '#e8dcae',
          );
        });
        ctx.save();
        ctx.scale(1, A.resp);
        ctx.fillStyle = c.body;
        ctx.beginPath();
        ctx.moveTo(-70, -18);
        ctx.quadraticCurveTo(-24, -58, 20, -52);
        ctx.quadraticCurveTo(56, -46, 68, -14);
        ctx.lineTo(64, 30);
        ctx.lineTo(-66, 32);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,.28)';
        ctx.lineWidth = 1.8;
        ctx.stroke();
        rr(-52, 2, 104, 28, 10, c.belly, 'rgba(0,0,0,.14)');
        ctx.strokeStyle = shade(c.belly, -14);
        ctx.lineWidth = 1.4;
        for (let x = -46; x < 48; x += 10) {
          ctx.beginPath();
          ctx.moveTo(x, 4);
          ctx.lineTo(x, 28);
          ctx.stroke();
        }
        ctx.fillStyle = dk;
        for (let x = -60; x < 58; x += 12)
          poly(
            [
              [x, -48],
              [x + 6, -62 - Math.abs(A.patas[1]) * 3],
              [x + 12, -48],
            ],
            dk,
          );
        ctx.restore();
        // ala delantera, sobre el cuerpo
        ctx.save();
        ctx.translate(6, -56);
        ctx.rotate(-0.44 + A.th * 0.4 + A.br * 0.06);
        alaMembrana(0, 0, 1.06, shade(dk, 10), c.memb, 0.56 + A.br * 0.18 + A.th * 0.34);
        ctx.restore();
        // cuello largo y cabeza
        const hx = 104 + A.th * 30,
          hy = -72 + A.cuello * 1.6 + A.cabeza;
        ctx.strokeStyle = c.body;
        ctx.lineWidth = 26;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(56, -40);
        ctx.quadraticCurveTo(88, -52, hx - 12, hy + 8);
        ctx.stroke();
        ctx.fillStyle = dk;
        for (let i = 1; i < 5; i++) {
          const t = i / 5,
            x = 56 + (hx - 12 - 56) * t,
            y = -40 + (hy + 8 + 40) * t - 8;
          poly(
            [
              [x - 4, y],
              [x, y - 11],
              [x + 4, y],
            ],
            dk,
          );
        }
        ell(hx, hy, 24, 17, c.body);
        poly(
          [
            [hx + 14, hy - 2],
            [hx + 48 + A.th * 14, hy + 6],
            [hx + 14, hy + 12],
          ],
          c.body,
          'rgba(0,0,0,.24)',
          1.4,
        );
        // cuernos
        poly(
          [
            [hx - 8, hy - 14],
            [hx - 18, hy - 40],
            [hx + 2, hy - 16],
          ],
          dk,
        );
        poly(
          [
            [hx + 6, hy - 14],
            [hx + 4, hy - 42],
            [hx + 16, hy - 14],
          ],
          dk,
        );
        ojosBrillo(hx + 10, hy - 4, 7, 2.8, c.ojo, c.halo);
        if (A.th > 0.06) {
          poly(
            [
              [hx + 14, hy + 8],
              [hx + 50 + A.th * 16, hy + 20 + A.th * 12],
              [hx + 14, hy + 16],
            ],
            '#40101a',
          );
          ctx.fillStyle = '#f2e6bc';
          [0, 1, 2, 3, 4].forEach(i =>
            poly(
              [
                [hx + 18 + i * 7, hy + 7],
                [hx + 21 + i * 7, hy + 15],
                [hx + 24 + i * 7, hy + 7],
              ],
              '#f2e6bc',
            ),
          );
        }
        // aliento de fuego al conjurar
        if (A.cast > 0.02) {
          const g = A.cast;
          for (let i = 0; i < 5; i++) {
            const d = 30 + i * 26 * g;
            ell(
              hx + 22 + d,
              hy + 8 + i * 3,
              16 * g + i * 3,
              11 * g + i * 2,
              `rgba(${240 - i * 20},${140 - i * 18},40,${0.5 * g * (1 - i * 0.16)})`,
            );
          }
        }
      },
    },

    /* ═════════ BÍPEDOS ═════════ */
    troll: {
      nombre: 'Gigante',
      desc: 'Gigante de más allá del Muro. Brazos que arrancan puertas.',
      plan: 'biped',
      col: {
        body: '#5c6858',
        belly: '#6a7865',
        dk: '#414c40',
        ojo: '#e8d08c',
        halo: 'rgba(232,208,140,.16)',
      },
      draw(A, c) {
        const dk = c.dk;
        // piernas gruesas
        A.patas.forEach((o, i) => {
          const x = i ? 20 : -20;
          pata2({ x, y: 48 }, { x: x + o * 4, y: 96 }, { x: x + o * 7, y: 132 }, 19, 16, dk, '#cbbfa8');
        });
        ctx.save();
        ctx.scale(1, A.resp);
        // torso encorvado
        ctx.fillStyle = c.body;
        ctx.beginPath();
        ctx.moveTo(-42, -58);
        ctx.quadraticCurveTo(-52, 0, -38, 52);
        ctx.lineTo(38, 52);
        ctx.quadraticCurveTo(52, 0, 42, -58);
        ctx.quadraticCurveTo(0, -76, -42, -58);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,.26)';
        ctx.lineWidth = 1.8;
        ctx.stroke();
        rr(-30, -16, 60, 52, 16, c.belly, 'rgba(0,0,0,.14)');
        ctx.restore();
        // brazos largos, casi al suelo
        A.brazos.forEach((o, i) => {
          const s = i ? 1 : -1;
          const th = i ? A.th : A.th * 0.35;
          pata2(
            { x: s * 38, y: -42 },
            { x: s * (60 + th * 22), y: 6 + o * 6 },
            { x: s * (66 + th * 40), y: 52 - th * 36 },
            17,
            14,
            c.body,
            '#cbbfa8',
          );
        });
        // cabeza chica y hundida entre los hombros
        const hx = 6,
          hy = -74 + A.cabeza;
        ell(hx, hy, 25, 21, c.body);
        poly(
          [
            [hx - 14, hy + 12],
            [hx + 14, hy + 12],
            [hx + 9, hy + 22],
            [hx - 9, hy + 22],
          ],
          shade(c.body, -8),
        );
        ojosBrillo(hx + 2, hy - 3, 8, 2.6, c.ojo, c.halo);
        // colmillos inferiores
        poly(
          [
            [hx - 8, hy + 14],
            [hx - 10, hy + 3],
            [hx - 4, hy + 14],
          ],
          '#e2dcc4',
        );
        poly(
          [
            [hx + 8, hy + 14],
            [hx + 10, hy + 3],
            [hx + 4, hy + 14],
          ],
          '#e2dcc4',
        );
        if (A.th > 0.06) ell(hx + 2, hy + 16, 9 + A.th * 5, 6 + A.th * 4, '#3a2028');
      },
    },

    orc: {
      nombre: 'Orco',
      desc: 'Guerrero de los clanes. Músculo, colmillos y hierro robado.',
      plan: 'biped',
      col: {
        body: '#5e7048',
        belly: '#6e8054',
        dk: '#43522f',
        ojo: '#e05038',
        halo: 'rgba(224,80,56,.2)',
        cuero: '#4a3524',
        metal: '#7a8288',
      },
      draw(A, c) {
        const dk = c.dk;
        A.patas.forEach((o, i) => {
          const x = i ? 15 : -15;
          pata2({ x, y: 40 }, { x: x + o * 3.4, y: 82 }, { x: x + o * 6, y: 116 }, 15, 12, dk, '#cbbfa8');
        });
        // faldón de cuero
        ctx.save();
        ctx.scale(1, A.resp);
        ctx.fillStyle = c.body;
        ctx.beginPath();
        ctx.moveTo(-34, -52);
        ctx.quadraticCurveTo(-42, -6, -30, 42);
        ctx.lineTo(30, 42);
        ctx.quadraticCurveTo(42, -6, 34, -52);
        ctx.quadraticCurveTo(0, -66, -34, -52);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,.26)';
        ctx.lineWidth = 1.7;
        ctx.stroke();
        // pectoral marcado
        ctx.strokeStyle = shade(c.body, -18);
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(0, -46);
        ctx.lineTo(0, -8);
        ctx.stroke();
        rr(-24, -12, 48, 40, 10, c.belly, 'rgba(0,0,0,.12)');
        ctx.restore();
        harapos(0, 36, 30, 26, c.cuero, A.patas[0] * 4, 5);
        // hombrera de hierro robado en un solo hombro
        poly(
          [
            [16, -58],
            [42, -50],
            [38, -30],
            [14, -38],
          ],
          c.metal,
          'rgba(20,14,11,.5)',
          1.4,
        );
        ctx.fillStyle = shade(c.metal, 18);
        [
          [26, -50],
          [32, -40],
        ].forEach(([x, y]) => {
          ctx.beginPath();
          ctx.arc(x, y, 1.9, 0, Math.PI * 2);
          ctx.fill();
        });
        A.brazos.forEach((o, i) => {
          const s = i ? 1 : -1;
          const th = i ? A.th : A.th * 0.3;
          pata2(
            { x: s * 30, y: -44 },
            { x: s * (46 + th * 18), y: -6 + o * 5 },
            { x: s * (52 + th * 34), y: 32 - th * 30 },
            14,
            12,
            c.body,
            '#cbbfa8',
          );
        });
        // cabeza con mandíbula pesada
        const hx = 2,
          hy = -70 + A.cabeza;
        ell(hx, hy, 21, 19, c.body);
        poly(
          [
            [hx - 15, hy + 8],
            [hx + 15, hy + 8],
            [hx + 11, hy + 21],
            [hx - 11, hy + 21],
          ],
          shade(c.body, -6),
        );
        // colmillos hacia arriba
        poly(
          [
            [hx - 9, hy + 18],
            [hx - 12, hy + 3],
            [hx - 5, hy + 18],
          ],
          '#e8e2ca',
        );
        poly(
          [
            [hx + 9, hy + 18],
            [hx + 12, hy + 3],
            [hx + 5, hy + 18],
          ],
          '#e8e2ca',
        );
        ojosBrillo(hx + 1, hy - 4, 7, 2.3, c.ojo, c.halo);
        // cresta de pelo
        ctx.fillStyle = '#2a2018';
        poly(
          [
            [hx - 3, hy - 16],
            [hx, hy - 32],
            [hx + 4, hy - 16],
          ],
          '#2a2018',
        );
        if (A.th > 0.06) ell(hx + 1, hy + 13, 8 + A.th * 4, 5 + A.th * 3, '#3a1418');
      },
    },

    ghoul: {
      nombre: 'Gul',
      desc: 'Devorador de tumbas. Camina a cuatro patas cuando tiene hambre.',
      plan: 'biped',
      col: { body: '#9aa08a', belly: '#b0b49c', dk: '#6e7462', ojo: '#c8e058', halo: 'rgba(200,224,88,.22)' },
      draw(A, c) {
        const dk = c.dk;
        // encorvado hacia adelante: el torso casi horizontal
        ctx.save();
        ctx.rotate(0.2);
        A.patas.forEach((o, i) => {
          const x = i ? 12 : -14;
          pata2({ x, y: 34 }, { x: x + o * 4, y: 74 }, { x: x + o * 7, y: 106 }, 12, 10, dk, '#e2eab0');
        });
        ctx.save();
        ctx.scale(1, A.resp);
        ctx.fillStyle = c.body;
        ctx.beginPath();
        ctx.moveTo(-26, -44);
        ctx.quadraticCurveTo(-36, -6, -24, 34);
        ctx.lineTo(24, 34);
        ctx.quadraticCurveTo(34, -6, 26, -44);
        ctx.quadraticCurveTo(0, -54, -26, -44);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,.28)';
        ctx.lineWidth = 1.6;
        ctx.stroke();
        // costillas marcadas bajo la piel
        ctx.strokeStyle = shade(c.body, -22);
        ctx.lineWidth = 1.4;
        [-30, -20, -10, 0].forEach(y => {
          ctx.beginPath();
          ctx.moveTo(-20, y);
          ctx.quadraticCurveTo(0, y + 5, 20, y);
          ctx.stroke();
        });
        ctx.restore();
        // brazos larguísimos con garras
        A.brazos.forEach((o, i) => {
          const s = i ? 1 : -1;
          const th = i ? A.th : A.th * 0.4;
          seg(s * 24, -38, s * (44 + th * 24), -2 + o * 7, 11, c.body);
          seg(s * (44 + th * 24), -2 + o * 7, s * (54 + th * 46), 44 - th * 40, 9, shade(c.body, -8));
          ctx.fillStyle = '#e2eab0';
          for (let k = -1; k <= 1; k++) {
            const gx = s * (54 + th * 46) + k * 4,
              gy = 44 - th * 40;
            poly(
              [
                [gx, gy],
                [gx + s * 3, gy + 13],
                [gx - s * 1.5, gy + 11],
              ],
              '#e2eab0',
            );
          }
        });
        // cabeza calva, boca enorme
        const hx = 8 + A.th * 10,
          hy = -58 + A.cabeza;
        ell(hx, hy, 18, 17, c.body);
        ell(hx + 9, hy + 7, 11, 9, shade(c.body, 4));
        ojosBrillo(hx + 5, hy - 4, 6, 2.2, c.ojo, c.halo);
        // sin nariz, solo huecos
        ell(hx + 13, hy + 2, 1.6, 2.2, '#3a4034');
        if (A.th > 0.05) {
          poly(
            [
              [hx + 4, hy + 10],
              [hx + 26 + A.th * 14, hy + 16 + A.th * 10],
              [hx + 4, hy + 18],
            ],
            '#3a1420',
          );
          ctx.fillStyle = '#eef2d0';
          for (let i = 0; i < 5; i++)
            poly(
              [
                [hx + 7 + i * 5, hy + 9],
                [hx + 9 + i * 5, hy + 17],
                [hx + 11 + i * 5, hy + 9],
              ],
              '#eef2d0',
            );
        }
        ctx.restore();
      },
    },

    zombie: {
      nombre: 'Caminante Blanco',
      desc: 'No-muerto de hielo. Lo que toca, se levanta.',
      plan: 'biped',
      col: {
        body: '#9ab0c8',
        belly: '#b8ccd8',
        dk: '#6a8298',
        ojo: '#7ff0ff',
        halo: 'rgba(127,240,255,.3)',
        trapo: '#3a4652',
      },
      draw(A, c) {
        const dk = c.dk;
        // marcha desigual: una pierna arrastra
        pata2(
          { x: -14, y: 38 },
          { x: -16 + A.patas[0] * 2, y: 80 },
          { x: -18 + A.patas[0] * 3, y: 114 },
          13,
          11,
          dk,
          '#d8e8f0',
        );
        pata2(
          { x: 13, y: 38 },
          { x: 15 + A.patas[1] * 5, y: 78 },
          { x: 18 + A.patas[1] * 9, y: 112 },
          13,
          11,
          dk,
          '#d8e8f0',
        );
        ctx.save();
        ctx.scale(1, A.resp);
        ctx.fillStyle = c.body;
        ctx.beginPath();
        ctx.moveTo(-27, -48);
        ctx.quadraticCurveTo(-34, -4, -24, 36);
        ctx.lineTo(25, 36);
        ctx.quadraticCurveTo(34, -4, 27, -48);
        ctx.quadraticCurveTo(0, -60, -27, -48);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,.26)';
        ctx.lineWidth = 1.6;
        ctx.stroke();
        // torso abierto: se ven costillas de hielo
        costillas(2, -40, 17, 44, 5, '#cfe2ec');
        ctx.restore();
        harapos(0, 30, 26, 30, c.trapo, A.harapo || A.patas[0] * 5, 5);
        // brazos rígidos hacia adelante
        A.brazos.forEach((o, i) => {
          const s = i ? 1 : -1;
          const th = i ? A.th : A.th * 0.5;
          seg(s * 23, -40, s * (38 + th * 20), -16 + o * 4, 11, c.body);
          seg(s * (38 + th * 20), -16 + o * 4, s * (48 + th * 38), 12 - th * 20, 9, shade(c.body, -6));
          ctx.fillStyle = '#d8e8f0';
          for (let k = -1; k <= 1; k++) {
            const gx = s * (48 + th * 38) + k * 3.4,
              gy = 12 - th * 20;
            poly(
              [
                [gx, gy],
                [gx + s * 2.6, gy + 10],
                [gx - s * 1.2, gy + 9],
              ],
              '#d8e8f0',
            );
          }
        });
        const hx = 2,
          hy = -64 + A.cabeza;
        ell(hx, hy, 19, 20, c.body);
        // pómulos hundidos
        ctx.strokeStyle = dk;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(hx - 13, hy + 2);
        ctx.lineTo(hx - 7, hy + 8);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(hx + 13, hy + 2);
        ctx.lineTo(hx + 7, hy + 8);
        ctx.stroke();
        ojosBrillo(hx, hy - 3, 7, 3, c.ojo, c.halo);
        poly(
          [
            [hx - 7, hy + 12],
            [hx + 7, hy + 12],
            [hx + 5, hy + 19],
            [hx - 5, hy + 19],
          ],
          '#2e3a44',
        );
        if (A.cast > 0.02) bruma(hx, hy, 16 + A.cast * 10, `rgba(127,240,255,${0.16 * A.cast})`, A.t);
      },
    },

    skeleton: {
      nombre: 'Espectro',
      desc: 'Esqueleto reanimado. Sostenido por rencor y nada más.',
      plan: 'biped',
      col: {
        body: '#c8ccd0',
        belly: '#dce0e4',
        dk: '#9aa0a6',
        ojo: '#6880a0',
        halo: 'rgba(104,128,160,.28)',
      },
      draw(A, c) {
        const h = c.body;
        A.patas.forEach((o, i) => {
          const x = i ? 9 : -9;
          seg(x, 26, x + o * 4, 70, 8, h);
          seg(x + o * 4, 70, x + o * 7, 108, 6.5, h);
          ell(x + o * 7, 110, 7, 3.4, c.dk);
        });
        // pelvis
        poly(
          [
            [-13, 20],
            [13, 20],
            [10, 32],
            [-10, 32],
          ],
          c.dk,
        );
        // columna y costillar
        seg(0, -34, 0, 22, 6, h);
        costillas(0, -36, 19, 46, 6, h);
        // clavículas
        seg(-17, -40, 17, -40, 4, h);
        A.brazos.forEach((o, i) => {
          const s = i ? 1 : -1;
          const th = i ? A.th : A.th * 0.4;
          seg(s * 17, -40, s * (30 + th * 16), -8 + o * 5, 7, h);
          seg(s * (30 + th * 16), -8 + o * 5, s * (38 + th * 32), 26 - th * 26, 6, h);
          ell(s * (38 + th * 32), 28 - th * 26, 4.4, 4, h);
        });
        craneoM(0, -52 + A.cabeza, 15, h, c.ojo, '104,128,160,.34');
        if (A.cast > 0.02) bruma(0, -52, 15 + A.cast * 9, `rgba(104,128,160,${0.2 * A.cast})`, A.t);
      },
    },

    boneMage: {
      nombre: 'Mago de Hueso',
      desc: 'Tejió su propio esqueleto con los de otros. Cobra el favor.',
      plan: 'biped',
      col: {
        body: '#cfc7b4',
        belly: '#e0d8c4',
        dk: '#9c9482',
        ojo: '#a86ce0',
        halo: 'rgba(168,108,224,.3)',
        tunica: '#2e2438',
        franja: '#6a4a8c',
      },
      draw(A, c) {
        const h = c.body;
        // túnica larga que tapa las piernas
        ctx.save();
        ctx.scale(1, A.resp);
        ctx.fillStyle = c.tunica;
        ctx.beginPath();
        ctx.moveTo(-24, -42);
        ctx.quadraticCurveTo(-34, 10, -32, 72);
        ctx.quadraticCurveTo(0, 84, 32, 72);
        ctx.quadraticCurveTo(34, 10, 24, -42);
        ctx.quadraticCurveTo(0, -54, -24, -42);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,.34)';
        ctx.lineWidth = 1.7;
        ctx.stroke();
        // franja vertical
        poly(
          [
            [-6, -44],
            [6, -44],
            [7, 70],
            [-7, 70],
          ],
          c.franja,
          'rgba(0,0,0,.3)',
          1.2,
        );
        ctx.strokeStyle = shade(c.tunica, -18);
        ctx.lineWidth = 1.3;
        [-18, -10, 10, 18].forEach(x => {
          ctx.beginPath();
          ctx.moveTo(x * 0.8, -20);
          ctx.quadraticCurveTo(x, 30, x * 1.3, 70);
          ctx.stroke();
        });
        ctx.restore();
        // amuletos de hueso al cinto
        [-14, 0, 14].forEach((x, i) => {
          const sw = Math.sin(A.t * 2.2 + i) * 2;
          seg(x, 10, x + sw, 24, 1.4, '#8a7a5e');
          ell(x + sw, 27, 3.4, 4, h);
        });
        // brazos esqueléticos que salen de las mangas
        A.brazos.forEach((o, i) => {
          const s = i ? 1 : -1;
          const cast = A.cast * (i ? 1 : 0.5);
          poly(
            [
              [s * 20, -44],
              [s * 34, -38],
              [s * 32, -4],
              [s * 18, -8],
            ],
            c.tunica,
            'rgba(0,0,0,.3)',
            1.3,
          );
          seg(s * 30, -14, s * (38 + cast * 10), 6 - cast * 40, 6, h);
          ell(s * (38 + cast * 10), 8 - cast * 40, 4.4, 4, h);
        });
        craneoM(0, -56 + A.cabeza, 15, h, c.ojo, '168,108,224,.36');
        // capucha caída hacia atrás
        poly(
          [
            [-20, -46],
            [-16, -62],
            [16, -62],
            [20, -46],
            [0, -40],
          ],
          shade(c.tunica, 10),
          'rgba(0,0,0,.3)',
          1.3,
        );
        if (A.cast > 0.02) {
          const g = A.cast;
          for (let i = 0; i < 4; i++) {
            const a = A.t * 2.4 + i * 1.57,
              r = 22 + g * 22;
            ell(
              Math.cos(a) * r,
              -40 + Math.sin(a) * r * 0.6,
              5 * g + 2,
              5 * g + 2,
              `rgba(168,108,224,${0.5 * g})`,
            );
          }
          ell(0, -40, 26 * g, 26 * g, `rgba(168,108,224,${0.12 * g})`);
        }
      },
    },

    wraith: {
      nombre: 'Wraith',
      desc: 'No tiene pies porque no los necesita. Lo que toca, se apaga.',
      plan: 'flota',
      col: {
        body: '#3a4050',
        belly: '#4a5264',
        dk: '#242a36',
        ojo: '#c8f0ff',
        halo: 'rgba(200,240,255,.34)',
        trapo: '#2a3040',
      },
      draw(A, c) {
        ctx.save();
        ctx.translate(0, A.flote);
        // cola de bruma en vez de piernas
        for (let i = 0; i < 6; i++) {
          const t = i / 5,
            y = 30 + i * 15,
            w = 26 - i * 3.6;
          ell(
            Math.sin(A.t * 1.6 + i * 0.8) * (4 + i * 2.2),
            y,
            w,
            10 - i * 1.2,
            `rgba(58,64,80,${0.5 - t * 0.44})`,
          );
        }
        // manto
        ctx.save();
        ctx.scale(1, A.resp);
        ctx.fillStyle = c.body;
        ctx.beginPath();
        ctx.moveTo(-30, -48);
        ctx.quadraticCurveTo(-42, -4, -34, 40);
        ctx.quadraticCurveTo(0, 52, 34, 40);
        ctx.quadraticCurveTo(42, -4, 30, -48);
        ctx.quadraticCurveTo(0, -62, -30, -48);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,.36)';
        ctx.lineWidth = 1.7;
        ctx.stroke();
        ctx.restore();
        harapos(0, 36, 30, 32, c.trapo, A.harapo, 6);
        // mangas vacías que se deshilachan
        A.brazos ? A.brazos.forEach(() => {}) : null;
        [-1, 1].forEach((s, i) => {
          const th = i ? A.th : A.th * 0.4;
          poly(
            [
              [s * 24, -46],
              [s * (40 + th * 22), -24],
              [s * (36 + th * 26), 4],
              [s * 18, -10],
            ],
            c.body,
            'rgba(0,0,0,.3)',
            1.3,
          );
          // garra de bruma
          ctx.fillStyle = `rgba(200,240,255,${0.32 + th * 0.4})`;
          for (let k = -1; k <= 1; k++) {
            const gx = s * (38 + th * 30) + k * 3.4,
              gy = 6 - th * 22;
            poly(
              [
                [gx, gy],
                [gx + s * 3, gy + 13],
                [gx - s * 1.5, gy + 11],
              ],
              `rgba(200,240,255,${0.3 + th * 0.4})`,
            );
          }
        });
        // capucha vacía: solo dos luces adentro
        poly(
          [
            [-21, -44],
            [-23, -64],
            [0, -76],
            [23, -64],
            [21, -44],
            [0, -38],
          ],
          shade(c.body, -14),
          'rgba(0,0,0,.4)',
          1.6,
        );
        poly(
          [
            [-15, -44],
            [-16, -60],
            [0, -69],
            [16, -60],
            [15, -44],
            [0, -40],
          ],
          'rgba(4,6,10,.9)',
        );
        ojosBrillo(0, -54 + A.cabeza, 7, 2.8, c.ojo, c.halo);
        bruma(0, -54, 15, `rgba(200,240,255,.08)`, A.t, 4);
        if (A.cast > 0.02) bruma(0, -40, 26 + A.cast * 14, `rgba(200,240,255,${0.14 * A.cast})`, A.t, 6);
        ctx.restore();
      },
    },

    lich: {
      nombre: 'Lich',
      desc: 'Renunció a morir y guarda el precio en una caja. Flota porque puede.',
      plan: 'flota',
      col: {
        body: '#d4ccb8',
        belly: '#e4dcc8',
        dk: '#9c9480',
        ojo: '#58e0c0',
        halo: 'rgba(88,224,192,.34)',
        tunica: '#1e2634',
        franja: '#2e6a5c',
        oro: '#c9a84c',
      },
      draw(A, c) {
        const h = c.body;
        ctx.save();
        ctx.translate(0, A.flote);
        // manto largo que se deshace abajo
        ctx.save();
        ctx.scale(1, A.resp);
        ctx.fillStyle = c.tunica;
        ctx.beginPath();
        ctx.moveTo(-28, -46);
        ctx.quadraticCurveTo(-42, 4, -36, 62);
        ctx.quadraticCurveTo(0, 76, 36, 62);
        ctx.quadraticCurveTo(42, 4, 28, -46);
        ctx.quadraticCurveTo(0, -60, -28, -46);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,.38)';
        ctx.lineWidth = 1.8;
        ctx.stroke();
        poly(
          [
            [-8, -48],
            [8, -48],
            [9, 60],
            [-9, 60],
          ],
          c.franja,
          'rgba(0,0,0,.32)',
          1.3,
        );
        ctx.strokeStyle = c.oro;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(-30, 12);
        ctx.quadraticCurveTo(0, 22, 30, 12);
        ctx.stroke();
        ctx.restore();
        harapos(0, 58, 34, 26, shade(c.tunica, -8), A.harapo * 0.7, 7);
        // hombreras de oro
        [-1, 1].forEach(s => {
          poly(
            [
              [s * 20, -52],
              [s * 40, -44],
              [s * 36, -26],
              [s * 18, -34],
            ],
            c.oro,
            'rgba(60,40,10,.5)',
            1.4,
          );
          ell(s * 29, -38, 2.6, 2.6, '#f0d878');
        });
        // brazos de hueso
        [-1, 1].forEach((s, i) => {
          const cast = A.cast * (i ? 1 : 0.45);
          poly(
            [
              [s * 22, -46],
              [s * 36, -38],
              [s * 33, -6],
              [s * 19, -12],
            ],
            c.tunica,
            'rgba(0,0,0,.32)',
            1.3,
          );
          seg(s * 32, -16, s * (41 + cast * 12), 4 - cast * 46, 6, h);
          ell(s * (41 + cast * 12), 6 - cast * 46, 4.6, 4.2, h);
        });
        craneoM(0, -58 + A.cabeza, 16, h, c.ojo, '88,224,192,.4');
        // corona
        ctx.fillStyle = c.oro;
        poly(
          [
            [-15, -72],
            [15, -72],
            [13, -64],
            [-13, -64],
          ],
          c.oro,
          'rgba(60,40,10,.5)',
          1.2,
        );
        [-11, -4, 4, 11].forEach((x, i) =>
          poly(
            [
              [x - 3, -72],
              [x, -72 - (i % 2 ? 11 : 7)],
              [x + 3, -72],
            ],
            c.oro,
          ),
        );
        ell(0, -84, 3, 3.4, '#58e0c0');
        if (A.cast > 0.02) {
          const g = A.cast;
          for (let i = 0; i < 5; i++) {
            const a = A.t * 2.1 + i * 1.26,
              r = 26 + g * 26;
            ell(
              Math.cos(a) * r,
              -44 + Math.sin(a) * r * 0.55,
              5.5 * g + 2,
              5.5 * g + 2,
              `rgba(88,224,192,${0.52 * g})`,
            );
          }
          ell(0, -44, 30 * g, 30 * g, `rgba(88,224,192,${0.12 * g})`);
        }
        ctx.restore();
      },
    },
  };
  /* ── Dos criaturas que el juego ya spawnea y el catalogo no cubria ── */
  Object.assign(MONSTRUOS, {
    boar: {
      nombre: 'Jabalí Montaraz',
      desc: 'Bajo, macizo y de mal genio. Carga sin avisar.',
      plan: 'quad',
      col: {
        body: '#6b5240',
        belly: '#7e6450',
        dk: '#4a3628',
        ojo: '#d88030',
        halo: 'rgba(216,128,48,.2)',
        cerda: '#2e2118',
        marfil: '#e8e0c8',
      },
      draw(A, c) {
        const dk = c.dk;
        const P4 = [
          [-32, 22],
          [-12, 26],
          [20, 26],
          [38, 22],
        ];
        P4.forEach(([x, y], i) => {
          const o = A.patas[i] * 9;
          pata2(
            { x, y },
            { x: x + o * 0.3, y: y + 26 },
            { x: x + o * 0.55, y: y + 48 },
            10,
            8,
            dk,
            '#cfc7ae',
          );
        });
        colaSeg(-38, 2, 3, 20, 7, dk, A.cola * 0.5);
        ctx.save();
        ctx.scale(1, A.resp);
        // cuerpo en cuna: alto en los hombros, bajo en la cadera
        ctx.fillStyle = c.body;
        ctx.beginPath();
        ctx.moveTo(-40, 4);
        ctx.quadraticCurveTo(-24, -26, 6, -30);
        ctx.quadraticCurveTo(34, -32, 44, -8);
        ctx.lineTo(42, 24);
        ctx.lineTo(-38, 26);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,.26)';
        ctx.lineWidth = 1.6;
        ctx.stroke();
        rr(-30, 6, 66, 18, 8, c.belly, 'rgba(0,0,0,.12)');
        // cerda erizada del lomo
        ctx.strokeStyle = c.cerda;
        ctx.lineWidth = 2.2;
        for (let x = -30; x < 32; x += 7) {
          ctx.beginPath();
          ctx.moveTo(x, -28);
          ctx.lineTo(x + 2, -42 - Math.abs(A.patas[0]) * 3);
          ctx.stroke();
        }
        ctx.restore();
        // cabeza baja, hocico largo
        const hx = 54 + A.th * 22,
          hy = 2 + A.cuello * 0.5 + A.cabeza;
        seg(38, -8, hx - 6, hy - 4, 26, c.body);
        ell(hx, hy, 19, 16, c.body);
        poly(
          [
            [hx + 10, hy - 4],
            [hx + 34 + A.th * 10, hy + 4],
            [hx + 10, hy + 10],
          ],
          shade(c.body, 6),
          'rgba(0,0,0,.2)',
          1.3,
        );
        ell(hx + 32 + A.th * 10, hy + 4, 4, 3.4, '#2a1e16');
        // colmillos curvos hacia arriba: la marca del jabali
        ctx.fillStyle = c.marfil;
        [1, -1].forEach(s => {
          ctx.beginPath();
          ctx.moveTo(hx + 24, hy + 6 + s * 2);
          ctx.quadraticCurveTo(hx + 34, hy - 4 + s * 3, hx + 30, hy - 14 + s * 2);
          ctx.quadraticCurveTo(hx + 27, hy - 4 + s * 3, hx + 22, hy + 6 + s * 2);
          ctx.closePath();
          ctx.fill();
        });
        // orejas cortas
        poly(
          [
            [hx - 10, hy - 12],
            [hx - 14, hy - 26],
            [hx - 2, hy - 14],
          ],
          dk,
        );
        ojosBrillo(hx + 6, hy - 6, 6, 2.2, c.ojo, c.halo);
        if (A.th > 0.06) ell(hx + 22, hy + 8, 7 + A.th * 4, 4 + A.th * 3, '#3a1a18');
      },
    },

    spider: {
      nombre: 'Araña Umbría',
      desc: 'Ocho patas y ninguna prisa. Teje donde no llega la luz.',
      plan: 'aracnido',
      col: {
        body: '#2e2438',
        belly: '#3e3450',
        dk: '#1e1826',
        ojo: '#c85898',
        halo: 'rgba(200,88,152,.26)',
        pelo: '#4a3c5c',
        quelicero: '#d8c8a0',
      },
      draw(A, c) {
        const dk = c.dk;
        // ocho patas: cuatro por lado, en dos grupos que alternan
        for (let lado = -1; lado <= 1; lado += 2) {
          for (let i = 0; i < 4; i++) {
            const fase = A.patas[(i + (lado < 0 ? 2 : 0)) % 4] || 0;
            const bx = -14 + i * 11,
              by = -6;
            const rodilla = { x: bx + lado * (26 + i * 3), y: by - 20 - i * 2 + fase * 5 };
            const punta = { x: bx + lado * (40 + i * 5), y: by + 30 - i * 2 + fase * 9 };
            seg(bx, by, rodilla.x, rodilla.y, 6.5 - i * 0.4, c.body);
            seg(rodilla.x, rodilla.y, punta.x, punta.y, 4.6 - i * 0.3, dk);
            ell(punta.x, punta.y + 2, 3, 2, dk);
          }
        }
        ctx.save();
        ctx.scale(1, A.resp);
        // abdomen grande atras
        ell(-30, -8, 30, 26, c.body);
        ell(-30, -8, 20, 17, c.belly);
        // marca en el abdomen
        ctx.fillStyle = c.ojo;
        poly(
          [
            [-30, -20],
            [-24, -8],
            [-30, 4],
            [-36, -8],
          ],
          c.ojo,
        );
        // cefalotorax
        ell(8, -6, 22, 17, shade(c.body, 8));
        ctx.restore();
        // pelos
        ctx.strokeStyle = c.pelo;
        ctx.lineWidth = 1.4;
        for (let a = 0; a < 8; a++) {
          const ang = a * 0.785;
          ctx.beginPath();
          ctx.moveTo(-30 + Math.cos(ang) * 26, -8 + Math.sin(ang) * 22);
          ctx.lineTo(-30 + Math.cos(ang) * 33, -8 + Math.sin(ang) * 28);
          ctx.stroke();
        }
        // quelíceros que se abren al atacar
        const q = A.th * 8;
        poly(
          [
            [24, -2],
            [36 + q, 2 + q],
            [26, 6],
          ],
          c.quelicero,
          'rgba(0,0,0,.3)',
          1.1,
        );
        poly(
          [
            [24, 2],
            [36 + q, 10 + q],
            [26, 10],
          ],
          c.quelicero,
          'rgba(0,0,0,.3)',
          1.1,
        );
        // ocho ojos: dos grandes al frente y seis chicos
        ojosBrillo(20, -10, 6, 2.6, c.ojo, c.halo);
        ctx.fillStyle = shade(c.ojo, -30);
        [
          [12, -16],
          [18, -18],
          [24, -17],
          [12, -4],
          [26, -4],
          [6, -11],
        ].forEach(([x, y]) => {
          ctx.beginPath();
          ctx.arc(x, y, 1.5, 0, Math.PI * 2);
          ctx.fill();
        });
        if (A.cast > 0.02) {
          // hilo de tela al conjurar
          ctx.strokeStyle = `rgba(220,210,235,${0.5 * A.cast})`;
          ctx.lineWidth = 1.6;
          for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.moveTo(30, 2);
            ctx.quadraticCurveTo(60 + i * 10, -16 + i * 12, 80 + A.cast * 40, -24 + i * 18);
            ctx.stroke();
          }
        }
      },
    },
  });

  /* Ajuste de apoyo medido por criatura: sin esto unas quedan flotando y
   otras enterradas respecto a la sombra que dibuja el mundo. */
  const PIE = {
    wolf: -11,
    bear: 13,
    drake: -13,
    dragon: 15,
    troll: 41,
    orc: 25,
    ghoul: 15,
    zombie: 23,
    skeleton: 10,
    boneMage: -14,
    wraith: -30,
    lich: -14,
    boar: -17,
    spider: -72,
  };
  function drawMonstruoLocal(v) {
    const m = MONSTRUOS[v.beast] || MONSTRUOS.wolf;
    const A = marcha(m.plan);
    // La paleta del juego manda sobre la del catalogo: asi las variantes
    // Notable y Exaltado siguen cambiando de color.
    const col = { ...m.col, ...(v.palette || {}) };
    ctx.save();
    ctx.translate(0, -(PIE[v.beast] || 0));
    ctx.rotate(A.pitch || 0);
    m.draw(A, col);
    ctx.restore();
  }

  U.CharacterRenderer = {
    draw(c, visual, scale = 0.32) {
      ctx = c;
      applyVisual(visual || {});
      if (visual?.beast) {
        c.save();
        c.scale(scale, scale);
        const golpe = clamp(visual.hit || 0, 0, 1);
        if (golpe > 0) {
          const empuje = Math.sin(golpe * Math.PI * 0.5) * 7;
          const lado = visual.dir === 'right' ? -1 : visual.dir === 'left' ? 1 : 0;
          c.translate(empuje * lado, empuje * 0.3);
          c.rotate(lado * Math.sin(golpe * Math.PI * 0.5) * 0.06);
        }
        if (visual.dying) {
          const caida = clamp(visual.death || 0, 0, 1);
          c.translate(0, 46 * caida);
          c.rotate(caida * 1.4);
          c.globalAlpha = Math.max(0.2, 1 - caida * 0.75);
        }
        if (visual.dir === 'left') c.scale(-1, 1);
        drawMonstruoLocal(visual);
        c.restore();
        return;
      }
      const base = {
        gender: 'male',
        skin: '#bb8d72',
        underwear: '#39414a',
        shirt: '#677386',
        pants: '#566479',
        tunic: '#7d586a',
        armor: '#8d98a1',
        cape: '#56303c',
        hair: '#3b2a24',
        ...(visual?.base || {}),
      };
      c.save();
      c.scale(scale, scale);
      // Conserva el punto de apoyo del renderer anterior: los pies deben
      // terminar sobre la sombra del mundo, no debajo de ella.
      c.translate(0, -22);
      drawHuman(base);
      drawCapeHood(base, state.dir);
      c.restore();
    },
  };
})((window.Ultra = window.Ultra || {}));
