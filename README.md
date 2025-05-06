# WhatsPort - Plataforma de Eventos Esportivos

WhatsPort é uma aplicação web fullstack que facilita a organização e participação em eventos esportivos. A plataforma oferece duas visões principais: para jogadores que querem participar de eventos e para gerentes que administram espaços esportivos.

## Tecnologias Utilizadas

### Frontend
- **Next.js 15**: Framework React com renderização do lado do servidor
- **Shadcn UI**: Biblioteca de componentes e design system

## Funcionalidades

### Comuns
- Autenticação (cadastro, login, recuperação de senha)
- Gestão de perfil
- VCard para autenticação em eventos

### Jogadores
- Visualização de eventos em um mapa
- Busca e filtro de eventos próximos
- Participação em eventos
- Feed de atividades
- Gestão de amigos e grupos

### Gerentes
- Administração de espaços esportivos
- Gestão de solicitações de reserva
- Agenda de eventos
- Gestão financeira
- Validação de VCard

## Instalação

### Requisitos
- Node.js (versão 18+)

### Frontend
```bash
# Clonar o repositório
git clone https://github.com/seu-usuario/whatsport-app.git
cd whatsport-app

# Instalar dependências
npm install -y --legacy-peer-deps

# Iniciar em modo de desenvolvimento
npm run dev
```

## Estrutura do Projeto

```
whatsport-app/
├── src/                  # Código fonte do frontend
│   ├── app/              # Rotas Next.js App Router
│   ├── components/       # Componentes React
│   │   ├── ui/           # Componentes de UI reutilizáveis
│   │   ├── player/       # Componentes específicos para jogadores
│   │   ├── manager/      # Componentes específicos para gerentes
│   │   └── layout/       # Componentes de layout
│   ├── lib/              # Funções utilitárias
│   └── context/          # Contextos React (auth, temas, etc.)
├── public/               # Arquivos estáticos
└── backend/              # API FastAPI
    ├── app/              # Código da aplicação backend
    │   ├── api/          # Endpoints da API
    │   ├── core/         # Configurações, segurança, DB
    │   ├── models/       # Modelos de dados
    │   └── schemas/      # Esquemas de validação
    └── main.py           # Ponto de entrada da aplicação
```

## Arquitetura

O projeto segue uma arquitetura baseada em serviços, com uma clara separação entre frontend e backend. O frontend é organizado em componentes modulares para facilitar a manutenção e escalabilidade.

### Frontend
- **Módulos de UI**: Componentes base reutilizáveis
- **Módulos de Negócio**: Componentes específicos para cada tipo de usuário
- **Contextos**: Gerenciamento de estado global
- **Serviços**: Comunicação com a API

## Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/amazing-feature`)
3. Faça commit das suas alterações (`git commit -m 'Add some amazing feature'`)
4. Faça push para a branch (`git push origin feature/amazing-feature`)
5. Abra um Pull Request

## Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo LICENSE para detalhes.