export const stages = [
  { id: 'zero', label: 'Zero', caption: 'Ilk so‘zlardan boshlaymiz', range: '0 → Pre-A1' },
  {
    id: 'beginner',
    label: 'Beginner',
    caption: 'Kundalik hayotga bir qadam',
    range: 'A1 yo‘nalishi',
  },
  {
    id: 'elementary',
    label: 'Elementary',
    caption: 'Kengroq dunyoga yo‘l',
    range: 'A2 yo‘nalishi',
  },
] as const;
export type StageId = (typeof stages)[number]['id'];
