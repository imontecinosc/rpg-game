(function (U) {
  function openInventory(event) {
    event?.preventDefault();
    U.ui.openInventory();
  }

  const originalBind = U.ui.bind;
  U.ui.bind = function () {
    originalBind();
    const bag = U.$('#inventory-bag-btn');
    if (bag && bag.dataset.inventoryBound !== 'true') {
      bag.dataset.inventoryBound = 'true';
      bag.addEventListener('click', openInventory);
      bag.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') openInventory(event);
      });
    }
    U.ui.bindInventoryDragDrop?.();
  };

  document.addEventListener('click', event => {
    if (event.target.closest('#inventory-bag-btn')) openInventory(event);
  });
})(window.Ultra = window.Ultra || {});
