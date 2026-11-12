# Kontent va 10 000+ level

## Haqiqiy holat

`curriculum.json`: Zero 48, Beginner 72, Elementary 84 = 204 mavzu outline. Notionda kelishilgan modul nomlari, old shartlari va misollar import qilingan; to‘liq so‘z banklari yoki pedagogik tasdiq hali yo‘q. O‘yin ichidagi Beginner/A1, Elementary/A2 nomlari loyiha konvensiyasi.

`packs/zero-001.json`: faqat 2 ta **draft** lesson shabloni. Draft LevelSession ochmaydi va progress bermaydi. Muallifning lessonni `published` qilishidan oldin lesson UX, ovoz, asset, rubrika va pilot tekshiruvi zarur.

## Nega sharding?

Indexda faqat pack ranges, scene refs va joriy metadata pathlari. 100 level/pack bilan 10 001 level uchun 101 kichik pack. Binary search kerakli ordinalning packini topadi. Runtime cache default 3 pack; bir level uchun barcha packs import qilinmaydi. Har bir JSON fetch 2MiB limitli, shuning uchun boy kontentda packni 100 dan kichikroq qilish kerak bo‘lishi mumkin.

Index global level ro‘yxatini saqlamaydi. Level ID va ordinal boshqa-boshqa: ordinal ketma-ket ko‘rsatish, ID doimiy save/prerequisite uchun. Nashrdan keyin eski ID qayta ishlatilmaydi. Har content release immutable paths va schemaVersion bilan. Bootstrap `index.json` qisqa TTL yoki revalidate; release ichidagi fayllar immutable.

## Mualliflik oqimi

Mavzu → kichik kommunikativ natija → old shart/lug‘at → izoh/namuna → tasks → yangi vaziyatda tekshiruv → takrorlash → audio → asset/scene bog‘lash → metodist review → pilot → publish.

Yangi mavzu avtomatik yangi so‘z kvotasi degani emas. Aktiv/tushunish/takrorlash banklari alohida. `requiredWords` keyingi leveldan **oldin** kerak; `taughtWords` shu levelda o‘rgatiladi. Birinchi darsni unda hali o‘rgatilmagan so‘z orqali bloklamang.

## Evidence

`listening`, `recall`, `speaking`, `writing` alohida. Hozirgi starter gate receptive uchun ikki mustaqil listening success, productive uchun bir recall success tekshiradi. Bir xil kanalni 30 soniya ichida takror bosish success sonini oshirmaydi. Assisted/technicalFailure mastery emas. Bu mahsulotning ishchi qoidasi, pedagogik yoki CEFR sertifikat mezoni emas.

Real o‘yinda to‘g‘ri buyumni bir marta bosishning o‘zi mustahkam bilim dalili bo‘lmaydi; tasodifiy tanlov, yordam va variantlar koordinator orqali qayd qilinadi. LevelSession faqat task ketma-ketligini tekshiradi. DOM tugma orqali “bilaman” deb progress berish yo‘q.

ProgressRepository — local atomic persistence. `markLevelComplete` past darajali adapter metodi; uni faqat koordinator barcha baholashlar yakunlangach chaqirishi kerak. Backend kelganda server mijoz natijasiga ko‘r-ko‘rona ishonmaydi.

## Validator va sinov

```bash
npm run content:validate
npm run content:release-check
npm run content:stress
```

Validator schema, duplicate IDs, references, scene targets, pack ranges, vocabulary/cue references va prerequisite cyclesni tekshiradi. Release check missing asset yoki draft bo‘lsa bloklaydi. Ovozning haqiqiy talaffuzi, modelning estetik sifati va metodik to‘liqlik avtomatik JSON validatorda tekshirilmaydi.

Stress testi 10 001 sun’iy yozuvni tekshiradi, ularni authored kursga qo‘shmaydi. Bu 10k GPU sahna, 10k foydalanuvchi yoki bir necha GBni telefonga yuklash benchmarki emas. Keyingi hajm qabul testi real packlar va real assetlar bilan alohida bajariladi.
