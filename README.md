# Proyecto Ultra V4.5.3 — Carga corregida

La V4.5.2 contenía una referencia a `openEquipment`, una función global que no existía. El error detenía `game.js` antes de iniciar el juego.

## Correcciones
- Se elimina la referencia inválida.
- Movimiento, botones e inventario vuelven a iniciar.
- Se conserva la cuadrícula ordenada del equipo.
- El avatar se actualiza usando eventos seguros del botón de equipo.
- Nueva caché: `ultra-v453`.

Reemplaza todos los archivos y recarga la página.
