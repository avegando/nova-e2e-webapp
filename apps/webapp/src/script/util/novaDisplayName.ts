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

import {Config} from '../Config';

/**
 * Display name and badge for single accounts, taken from the deploy-time value NOVA_DISPLAY_NAMES
 * (JSON, key "<user id>@<domain>"). Only the presentation in this app changes: the name stored on the
 * server, the handle and the search on the server stay as they are. Accounts without an entry are untouched.
 */
export interface NovaDisplayOverride {
  name?: string;
  badge?: 'admin';
}

const MAX_NAME_LENGTH = 128;
let overrides: Map<string, {domain: string; override: NovaDisplayOverride}> | undefined;

const readOverrides = () => {
  if (overrides) {
    return overrides;
  }
  overrides = new Map();
  try {
    const raw = Config.getConfig().NOVA_DISPLAY_NAMES;
    const data: unknown = raw ? JSON.parse(raw) : {};
    if (data && typeof data === 'object') {
      for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
        if (!value || typeof value !== 'object') {
          continue;
        }
        const [id, domain = ''] = key.trim().toLowerCase().split('@');
        const {name, badge} = value as {name?: unknown; badge?: unknown};
        const cleanName = typeof name === 'string' ? name.trim().slice(0, MAX_NAME_LENGTH) : '';
        if (id) {
          overrides.set(id, {
            domain,
            override: {name: cleanName || undefined, badge: badge === 'admin' ? 'admin' : undefined},
          });
        }
      }
    }
  } catch {
    overrides = new Map();
  }
  return overrides;
};

export const getNovaDisplayOverride = (id?: string, domain?: string | null): NovaDisplayOverride | undefined => {
  if (!id) {
    return undefined;
  }
  const entry = readOverrides().get(id.toLowerCase());
  if (!entry) {
    return undefined;
  }
  const sameDomain = !entry.domain || !domain || entry.domain === domain.toLowerCase();
  return sameDomain ? entry.override : undefined;
};
