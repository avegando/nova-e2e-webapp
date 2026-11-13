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


import {useEffect, useRef} from 'react';

import {createPortal} from 'react-dom';
import {container} from 'tsyringe';

import {useMatchMedia} from '@wireapp/react-ui-kit';

import {Call} from 'Repositories/calling/Call';
import {CallingRepository} from 'Repositories/calling/CallingRepository';
import {CallingViewMode, CallState, MuteState} from 'Repositories/calling/CallState';
import {LEAVE_CALL_REASON} from 'Repositories/calling/enum/LeaveCallReason';
import {useKoSubscribableChildren} from 'Util/componentUtil';
import {t} from 'Util/localizerUtil';

import {Duration} from './Duration';

interface NovaCallBarProps {
  call: Call;
  isMuted: boolean;
  onOpenCall: () => void;
  onToggleMute: () => void;
  onLeave: () => void;
}

/**
 * Phones: while a call runs minimised, a slim bar stays at the top of the app (name, duration, mute, hang up).
 * A tap on the name opens the call again. The app below stays fully usable.
 */
export const NovaCallBar = ({call, isMuted, onOpenCall, onToggleMute, onLeave}: NovaCallBarProps) => {
  const {startedAt} = useKoSubscribableChildren(call, ['startedAt']);
  const {display_name: name} = useKoSubscribableChildren(call.conversation, ['display_name']);

  return createPortal(
    <div className="novae2e-call-bar" role="region" aria-label={t('novaCallBarLabel')} data-uie-name="nova-call-bar">
      <button type="button" className="novae2e-call-bar__open" onClick={onOpenCall} data-uie-name="do-open-call">
        <span className="novae2e-call-bar__dot" aria-hidden="true" />
        <span className="novae2e-call-bar__name">{name}</span>
        <span className="novae2e-call-bar__time">
          <Duration startedAt={startedAt} />
        </span>
        <span className="novae2e-call-bar__hint">{t('novaCallBarOpen')}</span>
      </button>
      <button
        type="button"
        className={`novae2e-call-bar__button${isMuted ? ' novae2e-call-bar__button--active' : ''}`}
        onClick={onToggleMute}
        aria-pressed={isMuted}
        aria-label={isMuted ? t('novaCallBarUnmute') : t('novaCallBarMute')}
        data-uie-name="do-call-bar-mute"
      >
        <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <path d="M8 1a2.5 2.5 0 0 0-2.5 2.5v4a2.5 2.5 0 0 0 5 0v-4A2.5 2.5 0 0 0 8 1zM3.5 7.5a.75.75 0 0 0-1.5 0A6 6 0 0 0 7.25 13.45V15h1.5v-1.55A6 6 0 0 0 14 7.5a.75.75 0 0 0-1.5 0 4.5 4.5 0 0 1-9 0z" />
          {isMuted && <path d="M2 1.5 14.5 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />}
        </svg>
      </button>
      <button
        type="button"
        className="novae2e-call-bar__button novae2e-call-bar__button--leave"
        onClick={onLeave}
        aria-label={t('novaCallBarLeave')}
        data-uie-name="do-call-bar-leave"
      >
        <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <path d="M8 5.2c-2.6 0-5 .7-6.7 2-.5.4-.6 1-.4 1.6l.6 1.5c.2.5.8.8 1.3.6l2.1-.7c.5-.2.8-.6.8-1.1V8.2c.7-.2 1.500-.3 2.300-.3s1.600.1 2.300.3v.9c0 .5.3 1 .8 1.1l2.1.7c.5.2 1.1-.1 1.3-.6l.6-1.5c.2-.6.1-1.2-.4-1.6-1.7-1.3-4.1-2-6.7-2z" />
        </svg>
      </button>
    </div>,
    document.body,
  );
};

interface NovaCallBarContainerProps {
  callingRepository: CallingRepository;
  callState?: CallState;
}

const JoinedCallBar = ({call, callingRepository}: {call: Call; callingRepository: CallingRepository}) => {
  const {muteState} = useKoSubscribableChildren(call, ['muteState']);
  const isMuted = muteState !== MuteState.NOT_MUTED;
  return (
    <NovaCallBar
      call={call}
      isMuted={isMuted}
      onOpenCall={() => callingRepository.setViewModeFullScreen()}
      onToggleMute={() => callingRepository.muteCall(call, !isMuted)}
      onLeave={() => callingRepository.leaveCall(call.conversation.qualifiedId, LEAVE_CALL_REASON.MANUAL_LEAVE_BY_UI_CLICK)}
    />
  );
};

/**
 * Always mounted. On phones a joined call opens full screen once; while it is minimised the bar is shown and the
 * class on the root element makes room for it.
 */
export const NovaCallBarContainer = ({callingRepository, callState = container.resolve(CallState)}: NovaCallBarContainerProps) => {
  const {joinedCall, viewMode} = useKoSubscribableChildren(callState, ['joinedCall', 'viewMode']);
  const isPhone = useMatchMedia('(max-width: 720px)');
  const showBar = isPhone && !!joinedCall && viewMode === CallingViewMode.MINIMIZED;
  const openedFor = useRef<string | undefined>(undefined);

  useEffect(() => {
    document.documentElement.classList.toggle('nova-call-bar-open', showBar);
    return () => document.documentElement.classList.remove('nova-call-bar-open');
  }, [showBar]);

  useEffect(() => {
    // phones: after joining (accepting or starting) the call is shown full screen once, like a phone call
    const id = joinedCall?.conversation.id;
    if (!id) {
      openedFor.current = undefined;
      return;
    }
    // joinedCall is only set once the media connection stands
    if (isPhone && openedFor.current !== id) {
      openedFor.current = id;
      callingRepository.setViewModeFullScreen();
    }
  }, [joinedCall, isPhone, callingRepository]);

  return showBar && joinedCall ? <JoinedCallBar call={joinedCall} callingRepository={callingRepository} /> : null;
};
