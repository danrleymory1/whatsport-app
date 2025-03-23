import motor.motor_asyncio
from ..core.config import settings

client = motor.motor_asyncio.AsyncIOMotorClient(settings.DATABASE_URL)
db = client["sports_social_db"]  # Substitua "sports_social_db" pelo nome do seu banco

async def get_database(): # Dependency Injection para usar em outros locais do backend
    yield db