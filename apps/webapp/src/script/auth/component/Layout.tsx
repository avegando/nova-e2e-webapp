/*
 * Wire
 * Copyright (C) 2024 Wire Swiss GmbH
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

import {ReactNode} from 'react';

import {FlexBox, Link} from '@wireapp/react-ui-kit';

import {t} from 'Util/localizerUtil';

import {bodyCss, contentContainerCss, leftSectionCss} from './Layout.styles';
import {NovaBackdrop} from './NovaBackdrop';
import {NovaLogo} from './NovaLogo';

import {Config} from '../../Config';

/** Left column of the sign-in pages: logo, a short own text and the jellyfish and globe backdrop. */
export const AuthSidebar = () => {
  return (
    <div css={leftSectionCss} className="novae2e-left">
      <NovaBackdrop />
      <NovaLogo width={340} style={{maxWidth: '100%', height: 'auto'}} aria-label={t('accessibility.logo.wire')} />
      <div css={{margin: '2.2rem 0 0'}}>
        <span className="novae2e-side-head">{t('layoutSidebarHeader')}</span>
        <span className="novae2e-side-text">{t('layoutSidebarContent')}</span>
        <div css={{marginTop: '0.9rem'}}>
          <Link href={Config.getConfig().URL.WEBSITE_BASE} css={{fontWeight: 600, textDecoration: 'underline'}}>
            {t('layoutSidebarLink')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export const Layout = ({children}: {children: ReactNode}) => {
  return (
    <FlexBox css={bodyCss}>
      <AuthSidebar />
      <div css={contentContainerCss}>{children}</div>
    </FlexBox>
  );
};
