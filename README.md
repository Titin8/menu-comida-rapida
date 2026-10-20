# Sazón Express — prototipo de tienda de comida rápida

Prototipo funcional hecho con **HTML, CSS y JavaScript puro**. No necesita instalación ni servidor.

> Nota: el prototipo todavía muestra el nombre de ejemplo **"La Esquina"**. El nombre se puede cambiar en **Panel demo → Ajustes**, o en `app.js` (`defaults.settings.storeName`).

## Cómo abrirlo

1. Descarga o clona este repositorio.
2. Haz doble clic en `index.html` (o ábrelo con Chrome, Edge o Firefox).

## Qué hace hoy

**Clientes**
- Crear un perfil de demostración (nombre, apellido, teléfono, correo) o continuar como invitado (nombre y apellido).
- Ver y editar sus datos básicos en "Mi cuenta".
- Explorar el menú, filtrar por categoría, buscar y ver el detalle de cada producto.
- Sección **"OFERTAS + mes actual"**: el mes se calcula solo (zona horaria de Chile); incluye los productos con precio de oferta menor al normal.
- Carrito: agregar, cambiar cantidades y quitar productos. Los productos con stock 0 aparecen agotados y no se pueden agregar.
- Finalizar pedido **solo para retiro en el local**: se arma un resumen (productos, cantidades, precios, total, nombre) y se abre WhatsApp con el mensaje listo. **Abrir WhatsApp no significa que el pedido se envió**: el cliente debe tocar "Enviar" en WhatsApp.

**Administración** (botón "Panel demo")
- Productos: crear, buscar, editar y eliminar; imagen, nombre, categoría, descripción, precio normal, precio de oferta y stock.
- Categorías: crear y eliminar. No deja borrar una categoría que todavía tiene productos.
- Clientes: ver cuentas e invitados, y exportarlos.
- Ajustes: nombre del local y **número de WhatsApp** (con código de país, solo números, ej. `569XXXXXXXX`). Sin ese número el pedido no se puede enviar.

## Limitaciones importantes (es una maqueta)

- Todos los datos e imágenes se guardan **solo en el navegador** de ese dispositivo (`localStorage`). Otros teléfonos o computadores no ven los cambios.
- **No hay base de datos ni servidor.** Nada está conectado todavía a Supabase.
- **No hay seguridad real:** el panel de administración está abierto para cualquiera, el inicio de sesión no verifica contraseña y las contraseñas no se guardan.
- "Recuperar contraseña" no envía correos.
- No hay pagos en línea ni despacho a domicilio (decisión del piloto).

## Archivos

| Archivo | Para qué sirve |
|---|---|
| `index.html` | Página base que carga el estilo y el código |
| `styles.css` | Diseño visual |
| `app.js` | Toda la lógica: menú, carrito, pedidos, panel y datos de ejemplo |
| `LEEME.md` | Guía original de recorrido del prototipo |
| `CLAUDE.md` | Contexto y reglas de trabajo para el asistente de programación |
