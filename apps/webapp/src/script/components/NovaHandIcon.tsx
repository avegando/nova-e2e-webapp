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


/** Raised hand, drawn as a plain icon (used where a participant raises a hand in a call). */
export const NovaHandIcon = ({size = 16}: {size?: number}) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" data-uie-name="icon-hand-raised">
    <rect x="3.1" y="3.9" width="2" height="7" rx="1" />
    <rect x="5.7" y="1.9" width="2" height="8.6" rx="1" />
    <rect x="8.3" y="2.5" width="2" height="8" rx="1" />
    <rect x="10.9" y="4.3" width="2" height="6.4" rx="1" />
    <path d="M3.1 9.4h9.8v1.3a4.3 4.3 0 0 1-4.3 4.3H7.4a4.3 4.3 0 0 1-4.3-4.3z" />
    <rect x="0.9" y="8.1" width="2.1" height="4.7" rx="1.05" transform="rotate(-28 2 10.4)" />
  </svg>
);
