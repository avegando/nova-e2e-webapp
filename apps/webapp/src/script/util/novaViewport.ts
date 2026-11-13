/*
 * NovaE2E
 * Copyright (C) 2026 Avegando AI Labs LLC
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see http://www.gnu.org/licenses/.
 *
 */


/*
 * Phones: when the on-screen keyboard opens, iOS (above all as a home-screen app) keeps the page height and only
 * shrinks the visible part. The visible height is written to CSS variables here; the styles in novae2e.less limit
 * the app to it, so the message field sits right above the keyboard and the last message stays in view.
 */
export function initNovaViewport(): void {
  const viewport = window.visualViewport;
  if (!viewport || typeof document === 'undefined') {
    return;
  }
  const root = document.documentElement;
  const keyboardMinHeight = 120;
  let fullHeight = Math.max(window.innerHeight, viewport.height);

  const scrollMessagesToEnd = () => {
    const list = document.getElementById('message-list');
    if (list) {
      list.scrollTop = list.scrollHeight;
    }
  };

  const apply = () => {
    if (viewport.height > fullHeight) {
      fullHeight = viewport.height;
    }
    const keyboardOpen = fullHeight - viewport.height > keyboardMinHeight;
    root.style.setProperty('--nova-vvh', `${Math.round(viewport.height)}px`);
    root.classList.toggle('nova-keyboard-open', keyboardOpen);
    if (keyboardOpen) {
      // iOS scrolls the whole page up to show the field; the app handles that itself
      if (window.scrollY !== 0 || viewport.offsetTop !== 0) {
        window.scrollTo(0, 0);
      }
      scrollMessagesToEnd();
    }
  };

  viewport.addEventListener('resize', apply);
  viewport.addEventListener('scroll', apply);
  window.addEventListener('orientationchange', () => {
    window.setTimeout(() => {
      fullHeight = Math.max(window.innerHeight, viewport.height);
      apply();
    }, 300);
  });
  document.addEventListener('focusin', event => {
    const target = event.target as HTMLElement | null;
    if (target && (target.isContentEditable || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
      window.setTimeout(apply, 350);
    }
  });
  apply();
}
