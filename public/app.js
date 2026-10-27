const $ = selector => document.querySelector(selector);
const moneda = valor => new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(Number(valor));
let productos = [];
let carrito = [];

function mensaje(texto, error = false) {
  $('#mensaje').textContent = texto;
  $('#mensaje').classList.toggle('error', error);
}

async function api(ruta, datos) {
  const respuesta = await fetch('/api/' + ruta, datos === undefined ? {} : {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(datos)
  });
  const resultado = await respuesta.json();
  if (!respuesta.ok) throw new Error(resultado.error || 'No se pudo completar la operación.');
  return resultado;
}

// Los valores de MongoDB se muestran como texto, sin interpretarlos como HTML.
function fila(destino, valores) {
  const tr = document.createElement('tr');
  for (const valor of valores) {
    const td = document.createElement('td');
    if (valor instanceof Node) td.append(valor);
    else td.textContent = valor;
    tr.append(td);
  }
  $(destino).append(tr);
}

function selector(destino, elementos, titulo, etiqueta) {
  const select = $(destino);
  const anterior = select.value;
  select.replaceChildren(new Option(titulo, ''));
  for (const item of elementos) select.add(new Option(etiqueta(item), item._id));
  select.value = elementos.some(item => item._id === anterior) ? anterior : '';
}

function dibujarCarrito() {
  $('#detalle-venta').replaceChildren();
  let total = 0;
  for (const item of carrito) {
    const producto = productos.find(p => p._id === item.producto_id);
    const subtotal = Math.round(Number(producto.precio) * 100) * item.cantidad;
    total += subtotal;
    const quitar = document.createElement('button');
    quitar.type = 'button';
    quitar.textContent = 'Quitar';
    quitar.addEventListener('click', () => {
      carrito = carrito.filter(d => d.producto_id !== item.producto_id);
      dibujarCarrito();
    });
    fila('#detalle-venta', [producto.nombre, item.cantidad, moneda(producto.precio), moneda(subtotal / 100), quitar]);
  }
  if (!carrito.length) fila('#detalle-venta', ['Agregue productos para registrar una venta.', '', '', '', '']);
  $('#total-venta').textContent = moneda(total / 100);
}

async function cargar() {
  const [listaProductos, clientes, ventas] = await Promise.all([api('productos'), api('clientes'), api('ventas')]);
  productos = listaProductos;
  for (const destino of ['#lista-productos', '#lista-clientes', '#lista-ventas']) $(destino).replaceChildren();
  productos.forEach(p => fila('#lista-productos', [p.nombre, p.marca, p.categoria, moneda(p.precio)]));
  clientes.forEach(c => fila('#lista-clientes', [c.nombre, c.dni]));
  for (const venta of ventas) {
    const lista = document.createElement('ul');
    for (const detalle of venta.productos) {
      const producto = venta.productos_relacionados.find(p => p._id === detalle.producto_id);
      const li = document.createElement('li');
      li.textContent = `${producto?.nombre || 'Producto no disponible'} × ${detalle.cantidad} (${moneda(detalle.precio_unitario)} c/u)`;
      lista.append(li);
    }
    fila('#lista-ventas', [new Date(venta.fecha).toLocaleString('es-PE'), venta.cliente?.nombre || 'Cliente no disponible', lista, moneda(venta.total)]);
  }
  if (!productos.length) fila('#lista-productos', ['Sin productos registrados.', '', '', '']);
  if (!clientes.length) fila('#lista-clientes', ['Sin clientes registrados.', '']);
  if (!ventas.length) fila('#lista-ventas', ['Sin ventas registradas.', '', '', '']);
  selector('#cliente-venta', clientes, 'Seleccione un cliente', c => `${c.nombre} · ${c.dni}`);
  selector('#producto-venta', productos, 'Seleccione un producto', p => `${p.nombre} · ${moneda(p.precio)}`);
  dibujarCarrito();
}

$('#agregar-producto').addEventListener('click', () => {
  const producto_id = $('#producto-venta').value;
  const cantidad = Number($('#cantidad-venta').value);
  if (!producto_id || !Number.isSafeInteger(cantidad) || cantidad <= 0) {
    mensaje('Seleccione un producto e ingrese una cantidad entera positiva.', true);
    return;
  }
  const existente = carrito.find(item => item.producto_id === producto_id);
  if (existente) existente.cantidad += cantidad;
  else carrito.push({ producto_id, cantidad });
  dibujarCarrito();
  mensaje('Producto agregado a la venta.');
});

function registrarFormulario(id, ruta, obtenerDatos, limpiar) {
  $(id).addEventListener('submit', async evento => {
    evento.preventDefault();
    const boton = evento.currentTarget.querySelector('button[type="submit"]');
    boton.disabled = true;
    try {
      const datos = obtenerDatos(new FormData(evento.currentTarget));
      const guardado = await api(ruta, datos);
      limpiar();
      try {
        await cargar();
        mensaje(ruta === 'ventas' ? `Venta guardada. Total confirmado: ${moneda(guardado.total)}.` : 'Registro guardado correctamente.');
      } catch {
        mensaje('Registro guardado. No se pudo actualizar la lista; recargue la página.', true);
      }
    } catch (error) {
      mensaje(error.message, true);
    } finally {
      boton.disabled = false;
    }
  });
}

registrarFormulario('#form-producto', 'productos', datos => ({
  nombre: datos.get('nombre'), precio: Number(datos.get('precio')),
  marca: datos.get('marca'), categoria: datos.get('categoria')
}), () => $('#form-producto').reset());

registrarFormulario('#form-cliente', 'clientes', datos => ({ nombre: datos.get('nombre'), dni: datos.get('dni') }),
  () => $('#form-cliente').reset());

registrarFormulario('#form-venta', 'ventas', () => {
  if (!carrito.length) throw new Error('Agregue al menos un producto.');
  return { cliente_id: $('#cliente-venta').value, productos: carrito };
}, () => {
  carrito = [];
  $('#form-venta').reset();
  dibujarCarrito();
});

cargar().then(() => mensaje('Datos cargados.')).catch(error => mensaje('No se pudieron cargar los datos: ' + error.message, true));
