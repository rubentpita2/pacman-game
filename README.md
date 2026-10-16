# Pac-Man · Pixel Arcade

Un juego de Pac-Man para el navegador, creado con **HTML, CSS y JavaScript puro**. Sin dependencias, compilación, cuentas ni recursos externos. Interfaz en español y diseño adaptable a ordenador y móvil.

## Jugar desde GitHub, sin instalar nada

La dirección de GitHub Pages para este repositorio es:

**https://rubentpita2.github.io/pacman-game/**

Este enlace funcionará después de activar GitHub Pages y de que termine su primer despliegue. Para activarlo una sola vez desde GitHub:

1. Abre el repositorio `rubentpita2/pacman-game` y entra en **Settings → Pages**.
2. En **Build and deployment → Source**, selecciona **Deploy from a branch**.
3. Selecciona la rama **main** y la carpeta **/ (root)**; pulsa **Save**.
4. Espera a que GitHub muestre el sitio publicado y pulsa **Visit site**. El despliegue puede tardar unos minutos; consulta **Actions** si aún no está disponible.

Después, basta con abrir esa dirección desde cualquier navegador y pulsar **JUGAR AHORA**. Cada actualización de `main` se publicará automáticamente. No se necesita instalar programas, ejecutar comandos ni crear una cuenta para jugar si el sitio es público.

Si no puedes activar Pages, también puedes probarlo sin instalar programas: en GitHub pulsa **Code → Download ZIP**, extrae la carpeta y abre `index.html` con tu navegador habitual. No abras los archivos dentro del ZIP sin extraerlo.

## Ejecutar localmente (opcional)

Abre **`index.html`** con un navegador moderno (Chrome, Edge, Firefox o Safari). Funciona directamente desde el archivo, incluso sin conexión a Internet.

También puedes servirlo desde la carpeta del proyecto:

```bash
cd /workspace/pacman-game
python3 -m http.server 8000
```

En tu ordenador, abre `http://localhost:8000`. Detén el servidor con `Ctrl+C`. En un entorno remoto, utiliza la función de acceso a puertos de tu plataforma, si está disponible.

## Cómo jugar

Pulsa **JUGAR AHORA** o **Enter**. Come los 186 puntos del laberinto y evita a los cuatro fantasmas. Tienes tres vidas; perder una vida conserva los puntos ya comidos. Al limpiar el laberinto ganas la partida.

| Control | Acción |
| --- | --- |
| Flechas del teclado | Mover a Pac-Man; puedes anticipar el siguiente giro |
| P o botón Ⅱ | Pausar / continuar |
| R o botón ↻ | Reiniciar desde cero |
| Enter | Empezar, continuar desde la pausa o volver a jugar |
| Botón ♪ | Activar / desactivar sonido (silenciado al inicio) |
| Botones de dirección en pantalla | Mover en dispositivos táctiles |

- **Punto pequeño:** 10 puntos.
- **Bola de energía:** 50 puntos y 7 segundos para comer fantasmas. Se vuelven azules y parpadean antes de recuperar su estado normal.
- **Fantasmas durante la energía:** 200, 400, 800 y hasta 1600 puntos por captura consecutiva. Regresan a su casa antes de volver a perseguirte.
- **Mejor marca:** se guarda en el navegador mediante `localStorage` cuando está disponible. El juego funciona también si el almacenamiento está bloqueado.
- Al ocultar la pestaña, la partida se pausa automáticamente.

## Probar

Comprobaciones manuales para verificar una partida:

1. Inicia el juego. Pac-Man empieza a moverse; usa las flechas para girar. Las paredes bloquean el paso y los puntos desaparecen al comerlos, aumentando el marcador.
2. Pulsa **P**. El movimiento y la puntuación se detienen. Pulsa **P** otra vez o **CONTINUAR** para seguir.
3. Come una bola grande de una esquina. Los fantasmas se vuelven azules; tocarlos suma puntos en lugar de quitar vidas.
4. Toca un fantasma sin energía. Pierdes una vida y vuelves al inicio, conservando la puntuación. Tras tres colisiones aparece la pantalla de derrota.
5. Come todos los puntos para mostrar la victoria. Usa **VOLVER A JUGAR** para comenzar otra partida.
6. Pulsa **R** para restablecer puntos, vidas y laberinto. Comprueba que la mejor marca se conserva al recargar (si el navegador permite almacenamiento).
7. En móvil, prueba los botones táctiles. Activa el botón **♪** para comprobar el sonido. Cambia de pestaña para verificar la pausa automática.

Durante el desarrollo se verificaron en Chromium: arranque y puntuación con controles reales, pausa y reanudación, reinicio, activación de sonido, movimiento de fantasmas, bloqueo de paredes, bolas de energía, colisiones, vidas, victoria y derrota. También se comprobaron el diseño móvil, los controles táctiles, la accesibilidad de todos los puntos del laberinto. Los estados de colisión y fin de partida se verificaron mediante escenarios controlados en el navegador.

## Archivos

- `index.html`: estructura e interfaz accesible.
- `style.css`: diseño arcade y adaptación a pantallas pequeñas.
- `game.js`: dibujo en Canvas, movimiento, búsqueda de caminos para los fantasmas, reglas, sonido y almacenamiento de la marca.

Para editar el juego, modifica estos archivos y recarga el navegador. No hace falta instalar paquetes.

La navegación a `file://` está bloqueada por la política del Chromium administrado de este entorno, por lo que esa modalidad no se pudo verificar aquí. La validación funcional se realizó sirviendo los mismos archivos por HTTP; el juego no utiliza módulos, peticiones de red ni recursos externos.
