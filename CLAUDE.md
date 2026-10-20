# CLAUDE.md — Sazón Express

## Contexto
- Sitio de comida rápida en Chile. Piloto para menos de 100 personas, costo inicial cero.
- Pedidos **solo para retiro en local**, enviados por WhatsApp (`wa.me` con mensaje prearmado).
- Sin pagos en línea ni despacho a domicilio hasta que el dueño lo decida.
- Stack actual: HTML + CSS + JavaScript puro, sin build ni dependencias. Datos en `localStorage`.
- Opciones consideradas a futuro: Supabase (PostgreSQL, Auth, Storage), Cloudflare Pages, GitHub (`Titin8/menu-comida-rapida`, rama `main`).

## Reglas de trabajo
- Responder en español claro, explicando decisiones importantes.
- Revisar archivos y Git antes de cambiar código; proponer brevemente antes de programar.
- Conservar el diseño existente. Cambios pequeños y fáciles de revisar.
- No reescribir en otro framework ni agregar servicios/costos sin explicar antes por qué.
- No inventar datos del negocio (teléfonos, cuentas, claves). El WhatsApp se configura en Panel → Ajustes.
- No afirmar que algo está conectado a base de datos si solo usa datos locales.
- Seguridad real en servidor y base de datos (RLS en Supabase), no solo ocultando botones.
- Admins: dueño + una persona autorizada; sin registro público de administradores.
- Nunca subir `.env`, claves ni contraseñas. Nunca `git push --force`.
- No publicar en producción, comprar ni contratar sin aprobación del dueño.
