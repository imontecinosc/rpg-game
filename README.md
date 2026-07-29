# Proyecto Ultra V7.32

## Cambios V7.32 — personajes y animaciones V8

- Carrera conectada al desplazamiento rápido.
- Minería y tala a dos manos en las cuatro direcciones.
- Profundidad corregida para pico y hacha al mirar arriba o abajo.
- Proporciones fijas, codos y hombros actualizados en caminar y correr.
- Bandidos de Hierrogris con armas, escudos y protecciones visibles.

## Cambios V7.28 — modelos del laboratorio integrados

Se trajo al juego todo lo diseñado en el laboratorio Westeros V8 y se eliminó
la duplicación de renderizadores.

### Armaduras, túnicas y capas
- 6 sets de armadura completos, con las 8 piezas cada uno: Placas del Norte,
  Escamas de Valyria, Brigantina de la Guardia, Jubón acolchado, Coraza de
  tiras y Cuero tachonado.
- 3 túnicas (maestre, sobreveste heráldica, cruzada) y 3 capas (invierno,
  manto de corte, con capucha). La capucha se dibuja sobre la cabeza.
- **El material equipado decide la forma.** Hierro y hierro ennegrecido usan
  placas; cobre usa brigantina; oro, plata, mithril y hueso usan escamas; tela
  y sedas usan jubón; cuero y cuero de oso usan tiras; jabalí y troll usan
  tachonado. Ya no hacen falta selectores: dos piezas del mismo color se ven
  distintas si son de materiales distintos.

### Armas
- 3 forjas con las 13 piezas cada una, incluido el escudo: Forja del Norte,
  Acero de Valyria y Hierro de los Fosos.
- La forja sale del material del arma, y el color sigue saliendo de
  `weaponColor`. Forma y color son independientes.

### Monstruos
- 14 criaturas reconstruidas sobre cuatro planes corporales (cuadrúpedo,
  dragón, bípedo, flotante y arácnido): lobo, oso, drake, dragón, gigante,
  orco, gul, caminante blanco, espectro, mago de hueso, wraith, lich, jabalí
  y araña.
- Cada una responde a idle, caminar, ataque, magia, daño y muerte.
- La paleta del juego sigue mandando, así que las variantes Notable y Exaltado
  cambian de color igual que antes.
- El Guardián del Umbral ahora es un Lich y el Custodio de la Cripta un Mago
  de Hueso. Antes los dos reusaban el modelo del gigante.
- El punto de apoyo de cada criatura se midió una por una para que ninguna
  quede flotando ni enterrada respecto a la sombra del mundo.

### Correcciones
- Las bestias nunca atacaban: el adaptador manda `action: 'attack'` pero el
  clip se llama `melee`, así que caían a idle. Corregido.
- Se eliminó `js/core/characterRenderer.js` (1.505 líneas). Estaba cargado y
  su única exportación quedaba sobrescrita por `westerosRenderer.js`, que
  solo lo usaba para dibujar bestias. Ahora las bestias también usan el
  renderizador nuevo, así que el archivo era código muerto.
- Caché de scripts a `v=728`.

# Proyecto Ultra V7.27

Actualización de jugabilidad móvil: controles de zoom junto a las habilidades,
minimapa plegable, barra rápida táctil, selección cíclica de objetivos y
feedback de alcance/combate.

Versión de consolidación basada en V7.25.

- HUD de zoom separado de habilidades y caché `v=726`.
- Especiales funcionales de nivel 60 y 80 para Espada, Magia y Curación.
- Máximo 100 por habilidad y 700 puntos totales.
- Controles Subir, Mantener y Bajar conectados a la redistribución real.
- Roles enemigos con posicionamiento, protección y control diferenciados.
- Recompensas regionales escaladas por riesgo.
- Identificadores de equipo heredados normalizados.
- Progresión cobre/hierro y guardado V7.26 corregidos.
- Compatibilidad de carga con el guardado V7.24/V7.25.
