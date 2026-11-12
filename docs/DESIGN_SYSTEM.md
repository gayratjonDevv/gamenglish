# Dizayn tizimi: majburiy qoidalar

Maqsad — o‘yin va o‘quv interfeysining turli joylari bir xil mahsulotga tegishli ekanini his qildirish. O‘yin dunyosi tayyor sifatli GLB assetlardan; menyu, HUD va o‘quv panellari shu tizimdan foydalanadi.

## Tokenlar yagona manba

`apps/web/src/shared/styles/tokens.css` — rang, o‘lcham, font va qatlam qiymatlarining yagona egasi. Hozirgi ko‘rinishdan olingan qiymatlar markazlashtirildi; ularning yangi turini har feature o‘zi qo‘sha olmaydi. Scale-ni kengaytirish umumiy dizayn qarori sifatida qilinadi.

- Ranglar semantik: text-primary, text-secondary, brand, surface, border, focus, error va boshqalar.
- Padding, margin, gap, font-size, border radius va fixed dimension mavjud token orqali.
- `#hex`, rgb/hsl va tasodifiy px feature CSS ichida yo‘q.
- CSS custom propertylar faqat token faylida belgilanadi.
- Media-query breakpointlar hozir 700px va 950px. CSS custom property media conditionda ishlamagani uchun bu ikki literal istisno; yangisi review talab qiladi.
- `transparent`, `inherit`, `currentColor`, unitless ratio va foizlar tabiiy vazifasida mumkin.
- 3D dunyo yoritishi va GLB materiali UI palette bilan almashtirilmaydi; ular alohida scene/art ma’lumotidir.

## Komponentlardan foydalanish

| Element             | Ishlatiladigan shablon                       |
| ------------------- | -------------------------------------------- |
| Tugma               | Button: default/primary, disabled, fullWidth |
| Panel yuzasi        | Surface: default/soft                        |
| Bo‘lim sarlavhasi   | SectionHeading                               |
| Status              | Badge; faqat rangga tayanmaydigan matn       |
| Loading/xato xabari | Notice: info/error                           |
| Tanlov              | SelectField: label + id + native select      |
| Ochiladigan bo‘lim  | Disclosure: semantic details/summary         |
| Izoh/yuqori yorliq  | FinePrint / Eyebrow                          |

Yangi tugma uchun feature ichida raw button, alohida global button stillari yoki nusxa komponent yozilmaydi. Vizual variant shared komponentda belgilanadi; biznes ma’nosi featurening o‘zida qoladi.

## CSS egaligi

Feature va komponent stillari CSS Modules. Global `base.css` faqat root/reset va umumiy focus/reduced-motionga tegishli. Global `h2`, `aside`, `button`ga feature o‘zgarish kiritmaydi. Yuqori specificity, ID selector, inline style va !important bilan urushilmaydi. Bir selectorni shu scope ichida takrorlab qo‘ymaslik kerak.

App layouti `app.module.css`; har feature o‘z UI moduliga ega. Uzoq umumiy `styles.css`ga hamma narsani yig‘ish taqiqlanadi. CSS fayl 250 qatordan oshsa mas’uliyatga ko‘ra bo‘linadi.

## O‘qish va accessibility

Asosiy body matni odatda 15–16px; mayda yordamchi yozuv kamida 12px. Bolaga topshiriq va asosiy dialog yanada yirik, qisqa va ovoz bilan beriladi. Brauzer zoomini cheklash yo‘q. Oddiy matn uchun kontrast WCAG AA maqsadida tekshiriladi; token borligi kontrast avtomatik tekshirilganini bildirmaydi.

Shared Buttonning minimal balandligi 44px. Touch maqsadlar bir-biriga yopishmaydi. Focus-visible ko‘rinadi. Icon-only tugmaning accessible nomi bor. Stage tabs arrow/Home/End bilan ishlaydi; tanlangan tab va panel ARIA bilan bog‘langan. Form maydonida label bo‘ladi. Xato faqat qizil rang bilan berilmaydi.

Har interaktiv oqimda zarur loading, empty/missing, error/retry, disabled va ready holati bor. Missing assetning o‘rniga yasama vizual qo‘yilmaydi. Haqiqiy o‘yin tayyor bo‘lmaguncha UI uni tayyor deb ko‘rsatmaydi.

## Motion va ovoz

Motion holat o‘zgarishini tushuntiradi; matn o‘qishga xalal bermaydi. Reduced-motion sozlamasi hurmat qilinadi. Ovoz default holda foydalanuvchi harakati bilan boshlanadi, stop va subtitr bor. Ovoz va rang biror ma’lumotning yagona kanali bo‘lmaydi.

## Yangi ekran uchun ketma-ketlik

Avval maqsad va mavjud layout → mavjud shared komponentlar → kerakli tokenlar → typed view model → responsive va keyboard holatlar → asset/audio readiness → haqiqiy qurilmada tekshirish. Yangi UI kit yoki tasodifiy ikonka kutubxonasi bir feature uchun mustaqil qo‘shilmaydi.

## Avtomatik nazorat chegarasi

CI source hajmi, import chegaralari, raw button/select, inline style, token literal va !importantni tekshiradi. Haqiqiy kontrast, tushunarlilik, vizual bir xillik, o‘quvchining qiziqishi va semantic duplication inson ko‘rigi/pilotni ham talab qiladi. Hozir browser visual tekshiruvi bajarilgan deb da’vo qilinmaydi.
