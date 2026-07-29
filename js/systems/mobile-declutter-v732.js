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
