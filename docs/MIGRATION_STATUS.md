# Estado de migración

## Extraído en esta versión

- Arranque de aplicación.
- Bus de eventos.
- Catálogo de armas y herramientas añadidas.
- Reglas de compatibilidad de equipo y spellbook.
- Modelo y controles de barra rápida.
- Vista de barra rápida.
- Integración visual del inventario y paperdoll.
- Arrastrar y soltar.
- Botón de mochila.
- Durabilidad de herramientas.
- Botín de armas extendidas.
- Persistencia de barra rápida.

## Conservado como compatibilidad

Los sistemas con sufijos históricos (`v721`, `v724`, etc.) se movieron a `js/legacy/systems`. Siguen activos y cargan en el mismo orden. Deben migrarse uno por uno con pruebas de regresión.

## Próximas extracciones recomendadas

1. Dividir `js/ui/ui.js` por diálogo: inventario, skills, vendors, banco, crafting y mapa.
2. Dividir `js/data/items.js` por familias declarativas.
3. Separar `westerosRenderer.js` en cuerpo, ropa, armaduras, armas y efectos.
4. Unificar guardado y carga en `js/core/save/`.
5. Sustituir llamadas directas restantes por eventos.
