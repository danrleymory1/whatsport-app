from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware  # Importante para o frontend
from .app.api import auth

app = FastAPI()

# --- Configuração do CORS ---
#  Permite requisições do frontend (ajuste as origens conforme necessário)
origins = [
    "http://localhost:3000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],  # Permite todas as origens
    allow_credentials=True,
    allow_methods=["*"],  # Permite todos os métodos (GET, POST, etc.)
    allow_headers=["*"],  # Permite todos os headers
)

# --- Inclui as rotas ---
app.include_router(auth.router)

@app.get("/")
async def read_root():
    return {"message": "Bem-vindo à API da Rede Social de Esportes!"}