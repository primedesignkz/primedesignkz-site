# Деплой primedesign.kz на Vercel

Сайт — статика (`index.html` + `styles.css` + `script.js` + `images/`). Сборка не нужна,
Vercel раздаёт файлы как есть. Форма КП отправляется через `formsubmit.co`, бэкенд не требуется.

---

## Шаг 1. Git-репозиторий (локально)

Открой терминал в папке сайта (`C:\Users\Arslan\Documents\Site Primedesign.kz`):

```bash
git init -b main
git add .
git commit -m "Prime Design: первый коммит статического сайта"
```

Проверь, что `artifact.html` НЕ попал в коммит (он в `.gitignore`):

```bash
git ls-files | findstr artifact
```

Вывод должен быть пустым.

## Шаг 2. Репозиторий на GitHub

Вариант А — через GitHub CLI (если установлен `gh`):

```bash
gh auth login
gh repo create primedesign-kz --private --source=. --remote=origin --push
```

Вариант Б — вручную:

1. Создай пустой репозиторий на https://github.com/new — имя `primedesign-kz`, **без** README и .gitignore.
2. Подключи и запушь:

```bash
git remote add origin https://github.com/<твой-логин>/primedesign-kz.git
git push -u origin main
```

## Шаг 3. Импорт в Vercel

1. Зайди на https://vercel.com → **Add New… → Project**.
2. Подключи GitHub-аккаунт, выбери репозиторий `primedesign-kz` → **Import**.
3. Настройки оставь по умолчанию:
   - Framework Preset: **Other**
   - Build Command: пусто
   - Output Directory: пусто (корень репозитория)
   - Install Command: пусто
4. **Deploy**. Через ~30 секунд получишь адрес вида `primedesign-kz.vercel.app`.

`vercel.json` в репозитории уже задаёт clean URLs, кэш для картинок и security-заголовки.

## Шаг 4. Домен primedesign.kz

В Vercel: **Project → Settings → Domains → Add** → введи `primedesign.kz`,
затем отдельно добавь `www.primedesign.kz`.

Vercel сам покажет, что прописать: **A-запись** для корня (`@`) и **CNAME** для `www`.

**Важно:** конкретные значения (IP и CNAME-цель) бери прямо из интерфейса Vercel —
они зависят от региона и периодически меняются, поэтому я их здесь намеренно не фиксирую.

Записи прописываются в панели регистратора домена `.kz` (у кого зарегистрирован
primedesign.kz — PS Internet / Hoster.kz / ps.kz и т.п.). TLS-сертификат Let's Encrypt
Vercel выпустит сам после того, как DNS разойдётся (от 10 минут до 24 часов).

Рекомендуется в Vercel выбрать основной домен `primedesign.kz`, а `www` поставить
на редирект (это переключатель в списке домены).

---

## Дальнейшее обслуживание

Любое изменение выкладывается так:

```bash
git add .
git commit -m "что изменил"
git push
```

Vercel сам пересоберёт и обновит сайт за ~20 секунд. История деплоев и кнопка
**Instant Rollback** — в разделе Deployments, откатиться можно в один клик.

Если работать через ветки, каждая ветка/PR получает свой preview-URL — удобно
показывать правки заказчику до публикации.

---

## Что уже исправлено

1. **Иконки PWA.** Раньше все иконки в `manifest.json` ссылались на один
   `images/logo.png` (958×604, не квадратный) — Lighthouse ругался на installability.
   Сгенерированы настоящие квадратные: `favicon-32.png`, `icon-192.png`,
   `icon-512.png`, `icon-maskable-512.png` (с safe-zone под маску) и
   `apple-touch-icon.png` (180×180). `manifest.json` и `<head>` обновлены.
2. **`robots.txt`.** Правило `Disallow: /*.json$` блокировало `manifest.json` —
   заменено на `Allow: /manifest.json`, добавлен запрет `artifact.html`.
3. **`artifact.html`** (1,5 МБ, черновик из Claude) исключён из git через `.gitignore` —
   в деплой не попадёт.

## Что стоит доделать (не блокирует деплой)

1. **Вес картинок.** `images/` — около 7 МБ, самые тяжёлые файлы по 300–340 КБ
   (`lavita-*.jpg`, `allee-1.jpg`, `grandpark-2.jpg`). Конвертация в WebP/AVIF
   даст выигрыш в 2–3 раза по LCP. Могу сделать отдельной задачей.
2. **Sitemap.** URL с якорями (`/#services`, `/#projects` …) поисковики
   в sitemap игнорируют — это не ошибка, но пользы от них ноль. Реальную ценность
   sitemap получит, когда появятся отдельные страницы.
3. **`lastmod` в sitemap.xml** зафиксирован на `2026-07-30` — стоит обновлять
   при заметных правках контента.

## Проверено, менять не нужно

- Все пути в `index.html` относительные (`images/…`, `styles.css`, `script.js`) —
  на Vercel заработает без правок.
- `og:image:width/height` = 1400×943 совпадают с реальным размером `allee-1.jpg`.
- Форма отправляется на `https://formsubmit.co/ajax/contact@primedesign.kz` —
  внешний сервис, серверная часть на Vercel не нужна.
