// Ejecutar con mongosh. Todas las operaciones son de lectura.
{
  const tienda = db.getSiblingDB("tienda_computadoras");

  print("Productos ordenados por nombre:");
  printjson(tienda.productos.find({}).sort({ nombre: 1 }).toArray());

  print("Productos con precio menor o igual a 3000:");
  printjson(tienda.productos.find({ precio: { $lte: 3000 } }).toArray());

  print("Clientes:");
  printjson(tienda.clientes.find({}).toArray());

  print("Ventas con cliente, detalles y productos relacionados:");
  printjson(tienda.ventas.aggregate([
    { $lookup: {
      from: "clientes",
      localField: "cliente_id",
      foreignField: "_id",
      as: "cliente"
    } },
    { $unwind: { path: "$cliente", preserveNullAndEmptyArrays: true } },
    { $lookup: {
      from: "productos",
      localField: "productos.producto_id",
      foreignField: "_id",
      as: "productos_relacionados"
    } },
    { $project: {
      fecha: 1,
      cliente_id: 1,
      "cliente.nombre": 1,
      "cliente.dni": 1,
      productos: 1,
      productos_relacionados: 1,
      total: 1
    } }
  ]).toArray());
}
