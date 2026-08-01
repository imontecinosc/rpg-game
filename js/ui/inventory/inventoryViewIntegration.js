(function (U) {
  const originalRefreshInventory = U.ui.refreshInventory;
  U.ui.refreshInventory = function () {
    U.quickbar.syncFromInventory();
    originalRefreshInventory();

    document.querySelectorAll('.pd-slot').forEach(button => {
      button.classList.toggle('occupied', !!U.player.equipment[button.dataset.slot]);
    });

    document.querySelectorAll('#inventory-grid .inventory-cell[data-item]').forEach(cell => {
      cell.draggable = true;
      cell.addEventListener('dragstart', event => {
        cell.classList.add('dragging');
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('application/x-ultra-inventory-index', cell.dataset.item);
      });
      cell.addEventListener('dragend', () => cell.classList.remove('dragging'));
    });
  };
})(window.Ultra = window.Ultra || {});
