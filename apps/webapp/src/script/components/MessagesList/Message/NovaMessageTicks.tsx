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

import {Message} from 'Repositories/entity/message/Message';
import {StatusType} from 'src/script/message/StatusType';
import {useKoSubscribableChildren} from 'Util/componentUtil';
import {t} from 'Util/localizerUtil';
import {formatTimeShort} from 'Util/timeUtil';

/**
 * Delivery ticks for the own messages. Shows only what the protocol reports:
 * - one tick: the server accepted the message
 * - two ticks: the other side confirmed the delivery (confirmations exist in 1:1 conversations only)
 * - two cyan ticks: read (needs read receipts, in a group every other member must have read it)
 */
export type NovaTickState = 'sending' | 'sent' | 'delivered' | 'read';

interface NovaMessageTicksProps {
  message: Message;
  is1to1: boolean;
  /** number of other members in the conversation */
  otherMembers: number;
}

export const getNovaTickState = (
  status: StatusType,
  readReceiptCount: number,
  is1to1: boolean,
  otherMembers: number,
): NovaTickState | undefined => {
  if ([StatusType.FAILED, StatusType.FEDERATION_ERROR, StatusType.UNSPECIFIED].includes(status)) {
    return undefined;
  }
  if (status === StatusType.SENDING) {
    return 'sending';
  }
  if (is1to1) {
    if (readReceiptCount > 0 || status === StatusType.SEEN) {
      return 'read';
    }
    return status === StatusType.DELIVERED ? 'delivered' : 'sent';
  }
  return readReceiptCount > 0 && otherMembers > 0 && readReceiptCount >= otherMembers ? 'read' : 'sent';
};

export const NovaMessageTicks = ({message, is1to1, otherMembers}: NovaMessageTicksProps) => {
  const {status, readReceipts} = useKoSubscribableChildren(message, ['status', 'readReceipts']);
  const state = getNovaTickState(status, readReceipts?.length ?? 0, is1to1, otherMembers);

  if (!state) {
    return null;
  }

  const readTime = state === 'read' && is1to1 && readReceipts?.[0]?.time ? ` ${formatTimeShort(readReceipts[0].time)}` : '';
  const label = {
    sending: t('novaTickSending'),
    sent: t('novaTickSent'),
    delivered: t('conversationMessageDelivered'),
    read: `${t('novaTickRead')}${readTime}`,
  }[state];

  return (
    <span
      className={`nova-ticks nova-ticks--${state}`}
      data-uie-name="status-message-ticks"
      data-uie-value={state}
      title={label}
      aria-label={label}
      role="img"
    >
      {state === 'sending' && (
        <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
          <circle cx="8" cy="8" r="6" />
          <path d="M8 4.6V8l2.2 1.6" />
        </svg>
      )}
      {state === 'sent' && (
        <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
          <path d="M3 8.6l3.2 3.2L13 4.6" />
        </svg>
      )}
      {(state === 'delivered' || state === 'read') && (
        <svg viewBox="0 0 22 16" width="22" height="16" aria-hidden="true">
          <path d="M1.5 8.6l3.2 3.2 6.8-7.2" />
          <path d="M9.2 10.8l1 1 6.8-7.2" />
        </svg>
      )}
    </span>
  );
};
