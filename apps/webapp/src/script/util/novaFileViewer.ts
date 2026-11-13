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


import {t} from 'Util/localizerUtil';

/*
 * NovaE2E: on phones a downloaded file used to replace the app page (the browser showed the file instead of the app).
 * Here the file is shown in a window inside the app: text as plain text, pictures, PDF, audio and video directly,
 * everything else with a "share or save" button. On desktop computers the normal download stays as it is.
 */

const MAX_TEXT_BYTES = 2 * 1024 * 1024;
const TEXT_EXTENSIONS = /\.(txt|text|md|log|csv|tsv|json|xml|yml|yaml|ini|conf|cfg|rtf|srt|vcf|ics)$/i;

export function opensFilesInApp(): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return false;
  }
  const standalone =
    (window.navigator as Navigator & {standalone?: boolean}).standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches;
  const appleTouchDevice =
    /iPhone|iPad|iPod/.test(window.navigator.userAgent) ||
    (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);
  const smallTouchScreen = window.matchMedia('(max-width: 720px) and (pointer: coarse)').matches;
  return standalone || appleTouchDevice || smallTouchScreen;
}

type FileKind = 'text' | 'image' | 'pdf' | 'audio' | 'video' | 'other';

function kindOf(blob: Blob, fileName: string): FileKind {
  const type = (blob.type || '').toLowerCase();
  if (type.startsWith('image/') && !type.includes('svg')) {
    return 'image';
  }
  if (type === 'application/pdf' || /\.pdf$/i.test(fileName)) {
    return 'pdf';
  }
  if (type.startsWith('audio/')) {
    return 'audio';
  }
  if (type.startsWith('video/')) {
    return 'video';
  }
  if (type.startsWith('text/') || type === 'application/json' || TEXT_EXTENSIONS.test(fileName)) {
    return 'text';
  }
  return 'other';
}

function element<K extends keyof HTMLElementTagNameMap>(tag: K, style: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  node.style.cssText = style;
  if (text !== undefined) {
    node.textContent = text;
  }
  return node;
}

const BUTTON_STYLE =
  'min-width:44px;min-height:44px;padding:0 16px;border-radius:12px;border:1px solid rgba(200,208,216,.42);' +
  'background:#1a1d22;color:#f2f4f7;font:600 15px/1 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;cursor:pointer;';

/** Shows the file in a window inside the app. The page itself is never left. */
export async function openFileInApp(blob: Blob, fileName: string): Promise<void> {
  const kind = kindOf(blob, fileName);
  const objectUrl = kind === 'text' || kind === 'other' ? undefined : window.URL.createObjectURL(blob);

  const overlay = element(
    'div',
    'position:fixed;inset:0;z-index:100000;display:flex;flex-direction:column;background:#0b0d10;color:#f2f4f7;' +
      'padding:var(--nova-safe-top,0px) var(--nova-safe-right,0px) var(--nova-safe-bottom,0px) var(--nova-safe-left,0px);box-sizing:border-box;',
  );
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', fileName);
  overlay.setAttribute('data-uie-name', 'nova-file-viewer');

  const bar = element(
    'div',
    'display:flex;align-items:center;gap:10px;padding:8px 10px;border-bottom:1px solid #2a2f36;background:#111418;flex:none;',
  );
  const title = element(
    'div',
    'flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font:600 15px/1.3 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;',
    fileName,
  );
  title.setAttribute('data-uie-name', 'nova-file-viewer-name');
  const closeButton = element('button', BUTTON_STYLE + 'border-color:#22d3ee;color:#22d3ee;', t('novaFileViewerClose'));
  closeButton.type = 'button';
  closeButton.setAttribute('data-uie-name', 'do-close-file-viewer');
  bar.append(title);

  const file = new File([blob], fileName, {type: blob.type || 'application/octet-stream'});
  const shareData = {files: [file], title: fileName};
  const canShare = typeof navigator.share === 'function' && (!navigator.canShare || navigator.canShare(shareData));
  if (canShare) {
    const shareButton = element('button', BUTTON_STYLE, t('novaFileViewerShare'));
    shareButton.type = 'button';
    shareButton.setAttribute('data-uie-name', 'do-share-file');
    shareButton.addEventListener('click', () => {
      navigator.share(shareData).catch(() => undefined);
    });
    bar.append(shareButton);
  }
  bar.append(closeButton);

  const body = element('div', 'flex:1;min-height:0;overflow:auto;-webkit-overflow-scrolling:touch;display:flex;');
  const note = (text: string) =>
    element('p', 'margin:auto;padding:24px;text-align:center;color:#c3ccd4;font:15px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;', text);

  if (kind === 'text') {
    const slice = blob.size > MAX_TEXT_BYTES ? blob.slice(0, MAX_TEXT_BYTES) : blob;
    const pre = element(
      'pre',
      'margin:0;padding:16px;width:100%;box-sizing:border-box;white-space:pre-wrap;word-break:break-word;' +
        'font:14px/1.5 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;color:#f2f4f7;',
    );
    // plain text only: the content is never interpreted as markup
    pre.textContent = await slice.text();
    pre.setAttribute('data-uie-name', 'nova-file-viewer-text');
    const column = element('div', 'width:100%;');
    if (blob.size > MAX_TEXT_BYTES) {
      column.append(element('p', 'margin:0;padding:10px 16px;color:#c3ccd4;font:13px/1.4 sans-serif;', t('novaFileViewerTruncated')));
    }
    column.append(pre);
    body.append(column);
  } else if (kind === 'image' && objectUrl) {
    const image = element('img', 'margin:auto;max-width:100%;max-height:100%;object-fit:contain;');
    image.src = objectUrl;
    image.alt = fileName;
    body.append(image);
  } else if (kind === 'pdf' && objectUrl) {
    const frame = element('iframe', 'flex:1;width:100%;height:100%;border:0;background:#fff;');
    frame.src = objectUrl;
    frame.title = fileName;
    body.append(frame);
  } else if ((kind === 'audio' || kind === 'video') && objectUrl) {
    const player = element(kind, 'margin:auto;max-width:100%;max-height:100%;');
    player.src = objectUrl;
    player.controls = true;
    body.append(player);
  } else {
    body.append(note(t('novaFileViewerNoPreview')));
  }

  const close = () => {
    document.removeEventListener('keydown', onKeyDown);
    overlay.remove();
    if (objectUrl) {
      window.URL.revokeObjectURL(objectUrl);
    }
  };
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      close();
    }
  };
  closeButton.addEventListener('click', close);
  document.addEventListener('keydown', onKeyDown);

  overlay.append(bar, body);
  document.body.append(overlay);
  closeButton.focus();
}
