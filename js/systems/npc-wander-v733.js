(function (U) {
  'use strict';
  /* FIX jugabilidad: ni los enemigos en reposo ni los NPC pasivos
     (vendedor, banquero, sanador, NPC de misión) se movían nunca por su
     cuenta — se quedaban clavados en su punto de aparición hasta que el
     jugador entraba en su rango de detección. Esto también era la razón
     de que "no tuvieran las animaciones de caminar": el renderer ya sabe
     mostrar caminar/correr para cualquier humano, pero si nadie mueve al
     personaje, nunca se dispara esa animación.

     Para enemigos y guardias, el juego YA camina de vuelta hacia
     homeX/homeY cuando no persiguen a nadie (ver game.js). En vez de
     pelear contra esa lógica moviendo x/y por mi cuenta, este parche
     solo cambia DE VEZ EN CUANDO cuál es el punto "casa" actual (un
     punto cercano al de aparición real), y deja que el código ya
     existente los camine hasta ahí. Así no hay conflicto de movimiento.

     Para los NPC pasivos, que no tenían ningún código de movimiento,
     se agrega la misma lógica de caminar hacia el punto actual. */
  const RADIUS_ENEMY = 4.5;
  const RADIUS_GUARD = 3.5;
  const RADIUS_PASSIVE = 3;

  function ensureWander(actor) {
    actor.spawnX ??= actor.homeX ?? actor.x;
    actor.spawnY ??= actor.homeY ?? actor.y;
    actor.homeX ??= actor.spawnX;
    actor.homeY ??= actor.spawnY;
    actor.wanderPause ??= U.rnd(2, 6);
  }

  // Cambia el punto "casa" actual de vez en cuando, solo si el personaje
  // ya llegó al punto anterior (evita que el objetivo se mueva a mitad
  // de camino y quede dando vueltas raras).
  function tickWaypoint(actor, dt, radius) {
    ensureWander(actor);
    const atWaypoint = Math.hypot(actor.x - actor.homeX, actor.y - actor.homeY) < 1.2;
    if (!atWaypoint) return;
    actor.wanderPause -= dt;
    if (actor.wanderPause > 0) return;
    const a = U.rnd(0, Math.PI * 2),
      r = U.rnd(1.5, radius);
    actor.homeX = actor.spawnX + Math.cos(a) * r;
    actor.homeY = actor.spawnY + Math.sin(a) * r;
    actor.wanderPause = U.rnd(4, 9);
  }

  // Solo para NPC pasivos: no tenían ningún código que los caminara hacia
  // su punto "casa", a diferencia de enemigos y guardias que ya lo hacían.
  function walkToward(actor, dt, speed) {
    const dx = actor.homeX - actor.x,
      dy = actor.homeY - actor.y,
      d = Math.hypot(dx, dy);
    if (d < 0.12) {
      actor.moving = false;
      return;
    }
    actor.x += (dx / d) * speed * dt;
    actor.y += (dy / d) * speed * dt;
    actor.moving = true;
    actor.facing = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
    actor.anim = (actor.anim || 0) + dt;
  }

  const rawUpdate = U.update;
  U.update = function (dt) {
    rawUpdate(dt);

    // Enemigos: solo se les mueve el punto "casa" cuando no persiguen al
    // jugador y ya volvieron. Los enemigos de misión (con questRole) se
    // dejan quietos a propósito, para no romper el encuentro diseñado.
    for (const e of U.enemies) {
      if (e.dead || e.aggro || e.questRole) continue;
      tickWaypoint(e, dt, RADIUS_ENEMY);
    }

    // Guardias: mismo criterio, pero solo si no hay ningún hostil cerca de
    // su ciudad (si lo hay, su propia lógica de patrulla/combate manda).
    for (const n of U.npcs) {
      if (n.type !== 'guard') continue;
      const city = U.cities.find(c => c.name === n.city);
      const hostileNearby =
        city && U.enemies.some(en => !en.dead && Math.hypot(en.x - city.x, en.y - city.y) < city.safe + 7);
      if (hostileNearby) continue;
      tickWaypoint(n, dt, RADIUS_GUARD);
    }

    // NPC pasivos (vendedor, banquero, sanador, personajes de misión):
    // se les da tanto el cambio de punto como el caminar hacia él, porque
    // antes no tenían ninguna de las dos cosas.
    for (const n of U.npcs) {
      if (n.type === 'guard') continue;
      const danger = U.enemies.some(en => !en.dead && U.dist(en, n) < 6);
      if (danger) {
        n.moving = false;
        continue;
      }
      tickWaypoint(n, dt, RADIUS_PASSIVE);
      walkToward(n, dt, 0.85);
    }
  };
})((window.Ultra = window.Ultra || {}));
