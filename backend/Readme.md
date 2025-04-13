# WhatSport - API Backend

Backend para o aplicativo WhatSport, uma plataforma para organização e participação em eventos esportivos.

## Tecnologias utilizadas

- **FastAPI**: Framework web para criação de APIs em Python
- **Motor**: Driver assíncrono para MongoDB
- **PyJWT**: Biblioteca para autenticação com JWT
- **Pydantic**: Validação de dados e configurações
- **Uvicorn**: Servidor ASGI para Python

## Requisitos

- Python 3.8+
- MongoDB

## Instalação

1. Clone o repositório:
```bash
git clone [URL_DO_REPOSITORIO]
cd backend
```

2. Crie e ative um ambiente virtual (opcional, mas recomendado):
```bash
python -m venv venv
# No Windows
venv\Scripts\activate
# No Linux/Mac
source venv/bin/activate
```

3. Instale as dependências:
```bash
pip install -r requirements.txt
```

4. Configure as variáveis de ambiente:
```bash
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

5. Inicie o servidor:
```bash
uvicorn main:app --reload
```

O servidor estará disponível em `http://localhost:8000`

## Documentação da API

Após iniciar o servidor, acesse:

- Documentação Swagger UI: `http://localhost:8000/docs`
- Documentação ReDoc: `http://localhost:8000/redoc`

## Estrutura do Projeto

```
backend/
├── app/
│   ├── __init__.py
│   ├── api/
│   │   ├── __init__.py
│   │   ├── auth.py        # Rotas de autenticação
│   │   ├── events.py      # Rotas de eventos
│   │   ├── reservations.py # Rotas de reservas
│   │   ├── spaces.py      # Rotas de espaços
│   │   └── users.py       # Rotas de usuários
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py      # Configurações da aplicação
│   │   ├── database.py    # Conexão com o banco de dados
│   │   └── security.py    # Funções de segurança
│   ├── models/
│   │   ├── __init__.py
│   │   ├── event.py       # Modelos para eventos
│   │   ├── notification.py # Modelos para notificações
│   │   ├── reservation.py # Modelos para reservas
│   │   ├── space.py       # Modelos para espaços
│   │   └── user.py        # Modelos para usuários
│   └── schemas/
│       ├── __init__.py
│       ├── event.py       # Esquemas para eventos
│       ├── notification.py # Esquemas para notificações
│       ├── reservation.py # Esquemas para reservas
│       ├── space.py       # Esquemas para espaços
│       └── user.py        # Esquemas para usuários
├── .env.example           # Exemplo de variáveis de ambiente
├── main.py               # Ponto de entrada da aplicação
└── requirements.txt      # Dependências do projeto
```

## Principais rotas da API

### Autenticação
- `POST /auth/sign-up` - Registro de usuário
- `POST /auth/sign-in` - Login de usuário
- `POST /auth/forgot-password` - Recuperação de senha
- `POST /auth/reset-password` - Resetar senha

### Usuários
- `GET /users/me` - Obter perfil do usuário logado
- `PUT /users/me` - Atualizar perfil do usuário
- `GET /users/notifications` - Listar notificações do usuário

### Eventos
- `GET /player/events` - Listar eventos
- `POST /player/events` - Criar evento
- `GET /player/events/{id}` - Obter detalhes de um evento
- `PUT /player/events/{id}` - Atualizar evento
- `DELETE /player/events/{id}` - Excluir evento
- `POST /player/events/{id}/join` - Participar de um evento
- `GET /player/events/nearby` - Listar eventos próximos

### Espaços
- `GET /manager/spaces` - Listar espaços do gerente
- `POST /manager/spaces` - Criar novo espaço
- `GET /manager/spaces/{id}` - Obter detalhes de um espaço
- `PUT /manager/spaces/{id}` - Atualizar espaço
- `DELETE /manager/spaces/{id}` - Excluir espaço
- `GET /manager/spaces/public` - Listar espaços públicos

### Reservas
- `GET /player/reservations` - Listar reservas do usuário
- `POST /player/reservations` - Criar uma reserva
- `GET /player/reservations/{id}` - Obter detalhes da reserva