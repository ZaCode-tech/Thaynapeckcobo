(function () {
  'use strict';
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fino = matchMedia('(hover: hover) and (pointer: fine)').matches && !reduce;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return [].slice.call((c || document).querySelectorAll(s)); };

  // Fotos mostradas se a lista automática da pasta img não puder ser lida
  var PADRAO = ['img/1.jpg', 'img/2.jpg', 'img/3.jpg', 'img/4.jpg', 'img/07.JPG'];
  // Categorias do portfólio, pelo número da foto. Também funciona pelo nome: palco-12.jpg, editorial-13.jpg, social-14.jpg
  var CATEGORIAS = { palco: [1, 2, 3, 4, 5, 7], editorial: [6], social: [] };
  var RESERVADOS = /^(favicon|logo|brush|thayna|hero|her[oó]i)/i;

  $('#ano').textContent = new Date().getFullYear();

  // ---------- tema claro / escuro (círculo que se expande a partir do botão) ----------
  var raiz = document.documentElement, btnTema = $('.tema'), metaTema = $('meta[name=theme-color]');
  function pintar(t) {
    raiz.dataset.theme = t; metaTema.content = t === 'light' ? '#fcf9f5' : '#0a0a0a';
    btnTema.setAttribute('aria-label', t === 'light' ? 'Mudar para tema escuro' : 'Mudar para tema claro');
  }
  pintar(raiz.dataset.theme === 'light' ? 'light' : 'dark');
  function trocar(t) { pintar(t); try { localStorage.setItem('tema', t); } catch (e) {} }
  btnTema.addEventListener('click', function () {
    var novo = raiz.dataset.theme === 'light' ? 'dark' : 'light';
    if (!document.startViewTransition || reduce) { trocar(novo); return; }
    var r = btnTema.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
    var raio = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    var vt = document.startViewTransition(function () { trocar(novo); });
    vt.ready.then(function () {
      raiz.animate({ clipPath: ['circle(0px at ' + x + 'px ' + y + 'px)', 'circle(' + raio + 'px at ' + x + 'px ' + y + 'px)'] },
        { duration: 800, easing: 'cubic-bezier(.7,0,.2,1)', pseudoElement: '::view-transition-new(root)' });
    }).catch(function () {});
  });

  // ---------- títulos palavra por palavra ----------
  $$('[data-split]').forEach(function (el) {
    var t = el.textContent.trim(), n = 0;
    el.setAttribute('aria-label', t);
    el.innerHTML = t.split(/\s+/).map(function (w) { return '<span class="w" aria-hidden="true"><i style="--i:' + (n++) + '">' + w + '</i></span>'; }).join(' ');
  });

  // ---------- revelar ao rolar ----------
  var io = new IntersectionObserver(function (items) {
    items.forEach(function (it) {
      if (!it.isIntersecting) return;
      it.target.classList.add('in');
      $$('[data-count]', it.target).forEach(contar);
      io.unobserve(it.target);
    });
  }, { threshold: 0.15 });
  function ver(el) { io.observe(el); }
  $$('.rv,.rvi,[data-split],.steps li').forEach(ver);

  function contar(el) {
    var fim = +el.dataset.count, pre = el.dataset.prefix || '', t0 = null;
    if (reduce) { el.textContent = pre + fim.toLocaleString('pt-BR'); return; }
    (function passo(t) {
      t0 = t0 || t;
      var p = Math.min((t - t0) / 1600, 1);
      el.textContent = pre + Math.round(fim * (1 - Math.pow(1 - p, 3))).toLocaleString('pt-BR');
      if (p < 1) requestAnimationFrame(passo);
    })(performance.now());
  }

  // ---------- rolagem: cabeçalho, barra de progresso, parallax ----------
  var top = $('#top'), barra = $('#pg'), par = $('[data-parallax]'), tick = false;
  function rolar() {
    var y = window.scrollY, h = document.documentElement.scrollHeight - innerHeight;
    top.classList.toggle('solid', y > 60);
    barra.style.transform = 'scaleX(' + (h > 0 ? y / h : 0) + ')';
    if (par && !reduce && y < innerHeight) par.style.transform = 'translateY(' + y * 0.06 + 'px) scale(' + (1 + y * 0.0002) + ')';
    tick = false;
  }
  addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(rolar); } }, { passive: true });
  rolar();

  // ---------- menu ----------
  var burger = $('.burger'), menu = $('#menu');
  function abrirMenu(o) {
    document.body.classList.toggle('menu-open', o);
    burger.setAttribute('aria-expanded', o); burger.setAttribute('aria-label', o ? 'Fechar menu' : 'Abrir menu');
    menu.inert = !o;
  }
  burger.addEventListener('click', function () { abrirMenu(!document.body.classList.contains('menu-open')); });
  $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { abrirMenu(false); }); });

  // ---------- serviços (sanfona) ----------
  $$('.acc-item').forEach(function (it) {
    $('.acc-h', it).addEventListener('click', function () {
      var abrir = !it.classList.contains('open');
      $$('.acc-item').forEach(function (o) { o.classList.remove('open'); $('.acc-h', o).setAttribute('aria-expanded', 'false'); });
      if (abrir) { it.classList.add('open'); $('.acc-h', it).setAttribute('aria-expanded', 'true'); }
    });
  });

  // ---------- agenda: contagem regressiva, datas passadas somem ----------
  var vivos = 0;
  $$('[data-date]').forEach(function (li) {
    var p = li.dataset.date.split('-'), d = new Date(+p[0], p[1] - 1, +p[2]), h = new Date();
    h.setHours(0, 0, 0, 0);
    var n = Math.round((d - h) / 864e5);
    if (n < 0) { li.hidden = true; return; }
    vivos++;
    $('.dias', li).textContent = n === 0 ? 'é hoje' : 'faltam ' + n + (n === 1 ? ' dia' : ' dias');
  });
  if (!vivos) $('.vazio').hidden = false;

  // ---------- efeitos de ponteiro (spotlight, ímã, cursor, brilho do hero) ----------
  $$('.spot').forEach(function (el) {
    el.addEventListener('pointermove', function (e) {
      var r = el.getBoundingClientRect();
      el.style.setProperty('--mx', (e.clientX - r.left) + 'px'); el.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });
  var hero = $('.hero');
  hero.addEventListener('pointermove', function (e) {
    var r = hero.getBoundingClientRect();
    hero.style.setProperty('--gx', (e.clientX - r.left) + 'px'); hero.style.setProperty('--gy', (e.clientY - r.top) + 'px');
  });
  if (fino) {
    $$('[data-mag]').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.transform = 'translate(' + (e.clientX - r.left - r.width / 2) * 0.22 + 'px,' + (e.clientY - r.top - r.height / 2) * 0.32 + 'px)';
      });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; });
    });
    var c = $('.cursor'), x = 0, y = 0, cx = 0, cy = 0;
    addEventListener('pointermove', function (e) {
      x = e.clientX; y = e.clientY; c.classList.add('on');
      c.classList.toggle('big', !!e.target.closest('a,button,figure'));
    });
    (function seguir() { cx += (x - cx) * 0.18; cy += (y - cy) * 0.18; c.style.transform = 'translate(' + cx + 'px,' + cy + 'px)'; requestAnimationFrame(seguir); })();
  }

  // ---------- imagens com nomes alternativos (usa a primeira que existir) ----------
  $$('[data-imgs]').forEach(function (el) {
    var lista = el.dataset.imgs.split('|');
    (function tentar(i) {
      if (i >= lista.length) return;
      var im = new Image();
      im.onload = function () { el.style.setProperty('--img', 'url("' + encodeURI(lista[i]) + '")'); };
      im.onerror = function () { tentar(i + 1); };
      im.src = encodeURI(lista[i]);
    })(0);
  });

  // ---------- portfólio automático ----------
  // Lê a raiz do repositório e a pasta img (GitHub Pages). Foto nova enviada aparece sozinha.
  var grade = $('#grid');
  function natural(a, b) { return a.localeCompare(b, 'pt', { numeric: true }); }
  function ehImagem(n) { return /\.(jpe?g|png|webp|avif)$/i.test(n); }

  function listar() {
    var h = location.hostname, seg = location.pathname.split('/')[1] || '';
    if (!/\.github\.io$/.test(h)) return Promise.reject();
    var user = h.split('.')[0], repo = seg && seg.indexOf('.') < 0 ? seg : h;
    try { var c = sessionStorage.getItem('fotos3'); if (c) return Promise.resolve(JSON.parse(c)); } catch (e) {}
    function pasta(p) {
      return fetch('https://api.github.com/repos/' + user + '/' + repo + '/contents/' + p)
        .then(function (r) { return r.ok ? r.json() : []; }).catch(function () { return []; });
    }
    return Promise.all([pasta(''), pasta('img')]).then(function (r) {
      var ach = r[0].concat(r[1]).filter(function (i) { return i.type === 'file' && ehImagem(i.name) && !RESERVADOS.test(i.name); });
      ach.sort(function (a, b) { return natural(a.name, b.name); });
      var cam = ach.map(function (i) { return i.path; });
      if (!cam.length) throw 0;
      try { sessionStorage.setItem('fotos3', JSON.stringify(cam)); } catch (e) {}
      return cam;
    });
  }

  function categoria(p) {
    var nome = decodeURIComponent(p.split('/').pop()), m = nome.match(/^(palco|editorial|social)/i);
    if (m) return m[1].toLowerCase();
    var n = parseInt(nome, 10);
    for (var k in CATEGORIAS) if (CATEGORIAS[k].indexOf(n) > -1) return k;
    return '';
  }
  var aviso = document.createElement('p');
  aviso.className = 'vazio';
  aviso.textContent = 'As fotos ainda estão carregando ou não foram encontradas. Confira se estão na pasta img do repositório e atualize a página.';
  setTimeout(function () { if (!figuras().some(function (f) { return f.classList.contains('ok'); })) grade.insertAdjacentElement('afterend', aviso); }, 8000);
  function figuras() { return $$('figure', grade); }
  function visiveis() { return figuras().filter(function (f) { return !f.hidden; }); }

  function montar(caminhos) {
    grade.textContent = '';
    caminhos.forEach(function (p, i) {
      var f = document.createElement('figure'), im = new Image();
      f.className = 'rvi'; f.dataset.cat = categoria(p); f.tabIndex = 0;
      f.setAttribute('role', 'button'); f.setAttribute('aria-label', 'Ampliar foto ' + (i + 1));
      f.style.viewTransitionName = 'f' + i;
      im.src = encodeURI(p); im.loading = 'lazy'; im.decoding = 'async';
      im.alt = 'Maquiagem por Thayná Cobo, foto ' + (i + 1);
      im.onload = function () { f.classList.add('ok'); aviso.remove(); };
      im.onerror = function () { console.warn('Foto não encontrada:', p); f.remove(); };
      f.appendChild(im);
      f.addEventListener('click', function () { abrir(f); });
      f.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrir(f); } });
      grade.appendChild(f); ver(f);
    });
    $$('.chip[data-f]').forEach(function (b) {
      if (b.dataset.f && !figuras().some(function (f) { return f.dataset.cat === b.dataset.f; })) b.hidden = true;
    });
  }
  listar().catch(function () { return PADRAO; }).then(montar);

  $$('.chip').forEach(function (b) {
    b.addEventListener('click', function () {
      var cat = b.dataset.f;
      $$('.chip').forEach(function (o) { o.setAttribute('aria-pressed', o === b); });
      var aplicar = function () { figuras().forEach(function (f) { f.hidden = !!cat && f.dataset.cat !== cat; }); };
      if (document.startViewTransition && !reduce) document.startViewTransition(aplicar); else aplicar();
    });
  });

  // ---------- lightbox ----------
  var lb = $('#lb'), grande = $('img', lb), lista = [], atual = 0, volta = null;
  function mostrar(i) { atual = (i + lista.length) % lista.length; grande.src = $('img', lista[atual]).src; }
  function abrir(f) { volta = document.activeElement; lista = visiveis(); mostrar(lista.indexOf(f)); lb.hidden = false; $('.lb-x', lb).focus(); }
  function fechar() { lb.hidden = true; if (volta) volta.focus(); }
  $('.lb-x', lb).addEventListener('click', fechar);
  $('.lb-prev', lb).addEventListener('click', function (e) { e.stopPropagation(); mostrar(atual - 1); });
  $('.lb-next', lb).addEventListener('click', function (e) { e.stopPropagation(); mostrar(atual + 1); });
  lb.addEventListener('click', function (e) { if (e.target === lb || e.target === grande) fechar(); });
  addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { if (!lb.hidden) fechar(); else abrirMenu(false); }
    if (lb.hidden) return;
    if (e.key === 'ArrowLeft') mostrar(atual - 1);
    if (e.key === 'ArrowRight') mostrar(atual + 1);
  });
})();
