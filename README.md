# Mocks Warehouse

Acervo de imagens do Solaria compartilhado por mocks locais e seeds. Este repositório contém arquivos estáticos e um catálogo; não executa API, Docker ou deploy de serviço.

## Estrutura

```text
images/
  companies/
    logos/
    banners/
    units/
  professionals/images/
  solar-panels/
  infrastructure/
  banners/
manifest.json
scripts/
```

As imagens são WebP, sem recortes, com transparência preservada quando presente. Logos têm até 512 pixels, banners até 1600 e demais categorias até 1200 no maior lado. Os originais fornecidos ficam fora do repositório.

## Validar

Requer Node.js 24 ou superior. Não há dependências para instalar.

```sh
npm run validate
```

O comando verifica IDs, categorias, caminhos, arquivos sem entrada no catálogo, formato WebP, tamanho e hash SHA256. A CI executa a mesma validação.

## Mocks locais do web-app

Com os repositórios lado a lado:

```sh
npm run sync -- ../web-app
```

Copia o catálogo e as imagens para `web-app/public/images/mocks/`. O comando não altera código, não apaga arquivos e recusa sobrescrever conteúdo diferente. Arquivos iguais permitem repetir a sincronização. Se uma imagem existente precisar ser atualizada, revise e remova apenas esse arquivo antes de sincronizar novamente.

O consumidor deve ignorar essa pasta de cópia no Git. As referências atuais do web-app ainda precisam ser ligadas aos IDs deste catálogo; a sincronização sozinha não altera os dados mockados.

Um asset `images/companies/logos/exemplo.webp` vira `/images/mocks/companies/logos/exemplo.webp` no navegador. O catálogo copiado fica em `/images/mocks/manifest.json`.

## Seeds

Leia `manifest.json`, selecione os assets pelo `id` ou `category` e carregue o arquivo no caminho `path` relativo a este repositório. Envie o conteúdo para o armazenamento do ambiente e grave a URL resultante no banco. A escolha das entidades e o upload pertencem ao seed, não a este acervo.

Cada entrada contém `id`, `category`, `path`, `width`, `height`, `bytes`, `sha256` e `source.filename`. O ID deriva do conteúdo original e da categoria; preserve-o ao reotimizar o mesmo asset. O hash SHA256 valida o arquivo WebP distribuído. Nome original não implica fabricante, identidade ou permissão de uso; acrescente origem e créditos quando conhecidos.

## Adicionar imagens

Use uma categoria existente, um nome descritivo e formato WebP. Registre o asset no catálogo, preencha dimensões, tamanho em bytes, hash do arquivo e nome original. Rode `npm run validate` antes de compartilhar a alteração. Não inclua ZIPs, credenciais ou duplicatas de imagens de outros repositórios.

## Automação

Mantidos os workflows gerais de PRs, limpeza e releases semânticas do template. Removidos publicação Docker, sincronização QA e configuração de dependências Docker. O pacote é privado e não é publicado no npm.
