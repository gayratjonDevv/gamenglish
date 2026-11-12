import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { App } from '../apps/web/src/app/App';

it('renders the bootstrap shell without constructing WebGL or requiring browser storage', () => {
  const html = renderToStaticMarkup(createElement(App));
  expect(html).toContain('Modellar tayyorlanmoqda');
  expect(html).toContain('Birinchi salom');
  expect(html).toContain('<canvas');
  expect(html).not.toContain('speechSynthesis');
});
