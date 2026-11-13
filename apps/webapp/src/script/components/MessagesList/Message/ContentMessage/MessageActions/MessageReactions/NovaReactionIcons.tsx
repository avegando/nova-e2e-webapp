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


const common = {
  'aria-hidden': true,
  fill: 'none',
  height: 18,
  stroke: 'currentColor',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  strokeWidth: 1.7,
  viewBox: '0 0 20 20',
  width: 18,
};

/** Thumbs up, as a line icon for the quick reaction bar. */
export const NovaThumbIcon = () => (
  <svg {...common} data-uie-name="icon-reaction-thumb">
    <path d="M6.2 9.2 9.4 3c1.2 0 2.1.9 2.1 2.1v2.6h3.9c1 0 1.8.9 1.6 1.9l-1 5.2c-.2.8-.9 1.4-1.7 1.4H6.2" />
    <path d="M6.2 16.2H4.1c-.8 0-1.4-.6-1.4-1.4v-4.2c0-.8.6-1.4 1.4-1.4h2.1z" />
  </svg>
);

/** Heart, as a line icon for the quick reaction bar. */
export const NovaHeartIcon = () => (
  <svg {...common} data-uie-name="icon-reaction-heart">
    <path d="M10 16.5S3 12.6 3 7.7A3.7 3.7 0 0 1 10 6a3.7 3.7 0 0 1 7 1.7c0 4.9-7 8.8-7 8.8z" />
  </svg>
);
