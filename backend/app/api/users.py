# backend/app/api/users.py
from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List
from bson.objectid import ObjectId
import datetime

from ..core.database import get_database
from ..core.security import get_current_user
from ..schemas.user import UserResponse, ProfileUpdate, PlayerProfileUpdate, ManagerProfileUpdate, Message
from ..schemas.notification import NotificationResponse, NotificationList, MarkAsReadRequest

router = APIRouter(prefix="/users", tags=["users"])

# Obter o perfil do usuário atual
@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(current_user=Depends(get_current_user)):
    user_dict = {}
    for key, value in current_user.items():
        if key == "_id":
            user_dict["id"] = str(value)
        elif isinstance(value, ObjectId):
            user_dict[key] = str(value)
        elif isinstance(value, datetime):
            user_dict[key] = value.isoformat()
        else:
            user_dict[key] = value
    
    # Remove sensitive fields
    if "hashed_password" in user_dict:
        del user_dict["hashed_password"]
    
    return user_dict

# Atualizar o perfil do usuário
@router.put("/me", response_model=UserResponse)
async def update_user_profile(
    profile_data: ProfileUpdate,
    current_user=Depends(get_current_user),
    db=Depends(get_database)
):
    # Filtra apenas campos não-nulos
    update_data = {k: v for k, v in profile_data.dict().items() if v is not None}
    
    if not update_data:
        return {
            "id": str(current_user["_id"]),
            **{k: v for k, v in current_user.items() if k != "_id" and k != "hashed_password"}
        }
    
    # Adiciona data de atualização
    from datetime import datetime
    update_data["updated_at"] = datetime.utcnow()
    
    # Atualiza no banco de dados
    await db.users.update_one(
        {"_id": current_user["_id"]},
        {"$set": update_data}
    )
    
    # Busca o usuário atualizado
    updated_user = await db.users.find_one({"_id": current_user["_id"]})
    
    return {
        "id": str(updated_user["_id"]),
        **{k: v for k, v in updated_user.items() if k != "_id" and k != "hashed_password"}
    }

# Atualizar o perfil específico de jogador
@router.put("/me/player-profile", response_model=Message)
async def update_player_profile(
    profile_data: PlayerProfileUpdate,
    current_user=Depends(get_current_user),
    db=Depends(get_database)
):
    # Verifica se o usuário é um jogador
    if current_user["user_type"] != "jogador":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso permitido apenas para jogadores"
        )
    
    # Filtra apenas campos não-nulos
    update_data = {k: v for k, v in profile_data.dict().items() if v is not None}
    
    if not update_data:
        return {"message": "Nenhum dado foi atualizado"}
    
    # Atualiza ou cria o perfil
    result = await db.player_profiles.update_one(
        {"user_id": current_user["_id"]},
        {"$set": update_data},
        upsert=True
    )
    
    return {"message": "Perfil de jogador atualizado com sucesso"}

# Atualizar o perfil específico de gerente
@router.put("/me/manager-profile", response_model=Message)
async def update_manager_profile(
    profile_data: ManagerProfileUpdate,
    current_user=Depends(get_current_user),
    db=Depends(get_database)
):
    # Verifica se o usuário é um gerente
    if current_user["user_type"] != "gerente":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso permitido apenas para gerentes"
        )
    
    # Filtra apenas campos não-nulos
    update_data = {k: v for k, v in profile_data.dict().items() if v is not None}
    
    if not update_data:
        return {"message": "Nenhum dado foi atualizado"}
    
    # Atualiza ou cria o perfil
    result = await db.manager_profiles.update_one(
        {"user_id": current_user["_id"]},
        {"$set": update_data},
        upsert=True
    )
    
    return {"message": "Perfil de gerente atualizado com sucesso"}

# Obter notificações do usuário
@router.get("/notifications", response_model=NotificationList)
async def get_notifications(
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=50),
    unread_only: bool = Query(False),
    current_user=Depends(get_current_user),
    db=Depends(get_database)
):
    # Filtro para buscar notificações
    filter_query = {"user_id": str(current_user["_id"])}
    if unread_only:
        filter_query["is_read"] = False
    
    # Conta total de notificações e não lidas
    total = await db.notifications.count_documents(filter_query)
    unread_count = await db.notifications.count_documents({
        "user_id": str(current_user["_id"]),
        "is_read": False
    })
    
    # Busca as notificações paginadas
    skip = (page - 1) * per_page
    cursor = db.notifications.find(filter_query).sort("created_at", -1).skip(skip).limit(per_page)
    
    notifications = []
    async for doc in cursor:
        doc["id"] = str(doc["_id"])
        del doc["_id"]
        notifications.append(doc)
    
    return {
        "notifications": notifications,
        "total": total,
        "unread_count": unread_count
    }

# Marcar notificações como lidas
@router.post("/notifications/mark-as-read", response_model=Message)
async def mark_notifications_as_read(
    data: MarkAsReadRequest,
    current_user=Depends(get_current_user),
    db=Depends(get_database)
):
    # Verifica se as notificações existem e pertencem ao usuário
    if not data.notification_ids:
        return {"message": "Nenhuma notificação para atualizar"}
    
    # Converte IDs de string para ObjectId
    object_ids = [ObjectId(id) for id in data.notification_ids]
    
    # Atualiza as notificações
    result = await db.notifications.update_many(
        {
            "_id": {"$in": object_ids},
            "user_id": str(current_user["_id"])
        },
        {"$set": {"is_read": True}}
    )
    
    return {"message": f"{result.modified_count} notificações marcadas como lidas"}