# Proyecto Ultra V7.16

## Cambios V7.16

### Legendarios obtenibles
- El catálogo tenía un solo objeto Legendario, el Anillo del depredador, y no estaba en ninguna tabla de loot: era inobtenible. Lo mejor que soltaba un jefe era Épico.
- Tres legendarios nuevos, uno exclusivo por jefe:
  - **Sudario del Velo** (túnica, Seda del Velo) — Custodio del Velo, 6%
  - **Filo del Umbral** (espadón a dos manos, hierro ennegrecido) — Guardián del Umbral, 5%
  - **Corona del Sepulcro** (casco de hueso) — Custodio de la Cripta, 6%
- El Anillo del depredador ahora lo suelta el Guardián del Umbral al 4%.
- Los cuatro llevan 4 bonos, que es el máximo que conserva `rarityBuffCounts` para Legendario, y todos usan bonos compatibles con su tipo de objeto.

### Set de Cuero completo
- Nueva **Rodela de cuero**: escudo ligero, poca armadura, sin requisito de fuerza. El set de Cuero pasa de 7/8 a 8/8.

### Notas de auditoría
- Los cuatro sets de metal (Hierro, Cobre, Oro, Mithril) ya estaban completos 8/8, igual que el de Hueso. El catálogo tiene 176 definiciones y 35 armas.
- Hierro y Cuero no tienen bonos porque son de rareza Común, y `rarityBuffCounts` define Común como `[0,0]`: cero propiedades mágicas por diseño. No es un error.
- Pendiente de decisión: Cobre es Poco común (1 bono) pero tiene menos armadura que Hierro, que es Común (0 bonos). La progresión de metales queda invertida en ese tramo.
- Pendiente: existen ids duplicados heredados de versiones anteriores (`helmet` junto a `ironHelmet`, `boots` junto a `leatherBoots`).

## Cambios V7.15

### El suelo
- Se quitó el contorno de cada baldosa. Producía una reja visible que hacía parecer el suelo un tablero de pruebas, y costaba unos 3.600 `stroke` por frame — más de 200.000 por segundo. Ultima Online no dibujaba contornos de baldosa.
- Las baldosas se solapan 0,7 px para que al quitar el contorno no queden costuras claras entre una y otra.
- El terreno tiene variación de color por baldosa, con ruido determinista según la posición: siempre da el mismo valor para el mismo par (x, y), así el suelo no titila al moverse. Antes había 3 colores para el mundo entero.
- Los bordes de agua, mina y ciudad se corren según ese mismo ruido, así dejan de ser círculos perfectos.

### Atmósfera
- Luz cálida alrededor de las ciudades, con caída gradual hasta 14 baldosas más allá del radio seguro.
- Viñeta que oscurece los bordes de la pantalla. El gradiente se crea una sola vez y se rehace solo si cambia el tamaño de la ventana.

### Edificios
- Dejaron de ser un `fillRect` con un triángulo encima. Ahora tienen volumen isométrico: pared oeste en sombra, pared este iluminada y techo a cuatro aguas.
- El ancho, el fondo, la altura, la altura del techo y el color varían según la posición y la ciudad. Antes las dos ciudades tenían los mismos seis edificios idénticos en los mismos lugares.
- Se dibujan de atrás hacia adelante para que el solape quede correcto.

### Curva de canalización
- `ANIM.cast` ya no es un seno plano. Usa el progreso real de la canalización (`castProgress`, del adaptador al renderizador) con una curva de acumulación: lento al principio, intenso al final, con un temblor que crece.
- Perfil medido: 25% → 0,095 · 50% → 0,308 · 75% → 0,613 · 95% → 0,916 · 100% → 1,0.
- Se nota más en el Portal, que canaliza 2,5 segundos.

## Cambios V7.14

### Curvas de animación
- Se quitó la cuantización del caminar. Antes el tiempo se redondeaba a 18 pasos por segundo (`Math.round(rawTime * 18) / 18`), pero solo para las extremidades: la posición del personaje seguía interpolando suave a 60 fps. El resultado era un cuerpo que se deslizaba con piernas a saltitos, que no lee como estilo retro sino como falla.
- El golpe ya no sale de un seno global. Ahora usa el progreso real del temporizador de combate (`attackProgress`, que viaja del combate al adaptador y de ahí al renderizador) y una curva de tres tiempos:
  - 28% anticipación, con el brazo yendo hacia atrás (valores negativos hasta -0,35)
  - 16% impacto, subida brusca al pico de 1,0
  - 56% recuperación, bajada gradual
  Un seno repartía los tres tiempos por igual, y por eso ningún golpe tenía peso.
- `attackTotal` acompaña a `attackAnim` en los tres casos que lo usan: jugador 0,42s, enemigos 0,45s, guardias 0,3s. Así el progreso llega exacto a 1 y no se corta antes.
- El caminar es asimétrico (`walkCurve`): la fase de empuje es más amplia y la de retorno más seca, en vez de dos mitades espejo.
- El rebote del torso va desfasado -0,5 respecto a las piernas. Antes usaba el mismo seno, así que subía y bajaba exactamente con ellas y aplanaba el ciclo.

## Cambios V7.13

### Corrección: elementos ocultos que se veían igual
- El velo de "Has muerto" aparecía al abrir el juego y no se iba nunca. La causa: `#death-veil { display: grid }` usa un selector de id, que le gana en especificidad a la regla `[hidden] { display: none }` del navegador. El atributo `hidden` quedaba sin efecto.
- La barra de canalización tenía el mismo problema y también estaba siempre visible.
- Y venía de antes: `#target-card` (la tarjeta del enemigo) tiene `display: flex` por selector de id desde versiones anteriores, así que también se mostraba siempre, vacía, aunque `ui.js` la oculte con el atributo `hidden`.
- Arreglado de raíz con una regla global `[hidden] { display: none !important }` en `base.css`, que protege a estos tres y a cualquier elemento que se agregue después.

## Cambios V7.12

### Manos y guantes en vistas laterales
- Las vistas de perfil (`drawRight` y `drawLeft`) construían los brazos a mano con segmentos fijos, en vez de usar el brazo articulado que ya usaban las vistas de frente y espalda. El antebrazo quedaba siempre en color de piel, sin consultar armadura ni guantes.
- El brazo de atrás además no tenía mano: terminaba en un muñón, salvo cuando llevabas dos hachas.
- Ahora los dos brazos de perfil usan `drawJointedArm`, así respetan armadura y guantes igual que el resto.
- Nueva función `drawSideHand`: dibuja la mano con un puño de guantelete cuando hay guantes equipados, para que la pieza se lea aunque el arma tape la palma.
- Verificado que equipar guantes cambia el dibujo en las cuatro vistas, y que los guantes de hierro se ven distintos de los de tela.

## Cambios V7.11

### Canalización de hechizos
- Los hechizos ya no salen al instante: cada uno tiene un tiempo de canalización propio. Aguja de hielo 0,45s · Bola de fuego 0,7s · Veneno arcano 0,8s · Rayo 1,05s · Luz vital 1,2s · Portal 2,5s.
- El maná se descuenta al completarse, no al empezar. Si la canalización falla, no cuesta nada.
- Al terminar se revalida el objetivo: si murió o se alejó, el hechizo se cancela con aviso.
- Mientras canalizas te mueves al 40% de tu velocidad (`U.CAST_SLOW`). No quedas clavado.
- No se puede autoatacar ni lanzar otro hechizo durante la canalización.
- Barra de canalización sobre el HUD con el nombre del hechizo y su progreso.
- El daño recibido NO interrumpe por defecto. Cambia `U.CAST_INTERRUPT_ON_HIT` a `true` en `state.js` si prefieres que sí.

### La muerte se ve
- `U.die()` reaparecía en el mismo frame, así que la animación de caída no alcanzaba a mostrarse. Ahora la muerte dura 1,8 segundos (`U.DEATH_HOLD`): el cuerpo cae de lado, se desvanece y recién entonces reapareces.
- Durante la muerte el personaje no responde a los controles.
- Velo de muerte en pantalla que recuerda que los objetos quedaron en el cadáver.
- `U.die()` se separó en `U.die()` (soltar objetos e iniciar la muerte) y `U.respawn()` (restaurar y reubicar).
- El progreso de caída ahora usa `deathTotal`, así el jugador y las bestias pueden tener duraciones distintas.

## Cambios V7.10

### Colores de material
- El adaptador visual conocía el color de 5 materiales de los 20 que usa el catálogo. Los 15 restantes caían al color por defecto, así que un set completo de cuero de oso, de troll o de jabalí se veía idéntico. Ahora los 20 tienen color.
- Nota: el color se aplica a piezas de `type: 'armor'` para la capa de armadura y `type: 'weapon'` para el arma. Las capas y túnicas usan sus propios colores.

### Animación de lanzar hechizo
- El renderizador ya tenía la animación de conjuro completa, con su curva en `ANIM.cast`, pero nunca se ejecutaba: `magic.js` asignaba `attackAnim`, que es el gesto de golpe con arma, y el adaptador solo producía `idle`, `melee` y `walk`.
- Los hechizos ahora asignan `castAnim` y el adaptador reporta `action: 'cast'`.

### Reacción al golpe y a la muerte
- `hitAnim` del jugador se decrementaba en cada frame pero nunca se asignaba. Ahora se asigna al recibir daño no bloqueado, y el cuerpo retrocede e se inclina, con el desplazamiento máximo en el impacto.
- Las bestias también reciben golpe y muerte: la rama de bestias del adaptador retornaba antes de entregar esos valores.
- La muerte de los enemigos no se podía ver: `killEnemy` asignaba `deathAnim = 0.8`, pero el loop no lo decrementaba para enemigos muertos y `render.js` los filtraba del dibujo. Ahora caen de lado y se desvanecen antes de desaparecer.

### Pendiente conocido
- La forma dibujada sigue siendo genérica por ranura: las 6 espadas comparten una silueta y la pechera de hierro y la de mithril también.
- El color de armadura sigue siendo único para todo el cuerpo, no por pieza.
- La muerte del jugador es instantánea por diseño (`U.die()` reaparece de inmediato), así que su animación de caída no alcanza a verse. Requiere decidir si la muerte tiene un momento propio.

## Cambios V7.9

### Estética
- Tipografía real: Cinzel para títulos y nombres de objeto, Alegreya Sans para la interfaz. Antes el CSS pedía Inter pero nunca se cargaba, así que todo se veía en Arial.
- Paleta de pizarra fría con latón apagado. Los nombres de variables se conservaron, así que el cambio alcanza a todo el juego.
- Marcos angulares de 2px con cabecera grabada, en vez de esquinas redondeadas de 8-10px.
- Barras de vida, maná y aguante como canal de metal, con superficie de líquido y cifras tabulares.

### Equipo e inventario
- El panel se reorganiza en tres zonas: personaje, inventario y ficha del objeto.
- Catorce ranuras cuadradas de 44px en posición anatómica, en vez de rectángulos posicionados en absoluto.
- Las ranuras vacías muestran el icono de su categoría apagado y, al tocarlas, explican qué aceptan.
- Nueva ranura equipable: Collar. Los amuletos dejan de competir con el gorjal por la ranura de Cuello.
- La ranura de Escudo se marca bloqueada cuando llevas un arma de dos manos, y explica el motivo.
- Los bordes de cada celda y ranura toman el color de la rareza del objeto.
- Grilla de 40 casillas: 8 columnas en escritorio, 5 en pantallas chicas.
- Resumen de armadura, daño, carga y oro bajo el personaje.

### Correcciones
- El inventario tiene un tope real de 40 casillas. Antes la etiqueta decía 120 y `addItem` no validaba nada. El banco y los cadáveres siguen sin límite.
- Un apilable que ya existe se acepta aunque el inventario esté lleno; uno nuevo se rechaza con aviso.
- La ropa inicial ya se equipa. `main.js` usaba `.forEach(U.addItem)`, y como `forEach` entrega el índice como segundo argumento, los 16 objetos iniciales se agregaban a un arreglo temporal con cantidad equivocada. El personaje arrancaba sin nada equipado.

## Cambios V7.8.1

- El HUD se refresca 12 veces por segundo en vez de 60. El canvas sigue a 60 fps.
- Los selectores del DOM se resuelven una sola vez y quedan en caché.
- El respawn de enemigos usa marca de tiempo en vez de `setTimeout`, así sobrevive a recargar la página y se guarda con la partida.
- El botón Reiniciar borra todas las claves del juego. Antes no borraba la que estaba en uso.
- Código formateado con Prettier y configuración incluida en `.prettierrc`.

## Cambios V7.8

- La dificultad normal queda reducida a cinco niveles; el verde se reserva para aliados.
- El poder base continúa dependiendo de la especie, no solo del nivel.
- Los Notables conservan su color normal y son un 25% más grandes.
- Los Exaltados son dorados, un 45% más grandes y superiores en vida, daño y recompensas.
- Las variantes se nombran después de la especie: `Araña umbría [Notable]` y `Araña umbría [Exaltado]`.

## Cambios V7.7

- Las placas de las grebas laterales comparten cadera, rodilla y tobillo con la pierna animada.
- La armadura de piernas ya no queda suspendida al caminar hacia izquierda o derecha.
- Cada arma determina el atributo que entrena al ejecutar un ataque válido.
- Espadas, mazas, hachas y demás armas contundentes entrenan Fuerza.
- Arcos, ballestas, dagas, lanzas y combate de puños entrenan Destreza.
- Las armas pesadas de dos manos aportan algo más de progreso por ataque válido.

## Cambios V7.6

- Pechera extendida hasta el inicio de las piernas, con cobertura frontal, trasera y lateral.
- Sombras centradas bajo los pies.
- Progresión funcional de Fuerza, Destreza e Inteligencia mediante práctica válida.
- Fuerza mejora vida y carga; Destreza mejora energía; Inteligencia mejora maná.
- Mapa corregido: W mueve el marcador hacia arriba y D hacia la derecha.
- Nueva región: Santuario del Velo.
- Nuevos enemigos: Tejedora del Velo, Hundido del pantano y Custodio del Velo.
- Nuevo recurso: Esencia del Velo.
- Nuevos equipables y recetas: Capa del Velo y Maza del Pantano.

## Corrección visual V7.5

- Las pecheras siguen la silueta completa del torso desde los hombros hasta la cintura.
- El cuerpo de la armadura se estrecha hacia la cintura en vez de usar un rectángulo rígido.
- Se igualó su cobertura en las vistas frontal, trasera y laterales.
- El cambio también se aplica al personaje mostrado en el panel de Equipo.
- No se alteraron la escala del personaje, sus extremidades ni el orden de las capas.

Actualización centrada en minería, loot y claridad visual.

- Equipo de mithril y objetos superiores fuera de las tiendas.
- Mithril obtenido mediante loot, minería avanzada y fabricación.
- Mina Escuela de Brumaférrea con extracción acelerada y forja interior.
- Nuevo enemigo Acechador de veta.
- Recoger objeto y Recoger todo en cadáveres.
- Flechas orientadas hacia el objetivo, sin marcador cuadrado.
- Partículas por tipo de magia: fuego naranja, hielo azul, rayo amarillo y veneno morado.
- Sombras restauradas bajo jugador, NPC, guardias y criaturas.
- Coleta capilar larga, unida a la nuca y extendida más allá de los hombros.

## Fabricación completa

- Cobre, hierro, oro y mithril: casco, gorjal, pecho, brazos, guantes, piernas, botas y escudo.
- Cada metal: espada, daga, lanza, hacha y maza.
- Cuero común, cuero de troll, cuero de jabalí y cuero de oso: siete piezas corporales fabricables.
- Madera común, roble, tejo y madera férrea: arco y ballesta de dos manos.
- Nuevos recursos obtenibles: oro, piel común y maderas avanzadas.
- Calidad y rareza se generan por separado al fabricar.

## Menú de fabricación jerárquico

- Primer nivel: selección del material disponible en la estación.
- Segundo nivel: armaduras, armas, procesado u otros.
- Tercer nivel: selección de la pieza concreta.
- La ruta elegida permanece activa después de fabricar.
- En pantallas móviles, los selectores se desplazan horizontalmente para conservar espacio.
