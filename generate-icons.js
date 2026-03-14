#!/usr/bin/env node
// Run: node generate-icons.js
// Generates placeholder SVG icons for the PWA

const fs = require('fs');
const path = require('path');

const iconSVG = (size) => `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#6c63ff"/>
      <stop offset="100%" style="stop-color:#a29bfe"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#bg)"/>
  <text x="${size/2}" y="${size * 0.65}" font-family="Arial" font-size="${size * 0.5}" font-weight="bold" fill="white" text-anchor="middle">⚡</text>
</svg>`;

const iconsDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir);

fs.writeFileSync(path.join(iconsDir, 'icon-192.svg'), iconSVG(192));
fs.writeFileSync(path.join(iconsDir, 'icon-512.svg'), iconSVG(512));
console.log('Icons generated! Convert SVGs to PNG for production.');
