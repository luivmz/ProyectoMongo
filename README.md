# Sistema de Venta de Computadoras

Proyecto académico simple con Node.js, Express, el driver oficial de MongoDB y una página HTML, CSS y JavaScript Vanilla. Permite listar y registrar productos, clientes y ventas. Los detalles de cada venta se guardan dentro de `ventas`, sin una colección adicional.

## Datos académicos

- Estudiante: Luis Vila Meza
- Código: 73050597
- Curso: Ing Web
- Universidad: Continental
- Fecha: Tue 27 OCT

## Uso en macOS

Se requiere Node.js 20.19 o superior y MongoDB Community en ejecución. `mongosh` es opcional para usar los scripts académicos.

Si MongoDB ya está funcionando, omitir el arranque. Para iniciarlo manualmente en una terminal:

```sh
mkdir -p "$HOME/data/db"
mongod --dbpath "$HOME/data/db" --bind_ip 127.0.0.1 --port 27017
```

## Iniciar la aplicación

Desde esta carpeta, con MongoDB funcionando:

```sh
npm install
npm start
```

Abrir **http://localhost:3000**. Las únicas dependencias directas son `express` y `mongodb`.

La conexión usa `mongodb://127.0.0.1:27017` y la base `tienda_computadoras`. El arranque no ejecuta scripts de carga ni modifica registros. No es necesario ejecutar `schema.js` ni `seed.js` con la base existente.

La página tiene tres secciones: productos, clientes y ventas. Para una venta, seleccione un cliente, agregue productos con sus cantidades y pulse **Guardar venta**. El total de la página es estimado; el servidor consulta los precios actuales en MongoDB y guarda el total definitivo, la fecha y las referencias `ObjectId`.

## Scripts de MongoDB

Para abrir una consola de la base:

```sh
mongosh "mongodb://127.0.0.1:27017/tienda_computadoras"
```

MongoDB utiliza scripts JavaScript ejecutados con `mongosh` en lugar de sentencias SQL para estas operaciones.

Para ejecutar solamente consultas de lectura:

```sh
mongosh "mongodb://127.0.0.1:27017" --file database/consultas.js
```

Estos comandos son opcionales y pueden escribir datos. No son necesarios para consultar la base existente:

```sh
mongosh "mongodb://127.0.0.1:27017" --file database/schema.js
mongosh "mongodb://127.0.0.1:27017" --file database/seed.js
```

`schema.js` crea únicamente colecciones faltantes. `seed.js` agrega ejemplos únicamente a colecciones vacías; si ya existen los 4 productos, 1 cliente y 1 venta, conserva todos esos datos y no inserta nada.

## Archivos

- `docs/diseno.md`: modelo y diccionario de datos.
- `database/schema.js`: creación de colecciones.
- `database/seed.js`: carga opcional de ejemplos.
- `database/consultas.js`: consultas de lectura y relaciones.
- `routes/endpoints.md`: las seis rutas GET y POST implementadas bajo `/api`.
- `server.js`: servidor Express, validación y conexión a MongoDB.
- `public/`: página web, estilos y JavaScript.
- `package.json` y `package-lock.json`: dependencias y comando de inicio.

Verificación de sintaxis sin conectarse a MongoDB (si Node.js está disponible):

```sh
node --check database/schema.js
node --check database/seed.js
node --check database/consultas.js
node --check server.js
node --check public/app.js
```

Para verificar las consultas con la aplicación iniciada, sin insertar datos:

```sh
curl http://localhost:3000/api/productos
curl http://localhost:3000/api/clientes
curl http://localhost:3000/api/ventas
```
