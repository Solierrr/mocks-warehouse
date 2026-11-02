<p align="center">
  <img src="../assets/readme/banners/cloudinary.png" alt="Cloudinary" width="100%">
</p>

# Consumo de imagens

O sincronizador copia os arquivos para `public/images/mocks/` do frontend, num destino que deve ser ignorado pelo Git, e permite repetir arquivos iguais, mas recusa arquivos diferentes com o mesmo nome.

O seed lê o manifesto e escolhe imagens por categoria e ID. O upload Cloudinary usa um prefixo compartilhado e o ID do catálogo. A existência da URL montada pelo seed não comprova que o upload ocorreu. A proteção contra exclusão de assets compartilhados pertence ao `api-core`.
