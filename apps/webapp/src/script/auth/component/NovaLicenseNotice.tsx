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

import {Config} from '../../Config';

/**
 * Licence notice, shown in one place only: Settings, About. The source link comes from the
 * configuration value URL_SOURCE_CODE; without it only the text is shown.
 */
export const NovaLicenseNotice = ({className = 'novae2e-license'}: {className?: string}) => {
  const config = Config.getConfig();
  const sourceUrl = config.URL.SOURCE_CODE;
  return (
    <p className={className} data-uie-name="novae2e-license-notice">
      <span>
        {config.BRAND_NAME} is based on the open-source Wire web app, © Wire Swiss GmbH, licensed under GPL-3.0.
      </span>
      {sourceUrl ? (
        <>
          {' '}
          <a href={sourceUrl} target="_blank" rel="noopener noreferrer">
            Source code
          </a>
        </>
      ) : null}
    </p>
  );
};
