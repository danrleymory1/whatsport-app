# backend/app/core/database.py
import motor.motor_asyncio
from ..core.config import settings

# Criar o cliente MongoDB
client = motor.motor_asyncio.AsyncIOMotorClient(settings.DATABASE_URL)

# Selecionar o banco de dados
db = client["whatsport_db"]

# Dependency Injection para usar em outros locais do backend
async def get_database():
    yield db