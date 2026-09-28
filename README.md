# CineTrack

Sistema de avaliação de filmes desenvolvido para a atividade DEV do Rocket Lab 2026.2.

A aplicação possui um frontend em React com TypeScript e uma API em FastAPI. Os dados são armazenados em SQLite usando SQLAlchemy e as migrações do banco são controladas pelo Alembic.

## Funcionalidades

- cadastro de filmes com título, diretor, ano, gêneros, duração, sinopse e pôster;
- catálogo paginado;
- pesquisa por título, diretor ou gênero;
- página de detalhes do filme;
- edição e remoção de filmes;
- cadastro de avaliações de 1 a 5 estrelas com resenha;
- histórico de avaliações;
- cálculo da média de avaliações de cada filme;
- interface responsiva.

## Estrutura

```text
.
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── db/
│   │   └── movies/
│   ├── migrations/
│   ├── scripts/
│   └── tests/
└── frontend/
    └── src/
```

## Backend

É necessário ter Python 3.11 ou superior.

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
cp .env.example .env
alembic upgrade head
uvicorn app.main:app --reload
```

No Windows, a ativação do ambiente virtual pode ser feita com:

```powershell
.venv\Scripts\activate
```

A API ficará disponível em `http://localhost:8000` e a documentação automática em `http://localhost:8000/docs`.

### Dados para demonstração

Depois de executar as migrações, é possível popular um banco vazio com alguns filmes para testar a interface:

```bash
python -m scripts.seed
```

O script não altera o banco caso já existam filmes cadastrados.

## Frontend

É necessário ter Node.js 18 ou superior.

Em outro terminal:

```bash
cd frontend
npm install
npm run dev
```

A interface ficará disponível em `http://localhost:5173`.

Se a API estiver sendo executada em outro endereço, crie um arquivo `.env` dentro da pasta `frontend` usando `.env.example` como referência.

## Testes do backend

```bash
cd backend
source .venv/bin/activate
pytest
```

## Build do frontend

```bash
cd frontend
npm run build
```
