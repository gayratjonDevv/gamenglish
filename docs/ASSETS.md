# Tayyor 3D assetlar va katta fayllar

## Vizual qoida

Visible world faqat tanlangan/litsenziyasi tekshirilgan tayyor modellardan yig‘iladi. Missing model o‘rniga kub, shar, emoji jonivor yoki yangi generatsiya qilingan qahramon qo‘yilmaydi. Yorug‘lik, kamera, ko‘rinmas collider va UI model o‘rnini bosuvchi san’at emas — runtime infratuzilmasi.

Boshlang‘ich slotlar: `hero.child`, `pet.cat`, `world.home`, `prop.bowl`, `prop.ball`. Cat uchun idle/walk/eat/sleep/reaction, bola uchun idle/walk/run/pickup/carry/sit animatsiyalari kerak. Hozirgi runtime player uchun idle/walk, pet uchun idle mappingni talab qiladi; qolgan interaction animatsiyalarni task state bilan bog‘lash keyingi ish.

## Tanlash mezonlari

- Bir-biriga mos real ko‘rinish, miqyos va materiallar; birinchi qurilmada namuna bilan tekshirish.
- Skeletli qahramon, mos animatsiyalar, oyoq sirpanishi va looplarning tekshirilishi.
- Odam motionlari mushuk skeletoniga ko‘chirilmaydi. Mixamo humanoid uchun; jonivorga o‘z animatsiya paketi kerak.
- Self-contained GLB v2: tekstura/buffer ichida. Tashqi URIlar runtime oldidan rad etiladi.
- Metrlarda miqyos; foot origin, +Y up, controller kutgan forward yo‘nalishga mos export. Root-motion translatsiyasini in-place aylantirish kerak bo‘lishi mumkin.
- Muallif, aniq source URL, litsenziya/attribution va o‘yinda foydalanish huquqi manifestda.
- `residentBytes` real profilingdan keyin yangilanadi; 4K tekstura kichik GLB ichida bo‘lsa ham GPUda katta joy oladi.

## Lokal import

Manba faylni Gitdan tashqarida saqlang. Slotni assets.json da e’lon qiling. Masalan, faylingiz ichida `Idle`, `Walk`, `Run` nomli cliplar bor bo‘lsa:

```bash
npm run asset:register -- --id hero.child --file /absolute/path/child.glb --license CC-BY-4.0 --source https://example.com/actual-model --resident-mb 24 --animation-map '{"idle":"Idle","walk":"Walk","run":"Run"}'
```

Yuqoridagi URL va xotira miqdori **format namunasi**, tayyor tavsiya yoki haqiqiy model havolasi emas. O‘zingizning aniq manba/litsenziya/cliplaringizni bering. Script checksum va fayl hajmini hisoblaydi, GLBning tashqi URI va animatsiya nomlarini tekshiradi, `asset-source/models/...hash.glb` ga nusxa qo‘yadi va manifestni yangilaydi. `missing` statusini o‘zgartirish huquqiy/visual tekshiruvni avtomatik bajarib bermaydi.

`npm run dev` da `/assets/` shu staging katalogidan GET/HEAD va oddiy byte-range bilan ishlaydi. `npm run build` stagingdagi GB fayllarni dist ichiga ko‘chirmaydi. `npm run preview` faqat distni ko‘rsatadi; asset staging middleware production/previewda ishlamaydi.

## Production storage

```text
asset origin / gamenglish / releases / <release-id> /
  models/<asset-id>.<hash>.glb
  audio/<asset-id>.<hash>.mp3
  environments/...
  textures/...
content origin / releases / <content-revision> /
  index.json
  assets.json
  audio.json
  vocabulary.json
  scenes/...
  packs/...
```

Asset/source WAV/FBX/Blend Gitga kirmaydi. Registry, schema, approved source/license metadata Gitda qoladi. Katta binarylarni Git LFSga ko‘chirish ham o‘yin runtime delivery o‘rnini bosmaydi. CDN/object storage uchun aniq provayder hali sozlanmagan.

Avval hashli fayllarni upload → HEAD/size/hash/codec tekshirish → metadata upload → release indexni atomik almashtirish. Eski release indexlari va assetlari rollback davrida saqlanadi. Bir necha GB kutubxona bir fetchga birlashtirilmaydi.

## Optimallashtirish

Meshopt hozir GLTFLoaderga ulangan. Draco/KTX2 uchun Three r187 bilan mos decoder/transcoder fayllari o‘z domeningizdan beriladi; `VITE_DECODER_BASE_URL` shu directoryga qaraydi (`draco/`, `basis/`). Decoderlar katta assetdan oldin device/codec sinovidan o‘tadi. External CDN decoderga yashirin bog‘lanish yo‘q. LOD, texture atlas, instancing va mesh merging katta sahnalar kelganda real profiling bilan qo‘shiladi; hozir avtomatik optimizator mavjud deb hisoblamang.
