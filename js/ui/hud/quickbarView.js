(function (U) {
  U.ui.refreshQuickSlots = function () {
    document.querySelectorAll('.quick-slot').forEach((button, index) => {
      const ref = U.state.quickSlots[index];
      const def = ref && U.itemDefs[ref.id];
      const icon = button.querySelector('.icon');
      button.classList.toggle('assigned', !!def);
      button.classList.toggle('equipped', !!(ref && U.findEquippedSlotByRef(ref)));
      if (icon) icon.textContent = def ? def.icon : '';
      button.dataset.tip = def ? def.name : 'Ranura vacía';
      let count = button.querySelector('.quick-count');
      if (!count) {
        count = document.createElement('span');
        count.className = 'quick-count';
        button.append(count);
      }
      count.textContent = def?.stack ? U.countItem(ref.id) : '';
    });
  };

  const originalRefreshHUD = U.ui.refreshHUD;
  U.ui.refreshHUD = function () {
    originalRefreshHUD();
    U.ui.refreshQuickSlots();
    const title = U.state.titles?.at(-1) || '';
    const badge = U.$('#hud-title');
    if (badge) {
      badge.hidden = !title;
      badge.textContent = title;
    }
  };

  U.events?.on('quickbar:changed', () => U.ui.refreshQuickSlots());
  U.events?.on('equipment:changed', () => U.ui.refreshQuickSlots());
})(window.Ultra = window.Ultra || {});
