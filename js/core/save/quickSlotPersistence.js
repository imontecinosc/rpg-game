(function (U) {
  const defaults = () => [
    { id: 'ironSword' }, { id: 'shield' }, { id: 'pickaxe' }, { id: 'workAxe' },
    { id: 'bandage' }, { id: 'potion' }, null,
  ];

  const originalLoad = U.load;
  if (!originalLoad) return;

  U.load = function () {
    originalLoad();
    if (!Array.isArray(U.state.quickSlots)) U.state.quickSlots = defaults();
    U.events?.emit('save:loaded', { state: U.state });
    U.ui.refreshAll();
  };
})(window.Ultra = window.Ultra || {});
