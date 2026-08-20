# Família Do'Baba — site do jogo

Este pacote é o projeto completo do site. Ele foi pensado para ficar **100% gratuito** usando:

- **GitHub Pages** para hospedar o site.
- **Supabase Free** para guardar participantes, perguntas e votos.
- JavaScript + HTML + CSS, sem servidor pago.

## Arquivos

- `index.html` — estrutura das telas.
- `styles.css` — visual minimalista no azul `#27364D`.
- `app.js` — funcionamento do jogo.
- `config.js` — onde você coloca as duas informações do Supabase.
- `supabase.sql` — banco de dados completo e funções do jogo.

## PASSO 1 — criar o Supabase

1. Acesse https://supabase.com/
2. Crie uma conta gratuita.
3. Clique em **New project**.
4. Dê um nome, por exemplo `familia-dobaba`.
5. Escolha a senha do banco e uma região próxima de você.
6. Espere o projeto terminar de ser criado.

## PASSO 2 — criar o banco

1. Dentro do projeto, abra **SQL Editor**.
2. Clique em **New query**.
3. Abra o arquivo `supabase.sql` deste pacote.
4. Copie TODO o conteúdo.
5. Cole no SQL Editor.
6. Clique em **Run**.
7. O resultado esperado é sucesso, sem mensagens vermelhas.

Esse script já cria os 8 participantes e as 20 perguntas.

## PASSO 3 — pegar as chaves

No Supabase:

1. Abra **Project Settings**.
2. Abra **API**.
3. Copie:
   - **Project URL**
   - **anon public key**
4. Abra `config.js`.
5. Troque:
   `COLE_AQUI_O_PROJECT_URL`
   pela URL do projeto.
6. Troque:
   `COLE_AQUI_A_CHAVE_ANON_PUBLIC`
   pela chave anon public.

### MUITO IMPORTANTE

Nunca coloque a chave `service_role` no site.
O arquivo `config.js` deve conter somente a chave **anon public**.

## PASSO 4 — testar antes de publicar

Você pode abrir o `index.html` no computador, mas alguns navegadores podem bloquear recursos quando o arquivo é aberto diretamente.

O jeito mais fácil é publicar no GitHub e testar por lá.

## PASSO 5 — criar o GitHub

1. Acesse https://github.com/
2. Crie uma conta gratuita ou entre na sua.
3. Clique em **New repository**.
4. Nome sugerido: `familia-dobaba`.
5. Pode deixar como **Public**.
6. Crie o repositório.

## PASSO 6 — colocar os arquivos

No repositório:

1. Clique em **Add file**.
2. Clique em **Upload files**.
3. Arraste estes 5 arquivos:
   - `index.html`
   - `styles.css`
   - `app.js`
   - `config.js`
   - `supabase.sql`
4. Clique em **Commit changes**.

O `README.md` é opcional, mas pode ser enviado também.

## PASSO 7 — ativar o GitHub Pages

No repositório:

1. Vá em **Settings**.
2. No menu lateral, procure **Pages**.
3. Em **Build and deployment**, escolha:
   - Source: **Deploy from a branch**
   - Branch: **main**
   - Folder: **/ (root)**
4. Salve.
5. Espere alguns minutos.
6. O GitHub mostrará o endereço do site.

## COMO O JOGO FUNCIONA

### Login

Cada pessoa entra com:

- primeiro nome;
- dia do nascimento;
- mês do nascimento;
- aceite dos termos.

Os dados precisam coincidir com os 8 participantes cadastrados.

### Perguntas

As 20 perguntas são as mesmas para todos, mas a ordem é embaralhada individualmente. A sessão de cada participante é reaproveitada se ele entrar novamente no mesmo navegador, evitando votos duplicados.

Exemplo:

- João: 1 → 8 → 14 → 3...
- Laura: 7 → 2 → 18 → 1...

O participante só consegue avançar depois de escolher alguém.

### Envio

Depois da 20ª pergunta, as respostas são enviadas de uma vez.

A tela passa para:

`X de 8 pessoas responderam.`

Ela consulta o Supabase automaticamente a cada 2,5 segundos.

### Resultados

Quando as 8 pessoas terminarem, TODOS passam para os resultados.

Os resultados aparecem na ordem original das perguntas, de 1 a 20.

Para cada pergunta aparecem:

- cada pessoa;
- quantidade de votos;
- nomes de quem votou naquela pessoa.

Exemplo:

Laura — 4 votos
João · Carla · Floriano · Vitória

Assim fica exatamente no estilo que você descreveu: dá para saber quem votou em quem.

### Final

Depois de ver todos os resultados, cada participante clica em:

`Até breve →`

e aparece:

`Até breve.
Obrigado.`

## SOBRE SEGURANÇA E PRIVACIDADE

Este projeto é um jogo privado, não um sistema profissional de autenticação.

A data de nascimento usada pelo jogo é somente dia + mês, conforme você pediu.

A chave usada no navegador é a **anon public** do Supabase. Ela é feita para ficar no frontend. As operações importantes do jogo são feitas por funções SQL.

Ainda assim, como é um jogo entre amigos, não considere isso equivalente a um sistema de segurança bancário ou a uma aplicação profissional de identidade.

Se você quiser transformar isso depois em um sistema mais protegido, dá para adicionar uma senha/código secreto da partida, autenticação real e painel de administrador.

## ALTERAR PERGUNTAS OU PARTICIPANTES

O jeito mais simples é alterar o `supabase.sql` e executar novamente.

ATENÇÃO: o começo do script apaga as tabelas antigas e recria tudo. Portanto, isso deve ser feito antes de uma nova partida ou quando você não precisar mais dos votos atuais.

## GRATUIDADE

O projeto não exige:

- domínio próprio;
- hospedagem paga;
- servidor;
- banco pago;
- aplicativo;
- computador ligado para o site funcionar.

Os limites do plano gratuito do GitHub/Supabase continuam sujeitos às regras e limites atuais desses serviços.
