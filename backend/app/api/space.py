# backend/app/api/spaces.py
from fastapi import APIRouter, Depends, HTTPException, Query, Path, status
from typing import List, Optional
from datetime import datetime
from bson.objectid import ObjectId

from ..core.database import get_database
from ..core.security import decode_token
from ..models.space import (
    Space,
    SpaceCreate,
    SpaceUpdate,
    SpaceResponse,
    SpaceList,
    SpacePhoto,
    AddPhotoRequest
)
from ..models.user import User, UserType
from ..schemas.user import TokenData

router = APIRouter(prefix="/manager/spaces", tags=["manager-spaces"])

async def get_current_manager(token: str = Depends(decode_token), db = Depends(get_database)):
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Não autenticado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_data = await db.users.find_one({"email": token.email})
    if not user_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado",
        )
    
    user = User(**user_data)
    
    # Verificar se o usuário é um gerente
    if user.user_type != UserType.MANAGER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso restrito a gerentes de espaços",
        )
        
    return user

# Listar espaços do gerente
@router.get("", response_model=SpaceList)
async def list_spaces(
    page: int = Query(1, ge=1, description="Número da página"),
    per_page: int = Query(10, ge=1, le=100, description="Itens por página"),
    current_manager: User = Depends(get_current_manager),
    db = Depends(get_database)
):
    # Construir o filtro
    filter_query = {"manager_id": str(current_manager.id)}
    
    # Contar total de espaços
    total = await db.spaces.count_documents(filter_query)
    
    # Buscar espaços paginados
    skip = (page - 1) * per_page
    cursor = db.spaces.find(filter_query).sort("created_at", -1).skip(skip).limit(per_page)
    
    spaces = []
    async for doc in cursor:
        spaces.append(SpaceResponse(id=str(doc["_id"]), **doc))
    
    return SpaceList(
        spaces=spaces,
        total=total,
        page=page,
        per_page=per_page
    )

# Obter espaço por ID
@router.get("/{space_id}", response_model=SpaceResponse)
async def get_space(
    space_id: str = Path(..., description="ID do espaço"),
    current_manager: User = Depends(get_current_manager),
    db = Depends(get_database)
):
    try:
        space_doc = await db.spaces.find_one({"_id": ObjectId(space_id)})
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ID de espaço inválido",
        )
        
    if not space_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Espaço não encontrado",
        )