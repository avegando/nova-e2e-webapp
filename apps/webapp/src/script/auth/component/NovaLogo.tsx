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

import {ImgHTMLAttributes} from 'react';

type NovaLogoProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'srcSet'> & {
  /** full: word mark with the tag line (sign-in pages), compact: word mark without it, icon: shield with lock */
  variant?: 'full' | 'compact' | 'icon';
  width?: number;
};

const FILES = {
  full: {src: '/image/logo/novae2e-wordmark.png', large: '/image/logo/novae2e-wordmark@2x.png', ratio: 345 / 1000},
  compact: {src: '/image/logo/novae2e-wordmark-notag.png', large: '/image/logo/novae2e-wordmark-notag@2x.png', ratio: 253 / 1000},
  icon: {src: '/image/logo/novae2e-schild-frei-256.png', large: '/image/logo/novae2e-schild-frei-512.png', ratio: 1},
} as const;

/**
 * The NovaE2E logo. The image files come from apps/webapp/brand/source/logo (see bin/novae2e_logo_assets.mjs);
 * to change the logo replace the files there. Made for dark backgrounds.
 */
export const NovaLogo = ({width = 340, variant = 'full', style, alt = 'NovaE2E', ...props}: NovaLogoProps) => {
  const {src, large, ratio} = FILES[variant];
  return (
    <img
      src={src}
      srcSet={`${src} 1x, ${large} 2x`}
      width={width}
      height={Math.round(width * ratio)}
      alt={alt}
      decoding="async"
      style={{maxWidth: '100%', height: 'auto', ...style}}
      {...props}
    />
  );
};
