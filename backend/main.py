# backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from app.core.config import settings
from app.api import auth, users, events, spaces, reservations

# Criar a aplicação FastAPI
app = FastAPI(
    title="WhatsPort API",
    description="API para a plataforma WhatsPort - Rede Social de Esportes",
    version="1.0.0"
)

# Adicionar middleware CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOW_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir as rotas
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(events.router)
app.include_router(spaces.router)
app.include_router(reservations.player_router)
app.include_router(reservations.manager_router)

# Rota raiz
@app.get("/")
async def root():
    return {
        "app": "WhatsPort API",
        "version": "1.0.0",
        "status": "online"
    }

# Rota de verificação de saúde
@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Para executar a aplicação diretamente
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)