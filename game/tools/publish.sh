#!/bin/bash
# Builds the game and publishes it to GitHub Pages (the gh-pages branch):
# https://mikeendrias-coder.github.io/unseen-above/
# Run from anywhere: npm run publish (inside game/). Progress is saved in each player's
# browser (localStorage), so publishing never wipes it.
# (game/tools/pages-workflow.yml would do this automatically on every push, but adding a
# workflow needs a GitHub login with the "workflow" scope: gh auth refresh -s workflow.)
set -e
cd "$(dirname "$0")/.."
npm run build
site=$(mktemp -d)
cp dist/local.html "$site/index.html"
cp dist/phaser.min.js "$site/phaser.min.js"
# the paper page (paper/paper.md, built by npm run build) at both /paper/ and /paper.html; its
# "back to the game" links point at the game's index.html beside or above it
sed 's|href="local.html" data-back|href="./" data-back|g' dist/paper.html > "$site/paper.html"
mkdir -p "$site/paper"
sed 's|href="local.html" data-back|href="../" data-back|g' dist/paper.html > "$site/paper/index.html"
touch "$site/.nojekyll"
rev=$(git rev-parse --short HEAD)
cd "$site"
git init -q -b gh-pages
git add -A
git -c user.name="Michael Endrias" -c user.email="258499834+mikeendrias-coder@users.noreply.github.com" commit -qm "Publish $rev"
git push -qf https://github.com/mikeendrias-coder/unseen-above.git gh-pages
echo "Published $rev to https://mikeendrias-coder.github.io/unseen-above/ (paper: .../unseen-above/paper/)"
rm -rf "$site"
