# Mocks Warehouse

Acervo de imagens do Solaria compartilhado por mocks locais e seeds. Este repositório contém arquivos estáticos e um catálogo; não executa API, Docker ou deploy de serviço.

## Estrutura

```text
images/
  users/
    pfp/         suitman/ professionals/ staff/ clients/
    banners/     landscapes/ colors/ abstract/
  enterprises/
    pfp/                          (logos, ate 512 px)
    banners/     corporate/ construction/ industrial/ logistics/ hospitality/ retail/ solar/
  units/
    <segmento>/  main/ banner/ gallery/
  products/
    solar-panels/   hero/ demo/
    infrastructure/ hero/ gallery/
manifest.json
scripts/
```

Segmentos de unidade: cafeteria, supermercado, hortifruti, acougue, frigorifico, padaria, restaurante, farmacia, varejo, data-center, startup, industria, academia, hotel, posto. O papel `main` e a imagem principal, `banner` e horizontal e `gallery` e complementar. Principal e banner de unidade nao devem se repetir entre unidades; galeria pode.

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

Um asset `images/enterprises/logos/K3M9QX.webp` vira `/images/mocks/enterprises/logos/K3M9QX.webp` no navegador. O catálogo copiado fica em `/images/mocks/manifest.json`.

## Seeds

Leia `manifest.json`, selecione os assets pelo `id` ou `category` e carregue o arquivo no caminho `path` relativo a este repositório. Envie o conteúdo para o armazenamento do ambiente e grave a URL resultante no banco. A escolha das entidades pertence ao seed; o envio dos arquivos para o Cloudinary é o comando acima.

Cada entrada contém `id`, `category`, `path`, `width`, `height`, `bytes`, `sha256`, `source.filename`, `description` e `tags`. O ID deriva do conteúdo original; o prefixo vem da categoria na importação e não muda quando a imagem é reclassificada. Preserve-o ao reotimizar o mesmo asset. O hash SHA256 valida o arquivo WebP distribuído. Nome original não implica fabricante, identidade ou permissão de uso; acrescente origem e créditos quando conhecidos.

## Cloudinary

O comando abaixo envia as imagens do catálogo para a cloud do Solaria, sem dependências. Cada arquivo sobe com `public_id = mocks/<id do manifest>` e `overwrite=false`, então repetir o comando não duplica nem sobrescreve nada. O catálogo é validado antes do envio.

```sh
npm run cloudinary -- --dry-run                       # lista o que seria enviado
CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud> npm run cloudinary
npm run cloudinary -- --only units/hotel              # so uma categoria (prefixo)
```

As credenciais vêm só do ambiente e nunca são impressas. O seed do `database-console` monta as URLs a partir do mesmo `public_id` (`https://res.cloudinary.com/<cloud>/image/upload/mocks/<id>.webp`), então ele pode rodar antes do upload. O prefixo `mocks/` é ignorado pelas rotinas de exclusão de foto do `api-core`, para que apagar uma foto de um produto nunca destrua o asset compartilhado.

Testes do script: `npm test`.

## Atributos e recorte

Cada entrada do `manifest.json` pode ter `attributes` (opcional, validado em `npm run validate`):

- `gender`: `F`, `M` ou `NB`. Gênero aparente do retrato, só nos `users/pfp/*`, para o seed casar nome e foto. Não identifica a pessoa. Ausente quando indefinido.
- `age_range`: `18-34`, `35-54` ou `55+`. Faixa aparente e aproximada.
- `setting`: `indoor` ou `outdoor`.
- `has_text_or_brand`: `true` ou `false`.
- `crop`: `{ x, y, width, height }` em pixels da imagem do repositório. O `npm run cloudinary` envia como `custom_coordinates`, e o backend monta as variantes de avatar e banner com `g_custom`. Hoje os 86 retratos em `users/pfp/*` têm `crop` (detecção de rosto, com ajuste manual onde a detecção falhou).

## Adicionar imagens

Use uma pasta de categoria existente (por exemplo `products/solar-panels/hero` para foto principal com fundo branco e `demo` para demonstracoes), um nome aleatorio de seis caracteres maiusculos (letras e numeros, unico no repositorio) e formato WebP. A descricao do que a imagem mostra vai no campo `description`, e as palavras-chave em `tags`. Registre o asset no catálogo, preencha descrição, tags, dimensões, tamanho em bytes, hash do arquivo e nome original. Rode `npm run validate` antes de compartilhar a alteração. Não inclua ZIPs, credenciais ou duplicatas de imagens de outros repositórios.

## Automação

Mantidos os workflows gerais de PRs, limpeza e releases semânticas do template. Removidos publicação Docker, sincronização QA e configuração de dependências Docker. O pacote é privado e não é publicado no npm.
