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

/**
 * Look of all sign-in pages: black base, white and silver, one cyan accent, smoked glass for fields and buttons.
 * Only colours and surfaces are set here; the form logic and layout of the pages stay untouched.
 */
export const novaAuthStyles = `
/* NovaE2E sign-in pages: black base, white and silver, one cyan accent. Smoked glass for fields and buttons. */
html, body { background: #040506 !important; }
.novae2e-auth { background: radial-gradient(60% 46% at 70% 18%, rgba(255,255,255,.05), transparent 72%), radial-gradient(40% 34% at 96% 88%, rgba(34,211,238,.045), transparent 70%), #040506 !important; color: #eef2f5; }
.novae2e-right, .novae2e-right :is(p, span, label, h1, h2, h3, h4, div, li, b, strong, small, legend) { color: #eef2f5 !important; }
.novae2e-right label { color: #c9d2da !important; }
.novae2e-right a, .novae2e-right a * { color: #22d3ee !important; }
.novae2e-right a:focus-visible, .novae2e-right button:focus-visible { outline: 2px solid #22d3ee !important; outline-offset: 3px; border-radius: 8px; }
.novae2e-right [data-uie-name="error-message"], .novae2e-right [data-uie-name="error-message"] *, .novae2e-right [role="alert"], .novae2e-right [role="alert"] * { color: #ffa3a3 !important; }
.novae2e-right button svg path, .novae2e-right button svg circle, .novae2e-right button svg rect { fill: #e3e9ee; }
/* fields: dark grey with a visible silver edge, light grey placeholder. Same colours as the base rule in the page head
   (page/auth.ejs), which also keeps them dark in Safari and when the browser fills them in. Here only shape and focus. */
.novae2e-right input:not([type="checkbox"]):not([type="radio"]), .novae2e-right textarea, .novae2e-right select {
  background: #1a1d22 !important; color: #f2f4f7 !important; -webkit-text-fill-color: #f2f4f7 !important; caret-color: #22d3ee;
  border-radius: 14px !important; border: 1px solid rgba(200,208,216,.42) !important; box-shadow: inset 0 1px 0 rgba(255,255,255,.06), 0 10px 26px rgba(0,0,0,.45) !important; -webkit-appearance: none; appearance: none; color-scheme: dark; }
.novae2e-right input::placeholder, .novae2e-right textarea::placeholder { color: #aab4be !important; -webkit-text-fill-color: #aab4be !important; opacity: 1 !important; }
.novae2e-right input:not([type="checkbox"]):not([type="radio"]):focus, .novae2e-right input:not([type="checkbox"]):not([type="radio"]):focus-visible {
  border-color: #1ba6bd !important; box-shadow: inset 0 1px 0 rgba(255,255,255,.06), 0 0 0 3px rgba(27,166,189,.30) !important; outline: none !important; }
.novae2e-right input:-webkit-autofill, .novae2e-right input:-webkit-autofill:hover, .novae2e-right input:-webkit-autofill:focus, .novae2e-right input:autofill {
  -webkit-text-fill-color: #f2f4f7 !important; caret-color: #22d3ee; -webkit-box-shadow: 0 0 0 1000px #1a1d22 inset !important; box-shadow: 0 0 0 1000px #1a1d22 inset !important; transition: background-color 99999s ease-out; }
/* main button: always a muted cyan with dark text. Disabled: a little darker, still readable. */
.novae2e-right button[type="submit"] { border-radius: 14px !important; border: 1px solid rgba(255,255,255,.35) !important; background: #1ba6bd !important; box-shadow: inset 0 1px 0 rgba(255,255,255,.28), 0 12px 30px rgba(0,0,0,.5) !important; transition: transform 140ms cubic-bezier(.23,1,.32,1), background-color 160ms ease; }
.novae2e-right button[type="submit"], .novae2e-right button[type="submit"] * { color: #031316 !important; font-weight: 600; }
.novae2e-right button[type="submit"]:hover:not(:disabled) { background: #2bb9d0 !important; }
.novae2e-right button[type="submit"]:active:not(:disabled) { transform: scale(.98); }
.novae2e-right button[type="submit"]:disabled { background: #1a94a8 !important; border-color: rgba(255,255,255,.22) !important; box-shadow: inset 0 1px 0 rgba(255,255,255,.28), 0 10px 24px rgba(0,0,0,.45) !important; opacity: 1 !important; cursor: not-allowed; }
.novae2e-right button[type="submit"]:disabled, .novae2e-right button[type="submit"]:disabled * { color: #021013 !important; }
@media (prefers-reduced-motion: reduce) { .novae2e-right button[type="submit"] { transition: none; } }
/* cards, dialogs and menus on the sign-in pages: dark grey, never white */
.novae2e-right [data-uie-name="account-type-option"], .novae2e-right [role="dialog"], .novae2e-right [role="listbox"], .novae2e-right [role="menu"], .novae2e-right [role="tooltip"] { background: #171a1f !important; color: #eef2f5 !important; border-color: rgba(200,208,216,.28) !important; }
.novae2e-right button:not([type="submit"]) { color: #eef2f5; }
/* left side */
.novae2e-left { background: #000 !important; overflow: hidden; border-right: 1px solid rgba(214,224,234,.10); }
.novae2e-left canvas.novae2e-backdrop { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
.novae2e-left > *:not(canvas) { position: relative; z-index: 1; }
.novae2e-left a, .novae2e-left a * { color: #22d3ee !important; }
/* checkbox: glass box, cyan when ticked */
.novae2e-right input[type="checkbox"] + label::before { background: rgba(255,255,255,.07) !important; border: 1.5px solid rgba(214,224,234,.62) !important; box-shadow: inset 0 1px 0 rgba(255,255,255,.18) !important; }
.novae2e-right input[type="checkbox"]:checked + label::before { background-color: #22d3ee !important; border-color: #22d3ee !important; }
.novae2e-right input[type="checkbox"]:focus-visible + label::before { box-shadow: 0 0 0 3px rgba(34,211,238,.3) !important; }
.novae2e-auth .novae2e-left .novae2e-side-head { display: block; color: #fff !important; font-weight: 600; font-size: 1.75rem; line-height: 2.1rem; letter-spacing: -.01em; }
.novae2e-auth .novae2e-left .novae2e-side-text { display: block; margin-top: .6rem; color: #c3ccd4 !important; line-height: 1.5rem; max-width: 22rem; }
/* licence notice: small, calm, always reachable. Placed at the bottom edge without taking part in the page layout. */
.novae2e-auth { position: relative; }
.novae2e-license { position: absolute; right: 18px; bottom: 12px; z-index: 2; max-width: min(46rem, 56vw); margin: 0; font-size: 11.5px; line-height: 1.45; text-align: right; color: #9aa5af !important; }
.novae2e-right .novae2e-license, .novae2e-right .novae2e-license span { color: #9aa5af !important; }
/* phones: the notice is part of the page flow, in its own row below the content, never on top of a button */
@media (max-width: 720px) {
  .novae2e-auth { flex-wrap: wrap; }
  .novae2e-auth > *:not(.novae2e-license) { flex: 1 1 100%; min-width: 0; max-width: 100%; }
  .novae2e-license { position: static; flex: 0 0 100%; width: 100%; max-width: none; box-sizing: border-box; margin: 0; padding: 22px 16px 18px; text-align: center; font-size: 11px; }
}
/* the box around a field has no light background of its own */
.novae2e-right div:has(input:not([type="checkbox"]):not([type="radio"])) { background: transparent !important; background-color: transparent !important; box-shadow: none !important; }
`;
