# Qarorlar va keyingi bosqichlar

## ADR-001: to‘g‘ridan-to‘g‘ri Three.js runtime

User tayyor GLBlar bilan Three.js o‘yini so‘radi. UI uchun React, real-time lifecycle uchun plain Three ishlatildi. Renderer mutationlari React rerenderiga bog‘lanmaydi. R3F majburiy emas; kelajakda qo‘shish resurs ownershipini qayta ko‘rib chiqishni talab qiladi.

## ADR-002: pin va yangilash

Three r187 + mos types, exact npm versiyalari va lockfile. “Eng stabil versiya” mutlaq mahsulot xususiyati emas. Yangilash alohida branchda migration guide, yangi/old GLB, shader/material, decoder, animation, bundle va device checks bilan. Avtomatik caret/tilde yoki CDN latest importi yo‘q.

## ADR-003: missing contentga halol munosabat

User yasama modellarni taqiqladi. Shu sababli starter screen asset tayyorligini ko‘rsatadi; blank dunyoni tayyor o‘yin deb sotmaydi. Real assetni tanlash, huquqini tekshirish va import alohida ish. Ovoz ham foydalanuvchi yozuvlaridan; yashirin TTS yo‘q.

## ADR-004: katta o‘yin — katta initial bundle emas

Manifests va bounded packs. Modellar tashqi asset origin, source masters Gitdan tashqarida. Bir level komponenti emas, data-driven task. Hozir monorepo uch library bilan; server mikroservis va og‘ir ECS infratuzilmasi hali kerak emas.

## Keyingi ishlar

1. Bir xil sifatdagi bola/cat/home/bowl/ball paketini tanlash va litsenziyani tekshirish.
2. Model import, animation mapping, real transform va collision authoring.
3. Birinchi 5 cue uchun 10 ta uz/en ovoz yozuvini import.
4. Z001–Z006 ning to‘liq lug‘at, izoh, task variants va rubrikalarini yozish.
5. Lesson koordinator, HUD, audio cue, interaction va evidence saqlashni bir vertical slicega ulash.
6. Buyum ushlash va pet interaction animatsiyalarini modelga mos bog‘lash.
7. Bolalar bilan pilot, real-device profiling; so‘ng published level va release check.
8. Packlar bo‘yicha kontent ishlab chiqarish, sync/backend, offline va hajm benchmarklari.

Qolgan 10k levelni avtomatik ko‘paytirish orqali ta’lim sifati paydo bo‘lmaydi. Har template variant maqsadni o‘lchashi va tegishli kontent tekshiruvidan o‘tishi kerak.
