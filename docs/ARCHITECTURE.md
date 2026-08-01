# Arquitectura modular de Proyecto Ultra

## Objetivo

La versión modular conserva el comportamiento y el HUD existente. La migración separa responsabilidades sin reconstruir sistemas funcionales.

## Capas

- `js/app/`: arranque y composición de la aplicación.
- `js/core/`: estado, bucle, entrada, render, sonido, eventos y guardado.
- `js/data/`: catálogos declarativos de objetos, skills, mundo y equipo.
- `js/systems/`: reglas de gameplay independientes de la interfaz.
- `js/ui/`: presentación y conexiones DOM.
- `js/legacy/`: sistemas funcionales anteriores aún no extraídos por completo.
- `css/`: estilos existentes, sin cambios visuales deliberados.

## Flujo de dependencias

`data → core → systems → ui → app/bootstrap`

Los módulos no deben importar el DOM desde `data` ni guardar copias de objetos. Inventario, paperdoll, barra rápida, combate y loot comparten las mismas instancias mediante `uid`.

## Event bus

`Ultra.events` ofrece `on`, `once`, `emit` y `clear`. Los módulos nuevos deben comunicar cambios con eventos:

- `equipment:changed`
- `quickbar:changed`
- `inventory:reordered`
- `inventory:changed`
- `durability:changed`
- `loot:generated`
- `save:loaded`
- `app:ready`

## Compatibilidad

Se mantienen alias temporales (`useQuickSlot`, `assignQuickSlot`, `syncQuickSlotsFromInventory`) para evitar romper sistemas anteriores. Se retirarán cuando todos los consumidores usen `Ultra.quickbar`.

## Regla de integración

Un objeto nuevo no se considera terminado hasta ser looteable, equipable, visible, reparable, vendible, persistente y compatible con su skill y atributo.
