import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const evidence = fileURLToPath(new URL('./', import.meta.url));
const baseURL = process.env.AUTH_EVIDENCE_URL ?? 'http://[::1]:5173';
const browser = await chromium.launch({
  executablePath: '/run/current-system/sw/bin/brave',
  headless: true,
});
const results = [];
const interactions = [];
mkdirSync(evidence, { recursive: true });
try {
  for (const theme of ['shelf-light', 'oxford-dark']) {
    for (const width of [320, 390, 768, 1280]) {
      const height = width === 320 ? 640 : width === 390 ? 844 : 900;
      const context = await browser.newContext({ viewport: { width, height } });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('console', (message) => {
        // The existing app has no favicon; keep auth resource failures visible.
        if (message.type() === 'error' && !message.location().url.endsWith('/favicon.ico')) {
          errors.push(message.text());
        }
      });
      await page.addInitScript((value) => localStorage.setItem('quire-theme', value), theme);
      await page.goto(baseURL);
      await page.locator('.auth-book').waitFor();
      await page.evaluate(() => document.fonts.ready);
      for (const mode of ['signin', 'signup']) {
        if (mode === 'signup') await page.locator('.auth-switch').click();
        await page.evaluate(() => window.scrollTo(0, 0));
        const layout = await page.evaluate(() => {
          const box = (selector) => {
            const element = document.querySelector(selector);
            const rect = element.getBoundingClientRect();
            const style = getComputedStyle(element);
            return {
              x: rect.x, y: rect.y, width: rect.width, height: rect.height,
              right: rect.right, bottom: rect.bottom, display: style.display,
              paddingTop: style.paddingTop, paddingBottom: style.paddingBottom,
            };
          };
          const book = document.querySelector('.auth-book');
          const cover = document.querySelector('.auth-reading-cover');
          const style = getComputedStyle(cover);
          const edge = getComputedStyle(book, '::before');
          const fold = getComputedStyle(book, '::after');
          const selectors = ['.auth-running-head', '.auth-intro', '.auth-mode-title', '.auth-form', '.primary', '.auth-footer', '.auth-book-title', '.auth-book-author', '.auth-reading-streak', '.auth-reading-pages', '.auth-record-note'];
          const controls = [...document.querySelectorAll('.auth-reveal, .primary, .auth-forgot, .auth-switch, .auth-demo-link')].map((el) => ({ text: el.textContent.trim(), ...el.getBoundingClientRect().toJSON() }));
          return {
            scrollWidth: document.documentElement.scrollWidth,
            book: box('.auth-book'), verso: box('.auth-verso'), recto: box('.auth-recto'),
            cta: box('.primary'), cover: box('.auth-reading-cover'),
            demo: box('.auth-demo'), foot: box('.auth-page-foot'),
            folio: box('.auth-folio'), rectoFolio: box('.auth-recto-folio'),
            label: box('.auth-shelf-label'),
            coverStyle: { shadow: style.boxShadow, transform: style.transform, border: style.borderTopWidth },
            edge: { left: edge.borderLeftWidth, right: edge.borderRightWidth, top: edge.borderTopWidth, bottom: edge.borderBottomWidth },
            fold: { display: fold.display, top: fold.top, bottom: fold.bottom, image: fold.backgroundImage },
            rhythm: selectors.map((selector) => ({ selector, offset: box(selector).y - box('.auth-book').y })),
            streak: document.querySelectorAll('.auth-reading-streak li').length,
            labelText: document.querySelector('.auth-shelf-label').textContent,
            labelFont: getComputedStyle(document.querySelector('.auth-shelf-label')).fontSize,
            controls,
          };
        });
        assert.equal(layout.scrollWidth, width);
        assert.equal(layout.streak, 7);
        assert.equal(layout.coverStyle.shadow, 'none');
        assert.equal(layout.coverStyle.transform, 'none');
        assert.equal(layout.coverStyle.border, '1px');
        for (const control of layout.controls) assert.ok(control.height >= 44, control.text);
        const orderedControls = layout.controls.slice().sort((a, b) => a.y - b.y);
        for (let i = 1; i < orderedControls.length; i++) {
          const previous = orderedControls[i - 1];
          const current = orderedControls[i];
          if (current.y >= previous.bottom) assert.ok(current.y - previous.bottom >= 8, `${previous.text} / ${current.text}`);
        }
        if (width < 760) {
          assert.equal(layout.cover.width, 64);
          assert.equal(layout.rectoFolio.display, 'none');
          assert.equal(layout.fold.display, 'none');
          assert.equal(layout.labelText, 'FROM YOUR SHELF');
          assert.equal(layout.labelFont, '10px');
          assert.ok(layout.recto.y >= layout.demo.bottom);
          assert.ok(layout.recto.bottom <= layout.foot.y);
          assert.ok(layout.recto.x > layout.book.x);
          assert.ok(layout.recto.right < layout.book.right);
          if (width === 320) assert.ok(layout.cta.bottom <= 640, `${mode} action below viewport`);
        } else {
          assert.equal(layout.cover.width, 180);
          assert.equal(layout.verso.width, layout.recto.width);
          assert.equal(layout.verso.y, layout.recto.y);
          assert.equal(layout.verso.height, layout.recto.height);
          assert.equal(layout.verso.paddingTop, layout.verso.paddingBottom);
          assert.equal(layout.recto.paddingTop, layout.recto.paddingBottom);
          assert.equal(layout.verso.paddingTop, layout.recto.paddingTop);
          assert.equal(layout.folio.bottom, layout.rectoFolio.bottom);
          assert.deepEqual(layout.edge, { left: '1px', right: '1px', top: '0px', bottom: '0px' });
          assert.equal(layout.fold.top, '0px');
          assert.equal(layout.fold.bottom, '0px');
          assert.match(layout.fold.image, /linear-gradient/);
          for (const item of layout.rhythm) assert.equal(item.offset % 8, 0, `${item.selector}: ${item.offset}`);
        }
        await page.mouse.move(0, 0);
        await page.locator(':focus').evaluateAll((nodes) => nodes.forEach((node) => node.blur()));
        await page.screenshot({ path: `${evidence}/${theme}-${mode}-${width}.png`, fullPage: true });
        if (width === 320 && mode === 'signin') {
          await page.screenshot({ path: `${evidence}/${theme}-signin-320-viewport.png` });
        }
        results.push({ theme, width, height, mode, layout });
      }
      if (width === 1280) {
        await page.goto(baseURL);
        await page.evaluate(() => document.fonts.ready);
        await page.keyboard.press('Tab');
        assert.equal(await page.locator('input[name="email"]').evaluate((el) => el === document.activeElement), true);
        await page.screenshot({ path: `${evidence}/${theme}-focus-1280.png`, fullPage: true });
      }
      if (width === 320 || width === 1280) {
        await page.goto(baseURL);
        const controls = page.locator('input, .auth-reveal, .primary, .auth-forgot, .auth-switch, .auth-demo-link');
        for (const control of await controls.all()) {
          await page.keyboard.press('Tab');
          assert.equal(await control.evaluate((el) => el === document.activeElement), true);
          const focus = await control.evaluate((el) => {
            const probe = document.createElement('span');
            probe.style.color = 'var(--accent)';
            document.body.append(probe);
            const accent = getComputedStyle(probe).color;
            probe.remove();
            const style = getComputedStyle(el);
            return { accent, color: style.outlineColor, width: style.outlineWidth };
          });
          assert.equal(focus.width, '2px');
          assert.equal(focus.color, focus.accent);
        }
        for (const control of await controls.all()) {
          await control.hover();
          const hover = await control.evaluate((el) => {
            const style = getComputedStyle(el);
            return {
              accent: getComputedStyle(document.documentElement).getPropertyValue('--accent').trim(),
              tag: el.tagName, primary: el.classList.contains('primary'),
              border: style.borderBottomColor, decoration: style.textDecorationColor,
              outline: style.outlineColor,
            };
          });
          const accent = await control.evaluate((_el, value) => {
            const probe = document.createElement('span');
            probe.style.color = value;
            document.body.append(probe);
            const color = getComputedStyle(probe).color;
            probe.remove();
            return color;
          }, hover.accent);
          assert.equal(hover.tag === 'INPUT' ? hover.border : hover.primary ? hover.outline : hover.decoration, accent);
          await page.mouse.down();
          const active = await control.evaluate((el) => {
            const style = getComputedStyle(el);
            return { primary: el.classList.contains('primary'), tag: el.tagName, offset: style.outlineOffset, decoration: style.textDecorationStyle };
          });
          if (active.primary) assert.equal(active.offset, '0px');
          else if (active.tag !== 'INPUT') assert.equal(active.decoration, 'double');
          await page.mouse.move(0, 0);
          await page.mouse.up();
        }
        await page.getByRole('button', { name: 'Show', exact: true }).click();
        assert.equal(await page.locator('input[name="password"]').getAttribute('type'), 'text');
        await page.getByRole('button', { name: 'Hide', exact: true }).click();
        assert.equal(await page.locator('input[name="password"]').getAttribute('type'), 'password');
        await page.getByRole('button', { name: 'Forgot your password?' }).click();
        assert.match(await page.getByRole('alert').textContent(), /Enter your email address first/);
        await page.locator('.auth-switch').click();
        assert.equal(await page.locator('#auth-title').evaluate((el) => el === document.activeElement), true);
        await page.getByLabel('Password', { exact: true }).fill('Library-card42');
        await page.getByLabel('Repeat', { exact: true }).fill('Other-card42');
        assert.equal(await page.locator('.primary').isDisabled(), true);
        await page.getByLabel('Repeat', { exact: true }).fill('Library-card42');
        assert.equal(await page.locator('.primary').isEnabled(), true);
        interactions.push({ theme, width, result: 'PASS: keyboard order and accent focus, hover and active on all seven controls; Show/Hide, reset guidance, mode heading focus, mismatch/recovery.' });
      }
      assert.deepEqual(errors, []);
      await context.close();
    }
  }
  writeFileSync(`${evidence}/layout-checks.json`, `${JSON.stringify(results, null, 2)}\n`);
  writeFileSync(`${evidence}/interaction-checks.json`, `${JSON.stringify(interactions, null, 2)}\n`);
  console.log(`PASS: ${results.length} mode/theme/viewport layouts; 20 screenshots; mobile CTA, inset, control gaps, desktop margins, folios, fold, cover and 8px rhythm.`);
} finally {
  await browser.close();
}
