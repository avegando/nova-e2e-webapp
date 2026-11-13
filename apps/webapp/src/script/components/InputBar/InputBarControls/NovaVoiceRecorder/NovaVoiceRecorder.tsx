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


import {PointerEvent as ReactPointerEvent, useCallback, useEffect, useRef, useState} from 'react';

import {createPortal} from 'react-dom';

import {t} from 'Util/localizerUtil';

/*
 * NovaE2E voice messages: a microphone button next to the message field (shown while the field is empty).
 * Tap: recording starts and stays on until "stop". Press and hold: recording runs while held; letting go leads to the
 * preview, sliding away to the left cancels. After recording: listen, discard or send. The recording is sent as a
 * normal encrypted audio file through the existing upload path.
 */

const FORMATS = [
  {extension: 'm4a', mimeType: 'audio/mp4;codecs=mp4a.40.2'},
  {extension: 'webm', mimeType: 'audio/webm;codecs=opus'},
  {extension: 'm4a', mimeType: 'audio/mp4'},
  {extension: 'ogg', mimeType: 'audio/ogg;codecs=opus'},
];
const HOLD_MS = 450;
const CANCEL_SLIDE_PX = 90;
const MAX_SECONDS = 10 * 60;

export const pickVoiceFormat = () =>
  typeof MediaRecorder === 'undefined'
    ? undefined
    : FORMATS.find(format => MediaRecorder.isTypeSupported(format.mimeType));

const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;

type Phase = 'idle' | 'recording' | 'preview';

interface NovaVoiceRecorderProps {
  onSend: (file: File) => void;
}

export const NovaVoiceRecorder = ({onSend}: NovaVoiceRecorderProps) => {
  const [phase, setPhase] = useState<Phase>('idle');
  const [seconds, setSeconds] = useState(0);
  const [level, setLevel] = useState(0);
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [cancelHint, setCancelHint] = useState(false);

  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const chunks = useRef<Blob[]>([]);
  const file = useRef<File | null>(null);
  const timer = useRef(0);
  const meter = useRef(0);
  const startedAt = useRef(0);
  const pressAt = useRef(0);
  const pressX = useRef(0);
  const holding = useRef(false);
  const discardOnStop = useRef(false);

  const releaseMedia = useCallback(() => {
    window.clearInterval(timer.current);
    window.cancelAnimationFrame(meter.current);
    stream.current?.getTracks().forEach(track => track.stop());
    stream.current = null;
    audioContext.current?.close().catch(() => undefined);
    audioContext.current = null;
  }, []);

  const reset = useCallback(() => {
    releaseMedia();
    if (previewUrl) {
      window.URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl('');
    file.current = null;
    chunks.current = [];
    setSeconds(0);
    setLevel(0);
    setCancelHint(false);
    setPhase('idle');
  }, [previewUrl, releaseMedia]);

  useEffect(() => () => releaseMedia(), [releaseMedia]);

  const stop = useCallback((discard = false) => {
    discardOnStop.current = discard;
    if (recorder.current && recorder.current.state !== 'inactive') {
      recorder.current.stop();
    } else if (discard) {
      reset();
    }
  }, [reset]);

  const start = useCallback(async () => {
    setError('');
    const format = pickVoiceFormat();
    if (!format || !navigator.mediaDevices?.getUserMedia) {
      setError(t('novaVoiceNotSupported'));
      return;
    }
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({audio: {echoCancellation: true, noiseSuppression: true}});
    } catch {
      setError(t('novaVoiceNoPermission'));
      return;
    }
    chunks.current = [];
    discardOnStop.current = false;
    const mediaRecorder = new MediaRecorder(stream.current, {mimeType: format.mimeType});
    recorder.current = mediaRecorder;
    mediaRecorder.ondataavailable = event => {
      if (event.data.size > 0) {
        chunks.current.push(event.data);
      }
    };
    mediaRecorder.onstop = () => {
      const duration = (Date.now() - startedAt.current) / 1000;
      releaseMedia();
      if (discardOnStop.current || duration < 0.6 || !chunks.current.length) {
        reset();
        return;
      }
      const type = format.mimeType.split(';')[0];
      const blob = new Blob(chunks.current, {type});
      const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
      file.current = new File([blob], `voice-${stamp}.${format.extension}`, {type});
      setPreviewUrl(window.URL.createObjectURL(blob));
      setPhase('preview');
    };
    startedAt.current = Date.now();
    mediaRecorder.start(250);
    setSeconds(0);
    setPhase('recording');
    timer.current = window.setInterval(() => {
      const elapsed = (Date.now() - startedAt.current) / 1000;
      setSeconds(elapsed);
      if (elapsed >= MAX_SECONDS) {
        stop();
      }
    }, 250);
    try {
      const Context = window.AudioContext || (window as unknown as {webkitAudioContext: typeof AudioContext}).webkitAudioContext;
      audioContext.current = new Context();
      const analyser = audioContext.current.createAnalyser();
      analyser.fftSize = 256;
      audioContext.current.createMediaStreamSource(stream.current).connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteTimeDomainData(data);
        let peak = 0;
        for (const value of data) {
          peak = Math.max(peak, Math.abs(value - 128));
        }
        setLevel(Math.min(1, peak / 90));
        meter.current = window.requestAnimationFrame(tick);
      };
      tick();
    } catch {
      // no level display, recording itself still works
    }
  }, [releaseMedia, reset, stop]);

  const onPointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    pressAt.current = Date.now();
    pressX.current = event.clientX;
    holding.current = true;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    void start();
  };
  const onPointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (holding.current && Date.now() - pressAt.current > HOLD_MS) {
      setCancelHint(pressX.current - event.clientX > CANCEL_SLIDE_PX);
    }
  };
  const onPointerUp = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!holding.current) {
      return;
    }
    holding.current = false;
    const held = Date.now() - pressAt.current;
    if (held > HOLD_MS) {
      // press and hold: letting go ends the recording; sliding away cancels it
      stop(pressX.current - event.clientX > CANCEL_SLIDE_PX);
    }
    // a short tap keeps recording until "stop" is tapped
  };

  const send = () => {
    if (file.current) {
      onSend(file.current);
    }
    reset();
  };

  const micButton = (
    <button
      type="button"
      className="controls-right-button novae2e-voice-button input-bar-buttons__send"
      title={t('novaVoiceRecord')}
      aria-label={t('novaVoiceRecord')}
      data-uie-name="do-record-voice"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => {
        holding.current = false;
      }}
      onContextMenu={event => event.preventDefault()}
    >
      <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <path d="M8 1a2.5 2.5 0 0 0-2.5 2.5v4a2.5 2.5 0 0 0 5 0v-4A2.5 2.5 0 0 0 8 1zM3.5 7.5a.75.75 0 0 0-1.5 0 6 6 0 0 0 5.25 5.95V15h1.5v-1.55A6 6 0 0 0 14 7.5a.75.75 0 0 0-1.5 0 4.5 4.5 0 0 1-9 0z" />
      </svg>
    </button>
  );

  const panel =
    phase === 'idle' && !error
      ? null
      : createPortal(
          <div className="novae2e-voice-panel" role="region" aria-label={t('novaVoiceRecord')} data-uie-name="voice-panel">
            {error && (
              <>
                <span className="novae2e-voice-panel__text" role="alert" data-uie-name="voice-error">
                  {error}
                </span>
                <button type="button" className="novae2e-voice-panel__button" onClick={() => setError('')} data-uie-name="do-voice-close">
                  {t('novaVoiceClose')}
                </button>
              </>
            )}
            {!error && phase === 'recording' && (
              <>
                <button type="button" className="novae2e-voice-panel__button" onClick={() => stop(true)} data-uie-name="do-voice-cancel">
                  {t('novaVoiceCancel')}
                </button>
                <span className="novae2e-voice-panel__dot" aria-hidden="true" />
                <span className="novae2e-voice-panel__time" data-uie-name="voice-time">
                  {formatTime(seconds)}
                </span>
                <span className="novae2e-voice-panel__meter" aria-hidden="true">
                  <span style={{transform: `scaleX(${Math.max(0.04, level)})`}} />
                </span>
                <span className="novae2e-voice-panel__text">{cancelHint ? t('novaVoiceReleaseToCancel') : ''}</span>
                <button type="button" className="novae2e-voice-panel__button novae2e-voice-panel__button--main" onClick={() => stop()} data-uie-name="do-voice-stop">
                  {t('novaVoiceStop')}
                </button>
              </>
            )}
            {!error && phase === 'preview' && (
              <>
                <button type="button" className="novae2e-voice-panel__button" onClick={reset} data-uie-name="do-voice-discard">
                  {t('novaVoiceDiscard')}
                </button>
                {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                <audio className="novae2e-voice-panel__audio" src={previewUrl} controls data-uie-name="voice-preview" />
                <button type="button" className="novae2e-voice-panel__button novae2e-voice-panel__button--main" onClick={send} data-uie-name="do-voice-send">
                  {t('novaVoiceSend')}
                </button>
              </>
            )}
          </div>,
          document.body,
        );

  return (
    <>
      {micButton}
      {panel}
    </>
  );
};
