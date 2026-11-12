# GamEnglish

Three.js va React asosidagi ingliz tili o‘yini. **Z001 — “Birinchi salom”** missiyasining interaktiv varianti: ona, bola, qo‘shni, foydalanuvchi yuborgan mahalla, suhbatlar, mashqlar va progress. Uchala rol hozir foydalanuvchi roziligi bilan bitta bola modelidan foydalanadi.

**Tabiiy ovoz yozuvlari hali berilmagan.** Subtitrli sinov va alohida yozuvlarni ulash mavjud; robot ovoz ishlatilmaydi. Tayyor to‘liq ovozli reliz deb ko‘rsatilmaydi.

[1-missiya: aktivlar, ovozlar va ishga tushirish](docs/MISSION_01.md). 204 mavzuli kurs rejasi va oldingi arxitektura modullari saqlangan, qolgan missiyalar hali amalga oshirilmagan.

## Ishga tushirish

Node 24 LTS va npm kerak. Node 22.12+ ham package engine minimumiga mos, lekin CI Node 24 da.

```bash
npm ci
npm run assets:prepare -- /absolute/path/to/uploads asset-source/m01
npm run dev
```

Brauzerda terminal ko‘rsatgan manzilni oching. Standart Vite porti 5173. `apps/web/.env.local` kerak bo‘lsa rootdagi `.env.example` dan nusxa olinadi. Lokal asset staging standart `/assets/` orqali Vite middleware bilan ishlaydi.

```bash
npm run check
npm run audio:inventory
```

`check`: format, architecture/design policies, TypeScript, behavior tests, content references, 10 001 synthetic level addressing test, production build. `npm run content:release-check` hozir ataylab xato beradi: yozuv/model va tasdiqlangan level yetishmaydi.

## Aniq mahkamlangan texnologiyalar

- Three.js **0.187.0 (r187)**, mos `@types/three`.
- React 19.3.1 — menyu, HUD, sozlamalar; Three.js — real-time dunyo. React Three Fiber bu asosda ishlatilmagan: asosiy runtime to‘g‘ridan-to‘g‘ri Three.js.
- Vite 8.3.8, TypeScript 7.0.2, Vitest 5.1.0; aniq versiyalar va `package-lock.json`.
- WebGLRenderer; WebGPU eksperimental yo‘liga yoki o‘z-o‘zidan yangilanuvchi `latest` importiga bog‘lanmaydi.

r187 tanlovi — tekshirilgan hozirgi stable relizni pin qilish qarori, “barcha qurilmada eng stabil” kafolati emas. Haqiqiy telefon va GLBlar bilan profil qilish shart. [Three.js](https://threejs.org/) · [GLTFLoader](https://threejs.org/docs/pages/GLTFLoader.html)

## Tuzilma

```text
apps/web/                  app + isolated features + shared UI/design tokens
  public/content/v1/       Kichik metadata: index, packs, scenes, audio, vocabulary, curriculum
packages/contracts/        Zod schema va umumiy TypeScript turlari
packages/engine/           Content/asset/audio servislar; alohida lazy Three.js runtime
packages/learning/         Lug‘at, prerequisites, level session va IndexedDB
content/                   Mualliflik jarayoni bo‘yicha eslatmalar
asset-source/              Lokal asset staging — Gitdan chiqarilgan, import vaqtida yaratiladi
tools/                     Validate, stress, asset register, recording inventory
tests/                     Resource, audio, content, learning va persistence sinovlari
docs/                      Arxitektura va ishlab chiqarish shartnomalari
.github/workflows/         CI
```

10 000 level uchun 10 000 React komponent yoki 10 000 GLB sahna yaratilmaydi. Level ma’lumotlari ko‘pi bilan 100 yozuvli packlarga ajratiladi. Bir xil joy, personaj va buyumlar turli vaziyatlarda qayta ishlatiladi. Bir necha GB umumiy asset hajmi bir vaqtning o‘zida yuklanmaydi.

## Tayyor qismlar

- Strict typed schemas va content reference/cycle validator.
- Pack range binary search va chegaralangan 3-pack LRU.
- Single-flight model cache, reference-count leases, resident-memory estimate budget va deterministic disposal.
- Tasdiqlangan GLBlar uchun checksum, self-contained validation, SkeletonUtils instancing, animatsiya aralashtirish.
- Transactional sahna almashish: muvaffaqiyatsiz yangi sahna eski sahnani o‘chirmaydi.
- Oddiy tekis yer controlleri, authored invisible AABB collision, desktop/touch boshqaruv, raycast interaction.
- Recorded `uz → en`, `en`, `uz` ovoz rejimlari, subtitr, stop/cancel/error handling.
- Lug‘at evidence va gate; IndexedDB atomic attempt/mastery/outbox yozuvi, duplicate event id himoyasi.
- 204 mavzu rejasini ko‘rish uchun responsive boshlang‘ich ekran.

## Hali qilinadigan ishlar

- Litsenziyali model va animatsiyalarni tanlash/import; sahna joylashuvi va colliderlarni real modelga moslash.
- O‘zbekcha va inglizcha ovozlarni yozish, tekshirish va import.
- Har mavzuning to‘liq lug‘ati, dialoglari, mashqlari va pedagogik tekshiruvi.
- LevelSession/ProgressRepository ni to‘liq lesson HUD va real o‘yin vazifalari bilan bog‘lash. Hozirgi UI outline/asset tayyorligini ko‘rsatadi; tayyor kurs sifatida XP bermaydi.
- Jonivor xulqi, buyum ushlash/silash sinxronizatsiyasi, murakkab fizika va saveable world state.
- Backend, account/parental consent, cross-device sync va ishlab chiqarish telemetriyasi.
- Oflayn content pack install, quota/eviction UI; hozir to‘liq oflayn o‘yin qo‘llab-quvvatlanmaydi.
- 10k haqiqiy authored lesson, multi-GB download va real-device/GPU load test.

## Hujjatlar

- [Arxitektura](docs/ARCHITECTURE.md)
- [Clean code va frontend qoidalari](docs/CLEAN_CODE.md)
- [Dizayn tizimi](docs/DESIGN_SYSTEM.md)
- [Asset import va saqlash](docs/ASSETS.md)
- [Ikki tilli ovoz](docs/AUDIO.md)
- [Level va o‘quv kontenti](docs/CONTENT.md)
- [Backend integratsiyasi](docs/BACKEND.md)
- [Deployment va performance](docs/OPERATIONS.md)
- [Qarorlar va keyingi ishlar](docs/DECISIONS.md)

## Frontend sifat qoidalari

App faqat composition root. Curriculum, voice va world alohida featurelar; Button/Surface/Notice/SelectField kabi shablonlar shared/ui ichida. CSS Modules va yagona tokenlar ishlatiladi. 180/350/250 qator limitlari, import chegaralari va dizayn qoidalari `npm run architecture:check` orqali CI da tekshiriladi. Uzun aynan bir xil funksiyalar aniqlanadi; mazmuniy takrorlanish reviewda tekshiriladi.

```bash
npm run feature:create -- --name inventory
npm run format
npm run check
```
