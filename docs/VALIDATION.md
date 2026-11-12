# Tekshiruv holati

Tekshiruv sanasi: 2026-11-12. Node 24.22.1, npm 11.9.0.

- Toza `npm ci`: muvaffaqiyatli.
- `npm run check`: muvaffaqiyatli.
- Strict TypeScript tekshiruvi: o‘tdi.
- 7 test fayli, 22 behavior test: o‘tdi.
- Kontent schema/reference/cycle tekshiruvi: 204 outline, 2 draft level, 0 published, 15 missing asset.
- 10 001 synthetic level / 101 pack addressing/schema testi: o‘tdi. Haqiqiy kurs yoki GPU benchmark emas.
- Production build: o‘tdi. Initial shell ~295 kB minified / ~90 kB gzip. Three chunk ~724 kB / ~192 kB gzip, sahna ochilganda lazy yuklanadi. Bu o‘lchamlar real assetlarni o‘z ichiga olmaydi.
- Recording inventory: 10 ta uz/en yozuv sloti.
- Release guard missing asset va draft lessonlar tufayli production kontent nashrini bloklashi kerak.

Brauzerning vizual/interaction smoke tekshiruvi ushbu execution muhitidagi Chromium process/socket cheklovi sabab bajarilmadi. Real GLB/audio va real telefon bilan ishlash, frame time, qizish, collision joylashuvi va animation mosligi hali tekshirilmagan. Bu chegaralar avtomatik test natijasi bilan berkitilmaydi.
