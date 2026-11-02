#!/usr/bin/env python3
"""Pack the game for itch.io (or any static host, or a USB stick): a zip with index.html at its
root and Phaser beside it, so it runs with no internet. Run `npm run build` first.

    python3 tools/pack-itch.py   ->  dist/unseen-above-itch.zip
"""
import os, zipfile

here = os.path.dirname(os.path.abspath(__file__))
dist = os.path.join(here, '..', 'dist')
out = os.path.join(dist, 'unseen-above-itch.zip')
page = open(os.path.join(dist, 'local.html'), encoding='utf-8').read()
with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as z:
    z.writestr('index.html', page)
    z.write(os.path.join(dist, 'phaser.min.js'), 'phaser.min.js')
print('packed', out, round(os.path.getsize(out) / 1024), 'KB')
