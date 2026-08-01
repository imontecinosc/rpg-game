(function (U) {
  'use strict';
  const isTouch = matchMedia('(pointer: coarse)').matches || innerWidth <= 900;
  if (!isTouch) return;

  document.addEventListener('DOMContentLoaded', () => {
    /* Panel de personaje: colapsado por defecto en móvil. El botón −/+
       que ya existía sigue funcionando igual, solo cambia el estado inicial. */
    const status = document.querySelector('#player-status');
    const statusToggle = document.querySelector('#collapse-status');
    if (status && statusToggle) {
      status.classList.add('collapsed');
      statusToggle.textContent = '+';
    }

    /* Minimapa: mismo criterio, mismo botón −/+ que ya existía. */
    const minimap = document.querySelector('#minimap-panel');
    const minimapToggle = document.querySelector('#minimap-toggle');
    if (minimap && minimapToggle) {
      minimap.classList.add('collapsed');
      minimapToggle.textContent = '+';
      /* FIX jugabilidad: se reportó que colapsado no se lograba volver a
         abrir. En vez de depender de acertarle justo al botón (que ya se
         había agrandado antes y aun así no era confiable en la práctica),
         ahora CUALQUIER toque en todo el panel colapsado lo expande. */
      minimap.addEventListener('click', event => {
        if (event.target.closest('#minimap-toggle')) return; // el botón ya se maneja solo
        if (!minimap.classList.contains('collapsed')) return;
        minimap.classList.remove('collapsed');
        minimapToggle.textContent = '−';
      });
    }

    /* Rastreador de misión: no tenía forma de plegarse. Se agrega un botón
       propio y arranca plegado a una sola línea (el objetivo actual). */
    const tracker = document.querySelector('#quest-tracker');
    if (tracker && !tracker.querySelector('.quest-toggle')) {
      const btn = document.createElement('button');
      btn.className = 'quest-toggle';
      btn.type = 'button';
      btn.setAttribute('aria-label', 'Expandir misión');
      btn.textContent = '+';
      tracker.prepend(btn);
      tracker.classList.add('collapsed');
      btn.onclick = () => {
        tracker.classList.toggle('collapsed');
        btn.textContent = tracker.classList.contains('collapsed') ? '+' : '−';
        btn.setAttribute('aria-label', tracker.classList.contains('collapsed') ? 'Expandir misión' : 'Plegar misión');
      };
    }
  });
})((window.Ultra = window.Ultra || {}));
