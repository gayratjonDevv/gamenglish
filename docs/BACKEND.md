# Keyingi backend integratsiyasi

Backend hozir repoda implement qilinmagan. Dastlab bitta Spring Boot modular monolith + PostgreSQL yetarli; har modul uchun mikroservis kerak emas. Content va media CDN/object storageda, progress/auth backendda. Kelajakdagi modullar: accounts/guardian consent, learning evidence, lesson completion, content release admin.

## Taklif etilayotgan API shartnomasi

| Endpoint                                 | Vazifa                                                |
| ---------------------------------------- | ----------------------------------------------------- |
| GET /v1/content/current                  | Mos immutable content revision va index URL           |
| GET /v1/profiles/{id}/progress           | Serverdagi progress va sync cursor                    |
| POST /v1/profiles/{id}/evidence:batch    | Ko‘pi bilan 100 event; event id bo‘yicha idempotent   |
| POST /v1/profiles/{id}/level-completions | Lesson version va baholash dalillari bilan completion |
| DELETE /v1/profiles/{id}                 | Rozilik va ma’lumotlarni o‘chirish oqimi              |

Outbox `pending(100)` → jo‘natish → server accepted event IDlarini qaytaradi → faqat shular `acknowledge` qilinadi. Offline/retryda event ID o‘zgarmaydi. `profile_id + event_id` unique constraint. Client sanasi server tomonidan tekshiriladi; replay/out-of-order va lesson revision hisobga olinadi. Raw microphone recording evidence outboxga kiritilmaydi.

Client tarafdagi gate foydalanuvchiga yordam; pullik entitlement yoki rasmiy baholash xavfsizlik chegarasi emas. Progress profili login/guardian tasdiqsiz production bolalar ma’lumotini yig‘maydi. Region va yoshga oid huquqiy talablar bozor aniqlangach tekshiriladi.

Auth token, API key va upload credential VITE\_ o‘zgaruvchilariga yozilmaydi: ular brauzerga ochiq. Asset upload admin/CI credentiallari server yoki deploy secret orqali boshqariladi.
