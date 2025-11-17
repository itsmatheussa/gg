// Script simples para criar ícones do PWA
// Execute: node create-icons.js
// Requer: npm install canvas (opcional, ou use um gerador online)

const fs = require('fs');

// Criar ícones SVG simples (pode ser convertido para PNG depois)
const iconSvg = `
<svg width="192" height="192" xmlns="http://www.w3.org/2000/svg">
  <rect width="192" height="192" fill="#1e1e1e"/>
  <g transform="translate(46, 46)">
    <rect x="50" y="40" width="4" height="60" fill="#4caf50" rx="2"/>
    <circle cx="30" cy="50" r="20" fill="#4caf50"/>
    <circle cx="74" cy="50" r="20" fill="#4caf50"/>
  </g>
  <text x="96" y="140" font-family="Arial" font-size="16" fill="#ffffff" text-anchor="middle">Fit Training</text>
</svg>
`;

// Nota: Para criar PNGs reais, você pode:
// 1. Usar um conversor online de SVG para PNG
// 2. Instalar canvas: npm install canvas
// 3. Ou criar manualmente ícones 192x192 e 512x512

console.log('Para criar os ícones PNG:');
console.log('1. Use um conversor online de SVG para PNG');
console.log('2. Ou crie manualmente ícones 192x192 e 512x512 pixels');
console.log('3. Salve como icon-192.png e icon-512.png na raiz do projeto');

