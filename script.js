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
})();
