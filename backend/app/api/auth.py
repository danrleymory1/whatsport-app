# backend/app/api/auth.py
from fastapi import APIRouter, Depends, HTTPException, status, Body, Response, Cookie
from fastapi.security import OAuth2PasswordRequestForm
from typing import Optional
from datetime import timedelta
from bson.objectid import ObjectId

from ..core.config import settings
from ..core.database import get_database
from ..core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_reset_password_token,
    decode_token
)
from ..models.user import User, UserType
from ..schemas.user import (
    UserCreate, 
    UserLogin, 
    UserResponse, 
    Token, 
    ForgotPassword, 
    ResetPassword, 
    Message
)

router = APIRouter(prefix="/auth", tags=["auth"])

# Rota para registro (sign-up)
@router.post("/sign-up", response_model=Message, status_code=status.HTTP_201_CREATED)
async def sign_up(user: UserCreate, db=Depends(get_database)):
    # Verifica se o usuário já existe
    existing_user = await db.users.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email já cadastrado",
        )

    # Hash da senha
    hashed_password = get_password_hash(user.password)

    # Cria o novo usuário
    new_user = User(
        email=user.email, 
        hashed_password=hashed_password, 
        user_type=user.user_type
    )

    # Insere no banco de dados
    await db.users.insert_one(new_user.dict(by_alias=True, exclude={"id"}))

    # Cria um perfil específico dependendo do tipo de usuário
    if user.user_type == UserType.PLAYER:
        from ..models.user import PlayerProfile
        player_profile = PlayerProfile(user_id=new_user.id)
        await db.player_profiles.insert_one(player_profile.dict(by_alias=True, exclude={"id"}))
    elif user.user_type == UserType.MANAGER:
        from ..models.user import ManagerProfile
        manager_profile = ManagerProfile(user_id=new_user.id)
        await db.manager_profiles.insert_one(manager_profile.dict(by_alias=True, exclude={"id"}))

    return {"message": "Usuário cadastrado com sucesso"}

# Rota para login (sign-in)
@router.post("/sign-in", response_model=Token)
async def sign_in(
    form_data: OAuth2PasswordRequestForm = Depends(),
    response: Response = None,
    db=Depends(get_database)
):
    # Busca o usuário pelo email
    user_doc = await db.users.find_one({"email": form_data.username})
    if not user_doc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais inválidas",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Verifica a senha
    if not verify_password(form_data.password, user_doc["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais inválidas",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Cria o token JWT
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user_doc["email"]}, 
        expires_delta=access_token_expires
    )

    # Define o cookie
    if response:
        response.set_cookie(
            key="accessToken",
            value=access_token,
            httponly=True,
            secure=True,
            samesite="lax",
            max_age=access_token_expires.total_seconds()
        )

    # Converte o documento do MongoDB para o modelo User
    user_data = {**user_doc}
    user_data["id"] = str(user_doc["_id"])
    
    # Remove campos sensíveis
    del user_data["hashed_password"]
    if "_id" in user_data:
        del user_data["_id"]

    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": user_data
    }

# Rota para recuperação de senha
@router.post("/forgot-password", response_model=Message)
async def forgot_password(forgot_password: ForgotPassword, db=Depends(get_database)):
    # Verifica se o usuário existe
    user_doc = await db.users.find_one({"email": forgot_password.email})
    if not user_doc:
        # Por segurança, não informamos se o email existe ou não
        return {"message": "Se o email estiver cadastrado, as instruções para redefinição de senha foram enviadas"}

    # Cria o token de reset de senha
    reset_token = create_reset_password_token(forgot_password.email)

    # TODO: Implementar envio de email com o link para reset de senha
    # Exemplo: http://localhost:3000/auth/reset-password?token={reset_token}
    
    # Para fins de desenvolvimento, mostramos o token no console
    print(f"Token de reset para {forgot_password.email}: {reset_token}")
    print(f"Link para reset: {settings.FRONTEND_URL}/auth/reset-password?token={reset_token}")

    return {"message": "Se o email estiver cadastrado, as instruções para redefinição de senha foram enviadas"}

# Rota para redefinição de senha
@router.post("/reset-password", response_model=Message)
async def reset_password(
    token: str,
    reset_data: ResetPassword,
    db=Depends(get_database)
):
    # Decodifica e valida o token
    token_data = decode_token(token)
    if token_data is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Token inválido ou expirado"
        )

    # Busca o usuário pelo email
    email = token_data.get("email")
    user_doc = await db.users.find_one({"email": email})
    if not user_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Usuário não encontrado"
        )

    # Hash da nova senha
    hashed_password = get_password_hash(reset_data.password)

    # Atualiza a senha no banco de dados
    await db.users.update_one(
        {"email": email}, 
        {"$set": {"hashed_password": hashed_password}}
    )

    return {"message": "Senha redefinida com sucesso"}

# Rota para logout
@router.post("/logout", response_model=Message)
async def logout(response: Response):
    # Remove o cookie
    response.delete_cookie(
        key="accessToken",
        httponly=True,
        secure=True,
        samesite="lax"
    )
    
    return {"message": "Logout realizado com sucesso"}