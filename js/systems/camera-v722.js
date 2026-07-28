(function (U) {
  const isTouch = matchMedia('(pointer: coarse)').matches || innerWidth <= 900;
  const DEFAULT_ZOOM = isTouch ? 0.55 : 1;
  const MIN_ZOOM = 0.42;
  const MAX_ZOOM = 1.35;
  const STEP = 0.1;
  const storageKey = isTouch ? 'ultra_camera_zoom_touch' : 'ultra_camera_zoom_desktop';
  const saved = Number(localStorage.getItem(storageKey));
  U.cameraZoom = Number.isFinite(saved) ? U.clamp(saved, MIN_ZOOM, MAX_ZOOM) : DEFAULT_ZOOM;

  const rawScreenToWorld = U.screenToWorld;
  U.screenToWorld = function (sx, sy) {
    const z = U.cameraZoom || 1;
    return rawScreenToWorld(U.W / 2 + (sx - U.W / 2) / z, U.H / 2 + (sy - U.H / 2) / z);
  };

  const rawDraw = U.draw;
  U.draw = function () {
    const c = U.ctx,
      z = U.cameraZoom || 1;
    c.save();
    c.setTransform(U.DPR, 0, 0, U.DPR, 0, 0);
    c.clearRect(0, 0, U.W, U.H);
    c.translate(U.W / 2, U.H / 2);
    c.scale(z, z);
    c.translate(-U.W / 2, -U.H / 2);
    rawDraw();
    c.restore();
    if (U.dibujarVinietaPantalla) U.dibujarVinietaPantalla();
  };

  function updateZoomUI() {
    const value = U.$('#zoom-value');
    if (value) value.textContent = `${Math.round(U.cameraZoom * 100)}%`;
  }
  U.setCameraZoom = function (value) {
    U.cameraZoom = Math.round(U.clamp(value, MIN_ZOOM, MAX_ZOOM) * 100) / 100;
    localStorage.setItem(storageKey, U.cameraZoom);
    updateZoomUI();
  };
  U.$('#zoom-out').onclick = () => U.setCameraZoom(U.cameraZoom - STEP);
  U.$('#zoom-in').onclick = () => U.setCameraZoom(U.cameraZoom + STEP);
  U.$('#zoom-reset').onclick = () => U.setCameraZoom(DEFAULT_ZOOM);
  updateZoomUI();

  U.canvas.addEventListener(
    'wheel',
    e => {
      e.preventDefault();
      U.setCameraZoom(U.cameraZoom + (e.deltaY < 0 ? STEP : -STEP));
    },
    { passive: false },
  );

  const touches = new Map();
  let pinchDistance = 0,
    pinchZoom = U.cameraZoom;
  U.canvas.addEventListener(
    'pointerdown',
    e => {
      if (e.pointerType === 'touch') touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (touches.size === 2) {
        const a = [...touches.values()];
        pinchDistance = Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y);
        pinchZoom = U.cameraZoom;
      }
    },
    true,
  );
  U.canvas.addEventListener(
    'pointermove',
    e => {
      if (!touches.has(e.pointerId)) return;
      touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (touches.size === 2 && pinchDistance > 0) {
        const a = [...touches.values()];
        const distance = Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y);
        U.setCameraZoom((pinchZoom * distance) / pinchDistance);
        e.stopImmediatePropagation();
      }
    },
    true,
  );
  const endPinch = e => touches.delete(e.pointerId);
  U.canvas.addEventListener('pointerup', endPinch, true);
  U.canvas.addEventListener('pointercancel', endPinch, true);

  let resultTimer = 0;
  U.showActivityResult = function (type, message) {
    const bar = U.$('#activity-bar');
    bar.hidden = false;
    bar.dataset.state = type;
    U.$('#activity-name').textContent = message;
    U.$('#activity-status').textContent =
      type === 'failed'
        ? 'La acción no tuvo efecto.'
        : type === 'interrupted'
          ? 'La acción fue interrumpida.'
          : 'Acción terminada.';
    clearTimeout(resultTimer);
    resultTimer = setTimeout(() => {
      if (!U.player.bandaging && !U.player.casting) bar.hidden = true;
    }, 1600);
  };
  U.registerBandageHit = function (damage) {
    const action = U.player.bandaging;
    if (!action || action.gather) return;
    action.hits = (action.hits || 0) + 1;
    const severity = U.clamp(damage / Math.max(1, U.player.maxHp), 0.02, 0.22);
    const resistance = U.clamp(((U.player.skills.Curar || 0) * 0.55 + U.player.dex * 0.3) / 100, 0, 0.85);
    action.failChance = U.clamp((action.failChance || 0) + severity * (1.25 - resistance), 0, 0.8);
    U.$('#activity-status').textContent =
      `Golpes recibidos: ${action.hits} · Riesgo de fallo: ${Math.round(action.failChance * 100)}%`;
  };
  U.$('#activity-cancel').onclick = () => {
    if (U.player.casting) U.cancelCast('Acción cancelada.');
    if (U.player.bandaging) {
      U.player.bandaging = null;
      U.player.miningSession = null;
      U.showActivityResult('interrupted', 'Acción cancelada');
    }
  };

  const rawUpdate = U.update;
  U.update = function (dt) {
    rawUpdate(dt);
    const action = U.player.bandaging || U.player.casting;
    const bar = U.$('#activity-bar');
    if (!action) return;
    const gatherNames = { mine: 'Minando', wood: 'Talando', fish: 'Pescando' };
    bar.hidden = false;
    bar.dataset.state = 'running';
    U.$('#activity-name').textContent = action.gather
      ? gatherNames[action.gather] || 'Recolectando'
      : U.player.casting
        ? 'Canalizando hechizo'
        : 'Aplicando vendas';
    U.$('#activity-time').textContent = `${Math.max(0, action.t).toFixed(1)} s`;
    U.$('#activity-fill').style.width =
      `${100 * (1 - action.t / Math.max(0.01, action.total || action.castTime || 1))}%`;
    if (!action.gather && !U.player.casting && !action.hits)
      U.$('#activity-status').textContent = 'Sin interrupciones.';
  };
})((window.Ultra = window.Ultra || {}));
