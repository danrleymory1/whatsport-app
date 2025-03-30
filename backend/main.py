from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .app.api import auth, events, space

app = FastAPI(title="WhatSport API", description="API para a plataforma WhatSport")

# --- Configuração do CORS ---
origins = [
    "http://localhost:3000",  # Frontend Next.js em desenvolvimento
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Para produção, use origins específicas em vez de '*'
    allow_credentials=True,
    allow_methods=["*"],  # Permite todos os métodos (GET, POST, etc.)
    allow_headers=["*"],  # Permite todos os headers
)

# --- Inclui as rotas ---
app.include_router(auth.router)
app.include_router(events.router, prefix="/api")
app.include_router(space.router, prefix="/api")

@app.get("/")
async def read_root():
    return {"message": "Bem-vindo à API da Rede Social de Esportes!"}
