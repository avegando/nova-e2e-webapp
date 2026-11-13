/*
 * Wire
 * Copyright (C) 2018 Wire Swiss GmbH
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

import {useEffect, useRef, useState} from 'react';

import Cookies from 'js-cookie';

import {Runtime} from '@wireapp/commons';

import {TIME_IN_MILLIS} from 'Util/timeUtil';
import {createUuid} from 'Util/uuid';

const CONFIG = {
  COOKIE_NAME: 'app_opened',
  INTERVAL: TIME_IN_MILLIS.SECOND,
  /** NovaE2E: a marker that has not been refreshed for this long belongs to a page that no longer runs. */
  STALE_AFTER: TIME_IN_MILLIS.SECOND * 5,
};

type InstanceMarker = {appInstanceId?: string; seenAt?: number};

function readMarker(): InstanceMarker | undefined {
  const cookieValue = Cookies.get(CONFIG.COOKIE_NAME);
  if (!cookieValue) {
    return undefined;
  }
  try {
    return JSON.parse(cookieValue);
  } catch {
    return undefined;
  }
}

function writeMarker(instanceId: string) {
  Cookies.set(CONFIG.COOKIE_NAME, JSON.stringify({appInstanceId: instanceId, seenAt: Date.now()}), {sameSite: 'Lax'});
}

/*
 * NovaE2E: phones drop a page without a clean unload (a file opens in its place, the system frees memory). The marker
 * of that page then stayed behind and the next start took it for a second tab and went to the sign-in page. The running
 * page now refreshes its marker every second; a marker that is not refreshed any more is ignored at the next start.
 */
function isStale(marker: InstanceMarker) {
  // a marker without a time stamp was written by an earlier version of the app and is never refreshed
  return typeof marker.seenAt !== 'number' || Date.now() - marker.seenAt > CONFIG.STALE_AFTER;
}

function isRunningInstance(instanceId?: string) {
  if (Runtime.isDesktopApp()) {
    return true;
  }
  const marker = readMarker();
  if (instanceId === undefined) {
    // a page that is not registered (yet): nobody else runs when there is no marker or only a leftover one
    return !marker || isStale(marker);
  }
  // a registered page: a missing marker is not another instance (restored page, cleared cookie)
  return !marker || marker.appInstanceId === instanceId;
}

function poll(instanceIdRef: {current: string | undefined}, onNewInstance: () => void) {
  const checkSingleInstance = (): void => {
    if (!isRunningInstance(instanceIdRef.current)) {
      onNewInstance();
    } else if (instanceIdRef.current) {
      writeMarker(instanceIdRef.current);
    }
  };
  const interval = window.setInterval(checkSingleInstance, CONFIG.INTERVAL);
  return () => window.clearInterval(interval);
}

function killCurrentInstance() {
  return Cookies.remove(CONFIG.COOKIE_NAME);
}

function register(instanceId: string) {
  writeMarker(instanceId);
  return () => killCurrentInstance();
}

export function useSingleInstance() {
  const instanceId = useRef<string | undefined>(undefined);
  const [hasOtherInstance, setHasOtherInstance] = useState(!isRunningInstance(instanceId.current));

  const registerInstance = () => {
    instanceId.current = createUuid();
    return register(instanceId.current);
  };

  const killRunningInstance = () => {
    killCurrentInstance();
    setHasOtherInstance(false);
  };

  useEffect(() => poll(instanceId, () => setHasOtherInstance(true)));

  return {hasOtherInstance, killRunningInstance, registerInstance};
}
