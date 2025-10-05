// TimeCraft - basic interactivity: smooth scroll, cart/wishlist state, toasts, and image fallbacks
(function(){
  const CART_KEY = 'timecraft_cart';
  const WISHLIST_KEY = 'timecraft_wishlist';
  const PRODUCTS = [
    { id: 'patek-philippe-nautilus', name: 'Patek Philippe Nautilus', brand: 'Patek Philippe', price: 129999, img: 'img/patek.jpeg', movement: 'Automatic', popularity: 10, rating: 5, reviews: 182 },
    { id: 'rolex-submariner', name: 'Rolex Submariner', brand: 'Rolex', price: 99999, img: 'img/rolex.jpg', movement: 'Automatic', popularity: 9, rating: 5, reviews: 241 },
    { id: 'omega-speedmaster', name: 'Omega Speedmaster', brand: 'Omega', price: 59999, img: 'img/omega.jpg', movement: 'Manual', popularity: 8, rating: 4, reviews: 198 },
    { id: 'ap-royal-oak', name: 'Audemars Piguet Royal Oak', brand: 'Audemars Piguet', price: 149999, img: 'img/ap.jpg', movement: 'Automatic', popularity: 9, rating: 5, reviews: 126 },
    { id: 'tag-heuer-carrera', name: 'TAG Heuer Carrera', brand: 'TAG Heuer', price: 34999, img: 'img/tag.jpg', movement: 'Automatic', popularity: 7, rating: 4, reviews: 163 },
    { id: 'cartier-santos', name: 'Cartier Santos', brand: 'Cartier', price: 45999, img: 'img/cartier.jpg', movement: 'Automatic', popularity: 7, rating: 5, reviews: 77 },
    { id: 'seiko-presage', name: 'Seiko Presage', brand: 'Seiko', price: 8999, img: 'img/seiko.jpg', movement: 'Automatic', popularity: 6, rating: 4, reviews: 329 },
    { id: 'tissot-prx', name: 'Tissot PRX', brand: 'Tissot', price: 5499, img: 'img/tissot.jpg', movement: 'Quartz', popularity: 6, rating: 4, reviews: 254 }
  ];

  // Utilities
  const qs = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const fmtPrice = (n) => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
  const THEME_KEY = 'timecraft_theme';
  const renderStars = (rating=0) => {
    const r = Math.max(0, Math.min(5, Math.round(rating)));
    return '<div class="stars" aria-hidden="true">' +
      '<i class="fa-solid fa-star"></i>'.repeat(r) +
      '<i class="fa-regular fa-star"></i>'.repeat(5-r) +
      '</div>';
  };

  // Skeleton loaders
  const renderSkeletons = (count = 6) => {
    const grid = qs('#products-grid'); if (!grid) return;
    grid.innerHTML = Array.from({length: count}).map(()=>`
      <div class="skeleton-card reveal in-view">
        <div class="skeleton-img"></div>
        <div class="skeleton-gap"></div>
        <div class="skeleton-line" style="width: 70%"></div>
        <div class="skeleton-gap"></div>
        <div class="skeleton-line" style="width: 50%"></div>
      </div>
    `).join('');
  };

  // Scroll reveal
  let revealObserver;
  const observeReveal = () => {
    if (revealObserver) return;
    if (!('IntersectionObserver' in window)) { qsa('.reveal').forEach(el=>el.classList.add('in-view')); return; }
    revealObserver = new IntersectionObserver((entries)=>{
      entries.forEach(entry=>{ if (entry.isIntersecting){ entry.target.classList.add('in-view'); revealObserver.unobserve(entry.target);} });
    }, { threshold: 0.12 });
    qsa('.reveal').forEach(el=>revealObserver.observe(el));
  };

  // Theme toggle
  const applyTheme = (theme) => {
    const root = document.documentElement;
    if (theme==='dark') root.setAttribute('data-theme','dark'); else root.removeAttribute('data-theme');
    const icon = qs('#theme-toggle i'); if (icon) icon.className = theme==='dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
  };
  const initTheme = () => {
    const saved = localStorage.getItem(THEME_KEY);
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = saved || (prefersDark ? 'dark' : 'light');
    applyTheme(theme);
    qs('#theme-toggle')?.addEventListener('click', ()=>{
      const current = document.documentElement.getAttribute('data-theme')==='dark' ? 'dark':'light';
      const next = current==='dark' ? 'light':'dark';
      localStorage.setItem(THEME_KEY, next); applyTheme(next);
    });
  };

  // Hero parallax
  const initHeroParallax = () => {
    const heroInner = qs('.hero-inner'); if (!heroInner) return;
    window.addEventListener('scroll', ()=>{
      const y = Math.min(window.scrollY, 240);
      heroInner.style.transform = `translateY(${y*0.08}px)`;
    }, { passive: true });
  };

  // Delegated product actions for any grid
  const attachCatalogEventsTo = (selector) => {
    const grid = qs(selector); if (!grid) return;
    grid.addEventListener('click', (e) => {
      const target = e.target; const card = target.closest('.product'); if (!card) return;
      const id = card.dataset.id; const name = card.dataset.name; const price = Number(card.dataset.price);
      if (target.closest('.add-to-cart')) {
        const cart = readStore(CART_KEY); const ex = cart.find(it=>it.id===id);
        if (ex) ex.qty = (ex.qty||1)+1; else cart.push({ id, name, price, qty:1 });
        writeStore(CART_KEY, cart); updateBadges(); renderCart(); toast(`${name} added to cart`);
      } else if (target.closest('.add-to-wishlist')) {
        const wl = readStore(WISHLIST_KEY);
        if (!wl.some(it=>it.id===id)) { wl.push({ id, name }); writeStore(WISHLIST_KEY, wl); updateBadges(); toast(`${name} saved to wishlist`);} else { toast(`${name} is already in wishlist`); }
      } else {
        openProductModal(id);
      }
    });
  };

  // Featured rendering: ensure Rolex and Patek are present by default
  const renderFeatured = () => {
    const grid = qs('#featured-grid'); if (!grid) return;
    const pick = [];
    const rolex = PRODUCTS.find(p=>p.id.includes('rolex'));
    const patek = PRODUCTS.find(p=>p.id.includes('patek'));
    if (patek) pick.push(patek);
    if (rolex) pick.push(rolex);
    const items = pick; // Only show Rolex and Patek as requested
    grid.innerHTML = items.map(p => `
      <article class="product reveal" data-id="${p.id}" data-name="${p.name}" data-price="${p.price}">
        <img src="${p.img}" alt="${p.name}" height="200" />
        <h3>${p.name}</h3>
        <p>${p.brand} • ${p.movement}</p>
        ${renderStars(p.rating)}
        <p style="margin-top:4px; color:var(--muted);">${p.reviews} reviews</p>
        <p><strong>${fmtPrice(p.price)}</strong></p>
        <div class="product-actions">
          <button class="btn add-to-cart">Add to Cart</button>
          <button class="btn btn-secondary add-to-wishlist">Wishlist</button>
        </div>
      </article>
    `).join('');
    observeReveal();
  };

  // Search suggestions and search submission
  const updateSuggestions = () => {
    const box = qs('#search-suggestions'); const input = qs('#search-input'); if (!box || !input) return;
    const q = (input.value||'').trim(); if (!q){ box.hidden=true; box.innerHTML=''; return; }
    const matches = PRODUCTS.filter(p => (p.name + ' ' + p.brand).toLowerCase().includes(q.toLowerCase())).slice(0,6);
    if (matches.length===0){ box.hidden=true; box.innerHTML=''; return; }
    box.innerHTML = matches.map(p=>`
      <div class="suggestion-item" role="option" data-id="${p.id}" data-name="${p.name}">
        <span>${p.name}</span>
        <span>${fmtPrice(p.price)}</span>
      </div>
    `).join('');
    box.hidden = false;
  };
  const performSearch = () => {
    const input = qs('#search-input'); if (!input) return; state.query = (input.value||'').trim(); state.searched = true; renderProducts();
    // Also show found items below the search input
    const box = qs('#search-suggestions'); if (!box) return;
    const items = getFilteredSorted().slice(0,6);
    if (items.length===0){ box.hidden=false; box.innerHTML = '<div class="suggestion-item">No matches found</div>'; }
    else {
      box.innerHTML = items.map(p=>`
        <div class="suggestion-item" role="option" data-id="${p.id}" data-name="${p.name}">
          <span>${p.name}</span>
          <span>${fmtPrice(p.price)}</span>
        </div>
      `).join('');
      box.hidden = false;
    }
  };

  const readStore = (key) => {
    try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
  };
  const writeStore = (key, value) => localStorage.setItem(key, JSON.stringify(value));

  const updateBadges = () => {
    const cart = readStore(CART_KEY);
    const wishlist = readStore(WISHLIST_KEY);
    const cartEl = qs('#cart-count');
    const wishEl = qs('#wishlist-count');
    if (cartEl) cartEl.textContent = cart.reduce((sum, it) => sum + (it.qty || 1), 0);
    if (wishEl) wishEl.textContent = wishlist.length;
  };

  // Toasts
  const ensureToastContainer = () => {
    let c = qs('#toast-container');
    if (!c) {
      c = document.createElement('div');
      c.id = 'toast-container';
      c.style.position = 'fixed';
      c.style.top = '16px';
      c.style.right = '16px';
      c.style.display = 'flex';
      c.style.flexDirection = 'column';
      c.style.gap = '8px';
      c.style.zIndex = '9999';
      document.body.appendChild(c);
    }
    return c;
  };
  const toast = (msg) => {
    const container = ensureToastContainer();
    const t = document.createElement('div');
    t.textContent = msg;
    t.style.background = '#111';
    t.style.color = '#fff';
    t.style.padding = '10px 12px';
    t.style.borderRadius = '6px';
    t.style.boxShadow = '0 6px 16px rgba(0,0,0,.2)';
    t.style.fontWeight = '600';
    t.style.fontSize = '0.9rem';
    container.appendChild(t);
    setTimeout(() => { t.style.transition = 'opacity .4s ease'; t.style.opacity = '0'; }, 1600);
    setTimeout(() => { t.remove(); }, 2100);
  };

  // Smooth scroll for internal anchors
  const enableSmoothScroll = () => {
    qsa('a[href^="#"]').forEach(a => {
      a.addEventListener('click', (e) => {
        const targetId = a.getAttribute('href');
        if (targetId && targetId.startsWith('#') && targetId.length > 1) {
          const el = qs(targetId);
          if (el) {
            e.preventDefault();
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      });
    });
  };


  const state = { query: '', brand: '', sort: 'popularity', searched: false };
  const getFilteredSorted = () => {
    let items = PRODUCTS.filter(p => {
      const matchesQuery = state.query ? (p.name + ' ' + p.brand).toLowerCase().includes(state.query.toLowerCase()) : true;
      const matchesBrand = state.brand ? p.brand === state.brand : true;
      return matchesQuery && matchesBrand;
    });
    switch (state.sort) {
      case 'price-asc': items.sort((a,b)=>a.price-b.price); break;
      case 'price-desc': items.sort((a,b)=>b.price-a.price); break;
      case 'name-asc': items.sort((a,b)=>a.name.localeCompare(b.name)); break;
      case 'name-desc': items.sort((a,b)=>b.name.localeCompare(a.name)); break;
      default: items.sort((a,b)=>b.popularity - a.popularity); break;
    }
    return items;
  };

  const renderProducts = () => {
    const grid = qs('#products-grid');
    const empty = qs('#empty-state');
    const countEl = qs('#results-count');
    if (!grid) return;
    // If the user hasn't searched and no filters are applied, don't render duplicates below Featured
    if (!state.searched && !state.query && !state.brand) {
      grid.innerHTML = '';
      if (empty) empty.hidden = true;
      if (countEl) countEl.textContent = '';
      return;
    }
    const items = getFilteredSorted();
    grid.innerHTML = items.map(p => `
      <article class="product" data-id="${p.id}" data-name="${p.name}" data-price="${p.price}">
        <img src="${p.img}" alt="${p.name}" height="200" />
        <h3>${p.name}</h3>
        <p>${p.brand} • ${p.movement}</p>
        ${renderStars(p.rating)}
        <p style="margin-top:4px; color:var(--muted);">${p.reviews} reviews</p>
        <p><strong>${fmtPrice(p.price)}</strong></p>
        <div class="product-actions">
          <button class="btn add-to-cart">Add to Cart</button>
          <button class="btn btn-secondary add-to-wishlist">Wishlist</button>
        </div>
      </article>
    `).join('');
    if (empty) empty.hidden = !(state.searched && items.length === 0);
    if (countEl) countEl.textContent = state.searched ? `${items.length} result${items.length===1?'':'s'}` : '';
    // attach reveal class for animation
    requestAnimationFrame(()=>{
      qsa('#products-grid .product').forEach(el => el.classList.add('reveal'));
      observeReveal();
    });
  };

  const populateBrandOptions = () => {
    const select = qs('#brand-filter');
    if (!select) return;
    const brands = Array.from(new Set(PRODUCTS.map(p=>p.brand))).sort();
    brands.forEach(b => {
      const opt = document.createElement('option');
      opt.value = b; opt.textContent = b; select.appendChild(opt);
    });
  };

  const attachCatalogEvents = () => {
    const grid = qs('#products-grid');
    if (!grid) return;
    grid.addEventListener('click', (e) => {
      const target = e.target;
      const card = target.closest('.product');
      if (!card) return;
      const id = card.dataset.id; const name = card.dataset.name; const price = Number(card.dataset.price);
      if (target.closest('.add-to-cart')) {
        const cart = readStore(CART_KEY);
        const ex = cart.find(it=>it.id===id);
        if (ex) ex.qty = (ex.qty||1)+1; else cart.push({ id, name, price, qty:1 });
        writeStore(CART_KEY, cart); updateBadges(); renderCart(); toast(`${name} added to cart`);
      } else if (target.closest('.add-to-wishlist')) {
        const wl = readStore(WISHLIST_KEY);
        if (!wl.some(it=>it.id===id)) { wl.push({ id, name }); writeStore(WISHLIST_KEY, wl); updateBadges(); toast(`${name} saved to wishlist`);} else { toast(`${name} is already in wishlist`); }
      } else {
        openProductModal(id);
      }
    });
  };


  const bindImageFallbacks = () => {
    const placeholder = (w, h) => {
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      const g = ctx.createLinearGradient(0,0,w,h);
      g.addColorStop(0,'#e5e7eb');
      g.addColorStop(1,'#d1d5db');
      ctx.fillStyle = g;
      ctx.fillRect(0,0,w,h);
      ctx.fillStyle = '#6b7280';
      ctx.font = 'bold 18px Inter, Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Image not found', w/2, h/2);
      return canvas.toDataURL('image/png');
    };

    qsa('img').forEach(img => {
      img.addEventListener('error', () => {
        const w = img.naturalWidth || img.width || 400;
        const h = img.naturalHeight || img.height || 300;
        img.src = placeholder(w, h);
      }, { once: true });
    });
  };

  // Cart drawer
  const openCart = () => {
    qs('#overlay')?.removeAttribute('hidden');
    const d = qs('#cart-drawer');
    if (d) { d.setAttribute('aria-hidden','false'); d.classList.add('open'); }
  };
  const closeCart = () => {
    qs('#overlay')?.setAttribute('hidden','');
    const d = qs('#cart-drawer');
    if (d) { d.setAttribute('aria-hidden','true'); d.classList.remove('open'); }
  };
  const renderCart = () => {
    const container = qs('#cart-items');
    const subtotalEl = qs('#cart-subtotal');
    if (!container) return;
    const cart = readStore(CART_KEY);
    if (cart.length === 0) {
      container.innerHTML = '<p>Your cart is empty.</p>';
      if (subtotalEl) subtotalEl.textContent = '$0';
      return;
    }
    const getName = id => PRODUCTS.find(p=>p.id===id)?.name || 'Item';
    const getPrice = id => PRODUCTS.find(p=>p.id===id)?.price || 0;
    let subtotal = 0;
    container.innerHTML = cart.map(item => {
      const price = getPrice(item.id); const line = price * (item.qty||1); subtotal += line;
      const name = getName(item.id);
      return `
        <div class="cart-row" data-id="${item.id}">
          <div class="cart-info">
            <strong>${name}</strong>
            <span>${fmtPrice(price)}</span>
          </div>
          <div class="cart-actions">
            <button class="qty-btn dec" aria-label="Decrease quantity">−</button>
            <span class="qty">${item.qty||1}</span>
            <button class="qty-btn inc" aria-label="Increase quantity">+</button>
            <button class="remove" aria-label="Remove">Remove</button>
          </div>
        </div>`;
    }).join('');
    if (subtotalEl) subtotalEl.textContent = fmtPrice(subtotal);

    container.onclick = (e) => {
      const row = e.target.closest('.cart-row'); if (!row) return;
      const id = row.dataset.id; let cart = readStore(CART_KEY); const idx = cart.findIndex(it=>it.id===id); if (idx<0) return;
      if (e.target.closest('.inc')) { cart[idx].qty = (cart[idx].qty||1)+1; }
      else if (e.target.closest('.dec')) { cart[idx].qty = Math.max(1, (cart[idx].qty||1)-1); }
      else if (e.target.closest('.remove')) { cart.splice(idx,1); }
      writeStore(CART_KEY, cart); updateBadges(); renderCart();
    };
  };

 
  const openWishlist = () => {
    const m = qs('#wishlist-modal'); if (!m) return; m.removeAttribute('hidden'); m.setAttribute('aria-hidden','false'); m.classList.add('open'); renderWishlist();
  };
  const closeWishlist = () => {
    const m = qs('#wishlist-modal'); if (!m) return; m.setAttribute('hidden',''); m.setAttribute('aria-hidden','true'); m.classList.remove('open');
  };
  const renderWishlist = () => {
    const c = qs('#wishlist-items'); if (!c) return; const wl = readStore(WISHLIST_KEY);
    if (wl.length===0) { c.innerHTML = '<p>Your wishlist is empty.</p>'; return; }
    c.innerHTML = wl.map(it => {
      const p = PRODUCTS.find(p=>p.id===it.id) || { name: it.name, price: 0 };
      return `
        <div class="wish-row" data-id="${it.id}">
          <div class="wish-info">
            <strong>${p.name}</strong>
            ${p.price?`<span>${fmtPrice(p.price)}</span>`:''}
          </div>
          <div class="wish-actions">
            <button class="btn btn-secondary move-to-cart">Add to Cart</button>
            <button class="link remove">Remove</button>
          </div>
        </div>`;
    }).join('');
    c.onclick = (e) => {
      const row = e.target.closest('.wish-row'); if (!row) return; const id = row.dataset.id; let wl = readStore(WISHLIST_KEY);
      if (e.target.closest('.remove')) { wl = wl.filter(x=>x.id!==id); writeStore(WISHLIST_KEY, wl); updateBadges(); renderWishlist(); }
      else if (e.target.closest('.move-to-cart')) {
        const p = PRODUCTS.find(p=>p.id===id); if (!p) return; const cart = readStore(CART_KEY); const ex = cart.find(it=>it.id===id);
        if (ex) ex.qty=(ex.qty||1)+1; else cart.push({ id: p.id, name: p.name, price: p.price, qty:1 });
        writeStore(CART_KEY, cart); toast(`${p.name} added to cart`); updateBadges(); renderCart();
      }
    };
  };

  const openProductModal = (id) => {
    const p = PRODUCTS.find(p=>p.id===id); if (!p) return;
    const m = qs('#product-modal'); const title = qs('#product-modal-title'); const body = qs('#product-modal-body');
    if (!m || !title || !body) return;
    title.textContent = p.name;
    body.innerHTML = `
      <div class="prod-detail">
        <img src="${p.img}" alt="${p.name}" class="prod-detail-img"/>
        <div class="prod-detail-info">
          <p><strong>Brand:</strong> ${p.brand}</p>
          <p><strong>Movement:</strong> ${p.movement}</p>
          <p><strong>Price:</strong> ${fmtPrice(p.price)}</p>
          <div class="product-actions">
            <button class="btn add-to-cart" data-id="${p.id}">Add to Cart</button>
            <button class="btn btn-secondary add-to-wishlist" data-id="${p.id}">Wishlist</button>
          </div>
        </div>
      </div>`;
    m.removeAttribute('hidden'); m.setAttribute('aria-hidden','false'); m.classList.add('open');
    body.onclick = (e) => {
      const id = e.target.getAttribute('data-id'); if (!id) return;
      if (e.target.closest('.add-to-cart')) {
        const p = PRODUCTS.find(p=>p.id===id); const cart = readStore(CART_KEY); const ex = cart.find(it=>it.id===id);
        if (ex) ex.qty=(ex.qty||1)+1; else cart.push({ id: p.id, name: p.name, price: p.price, qty:1 });
        writeStore(CART_KEY, cart); updateBadges(); renderCart(); toast(`${p.name} added to cart`);
      } else if (e.target.closest('.add-to-wishlist')) {
        const p = PRODUCTS.find(p=>p.id===id); const wl = readStore(WISHLIST_KEY);
        if (!wl.some(it=>it.id===id)) { wl.push({ id: p.id, name: p.name }); writeStore(WISHLIST_KEY, wl); updateBadges(); toast(`${p.name} saved to wishlist`); }
      }
    };
  };
  const closeProductModal = () => {
    const m = qs('#product-modal'); if (!m) return; m.setAttribute('hidden',''); m.setAttribute('aria-hidden','true'); m.classList.remove('open');
  };

  // Init
  document.addEventListener('DOMContentLoaded', () => {
    updateBadges();
    enableSmoothScroll();
    bindImageFallbacks();

    populateBrandOptions();
  
    renderSkeletons(6);
    setTimeout(() => { renderProducts(); }, 450);
    attachCatalogEventsTo('#products-grid');
    renderFeatured();
    attachCatalogEventsTo('#featured-grid');

    qs('#search-input')?.addEventListener('input', ()=>{ state.searched = false; updateSuggestions(); });
    qs('#search-input')?.addEventListener('keydown', (e)=>{ if (e.key==='Enter'){ e.preventDefault(); performSearch(); }});
    qs('#search-btn')?.addEventListener('click', (e)=>{ e.preventDefault(); performSearch(); });
    const sugg = qs('#search-suggestions');
    sugg?.addEventListener('click', (e)=>{
      const item = e.target.closest('.suggestion-item'); if (!item) return;
      const name = item.dataset.name; const input = qs('#search-input'); if (input){ input.value = name; }
      performSearch();
    });
    document.addEventListener('click', (e)=>{
      const group = e.target.closest?.('.search-group'); const box = qs('#search-suggestions');
      if (!group && box){ box.hidden = true; }
    });
    qs('#brand-filter')?.addEventListener('change', (e)=>{ state.brand = e.target.value; renderProducts(); });
    qs('#sort-select')?.addEventListener('change', (e)=>{ state.sort = e.target.value; renderProducts(); });

    const cartIcon = document.querySelector('.actions a[title="Cart"]');
    const wishIcon = document.querySelector('.actions a[title="Wishlist"]');
    cartIcon?.addEventListener('click', (e)=>{ e.preventDefault(); renderCart(); openCart(); });
    wishIcon?.addEventListener('click', (e)=>{ e.preventDefault(); openWishlist(); });

    qs('#close-cart')?.addEventListener('click', closeCart);
    qs('#clear-cart')?.addEventListener('click', ()=>{ writeStore(CART_KEY, []); updateBadges(); renderCart(); });
    qs('#checkout')?.addEventListener('click', ()=>{ toast('Checkout is not implemented in this demo'); });
    qs('#overlay')?.addEventListener('click', closeCart);
    document.addEventListener('keydown', (e)=>{ if (e.key==='Escape'){ closeCart(); closeWishlist(); closeProductModal(); }});

    initTheme();
    initHeroParallax();
    observeReveal();

    qsa('#wishlist-modal .modal-close').forEach(btn=> btn.addEventListener('click', closeWishlist));
    qs('#wishlist-modal .icon-close')?.addEventListener('click', closeWishlist);
    // Product modal controls
    qsa('#product-modal .modal-close').forEach(btn=> btn.addEventListener('click', closeProductModal));
    qs('#product-modal .icon-close')?.addEventListener('click', closeProductModal);
  });
})();
