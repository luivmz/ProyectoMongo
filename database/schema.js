// Ejecutar con mongosh. No elimina ni modifica documentos existentes.
{
  const tienda = db.getSiblingDB("tienda_computadoras");
  const existentes = tienda.getCollectionNames();

  for (const nombre of ["productos", "clientes", "ventas"]) {
    if (!existentes.includes(nombre)) {
      tienda.createCollection(nombre);
      print("Colección creada: " + nombre);
    } else {
      print("Colección existente: " + nombre);
    }
  }
}
