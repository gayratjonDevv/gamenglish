import type { MissionStory } from '@gamenglish/contracts';
import data from '../data/first-hello.json';
// Authored local content is checked structurally by TypeScript and behavior tests.
export const firstHello = data as MissionStory;
export const words = [
  ['Hello', 'Salom', 'hello-sample'],
  ['Hi', 'Do‘stona salom', 'hi-sample'],
  ['Goodbye', 'Xayr', 'goodbye-sample'],
  ['See you', 'Ko‘rishguncha', 'see-you-sample'],
  ['Good morning', 'Xayrli tong', 'morning'],
  ['Good afternoon', 'Xayrli kun', 'afternoon'],
  ['Good evening', 'Xayrli kech', 'evening'],
  ['Good night', 'Xayrli tun', 'night'],
] as const;
