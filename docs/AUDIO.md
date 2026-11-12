# O‘zbekcha va inglizcha yozib tayyorlangan ovoz

## Tuzilma

Cue — voqeaning semantik IDsi. Har cue uchun `uz` tushuntirish va `en` namuna satri bo‘lishi mumkin. Satr matni audio transkriptiga aynan mos. `audio.json` → asset ID → `assets.json` → immutable audio URL.

Rejimlar: `uz-en`, `en`, `uz`. Play foydalanuvchi bosishidan boshlanadi; autoplay rad etilsa UI xabar ko‘rsatadi. Yangi cue/stop/scene exit yashayotgan playbackni yakunlaydi. Tab yashirilsa shell narrationni to‘xtatadi. Missing yozuv subtitr va missing status bilan ko‘rsatiladi; browser TTSga almashtirilmaydi. Bitta matnni ko‘rish audio tinglash dalili hisoblanmaydi.

## Ishlab chiqarish

1. Lug‘at va dialog scriptini metodist tasdiqlaydi.
2. O‘zbekcha/inglizcha ovoz alohida yoziladi; personaj ovozi izchil saqlanadi.
3. Pronunciation, urg‘u, shovqin, kesilgan boshlanish/yakun va transkript mosligi tekshiriladi.
4. Master 48kHz WAV tashqi asset omborida; web uchun MP3/AAC yoki tekshirilgan OGG derivative. Juda qisqa so‘zlarda boshlanish/oxiri kesilmaydi.
5. Audio asset sloti manifestda e’lon qilinadi; `asset:register` bilan hash/metadata/staging tayyorlanadi.
6. Safari/iOS, Android Chrome va desktopda codec/gesture/range xatti-harakati tekshiriladi.

```bash
npm run audio:inventory
npm run asset:register -- --id audio.welcome.uz --file /absolute/path/welcome-uz.mp3 --license user-owned --source user-recording --resident-mb 1
```

`artifacts/audio-inventory.json` joriy 5 cue uchun 10 recording slotini chiqaradi. Bu barcha 204 mavzuning yozilgan dialoglari emas. Katta audio katalog keyin course/world packlarga sharding qilinadi; hozirgi bootstrap katalog faqat kerakli boshlang‘ich voicelarni saqlashi kerak. Butun kurs katalogini 2MiB JSON chegarasidan oshirib bo‘lmaydi.

## Keyingi imkoniyatlar

Recording audio — TTS/ASR/talaffuz scoringdan alohida. Mikrofondan yozish, xom ovozni serverga uzatish, avtomatik baholash hozir implement qilinmagan. Ular ota-ona roziligi, saqlash muddati va tekshirilgan nutq servisi bilan alohida adapter bo‘ladi. Background music/SFX/ducking ham alohida mixer adapteri; mavjud `AudioDirector` narration uchun.
