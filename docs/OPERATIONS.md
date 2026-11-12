# Deployment, kuzatish va qabul mezonlari

## Build va publish

`npm ci` → `npm run check` → tanlangan real kontent uchun `npm run content:release-check` → assets upload → content release upload → dist deploy. Hozir release check ataylab qizil: 15 asset missing va 2 level draft. CI dev scaffold sifatida normal `check`ni bajaradi; release pipeline sozlanganda release checkni chetlab o‘tish mumkin emas.

Production static host `apps/web/dist`ni beradi. `VITE_CONTENT_BASE_URL`, `VITE_ASSET_BASE_URL` build-time konfiguratsiya. `VITE_DECODER_BASE_URL` ixtiyoriy. Cross-origin asset/CDNda kerakli CORS va MIME, MP3/AAC uchun Range/206, immutable hashli fayllar uchun Cache-Control sozlanadi. Local development staging serveri production deployment emas.

## Keshlash va oflayn

Hozir HTTP cache va bounded runtime cache bor; Service Worker yoki to‘liq oflayn pack installer yo‘q. Bir necha GBni avtomatik Cache Storagega tushirish yo‘q. Keyingi offline tizim foydalanuvchi tanlagan packni yuklaydi, navigator.storage.estimate() bilan quota, versiya, joy bo‘shatish va rollbackni boshqaradi. O‘quv progressi content cache bilan birga tozalanmaydi.

## Performance nishonlari — hali o‘lchanmagan

- Menyu/outline kodini dunyo rendereridan ajratish; Three runtime faqat sahna ochishda dynamic import.
- Dastlab faqat birinchi joy va yaqin dars audiosi; butun kurs emas.
- Past grafik preset uchun kelishilgan real telefonda kamida 30 FPS maqsad; p95 frame time va qizish bilan tekshirish.
- Root default model-cache estimate budget 192MiB. Past qurilmalarga mos preset real profilingdan keyin beriladi.
- Pixel ratio maksimum 1.5; shadow 1024; far plane 150. Bular boshlang‘ich sozlamalar, barcha dunyo uchun optimal qiymat emas.
- Har sahnada draw calls, triangles, texture/GPU memory taxmini va yuklash vaqti o‘lchanadi.

## Qurilma qabul tekshiruvi

Desktop Chrome/Safari (foydalanuvchining Intel MacBookini ham qo‘shib), Android Chrome va iPhone Safari real qurilmalarda. 20–30 daqiqa o‘yin, 30 marta sahna almashish, background/foreground, audio ruxsati, past xotira, tarmoq uzilishi, orientation va touch.

WebGL context lost bo‘lsa runtime xato ko‘rsatadi; qayta sahna ochish kerak. Context restore uchun yashirin asset taxminlari yo‘q. Noto‘g‘ri checksum, yetishmagan animatsiya, ovoz 404, CORS, sekin tarmoq va byudjet tugashi tekshiriladi.

## Kuzatish

Engine.stats(): cache bytes/entries/pending, draw calls, triangle count. Bu public telemetry backend emas. Keyingi yig‘iladigan metrikalar: content revision, scene ID, load duration/failure code, frame percentile, device class, crash/context loss. Bolaning haqiqiy ismi, raw ovozi yoki ortiqcha identifikatorlar default logga yozilmaydi.

## Server xarajati

Server hajmini umumiy kutubxona GB soni bilan birga trafik belgilaydi. Hisob: faol foydalanuvchi × sessiya soni × keshdan tashqari yuklangan MB. Assetni qayta ishlatish va versioned CDN narxni boshqaradi. Provayder, trafik va real assetlar yo‘q ekan, oylik narx kafolatlanmaydi.
