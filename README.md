# Downloads oficiais · Guila Store

[Abrir a Guila Store](https://guila-apps.pages.dev)

Aplicativos publicados pelo proprietário da loja. Os visitantes podem abrir as versões web e baixar os instaladores públicos. A edição do catálogo fica restrita ao painel privado.

## AimForge 0.4.2

- [Windows x64 · ZIP portátil](https://guila-apps.pages.dev/download/AimForge-0.4.2-win-x64.zip)
- [macOS Apple Silicon · ZIP](https://guila-apps.pages.dev/download/AimForge-0.4.2-arm64-mac.zip)
- [Versão web](https://aimforge.pages.dev/)

Os instaladores estão hospedados na Guila Store. Os dois arquivos completos e a retomada de downloads foram conferidos; os hashes correspondem aos pacotes originais.

Windows: extraia a pasta inteira e abra AimForge.exe. A execução desta versão em um PC Windows ainda precisa de validação.

macOS: extraia o ZIP e mova AimForge.app para Aplicativos. O pacote tem assinatura ad hoc, sem notarização da Apple.

A atualização é manual. Faça backup dos dados dentro do aplicativo antes de substituir a versão. A loja não instala nem atualiza programas automaticamente.

## SHA-256

| Plataforma | Hash |
| --- | --- |
| Windows x64 | `33b0fdaefc1ab69255945205839c14fee557c4aa53e866cc6db0ac33c2a39e87` |
| macOS Apple Silicon | `490f2ae75984ae011d595d2a20683bbc07952594faa7781f9d95d19846578833` |

## Automação de publicação

Destino: computadores Windows x64 e macOS Apple Silicon no AimForge; computadores Windows e macOS com Python 3.9+ no Arquivista. Interação por mouse e teclado. Os aplicativos funcionam offline e consultam a loja somente para descobrir versões. Dados de treino, índices, favoritos e arquivos permanecem locais.

Este repositório contém o fluxo que lê as fontes privadas com chaves somente de leitura, gera os pacotes, testa e publica os arquivos públicos. As solicitações chegam por um push no ramo main de cada aplicativo. O catálogo só muda depois que ambos os pacotes estão prontos. Cada app usa uma chave de publicação separada; a chave administrativa da loja não entra no fluxo.

A instalação dos arquivos de workflow no GitHub está pendente de autorização do proprietário. A versão local do fluxo e dos verificadores já está preparada e testada. Não considere a automação ativa até a primeira execução completa ser verificada.

A atualização oferecida pelos programas é o download da versão nova. O fluxo não substitui arquivos nem reinicia o software automaticamente. Pacotes antigos precisam primeiro receber uma versão que inclua o verificador.
