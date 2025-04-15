# backend/app/core/security.py
from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from ..core.config import settings
from ..core.database import get_database
import bcrypt
if not hasattr(bcrypt, '__about__'):
    bcrypt.__about__ = type('ModuleInfo', (), {'__version__': bcrypt.__version__})

# OAuth2 scheme para a rota /auth/sign-in
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/sign-in")

# Context para hash de senhas usando bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Funções de verificação e criação de hash de senha
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

# Funções para criação e verificação de tokens JWT
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def create_reset_password_token(email: str) -> str:
    expires_delta = timedelta(minutes=settings.RESET_PASSWORD_TOKEN_EXPIRE_MINUTES)
    return create_access_token(data={"sub": email}, expires_delta=expires_delta)

def decode_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            return None
        return {"email": email}
    except JWTError as e:
        print(f"JWT Error: {str(e)}")
        return None

# Função para obter o usuário atual a partir do token
async def get_current_user(token: str = Depends(oauth2_scheme), db=Depends(get_database)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciais inválidas",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    if not token:
        print("No token provided")
        raise credentials_exception
        
    token_data = decode_token(token)
    if token_data is None:
        print("Invalid token data")
        raise credentials_exception
        
    email = token_data.get("email")
    if email is None:
        print("No email in token data")
        raise credentials_exception
        
    user = await db.users.find_one({"email": email})
    if user is None:
        print(f"User not found for email: {email}")
        raise credentials_exception
        
    return user

# Verifica se o usuário atual é um jogador
async def get_current_player(current_user=Depends(get_current_user)):
    if current_user["user_type"] != "jogador":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso permitido apenas para jogadores"
        )
    return current_user

# Verifica se o usuário atual é um gerente
async def get_current_manager(current_user=Depends(get_current_user)):
    if current_user["user_type"] != "gerente":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso permitido apenas para gerentes de espaços"
        )
    return current_user