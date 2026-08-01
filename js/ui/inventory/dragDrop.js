(function (U) {
  function bindInventoryGrid() {
    const grid = U.$('#inventory-grid');
    if (!grid || grid.dataset.dragDropBound === 'true') return;
    grid.dataset.dragDropBound = 'true';

    grid.addEventListener('dragover', event => {
      const target = event.target.closest('.inventory-cell');
      if (!target) return;
      event.preventDefault();
      target.classList.add('drop-target');
    });
    grid.addEventListener('dragleave', event => {
      event.target.closest('.inventory-cell')?.classList.remove('drop-target');
    });
    grid.addEventListener('drop', event => {
      const target = event.target.closest('.inventory-cell');
      if (!target) return;
      event.preventDefault();
      target.classList.remove('drop-target');
      const from = Number(event.dataTransfer.getData('application/x-ultra-inventory-index'));
      const to = Number(target.dataset.item);
      if (!Number.isInteger(from) || !Number.isInteger(to) || from === to) return;
      [U.player.inventory[from], U.player.inventory[to]] = [U.player.inventory[to], U.player.inventory[from]];
      U.state.selectedInventoryIndex = null;
      U.quickbar.syncFromInventory();
      U.events?.emit('inventory:reordered', { from, to });
      U.ui.refreshAll();
    });
  }

  function bindQuickSlots() {
    document.querySelectorAll('.quick-slot').forEach((button, index) => {
      if (button.dataset.quickbarBound === 'true') return;
      button.dataset.quickbarBound = 'true';
      button.addEventListener('click', event => {
        event.preventDefault();
        U.quickbar.use(index);
      });
      button.addEventListener('dragover', event => {
        event.preventDefault();
        button.classList.add('drop-target');
      });
      button.addEventListener('dragleave', () => button.classList.remove('drop-target'));
      button.addEventListener('drop', event => {
        event.preventDefault();
        button.classList.remove('drop-target');
        const inventoryIndex = Number(event.dataTransfer.getData('application/x-ultra-inventory-index'));
        const item = U.player.inventory[inventoryIndex];
        if (item) U.quickbar.assign(index, item);
      });
    });
  }

  U.ui.bindInventoryDragDrop = function () {
    bindInventoryGrid();
    bindQuickSlots();
  };
})(window.Ultra = window.Ultra || {});
