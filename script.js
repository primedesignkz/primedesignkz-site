/* Prime Design — Bento Box interactions */

(function () {
  'use strict';

  // ===== Nav scroll state + scroll progress bar =====
  const nav = document.getElementById('nav');
  const progressBar = document.querySelector('.scroll-progress__bar');
  const onScroll = () => {
    const y = window.scrollY;
    if (nav) {
      if (y > 24) nav.classList.add('is-scrolled');
      else nav.classList.remove('is-scrolled');
    }
    if (progressBar) {
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docH > 0 ? Math.min(100, (y / docH) * 100) : 0;
      progressBar.style.width = pct + '%';
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ===== Mobile burger =====
  const burger = document.getElementById('burger');
  if (burger) {
    burger.addEventListener('click', () => {
      const menu = document.querySelector('.nav__menu');
      if (!menu) return;
      const open = menu.style.display === 'flex';
      menu.style.cssText = open
        ? ''
        : 'display:flex;position:absolute;top:64px;left:16px;right:16px;flex-direction:column;background:var(--surface);padding:24px;border-radius:22px;border:1px solid var(--line);gap:14px;box-shadow:0 24px 48px -16px rgba(0,39,92,0.18);';
    });
  }

  // ===== Counter animation =====
  const counters = document.querySelectorAll('[data-count]');
  const animateCounter = (el) => {
    const target = parseInt(el.dataset.count, 10);
    if (Number.isNaN(target)) return;
    const duration = 1600;
    const startTime = performance.now();
    const easeOut = (t) => 1 - Math.pow(1 - t, 3);
    const tick = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const value = Math.round(target * easeOut(progress));
      el.textContent = value.toLocaleString('ru-RU');
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  // ===== Reveal on scroll + counters =====
  const revealSelectors = [
    '.sec-head',
    '.cell',
    '.bigstat',
  ];
  const revealEls = document.querySelectorAll(revealSelectors.join(','));
  revealEls.forEach((el, i) => {
    el.classList.add('reveal');
    const d = i % 4;
    if (d) el.dataset.delay = String(d);
  });

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.10, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach((el) => io.observe(el));

    const counterIO = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterIO.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach((c) => counterIO.observe(c));
  } else {
    counters.forEach(animateCounter);
    revealEls.forEach((el) => el.classList.add('is-in'));
  }

  // ===== Project filter =====
  const filterButtons = document.querySelectorAll('.filter__btn');
  const projects = document.querySelectorAll('.proj');
  filterButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.dataset.filter;
      projects.forEach((p) => {
        const cats = (p.dataset.cat || '').split(/\s+/).filter(Boolean);
        const match = cat === 'all' || cats.includes(cat);
        p.hidden = !match;
      });
    });
  });

  // ===== Smooth anchor scroll with nav offset =====
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length <= 1) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - 70;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  // ===== Contact form =====
  const form = document.getElementById('contact-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const success = document.getElementById('form-success');
      if (success) {
        success.hidden = false;
        success.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      form.reset();
      setTimeout(() => { if (success) success.hidden = true; }, 6000);
    });
  }

  // ===== Modal: КП Опросник =====
  const modal = document.getElementById('modal-kp');
  const kpForm = document.getElementById('kp-form');
  const kpProgress = document.getElementById('kp-progress');
  const kpSuccess = document.getElementById('kp-success');
  const kpFallback = document.getElementById('kp-fallback');
  let lastFocused = null;

  const openModal = () => {
    if (!modal) return;
    lastFocused = document.activeElement;
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    const firstInput = modal.querySelector('input, select, textarea, button');
    if (firstInput) setTimeout(() => firstInput.focus(), 80);
  };
  const closeModal = () => {
    if (!modal) return;
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    if (lastFocused) lastFocused.focus();
  };

  document.querySelectorAll('[data-open-modal="kp"]').forEach((btn) => {
    btn.addEventListener('click', openModal);
  });
  document.querySelectorAll('[data-close-modal]').forEach((btn) => {
    btn.addEventListener('click', closeModal);
  });
  // Auto-open modal when arriving via /#kp (from landing pages)
  if (modal && (window.location.hash === '#kp' || window.location.hash === '#kp-form')) {
    setTimeout(openModal, 200);
    history.replaceState(null, '', window.location.pathname + window.location.search);
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && modal.getAttribute('aria-hidden') === 'false') closeModal();
  });

  // Progress bar — counts filled fields
  const updateProgress = () => {
    if (!kpForm || !kpProgress) return;
    const fields = kpForm.querySelectorAll('input, select, textarea');
    const radios = new Set();
    let filled = 0;
    let total = 0;
    fields.forEach((f) => {
      if (f.type === 'radio') {
        if (radios.has(f.name)) return;
        radios.add(f.name);
        total++;
        const checked = kpForm.querySelector(`input[name="${f.name}"]:checked`);
        if (checked) filled++;
      } else if (f.type === 'checkbox') {
        total++;
        if (f.checked) filled++;
      } else {
        total++;
        if (f.value.trim()) filled++;
      }
    });
    const pct = Math.round((filled / total) * 100);
    kpProgress.style.width = pct + '%';
  };
  if (kpForm) {
    kpForm.addEventListener('input', updateProgress);
    kpForm.addEventListener('change', updateProgress);
  }

  // Format submission body
  const buildEmailBody = (data) => {
    const get = (k) => (data[k] || '—').toString().trim() || '—';
    const lines = [
      'ОПРОСНЫЙ ЛИСТ ДЛЯ РАСЧЁТА КП — Prime Design',
      '═════════════════════════════════════════════',
      '',
      '1. ЗАКАЗЧИК И ОБЪЕКТ',
      '─────────────────────',
      'Объект:           ' + get('objectName'),
      'Местоположение:   ' + get('location'),
      'Компания:         ' + get('company'),
      'Контакт (ФИО):    ' + get('contactName'),
      'Должность:        ' + get('position'),
      'Телефон:          ' + get('phone'),
      'E-mail:           ' + get('email'),
      '',
      '2. ТЕХНИЧЕСКОЕ ЗАДАНИЕ',
      '─────────────────────',
      'Тип объекта:      ' + get('objectType'),
      'Назначение:       ' + get('purpose'),
      'Этажность:        ' + get('floors'),
      'Площадь, м²:      ' + get('area'),
      'Этапность:        ' + get('stages'),
      '',
      '3. ЗЕМЕЛЬНЫЙ УЧАСТОК',
      '─────────────────────',
      'Право:            ' + get('landRight'),
      'Кадастр. номер:   ' + get('cadastralNumber'),
      'Площадь участка:  ' + get('plotArea'),
      'ГПЗУ:             ' + get('gpzu'),
      '',
      '4. ОПИСАНИЕ ПРОЕКТА',
      '─────────────────────',
      get('description'),
      '',
      '5. ИСХОДНЫЕ ДАННЫЕ',
      '─────────────────────',
      'Топосъёмка:       ' + get('topo'),
      'Геология:         ' + get('geo'),
      'Доп. данные:      ' + get('sourceData'),
      '',
      '6. ПРОЕКТИРОВАНИЕ',
      '─────────────────────',
      'Стадия:           ' + get('stage'),
      'BIM:              ' + get('bim'),
      'Конструктив:      ' + get('construction'),
      'Авт. надзор:      ' + get('supervision'),
      'Сроки:            ' + get('deadline'),
      '',
      '─────────────────────',
      'Отправлено с сайта primedesign.kz',
    ];
    return lines.join('\n');
  };

  if (kpForm) {
    kpForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Validate required fields
      const required = kpForm.querySelectorAll('[required]');
      let firstInvalid = null;
      required.forEach((f) => {
        if (f.type === 'checkbox') {
          if (!f.checked) {
            f.classList.add('invalid');
            if (!firstInvalid) firstInvalid = f;
          } else f.classList.remove('invalid');
        } else if (!f.value.trim()) {
          f.classList.add('invalid');
          if (!firstInvalid) firstInvalid = f;
        } else {
          f.classList.remove('invalid');
        }
      });
      if (firstInvalid) {
        firstInvalid.focus();
        firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      // Collect form data
      const formData = new FormData(kpForm);
      const data = {};
      formData.forEach((v, k) => { data[k] = v; });

      // Honeypot check — if bot filled it, silently drop
      if (data._honey) return;

      const body = buildEmailBody(data);
      const subject = `КП — ${data.objectName || 'объект'} (${data.company || 'клиент'})`;

      // Human-friendly Russian field labels for FormSubmit table view
      const payload = {
        _subject: subject,
        _template: 'table',
        _captcha: 'false',
        _replyto: data.email || '',
        'Наименование объекта':      data.objectName || '—',
        'Местоположение':            data.location || '—',
        'Компания-заказчик':         data.company || '—',
        'Контактное лицо (ФИО)':     data.contactName || '—',
        'Должность':                 data.position || '—',
        'Телефон':                   data.phone || '—',
        'E-mail':                    data.email || '—',
        'Тип объекта':               data.objectType || '—',
        'Назначение объекта':        data.purpose || '—',
        'Этажность':                 data.floors || '—',
        'Общая площадь, м²':         data.area || '—',
        'Этапность строительства':   data.stages || '—',
        'Право на участок':          data.landRight || '—',
        'Кадастровый номер':         data.cadastralNumber || '—',
        'Площадь участка, м²':       data.plotArea || '—',
        'Наличие ГПЗУ':              data.gpzu || '—',
        'Описание проекта':          data.description || '—',
        'Топосъёмка':                data.topo || '—',
        'Инженерно-геологические':   data.geo || '—',
        'Дополнительные исх. данные': data.sourceData || '—',
        'Стадия проектирования':     data.stage || '—',
        'Требуется BIM':             data.bim || '—',
        'Конструктив':               data.construction || '—',
        'Авторский надзор':          data.supervision || '—',
        'Ожидаемые сроки':           data.deadline || '—',
        '_source':                   'primedesign.kz · опросный лист',
      };

      // Show sending state
      const submitBtn = kpForm.querySelector('button[type="submit"]');
      const submitOriginal = submitBtn ? submitBtn.innerHTML : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Отправляем…';
      }

      const endpoint = kpForm.dataset.endpoint;
      let sent = false;
      let httpError = null;

      let activationPending = false;
      if (endpoint) {
        try {
          const res = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify(payload),
          });
          const json = await res.json().catch(() => ({}));
          if (res.ok) {
            // FormSubmit returns 200 in two cases:
            // 1) success === true → email delivered
            // 2) success === 'false' + activation message → first-time endpoint activation pending
            if (json.success === true || json.success === 'true') {
              sent = true;
            } else if (json.message && /activat/i.test(json.message)) {
              activationPending = true;
            } else {
              httpError = json.message || 'сервер отклонил заявку';
            }
          } else {
            httpError = `HTTP ${res.status}`;
          }
        } catch (err) {
          httpError = err && err.message ? err.message : 'сеть недоступна';
        }
      }

      // Restore submit button
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = submitOriginal;
      }

      if (sent) {
        // Success — email delivered via FormSubmit
        if (kpSuccess) {
          kpSuccess.innerHTML = '<strong>Опросный лист отправлен.</strong> Ответ на&nbsp;<b>contact@primedesign.kz</b> в&nbsp;течение 2&nbsp;рабочих&nbsp;дней.';
          kpSuccess.hidden = false;
        }
        if (kpFallback) kpFallback.hidden = true;
        kpForm.reset();
        if (kpProgress) kpProgress.style.width = '0%';
      } else if (activationPending) {
        // First-time activation: FormSubmit sent activation letter to Prime Design
        if (kpSuccess) {
          kpSuccess.innerHTML = '<strong>Заявка получена.</strong> Первичная активация формы&nbsp;— в&nbsp;почтовом ящике <b>contact@primedesign.kz</b> сейчас лежит письмо со&nbsp;ссылкой активации от&nbsp;FormSubmit.co. После&nbsp;однократного клика по&nbsp;ней все&nbsp;последующие заявки будут приходить автоматически.';
          kpSuccess.hidden = false;
        }
        if (kpFallback) kpFallback.hidden = true;
        kpForm.reset();
        if (kpProgress) kpProgress.style.width = '0%';
      } else {
        // Fallback: open user's mail client via mailto:
        const mailto = 'mailto:contact@primedesign.kz?subject=' +
          encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
        try { window.location.href = mailto; } catch (_) {}
        if (kpSuccess) kpSuccess.hidden = true;
        if (kpFallback) kpFallback.hidden = false;
        console.warn('[Prime Design] отправка через backend не удалась:', httpError);
      }

      // Setup copy-to-clipboard
      const copyBtn = document.getElementById('kp-copy');
      if (copyBtn) {
        copyBtn.onclick = async () => {
          try {
            await navigator.clipboard.writeText(body);
            copyBtn.textContent = '✓ Скопировано';
            setTimeout(() => { copyBtn.textContent = 'скопировать ответы в буфер'; }, 2400);
          } catch (_) {
            // Old fallback
            const ta = document.createElement('textarea');
            ta.value = body;
            document.body.appendChild(ta);
            ta.select();
            try { document.execCommand('copy'); copyBtn.textContent = '✓ Скопировано'; } catch (_) {}
            document.body.removeChild(ta);
          }
        };
      }

      kpSuccess.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    // Remove invalid state on input
    kpForm.addEventListener('input', (e) => {
      const t = e.target;
      if (t.classList && t.classList.contains('invalid')) t.classList.remove('invalid');
    });
  }

  // ===== GTM DataLayer event tracking =====
  window.dataLayer = window.dataLayer || [];
  const trackEvent = (event, params) => {
    window.dataLayer.push({ event, ...params });
  };
  // Track: CTA click "Опросный лист"
  document.querySelectorAll('[data-open-modal="kp"], a[href*="#kp"]').forEach(el => {
    el.addEventListener('click', () => trackEvent('cta_kp_open', { cta_location: el.closest('section, header, footer')?.className || 'unknown' }));
  });
  // Track: WhatsApp click
  document.querySelectorAll('a[href*="wa.me"]').forEach(el => {
    el.addEventListener('click', () => trackEvent('contact_whatsapp', {}));
  });
  // Track: Phone click
  document.querySelectorAll('a[href^="tel:"]').forEach(el => {
    el.addEventListener('click', () => trackEvent('contact_phone', {}));
  });
  // Track: Email click
  document.querySelectorAll('a[href^="mailto:"]').forEach(el => {
    el.addEventListener('click', () => trackEvent('contact_email', {}));
  });
  // Track: KP form successful submit — hook into existing form logic
  const kpFormEl = document.getElementById('kp-form');
  if (kpFormEl) {
    kpFormEl.addEventListener('submit', () => trackEvent('kp_form_submit', {}));
  }
  // Track: language switch
  document.querySelectorAll('.nav__lang-menu a').forEach(el => {
    el.addEventListener('click', () => trackEvent('language_switch', { target_lang: el.getAttribute('href').replace(/\//g, '') || 'ru' }));
  });

  // ===== Language switcher dropdown =====
  const langBox = document.querySelector('.nav__lang');
  if (langBox) {
    const btn = langBox.querySelector('.nav__lang-btn');
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      langBox.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', langBox.classList.contains('is-open') ? 'true' : 'false');
    });
    document.addEventListener('click', (e) => {
      if (!langBox.contains(e.target)) {
        langBox.classList.remove('is-open');
        btn.setAttribute('aria-expanded', 'false');
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && langBox.classList.contains('is-open')) {
        langBox.classList.remove('is-open');
        btn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // ===== Center geo-map on Astana initially (mobile) =====
  const geoViz = document.querySelector('.geo-map__viz');
  if (geoViz) {
    const centerGeo = () => {
      requestAnimationFrame(() => {
        const target = geoViz.scrollWidth * (673.9 / 1200) - geoViz.clientWidth / 2;
        geoViz.scrollLeft = Math.max(0, target);
      });
    };
    const img = geoViz.querySelector('img');
    if (img) {
      if (img.complete) centerGeo();
      else img.addEventListener('load', centerGeo, { once: true });
    }
    window.addEventListener('load', centerGeo, { once: true });
    window.addEventListener('resize', () => {
      clearTimeout(window.__geoCenterT);
      window.__geoCenterT = setTimeout(centerGeo, 100);
    });
  }

  // =====================================================================
  // HERO 3D WIREFRAME — Industrial plant, CAD-style, auto-rotate + build up
  // =====================================================================
  const canvas = document.getElementById('hero-3d');
  if (canvas && canvas.getContext) {
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0, H = 0;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      W = rect.width; H = rect.height;
      if (W > 0 && H > 0) {
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
    };
    resize();
    // ResizeObserver ensures canvas sizes when layout finalizes
    if (window.ResizeObserver) {
      const ro = new ResizeObserver(resize);
      ro.observe(canvas);
    }
    window.addEventListener('resize', () => { requestAnimationFrame(resize); });
    window.addEventListener('load', resize);

    // --- MODEL: industrial plant as vertices + edges ---
    // Coordinate system: X right, Y up, Z toward viewer
    // Units are relative (will be scaled by projection)

    // Helper to create a box: returns [vertices, edges] offset by [cx,cy,cz]
    const box = (cx, cy, cz, w, h, d) => {
      const hx=w/2, hy=h/2, hz=d/2;
      const v = [
        [cx-hx, cy-hy, cz-hz],[cx+hx, cy-hy, cz-hz],[cx+hx, cy+hy, cz-hz],[cx-hx, cy+hy, cz-hz],
        [cx-hx, cy-hy, cz+hz],[cx+hx, cy-hy, cz+hz],[cx+hx, cy+hy, cz+hz],[cx-hx, cy+hy, cz+hz],
      ];
      const e = [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];
      return { v, e };
    };

    // Cylinder wireframe (n segments, m rings for detail)
    const cyl = (cx, cy, cz, r, h, n, hasRings) => {
      const v = [], e = [];
      const hy = h/2;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        v.push([cx + Math.cos(a)*r, cy - hy, cz + Math.sin(a)*r]); // bottom
        v.push([cx + Math.cos(a)*r, cy + hy, cz + Math.sin(a)*r]); // top
      }
      for (let i = 0; i < n; i++) {
        const j = (i+1) % n;
        e.push([i*2, j*2]);         // bottom ring
        e.push([i*2+1, j*2+1]);     // top ring
        e.push([i*2, i*2+1]);       // vertical
      }
      // Optional middle rings (banded look for tanks)
      if (hasRings) {
        for (let ring = 1; ring <= 2; ring++) {
          const yy = cy - hy + (h * ring / 3);
          const base = v.length;
          for (let i = 0; i < n; i++) {
            const a = (i / n) * Math.PI * 2;
            v.push([cx + Math.cos(a)*r, yy, cz + Math.sin(a)*r]);
          }
          for (let i = 0; i < n; i++) {
            const j = (i+1) % n;
            e.push([base+i, base+j]);
          }
        }
      }
      return { v, e };
    };

    // Truss (лестничная ферма для крыши / крана)
    const truss = (x1, y1, z1, x2, y2, z2, height, segments) => {
      const v = [], e = [];
      const dx=(x2-x1)/segments, dy=(y2-y1)/segments, dz=(z2-z1)/segments;
      for (let i=0; i<=segments; i++) {
        v.push([x1+dx*i, y1+dy*i, z1+dz*i]);        // top chord
        v.push([x1+dx*i, y1+dy*i-height, z1+dz*i]); // bottom chord
      }
      for (let i=0; i<segments; i++) {
        e.push([i*2, (i+1)*2]);          // top
        e.push([i*2+1, (i+1)*2+1]);      // bottom
        e.push([i*2, i*2+1]);            // vertical
        e.push([i*2+1, (i+1)*2]);        // diagonal
      }
      e.push([segments*2, segments*2+1]); // final vertical
      return { v, e };
    };

    // Combine multiple shapes into one array of {vertices, edges, phase, offset}
    // phase: 0-1 range when this part should appear
    const parts = [];
    const addPart = (shape, phase, kind) => {
      parts.push({ v: shape.v, e: shape.e, phase, kind: kind || 'main' });
    };

    // === GROUND GRID ===
    (function() {
      const v = [], e = [];
      const half = 60, step = 10;
      for (let x = -half; x <= half; x += step) {
        v.push([x, -12, -half]); v.push([x, -12, half]);
        e.push([v.length-2, v.length-1]);
      }
      for (let z = -half; z <= half; z += step) {
        v.push([-half, -12, z]); v.push([half, -12, z]);
        e.push([v.length-2, v.length-1]);
      }
      addPart({v, e}, 0.0, 'grid');
    })();

    // === FOUNDATION SLAB (main plant) ===
    addPart(box(0, -11, 0, 42, 2, 24), 0.05);

    // === MAIN PLANT HALL (large industrial shed) ===
    addPart(box(0, -2, 0, 40, 16, 22), 0.15);
    // Vertical columns inside plant (heavy structural)
    (function() {
      const v = [], e = [];
      const cols = [[-16,-8],[-8,-8],[0,-8],[8,-8],[16,-8],[-16,8],[-8,8],[0,8],[8,8],[16,8]];
      cols.forEach(([x, z]) => {
        v.push([x, -10, z]); v.push([x, 6, z]);
        e.push([v.length-2, v.length-1]);
      });
      addPart({v,e}, 0.2);
    })();

    // === GABLE ROOF TRUSS on plant ===
    (function() {
      const v = [], e = [];
      // Ridge line
      const ridge = 12; // height above baseline of walls (walls at y=6)
      const halfW = 20, halfD = 11;
      // Ridge endpoints
      v.push([0, ridge, -halfD]); v.push([0, ridge, halfD]);
      // Eaves (уже часть коробки, но добавим top-chord soft angle)
      for (let z = -halfD; z <= halfD; z += 4) {
        v.push([-halfW, 6, z]); v.push([0, ridge, z]); v.push([halfW, 6, z]);
      }
      // Connect trusses
      let base = 2; // offset for repeating trusses
      for (let z = -halfD; z <= halfD; z += 4) {
        e.push([base, base+1]);    // left slope
        e.push([base+1, base+2]);  // right slope
        base += 3;
      }
      // Ridge line
      e.push([0, 1]);
      addPart({v,e}, 0.3);
    })();

    // === STORAGE TANKS (3 cylinders) — compact around plant ===
    addPart(cyl(-26, -3, -6, 4, 14, 14, true), 0.4);
    addPart(cyl(-26, -3, 5, 4, 14, 14, true), 0.42);
    addPart(cyl(-18, -3, 12, 3.5, 12, 12, true), 0.44);
    // Tank tops with domes (simplified as half-cyl)
    (function() {
      const v = [], e = [];
      const tanks = [[-26, 4, -6, 4], [-26, 4, 5, 4], [-18, 3, 12, 3.5]];
      tanks.forEach(([tx, ty, tz, r]) => {
        const base = v.length;
        // Cap ring at top
        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * Math.PI * 2;
          v.push([tx + Math.cos(a)*r, ty, tz + Math.sin(a)*r]);
        }
        // Apex
        v.push([tx, ty + r*0.5, tz]);
        for (let i = 0; i < 12; i++) {
          e.push([base + i, base + 12]); // radial to apex
        }
      });
      addPart({v,e}, 0.44);
    })();

    // === SMOKESTACK (tall chimney) — closer to plant ===
    addPart(cyl(23, 2, -6, 2.2, 28, 12), 0.55);
    // Support ring around chimney base
    (function() {
      const v = [], e = [];
      const cx0 = 23, cy0 = -8, cz0 = -6;
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        v.push([cx0 + Math.cos(a) * 3.5, cy0, cz0 + Math.sin(a) * 3.5]);
        v.push([cx0 + Math.cos(a) * 2.2, cy0, cz0 + Math.sin(a) * 2.2]);
      }
      for (let i = 0; i < 12; i++) {
        e.push([i*2, ((i+1)%12)*2]);
        e.push([i*2+1, ((i+1)%12)*2+1]);
        e.push([i*2, i*2+1]);
      }
      addPart({v,e}, 0.6);
    })();
    // Two smaller chimney details / smaller stack
    addPart(cyl(19, -2, -6, 1.2, 18, 8), 0.58);

    // === CRANE (gantry crane over plant) — compact ===
    (function() {
      const tower1 = truss(-18, -10, -13, -18, 18, -13, 2.5, 8);
      const tower2 = truss(18, -10, -13, 18, 18, -13, 2.5, 8);
      const bridge = truss(-18, 18, -13, 18, 18, -13, 2.5, 7);
      addPart(tower1, 0.7);
      addPart(tower2, 0.72);
      addPart(bridge, 0.78);
      // Trolley
      addPart(box(-4, 15.5, -13, 3, 2, 3), 0.82);
      // Hook cable
      addPart({v:[[-4, 15.5, -13],[-4, 6, -13]], e:[[0,1]]}, 0.84);
      // Hook
      addPart(box(-4, 5, -13, 1.5, 1.5, 1.5), 0.86);
    })();

    // === PIPES from tanks to plant ===
    (function() {
      const v = [], e = [];
      v.push([-22, -3, -6]); v.push([-15, -3, -6]);
      v.push([-15, -3, -6]); v.push([-15, -3, 0]);
      v.push([-22, -3, 5]); v.push([-15, -3, 5]);
      e.push([0,1]); e.push([2,3]); e.push([4,5]);
      // Pipe support pillars
      v.push([-18, -10, -6]); v.push([-18, -3, -6]);
      v.push([-18, -10, 5]); v.push([-18, -3, 5]);
      e.push([6,7]); e.push([8,9]);
      addPart({v,e}, 0.9);
      addPart(box(-15, -3, -6, 0.8, 0.8, 0.8), 0.9);
      addPart(box(-15, -3, 5, 0.8, 0.8, 0.8), 0.9);
    })();

    // === INTERIOR MEZZANINE (walkway inside plant, adds depth) ===
    (function() {
      // Elevated walkway at y=0 inside plant hall
      const v = [
        [-16, 0, -3],[16, 0, -3],[16, 0, 3],[-16, 0, 3],   // walkway platform (4 vertices)
        [-16, -2, -3],[16, -2, -3],[16, -2, 3],[-16, -2, 3] // supports going down
      ];
      const e = [[0,1],[1,2],[2,3],[3,0],[0,4],[1,5],[2,6],[3,7]];
      addPart({v,e}, 0.35);
    })();

    // === ROOF STRUSSES (диагональные стропила) ===
    (function() {
      const v = [], e = [];
      const halfW = 20, halfD = 11, wallY = 6, ridgeY = 12;
      // Diagonal bracing between roof trusses
      for (let z = -halfD; z < halfD; z += 4) {
        const z2 = z + 4;
        // Diagonal cross bracing between adjacent trusses (form X)
        v.push([-halfW, wallY, z]);       // 0
        v.push([0, ridgeY, z2]);           // 1
        v.push([0, ridgeY, z]);            // 2
        v.push([-halfW, wallY, z2]);       // 3
        v.push([halfW, wallY, z]);         // 4
        v.push([0, ridgeY, z2]);           // 5 (dup of 1)
        v.push([0, ridgeY, z]);            // 6 (dup of 2)
        v.push([halfW, wallY, z2]);        // 7
        const b = v.length - 8;
        e.push([b, b+1]); e.push([b+2, b+3]); // left slope X
        e.push([b+4, b+5]); e.push([b+6, b+7]); // right slope X
      }
      // Purlins along ridge (роликовые прогоны)
      for (let s = 1; s < 4; s++) {
        const yy = wallY + (ridgeY - wallY) * s / 4;
        const xx = halfW * (1 - s/4);
        v.push([-xx, yy, -halfD]); v.push([-xx, yy, halfD]);
        e.push([v.length-2, v.length-1]);
        v.push([xx, yy, -halfD]); v.push([xx, yy, halfD]);
        e.push([v.length-2, v.length-1]);
      }
      addPart({v,e}, 0.32);
    })();

    // === STAIRS on plant exterior wall ===
    (function() {
      const v = [], e = [];
      // Zigzag stair from ground to roof on east wall (x=+20)
      const sx = 20.5, sz = -8;
      const steps = 12;
      for (let i = 0; i <= steps; i++) {
        const y = -10 + i * 16 / steps;
        const zOffset = (i % 2) * 1.2;
        v.push([sx, y, sz + zOffset]);
      }
      // Connect them zigzag
      for (let i = 0; i < steps; i++) {
        e.push([i, i+1]);
      }
      // Handrail
      for (let i = 0; i <= steps; i++) {
        v.push([sx + 0.5, -10 + i * 16 / steps + 1, sz + (i % 2) * 1.2]);
      }
      for (let i = 0; i < steps; i++) {
        e.push([steps+1+i, steps+2+i]);
      }
      // Vertical support posts every 3 steps
      for (let i = 0; i <= steps; i += 3) {
        e.push([i, steps+1+i]);
      }
      addPart({v,e}, 0.36);
    })();

    // === HVAC / VENTS on rooftop — сидят точно на скате крыши ===
    // Roof plane: y = 12 - 0.3 * |x| (ridge at x=0, y=12; walls at x=±20, y=6)
    (function() {
      const roofY = (x) => 12 - 0.3 * Math.abs(x);
      // Units sit ON the roof: bottom edge = roof surface, center = roof + halfH
      const hvac = [
        [-10, 3, 2, 4],   // x, w, h, d
        [-2, 2, 2, 2],
        [6, 3, 2, 3],
        [12, 2.5, 2, 2.5],
      ];
      hvac.forEach(([x, w, h, d]) => {
        const cy0 = roofY(x) + h/2;
        addPart(box(x, cy0, x < 0 ? 0 : -2, w, h, d), 0.34);
      });
      // Vent stacks (short cylinders) with base at roof
      const stacks = [
        [-6, 0.6, 4, -2],
        [4, 0.5, 3, 4],
      ];
      stacks.forEach(([x, r, hh, z]) => {
        const cy0 = roofY(x) + hh/2;
        addPart(cyl(x, cy0, z, r, hh, 8), 0.34);
      });
    })();

    // === EXTERNAL AIR DUCT (large duct along wall) ===
    (function() {
      const v = [], e = [];
      // Rectangular duct running along west wall
      const dx = -20.5, dz = 0;
      for (let z = -8; z <= 8; z += 4) {
        v.push([dx, 3, z]);   // top corner
        v.push([dx, 3, z]);   // top back (same)
        v.push([dx - 1.5, 3, z]); // outer top
        v.push([dx - 1.5, 1, z]); // outer bottom
        v.push([dx, 1, z]);   // inner bottom
      }
      for (let i = 0; i < 5 - 1; i++) {
        const b = i * 5;
        e.push([b, b+5]);       // top-inner along Z
        e.push([b+2, b+7]);     // top-outer along Z
        e.push([b+3, b+8]);     // bottom-outer along Z
        e.push([b+4, b+9]);     // bottom-inner along Z
      }
      // Cross-sections (rectangles)
      for (let i = 0; i < 5; i++) {
        const b = i * 5;
        e.push([b, b+2]); e.push([b+2, b+3]); e.push([b+3, b+4]); e.push([b+4, b]);
      }
      addPart({v,e}, 0.42);
    })();

    // === CONVEYOR BELT running from chimney area to tanks ===
    (function() {
      const v = [], e = [];
      // Simplified: two rails at slight angle
      v.push([-14, -8, 8]); v.push([18, -3, 8]);
      v.push([-14, -8, 6.5]); v.push([18, -3, 6.5]);
      e.push([0,1]); e.push([2,3]);
      // Cross ties
      for (let t = 0; t <= 6; t++) {
        const ax = -14 + t*(18-(-14))/6, ay = -8 + t*(-3-(-8))/6;
        v.push([ax, ay, 8]); v.push([ax, ay, 6.5]);
        e.push([v.length-2, v.length-1]);
        // Support legs
        v.push([ax, -12, 7.25]); v.push([ax, ay, 7.25]);
        e.push([v.length-2, v.length-1]);
      }
      addPart({v,e}, 0.5);
    })();

    // === Coordinate axes (subtle, CAD-style) ===
    (function() {
      const v = [[0,-12,0],[15,-12,0],[0,-12,0],[0,3,0],[0,-12,0],[0,-12,15]];
      const e = [[0,1],[2,3],[4,5]];
      addPart({v,e}, 0.0);
    })();

    // --- ROTATION + PROJECTION ---
    // Camera is at (0,0,cameraDist) looking down -Z. Model is at origin.
    // Rotate model around Y (auto), then around X (fixed tilt).
    const project = (p, rotY, rotX) => {
      const cy = Math.cos(rotY), sy = Math.sin(rotY);
      let x = p[0]*cy - p[2]*sy;
      let z = p[0]*sy + p[2]*cy;
      let y = p[1];
      const cx = Math.cos(rotX), sx = Math.sin(rotX);
      const y2 = y*cx - z*sx;
      const z2 = y*sx + z*cx;
      return [x, y2, z2];
    };

    // Perspective: point at world Z (rotated), camera at +cameraDist, focal length focal.
    // Screen x = focal * x / (cameraDist - z). +z toward camera.
    const CAMERA_DIST = 140;
    const FOCAL = 100;
    const perspective = (p) => {
      const d = CAMERA_DIST - p[2];
      if (d <= 1) return null;
      const scale = FOCAL / d;
      return { x: p[0] * scale, y: -p[1] * scale, depth: p[2], scale };
    };

    // --- ANIMATION ---
    const start = performance.now();
    // Cycle: 60s total. Rotation is CONSTANT SPEED = one full turn per cycle.
    // First 15% (~9s) — parts appear while model turns. Last 5% — fade & reset.
    const CYCLE = 60000;
    const BUILD_END = 0.15;
    const ROTATE_END = 0.95;
    const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // --- SMOKE PARTICLES (from chimney) ---
    const SMOKE_MAX = 24;
    const smoke = [];
    for (let i = 0; i < SMOKE_MAX; i++) {
      smoke.push({
        // Start at chimney top (x=23, y=16, z=-6). Random age/velocity.
        age: Math.random(),         // 0..1 (life progress)
        speed: 0.3 + Math.random() * 0.4,
        driftX: (Math.random() - 0.5) * 0.6,
        driftZ: (Math.random() - 0.5) * 0.6,
        size: 0.6 + Math.random() * 0.8,
        phase: Math.random() * Math.PI * 2,
      });
    }

    // --- BLINKING LIGHTS ---
    // Positions in world coords: crane corners, chimney top, plant corners
    const lights = [
      { pos: [-18, 18, -13], color: [220, 30, 30], freq: 1.2, phase: 0 },       // crane top-left
      { pos: [18, 18, -13], color: [220, 30, 30], freq: 1.2, phase: Math.PI }, // crane top-right
      { pos: [23, 16, -6], color: [230, 60, 30], freq: 0.6, phase: 0 },        // chimney top
      { pos: [-20, 6, -11], color: [230, 180, 40], freq: 2.5, phase: 0.5 },    // plant NW corner
      { pos: [20, 6, 11], color: [230, 180, 40], freq: 2.5, phase: 1.8 },      // plant SE corner
    ];

    const draw = () => {
      if (W === 0 || H === 0) { resize(); requestAnimationFrame(draw); return; }
      ctx.clearRect(0, 0, W, H);
      const t = (performance.now() - start) / 1000;
      const cyclePos = ((performance.now() - start) % CYCLE) / CYCLE; // 0..1
      // Constant-speed rotation: exactly one full 360° per cycle
      const rotY = REDUCED ? -0.55 : (cyclePos * 2 * Math.PI);
      const rotX = 0.32; // ~18° down tilt
      // Screen positioning — right-shifted so model doesn't cover text
      const cx = W * 0.7;
      const cy = H * 0.55;
      // Uniform screen scale — 3D wireframe should be visually large but not overflow
      const screenScale = Math.min(W, H * 1.3) * 0.017;

      // buildProgress = 0..1 during first BUILD_END fraction of cycle
      const buildProgress = cyclePos < BUILD_END ? cyclePos / BUILD_END : 1;
      const globalVisible = REDUCED ? 1 : (cyclePos < ROTATE_END ? 1 : Math.max(0, 1 - (cyclePos - ROTATE_END) / (1 - ROTATE_END)));

      // --- Update dynamic parts (moving trolley of crane) ---
      // Find trolley + cable + hook parts by pattern
      // Trolley: phase 0.82, cable phase 0.84, hook phase 0.86
      const trolleyX = -4 + Math.sin(t * 0.4) * 10; // Oscillates along bridge
      const cableY = 15.5 + Math.sin(t * 0.7) * 2;  // Cable vertical movement (lift)
      // Trolley part index — find first part with phase 0.82
      const trolleyPart = parts.find(p => Math.abs(p.phase - 0.82) < 0.001);
      const cablePart = parts.find(p => Math.abs(p.phase - 0.84) < 0.001);
      const hookPart = parts.find(p => Math.abs(p.phase - 0.86) < 0.001);
      if (trolleyPart) {
        // Rebuild trolley vertices at new X
        const w=3, h=2, d=3, cy0=15.5, cz0=-13;
        trolleyPart.v = [
          [trolleyX-w/2, cy0-h/2, cz0-d/2],[trolleyX+w/2, cy0-h/2, cz0-d/2],
          [trolleyX+w/2, cy0+h/2, cz0-d/2],[trolleyX-w/2, cy0+h/2, cz0-d/2],
          [trolleyX-w/2, cy0-h/2, cz0+d/2],[trolleyX+w/2, cy0-h/2, cz0+d/2],
          [trolleyX+w/2, cy0+h/2, cz0+d/2],[trolleyX-w/2, cy0+h/2, cz0+d/2],
        ];
      }
      if (cablePart) {
        cablePart.v = [[trolleyX, 15.5, -13],[trolleyX, cableY - 8, -13]];
      }
      if (hookPart) {
        const hy = cableY - 9.5, w=1.5;
        hookPart.v = [
          [trolleyX-w/2, hy-w/2, -13-w/2],[trolleyX+w/2, hy-w/2, -13-w/2],
          [trolleyX+w/2, hy+w/2, -13-w/2],[trolleyX-w/2, hy+w/2, -13-w/2],
          [trolleyX-w/2, hy-w/2, -13+w/2],[trolleyX+w/2, hy-w/2, -13+w/2],
          [trolleyX+w/2, hy+w/2, -13+w/2],[trolleyX-w/2, hy+w/2, -13+w/2],
        ];
      }

      parts.forEach(part => {
        let alpha = 0;
        if (REDUCED) {
          alpha = 1;
        } else if (buildProgress >= part.phase) {
          const localT = Math.min(1, (buildProgress - part.phase) / 0.04);
          alpha = localT * globalVisible;
        }
        if (alpha <= 0.02) return;

        // Project all vertices
        const projected = part.v.map(v => {
          const r = project(v, rotY, rotX);
          return perspective(r);
        });

        // Draw edges — depth-based line width (perspective feel)
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        const isGrid = part.kind === 'grid';
        part.e.forEach(edge => {
          const a = projected[edge[0]], b = projected[edge[1]];
          if (!a || !b) return;
          const avgDepth = (a.depth + b.depth) / 2;
          const depthAlpha = 0.7 + Math.max(0, Math.min(1, (avgDepth + 15) / 30)) * 0.3;
          const baseAlpha = isGrid ? 0.35 : 1.0;
          ctx.strokeStyle = `rgba(0, 39, 92, ${alpha * depthAlpha * baseAlpha})`;
          ctx.lineWidth = isGrid ? 0.6 : Math.max(1.2, 1.6 + (avgDepth + 15) / 20);
          ctx.beginPath();
          ctx.moveTo(cx + a.x * screenScale, cy + a.y * screenScale);
          ctx.lineTo(cx + b.x * screenScale, cy + b.y * screenScale);
          ctx.stroke();
        });
      });

      // --- Draw smoke particles from chimney (world x=23, y=16, z=-6) ---
      if (!REDUCED && cyclePos > 0.10) {
        const smokeAlpha = globalVisible * Math.min(1, (cyclePos - 0.10) / 0.05);
        smoke.forEach(p => {
          p.age += 0.006 * p.speed;
          if (p.age > 1) {
            p.age = 0;
            p.driftX = (Math.random() - 0.5) * 0.6;
            p.driftZ = (Math.random() - 0.5) * 0.6;
            p.size = 0.6 + Math.random() * 0.8;
          }
          const wobble = Math.sin(t * 2 + p.phase) * 0.4;
          const wx = 23 + p.driftX * p.age * 8 + wobble;
          const wy = 16 + p.age * 14; // rise
          const wz = -6 + p.driftZ * p.age * 8;
          const rot = project([wx, wy, wz], rotY, rotX);
          const proj = perspective(rot);
          if (!proj) return;
          const partAlpha = (1 - p.age) * smokeAlpha * 0.5;
          if (partAlpha <= 0.02) return;
          const size = p.size * (1 + p.age * 2) * proj.scale;
          const sx = cx + proj.x * screenScale;
          const sy = cy + proj.y * screenScale;
          const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, size * screenScale * 0.3);
          grad.addColorStop(0, `rgba(140, 150, 165, ${partAlpha})`);
          grad.addColorStop(1, `rgba(140, 150, 165, 0)`);
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(sx, sy, size * screenScale * 0.3, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      // --- Draw blinking lights ---
      if (!REDUCED && cyclePos > 0.13) {
        const lightAlpha = globalVisible * Math.min(1, (cyclePos - 0.13) / 0.05);
        lights.forEach(l => {
          const blink = 0.5 + 0.5 * Math.sin(t * l.freq * Math.PI * 2 + l.phase);
          const intensity = blink * blink; // sharper on/off
          if (intensity < 0.05) return;
          const rot = project(l.pos, rotY, rotX);
          const proj = perspective(rot);
          if (!proj) return;
          const sx = cx + proj.x * screenScale;
          const sy = cy + proj.y * screenScale;
          const [r, g, b] = l.color;
          const size = 3 * proj.scale;
          // Glow halo
          const halo = ctx.createRadialGradient(sx, sy, 0, sx, sy, size * 4);
          halo.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${intensity * lightAlpha * 0.9})`);
          halo.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${intensity * lightAlpha * 0.25})`);
          halo.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
          ctx.fillStyle = halo;
          ctx.beginPath();
          ctx.arc(sx, sy, size * 4, 0, Math.PI * 2);
          ctx.fill();
          // Bright core
          ctx.fillStyle = `rgba(${r + 20}, ${g + 20}, ${b + 20}, ${intensity * lightAlpha})`;
          ctx.beginPath();
          ctx.arc(sx, sy, size, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      requestAnimationFrame(draw);
    };
    draw();
  }
})();
