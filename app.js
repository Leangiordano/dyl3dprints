const WA = '541153195024';
        const CART_KEY = 'dyl-cart';
        const PAY = {
            alias: 'lgiordano2.ppay',
            titular: 'Leandro Rodrigo Giordano',
            mpLink: 'https://link.mercadopago.com.ar/dyl3dprints',
            mpName: 'DyL 3D Prints'
        };
        const TRANSFER_OFF = 0.05;
        let selectedPay = null;
        let catalogFilter = '';

        const CATEGORIES = [
            { id: 'munecos', name: 'Muñecos' },
            { id: 'soporte-celular', name: 'Soporte celular' },
            { id: 'adornos', name: 'Adornos' },
            { id: 'estilo-crochet', name: 'Estilo crochet' },
            { id: 'estilo-voronoi', name: 'Estilo Voronoi' },
            { id: 'accesorios', name: 'Accesorios' }
        ];

        const PRODUCTS = [
            {
                id: 'corazon-mama',
                name: 'Corazón de Mamá',
                price: '$10.500',
                priceNum: 10500,
                badge: 'Día de la Madre',
                badgeClass: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
                short: 'Un detalle para el escritorio o la mesita: corazón impreso en 3D con la palabra Mamá al centro.',
                long: 'Un detalle para el escritorio o la mesita: corazón impreso en 3D con la palabra Mamá al centro. Ideal para regalar en su día, o cuando quieras decirlo sin tantas palabras. Colores personalizables a pedido.',
                categories: ['adornos'],
                images: [
                    'img/corazon-mama-1.jpg',
                    'img/corazon-mama-2.jpg',
                    'img/corazon-mama-3.jpg',
                    'img/corazon-mama-4.jpg',
                    'img/corazon-mama-5.jpg',
                    'img/corazon-mama-6.jpg'
                ]
            },
            {
                id: 'pika-stitch-crochet',
                name: 'Pika Stitch Crochet',
                price: 'Consultar',
                priceNum: 0,
                consult: true,
                categories: ['munecos', 'estilo-crochet'],
                badge: 'Muñecos',
                badgeClass: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
                short: 'Figura coleccionable con textura tipo crochet: Pikachu en hoodie de Stitch, impresa en 3D.',
                long: 'Pieza de colección con acabado texturado que evoca el punto crochet. Combina a Pikachu con la capucha de Stitch, pensada para vitrina o escritorio. Impresión 3D de detalle fino; consultá disponibilidad y valor.',
                images: [
                    'img/pika-stitch-crochet.jpg'
                ]
            },
            {
                id: 'organizadores',
                name: 'Organizadores modulares',
                price: 'Desde $8.500',
                priceNum: 8500,
                badge: 'Popular',
                badgeClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
                short: 'Personalizables en colores y tamaños.',
                long: 'Módulos para ordenar escritorio, cocina o taller. Se pueden combinar y pedir en distintos colores y medidas. Escribinos con la medida que necesitás y te armamos la cotización.',
                categories: ['accesorios'],
                icon: 'fa-cube',
                images: []
            },
            {
                id: 'soportes-celular',
                name: 'Soportes para celular',
                price: 'Desde $4.200',
                priceNum: 4200,
                badge: '',
                badgeClass: '',
                short: 'Diseños ergonómicos y resistentes.',
                long: 'Soportes impresos en 3D, pensados para mesa o escritorio. Hay varios ángulos y estilos; si tenés un modelo de celular o un uso puntual (auto, cocina, streaming), lo adaptamos.',
                categories: ['soporte-celular', 'accesorios'],
                icon: 'fa-mobile-screen',
                images: []
            }
        ];

        let cart = {};
        let lbImages = [];
        let lbIndex = 0;
        let touchStartX = 0;

        function productById(id) {
            return PRODUCTS.find(p => p.id === id);
        }

        function loadCart() {
            try { cart = JSON.parse(localStorage.getItem(CART_KEY) || '{}') || {}; }
            catch (e) { cart = {}; }
        }

        function saveCart() {
            localStorage.setItem(CART_KEY, JSON.stringify(cart));
        }

        function qtyOf(id) {
            return cart[id] || 0;
        }

        function cartCount() {
            return Object.values(cart).reduce((a, b) => a + b, 0);
        }

        function cartTotal() {
            return PRODUCTS.reduce((sum, p) => sum + qtyOf(p.id) * p.priceNum, 0);
        }

        function transferSelected() {
            return selectedPay === 'transferencia';
        }

        function payableTotal() {
            const t = cartTotal();
            return transferSelected() ? Math.round(t * (1 - TRANSFER_OFF)) : t;
        }

        function formatARS(n) {
            return '$' + n.toLocaleString('es-AR');
        }

        function setQty(id, qty) {
            qty = Math.max(0, Math.min(99, qty | 0));
            if (qty === 0) delete cart[id];
            else cart[id] = qty;
            saveCart();
            refreshCartUI();
        }

        function addOne(id) { setQty(id, qtyOf(id) + 1); }
        function subOne(id) { setQty(id, qtyOf(id) - 1); }
        function removeItem(id) { setQty(id, 0); }

        function qtyControl(id) {
            const q = qtyOf(id);
            if (q === 0) {
                return `<button type="button" class="add-cart-btn" onclick="addOne('${id}')">
                    <i class="fa-solid fa-bag-shopping"></i> Agregar
                </button>`;
            }
            return `<div class="qty-wrap" aria-label="Cantidad">
                <button type="button" onclick="subOne('${id}')" aria-label="Quitar uno"><i class="fa-solid fa-minus text-xs"></i></button>
                <span>${q}</span>
                <button type="button" onclick="addOne('${id}')" aria-label="Agregar uno"><i class="fa-solid fa-plus text-xs"></i></button>
            </div>`;
        }

        function refreshCartUI() {
            const badge = document.getElementById('cart-badge');
            const n = cartCount();
            badge.textContent = n > 99 ? '99+' : String(n);
            badge.classList.toggle('show', n > 0);
            badge.classList.remove('pop');
            void badge.offsetWidth;
            if (n > 0) badge.classList.add('pop');

            document.querySelectorAll('[data-cart-controls]').forEach(el => {
                el.innerHTML = qtyControl(el.dataset.cartControls);
            });

            renderCartDrawer();
        }

        function renderCartDrawer() {
            const box = document.getElementById('cart-items');
            const lines = PRODUCTS.filter(p => qtyOf(p.id) > 0);
            if (!lines.length) {
                box.innerHTML = '<p class="muted text-sm py-10 text-center">El carrito está vacío.</p>';
            } else {
                box.innerHTML = lines.map(p => {
                    const thumb = p.images[0]
                        ? `<img class="cart-line-img" src="${p.images[0]}" alt="">`
                        : `<div class="cart-line-img flex items-center justify-center faint"><i class="fa-solid ${p.icon}"></i></div>`;
                    return `<div class="flex gap-3 py-4 border-b line">
                        ${thumb}
                        <div class="flex-1 min-w-0">
                            <div class="font-medium truncate">${p.name}</div>
                            <div class="text-sm muted mt-0.5">${p.consult ? 'Consultar' : formatARS(p.priceNum)}</div>
                            <div class="mt-2 flex items-center gap-1">
                                <div data-cart-controls="${p.id}">${qtyControl(p.id)}</div>
                                <button type="button" class="trash-btn" onclick="removeItem('${p.id}')" aria-label="Quitar del carrito">
                                    <i class="fa-regular fa-trash-can"></i>
                                </button>
                            </div>
                        </div>
                        <div class="text-sm font-semibold pt-1">${p.consult ? 'Consultar' : formatARS(p.priceNum * qtyOf(p.id))}</div>
                    </div>`;
                }).join('');
            }
            document.getElementById('cart-total').textContent = formatARS(payableTotal());
            document.getElementById('cart-checkout').href = checkoutLink();
        }

        function checkoutLink() {
            const lines = PRODUCTS.filter(p => qtyOf(p.id) > 0);
            if (!lines.length) return 'https://wa.me/' + WA;
            const list = lines.map(p => `• ${p.name} x${qtyOf(p.id)} — ${p.consult ? 'Consultar' : formatARS(p.priceNum * qtyOf(p.id))}`).join('\n');
            const msg = `Hola DyL, quiero este pedido:\n\n${list}\n\nTotal: ${formatARS(cartTotal())}`;
            return 'https://wa.me/' + WA + '?text=' + encodeURIComponent(msg);
        }

        function toggleCart() {
            const open = document.getElementById('cart-drawer').classList.toggle('open');
            document.getElementById('cart-backdrop').classList.toggle('open', open);
        }
        function closeCart() {
            document.getElementById('cart-drawer').classList.remove('open');
            document.getElementById('cart-backdrop').classList.remove('open');
        }

        const PAY_METHODS = [
            {
                id: 'transferencia',
                icon: 'fa-building-columns',
                title: 'Transferencia bancaria',
                subtitle: '5% de descuento. Solo alias.',
                detail: () => `Titular: ${PAY.titular}<br>5% de descuento por transferencia.
                    <button type="button" class="copy-chip" onclick="event.stopPropagation(); copyText('${PAY.alias}')"><span>${PAY.alias}</span><span><i class="fa-regular fa-copy"></i> Copiar</span></button>`
            },
            {
                id: 'mercadopago',
                icon: 'fa-handshake',
                title: 'Mercado Pago',
                subtitle: 'Pago online, crédito, débito o dinero en cuenta.',
                detail: () => `El cobro entra en ${PAY.mpName || 'Mercado Pago'}. El botón del resumen abre el checkout con el mismo total del carrito.`
            },
            {
                id: 'tarjetas',
                icon: 'fa-credit-card',
                title: 'Tarjeta de crédito o débito',
                subtitle: 'Visa, Mastercard y cabal a través de Mercado Pago.',
                detail: () => `Visa, Mastercard y débito en el checkout de ${PAY.mpName || 'Mercado Pago'}, con el total del pedido ya cargado.`
            },
            {
                id: 'billeteras',
                icon: 'fa-wallet',
                title: 'Otras billeteras',
                subtitle: 'Modo, Ualá, Naranja X, Personal Pay y similares.',
                detail: () => `Transferí desde tu billetera al mismo alias.
                    <button type="button" class="copy-chip" onclick="event.stopPropagation(); copyText('${PAY.alias}')"><span>${PAY.alias}</span><span><i class="fa-regular fa-copy"></i> Copiar</span></button>`
            }
        ];

        function renderPayMethods() {
            document.getElementById('pay-methods').innerHTML = PAY_METHODS.map(m => `
                <div class="pay-card ${selectedPay === m.id ? 'selected' : ''}" onclick="selectPay('${m.id}')">
                    <div class="flex items-start gap-4">
                        <div class="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0" style="background:var(--bg-muted); color:var(--accent)">
                            <i class="fa-solid ${m.icon}"></i>
                        </div>
                        <div class="min-w-0 flex-1">
                            <div class="font-semibold">${m.title}</div>
                            <div class="text-sm muted mt-1">${m.subtitle}</div>
                            <div class="pay-detail">${m.detail()}</div>
                        </div>
                    </div>
                </div>
            `).join('');
        }

        function copyText(text) {
            navigator.clipboard.writeText(text).catch(() => {});
        }

        function selectPay(id) {
            selectedPay = id;
            renderPayMethods();
            updatePayConfirm();
        }

        function updatePayConfirm() {
            const btn = document.getElementById('pay-confirm');
            const hint = document.getElementById('pay-hint');
            const method = PAY_METHODS.find(m => m.id === selectedPay);
            const subtotal = cartTotal();
            const total = payableTotal();
            const el = document.getElementById('checkout-total');
            if (transferSelected() && subtotal > 0) {
                el.innerHTML = `<span class="block faint line-through text-sm font-medium">${formatARS(subtotal)}</span>
                    <span class="block">${formatARS(total)}</span>
                    <span class="block text-xs font-medium mt-1" style="color:var(--accent)">5% off transferencia</span>`;
            } else {
                el.textContent = formatARS(subtotal);
            }
            const cartTotalEl = document.getElementById('cart-total');
            if (cartTotalEl) {
                cartTotalEl.innerHTML = transferSelected() && subtotal > 0
                    ? `<span class="line-through faint text-sm mr-2">${formatARS(subtotal)}</span>${formatARS(total)}`
                    : formatARS(subtotal);
            }
            const lines = PRODUCTS.filter(p => qtyOf(p.id) > 0);
            const methodLine = method
                ? `<div class="flex justify-between text-sm py-1 mt-2 pt-2 border-t line"><span class="muted">Medio de pago</span><span class="font-medium text-right">${method.title}</span></div>`
                : '';
            document.getElementById('checkout-summary').innerHTML = lines.length
                ? lines.map(p => `<div class="flex justify-between text-sm py-1"><span class="muted">${p.name} ×${qtyOf(p.id)}</span><span>${p.consult ? 'Consultar' : formatARS(p.priceNum * qtyOf(p.id))}</span></div>`).join('')
                    + (transferSelected() ? `<div class="flex justify-between text-sm py-1"><span class="muted">Descuento transferencia 5%</span><span style="color:var(--accent)">− ${formatARS(subtotal - total)}</span></div>` : '')
                    + methodLine
                : '<p class="muted text-sm">El carrito está vacío.</p>';
            window._checkoutMsg = '';
            if (!lines.length || !method) {
                btn.classList.add('pointer-events-none', 'opacity-50');
                hint.textContent = lines.length ? 'Elegí un medio de pago para continuar.' : 'Agregá productos al carrito para pagar.';
                hint.style.display = '';
                btn.innerHTML = 'Confirmar';
                return;
            }
            btn.classList.remove('pointer-events-none', 'opacity-50');
            hint.textContent = '';
            hint.style.display = 'none';
            const list = lines.map(p => `• ${p.name} x${qtyOf(p.id)} — ${p.consult ? 'Consultar' : formatARS(p.priceNum * qtyOf(p.id))}`).join('\n');
            const extra = transferSelected()
                ? `\nDescuento transferencia 5%: − ${formatARS(subtotal - total)}\nTotal: ${formatARS(total)}\nAlias: ${PAY.alias}`
                : `\nTotal: ${formatARS(total)}`;
            window._checkoutMsg = `Hola DyL, quiero pagar este pedido:\n\n${list}${extra}\nMedio de pago: ${method.title}`;
            if (selectedPay === 'mercadopago' || selectedPay === 'tarjetas') {
                btn.innerHTML = '<i class="fa-solid fa-lock"></i> Pagar con Mercado Pago';
            } else {
                btn.innerHTML = '<i class="fa-brands fa-whatsapp text-lg"></i> Confirmar por WhatsApp';
            }
        }

        async function startCheckout() {
            if (!selectedPay || !cartCount()) return;
            if (selectedPay === 'mercadopago' || selectedPay === 'tarjetas') {
                const btn = document.getElementById('pay-confirm');
                const prev = btn.innerHTML;
                btn.innerHTML = 'Generando pago…';
                btn.classList.add('pointer-events-none', 'opacity-50');
                const items = PRODUCTS.filter(p => qtyOf(p.id) > 0).map(p => ({
                    id: p.id,
                    title: p.name,
                    quantity: qtyOf(p.id),
                    unit_price: p.priceNum
                }));
                try {
                    const res = await fetch('/api/create-preference', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ items, total: payableTotal(), payer_method: selectedPay })
                    });
                    const data = await res.json().catch(() => ({}));
                    if (res.ok && data.init_point) {
                        window.location.href = data.init_point;
                        return;
                    }
                    throw new Error(data.error || 'no-preference');
                } catch (e) {
                    alert('Mercado Pago con el total del carrito necesita el Access Token del comercio (DyL 3D Prints). Hasta cargarlo, no se puede abrir un checkout con el monto cerrado.');
                } finally {
                    btn.innerHTML = prev;
                    btn.classList.remove('pointer-events-none', 'opacity-50');
                }
                return;
            }
            window.open('https://wa.me/' + WA + '?text=' + encodeURIComponent(window._checkoutMsg || ''), '_blank');
        }

        function goCheckout() {
            if (!cartCount()) return;
            closeCart();
            location.hash = 'checkout';
        }

        function closeCheckout(ev) {
            closeCart();
            document.body.classList.remove('checkout-open');
            document.body.classList.remove('product-open');
            const href = ev && ev.currentTarget ? ev.currentTarget.getAttribute('href') : '#catalogo';
            if (ev) ev.preventDefault();
            location.hash = href || '#catalogo';
        }

        function renderCatMenus() {
            const links = CATEGORIES.map(c =>
                `<a href="#catalogo/${c.id}" onclick="closeCart(); toggleMobileMenuSafe()">${c.name}</a>`
            ).join('');
            const desk = document.getElementById('nav-cat-menu');
            const mob = document.getElementById('mobile-cats');
            if (desk) desk.innerHTML = `<a href="#catalogo" onclick="closeCart()">Ver todo</a>` + links;
            if (mob) mob.innerHTML = `<a class="nav-link py-1" href="#catalogo" onclick="toggleMobileMenu(); closeCart()">Ver todo</a>` +
                CATEGORIES.map(c => `<a class="nav-link py-1" href="#catalogo/${c.id}" onclick="toggleMobileMenu(); closeCart()">${c.name}</a>`).join('');
        }

        function toggleMobileMenuSafe() {
            const m = document.getElementById('mobile-menu');
            if (m && !m.classList.contains('hidden')) m.classList.add('hidden');
        }

        function catalogFilterFromHash() {
            const m = location.hash.match(/^#catalogo\/([^/]+)/);
            return m ? m[1] : '';
        }

        function renderCatalog() {
            const grid = document.getElementById('catalog-grid');
            catalogFilter = catalogFilterFromHash();
            const cat = CATEGORIES.find(c => c.id === catalogFilter);
            const list = catalogFilter
                ? PRODUCTS.filter(p => (p.categories || []).includes(catalogFilter))
                : PRODUCTS;
            const sub = document.getElementById('catalog-sub');
            if (sub) sub.textContent = cat ? cat.name : 'Algunos de nuestros productos más populares';
            if (!list.length) {
                grid.innerHTML = `<p class="muted col-span-full py-10 text-center">Todavía no hay piezas en esta categoría. <a href="#contacto" class="font-medium hover:underline" style="color:var(--text)">Escribinos</a> y la hacemos.</p>`;
                return;
            }
            grid.innerHTML = list.map(p => {
                const media = p.images.length
                    ? `<button type="button" class="catalog-img-wrap aspect-video rounded-2xl mb-5 overflow-hidden w-full" onclick="openLightbox('${p.id}', 0)">
                            <img class="product-photo" src="${p.images[0]}" alt="${p.name}">
                       </button>`
                    : `<a href="#producto/${p.id}" class="aspect-video placeholder rounded-2xl mb-5 flex items-center justify-center">
                            <i class="fa-solid ${p.icon} text-6xl"></i>
                       </a>`;
                const thumbs = p.images.length
                    ? `<div class="grid grid-cols-4 gap-2 mb-5">
                            ${p.images.slice(0, 4).map((src, i) =>
                                `<img class="thumb ${i === 0 ? 'active' : ''}" src="${src}" alt="" onclick="openLightbox('${p.id}', ${i})">`
                            ).join('')}
                       </div>`
                    : '';
                const badge = p.badge
                    ? `<span class="shrink-0 text-xs px-3 py-1 rounded-2xl font-medium ${p.badgeClass}">${p.badge}</span>`
                    : '';
                return `<article class="card rounded-3xl p-6">
                    ${media}
                    ${thumbs}
                    <div class="flex items-start justify-between gap-3">
                        <h3 class="font-semibold text-xl">
                            <a class="product-title-link" href="#producto/${p.id}">${p.name}</a>
                        </h3>
                        ${badge}
                    </div>
                    <p class="muted text-sm mt-2 mb-4">${p.short}</p>
                    <div class="flex items-center justify-between gap-3">
                        <span class="font-semibold">${p.price}</span>
                        <div data-cart-controls="${p.id}">${qtyControl(p.id)}</div>
                    </div>
                </article>`;
            }).join('');
        }

        function renderGallery() {
            const p = productById('corazon-mama');
            const grid = document.getElementById('gallery-grid');
            const shots = [0, 3, 4, 5];
            grid.innerHTML = shots.map(i =>
                `<button type="button" class="aspect-square rounded-3xl overflow-hidden" onclick="openLightbox('corazon-mama', ${i})">
                    <img class="gallery-photo" src="${p.images[i]}" alt="${p.name}">
                 </button>`
            ).join('');
        }

        function renderProductPage(p) {
            const media = p.images.length
                ? `<div>
                        <button type="button" class="catalog-img-wrap aspect-square md:aspect-[4/3] rounded-3xl overflow-hidden w-full card" onclick="openLightbox('${p.id}', currentPdpIndex())">
                            <img id="pdp-main" class="pdp-main-img" src="${p.images[0]}" alt="${p.name}">
                        </button>
                        <div class="grid grid-cols-6 gap-2 mt-4">
                            ${p.images.map((src, i) =>
                                `<img class="thumb pdp-thumb ${i === 0 ? 'active' : ''}" src="${src}" alt="" onclick="setPdpImage(${i}); openLightbox('${p.id}', ${i})">`
                            ).join('')}
                        </div>
                   </div>`
                : `<div class="aspect-square placeholder rounded-3xl flex items-center justify-center">
                        <i class="fa-solid ${p.icon} text-7xl"></i>
                   </div>`;
            const badge = p.badge
                ? `<span class="text-xs px-3 py-1 rounded-2xl font-medium ${p.badgeClass}">${p.badge}</span>`
                : '';
            document.getElementById('product-page').innerHTML = `
                ${media}
                <div>
                    <div class="flex items-center gap-3 mb-3">${badge}</div>
                    <h1 class="logo-font text-4xl md:text-5xl tracking-tight mb-4">${p.name}</h1>
                    <p class="text-2xl font-semibold mb-6">${p.price}</p>
                    <p class="muted text-lg mb-8">${p.long}</p>
                    <div data-cart-controls="${p.id}">${qtyControl(p.id)}</div>
                </div>`;
        }

        function currentPdpIndex() {
            const main = document.getElementById('pdp-main');
            if (!main) return 0;
            const p = currentProductFromHash();
            if (!p) return 0;
            const i = p.images.indexOf(main.getAttribute('src'));
            return i < 0 ? 0 : i;
        }

        function setPdpImage(i) {
            const main = document.getElementById('pdp-main');
            const p = currentProductFromHash();
            if (!main || !p) return;
            main.src = p.images[i];
            document.querySelectorAll('.pdp-thumb').forEach((t, idx) => {
                t.classList.toggle('active', idx === i);
            });
        }

        function currentProductFromHash() {
            const m = location.hash.match(/^#producto\/([^/]+)/);
            return m ? productById(m[1]) : null;
        }

        function openProduct(id) {
            const p = productById(id);
            if (!p) return;
            renderProductPage(p);
            document.body.classList.add('product-open');
            document.title = p.name + ' • DyL 3D Prints';
            window.scrollTo(0, 0);
        }

        function closeProduct(ev) {
            if (ev) ev.preventDefault();
            document.body.classList.remove('product-open');
            document.title = 'DyL 3D Prints • Impresión 3D';
            const href = ev && ev.currentTarget ? ev.currentTarget.getAttribute('href') : '#catalogo';
            if (location.hash.startsWith('#producto/')) {
                history.pushState(null, '', href || '#catalogo');
            }
            if (href && href.startsWith('#') && href !== '#producto') {
                const el = document.querySelector(href);
                if (el) el.scrollIntoView();
            }
        }

        function route() {
            if (location.hash === '#checkout') {
                document.body.classList.add('checkout-open');
                document.body.classList.remove('product-open');
                document.title = 'Checkout • DyL 3D Prints';
                renderPayMethods();
                updatePayConfirm();
                window.scrollTo(0, 0);
                return;
            }
            document.body.classList.remove('checkout-open');
            const p = currentProductFromHash();
            if (p) openProduct(p.id);
            else {
                document.body.classList.remove('product-open');
                document.title = 'DyL 3D Prints • Impresión 3D';
                if (location.hash.startsWith('#catalogo')) {
                    renderCatalog();
                    const el = document.getElementById('catalogo');
                    if (el) el.scrollIntoView();
                }
            }
        }

        function openLightbox(productId, index) {
            const p = productById(productId);
            if (!p || !p.images.length) return;
            lbImages = p.images;
            lbIndex = index || 0;
            showLightbox();
        }

        function showLightbox() {
            document.getElementById('lightbox-img').src = lbImages[lbIndex];
            document.getElementById('lightbox-counter').textContent = (lbIndex + 1) + ' / ' + lbImages.length;
            document.getElementById('lightbox').classList.add('open');
            document.body.style.overflow = 'hidden';
        }

        function closeLightbox() {
            document.getElementById('lightbox').classList.remove('open');
            document.body.style.overflow = '';
        }

        function lightboxStep(dir) {
            if (!lbImages.length) return;
            lbIndex = (lbIndex + dir + lbImages.length) % lbImages.length;
            showLightbox();
        }

        function applyTheme(theme) {
            const html = document.documentElement;
            const icon = document.getElementById('theme-icon');
            if (theme === 'dark') {
                html.classList.add('dark');
                icon.classList.remove('fa-moon');
                icon.classList.add('fa-sun');
            } else {
                html.classList.remove('dark');
                icon.classList.remove('fa-sun');
                icon.classList.add('fa-moon');
            }
            localStorage.setItem('theme', theme);
        }

        function toggleDarkMode() {
            const next = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
            applyTheme(next);
        }

        function loadTheme() {
            const saved = localStorage.getItem('theme');
            if (saved === 'dark' || saved === 'light') {
                applyTheme(saved);
                return;
            }
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                applyTheme('dark');
            } else {
                applyTheme('light');
            }
        }

        function toggleMobileMenu() {
            document.getElementById('mobile-menu').classList.toggle('hidden');
        }

        document.addEventListener('DOMContentLoaded', () => {
            loadTheme();
            loadCart();
            renderCatMenus();
            renderCatalog();
            renderGallery();
            refreshCartUI();
            route();
        });

        window.addEventListener('hashchange', route);

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeLightbox();
                closeCart();
            }
            if (!document.getElementById('lightbox').classList.contains('open')) return;
            if (e.key === 'ArrowLeft') lightboxStep(-1);
            if (e.key === 'ArrowRight') lightboxStep(1);
        });

        document.getElementById('lightbox').addEventListener('click', (e) => {
            if (e.target.id === 'lightbox') closeLightbox();
        });

        const lbImg = document.getElementById('lightbox-img');
        lbImg.addEventListener('touchstart', (e) => { touchStartX = e.changedTouches[0].screenX; }, { passive: true });
        lbImg.addEventListener('touchend', (e) => {
            const dx = e.changedTouches[0].screenX - touchStartX;
            if (Math.abs(dx) > 40) lightboxStep(dx < 0 ? 1 : -1);
        }, { passive: true });
