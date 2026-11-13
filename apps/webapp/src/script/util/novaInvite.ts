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
 * NovaE2E: personal invitation link, https://<web app>/?connect=<username>.
 * The name is checked strictly, remembered for a day (so it survives sign-in, registration and a reload) and the
 * address bar is cleaned. After the app has started, the profile of that person is opened with its "Connect" button.
 * Nothing is sent without a tap of the user.
 */
const STORAGE_KEY = 'novae2e.invite';
const MAX_AGE = 24 * 60 * 60 * 1000;
const HANDLE_PATTERN = /^[a-z0-9_.-]{2,256}$/;
const PARAMETER = 'connect';

export function normalizeInviteHandle(value: string | null | undefined): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const handle = value.trim().replace(/^@/, '').toLowerCase();
  return HANDLE_PATTERN.test(handle) ? handle : undefined;
}

/** Call once at page start: takes the name out of the address and remembers it. */
export function captureInviteFromUrl(): void {
  try {
    const params = new URLSearchParams(window.location.search);
    if (!params.has(PARAMETER)) {
      return;
    }
    const handle = normalizeInviteHandle(params.get(PARAMETER));
    params.delete(PARAMETER);
    const rest = params.toString();
    window.history.replaceState(null, '', `${window.location.pathname}${rest ? `?${rest}` : ''}${window.location.hash}`);
    if (handle) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({at: Date.now(), handle}));
    }
  } catch {
    // no storage or no history: the link then simply opens the app
  }
}

/** Returns the remembered name once (and forgets it). */
export function takePendingInvite(): string | undefined {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return undefined;
    }
    window.localStorage.removeItem(STORAGE_KEY);
    const {at, handle} = JSON.parse(raw) as {at?: number; handle?: string};
    if (typeof at !== 'number' || Date.now() - at > MAX_AGE) {
      return undefined;
    }
    return normalizeInviteHandle(handle);
  } catch {
    return undefined;
  }
}

export function buildInviteLink(handle?: string): string {
  const safeHandle = normalizeInviteHandle(handle);
  return safeHandle ? `${window.location.origin}/?${PARAMETER}=${encodeURIComponent(safeHandle)}` : window.location.origin;
}
