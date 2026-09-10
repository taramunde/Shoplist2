# Lista de la compra

Aplicación web sencilla (HTML, CSS y JavaScript, sin dependencias ni servidor) para
llevar la lista de la compra y enviársela a otra persona por WhatsApp o por
cualquier otro medio.

## Cómo funciona

- Tienes un catálogo de productos por categorías (fruta y verdura, carnicería,
  pescadería, lácteos, despensa, limpieza, etc.). Escribe en el buscador y
  aparecen sugerencias; también puedes añadir cualquier producto que no esté
  en el catálogo.
- Cada producto tiene cantidad y unidad editables (kg, g, l, ml, ud, docena,
  brick, lata, bote, paquete, bolsa, barra).
- El botón **Compartir** genera un enlace que lleva toda la lista codificada
  en la propia URL (no hay base de datos ni servidor: todo viaja dentro del
  enlace) y abre el diálogo de compartir del móvil (o WhatsApp Web como
  alternativa). **Copiar enlace** lo copia al portapapeles para pegarlo donde
  quieras.
- Cuando la otra persona abre el enlace, la app carga esa lista y la puede ir
  marcando mientras compra. Si quiere reenviarte el estado actualizado (lo
  que falta), solo tiene que pulsar Compartir de nuevo.
- Cada dispositivo guarda además su propia lista en el navegador
  (`localStorage`), así que si cierras la app sin compartir nada, la lista
  sigue ahí al volver a abrirla.

## Estructura de archivos

```
lista-compra/
├── index.html
├── css/
│   └── style.css
└── js/
    ├── products.js   → catálogo de productos por categoría
    ├── share.js      → codificar/decodificar la lista en la URL y compartir
    └── app.js        → estado de la lista, render e interacción
```

## Publicarla en GitHub Pages

1. Crea un repositorio nuevo en GitHub y sube esta carpeta (o su contenido)
   tal cual.
2. En el repositorio, ve a **Settings → Pages**.
3. En "Build and deployment", elige **Deploy from a branch**, selecciona la
   rama `main` (o la que uses) y la carpeta `/ (root)`.
4. Guarda. GitHub te dará una URL del tipo
   `https://tu-usuario.github.io/tu-repositorio/`.
5. Esa es la URL que debes abrir para usar la app; los enlaces que genere el
   botón Compartir se construyen a partir de esa misma dirección, así que
   funcionarán para cualquiera que los reciba.

No hace falta ningún paso de compilación: son archivos estáticos tal cual.

## Personalizar el catálogo

Para añadir, quitar o reorganizar productos y categorías, edita
`js/products.js`. Cada categoría es un objeto con `categoria` y una lista de
`productos` (`nombre` + `unidad` por defecto). El orden en que aparecen ahí
es también el orden en que se muestran en la lista.
