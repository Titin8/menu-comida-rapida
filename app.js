/* Prototipo de tienda. Los datos se guardan localmente en este navegador. */
(function () {
  'use strict';

  var STORAGE_KEY = 'la-esquina-prototype-v1';
  var month = new Intl.DateTimeFormat('es-CL', { month: 'long', timeZone: 'America/Santiago' }).format(new Date());
  var monthLabel = month.charAt(0).toUpperCase() + month.slice(1);
  var defaults = {
    categories: ['Hamburguesas', 'Papas fritas', 'Combos', 'Sándwiches', 'Bebidas', 'Acompañamientos'],
    settings: { storeName: 'La Esquina', whatsapp: '', address: 'Retiro en local' },
    products: [
      { id: 'p1', name: 'La Clásica', category: 'Hamburguesas', price: 6500, offerPrice: 5900, stock: 12, description: 'Carne a la plancha, queso cheddar, tomate, lechuga fresca y nuestra salsa de la casa.', image: '', emoji: '🍔' },
      { id: 'p2', name: 'Doble Queso', category: 'Hamburguesas', price: 7900, offerPrice: 0, stock: 8, description: 'Doble carne, doble cheddar, cebolla caramelizada y pepinillos.', image: '', emoji: '🍔' },
      { id: 'p3', name: 'Papas rústicas', category: 'Papas fritas', price: 3200, offerPrice: 0, stock: 16, description: 'Papas doradas con sal de ajo y una salsa para acompañar.', image: '', emoji: '🍟' },
      { id: 'p4', name: 'Combo Esquina', category: 'Combos', price: 10900, offerPrice: 8990, stock: 6, description: 'La Clásica, papas rústicas y bebida a elección. Una pausa bien hecha.', image: '', emoji: '🍔' },
      { id: 'p5', name: 'Limonada de la casa', category: 'Bebidas', price: 2200, offerPrice: 0, stock: 14, description: 'Limonada natural con menta, servida bien fría.', image: '', emoji: '🍋' },
      { id: 'p6', name: 'Sándwich Crispy', category: 'Sándwiches', price: 6900, offerPrice: 0, stock: 0, description: 'Pollo crocante, ensalada fresca y mayo de ajo en pan tostado.', image: '', emoji: '🥪' }
    ],
    customers: [
      { id: 'c1', name: 'Camila', surname: 'Rojas', phone: '+56 9 5555 1234', email: 'camila@email.cl', kind: 'Cuenta', createdAt: '2026-10-18' },
      { id: 'c2', name: 'Matías', surname: 'Pérez', phone: '', email: '', kind: 'Invitado', createdAt: '2026-10-19' }
    ]
  };

  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function loadData() {
    try {
      var saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (saved && Array.isArray(saved.products) && Array.isArray(saved.categories) && Array.isArray(saved.customers)) {
        return { products: saved.products, categories: saved.categories, customers: saved.customers, settings: Object.assign({}, defaults.settings, saved.settings || {}) };
      }
    } catch (error) { /* Se recupera con los datos de muestra. */ }
    return clone(defaults);
  }

  var data = loadData();
  var screen = 'access';
  var authMode = 'register';
  var currentUser = null;
  var filter = 'TODOS';
  var search = '';
  var adminSection = 'products';
  var adminSearch = '';
  var cart = {};
  var pendingImage = '';
  var editingId = '';
  var selectedCustomer = '';

  function persist() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
    catch (error) { notify('No se pudo guardar. Reduce el tamaño de las imágenes e inténtalo otra vez.'); }
  }
  function money(number) { return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(Number(number) || 0); }
  function esc(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]; }); }
  function activeOffer(product) { return Number(product.offerPrice) > 0 && Number(product.offerPrice) < Number(product.price); }
  function initials(person) { return ((person.name || '').charAt(0) + (person.surname || '').charAt(0)).toUpperCase() || 'C'; }
  function fullName(person) { return [person.name, person.surname].filter(Boolean).join(' '); }
  function productArt(product, extraClass) {
    return '<div class="' + (extraClass || 'product-art') + '">' + (product.image ? '<img src="' + esc(product.image) + '" alt="' + esc(product.name) + '">' : '<span class="product-emoji">' + esc(product.emoji || '🍔') + '</span>') + '</div>';
  }
  function notify(message) {
    var root = document.getElementById('toast-root');
    root.innerHTML = '<div class="toast">' + esc(message) + '</div>';
    window.clearTimeout(notify.timer);
    notify.timer = window.setTimeout(function () { root.innerHTML = ''; }, 3200);
  }
  function setScreen(next) { screen = next; render(); window.scrollTo(0, 0); }

  function render() {
    var root = document.getElementById('app');
    if (screen === 'access') root.innerHTML = renderAccess();
    else if (screen === 'admin') root.innerHTML = renderAdmin();
    else root.innerHTML = renderStore();
  }

  function renderAccess() {
    var authFields = authMode === 'register'
      ? '<div class="form-grid"><div class="field"><label for="first-name">Nombre</label><input id="first-name" name="name" required autocomplete="given-name" placeholder="Ej. Valentina"></div><div class="field"><label for="last-name">Apellido</label><input id="last-name" name="surname" required autocomplete="family-name" placeholder="Ej. Soto"></div><div class="field full"><label for="phone">Teléfono</label><input id="phone" name="phone" required autocomplete="tel" placeholder="+56 9 1234 5678"></div><div class="field full"><label for="email">Correo electrónico</label><input id="email" name="email" type="email" required autocomplete="email" placeholder="tu@correo.cl"></div><div class="field full"><label for="password">Contraseña</label><input id="password" name="password" type="password" required minlength="8" autocomplete="new-password" placeholder="Mínimo 8 caracteres"></div></div>'
      : '<div class="field"><label for="email">Correo electrónico</label><input id="email" name="email" type="email" required autocomplete="email" placeholder="tu@correo.cl"></div><div class="field"><label for="password">Contraseña</label><input id="password" name="password" type="password" required autocomplete="current-password" placeholder="Tu contraseña"></div><button type="button" class="btn-quiet" data-action="forgot" style="font-size:12px;padding:0;margin:-3px 0 14px">¿Olvidaste tu contraseña?</button>';
    var submitText = authMode === 'register' ? 'Crear mi cuenta' : 'Entrar';
    return '<main class="access-screen"><section class="access-story"><a class="brand" href="#" aria-label="La Esquina"><span class="brand-mark">✦</span><span>LA ESQUINA<small>COMIDA RICA, RECIÉN HECHA</small></span></a><div class="access-message"><span class="eyebrow" style="color:#ffe0ca">HECHO PARA DISFRUTAR</span><h1>Tu antojo tiene lugar.</h1><p>Hamburguesas, papas y combos preparados al momento. Elige, arma tu pedido y retíralo en el local.</p><div class="access-points"><span>✦ Hecho al momento</span><span>✦ Retiro en tienda</span><span>✦ Ofertas cada mes</span></div></div><div style="font-size:11px;color:#ffe0d2;position:relative;z-index:1">Una idea de negocio que recién comienza.</div></section><section class="access-panel"><div class="access-card"><h2>' + (authMode === 'register' ? 'Bienvenido a la mesa' : 'Qué bueno verte') + '</h2><p>' + (authMode === 'register' ? 'Crea tu cuenta para guardar tus datos y enterarte de las sorpresas.' : 'Ingresa con el correo de tu cuenta para continuar.') + '</p><div class="auth-tabs"><button class="auth-tab ' + (authMode === 'login' ? 'active' : '') + '" data-action="auth-mode" data-mode="login">Iniciar sesión</button><button class="auth-tab ' + (authMode === 'register' ? 'active' : '') + '" data-action="auth-mode" data-mode="register">Crear cuenta</button></div><form id="auth-form">' + authFields + '<button class="btn btn-primary" type="submit" style="width:100%;margin-top:2px">' + submitText + ' <span>→</span></button></form><div class="divider">o pide sin registrarte</div><form id="guest-form"><div class="form-grid"><div class="field"><label for="guest-name">Nombre</label><input id="guest-name" name="name" required placeholder="Tu nombre"></div><div class="field"><label for="guest-surname">Apellido</label><input id="guest-surname" name="surname" required placeholder="Tu apellido"></div></div><button class="guest-link" type="submit">Continuar como invitado</button></form><div class="security-note">Prototipo de demostración: las cuentas se guardan solo en este navegador y la contraseña no se almacena. Antes de abrir al público hay que conectar un servicio seguro de usuarios y recuperación por correo.</div><a class="demo-admin-link" data-action="enter-admin">Ver panel de administración · demostración</a></div></section></main>';
  }

  function headerStore() {
    var count = Object.keys(cart).reduce(function (sum, key) { return sum + Number(cart[key]); }, 0);
    var profileLabel = currentUser ? esc((currentUser.name || 'Mi') + ' cuenta') : 'Ingresar';
    return '<header class="topbar"><div class="topbar-inner"><a class="brand" href="#" data-action="store-home"><span class="brand-mark">✦</span><span>' + esc(data.settings.storeName || 'La Esquina') + '<small>COMIDA RICA, RECIÉN HECHA</small></span></a><div class="nav-actions"><button class="btn btn-light" data-action="profile">☺ &nbsp;' + profileLabel + '</button><button class="icon-btn" aria-label="Abrir carrito" data-action="cart">🛒' + (count ? '<span class="cart-badge">' + count + '</span>' : '') + '</button><button class="btn btn-dark btn-small" data-action="enter-admin">Panel demo</button></div></div></header>';
  }

  function renderStore() {
    var categories = '<button class="category-chip offer-chip ' + (filter === 'OFERTAS' ? 'active' : '') + '" data-action="filter" data-filter="OFERTAS">✦ &nbsp;OFERTAS ' + esc(monthLabel.toUpperCase()) + '</button><button class="category-chip ' + (filter === 'TODOS' ? 'active' : '') + '" data-action="filter" data-filter="TODOS">Todos</button>';
    categories += data.categories.map(function (category) { return '<button class="category-chip ' + (filter === category ? 'active' : '') + '" data-action="filter" data-filter="' + esc(category) + '">' + esc(category) + '</button>'; }).join('');
    var products = data.products.filter(function (product) {
      var matchesCategory = filter === 'TODOS' || (filter === 'OFERTAS' ? activeOffer(product) : product.category === filter);
      var haystack = (product.name + ' ' + product.description + ' ' + product.category).toLowerCase();
      return matchesCategory && haystack.indexOf(search.toLowerCase()) >= 0;
    });
    var cards = products.length ? products.map(function (product) {
      var sold = Number(product.stock) <= 0;
      return '<article class="product-card"><div data-action="details" data-id="' + esc(product.id) + '" style="cursor:pointer">' + productArt(product, 'product-art') + (sold ? '<span class="stock-tag sold">Agotado</span>' : '') + (activeOffer(product) ? '<span class="offer-tag">Oferta</span>' : '') + '</div><div class="product-info"><div class="product-category">' + esc(product.category) + '</div><h3 data-action="details" data-id="' + esc(product.id) + '" style="cursor:pointer">' + esc(product.name) + '</h3><p class="product-desc">' + esc(product.description) + '</p><div class="price-line"><div><span class="price-now">' + money(activeOffer(product) ? product.offerPrice : product.price) + '</span>' + (activeOffer(product) ? '<span class="price-old">' + money(product.price) + '</span>' : '') + '</div><button class="add-btn" aria-label="Agregar ' + esc(product.name) + ' al carrito" data-action="add-cart" data-id="' + esc(product.id) + '" ' + (sold ? 'disabled' : '') + '>+</button></div></div></article>';
    }).join('') : '<div class="empty-state"><span style="font-size:28px">🍽️</span><strong>No encontramos productos</strong>Prueba con otra categoría o palabra.</div>';
    return '<div class="shell">' + headerStore() + '<main class="main-wrap"><section class="hero"><div class="hero-copy"><span class="eyebrow">ANTOJO RESUELTO</span><h1>Hoy se come rico.</h1><p>Sabores hechos al momento, buenos combos y esa primera mordida que vale la pena.</p><button class="btn" data-action="filter" data-filter="OFERTAS">Ver ofertas de ' + esc(monthLabel) + ' <span>→</span></button><div class="pickup-note">⌖ &nbsp;Por ahora, todos los pedidos son para retiro en tienda</div></div></section><section><div class="section-head"><div><span class="eyebrow">ELIGE LO QUE TE GUSTA</span><h2>Categorías</h2></div></div><div class="category-strip">' + categories + '</div></section><section><div class="section-head"><div><span class="eyebrow">PREPARADO CON GANAS</span><h2>' + (filter === 'OFERTAS' ? 'Ofertas ' + esc(monthLabel) : filter === 'TODOS' ? 'Lo más rico del menú' : esc(filter)) + '</h2><p>' + (filter === 'OFERTAS' ? 'Combos y productos con precio especial este mes.' : 'Elige tus favoritos y arma tu pedido.') + '</p></div></div><div class="search-row"><label class="searchbox"><span>⌕</span><input id="store-search" value="' + esc(search) + '" placeholder="Buscar hamburguesas, papas..." aria-label="Buscar productos"></label><span class="results-note">' + products.length + ' producto' + (products.length === 1 ? '' : 's') + '</span></div><div class="product-grid">' + cards + '</div></section></main><footer class="site-footer"><span>© ' + new Date().getFullYear() + ' ' + esc(data.settings.storeName || 'La Esquina') + ' · Hecho con hambre de algo bueno.</span><span>Pedidos para retiro en tienda</span></footer></div>';
  }

  function adminNav() {
    var items = [ ['products', '▦', 'Productos'], ['customers', '♙', 'Clientes'], ['categories', '◇', 'Categorías'], ['settings', '⚙', 'Ajustes'] ];
    return '<aside class="admin-sidebar"><div class="side-label">GESTIÓN DE TIENDA</div>' + items.map(function (item) { return '<button class="side-link ' + (adminSection === item[0] ? 'active' : '') + '" data-action="admin-section" data-section="' + item[0] + '"><span class="side-icon">' + item[1] + '</span>' + item[2] + '</button>'; }).join('') + '<div class="side-bottom"><button class="side-link" data-action="enter-store"><span class="side-icon">↗</span>Ver tienda</button><button class="side-link" data-action="sign-out"><span class="side-icon">⇥</span>Salir del demo</button></div></aside>';
  }

  function adminHeader() {
    return '<header class="admin-top"><div class="admin-brand"><span class="brand-mark">✦</span><span>' + esc(data.settings.storeName || 'La Esquina') + ' <span style="font-weight:500;color:#968d83">/ Administración</span></span></div><div class="admin-top-right"><div class="admin-user"><strong>Panel de demostración</strong><br>Acceso de propietario</div><button class="btn btn-light btn-small" data-action="enter-store">Ver tienda ↗</button></div></header>';
  }

  function renderAdmin() {
    var content = adminSection === 'products' ? renderAdminProducts() : adminSection === 'customers' ? renderAdminCustomers() : adminSection === 'categories' ? renderAdminCategories() : renderAdminSettings();
    return '<div class="admin-shell">' + adminHeader() + '<div class="admin-layout">' + adminNav() + '<main class="admin-content">' + content + '</main></div></div>';
  }

  function renderAdminProducts() {
    var visible = data.products.filter(function (product) { return (product.name + ' ' + product.category).toLowerCase().indexOf(adminSearch.toLowerCase()) >= 0; });
    var low = data.products.filter(function (p) { return Number(p.stock) > 0 && Number(p.stock) <= 3; }).length;
    var offers = data.products.filter(activeOffer).length;
    var rows = visible.map(function (product) {
      var stock = Number(product.stock) || 0;
      return '<tr><td><div class="table-product"><div class="table-thumb">' + (product.image ? '<img src="' + esc(product.image) + '" alt="">' : esc(product.emoji || '🍔')) + '</div><div><strong>' + esc(product.name) + '</strong><span>' + (activeOffer(product) ? 'En oferta' : 'Precio regular') + '</span></div></div></td><td>' + esc(product.category) + '</td><td><strong>' + money(activeOffer(product) ? product.offerPrice : product.price) + '</strong>' + (activeOffer(product) ? '<br><span style="font-size:10px;color:#9b9288;text-decoration:line-through">' + money(product.price) + '</span>' : '') + '</td><td class="' + (stock === 0 ? 'stock-low' : stock <= 3 ? 'stock-low' : '') + '">' + stock + ' <span style="color:#a49a90;font-weight:400">unid.</span></td><td><span class="badge ' + (stock === 0 ? 'badge-red' : stock <= 3 ? 'badge-orange' : 'badge-green') + '">' + (stock === 0 ? 'Agotado' : stock <= 3 ? 'Pocas unidades' : 'Disponible') + '</span></td><td><div class="actions"><button class="action-icon" aria-label="Editar" title="Editar" data-action="edit-product" data-id="' + esc(product.id) + '">✎</button><button class="action-icon" aria-label="Eliminar" title="Eliminar" data-action="delete-product" data-id="' + esc(product.id) + '">×</button></div></td></tr>';
    }).join('');
    return '<div class="notice-bar">Esta versión es una maqueta funcional en tu navegador. Para administrar productos desde distintos teléfonos, conectar clientes y proteger el acceso de dos personas, se necesita una base de datos y un servidor.</div><div class="admin-heading"><div><h1>Gestión de productos</h1><p>' + data.products.length + ' productos en el catálogo · ' + offers + ' en oferta</p></div><div class="admin-heading-actions"><button class="btn btn-primary" data-action="new-product">＋ &nbsp; Crear producto</button></div></div><div class="stat-grid"><div class="stat-card"><span class="stat-icon">▦</span><div class="stat-label">Productos totales</div><div class="stat-value">' + data.products.length + '</div><div class="stat-foot">En tu catálogo</div></div><div class="stat-card"><span class="stat-icon">✦</span><div class="stat-label">Ofertas activas</div><div class="stat-value">' + offers + '</div><div class="stat-foot">' + esc(monthLabel) + '</div></div><div class="stat-card"><span class="stat-icon">⌖</span><div class="stat-label">Stock bajo</div><div class="stat-value">' + low + '</div><div class="stat-foot">3 unidades o menos</div></div><div class="stat-card"><span class="stat-icon">⊘</span><div class="stat-label">Agotados</div><div class="stat-value">' + data.products.filter(function (p) { return Number(p.stock) <= 0; }).length + '</div><div class="stat-foot">Sin stock disponible</div></div></div><section class="table-panel"><div class="table-toolbar"><div><strong style="font-size:14px">Todos los productos</strong><div style="font-size:11px;color:#948a80;margin-top:3px">Administra precios, disponibilidad e inventario.</div></div><label class="searchbox"><span>⌕</span><input id="admin-search" value="' + esc(adminSearch) + '" placeholder="Buscar por nombre..."></label></div><div class="table-wrap"><table><thead><tr><th>Producto</th><th>Categoría</th><th>Precio</th><th>Stock</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>' + (rows || '<tr><td colspan="6"><div class="empty-table">No hay productos que coincidan con la búsqueda.</div></td></tr>') + '</tbody></table></div></section>';
  }

  function renderAdminCustomers() {
    var customers = data.customers.filter(function (customer) { return (fullName(customer) + ' ' + customer.email + ' ' + customer.phone).toLowerCase().indexOf(adminSearch.toLowerCase()) >= 0; });
    var accounts = data.customers.filter(function (c) { return c.kind === 'Cuenta'; }).length;
    var guests = data.customers.filter(function (c) { return c.kind !== 'Cuenta'; }).length;
    var cards = customers.map(function (customer) {
      return '<article class="client-card"><div class="client-avatar">' + esc(initials(customer)) + '</div><h3>' + esc(fullName(customer)) + '</h3><p>' + (customer.email ? '✉ &nbsp;' + esc(customer.email) : 'Invitado sin correo') + '</p><p>' + (customer.phone ? '☎ &nbsp;' + esc(customer.phone) : 'Sin teléfono registrado') + '</p><span class="badge ' + (customer.kind === 'Cuenta' ? 'badge-green' : 'badge-gray') + '">' + esc(customer.kind || 'Invitado') + '</span><div style="display:flex;gap:7px;margin-top:13px"><button class="btn btn-light btn-small" data-action="customer-detail" data-id="' + esc(customer.id) + '">Ver ficha</button><button class="btn btn-danger btn-small" data-action="delete-customer" data-id="' + esc(customer.id) + '">Eliminar</button></div></article>';
    }).join('');
    return '<div class="admin-heading"><div><h1>Clientes registrados</h1><p>Revisa las cuentas creadas y las personas que continúan como invitadas.</p></div><button class="btn btn-light btn-small" data-action="export-clients">↓ &nbsp; Descargar lista</button></div><div class="stat-grid"><div class="stat-card"><span class="stat-icon">♙</span><div class="stat-label">Personas registradas</div><div class="stat-value">' + data.customers.length + '</div><div class="stat-foot">Cuentas e invitados</div></div><div class="stat-card"><span class="stat-icon">☺</span><div class="stat-label">Cuentas creadas</div><div class="stat-value">' + accounts + '</div><div class="stat-foot">Con correo electrónico</div></div><div class="stat-card"><span class="stat-icon">☻</span><div class="stat-label">Invitados</div><div class="stat-value">' + guests + '</div><div class="stat-foot">Sin cuenta creada</div></div><div class="stat-card"><span class="stat-icon">✉</span><div class="stat-label">Contacto disponible</div><div class="stat-value">' + data.customers.filter(function (c) { return !!c.phone || !!c.email; }).length + '</div><div class="stat-foot">Teléfono o correo guardado</div></div></div><div class="table-toolbar" style="padding:12px 0;border:0"><label class="searchbox"><span>⌕</span><input id="admin-search" value="' + esc(adminSearch) + '" placeholder="Buscar nombre, correo o teléfono..."></label></div><div class="client-card-grid">' + (cards || '<div class="empty-state">No hay clientes que coincidan con la búsqueda.</div>') + '</div>';
  }

  function renderAdminCategories() {
    var rows = data.categories.map(function (category) {
      var count = data.products.filter(function (p) { return p.category === category; }).length;
      return '<div class="category-admin-item"><div><strong>' + esc(category) + '</strong><br><span>' + count + ' producto' + (count === 1 ? '' : 's') + '</span></div><button class="action-icon" aria-label="Eliminar categoría" title="Eliminar categoría" data-action="delete-category" data-category="' + esc(category) + '">×</button></div>';
    }).join('');
    return '<div class="admin-heading"><div><h1>Categorías</h1><p>Organiza el menú para que tus clientes encuentren rápido lo que buscan.</p></div></div><div class="notice-bar">“Ofertas ' + esc(monthLabel) + '” se crea automáticamente con los productos a los que les agregues precio de oferta. Combos también pueden vivir en su propia categoría.</div><section class="table-panel" style="padding:18px"><form id="category-form" style="display:flex;gap:10px;max-width:520px"><label class="searchbox" style="max-width:none"><input id="new-category" name="category" required maxlength="35" placeholder="Ej. Postres"></label><button class="btn btn-primary" type="submit">＋ Agregar</button></form><div class="category-admin-list" style="margin-top:17px">' + (rows || '<div class="empty-state">Aún no has creado categorías.</div>') + '</div></section>';
  }

  function renderAdminSettings() {
    return '<div class="admin-heading"><div><h1>Ajustes del local</h1><p>Configura cómo se identifica la tienda y dónde recibir los pedidos.</p></div></div><div class="notice-bar">El número de WhatsApp se usa para preparar el mensaje del pedido. El cliente revisa y envía el mensaje desde su propio WhatsApp; el pedido no se guarda en un sistema de ventas en esta maqueta.</div><section class="table-panel" style="padding:20px"><form id="settings-form" style="max-width:560px"><div class="field"><label for="store-name">Nombre de la tienda</label><input id="store-name" name="storeName" required value="' + esc(data.settings.storeName || '') + '"></div><div class="field"><label for="whatsapp-number">WhatsApp del local</label><input id="whatsapp-number" name="whatsapp" inputmode="tel" value="' + esc(data.settings.whatsapp || '') + '" placeholder="Ej. 56912345678"><span class="field-hint">Usa el código de país y solo números. Para Chile suele comenzar con 569.</span></div><div class="field"><label for="store-address">Modalidad de entrega</label><input id="store-address" name="address" value="' + esc(data.settings.address || 'Retiro en local') + '"></div><button class="btn btn-primary" type="submit">Guardar ajustes</button></form><div class="notice-bar" style="margin:22px 0 0">Acceso administrador: al construir la versión de producción, se puede crear exactamente dos cuentas de administración (dueño y encargado), con permisos protegidos desde el servidor.</div></section>';
  }

  function openModal(title, subtitle, body, footer, width) {
    document.getElementById('modal-root').innerHTML = '<div class="overlay" data-action="overlay-close"><section class="modal ' + (width || '') + '" role="dialog" aria-modal="true"><header class="modal-head"><div><h2>' + title + '</h2>' + (subtitle ? '<p>' + subtitle + '</p>' : '') + '</div><button class="close-btn" data-action="close-modal" aria-label="Cerrar">×</button></header>' + body + (footer ? '<footer class="modal-foot">' + footer + '</footer>' : '') + '</section></div>';
  }
  function closeModal() { document.getElementById('modal-root').innerHTML = ''; pendingImage = ''; editingId = ''; selectedCustomer = ''; }

  function openProductForm(id) {
    var product = id ? data.products.find(function (p) { return p.id === id; }) : null;
    if (id && !product) return;
    editingId = id || '';
    pendingImage = product ? (product.image || '') : '';
    var categoryOptions = data.categories.map(function (category) { return '<option value="' + esc(category) + '" ' + (product && product.category === category ? 'selected' : '') + '>' + esc(category) + '</option>'; }).join('');
    if (!categoryOptions) categoryOptions = '<option value="">Primero crea una categoría</option>';
    var preview = pendingImage ? '<img src="' + esc(pendingImage) + '" alt="Vista previa">' : '<div class="preview-placeholder"><b>' + esc(product ? (product.emoji || '🍔') : '🍔') + '</b>Agrega una foto de tu producto</div>';
    var body = '<form id="product-form"><div class="modal-body"><div class="field"><label for="product-image">Imagen del producto</label><input id="product-image" type="file" accept="image/*"><span class="field-hint">Puedes usar una foto tomada con tu celular. Se optimiza para la vista previa.</span></div><div class="preview-frame" id="image-preview">' + preview + '</div><div class="field"><label for="product-name">Nombre del producto</label><input id="product-name" name="name" required maxlength="70" value="' + esc(product ? product.name : '') + '" placeholder="Ej. Hamburguesa de la casa"></div><div class="field"><label for="product-category">Categoría</label><select id="product-category" name="category" required>' + categoryOptions + '</select></div><div class="form-grid"><div class="field"><label for="product-price">Precio normal (CLP)</label><input id="product-price" name="price" type="number" min="1" step="50" required value="' + esc(product ? product.price : '') + '" placeholder="6500"></div><div class="field"><label for="product-offer">Precio oferta (opcional)</label><input id="product-offer" name="offerPrice" type="number" min="0" step="50" value="' + esc(product && product.offerPrice ? product.offerPrice : '') + '" placeholder="Déjalo vacío si no hay oferta"></div><div class="full price-input-hint">Si agregas un precio menor al normal, se mostrará la oferta tachando el precio normal y aparecerá en “Ofertas ' + esc(monthLabel) + '”.</div><div class="field"><label for="product-stock">Stock disponible</label><input id="product-stock" name="stock" type="number" min="0" step="1" required value="' + esc(product ? product.stock : '0') + '" placeholder="0"></div><div class="field"><label for="product-emoji">Ícono si no hay foto</label><select id="product-emoji" name="emoji"><option>🍔</option><option ' + (product && product.emoji === '🍟' ? 'selected' : '') + '>🍟</option><option ' + (product && product.emoji === '🥪' ? 'selected' : '') + '>🥪</option><option ' + (product && product.emoji === '🍕' ? 'selected' : '') + '>🍕</option><option ' + (product && product.emoji === '🌭' ? 'selected' : '') + '>🌭</option><option ' + (product && product.emoji === '🍗' ? 'selected' : '') + '>🍗</option><option ' + (product && product.emoji === '🥤' ? 'selected' : '') + '>🥤</option><option ' + (product && product.emoji === '🍰' ? 'selected' : '') + '>🍰</option></select></div><div class="field full"><label for="product-description">Descripción e ingredientes</label><textarea id="product-description" name="description" required maxlength="350" placeholder="Cuenta qué ingredientes lleva y qué lo hace especial.">' + esc(product ? product.description : '') + '</textarea></div></div></div></form>';
    openModal(product ? 'Editar producto' : 'Crear producto', 'Completa los datos del menú y el inventario.', body, '<button class="btn btn-light" data-action="close-modal">Cancelar</button><button class="btn btn-primary" type="submit" form="product-form">' + (product ? 'Guardar cambios' : 'Crear producto') + '</button>', 'wide');
  }

  function openCart() {
    var entries = Object.keys(cart).map(function (id) {
      var product = data.products.find(function (p) { return p.id === id; });
      if (!product) return '';
      var price = activeOffer(product) ? Number(product.offerPrice) : Number(product.price);
      return '<div class="cart-row"><div class="cart-thumb">' + (product.image ? '<img src="' + esc(product.image) + '" alt="">' : esc(product.emoji || '🍔')) + '</div><div><h3>' + esc(product.name) + '</h3><p>' + money(price) + ' · ' + esc(product.category) + '</p></div><div class="qty-control"><button data-action="cart-qty" data-id="' + esc(id) + '" data-delta="-1">−</button><strong>' + Number(cart[id]) + '</strong><button data-action="cart-qty" data-id="' + esc(id) + '" data-delta="1">+</button></div></div>';
    }).filter(Boolean).join('');
    var total = Object.keys(cart).reduce(function (sum, id) {
      var product = data.products.find(function (p) { return p.id === id; });
      return sum + (product ? (activeOffer(product) ? Number(product.offerPrice) : Number(product.price)) * Number(cart[id]) : 0);
    }, 0);
    var body = '<div class="modal-body"><div class="cart-list">' + (entries || '<div class="empty-state" style="grid-column:auto"><span style="font-size:29px">🛒</span><strong>Tu carrito está vacío</strong>Agrega algo rico del menú.</div>') + '</div>' + (entries ? '<div class="cart-total"><span>Total</span><span>' + money(total) + '</span></div><div class="pickup-box">⌖ &nbsp;<strong>Retiro en tienda</strong><br>Al continuar, se preparará tu pedido para enviarlo por WhatsApp al local.</div>' : '') + '</div>';
    var foot = entries ? '<button class="btn btn-light" data-action="close-modal">Seguir mirando</button><button class="btn btn-primary" data-action="checkout">Pedir por WhatsApp &nbsp;↗</button>' : '<button class="btn btn-light" data-action="close-modal">Cerrar</button><button class="btn btn-primary" data-action="close-modal">Ver menú</button>';
    openModal('Tu pedido', 'Revisa las cantidades antes de continuar.', body, foot);
  }

  function openProductDetails(id) {
    var product = data.products.find(function (p) { return p.id === id; });
    if (!product) return;
    var price = activeOffer(product) ? Number(product.offerPrice) : Number(product.price);
    var body = '<div class="modal-body">' + productArt(product, 'preview-frame') + '<div class="product-category">' + esc(product.category) + '</div><h3 style="font:800 24px Manrope,sans-serif;margin:6px 0">' + esc(product.name) + '</h3><p style="font-size:14px;color:#746b63;line-height:1.65">' + esc(product.description) + '</p><div class="price-line" style="margin-top:18px"><div><span class="price-now">' + money(price) + '</span>' + (activeOffer(product) ? '<span class="price-old">' + money(product.price) + '</span>' : '') + '</div><span class="badge ' + (Number(product.stock) > 0 ? 'badge-green' : 'badge-red') + '">' + (Number(product.stock) > 0 ? 'Disponible' : 'Agotado') + '</span></div></div>';
    openModal('Detalle del producto', '', body, '<button class="btn btn-light" data-action="close-modal">Cerrar</button><button class="btn btn-primary" data-action="add-cart" data-id="' + esc(product.id) + '" ' + (Number(product.stock) <= 0 ? 'disabled' : '') + '>Agregar al carrito ＋</button>');
  }

  function openProfile() {
    if (!currentUser) { authMode = 'login'; setScreen('access'); return; }
    var body = '<div class="modal-body"><form id="profile-form"><div class="form-grid"><div class="field"><label for="profile-name">Nombre</label><input id="profile-name" name="name" required value="' + esc(currentUser.name || '') + '"></div><div class="field"><label for="profile-surname">Apellido</label><input id="profile-surname" name="surname" required value="' + esc(currentUser.surname || '') + '"></div><div class="field full"><label for="profile-phone">Teléfono</label><input id="profile-phone" name="phone" value="' + esc(currentUser.phone || '') + '"></div><div class="field full"><label>Correo</label><input value="' + esc(currentUser.email || 'Invitado') + '" disabled></div></div><button class="btn btn-primary" type="submit">Guardar mis datos</button></form><div class="notice-bar" style="margin:18px 0 0">Para que los cambios de contraseña y el acceso funcionen de forma segura, el sitio final debe conectarse a un servicio de cuentas.</div></div>';
    openModal('Mi cuenta', currentUser.kind === 'Invitado' ? 'Estás usando la tienda como invitado.' : 'Revisa y actualiza tus datos de contacto.', body, '<button class="btn btn-light" data-action="close-modal">Cerrar</button><button class="btn btn-quiet" data-action="forgot">Cambiar contraseña</button><button class="btn btn-danger btn-small" data-action="sign-out">Salir</button>');
  }

  function openForgot() {
    var body = '<div class="modal-body"><form id="forgot-form"><div class="field"><label for="forgot-email">Correo de tu cuenta</label><input id="forgot-email" name="email" type="email" required placeholder="tu@correo.cl"></div><p style="font-size:12px;color:#786f66;line-height:1.6">En el sitio publicado, aquí recibirás un enlace de recuperación que vence después de un tiempo. En esta maqueta no se envían correos.</p><button class="btn btn-primary" type="submit">Solicitar enlace</button></form></div>';
    openModal('Recuperar contraseña', 'Recibe instrucciones en tu correo.', body, '<button class="btn btn-light" data-action="close-modal">Cerrar</button>');
  }

  function openCustomerDetail(id) {
    var customer = data.customers.find(function (c) { return c.id === id; });
    if (!customer) return;
    selectedCustomer = id;
    var body = '<div class="modal-body"><div class="client-avatar" style="width:54px;height:54px;font-size:18px">' + esc(initials(customer)) + '</div><h3 style="margin:0 0 16px;font:800 19px Manrope,sans-serif">' + esc(fullName(customer)) + '</h3><div class="field"><label>Tipo de cliente</label><input value="' + esc(customer.kind || 'Invitado') + '" disabled></div><div class="field"><label>Teléfono</label><input value="' + esc(customer.phone || 'Sin teléfono') + '" disabled></div><div class="field"><label>Correo electrónico</label><input value="' + esc(customer.email || 'Sin correo') + '" disabled></div><div class="field"><label>Fecha de registro</label><input value="' + esc(customer.createdAt || 'No disponible') + '" disabled></div><p class="field-hint">No se muestran ni almacenan contraseñas.</p></div>';
    openModal('Ficha de cliente', 'Datos de contacto registrados.', body, '<button class="btn btn-light" data-action="close-modal">Cerrar</button><button class="btn btn-danger" data-action="delete-customer" data-id="' + esc(id) + '">Eliminar cliente</button>');
  }

  function addToCart(id) {
    var product = data.products.find(function (p) { return p.id === id; });
    if (!product || Number(product.stock) <= 0) { notify('Este producto está agotado.'); return; }
    var current = Number(cart[id]) || 0;
    if (current >= Number(product.stock)) { notify('No quedan más unidades disponibles.'); return; }
    cart[id] = current + 1;
    closeModal(); render(); notify('Agregado al carrito.');
  }

  function updateCart(id, delta) {
    var product = data.products.find(function (p) { return p.id === id; });
    var next = (Number(cart[id]) || 0) + Number(delta);
    if (next <= 0) delete cart[id];
    else if (product && next <= Number(product.stock)) cart[id] = next;
    else notify('No quedan más unidades disponibles.');
    openCart(); render();
  }

  function checkout() {
    if (!Object.keys(cart).length) return;
    if (!currentUser) { closeModal(); authMode = 'login'; setScreen('access'); notify('Ingresa o continúa como invitado para armar tu pedido.'); return; }
    var lines = Object.keys(cart).map(function (id) {
      var product = data.products.find(function (p) { return p.id === id; });
      if (!product) return '';
      var price = activeOffer(product) ? Number(product.offerPrice) : Number(product.price);
      return '• ' + product.name + ' x' + cart[id] + ' — ' + money(price * Number(cart[id]));
    }).filter(Boolean);
    var total = Object.keys(cart).reduce(function (sum, id) {
      var product = data.products.find(function (p) { return p.id === id; });
      return sum + (product ? (activeOffer(product) ? Number(product.offerPrice) : Number(product.price)) * Number(cart[id]) : 0);
    }, 0);
    var message = 'Hola, quiero hacer este pedido para retirar en el local:\n\n' + lines.join('\n') + '\n\nTotal: ' + money(total) + '\nNombre: ' + fullName(currentUser) + (currentUser.phone ? '\nTeléfono: ' + currentUser.phone : '') + '\n\n¿Me confirman el tiempo de preparación?';
    var phone = String(data.settings.whatsapp || '').replace(/\D/g, '');
    if (!phone) {
      openModal('Tu pedido está listo', 'Configura el WhatsApp del local en el panel para enviar pedidos directamente.', '<div class="modal-body"><div class="notice-bar">Aún no hay un número de WhatsApp configurado. Copia el resumen y compártelo cuando definas el número del local.</div><textarea id="order-text" readonly style="width:100%;min-height:150px;padding:12px;border:1px solid var(--line);border-radius:10px">' + esc(message) + '</textarea></div>', '<button class="btn btn-light" data-action="close-modal">Volver al carrito</button><button class="btn btn-primary" data-action="copy-order">Copiar resumen</button>');
      return;
    }
    var url = 'https://wa.me/' + encodeURIComponent(phone) + '?text=' + encodeURIComponent(message);
    window.open(url, '_blank', 'noopener,noreferrer');
    closeModal();
    notify('Se abrió WhatsApp para que confirmes y envíes tu pedido.');
  }

  function imageToDataUrl(file) {
    return new Promise(function (resolve, reject) {
      if (!file || !file.type.match(/^image\//)) { reject(new Error('Selecciona una imagen válida.')); return; }
      var reader = new FileReader();
      reader.onerror = function () { reject(new Error('No se pudo leer la imagen.')); };
      reader.onload = function () {
        var image = new Image();
        image.onerror = function () { reject(new Error('No se pudo abrir la imagen.')); };
        image.onload = function () {
          var scale = Math.min(1, 1200 / Math.max(image.width, image.height));
          var canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(image.width * scale));
          canvas.height = Math.max(1, Math.round(image.height * scale));
          canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.78));
        };
        image.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  document.addEventListener('click', function (event) {
    var control = event.target.closest('[data-action]');
    if (!control) return;
    var action = control.getAttribute('data-action');
    var id = control.getAttribute('data-id');
    if (action === 'auth-mode') { authMode = control.getAttribute('data-mode'); render(); }
    else if (action === 'enter-admin') { closeModal(); adminSearch = ''; adminSection = 'products'; setScreen('admin'); }
    else if (action === 'enter-store' || action === 'store-home') { closeModal(); search = ''; filter = 'TODOS'; setScreen('store'); }
    else if (action === 'sign-out') { closeModal(); currentUser = null; cart = {}; authMode = 'login'; setScreen('access'); }
    else if (action === 'filter') { filter = control.getAttribute('data-filter') || 'TODOS'; screen = 'store'; render(); document.querySelector('.section-head:nth-of-type(2)')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    else if (action === 'profile') openProfile();
    else if (action === 'cart') openCart();
    else if (action === 'add-cart') addToCart(id);
    else if (action === 'cart-qty') updateCart(id, control.getAttribute('data-delta'));
    else if (action === 'checkout') checkout();
    else if (action === 'close-modal') closeModal();
    else if (action === 'overlay-close' && event.target === control) closeModal();
    else if (action === 'details') openProductDetails(id);
    else if (action === 'forgot') openForgot();
    else if (action === 'new-product') openProductForm('');
    else if (action === 'edit-product') openProductForm(id);
    else if (action === 'delete-product') {
      var p = data.products.find(function (product) { return product.id === id; });
      if (p && window.confirm('¿Eliminar “' + p.name + '” del catálogo?')) { data.products = data.products.filter(function (product) { return product.id !== id; }); delete cart[id]; persist(); render(); notify('Producto eliminado.'); }
    }
    else if (action === 'admin-section') { adminSection = control.getAttribute('data-section'); adminSearch = ''; render(); }
    else if (action === 'customer-detail') openCustomerDetail(id);
    else if (action === 'delete-customer') {
      var c = data.customers.find(function (person) { return person.id === id; });
      if (c && window.confirm('¿Eliminar el registro de ' + fullName(c) + '?')) { data.customers = data.customers.filter(function (person) { return person.id !== id; }); persist(); closeModal(); render(); notify('Registro eliminado.'); }
    }
    else if (action === 'delete-category') {
      var category = control.getAttribute('data-category');
      if (data.products.some(function (p) { return p.category === category; })) notify('Mueve o elimina primero los productos de esta categoría.');
      else if (window.confirm('¿Eliminar la categoría “' + category + '”?')) { data.categories = data.categories.filter(function (item) { return item !== category; }); persist(); render(); notify('Categoría eliminada.'); }
    }
    else if (action === 'export-clients') exportCustomers();
    else if (action === 'copy-order') {
      var textarea = document.getElementById('order-text');
      if (textarea && navigator.clipboard) navigator.clipboard.writeText(textarea.value).then(function () { notify('Resumen copiado.'); }, function () { textarea.select(); document.execCommand('copy'); notify('Resumen copiado.'); });
      else if (textarea) { textarea.select(); document.execCommand('copy'); notify('Resumen copiado.'); }
    }
  });

  document.addEventListener('input', function (event) {
    if (event.target.id === 'store-search') {
      var start = event.target.selectionStart;
      search = event.target.value;
      render();
      var next = document.getElementById('store-search'); if (next) { next.focus(); next.setSelectionRange(start, start); }
    } else if (event.target.id === 'admin-search') {
      var cursor = event.target.selectionStart;
      adminSearch = event.target.value;
      render();
      var searchField = document.getElementById('admin-search'); if (searchField) { searchField.focus(); searchField.setSelectionRange(cursor, cursor); }
    }
  });

  document.addEventListener('change', function (event) {
    if (event.target.id === 'product-image' && event.target.files && event.target.files[0]) {
      imageToDataUrl(event.target.files[0]).then(function (result) {
        pendingImage = result;
        var preview = document.getElementById('image-preview');
        if (preview) preview.innerHTML = '<img src="' + result + '" alt="Vista previa">';
      }).catch(function (error) { notify(error.message); });
    }
  });

  document.addEventListener('submit', function (event) {
    event.preventDefault();
    var form = event.target;
    var values = Object.fromEntries(new FormData(form).entries());
    if (form.id === 'auth-form') {
      var email = String(values.email || '').trim().toLowerCase();
      if (authMode === 'register') {
        if (data.customers.some(function (c) { return c.email && c.email.toLowerCase() === email; })) { notify('Ese correo ya está registrado. Inicia sesión.'); return; }
        var customer = { id: 'c' + Date.now(), name: String(values.name).trim(), surname: String(values.surname).trim(), phone: String(values.phone).trim(), email: email, kind: 'Cuenta', createdAt: new Date().toISOString().slice(0, 10) };
        data.customers.unshift(customer); currentUser = customer; persist(); setScreen('store'); notify('Tu perfil de demostración quedó registrado.');
      } else {
        var found = data.customers.find(function (c) { return c.kind === 'Cuenta' && c.email && c.email.toLowerCase() === email; });
        if (!found) { notify('No encontramos esa cuenta en esta demostración. Crea una cuenta primero.'); return; }
        currentUser = found; setScreen('store'); notify('Sesión de demostración iniciada.');
      }
    } else if (form.id === 'guest-form') {
      currentUser = { id: 'g' + Date.now(), name: String(values.name).trim(), surname: String(values.surname).trim(), phone: '', email: '', kind: 'Invitado', createdAt: new Date().toISOString().slice(0, 10) };
      data.customers.unshift(currentUser); persist(); setScreen('store'); notify('Listo, continúa como invitado.');
    } else if (form.id === 'product-form') {
      var price = Number(values.price);
      var offer = Number(values.offerPrice) || 0;
      if (!data.categories.length) { notify('Crea una categoría primero.'); return; }
      if (offer && offer >= price) { notify('El precio de oferta debe ser menor al precio normal.'); return; }
      var updated = { id: editingId || 'p' + Date.now(), name: String(values.name).trim(), category: values.category, price: price, offerPrice: offer, stock: Math.max(0, Number(values.stock) || 0), description: String(values.description).trim(), image: pendingImage, emoji: values.emoji || '🍔' };
      if (editingId) data.products = data.products.map(function (p) { return p.id === editingId ? updated : p; });
      else data.products.unshift(updated);
      persist(); closeModal(); render(); notify(editingId ? 'Producto actualizado.' : 'Producto creado.');
    } else if (form.id === 'category-form') {
      var category = String(values.category).trim();
      if (data.categories.some(function (c) { return c.toLowerCase() === category.toLowerCase(); })) { notify('Esa categoría ya existe.'); return; }
      data.categories.push(category); persist(); render(); notify('Categoría agregada.');
    } else if (form.id === 'settings-form') {
      data.settings.storeName = String(values.storeName).trim();
      data.settings.whatsapp = String(values.whatsapp).replace(/\D/g, '');
      data.settings.address = String(values.address).trim() || 'Retiro en local';
      persist(); render(); notify('Ajustes guardados.');
    } else if (form.id === 'profile-form') {
      currentUser.name = String(values.name).trim(); currentUser.surname = String(values.surname).trim(); currentUser.phone = String(values.phone || '').trim();
      var index = data.customers.findIndex(function (c) { return c.id === currentUser.id; });
      if (index >= 0) data.customers[index] = currentUser;
      persist(); closeModal(); render(); notify('Datos actualizados.');
    } else if (form.id === 'forgot-form') {
      notify('La recuperación por correo se activa al conectar el servicio de usuarios.'); closeModal();
    }
  });

  function exportCustomers() {
    var rows = [['Nombre', 'Tipo', 'Teléfono', 'Correo', 'Fecha de registro']].concat(data.customers.map(function (c) { return [fullName(c), c.kind || 'Invitado', c.phone || '', c.email || '', c.createdAt || '']; }));
    var csv = rows.map(function (row) { return row.map(function (cell) { return '"' + String(cell).replace(/"/g, '""') + '"'; }).join(','); }).join('\r\n');
    var link = document.createElement('a'); link.href = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })); link.download = 'clientes-la-esquina.csv'; link.click(); URL.revokeObjectURL(link.href);
    notify('Lista de clientes descargada.');
  }

  render();
})();
