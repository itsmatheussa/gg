# Instruções para Criar Ícones do PWA

O PWA precisa de ícones para funcionar corretamente. Siga estas instruções:

## Opção 1: Criar Manualmente

1. Crie duas imagens:
   - `icon-192.png` - 192x192 pixels
   - `icon-512.png` - 512x512 pixels

2. Use um halter como tema principal
3. Fundo: #1e1e1e (cinza escuro)
4. Cor do halter: #4caf50 (verde)
5. Salve os arquivos na raiz do projeto

## Opção 2: Usar Gerador Online

1. Acesse: https://realfavicongenerator.net/ ou https://www.pwabuilder.com/imageGenerator
2. Faça upload de uma imagem do halter
3. Baixe os ícones gerados
4. Renomeie para `icon-192.png` e `icon-512.png`
5. Coloque na raiz do projeto

## Opção 3: Usar o SVG Fornecido

O arquivo `create-icons.js` contém um SVG básico que pode ser convertido para PNG usando:
- Ferramentas online de conversão SVG para PNG
- Inkscape ou outras ferramentas gráficas

**Nota:** O app funcionará mesmo sem os ícones, mas para uma experiência completa de PWA, é recomendado ter os ícones.

