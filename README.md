# Pílulas de Integridade — Unimed Centro Rondônia

Sistema web de engajamento e conformidade ética desenvolvido para a **Unimed Centro Rondônia** com base na política institucional **POL.INT.7.3**. O aplicativo permite que colaboradores testem seus conhecimentos em compliance e ética cooperativa, participando de um ranking oficial com regras de desempate e premiação configurável, além de disponibilizar um painel administrativo completo para a equipe de Governança.

---

## 🎨 Identidade Visual da Marca

- **Verde Unimed**: `#00995D`
- **Verde Escuro**: `#005C40`
- **Verde Complementar**: `#007B4B`
- **Verde Claro**: `#E8F5EC`
- **Verde Cítrico**: `#B1D34B`
- **Laranja**: `#F47920`
- **Fundo Institucional**: `#F7FAF8`
- **Tipografia**: Nunito Sans
- **Logotipo e Favicon**: Oficiais da Unimed Centro Rondônia

---

## 🚀 Funcionalidades Principais

### 1. Fluxo do Colaborador (Público)
- **Tela Inicial**: Apresentação da campanha POL.INT.7.3, regulamento da premiação especial e estimativa de duração.
- **Identificação**: Coleta obrigatória de nome completo e seleção do setor (9 setores padrão integrados).
- **Quiz Interativo**:
  - Exibição de 1 pergunta por vez com identificação da pílula (ex: *Pílula #01*).
  - 4 alternativas (A, B, C e D) com seleção interativa.
  - Feedback imediato: destaque visual da opção correta (verde) e da opção escolhida se houver erro (vermelho).
  - Explicação fundamentada no Código de Conduta e na política POL.INT.7.3.
  - Cronômetro ativo e registro seguro de data/hora no servidor.
- **Resultado Final**:
  - Quantidade de acertos e aproveitamento (%).
  - Tempo total de realização.
  - Data e hora exatas de conclusão.
  - Classificação da participação (Oficial na 1ª tentativa ou Adicional para treinamento).
  - Elegibilidade ao prêmio com mensagem comemorativa e confetes em caso de gabarito (100%).
  - Opções para **Compartilhar Resultado** e **Baixar Comprovante em Imagem (PNG)** gerado em alta definição.

### 2. Área Administrativa (Protegida)
- **Autenticação**: Acesso restrito ao e-mail institucional autorizado (`rrochapablo@gmail.com`) ou administradores cadastrados.
- **Dashboard com Métricas em Tempo Real**:
  - Total de colaboradores únicos.
  - Total de tentativas concluídas.
  - Quantidade de gabaritos (100% de acertos).
  - Quantidade de participações adicionais.
- **Gráficos de Desempenho**:
  - Taxa de assertividade e volume de participações por setor.
  - Histograma de distribuição de pontuações.
- **Filtros e Auditoria**:
  - Busca por nome do colaborador ou setor.
  - Filtro por tipo de tentativa (Oficiais, Adicionais, Gabaritos, Elegíveis ao Prêmio).
  - Modal de **Auditoria de Snapshot**: visualização exata das perguntas e respostas selecionadas pelo colaborador na data em que jogou.
- **Exportação CSV**: Download com um clique de relatório estruturado para Excel/Google Sheets.
- **Gerenciador de Setores**: Criação, edição, ativação/desativação e exclusão.
- **Gerenciador de Perguntas**:
  - Criação e edição de perguntas com pílula, enunciado, alternativas, gabarito e explicação.
  - Controle de ativação (perguntas inativas não são exibidas para novos participantes).
  - **Imutabilidade histórica**: perguntas editadas nunca afetam a correção nem o snapshot de tentativas passadas.
- **Gestão de Ganhadores**:
  - Configuração dinâmica da quantidade de vagas de premiação (`maxWinners`).
  - Pódio em destaque com os vencedores oficiais.
  - Tabela do ranking oficial com critérios rígidos de desempate.

---

## 🏆 Regras do Ranking e Premiação

1. **Apenas tentativas concluídas** entram no ranking.
2. **Primeira participação oficial**: A 1ª tentativa concluída de cada combinação única de (Nome + Setor) é considerada a participação oficial.
3. **Participações adicionais**: Tentativas subsequentes do mesmo colaborador no mesmo setor são registradas como adicionais (não concorrem ao prêmio, servindo para fixação pedagógica).
4. **Critérios de ordenação**:
   1. **Maior pontuação** (score decrescente).
   2. **Menor tempo de conclusão** (durationSeconds crescente).
   3. **Data mais antiga de conclusão** (endTime crescente).
5. **Elegibilidade ao prêmio**: Colaboradores que gabaritarem (100% de acertos) em sua participação oficial recebem o status de elegíveis, respeitando a quantidade de ganhadores configurada no painel administrativo.

---

## 🛠️ Tecnologias Utilizadas

- **Framework**: Next.js 15+ (App Router, Server Actions e Route Handlers)
- **Linguagem**: TypeScript
- **Estilização**: Tailwind CSS v4 com identidade visual Unimed
- **Validação de Dados**: Zod
- **ORM & Banco de Dados**: Prisma ORM com PostgreSQL (e mecanismo de persistência seguro local/fallback para execução imediata)
- **Efeitos e UI**: Canvas Confetti, Lucide React, HTML5 Canvas para geração de comprovantes

---

## 📦 Como Executar Localmente

### 1. Clonar e Instalar Dependências

```bash
git clone <url-do-repositorio>
cd pilulas-de-integridade-unimed
npm install
```

### 2. Configurar Variáveis de Ambiente

Copie o arquivo de exemplo:

```bash
cp .env.example .env
```

Edite o arquivo `.env` inserindo sua string de conexão com o PostgreSQL:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/pilulas_integridade?schema=public"
ADMIN_DEFAULT_EMAIL="rrochapablo@gmail.com"
```

> **Nota de Execução**: O sistema possui dupla camada de dados. Se o banco PostgreSQL/Supabase não estiver conectado no momento, o aplicativo executa com persistência automática no armazenamento local estruturado (`data/db-store.json`), garantindo zero falhas ou quedas de serviço durante o desenvolvimento.

### 3. Executar as Migrações no Supabase

Você pode aplicar a migração no Supabase de duas formas:

#### Opção A: Pelo SQL Editor do Supabase (Mais Rápido e Direto)
1. Acesse o painel do seu projeto no **Supabase**.
2. No menu lateral, clique em **SQL Editor**.
3. Copie o conteúdo do arquivo [`supabase/schema.sql`](./supabase/schema.sql) e cole no editor.
4. Clique em **Run** (Executar).
5. Pronto! Todas as tabelas, índices, chaves estrangeiras com exclusão em cascata e os dados iniciais (setores, pílulas e admin) serão criados.

#### Opção B: Via Prisma CLI
1. No seu arquivo `.env`, preencha as variáveis obtidas nas configurações do Supabase (*Project Settings -> Database*):
   - `DATABASE_URL`: Connection string do pooler (porta 6543, modo Transaction).
   - `DIRECT_URL`: Connection string direta (porta 5432, modo Session).
2. Execute o comando de migração:
   ```bash
   npx prisma migrate deploy
   ```
3. Execute o seed para popular o banco:
   ```bash
   npm run seed
   ```

### 4. Executar o Seed Inicial

Popula o banco com os 9 setores iniciais da Unimed Centro Rondônia, as 4 pílulas institucionais e o administrador autorizado:

```bash
npm run seed
```

### 5. Executar os Testes Automatizados

O projeto inclui suíte de testes cobrindo todas as 6 regras de negócio exigidas:

```bash
npm test
```

Os testes verificam:
1. Correção das respostas (alternativa correta vs incorreta).
2. Cálculo da pontuação acumulada.
3. Regra da primeira participação oficial vs adicional.
4. Ordenação do ranking (Pontuação DESC → Tempo ASC → Data ASC).
5. Regra de premiação (100% de acertos, participação oficial, limite de vagas).
6. Permissões de administrador autorizado (`rrochapablo@gmail.com`).

### 6. Iniciar o Servidor de Desenvolvimento

```bash
npm run dev
```

Acesse em seu navegador: [http://localhost:3000](http://localhost:3000)

---

## 🚀 Publicação na Vercel

1. Suba o código para o seu repositório no GitHub.
2. Na [Vercel](https://vercel.com), importe o repositório.
3. Adicione a variável `DATABASE_URL` vinculando ao **Vercel Postgres**, **Supabase** ou **Neon**.
4. O build executará `npm run build` gerando a aplicação de forma otimizada.
5. Pronto! O quiz de conformidade estará acessível para todos os colaboradores.
