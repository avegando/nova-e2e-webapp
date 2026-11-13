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

import {useCallback, useEffect, useRef, useState} from 'react';

import {createPortal} from 'react-dom';

import {t} from 'Util/localizerUtil';

/**
 * Lets the user choose the visible part of a new profile picture: move it with a finger, the mouse or the arrow
 * keys, zoom with two fingers, the mouse wheel, the slider or + and -. The round frame shows what the others
 * will see. The chosen square is drawn to a canvas and handed on as a JPEG file, so the normal upload is used.
 * The browser applies the orientation stored by cameras (EXIF) when it decodes the picture.
 */
interface NovaAvatarCropperProps {
  file: File;
  onCancel: () => void;
  onConfirm: (file: File) => void;
}

const MAX_ZOOM = 4;
const OUTPUT_MIN = 320;
const OUTPUT_MAX = 1280;
const KEY_STEP = 12;
const KEY_STEP_LARGE = 48;

interface View {
  zoom: number;
  x: number;
  y: number;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const NovaAvatarCropper = ({file, onCancel, onConfirm}: NovaAvatarCropperProps) => {
  const frameRef = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, {x: number; y: number}>());
  const [image, setImage] = useState<HTMLImageElement>();
  const [source, setSource] = useState('');
  const [failed, setFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [frameSize, setFrameSize] = useState(0);
  const [view, setView] = useState<View>({zoom: 1, x: 0, y: 0});

  useEffect(() => {
    const url = URL.createObjectURL(file);
    const element = new Image();
    element.onload = () => setImage(element);
    element.onerror = () => setFailed(true);
    element.src = url;
    setSource(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    const measure = () => setFrameSize(frameRef.current?.clientWidth ?? 0);
    measure();
    window.addEventListener('resize', measure);
    frameRef.current?.focus();
    return () => window.removeEventListener('resize', measure);
  }, []);

  const width = image?.naturalWidth ?? 1;
  const height = image?.naturalHeight ?? 1;
  // scale at which the shorter side just fills the frame
  const baseScale = frameSize / Math.min(width, height);

  const limit = useCallback(
    (next: View): View => {
      const zoom = clamp(next.zoom, 1, MAX_ZOOM);
      const maxX = Math.max(0, (width * baseScale * zoom - frameSize) / 2);
      const maxY = Math.max(0, (height * baseScale * zoom - frameSize) / 2);
      return {zoom, x: clamp(next.x, -maxX, maxX), y: clamp(next.y, -maxY, maxY)};
    },
    [width, height, baseScale, frameSize],
  );

  const move = useCallback((dx: number, dy: number) => setView(current => limit({...current, x: current.x + dx, y: current.y + dy})), [limit]);

  /** Zooms by a factor and keeps the picture point under (focusX, focusY) in place; both are relative to the frame centre. */
  const zoomBy = useCallback(
    (factor: number, focusX = 0, focusY = 0) =>
      setView(current => {
        const zoom = clamp(current.zoom * factor, 1, MAX_ZOOM);
        const ratio = zoom / current.zoom;
        return limit({zoom, x: focusX - (focusX - current.x) * ratio, y: focusY - (focusY - current.y) * ratio});
      }),
    [limit],
  );

  const relative = (clientX: number, clientY: number) => {
    const box = frameRef.current?.getBoundingClientRect();
    return box ? {x: clientX - box.left - box.width / 2, y: clientY - box.top - box.height / 2} : {x: 0, y: 0};
  };

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) {
      return undefined;
    }
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const focus = relative(event.clientX, event.clientY);
      zoomBy(Math.exp(-event.deltaY * 0.0015), focus.x, focus.y);
    };
    frame.addEventListener('wheel', onWheel, {passive: false});
    return () => frame.removeEventListener('wheel', onWheel);
  }, [zoomBy]);

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture?.(event.pointerId);
    pointers.current.set(event.pointerId, {x: event.clientX, y: event.clientY});
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const previous = pointers.current.get(event.pointerId);
    if (!previous) {
      return;
    }
    const others = [...pointers.current.entries()].filter(([id]) => id !== event.pointerId).map(([, point]) => point);
    pointers.current.set(event.pointerId, {x: event.clientX, y: event.clientY});
    if (others.length === 0) {
      move(event.clientX - previous.x, event.clientY - previous.y);
      return;
    }
    const other = others[0];
    const before = Math.hypot(previous.x - other.x, previous.y - other.y);
    const after = Math.hypot(event.clientX - other.x, event.clientY - other.y);
    const middle = relative((event.clientX + other.x) / 2, (event.clientY + other.y) / 2);
    if (before > 0) {
      zoomBy(after / before, middle.x, middle.y);
    }
    move((event.clientX - previous.x) / 2, (event.clientY - previous.y) / 2);
  };

  const onPointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    pointers.current.delete(event.pointerId);
  };

  const save = () => {
    if (!image || !frameSize || saving) {
      return;
    }
    const scale = baseScale * view.zoom;
    const side = frameSize / scale;
    const sourceX = clamp(width / 2 - (frameSize / 2 + view.x) / scale, 0, Math.max(0, width - side));
    const sourceY = clamp(height / 2 - (frameSize / 2 + view.y) / scale, 0, Math.max(0, height - side));
    const size = Math.round(clamp(side, OUTPUT_MIN, OUTPUT_MAX));
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d');
    if (!context) {
      setFailed(true);
      return;
    }
    context.fillStyle = '#0a0f14';
    context.fillRect(0, 0, size, size);
    context.imageSmoothingQuality = 'high';
    context.drawImage(image, sourceX, sourceY, side, side, 0, 0, size, size);
    setSaving(true);
    canvas.toBlob(
      blob => {
        if (!blob) {
          setSaving(false);
          setFailed(true);
          return;
        }
        onConfirm(new File([blob], 'profile-picture.jpg', {type: 'image/jpeg'}));
      },
      'image/jpeg',
      0.92,
    );
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey ? KEY_STEP_LARGE : KEY_STEP;
    const actions: Record<string, () => void> = {
      ArrowLeft: () => move(step, 0),
      ArrowRight: () => move(-step, 0),
      ArrowUp: () => move(0, step),
      ArrowDown: () => move(0, -step),
      '+': () => zoomBy(1.1),
      '=': () => zoomBy(1.1),
      '-': () => zoomBy(1 / 1.1),
      '0': () => setView({zoom: 1, x: 0, y: 0}),
      Enter: save,
    };
    const action = actions[event.key];
    if (action) {
      event.preventDefault();
      action();
    }
  };

  const displayWidth = width * baseScale * view.zoom;
  const displayHeight = height * baseScale * view.zoom;

  return createPortal(
    <div
      className="nova-crop"
      role="dialog"
      aria-modal="true"
      aria-label={t('novaCropTitle')}
      data-uie-name="modal-crop-picture"
      onKeyDown={event => {
        if (event.key === 'Escape') {
          event.stopPropagation();
          onCancel();
        }
      }}
    >
      <div className="nova-crop__panel">
        <h2 className="nova-crop__title">{t('novaCropTitle')}</h2>
        <div
          ref={frameRef}
          className="nova-crop__frame"
          tabIndex={0}
          role="application"
          aria-label={t('novaCropHint')}
          data-uie-name="crop-frame"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
          onKeyDown={onKeyDown}
        >
          {image && frameSize > 0 && (
            <img
              src={source}
              alt=""
              draggable={false}
              data-uie-name="crop-image"
              style={{
                width: displayWidth,
                height: displayHeight,
                transform: `translate(calc(-50% + ${view.x}px), calc(-50% + ${view.y}px))`,
              }}
            />
          )}
          <div className="nova-crop__ring" aria-hidden="true" />
        </div>
        {failed ? (
          <p className="nova-crop__hint" role="alert" data-uie-name="crop-error">
            {t('novaCropFailed')}
          </p>
        ) : (
          <p className="nova-crop__hint">{t('novaCropHint')}</p>
        )}
        <label className="nova-crop__zoom">
          <span>{t('novaCropZoom')}</span>
          <input
            type="range"
            min={1}
            max={MAX_ZOOM}
            step={0.01}
            value={view.zoom}
            data-uie-name="crop-zoom"
            onChange={event => zoomBy(Number(event.target.value) / view.zoom)}
          />
        </label>
        <div className="nova-crop__actions">
          <button type="button" className="nova-crop__button" data-uie-name="do-crop-cancel" onClick={onCancel}>
            {t('novaCropCancel')}
          </button>
          <button
            type="button"
            className="nova-crop__button nova-crop__button--primary"
            data-uie-name="do-crop-save"
            disabled={!image || saving || failed}
            onClick={save}
          >
            {t('novaCropSave')}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};
