import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { App } from '../apps/web/src/app/App';

it('renders the bootstrap shell without constructing WebGL or requiring browser storage', () => {
  const html = renderToStaticMarkup(createElement(App));
  expect(html).toContain('O‘quv xaritasi yuklanmoqda');
  expect(html).toContain('Sahnani ochish');
  expect(html).toContain('disabled');
});
