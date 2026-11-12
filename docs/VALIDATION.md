# Tekshiruv holati

Tekshiruv sanasi: 2026-11-12. Node 24.22.1, npm 11.9.0.

- Toza `npm ci`: muvaffaqiyatli.
- `npm run check`: muvaffaqiyatli.
- Strict TypeScript tekshiruvi: o‘tdi.
- 9 test fayli, 30 behavior/policy/shell test: o‘tdi.
- Kontent schema/reference/cycle tekshiruvi: 204 outline, 2 draft level, 0 published, 15 missing asset.
- 10 001 synthetic level / 101 pack addressing/schema testi: o‘tdi. Haqiqiy kurs yoki GPU benchmark emas.
- Production build: o‘tdi. Initial shell ~300 kB minified / ~93 kB gzip. Three chunk ~724 kB / ~192 kB gzip, sahna ochilganda lazy yuklanadi. Bu o‘lchamlar real assetlarni o‘z ichiga olmaydi.
- Recording inventory: 10 ta uz/en yozuv sloti.
- Release guard missing asset va draft lessonlar tufayli production kontent nashrini bloklashi kerak.

Brauzerning vizual/interaction smoke tekshiruvi ushbu execution muhitidagi Chromium process/socket cheklovi sabab bajarilmadi. Real GLB/audio va real telefon bilan ishlash, frame time, qizish, collision joylashuvi va animation mosligi hali tekshirilmagan. Bu chegaralar avtomatik test natijasi bilan berkitilmaydi.

## Frontend guardrails tekshiruvi

- App 401 qatordan 50 qatorli composition rootga ajratildi.
- Eng katta TSX komponent: 51 qator; eng katta UI CSS Module: 191 qator.
- Format, qatlam chegaralari, raw controls/inline style, design token va clone guardlari o‘tdi.
- Feature generator yaratish va mavjud featureni ustidan yozishni rad etish sinovi o‘tdi; sinov feature repoga kiritilmadi.
- Shell SSR smoke render tekshiruvi WebGL yoki browser storage yaratmasdan ishlaydi. Bu brauzer interaction yoki screenshot tekshiruvi o‘rnini bosmaydi.
