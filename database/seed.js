// Ejecutar con mongosh. Solo carga ejemplos en colecciones vacías.
// No ejecutar simultáneamente desde varias terminales.
{
  const tienda = db.getSiblingDB("tienda_computadoras");

  if (tienda.productos.countDocuments({}) === 0) {
    tienda.productos.insertMany([
      { nombre: "Laptop Lenovo IdeaPad", precio: 2500, marca: "Lenovo", categoria: "Laptop" },
      { nombre: "Laptop HP Pavilion", precio: 3000, marca: "HP", categoria: "Laptop" },
      { nombre: "Monitor Samsung 24 pulgadas", precio: 600, marca: "Samsung", categoria: "Monitor" },
      { nombre: "Teclado Logitech K120", precio: 50, marca: "Logitech", categoria: "Accesorio" }
    ]);
    print("Productos de ejemplo creados.");
  } else {
    print("Productos existentes: se conservan sin cambios.");
  }

  if (tienda.clientes.countDocuments({}) === 0) {
    tienda.clientes.insertOne({ nombre: "Ana Torres", dni: "12345678" });
    print("Cliente de ejemplo creado.");
  } else {
    print("Clientes existentes: se conservan sin cambios.");
  }

  if (tienda.ventas.countDocuments({}) === 0) {
    const cliente = tienda.clientes.findOne({});
    const producto = tienda.productos.findOne({});

    if (cliente && producto) {
      tienda.ventas.insertOne({
        fecha: new Date(),
        cliente_id: cliente._id,
        productos: [{
          producto_id: producto._id,
          cantidad: 1,
          precio_unitario: producto.precio
        }],
        total: producto.precio
      });
      print("Venta de ejemplo creada con referencias existentes.");
    }
  } else {
    print("Ventas existentes: se conservan sin cambios.");
  }
}
