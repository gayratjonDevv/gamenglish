# Frontend arxitekturasi va clean code shartnomasi

Bu majburiy loyiha qoidalari. “100% mukammal” arxitektura kafolati berilmaydi: talablar, haqiqiy assetlar va qurilma o‘lchovlari kelgani sari chegaralar qayta baholanadi. Qoidalar esa kodni nazoratsiz o‘sishidan himoya qiladi.

## Qatlamlar va egalik

```text
apps/web/src/
  app/                    composition root, bootstrap, global config va sahifa joylashuvi
  features/
    curriculum/           kurs xaritasi, stage tanlash, modul kartasi
    voice/                recording playback modeli va ovoz paneli
    world/                sahna lifecycle hook, world card va game viewport
  shared/
    ui/                   Button, Surface, Notice, Disclosure, SelectField va typography
    styles/               yagona tokenlar va minimal global reset
packages/
  contracts/              schemas va transport/domain shakllari
  learning/               o‘rganish qoidalari va progress adapteri
  engine/                 asset, audio, content va Three runtime
```

App featurelarning public `index.ts`laridan foydalanadi va ular orasidagi hodisalarni bog‘laydi. Feature boshqa featurening ichki faylini ham, public API sini ham import qilmaydi. Masalan, world ovoz panelini bilmaydi; interaction hodisasini appga beradi. Shared UI engine, learning, app yoki feature import qilmaydi. Learning rendererdan mustaqil. Contracts yuqori qatlamga qaram emas.

Har bir faylning bitta asosiy o‘zgarish sababi bo‘ladi. `App.tsx` bootstrap, AudioDirector, engine, HTML va barcha stillarni bir joyda amalga oshirmaydi. Hook lifecycle/modelni boshqaradi; UI props va hodisalar bilan render qiladi.

## Hajm chegaralari

| Narsa                            | Majburiy maksimum                              |
| -------------------------------- | ---------------------------------------------- |
| TSX komponent fayli              | 180 physical qator                             |
| useXxx.ts hook fayli             | 180 physical qator                             |
| Boshqa TypeScript kod fayli      | 350 physical qator                             |
| Bitta funksiya/metod             | 120 physical qator; odatda bundan ancha kichik |
| CSS fayli                        | 250 physical qator                             |
| TSX faylidagi exported komponent | 1 ta                                           |

Qatorlar bo‘sh qator va izohlarni ham o‘z ichiga oladi. Prettier formati tekshiriladi: kodni bir qatorga siqib cheklovni aylanib o‘tish mumkin emas. Faylni `part1`, `part2` deb bo‘lish ham arxitektura emas; nomlar mas’uliyatni bildiradi.

Chegaralar executable source uchun. `package-lock.json`, tashqi JSON o‘quv ma’lumoti, transkript va Markdown dars matni komponent kodi emas. Ularni React/TS fayliga ko‘chirib qo‘yish mumkin emas. Level paketlari alohida schema va byte/count limitlari bilan nazorat qilinadi. “Generated” deb nomlangan TS fayl ham hajm qoidasidan ozod emas.

## Reuse qoidasi

1. Yangi UI yozishdan oldin `shared/ui` va tegishli feature ichidagi mavjud bloklarni tekshiring.
2. Barcha tugmalar shared Button, tanlov maydoni shared SelectField orqali. Surface, Notice, SectionHeading, Badge, Disclosure, FinePrint va Eyebrow mavjud.
3. O‘xshash ko‘rinish uchun yangi `Button2`, `NewCard`, `CustomPanel` yaratilmaydi. Aniq vazifali variant/props qo‘shiladi.
4. Bir xil presentation bir nechta joyda kerak bo‘lsa shared UI; faqat bitta soha bilimi bo‘lsa shu feature ichida qoladi. Har ikki qator uchun abstraction yoki har bitta HTML element uchun komponent yaratilmaydi.
5. Holatli side effect va render mantiqi ajratiladi. Fetch, IndexedDB va new GameEngine render body ichida bajarilmaydi.
6. Levelga alohida React komponent yaratilmaydi. Bir renderer + tasdiqlangan task shablonlari + data bilan kengaytiriladi.
7. Yetarli farq qiladigan xatti-harakatni ulkan `variant`/boolean to‘plami bilan bitta universal komponentga tiqishtirmang.

CI uzun aynan bir xil function body nusxalarini tekshiradi. O‘zgaruvchi nomi almashgan yoki mazmunan o‘xshash yechimlarni to‘liq aniqlamaydi; semantic DRY kod ko‘rigida tekshiriladi.

## Yangi feature uchun tayyor shablon

```bash
npm run feature:create -- --name inventory
npm run format
npm run check
```

Generator public index, typed props, bitta UI panel va CSS Module yaratadi. Mavjud directoryni ustidan yozmaydi. Inventory appga avtomatik qo‘shilmaydi va yangi 3D asset yaratmaydi. `templates/feature` boshlang‘ich shablon; ishlatilgach vazifaga mos kengaytiriladi.

## Kod uslubi

- Strict TypeScript; explicit any taqiqlanadi. Tashqi ma’lumot unknown sifatida olinib schema orqali tekshiriladi.
- Ko‘r-ko‘rona casts, non-null assertion yoki xatoni yutuvchi catch bilan noto‘g‘ri holatni yashirmang. Zarur assertionning old sharti tekshiriladi.
- Holat egasi bitta. Render state, audio playback va GPU resursi bir nechta komponent tomonidan mustaqil boshqarilmaydi.
- Listener, timer, async request, Audio va WebGL resurslari cleanupga ega. Unmount yoki retrydan kech kelgan natija yangi sessionni buzmaydi.
- Freym loopida React setState va keraksiz per-frame global ishlar yo‘q. Performance optimizatsiya real profiling bilan qilinadi.
- Barrel faqat public API; paket ichida hamma narsani hamma joyga qayta export qilish va circular imports yo‘q.
- Comment nima uchun qaror qilinganini aytadi; har qatorni qayta gapirib bermaydi.

## Tekshiruv va review

`npm run check` format, architecture/design guardrails, typecheck, behavior testlar, kontent va buildni bajaradi. CI shu buyruqni ishlatadi. Qoidani yumshatish alohida arxitektura qarori va sababini talab qiladi; faylga lokal disable qo‘yib yashirish yo‘li yo‘q.

Reviewer tekshiradi: mavjud shablon qayta ishlatilganmi; chegara to‘g‘rimi; state/lifecycle egasi aniqmi; maxsus xato va loading holati bormi; haqiqiy o‘quv natijasi tekshirilganmi; render/performance xavfi bormi; foydalanuvchi talabi bajarilganmi. Testlar kodni satrma-satr takrorlamaydi, xatti-harakat va muhim failure holatlarini tekshiradi.

## Tooling ajratilishi

Asosiy typecheck TypeScript 7 bilan. AST qoidalari uchun compiler API saqlangan `typescript-ast` aliasi dev dependency sifatida pin qilingan; u brauzer bundle yoki Three runtimega kirmaydi. CSS tahlili PostCSS orqali bajariladi. Ushbu vositalar umumiy ESLint/visual auditning barcha imkoniyatlarini da’vo qilmaydi; aynan hujjatdagi avtomatlashtirilgan qoidalarni tekshiradi.
