# Rutas implementadas

Servidor: `http://localhost:3000`. Los cuerpos POST y las respuestas usan JSON (`Content-Type: application/json`). Los identificadores `ObjectId` se representan como cadenas de 24 caracteres hexadecimales en JSON.

| Método | Ruta | Operación | Respuesta |
|---|---|---|---|
| GET | `/api/productos` | Listar productos por nombre. | `200`, arreglo de productos. |
| POST | `/api/productos` | Registrar nombre, precio, marca y categoria. | `201`, producto creado con `_id`. |
| GET | `/api/clientes` | Listar clientes por nombre. | `200`, arreglo de clientes. |
| POST | `/api/clientes` | Registrar nombre y dni. | `201`, cliente creado con `_id`. |
| GET | `/api/ventas` | Listar ventas por fecha descendente, con sus relaciones. | `200`, arreglo de ventas. |
| POST | `/api/ventas` | Guardar cliente y detalles de productos. | `201`, venta creada con `_id`. |

## Cuerpos de ejemplo para POST

`POST /api/productos`

```json
{"nombre":"Laptop Lenovo IdeaPad","precio":2500,"marca":"Lenovo","categoria":"Laptop"}
```

`POST /api/clientes`

```json
{"nombre":"Ana Torres","dni":"12345678"}
```

`POST /api/ventas`

```json
{
  "cliente_id": "507f1f77bcf86cd799439011",
  "productos": [
    {"producto_id": "507f1f77bcf86cd799439012", "cantidad": 1},
    {"producto_id": "507f1f77bcf86cd799439013", "cantidad": 2}
  ]
}
```

Reemplazar los identificadores ilustrativos por los de documentos existentes. El servidor convierte las referencias a `ObjectId`, genera `fecha` como `Date`, obtiene `precio_unitario` del catálogo y calcula `total` en céntimos. No confía en precios, totales ni fechas enviados por el navegador.

La venta guardada conserva exactamente `{ _id, fecha, cliente_id, productos: [{ producto_id, cantidad, precio_unitario }], total }`. `GET /api/ventas` añade `cliente` y `productos_relacionados` a la respuesta mediante consultas `$lookup`; esos campos no se guardan en MongoDB.

## Validación y errores

- Textos obligatorios sin espacios vacíos; precio numérico finito no negativo.
- DNI de 8 dígitos; se comprueba que no esté registrado.
- Identificadores válidos, cliente y productos existentes.
- Al menos un producto, cantidades enteras positivas y sin productos repetidos en una venta.
- `400`: datos inválidos o JSON incorrecto. `409`: DNI repetido. `404`: ruta inexistente. `500`: error interno o de conexión. Formato: `{"error":"Mensaje"}`.

Los POST registran datos nuevos. Para verificar sin alterar los registros originales, utilizar únicamente las rutas GET.
