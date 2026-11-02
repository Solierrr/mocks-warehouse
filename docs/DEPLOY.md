<p align="center">
  <img src="../assets/readme/banners/cloudinary.png" alt="Cloudinary" width="100%">
</p>

# Distribuição

O acervo é distribuído por Git, cópia local e upload Cloudinary, sem deploy de serviço ou publicação npm.

`npm run cloudinary` valida o catálogo e aceita filtro de categoria e limite de itens. Usa até quatro tarefas e repete falhas 429 ou 5xx até quatro tentativas. O envio assinado define `overwrite=false` e não substitui recursos existentes. Credenciais e cloud de destino ficam no ambiente, fora da documentação.
