from fastapi import APIRouter, Depends, HTTPException, status, Body, Response
from fastapi.security import OAuth2PasswordRequestForm 
from typing import Annotated
from datetime import timedelta

from motor.motor_asyncio import AsyncIOMotorDatabase
from jose import JWTError

from ..core.config import settings
from ..core.database import get_database
from ..core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_reset_password_token,
    decode_token
)
from ..models.user import User
from ..schemas.user import (
    UserCreate,
    UserLogin,
    UserResponse,
    Token,
    ForgotPassword,
    ResetPassword,
    Message,
    TokenData
)


router = APIRouter(prefix="/auth", tags=["auth"])

# --- Rotas ---

    
@router.post("/sign-up", response_model=Message, status_code=status.HTTP_201_CREATED)
async def sign_up(
    user: UserCreate, db: AsyncIOMotorDatabase = Depends(get_database)
):
    # Verifica se o usuário já existe
    existing_user = await db.users.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email já cadastrado.",
        )

    # Hash da senha
    hashed_password = get_password_hash(user.password)

    # Cria o novo usuário
    new_user = User(
        email=user.email, hashed_password=hashed_password, user_type=user.user_type
    )

    # Insere no banco de dados
    inserted_user = await db.users.insert_one(new_user.model_dump(by_alias=True, exclude={"id"}))

    return {"message": "Usuário cadastrado com sucesso!"}


@router.post("/sign-in", response_model=Token)
async def sign_in(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    response: Response,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    # Busca o usuário pelo email
    user_doc = await db.users.find_one({"email": form_data.username})
    if not user_doc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais inválidas.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Verifica a senha.  Use user_doc diretamente!
    if not verify_password(form_data.password, user_doc["hashed_password"]): # Acessa o campo correto
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais inválidas.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Cria o token JWT
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user_doc["email"]}, expires_delta=access_token_expires  # Usa email do user_doc
    )

    # --- Define o cookie (AQUI!) ---
    response.set_cookie(
        key="accessToken",
        value=access_token,
        httponly=True,
        secure=True,  # Use True em produção (HTTPS)
        samesite="lax",  # Ou "strict" (depende dos seus requisitos)
        expires=access_token_expires.total_seconds()  # Opcional, mas recomendado
    )

    return {"access_token": access_token, "token_type": "bearer"}



@router.post("/forgot-password", response_model=Message)
async def forgot_password(
    forgot_password: ForgotPassword, db: AsyncIOMotorDatabase = Depends(get_database)
):
    # Verifica se o usuário existe
    user_doc = await db.users.find_one({"email": forgot_password.email})
    if not user_doc:
        #  Não retorne erro de usuário inexistente por segurança
        #  (para evitar enumeração de usuários)
        return {"message": "Se o email estiver cadastrado, as instruções foram enviadas."}


    # Cria o token de reset de senha
    reset_token = create_reset_password_token(forgot_password.email)

    # --- Envio de Email (Simulação) ---
    #  Substitua isso pela lógica real de envio de email
    print(f"Simulação de envio de email para {forgot_password.email}:")
    print(f"Link de reset: http://localhost:3000/auth/reset-password?token={reset_token}")
    print("--- Fim da Simulação ---")

     # Implementar envio de e-mail aqui
    return {"message": "Se o email estiver cadastrado, as instruções foram enviadas."}



@router.post("/reset-password", response_model=Message)
async def reset_password(
        token: str,
        reset_data: ResetPassword = Body(...),
        db: AsyncIOMotorDatabase = Depends(get_database)
):
    # Decodifica e valida o token
    token_data = decode_token(token)
    if token_data is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Token inválido ou expirado."
        )

    # Verifica se as senhas coincidem
    if reset_data.password != reset_data.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="As senhas não coincidem."
        )

    # Busca o usuário pelo email
    user_doc = await db.users.find_one({"email": token_data.email})
    if not user_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado."
        )

    # Hash da nova senha
    hashed_password = get_password_hash(reset_data.password)

    # Atualiza a senha no banco de dados
    await db.users.update_one(
        {"email": token_data.email}, {"$set": {"hashed_password": hashed_password}}
    )

    return {"message": "Senha redefinida com sucesso!"}

@router.post("/logout", response_model=Message)
async def logout(response: Response):
    response.delete_cookie("accessToken") # Use o mesmo nome do cookie definido no login
    return {"message": "Logout realizado com sucesso."}