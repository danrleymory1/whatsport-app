# backend/app/api/spaces.py
from fastapi import APIRouter, Depends, HTTPException, Query, Path, status, Body
from typing import List, Optional
from datetime import datetime
from bson.objectid import ObjectId

from ..core.database import get_database
from ..core.security import get_current_user, get_current_manager
from ..models.space import Space, SpacePhoto
from ..schemas.space import (
    SpaceCreate,
    SpaceUpdate,
    SpaceResponse,
    SpaceList,
    AddPhotoRequest
)
from ..models.notification import Notification, NotificationType

router = APIRouter(prefix="/manager/spaces", tags=["manager-spaces"])

# Listar espaços do gerente
@router.get("", response_model=SpaceList)
async def list_spaces(
    page: int = Query(1, ge=1, description="Número da página"),
    per_page: int = Query(10, ge=1, le=100, description="Itens por página"),
    current_manager=Depends(get_current_manager),
    db=Depends(get_database)
):
    # Construir o filtro
    filter_query = {"manager_id": str(current_manager["_id"])}
    
    # Contar total de espaços
    total = await db.spaces.count_documents(filter_query)
    
    # Buscar espaços paginados
    skip = (page - 1) * per_page
    cursor = db.spaces.find(filter_query).sort("created_at", -1).skip(skip).limit(per_page)
    
    spaces = []
    async for doc in cursor:
        spaces.append({
            "id": str(doc["_id"]),
            **{k: v for k, v in doc.items() if k != "_id"}
        })
    
    return {
        "spaces": spaces,
        "total": total,
        "page": page,
        "per_page": per_page
    }

# Obter espaço por ID
@router.get("/{space_id}", response_model=SpaceResponse)
async def get_space(
    space_id: str = Path(..., description="ID do espaço"),
    current_manager=Depends(get_current_manager),
    db=Depends(get_database)
):
    try:
        space_doc = await db.spaces.find_one({"_id": ObjectId(space_id)})
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ID de espaço inválido"
        )
        
    if not space_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Espaço não encontrado"
        )
    
    # Verificar se o gerente é o dono do espaço
    if space_doc["manager_id"] != str(current_manager["_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso não autorizado a este espaço"
        )
    
    return {
        "id": str(space_doc["_id"]),
        **{k: v for k, v in space_doc.items() if k != "_id"}
    }

# Criar espaço
@router.post("", response_model=SpaceResponse, status_code=status.HTTP_201_CREATED)
async def create_space(
    space_data: SpaceCreate,
    current_manager=Depends(get_current_manager),
    db=Depends(get_database)
):
    # Criar objeto de espaço
    new_space = Space(
        **space_data.dict(),
        manager_id=str(current_manager["_id"]),
        photos=[]
    )
    
    # Inserir no banco de dados
    result = await db.spaces.insert_one(new_space.dict(by_alias=True, exclude={"id"}))
    
    # Buscar o espaço inserido
    created_space = await db.spaces.find_one({"_id": result.inserted_id})
    
    return {
        "id": str(created_space["_id"]),
        **{k: v for k, v in created_space.items() if k != "_id"}
    }

# Atualizar espaço
@router.put("/{space_id}", response_model=SpaceResponse)
async def update_space(
    space_data: SpaceUpdate,
    space_id: str = Path(..., description="ID do espaço"),
    current_manager=Depends(get_current_manager),
    db=Depends(get_database)
):
    try:
        # Verificar se o espaço existe
        space_doc = await db.spaces.find_one({"_id": ObjectId(space_id)})
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ID de espaço inválido"
        )
        
    if not space_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Espaço não encontrado"
        )
    
    # Verificar se o gerente é o dono do espaço
    if space_doc["manager_id"] != str(current_manager["_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso não autorizado a este espaço"
        )
    
    # Filtrar apenas campos não-nulos
    update_data = {k: v for k, v in space_data.dict().items() if v is not None}
    
    if not update_data:
        return {
            "id": str(space_doc["_id"]),
            **{k: v for k, v in space_doc.items() if k != "_id"}
        }
    
    # Atualizar a data de atualização
    update_data["updated_at"] = datetime.utcnow()
    
    # Atualizar no banco de dados
    await db.spaces.update_one(
        {"_id": ObjectId(space_id)},
        {"$set": update_data}
    )
    
    # Buscar o espaço atualizado
    updated_space = await db.spaces.find_one({"_id": ObjectId(space_id)})
    
    return {
        "id": str(updated_space["_id"]),
        **{k: v for k, v in updated_space.items() if k != "_id"}
    }

# Excluir espaço
@router.delete("/{space_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_space(
    space_id: str = Path(..., description="ID do espaço"),
    current_manager=Depends(get_current_manager),
    db=Depends(get_database)
):
    try:
        # Verificar se o espaço existe
        space_doc = await db.spaces.find_one({"_id": ObjectId(space_id)})
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ID de espaço inválido"
        )
        
    if not space_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Espaço não encontrado"
        )
    
    # Verificar se o gerente é o dono do espaço
    if space_doc["manager_id"] != str(current_manager["_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso não autorizado a este espaço"
        )
    
    # Verificar se há eventos futuros agendados para este espaço
    future_events = await db.events.count_documents({
        "space_id": space_id,
        "end_time": {"$gte": datetime.utcnow()}
    })
    
    if future_events > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Não é possível excluir um espaço com eventos futuros agendados"
        )
    
    # Verificar se há reservas futuras para este espaço
    future_reservations = await db.reservations.count_documents({
        "space_id": space_id,
        "end_time": {"$gte": datetime.utcnow()}
    })
    
    if future_reservations > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Não é possível excluir um espaço com reservas futuras"
        )
    
    # Excluir do banco de dados
    await db.spaces.delete_one({"_id": ObjectId(space_id)})
    
    return None

# Adicionar foto ao espaço
@router.post("/{space_id}/photos", response_model=SpaceResponse)
async def add_photo(
    photo_data: AddPhotoRequest,
    space_id: str = Path(..., description="ID do espaço"),
    current_manager=Depends(get_current_manager),
    db=Depends(get_database)
):
    try:
        # Verificar se o espaço existe
        space_doc = await db.spaces.find_one({"_id": ObjectId(space_id)})
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ID de espaço inválido"
        )
        
    if not space_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Espaço não encontrado"
        )
    
    # Verificar se o gerente é o dono do espaço
    if space_doc["manager_id"] != str(current_manager["_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso não autorizado a este espaço"
        )
    
    # Criar objeto de foto
    new_photo = SpacePhoto(
        url=photo_data.url,
        is_primary=photo_data.is_primary
    )
    
    # Se a nova foto for primária, atualizar as outras para não primárias
    if photo_data.is_primary:
        await db.spaces.update_one(
            {"_id": ObjectId(space_id)},
            {"$set": {"photos.$[elem].is_primary": False}},
            array_filters=[{"elem.is_primary": True}]
        )
    
    # Adicionar a foto ao espaço
    await db.spaces.update_one(
        {"_id": ObjectId(space_id)},
        {
            "$push": {"photos": new_photo.dict(by_alias=True, exclude={"id"})},
            "$set": {"updated_at": datetime.utcnow()}
        }
    )
    
    # Buscar o espaço atualizado
    updated_space = await db.spaces.find_one({"_id": ObjectId(space_id)})
    
    return {
        "id": str(updated_space["_id"]),
        **{k: v for k, v in updated_space.items() if k != "_id"}
    }

# Remover foto do espaço
@router.delete("/{space_id}/photos/{photo_id}", response_model=SpaceResponse)
async def remove_photo(
    space_id: str = Path(..., description="ID do espaço"),
    photo_id: str = Path(..., description="ID da foto"),
    current_manager=Depends(get_current_manager),
    db=Depends(get_database)
):
    try:
        # Verificar se o espaço existe
        space_doc = await db.spaces.find_one({"_id": ObjectId(space_id)})
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ID de espaço inválido"
        )
        
    if not space_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Espaço não encontrado"
        )
    
    # Verificar se o gerente é o dono do espaço
    if space_doc["manager_id"] != str(current_manager["_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso não autorizado a este espaço"
        )
    
    # Remover a foto do espaço
    try:
        await db.spaces.update_one(
            {"_id": ObjectId(space_id)},
            {
                "$pull": {"photos": {"_id": ObjectId(photo_id)}},
                "$set": {"updated_at": datetime.utcnow()}
            }
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ID de foto inválido"
        )
    
    # Buscar o espaço atualizado
    updated_space = await db.spaces.find_one({"_id": ObjectId(space_id)})
    
    return {
        "id": str(updated_space["_id"]),
        **{k: v for k, v in updated_space.items() if k != "_id"}
    }

# Listar espaços públicos (para jogadores)
@router.get("/public", response_model=SpaceList)
async def list_public_spaces(
    search: Optional[str] = Query(None, description="Termo de busca"),
    sport_type: Optional[str] = Query(None, description="Tipo de esporte"),
    city: Optional[str] = Query(None, description="Cidade"),
    page: int = Query(1, ge=1, description="Número da página"),
    per_page: int = Query(10, ge=1, le=100, description="Itens por página"),
    current_user=Depends(get_current_user),
    db=Depends(get_database)
):
    # Construir o filtro
    filter_query = {}
    
    # Filtrar por termo de busca
    if search:
        filter_query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]
    
    # Filtrar por tipo de esporte
    if sport_type:
        filter_query["available_sports.sport_type"] = sport_type
    
    # Filtrar por cidade
    if city:
        filter_query["location.city"] = {"$regex": city, "$options": "i"}
    
    # Contar total de espaços
    total = await db.spaces.count_documents(filter_query)
    
    # Buscar espaços paginados
    skip = (page - 1) * per_page
    cursor = db.spaces.find(filter_query).sort("name", 1).skip(skip).limit(per_page)
    
    spaces = []
    async for doc in cursor:
        spaces.append({
            "id": str(doc["_id"]),
            **{k: v for k, v in doc.items() if k != "_id"}
        })
    
    return {
        "spaces": spaces,
        "total": total,
        "page": page,
        "per_page": per_page
    }