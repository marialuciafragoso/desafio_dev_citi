# Documentação da API — Folhagem & Cia

## 1. Visão geral
Essa API foi construída para substituir a planilha de controle da loja **Folhagem & Cia**. O objetivo principal é fazer o gerenciamento completo (CRUD) das plantas da loja e controlar o estoque nas vendas, para evitar que, por exemplo, uma planta esgotada seja vendida por engano e validar as entradas antes de enviar para o banco de dados.

O projeto segue a mesma estrutura base do repositório (`routes` -> `Controller` -> `Repository` -> banco de dados).
**Ferramentas que utilizei:**
- **Node.js**, **Express** e **TypeScript** para o servidor e rotas;
- **Prisma** para conversar com o banco de dados e criar as tabelas (migrations);
- **PostgreSQL** rodando dentro do **Docker**.

---

## 2. Como rodar o projeto

Com o **Docker Desktop** aberto no computador, siga os passos abaixo no terminal:

1. Clonar o repositório e entrar na pasta:
   ```bash
   git clone <link-do-repositorio>
   cd repositorio-desafio-dev
   ```
2. Copiar o arquivo de variáveis de ambiente:
   ```bash
   cp .env.example .env
   ```
3. Instalar as dependências:
   ```bash
   yarn
   ```
4. Subir o servidor e o banco de dados no Docker:
   ```bash
   docker compose up -d --build
   ```
5. Rodar a migration para criar as tabelas no banco:
   ```bash
   yarn migration
   ```
6. *(Opcional - Bônus)* Cadastrar as plantas de exemplo no banco:
   ```bash
   yarn seed
   ```

A API já fica rodando em `http://localhost:3001`.

---

## 3. Modelo de dados

No arquivo `prisma/schema.prisma`, criei o enum `Luminosidade` e o model `Planta`:

- **Enum `Luminosidade`:** aceita apenas os valores `SOMBRA`, `MEIA_SOMBRA` ou `SOL_PLENO`.
- **Campos da `Planta`:**
  - `id` (`Int`): número gerado automaticamente pelo banco (`autoincrement`).
  - `nome` (`String`): nome popular da planta (ex: `"Costela-de-adão"`).
  - `especie` (`String`): nome científico (ex: `"Monstera deliciosa"`).
  - `preco` (`Int`): valor em centavos para evitar erro de arredondamento (ex: `8990` equivale a R$ 89,90). (precisa ser maior que zero)
  - `estoque` (`Int`): quantidade de vasos disponíveis. Não pode ser negativo, mas pode ser `0` quando a planta estiver esgotada.
  - `luminosidade` (`Luminosidade`): quanta luz a planta precisa (`SOMBRA`, `MEIA_SOMBRA` ou `SOL_PLENO`).
  - `petFriendly` (`Boolean`): `true` se for segura para pets, `false` se não for.
  - `regaACadaDias` (`Int`): de quantos em quantos dias ela precisa ser regada (no mínimo `1`).
  - `createdAt` e `updatedAt` (`DateTime`): datas preenchidas automaticamente pelo Prisma.

---

## 4. Rotas da API

### `POST /plantas` — Cadastrar planta
Cadastra uma planta nova no banco. Todos os campos são obrigatórios.
- **Exemplo de JSON enviado no body:**
  ```json
  {
    "nome": "Costela-de-adão",
    "especie": "Monstera deliciosa",
    "preco": 8990,
    "estoque": 12,
    "luminosidade": "MEIA_SOMBRA",
    "petFriendly": false,
    "regaACadaDias": 3
  }
  ```
- **Sucesso (`201 Created`):** devolve os dados da planta criada junto com o `id` gerado.

---

### `GET /plantas` — Listar plantas (com filtros e ordenação opcionais)
Lista as plantas cadastradas. Pode ser chamada sozinha (`/plantas`) ou combinando filtros na URL:
- `?luminosidade=MEIA_SOMBRA` (filtra pela luminosidade)
- `?petFriendly=true` ou `false` (filtra se é petfriendly)
- `?nome=costela` *(Bônus: busca plantas pelo nome sem diferenciar maiúsculas e minúsculas)*
- `?ordem=preco` ou `?ordem=nome` *(Bônus: ordena os resultados pelo preço ou em ordem alfabética)*
- **Sucesso (`200 OK`):** devolve a lista `[...]` com as plantas encontradas (ou `[]` se nenhuma planta bater com o filtro).

---

### `GET /plantas/esgotadas` — Listar plantas sem estoque *(Bônus)*
Busca apenas as plantas que estão com `estoque` igual a `0`.
- **Sucesso (`200 OK`):** devolve a lista de plantas esgotadas.

---

### `GET /plantas/estoque/valor-total` — Valor total do estoque
Busca o preço e o estoque de cada planta e calcula o valor total guardado na loja (somando `preco * estoque` de cada uma) e o total de vasos.
- **Sucesso (`200 OK`):**
  ```json
  {
    "valorTotalEmCentavos": 154300,
    "totalDeVasos": 37
  }
  ```

---

### `GET /plantas/:id` — Buscar planta por ID
Busca uma única planta pelo número de `id` passado na URL (ex: `/plantas/1`).
- **Sucesso (`200 OK`):** devolve o objeto da planta encontrada.

---

### `PATCH /plantas/:id` — Editar planta
Atualiza apenas os campos que forem enviados no body (os campos que não forem enviados continuam iguais). Os campos enviados passam pelas mesmas regras de validação do cadastro.
- **Exemplo de JSON enviado no body (mudando só o preço):**
  ```json
  {
    "preco": 9500
  }
  ```
- **Sucesso (`200 OK`):** devolve a planta já atualizada.

---

### `DELETE /plantas/:id` — Deletar planta
Remove a planta do banco de dados pelo `id`.
- **Sucesso (`204 No Content`):** remove a planta e responde sem corpo.

---

### `POST /plantas/:id/venda` — Vender planta
Recebe a quantidade de vasos comprados e diminui o estoque da planta correspondente.
- **Exemplo de JSON enviado no body:**
  ```json
  {
    "quantidade": 2
  }
  ```
- **Sucesso (`200 OK`):** devolve a planta com o novo valor de estoque.

---

### `POST /plantas/:id/reposicao` — Repor estoque da planta *(Extra)*
Recebe a quantidade de vasos novos que chegaram na loja e soma ao estoque atual da planta correspondente.
- **Exemplo de JSON enviado no body:**
  ```json
  {
    "quantidade": 10
  }
  ```
- **Sucesso (`200 OK`):** devolve a planta com o estoque atualizado.

---

## 5. Erros e Status HTTP

- **`400 Bad Request`** (quando o cliente envia dados inválidos):
  - Faltou algum campo obrigatório no cadastro (`POST /plantas`);
  - Algum campo veio com o tipo errado (ex: `"preco": "8990"` como texto, ou `:id` na URL com letras como `/plantas/abc`);
  - Valores fora das regras (`preco <= 0`, `estoque < 0`, `regaACadaDias < 1` ou `luminosidade` diferente das 3 opções);
  - Filtro ou ordenação com valor inválido na URL (ex: `?luminosidade=LUA`);
  - Na venda ou reposição: `quantidade` menor ou igual a zero, ou na venda quando a `quantidade` pedida é maior do que o `estoque` disponível (nesse caso o estoque não é alterado).

- **`404 Not Found`** (quando não encontra o registro):
  - Quando o `:id` buscado, editado, deletado, vendido ou reposto não existe no banco de dados.

- **`500 Internal Server Error`**:
  - Caso aconteça algum erro inesperado no servidor ou no banco (tratado no `catch` de cada função).

---

## 6. Decisões tomadas e Bônus

- **Cuidado na validação de `0` e `false`:** Em vez de validar campos obrigatórios com `!campo` (que recusaria `estoque: 0` e `petFriendly: false`), comparei diretamente com `campo === undefined`.
- **Ordem das rotas no `routes.ts`:** Registrei `/plantas/estoque/valor-total` e `/plantas/esgotadas` antes de `/plantas/:id` para o Express não achar que as palavras `"estoque"` ou `"esgotadas"` eram um `id`.
- **Duas vendas ao mesmo tempo:** Para evitar que duas pessoas comprem o último vaso exatamente ao mesmo tempo e deixem o estoque negativo, no `PlantaRepository` usei `updateMany` colocando a condição `estoque: { gte: quantidade }` direto no `where` da atualização junto com o `decrement`. Assim o próprio banco só diminui se ainda tiver estoque na hora exata da operação.
- **Consulta mais leve no cálculo do valor total (`select`):** Na rota `GET /plantas/estoque/valor-total`, em vez de buscar todos os dados das plantas no banco, usei o `select: { preco: true, estoque: true }` do Prisma para trazer apenas as duas colunas necessárias para a conta, deixando a consulta mais limpa e direta.
- **Bônus feitos:** Implementei os 4 bônus sugeridos (busca por `?nome=` ignorando maiúsculas/minúsculas, ordenação com `?ordem=`, rota `GET /plantas/esgotadas` e o script `prisma/seed.ts` rodando com `yarn seed`).
- **Funcionalidade extra (`POST /plantas/:id/reposicao`):** Criei uma rota extra pensando no estoque: quando chegam vasos novos na loja, o sistema usa o `increment` do Prisma para somar a `quantidade` recebida direto ao estoque que já existia no banco, sem precisar calcular a soma manualmente no `PATCH`.
