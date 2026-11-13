#!/usr/bin/env python3
"""
Writes neutral placeholder images (plain grey shapes) for every brand image the web app refers to.

The public source tree does not contain the operator's logos, icons or other brand artwork
(see TRADEMARKS.md). These placeholders keep every file name in place, so the app builds and
runs without the brand files. To use your own brand, replace the files in
apps/webapp/brand/resource with your own artwork under the same names.

Usage: python3 apps/webapp/bin/novae2e_placeholder_assets.py   (needs only the Python standard library)
The placeholder images written by this script are dedicated to the public domain (CC0 1.0).
"""
import json
import math
import os
import struct
import zlib

WEBAPP = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
RES = os.path.join(WEBAPP, 'brand', 'resource', 'image')
DARK = (43, 48, 54)
GREY = (138, 148, 158)
LIGHT = (199, 206, 213)
NAME = os.environ.get('PLACEHOLDER_NAME', 'Messenger')


def png(width, height, rows, alpha):
    """rows: one list of (start, end, colour) spans per line; everything else is background."""
    channels = 4 if alpha else 3
    background = bytes(4) if alpha else bytes(DARK)
    raw = bytearray()
    for spans in rows:
        line = bytearray(background * width)
        for start, end, colour in spans:
            start, end = max(0, start), min(width, end)
            if end > start:
                pixel = bytes(colour) + (b'\xff' if alpha else b'')
                line[start * channels:end * channels] = pixel * (end - start)
        raw += b'\x00' + line

    def chunk(kind, data):
        body = kind + data
        return struct.pack('>I', len(data)) + body + struct.pack('>I', zlib.crc32(body) & 0xFFFFFFFF)

    header = struct.pack('>IIBBBBB', width, height, 8, 6 if alpha else 2, 0, 0, 0)
    return b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', header) + chunk(b'IDAT', zlib.compress(bytes(raw), 9)) + chunk(b'IEND', b'')


def disc_span(y, cx, cy, radius, colour):
    dy = y + 0.5 - cy
    if abs(dy) >= radius:
        return []
    dx = math.sqrt(radius * radius - dy * dy)
    return [(int(round(cx - dx)), int(round(cx + dx)), colour)]


def symbol(size, alpha, scale=0.3, badge=False):
    """Square image with a grey disc in the middle (opaque images get a dark background)."""
    rows = []
    for y in range(size):
        spans = disc_span(y, size / 2, size / 2, size * scale, GREY)
        if badge:
            spans += disc_span(y, size * 0.78, size * 0.22, size * 0.2, LIGHT)
        rows.append(spans)
    return png(size, size, rows, alpha)


def bar(width, height, alpha=True):
    """Wide image with a grey rounded bar (stands in for a word mark)."""
    radius = height * 0.2
    left, right, middle = width * 0.04 + radius, width * 0.96 - radius, height / 2
    rows = []
    for y in range(height):
        dy = y + 0.5 - middle
        if abs(dy) >= radius:
            rows.append([])
            continue
        dx = math.sqrt(radius * radius - dy * dy)
        rows.append([(int(round(left - dx)), int(round(right + dx)), GREY)])
    return png(width, height, rows, alpha)


def card(width, height):
    """Opaque dark image with a grey disc (share image)."""
    rows = [disc_span(y, width / 2, height / 2, height * 0.22, GREY) for y in range(height)]
    return png(width, height, rows, False)


def ico(badge):
    sizes = [16, 32, 48]
    images = [symbol(px, True, 0.38, badge) for px in sizes]
    head = struct.pack('<HHH', 0, 1, len(sizes))
    offset = 6 + 16 * len(sizes)
    for px, data in zip(sizes, images):
        head += struct.pack('<BBBBHHII', px, px, 0, 0, 1, 32, len(data), offset)
        offset += len(data)
    return head + b''.join(images)


def write(data, *parts):
    path = os.path.join(*parts)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'wb') as handle:
        handle.write(data if isinstance(data, bytes) else data.encode('utf-8'))


def main():
    for name in ('favicon.ico', 'favicon-v2.ico'):
        write(ico(False), RES, name)
    for name in ('favicon-badge.ico', 'favicon-badge-v2.ico'):
        write(ico(True), RES, name)

    # icon components of the app (bin/generate_react_icons.ts turns these into React components)
    write('<svg xmlns="http://www.w3.org/2000/svg" width="39" height="39" viewBox="0 0 39 39">\n'
          '  <circle cx="19.5" cy="19.5" r="13" fill="currentColor"/>\n</svg>\n', RES, 'icon', 'logo-icon.svg')
    write('<svg xmlns="http://www.w3.org/2000/svg" width="288" height="288" viewBox="0 0 288 288">\n'
          '  <circle cx="144" cy="144" r="96" fill="currentColor"/>\n</svg>\n', RES, 'icon', 'watermark-icon.svg')
    write('<svg xmlns="http://www.w3.org/2000/svg" width="102" height="26" viewBox="0 0 102 26">\n'
          '  <rect x="0" y="6" width="102" height="14" rx="7" fill="currentColor"/>\n</svg>\n', RES, 'icon', 'logo-full-icon.svg')

    # logo folder: transparent symbols and word marks
    write(symbol(256, True), RES, 'logo', 'notification.png')
    write(symbol(128, True), RES, 'logo', 'wire-logo-120.png')
    for px in (32, 64, 128, 256, 512):
        write(symbol(px, True), RES, 'logo', f'novae2e-schild-frei-{px}.png')
    for px in (64, 128, 256, 512):
        write(symbol(px, True), RES, 'logo', f'novae2e-shield-{px}.png')
    write(bar(1000, 345), RES, 'logo', 'novae2e-wordmark.png')
    write(bar(2001, 691), RES, 'logo', 'novae2e-wordmark@2x.png')
    write(bar(1000, 253), RES, 'logo', 'novae2e-wordmark-notag.png')
    write(bar(2001, 507), RES, 'logo', 'novae2e-wordmark-notag@2x.png')
    write(bar(1000, 345), RES, 'logo', 'novae2e-logo-email.png')

    # meta folder: browser and home-screen icons, share image, web manifest
    for px in (64, 128, 256):
        write(symbol(px, True), RES, 'meta', f'wire-icon-{px}.png')
    for px in (192, 512):
        write(symbol(px, True), RES, 'meta', f'novae2e-icon-{px}.png')
        write(symbol(px, False, 0.22), RES, 'meta', f'novae2e-icon-maskable-{px}.png')
        write(symbol(px, False, 0.22), RES, 'meta', f'novae2e-icon-maskable-{px}-v2.png')
    for px in (16, 32, 48, 64, 128, 192, 256, 512):
        write(symbol(px, False), RES, 'meta', f'novae2e-icon-{px}-v2.png')
    write(symbol(180, False), RES, 'meta', 'apple-touch-icon.png')
    for px in (120, 152, 167, 180):
        write(symbol(px, False), RES, 'meta', f'apple-touch-icon-{px}-v2.png')
    write(card(1200, 630), RES, 'meta', 'og-image.png')
    manifest = {
        'name': NAME,
        'short_name': NAME,
        'start_url': '/',
        'scope': '/',
        'display': 'standalone',
        'background_color': '#05070a',
        'theme_color': '#05070a',
        'icons': [
            {'src': '/image/meta/novae2e-icon-192-v2.png', 'sizes': '192x192', 'type': 'image/png', 'purpose': 'any'},
            {'src': '/image/meta/novae2e-icon-512-v2.png', 'sizes': '512x512', 'type': 'image/png', 'purpose': 'any'},
            {'src': '/image/meta/novae2e-icon-maskable-192-v2.png', 'sizes': '192x192', 'type': 'image/png', 'purpose': 'maskable'},
            {'src': '/image/meta/novae2e-icon-maskable-512-v2.png', 'sizes': '512x512', 'type': 'image/png', 'purpose': 'maskable'},
        ],
    }
    write(json.dumps(manifest, indent=2) + '\n', RES, 'meta', 'site.webmanifest')

    # default background for video calls (plain dark image)
    write(png(1920, 1080, [[] for _ in range(1080)], False), WEBAPP, 'assets', 'images', 'backgrounds', 'wire-1.png')
    print('placeholder brand assets written')


if __name__ == '__main__':
    main()
