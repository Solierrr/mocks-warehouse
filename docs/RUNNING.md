<p align="center">
  <img src="../assets/readme/banners/cloudinary.png" alt="Cloudinary" width="100%">
</p>

# Uso local

Use Node.js 24 ou superior. Não há dependências para instalar, Makefile ou `make vault`. O guia de ferramentas comum está em [TYPESCRIPT.md](https://github.com/Solierrr/docs-warehouse/blob/main/readme/running/TYPESCRIPT.md), mas os scripts deste acervo são JavaScript.

| Comando | Efeito |
|---|---|
| `npm run validate` | Confere catálogo e arquivos |
| `npm test` | Testes dos scripts |
| `npm run sync -- ../web-app` | Copia imagens e manifesto ao frontend |
| `npm run cloudinary -- --dry-run` | Lista upload sem enviar |

A sincronização recusa conteúdo diferente no destino e não altera as referências de código do consumidor. As credenciais de upload vêm de `CLOUDINARY_URL` no ambiente autorizado.
