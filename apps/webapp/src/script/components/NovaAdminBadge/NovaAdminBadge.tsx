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

import {User} from 'Repositories/entity/User';
import {useKoSubscribableChildren} from 'Util/componentUtil';
import {t} from 'Util/localizerUtil';

/**
 * Badge next to the name of an account that the configuration marks as admin (util/novaDisplayName).
 * The drawing is the same as apps/webapp/brand/source/badge/nova-admin-badge.svg.
 */
export const NovaAdminBadge = ({user}: {user: User}) => {
  // the badge is set together with the name, so a name update re-renders it
  useKoSubscribableChildren(user, ['name']);

  if (user.novaBadge !== 'admin') {
    return null;
  }

  const label = t('novaAdminBadge');

  return (
    <span className="nova-admin-badge" title={label} aria-label={label} role="img" data-uie-name="status-nova-admin">
      <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
        <path
          fill="#22d3ee"
          d="M8 1.1l1.75 1.25 2.15-.1.6 2.05 1.75 1.25L13.5 7.6l.75 2.05-1.75 1.25-.6 2.05-2.15-.1L8 14.1l-1.75-1.25-2.15.1-.6-2.05L1.75 9.65 2.5 7.6l-.75-2.05L3.5 4.3l.6-2.05 2.15.1z"
        />
        <path
          fill="none"
          stroke="#05070a"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M5.5 7.8l1.7 1.7 3.3-3.5"
        />
      </svg>
    </span>
  );
};
