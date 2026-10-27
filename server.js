const express = require('express');
const path = require('node:path');
const { MongoClient, ObjectId } = require('mongodb');

function validar(condicion, mensaje, status = 400) {
  if (!condicion) throw Object.assign(new Error(mensaje), { status });
}

function texto(valor, campo) {
  validar(typeof valor === 'string' && valor.trim().length > 0, `Complete ${campo}.`);
  return valor.trim();
}

function identificador(valor) {
  validar(typeof valor === 'string' && /^[a-f0-9]{24}$/i.test(valor), 'Identificador inválido.');
  return new ObjectId(valor);
}

function crearApp(db) {
  const app = express();
  app.use(express.json({ limit: '100kb' }));
  app.use(express.static(path.join(__dirname, 'public')));

  app.get('/api/productos', async (req, res) => {
    res.json(await db.collection('productos').find({}).sort({ nombre: 1 }).toArray());
  });

  app.post('/api/productos', async (req, res) => {
    const { nombre, precio, marca, categoria } = req.body || {};
    validar(typeof precio === 'number' && Number.isFinite(precio) && precio >= 0,
      'El precio debe ser un número mayor o igual a cero.');
    const producto = {
      nombre: texto(nombre, 'nombre'), precio,
      marca: texto(marca, 'marca'), categoria: texto(categoria, 'categoría')
    };
    const resultado = await db.collection('productos').insertOne(producto);
    res.status(201).json({ ...producto, _id: resultado.insertedId });
  });

  app.get('/api/clientes', async (req, res) => {
    res.json(await db.collection('clientes').find({}).sort({ nombre: 1 }).toArray());
  });

  app.post('/api/clientes', async (req, res) => {
    const { nombre, dni } = req.body || {};
    const cliente = { nombre: texto(nombre, 'nombre'), dni: texto(dni, 'DNI') };
    validar(/^\d{8}$/.test(cliente.dni), 'El DNI debe tener 8 dígitos.');
    validar(!await db.collection('clientes').findOne({ dni: cliente.dni }), 'El DNI ya está registrado.', 409);
    const resultado = await db.collection('clientes').insertOne(cliente);
    res.status(201).json({ ...cliente, _id: resultado.insertedId });
  });

  app.get('/api/ventas', async (req, res) => {
    const ventas = await db.collection('ventas').aggregate([
      { $sort: { fecha: -1 } },
      { $lookup: { from: 'clientes', localField: 'cliente_id', foreignField: '_id', as: 'cliente' } },
      { $unwind: { path: '$cliente', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'productos', localField: 'productos.producto_id', foreignField: '_id', as: 'productos_relacionados' } }
    ]).toArray();
    res.json(ventas);
  });

  app.post('/api/ventas', async (req, res) => {
    const { cliente_id, productos } = req.body || {};
    const clienteId = identificador(cliente_id);
    validar(Array.isArray(productos) && productos.length > 0, 'Agregue al menos un producto.');
    const detalles = productos.map(detalle => {
      validar(detalle && Number.isSafeInteger(detalle.cantidad) && detalle.cantidad > 0,
        'La cantidad debe ser un entero positivo.');
      return { producto_id: identificador(detalle.producto_id), cantidad: detalle.cantidad };
    });
    validar(new Set(detalles.map(d => d.producto_id.toHexString())).size === detalles.length,
      'Seleccione cada producto una sola vez y ajuste su cantidad.');
    validar(await db.collection('clientes').findOne({ _id: clienteId }), 'El cliente no existe.');
    const catalogo = await db.collection('productos').find({
      _id: { $in: detalles.map(d => d.producto_id) }
    }).toArray();
    validar(catalogo.length === detalles.length, 'Uno de los productos no existe.');

    let totalCentimos = 0;
    for (const detalle of detalles) {
      const producto = catalogo.find(p => p._id.equals(detalle.producto_id));
      const precio = Number(producto.precio);
      validar(Number.isFinite(precio) && precio >= 0, 'El producto tiene un precio inválido.');
      // Se trabaja en céntimos para evitar errores al sumar decimales.
      const centimos = Math.round(precio * 100);
      totalCentimos += centimos * detalle.cantidad;
      validar(Number.isSafeInteger(totalCentimos), 'El importe es demasiado grande.');
      detalle.precio_unitario = centimos / 100;
    }
    const venta = { fecha: new Date(), cliente_id: clienteId, productos: detalles, total: totalCentimos / 100 };
    const resultado = await db.collection('ventas').insertOne(venta);
    res.status(201).json({ ...venta, _id: resultado.insertedId });
  });

  app.use((req, res) => res.status(404).json({ error: 'Ruta no encontrada.' }));
  app.use((error, req, res, next) => {
    const status = error.code === 11000 ? 409 : (error.status || 500);
    if (status >= 500) console.error(error.message);
    res.status(status).json({ error: error.code === 11000 ? 'El registro ya existe.'
      : error.type === 'entity.parse.failed' ? 'El JSON enviado no es válido.'
      : status >= 500 ? 'No se pudo completar la operación. Verifique MongoDB.' : error.message });
  });
  return app;
}

async function iniciar() {
  const cliente = new MongoClient('mongodb://127.0.0.1:27017', { serverSelectionTimeoutMS: 3000 });
  try {
    await cliente.connect();
    // El arranque solo se conecta: no ejecuta schema, seed ni crea índices.
    const servidor = crearApp(cliente.db('tienda_computadoras')).listen(3000, '127.0.0.1', () => {
      console.log('Sistema de Venta de Computadoras: http://localhost:3000');
    });
    servidor.on('error', async error => {
      console.error('No se pudo abrir el puerto 3000:', error.message);
      await cliente.close();
      process.exitCode = 1;
    });
  } catch (error) {
    console.error('No se pudo conectar a MongoDB:', error.message);
    await cliente.close();
    process.exitCode = 1;
  }
}

if (require.main === module) iniciar();
module.exports = { crearApp };
