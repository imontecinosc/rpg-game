(function (U) {
  const ISO_X = 39,
    ISO_Y = 19.5,
    CHARACTER_SCALE = 0.42;
  U.initCanvas = function () {
    U.canvas = U.$('#game');
    U.ctx = U.canvas.getContext('2d');
    U.resize = function () {
      U.DPR = Math.min(2, devicePixelRatio || 1);
      U.W = innerWidth;
      U.H = innerHeight;
      U.canvas.width = U.W * U.DPR;
      U.canvas.height = U.H * U.DPR;
      U.ctx.setTransform(U.DPR, 0, 0, U.DPR, 0, 0);
    };
    addEventListener('resize', U.resize);
    U.resize();
    U.worldToScreen = (x, y, z = 0) => ({
      x: (x - y) * ISO_X + U.W / 2 - U.camera.x,
      y: (x + y) * ISO_Y + U.H / 2 - U.camera.y - z,
    });
    U.screenToWorld = (sx, sy) => {
      const X = (sx - U.W / 2 + U.camera.x) / ISO_X,
        Y = (sy - U.H / 2 + U.camera.y) / ISO_Y;
      return { x: (X + Y) / 2, y: (Y - X) / 2 };
    };
  };
  const sujeta = v => (v < 0 ? 0 : v > 255 ? 255 : v | 0);
  function rgbDe(hex) {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  // Aclara u oscurece, y opcionalmente entibia (mas rojo, menos azul).
  function tono(hex, luz, calor = 0) {
    const [r, g, b] = rgbDe(hex);
    return `rgb(${sujeta(r + luz + calor * 1.7)},${sujeta(g + luz + calor * 0.85)},${sujeta(b + luz - calor * 0.35)})`;
  }
  // Ruido determinista por baldosa: siempre da el mismo valor para el mismo
  // par (x, y), asi el suelo no titila cuando el jugador se mueve.
  function ruido(x, y) {
    let h = (Math.round(x) * 374761393 + Math.round(y) * 668265263) | 0;
    h = ((h ^ (h >> 13)) * 1274126177) | 0;
    return ((h ^ (h >> 16)) >>> 0) / 4294967295;
  }
  // Las baldosas se dibujan un pelo mas grandes para que no queden costuras
  // claras entre una y otra al quitar el contorno.
  const SOLAPE = 0.7;
  function diamond(x, y, fill, stroke = null) {
    const p = U.worldToScreen(x, y);
    const ex = ISO_X + SOLAPE,
      ey = ISO_Y + SOLAPE / 2;
    U.ctx.beginPath();
    U.ctx.moveTo(p.x, p.y - ey);
    U.ctx.lineTo(p.x + ex, p.y);
    U.ctx.lineTo(p.x, p.y + ey);
    U.ctx.lineTo(p.x - ex, p.y);
    U.ctx.closePath();
    U.ctx.fillStyle = fill;
    U.ctx.fill();
    if (stroke) {
      U.ctx.strokeStyle = stroke;
      U.ctx.stroke();
    }
  }
  function cara(c, a, b, d, e, fill) {
    c.beginPath();
    c.moveTo(a.x, a.y);
    c.lineTo(b.x, b.y);
    c.lineTo(d.x, d.y);
    c.lineTo(e.x, e.y);
    c.closePath();
    c.fillStyle = fill;
    c.fill();
  }
  // Edificio con volumen isometrico: dos paredes visibles y techo a cuatro aguas.
  function isoEdificio(c, x, y, ancho, fondo, alto, techo, base) {
    const S = U.worldToScreen(x + ancho, y + fondo),
      E = U.worldToScreen(x + ancho, y - fondo),
      W = U.worldToScreen(x - ancho, y + fondo),
      N = U.worldToScreen(x - ancho, y - fondo);
    const sube = q => ({ x: q.x, y: q.y - alto });
    const Sa = sube(S),
      Ea = sube(E),
      Wa = sube(W),
      Na = sube(N);
    cara(c, W, S, Sa, Wa, tono(base, -30));
    cara(c, S, E, Ea, Sa, tono(base, -6));
    const cumbre = { x: (Na.x + Sa.x) / 2, y: (Na.y + Sa.y) / 2 - techo };
    cara(c, Wa, Sa, cumbre, cumbre, tono('#3a2620', -8));
    cara(c, Sa, Ea, cumbre, cumbre, tono('#3a2620', 8));
    cara(c, Na, Ea, cumbre, cumbre, tono('#3a2620', -18));
  }
  // Vinieta: oscurece los bordes de la pantalla para dar profundidad. El
  // gradiente se crea una sola vez y se rehace solo si cambia el tamano.
  let vinieta = null,
    vinW = 0,
    vinH = 0;
  function dibujarVinieta(c) {
    if (!c.createRadialGradient) return;
    if (!vinieta || vinW !== U.W || vinH !== U.H) {
      const g = c.createRadialGradient(
        U.W / 2,
        U.H / 2,
        Math.min(U.W, U.H) * 0.34,
        U.W / 2,
        U.H / 2,
        Math.max(U.W, U.H) * 0.78,
      );
      if (!g || !g.addColorStop) return;
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(0.7, 'rgba(8,9,11,0.26)');
      g.addColorStop(1, 'rgba(8,9,11,0.52)');
      vinieta = g;
      vinW = U.W;
      vinH = U.H;
    }
    c.fillStyle = vinieta;
    c.fillRect(0, 0, U.W, U.H);
  }
  function hpBar(o, p) {
    const c = U.ctx,
      w = o.boss || o.variant === 'exalted' ? 62 : o.variant === 'renowned' ? 50 : 38,
      h = 5;
    c.fillStyle = '#18110f';
    c.fillRect(p.x - w / 2, p.y - 64, w, h);
    c.fillStyle = o.hp / o.maxHp > 0.45 ? '#a8463f' : '#d76a54';
    c.fillRect(p.x - w / 2 + 1, p.y - 63, (w - 2) * Math.max(0, o.hp / o.maxHp), h - 2);
    c.strokeStyle = o.variant === 'exalted' ? '#f2c94c' : '#d8c7a1';
    c.strokeRect(p.x - w / 2, p.y - 64, w, h);
  }
  function label(o, p, isPlayer = false) {
    const c = U.ctx,
      name = isPlayer ? 'Tú' : o.name || '';
    c.font = `${o.variant || o.boss ? 'bold ' : ''}11px Arial`;
    c.textAlign = 'center';
    c.fillStyle = isPlayer ? '#e9dfc8' : o.nameColor || '#ddd';
    c.strokeStyle = '#000';
    c.lineWidth = 3;
    c.strokeText(name, p.x, p.y - 49);
    c.fillText(name, p.x, p.y - 49);
    c.textAlign = 'start';
  }
  function drawFace(c, dir) {
    c.fillStyle = '#2a211b';
    if (dir === 'up') {
      c.fillRect(-5, -35, 10, 4);
      return;
    }
    if (dir === 'left') {
      c.fillRect(-5, -32, 2, 2);
      c.beginPath();
      c.moveTo(-8, -29);
      c.lineTo(-12, -27);
      c.lineTo(-7, -26);
      c.fill();
      return;
    }
    if (dir === 'right') {
      c.fillRect(3, -32, 2, 2);
      c.beginPath();
      c.moveTo(8, -29);
      c.lineTo(12, -27);
      c.lineTo(7, -26);
      c.fill();
      return;
    }
    c.fillRect(-4, -32, 2, 2);
    c.fillRect(3, -32, 2, 2);
    c.fillRect(-2, -27, 4, 1);
  }
  function weaponPose(skill, attack, dir) {
    const t = attack ? 1 : 0;
    if (skill === 'Arco') return { rot: t ? -0.15 : -1.05, len: 29, bow: true };
    if (skill === 'Esgrima') return { rot: t ? -0.15 : -0.5, len: 34, spear: true };
    if (skill === 'Armas contundentes') return { rot: t ? -1.8 : -0.55, len: 25, heavy: true };
    if (skill === 'Pelea') return { rot: t ? -0.1 : -0.5, len: 12, fist: true };
    return { rot: t ? -1.7 : -0.4, len: 29, sword: true };
  }
  function humanoid(o, isPlayer = false) {
    const c = U.ctx,
      p = U.worldToScreen(o.x, o.y, 6),
      moving = isPlayer ? Math.hypot(o.vx || 0, o.vy || 0) > 0.1 : !!o.moving,
      phase = Math.sin((o.anim || 0) * 10),
      attack = (o.attackAnim || 0) > 0,
      dir = o.facing || 'down';
    c.save();
    c.translate(p.x, p.y);
    if (U.CharacterRenderer && U.CharacterAdapter) {
      if (isPlayer) {
        c.strokeStyle = U.state.battle ? '#e26a61' : '#c9ad70';
        c.lineWidth = 2;
        c.beginPath();
        c.ellipse(0, 8, 16, 7, 0, 0, Math.PI * 2);
        c.stroke();
      }
      U.CharacterRenderer.draw(c, U.CharacterAdapter.getState(o), CHARACTER_SCALE);
      c.restore();
      label(o, p, isPlayer);
      if (!isPlayer && o.hp !== undefined) hpBar(o, p);
      return;
    }
    const side = dir === 'left' ? -1 : dir === 'right' ? 1 : 0,
      depth = dir === 'up' ? -1 : 1,
      leg = moving ? phase * 8 : 0;
    c.strokeStyle = o.color || '#886';
    c.lineWidth = 8;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(-4, 9);
    c.lineTo(-7 + leg * 0.45, 37);
    c.moveTo(4, 9);
    c.lineTo(7 - leg * 0.45, 37);
    c.stroke();
    c.fillStyle = o.hitAnim > 0 ? '#c97d74' : o.color || '#886';
    c.beginPath();
    c.ellipse(0, -3, dir === 'left' || dir === 'right' ? 11 : 14, 25, 0, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = o.color || '#886';
    c.lineWidth = 7;
    c.beginPath();
    c.moveTo(-5, -17);
    c.lineTo(-15 - leg * 0.25, 7);
    c.moveTo(5, -17);
    c.lineTo(15 + leg * 0.25, 7);
    c.stroke();
    c.fillStyle = '#a77f61';
    c.beginPath();
    c.arc(side * 2, -31, 8, 0, Math.PI * 2);
    c.fill();
    drawFace(c, dir);
    if (isPlayer && U.player.equipment.shield) {
      const sx = dir === 'right' ? -18 : dir === 'left' ? 18 : -18,
        sy = dir === 'up' ? -7 : -2;
      c.fillStyle = '#6f7780';
      c.beginPath();
      c.ellipse(sx, sy, 9, 13, -0.25, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = '#bbc2c6';
      c.lineWidth = 2;
      c.stroke();
    }
    if (isPlayer && U.player.equipment.weapon) {
      const d = U.itemDefs[U.player.equipment.weapon.id],
        pose = weaponPose(d.skill, attack, dir),
        handX = dir === 'left' ? -16 : 16;
      c.save();
      c.translate(handX, 1);
      c.scale(dir === 'left' ? -1 : 1, 1);
      c.rotate(pose.rot);
      if (pose.bow) {
        c.strokeStyle = '#9a6d38';
        c.lineWidth = 3;
        c.beginPath();
        c.arc(11, 0, 15, -1.2, 1.2);
        c.stroke();
        c.strokeStyle = '#ddd';
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(16, -14);
        c.lineTo(16, 14);
        c.stroke();
      } else if (pose.fist) {
        c.fillStyle = '#8c6a50';
        c.beginPath();
        c.arc(11, 0, 7, 0, Math.PI * 2);
        c.fill();
      } else {
        c.strokeStyle = pose.heavy ? '#aaa' : '#dedede';
        c.lineWidth = pose.spear ? 3 : pose.heavy ? 7 : 4;
        c.beginPath();
        c.moveTo(0, 0);
        c.lineTo(pose.len, -4);
        c.stroke();
        if (pose.spear) {
          c.fillStyle = '#d8d8d8';
          c.beginPath();
          c.moveTo(pose.len, -4);
          c.lineTo(pose.len - 8, -9);
          c.lineTo(pose.len - 8, 1);
          c.fill();
        }
        if (pose.heavy) {
          c.strokeStyle = '#7a4b2a';
          c.lineWidth = 5;
          c.beginPath();
          c.moveTo(pose.len - 5, -12);
          c.lineTo(pose.len - 5, 5);
          c.stroke();
        }
      }
      c.restore();
    }
    c.restore();
    label(o, p, isPlayer);
    if (!isPlayer) hpBar(o, p);
  }
  function wolf(o) {
    const c = U.ctx,
      p = U.worldToScreen(o.x, o.y, 2),
      q = o.moving ? Math.sin((o.anim || 0) * 11) * 3 : 0;
    c.save();
    c.translate(p.x, p.y);
    c.fillStyle = o.hitAnim > 0 ? '#b9776d' : o.color;
    c.beginPath();
    c.ellipse(0, -10, o.variant ? 23 : 20, o.variant ? 12 : 10, 0, 0, Math.PI * 2);
    c.fill();
    c.beginPath();
    c.ellipse(18, -17, 9, 7, 0, 0, Math.PI * 2);
    c.fill();
    c.beginPath();
    c.moveTo(15, -24);
    c.lineTo(18, -33);
    c.lineTo(22, -23);
    c.fill();
    c.strokeStyle = o.color;
    c.lineWidth = 5;
    for (const x of [-12, -3, 8, 16]) {
      c.beginPath();
      c.moveTo(x, -4);
      c.lineTo(x + q, 10);
      c.stroke();
    }
    c.restore();
    label(o, p);
    hpBar(o, p);
  }
  function troll(o) {
    const c = U.ctx,
      p = U.worldToScreen(o.x, o.y, 4),
      q = o.moving ? Math.sin((o.anim || 0) * 6) * 5 : 0,
      sc = o.boss ? 1.35 : o.variant === 'exalted' ? 1.45 : o.variant === 'renowned' ? 1.25 : 1;
    c.save();
    c.translate(p.x, p.y);
    c.scale(sc, sc);
    c.fillStyle = o.hitAnim > 0 ? '#9a7468' : o.color;
    c.beginPath();
    c.ellipse(0, -10, 23, 31, 0, 0, Math.PI * 2);
    c.fill();
    c.beginPath();
    c.arc(0, -43, 14, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = o.variant === 'exalted' ? '#b88719' : '#48613f';
    c.lineWidth = 12;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(-18, -20);
    c.lineTo(-30 - q, 10);
    c.moveTo(18, -20);
    c.lineTo(30 + q, 10);
    c.moveTo(-9, 16);
    c.lineTo(-12 + q, 42);
    c.moveTo(9, 16);
    c.lineTo(12 - q, 42);
    c.stroke();
    c.restore();
    label(o, p);
    hpBar(o, p);
  }
  U.draw = function () {
    const c = U.ctx;
    c.clearRect(0, 0, U.W, U.H);
    const span = 30;
    for (let y = Math.floor(U.player.y) - span; y < Math.floor(U.player.y) + span; y++)
      for (let x = Math.floor(U.player.x) - span; x < Math.floor(U.player.x) + span; x++) {
        const n = ruido(x, y);
        // El borde de cada bioma se corre segun el ruido de la baldosa, asi deja
        // de ser un circulo perfecto y queda irregular.
        const borde = (n - 0.5) * 1.6;
        let fill = '#203a27';
        let luz = (n - 0.5) * 13;
        const city = U.cities.find(z => Math.hypot(x - z.x, y - z.y) < z.safe + borde);
        if (city) fill = (x + y) & 1 ? city.floor : city.color;
        if (U.terrain.water.some(w => Math.hypot(x - w.x, y - w.y) < w.r + borde)) {
          fill = '#274f59';
          luz = (n - 0.5) * 9;
        }
        if (U.terrain.mines.some(m => Math.hypot(x - m.x, y - m.y) < m.r + borde)) {
          fill = '#4a4742';
          luz = (n - 0.5) * 11;
        }
        // Luz calida alrededor de las ciudades: la vida esta adentro y el frio afuera.
        let calor = 0;
        for (const z of U.cities) {
          const d = Math.hypot(x - z.x, y - z.y);
          const alcance = z.safe + 14;
          if (d < alcance) calor = Math.max(calor, (1 - d / alcance) * 26);
        }
        diamond(x, y, tono(fill, luz, calor));
      }
    for (const city of U.cities) {
      const buildings = [
        [-14, -12],
        [-13, 10],
        [13, -11],
        [14, 10],
        [-4, 15],
        [7, -16],
      ];
      buildings
        // Se dibujan de atras hacia adelante para que el solape quede bien.
        .slice()
        .sort((a, b) => a[0] + a[1] - (b[0] + b[1]))
        .forEach(([dx, dy], i) => {
          // Cada edificio varia de tamano y altura segun su posicion y la ciudad,
          // asi Valdoria y Brumaferrea dejan de verse identicas.
          const n = ruido(city.x + dx, city.y + dy);
          const ancho = 0.85 + n * 0.5,
            fondo = 0.85 + ruido(dx, dy) * 0.5,
            alto = 30 + n * 22,
            techo = 16 + ruido(dy, dx) * 12;
          isoEdificio(
            c,
            city.x + dx,
            city.y + dy,
            ancho,
            fondo,
            alto,
            techo,
            tono(city.color, (n - 0.5) * 18),
          );
        });
    }
    for (const st of U.terrain.stations) {
      const p = U.worldToScreen(st.x, st.y);
      c.fillStyle = '#a87e45';
      c.fillRect(p.x - 10, p.y - 12, 20, 12);
      c.fillStyle = '#eee';
      c.font = '10px Arial';
      c.fillText(st.type === 'forge' ? 'Yunque' : 'Mesa', p.x - 15, p.y - 18);
    }
    const objects = [
      ...U.npcs,
      // Un enemigo recien muerto se sigue dibujando mientras dura su caida.
      ...U.enemies.filter(e => !e.dead || (e.deathAnim || 0) > 0),
      U.player,
    ].sort((a, b) => a.x + a.y - (b.x + b.y));
    for (const o of objects) {
      const shadow = U.worldToScreen(o.x, o.y, 0);
      c.save();
      c.fillStyle = 'rgba(0,0,0,.30)';
      c.beginPath();
      c.ellipse(
        shadow.x,
        shadow.y +
          (o === U.player ||
          o.type === 'guard' ||
          o.type === 'vendor' ||
          o.type === 'banker' ||
          o.type === 'healer'
            ? 32
            : 12),
        o.boss ? 24 : 17,
        o.boss ? 10 : 7,
        0,
        0,
        Math.PI * 2,
      );
      c.fill();
      c.restore();
      if (o === U.player) humanoid(o, true);
      else if (U.CharacterRenderer && U.CharacterAdapter) {
        const p = U.worldToScreen(o.x, o.y, 4),
          visual = U.CharacterAdapter.getState(o);
        U.ctx.save();
        U.ctx.translate(p.x, p.y);
        U.CharacterRenderer.draw(
          U.ctx,
          visual,
          visual.scale ? CHARACTER_SCALE * visual.scale : CHARACTER_SCALE,
        );
        U.ctx.restore();
        label(o, p);
        if (o.hp !== undefined) hpBar(o, p);
      } else if (o.type === 'wolf') wolf(o);
      else if (o.type === 'troll' || o.type === 'boss') troll(o);
      else humanoid(o, false);
    }
    if (U.player.target && !U.player.target.dead) {
      const p = U.worldToScreen(U.player.target.x, U.player.target.y);
      c.strokeStyle = '#ff655d';
      c.lineWidth = 3;
      c.beginPath();
      c.ellipse(p.x, p.y + 9, 25, 11, 0, 0, Math.PI * 2);
      c.stroke();
      c.fillStyle = '#ff655d';
      c.beginPath();
      c.moveTo(p.x, p.y - 76);
      c.lineTo(p.x - 8, p.y - 88);
      c.lineTo(p.x + 8, p.y - 88);
      c.closePath();
      c.fill();
    }
    for (const corpse of U.state.corpses) {
      const p = U.worldToScreen(corpse.x, corpse.y);
      c.fillStyle = '#7d2727';
      c.fillRect(p.x - 14, p.y - 3, 28, 11);
      c.fillStyle = '#ddd';
      c.font = '11px Arial';
      c.fillText('Cadáver', p.x - 22, p.y - 10);
    }
    for (const pr of U.state.projectiles) {
      const p = U.worldToScreen(pr.x, pr.y),
        tp = U.worldToScreen(pr.target?.x ?? pr.x, pr.target?.y ?? pr.y),
        ang = Math.atan2(tp.y - p.y, tp.x - p.x),
        colors = { fireball: '#ff7a20', ice: '#49a8ff', lightning: '#ffe34d', curse: '#a85de2' };
      c.save();
      c.translate(p.x, p.y - 18);
      if (pr.spell) {
        c.fillStyle = colors[pr.spell.id] || '#fff';
        c.shadowColor = c.fillStyle;
        c.shadowBlur = 12;
        c.beginPath();
        c.arc(0, 0, 6, 0, Math.PI * 2);
        c.fill();
      } else {
        c.rotate(ang);
        c.strokeStyle = '#d9c59a';
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(-10, 0);
        c.lineTo(10, 0);
        c.stroke();
        c.fillStyle = '#ddd';
        c.beginPath();
        c.moveTo(11, 0);
        c.lineTo(5, -4);
        c.lineTo(5, 4);
        c.closePath();
        c.fill();
      }
      c.restore();
    }
    for (const ef of U.state.effects) {
      const p = U.worldToScreen(ef.x, ef.y);
      if (ef.type === 'float') {
        c.fillStyle = ef.color;
        c.font = 'bold 14px Arial';
        c.fillText(ef.text, p.x, p.y - 40 - ef.life * 18);
      } else if (ef.type === 'portal') {
        c.strokeStyle = '#7f58d9';
        c.lineWidth = 5;
        c.beginPath();
        c.ellipse(p.x, p.y - 18, 15, 27, 0, 0, Math.PI * 2);
        c.stroke();
      } else if (ef.type === 'particle') {
        c.globalAlpha = Math.max(0, ef.life / 0.45);
        c.fillStyle = ef.color;
        c.beginPath();
        c.arc(p.x, p.y - 18, ef.size || 3, 0, Math.PI * 2);
        c.fill();
        c.globalAlpha = 1;
      } else {
        c.fillStyle = '#fff';
        c.fillText(ef.text || '✦', p.x, p.y - 35);
      }
    }
    dibujarVinieta(c);
  };
})((window.Ultra = window.Ultra || {}));
