# backend/app/api/reservations.py
from fastapi import APIRouter, Depends, HTTPException, Query, Path, status, Body
from typing import List, Optional
from datetime import datetime
from bson.objectid import ObjectId

from ..core.database import get_database
from ..core.security import get_current_user, get_current_player, get_current_manager
from ..models.reservation import Reservation, ReservationStatus
from ..schemas.reservation import (
    ReservationCreate,
    ReservationUpdate,
    ReservationResponse,
    ReservationList,
    ReservationReject
)
from ..models.notification import Notification, NotificationType

# Router para jogadores
player_router = APIRouter(prefix="/player/reservations", tags=["player-reservations"])

# Router para gerentes
manager_router = APIRouter(prefix="/manager/reservations", tags=["manager-reservations"])

# --- Rotas para jogadores ---

# Criar reserva
@player_router.post("", response_model=ReservationResponse, status_code=status.HTTP_201_CREATED)
async def create_reservation(
    reservation_data: ReservationCreate,
    current_player=Depends(get_current_player),
    db=Depends(get_database)
):
    # Verificar se o espaço existe
    try:
        space = await db.spaces.find_one({"_id": ObjectId(reservation_data.space_id)})
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ID de espaço inválido"
        )
        
    if not space:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Espaço não encontrado"
        )
    
    # Verificar se o evento existe, se fornecido
    event_doc = None
    if reservation_data.event_id:
        try:
            event_doc = await db.events.find_one({"_id": ObjectId(reservation_data.event_id)})
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="ID de evento inválido"
            )
            
        if not event_doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Evento não encontrado"
            )
        
        # Verificar se o usuário é o organizador do evento
        if event_doc["organizer_id"] != str(current_player["_id"]):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Apenas o organizador do evento pode fazer reservas para ele"
            )
    
    # Verificar se já existe uma reserva para o mesmo espaço, data e horário
    conflict_query = {
        "space_id": reservation_data.space_id,
        "status": {"$in": [ReservationStatus.PENDING, ReservationStatus.APPROVED]},
        "$or": [
            # Reserva começa durante outra reserva
            {
                "start_time": {"$lte": reservation_data.start_time},
                "end_time": {"$gt": reservation_data.start_time}
            },
            # Reserva termina durante outra reserva
            {
                "start_time": {"$lt": reservation_data.end_time},
                "end_time": {"$gte": reservation_data.end_time}
            },
            # Reserva cobre completamente outra reserva
            {
                "start_time": {"$gte": reservation_data.start_time},
                "end_time": {"$lte": reservation_data.end_time}
            }
        ]
    }
    
    conflict = await db.reservations.find_one(conflict_query)
    if conflict:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Já existe uma reserva para este espaço neste horário"
        )
    
    # Verificar disponibilidade do espaço (dia da semana e horário)
    day_of_week = str(reservation_data.start_time.weekday())  # 0 = Segunda, 6 = Domingo
    
    # Verificar se o espaço está aberto no dia
    if day_of_week not in space.get("opening_hours", {}):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="O espaço não está aberto neste dia da semana"
        )
    
    # Verificar horário de funcionamento
    opening_hours = space["opening_hours"][day_of_week]
    opens_at = datetime.strptime(opening_hours["opens_at"], "%H:%M").time()
    closes_at = datetime.strptime(opening_hours["closes_at"], "%H:%M").time()
    
    if reservation_data.start_time.time() < opens_at or reservation_data.end_time.time() > closes_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"O espaço está aberto apenas das {opening_hours['opens_at']} às {opening_hours['closes_at']} neste dia"
        )
    
    # Verificar se o esporte está disponível no espaço
    available_sport = next((s for s in space["available_sports"] if s["sport_type"] == reservation_data.sport_type), None)
    if not available_sport:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"O esporte {reservation_data.sport_type} não está disponível neste espaço"
        )
    
    # Calcular preço total
    # Duração em horas
    duration_seconds = (reservation_data.end_time - reservation_data.start_time).total_seconds()
    duration_hours = duration_seconds / 3600
    
    price_per_hour = available_sport.get("price_per_hour", 0)
    total_price = price_per_hour * duration_hours * reservation_data.participants_count
    
    # Criar objeto de reserva
    new_reservation = Reservation(
        space_id=reservation_data.space_id,
        space_name=space["name"],
        event_id=reservation_data.event_id,
        organizer_id=str(current_player["_id"]),
        organizer_name=current_player.get("full_name") or current_player["email"].split("@")[0],
        organizer_email=current_player["email"],
        organizer_phone=current_player.get("phone"),
        sport_type=reservation_data.sport_type,
        start_time=reservation_data.start_time,
        end_time=reservation_data.end_time,
        participants_count=reservation_data.participants_count,
        total_price=total_price,
        notes=reservation_data.notes,
        status=ReservationStatus.PENDING
    )
    
    # Inserir no banco de dados
    result = await db.reservations.insert_one(new_reservation.dict(by_alias=True, exclude={"id"}))
    
    # Buscar a reserva inserida
    created_reservation = await db.reservations.find_one({"_id": result.inserted_id})
    
    # Notificar o gerente do espaço sobre a nova reserva
    notification = Notification(
        user_id=space["manager_id"],
        type=NotificationType.RESERVATION_REQUEST,
        title="Nova solicitação de reserva",
        message=f"Nova reserva de {new_reservation.organizer_name} para {new_reservation.sport_type} em {space['name']}",
        related_id=str(result.inserted_id),
        action_url=f"/manager/reservations/{str(result.inserted_id)}"
    )
    
    await db.notifications.insert_one(notification.dict(by_alias=True, exclude={"id"}))
    
    return {
        "id": str(created_reservation["_id"]),
        **{k: v for k, v in created_reservation.items() if k != "_id"}
    }

# Listar reservas do jogador
@player_router.get("", response_model=ReservationList)
async def list_player_reservations(
    status: Optional[ReservationStatus] = Query(None, description="Filtrar por status"),
    upcoming: Optional[bool] = Query(None, description="Filtrar por reservas futuras"),
    page: int = Query(1, ge=1, description="Número da página"),
    per_page: int = Query(10, ge=1, le=100, description="Itens por página"),
    current_player=Depends(get_current_player),
    db=Depends(get_database)
):
    # Construir o filtro
    filter_query = {"organizer_id": str(current_player["_id"])}
    
    # Filtrar por status
    if status:
        filter_query["status"] = status
    
    # Filtrar por reservas futuras
    if upcoming is True:
        filter_query["end_time"] = {"$gte": datetime.utcnow()}
    
    # Contar total de reservas
    total = await db.reservations.count_documents(filter_query)
    
    # Buscar reservas paginadas
    skip = (page - 1) * per_page
    cursor = db.reservations.find(filter_query).sort("start_time", 1).skip(skip).limit(per_page)
    
    reservations = []
    async for doc in cursor:
        reservations.append({
            "id": str(doc["_id"]),
            **{k: v for k, v in doc.items() if k != "_id"}
        })
    
    return {
        "reservations": reservations,
        "total": total,
        "page": page,
        "per_page": per_page
    }

# Obter reserva por ID
@player_router.get("/{reservation_id}", response_model=ReservationResponse)
async def get_player_reservation(
    reservation_id: str = Path(..., description="ID da reserva"),
    current_player=Depends(get_current_player),
    db=Depends(get_database)
):
    try:
        reservation_doc = await db.reservations.find_one({"_id": ObjectId(reservation_id)})
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ID de reserva inválido"
        )
        
    if not reservation_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reserva não encontrada"
        )
    
    # Verificar se o jogador é o organizador da reserva
    if reservation_doc["organizer_id"] != str(current_player["_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso não autorizado a esta reserva"
        )
    
    return {
        "id": str(reservation_doc["_id"]),
        **{k: v for k, v in reservation_doc.items() if k != "_id"}
    }

# Cancelar reserva
@player_router.post("/{reservation_id}/cancel", response_model=ReservationResponse)
async def cancel_reservation(
    reservation_id: str = Path(..., description="ID da reserva"),
    current_player=Depends(get_current_player),
    db=Depends(get_database)
):
    try:
        reservation_doc = await db.reservations.find_one({"_id": ObjectId(reservation_id)})
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ID de reserva inválido"
        )
        
    if not reservation_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reserva não encontrada"
        )
    
    # Verificar se o jogador é o organizador da reserva
    if reservation_doc["organizer_id"] != str(current_player["_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso não autorizado a esta reserva"
        )
    
    # Verificar se a reserva já foi cancelada
    if reservation_doc["status"] == ReservationStatus.CANCELED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Esta reserva já foi cancelada"
        )
    
    # Verificar se a reserva já foi rejeitada
    if reservation_doc["status"] == ReservationStatus.REJECTED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Esta reserva já foi rejeitada pelo gerente"
        )
    
    # Verificar se a reserva já foi concluída
    if reservation_doc["status"] == ReservationStatus.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Não é possível cancelar uma reserva já concluída"
        )
    
    # Atualizar status da reserva
    await db.reservations.update_one(
        {"_id": ObjectId(reservation_id)},
        {"$set": {"status": ReservationStatus.CANCELED, "updated_at": datetime.utcnow()}}
    )
    
    # Buscar a reserva atualizada
    updated_reservation = await db.reservations.find_one({"_id": ObjectId(reservation_id)})
    
    # Notificar o gerente do espaço sobre o cancelamento
    space = await db.spaces.find_one({"_id": ObjectId(reservation_doc["space_id"])})
    if space:
        notification = Notification(
            user_id=space["manager_id"],
            type=NotificationType.RESERVATION_CANCELED,
            title="Reserva cancelada",
            message=f"A reserva de {reservation_doc['organizer_name']} para {reservation_doc['sport_type']} em {space['name']} foi cancelada pelo organizador",
            related_id=reservation_id
        )
        
        await db.notifications.insert_one(notification.dict(by_alias=True, exclude={"id"}))
    
    return {
        "id": str(updated_reservation["_id"]),
        **{k: v for k, v in updated_reservation.items() if k != "_id"}
    }

# --- Rotas para gerentes ---

# Listar reservas de um espaço
@manager_router.get("/space/{space_id}", response_model=ReservationList)
async def list_space_reservations(
    space_id: str = Path(..., description="ID do espaço"),
    status: Optional[ReservationStatus] = Query(None, description="Filtrar por status"),
    upcoming: Optional[bool] = Query(None, description="Filtrar por reservas futuras"),
    page: int = Query(1, ge=1, description="Número da página"),
    per_page: int = Query(10, ge=1, le=100, description="Itens por página"),
    current_manager=Depends(get_current_manager),
    db=Depends(get_database)
):
    # Verificar se o espaço existe e pertence ao gerente
    try:
        space = await db.spaces.find_one({"_id": ObjectId(space_id)})
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ID de espaço inválido"
        )
        
    if not space:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Espaço não encontrado"
        )
    
    if space["manager_id"] != str(current_manager["_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso não autorizado a este espaço"
        )
    
    # Construir o filtro
    filter_query = {"space_id": space_id}
    
    # Filtrar por status
    if status:
        filter_query["status"] = status
    
    # Filtrar por reservas futuras
    if upcoming is True:
        filter_query["end_time"] = {"$gte": datetime.utcnow()}
    
    # Contar total de reservas
    total = await db.reservations.count_documents(filter_query)
    
    # Buscar reservas paginadas
    skip = (page - 1) * per_page
    cursor = db.reservations.find(filter_query).sort("start_time", 1).skip(skip).limit(per_page)
    
    reservations = []
    async for doc in cursor:
        reservations.append({
            "id": str(doc["_id"]),
            **{k: v for k, v in doc.items() if k != "_id"}
        })
    
    return {
        "reservations": reservations,
        "total": total,
        "page": page,
        "per_page": per_page
    }

# Obter reserva por ID
@manager_router.get("/{reservation_id}", response_model=ReservationResponse)
async def get_manager_reservation(
    reservation_id: str = Path(..., description="ID da reserva"),
    current_manager=Depends(get_current_manager),
    db=Depends(get_database)
):
    try:
        reservation_doc = await db.reservations.find_one({"_id": ObjectId(reservation_id)})
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ID de reserva inválido"
        )
        
    if not reservation_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reserva não encontrada"
        )
    
    # Verificar se o espaço pertence ao gerente
    try:
        space = await db.spaces.find_one({"_id": ObjectId(reservation_doc["space_id"])})
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ID de espaço inválido na reserva"
        )
        
    if not space or space["manager_id"] != str(current_manager["_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso não autorizado a esta reserva"
        )
    
    return {
        "id": str(reservation_doc["_id"]),
        **{k: v for k, v in reservation_doc.items() if k != "_id"}
    }

# Aprovar reserva
@manager_router.post("/{reservation_id}/approve", response_model=ReservationResponse)
async def approve_reservation(
    reservation_id: str = Path(..., description="ID da reserva"),
    current_manager=Depends(get_current_manager),
    db=Depends(get_database)
):
    try:
        reservation_doc = await db.reservations.find_one({"_id": ObjectId(reservation_id)})
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ID de reserva inválido"
        )
        
    if not reservation_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reserva não encontrada"
        )
    
    # Verificar se o espaço pertence ao gerente
    try:
        space = await db.spaces.find_one({"_id": ObjectId(reservation_doc["space_id"])})
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ID de espaço inválido na reserva"
        )
        
    if not space or space["manager_id"] != str(current_manager["_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso não autorizado a esta reserva"
        )
    
    # Verificar se a reserva está pendente
    if reservation_doc["status"] != ReservationStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Não é possível aprovar uma reserva com status {reservation_doc['status']}"
        )
    
    # Atualizar status da reserva
    await db.reservations.update_one(
        {"_id": ObjectId(reservation_id)},
        {"$set": {"status": ReservationStatus.APPROVED, "updated_at": datetime.utcnow()}}
    )
    
    # Buscar a reserva atualizada
    updated_reservation = await db.reservations.find_one({"_id": ObjectId(reservation_id)})
    
    # Notificar o organizador sobre a aprovação
    notification = Notification(
        user_id=reservation_doc["organizer_id"],
        type=NotificationType.RESERVATION_APPROVED,
        title="Reserva aprovada",
        message=f"Sua reserva para {reservation_doc['sport_type']} em {space['name']} foi aprovada",
        related_id=reservation_id,
        action_url=f"/player/reservations/{reservation_id}"
    )
    
    await db.notifications.insert_one(notification.dict(by_alias=True, exclude={"id"}))
    
    return {
        "id": str(updated_reservation["_id"]),
        **{k: v for k, v in updated_reservation.items() if k != "_id"}
    }

# Rejeitar reserva
@manager_router.post("/{reservation_id}/reject", response_model=ReservationResponse)
async def reject_reservation(
    data: ReservationReject,
    reservation_id: str = Path(..., description="ID da reserva"),
    current_manager=Depends(get_current_manager),
    db=Depends(get_database)
):
    try:
        reservation_doc = await db.reservations.find_one({"_id": ObjectId(reservation_id)})
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ID de reserva inválido"
        )
        
    if not reservation_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reserva não encontrada"
        )
    
    # Verificar se o espaço pertence ao gerente
    try:
        space = await db.spaces.find_one({"_id": ObjectId(reservation_doc["space_id"])})
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ID de espaço inválido na reserva"
        )
        
    if not space or space["manager_id"] != str(current_manager["_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso não autorizado a esta reserva"
        )
    
    # Verificar se a reserva está pendente
    if reservation_doc["status"] != ReservationStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Não é possível rejeitar uma reserva com status {reservation_doc['status']}"
        )
    
    # Atualizar status da reserva
    await db.reservations.update_one(
        {"_id": ObjectId(reservation_id)},
        {
            "$set": {
                "status": ReservationStatus.REJECTED, 
                "rejection_reason": data.rejection_reason,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    # Buscar a reserva atualizada
    updated_reservation = await db.reservations.find_one({"_id": ObjectId(reservation_id)})
    
    # Notificar o organizador sobre a rejeição
    notification = Notification(
        user_id=reservation_doc["organizer_id"],
        type=NotificationType.RESERVATION_REJECTED,
        title="Reserva rejeitada",
        message=f"Sua reserva para {reservation_doc['sport_type']} em {space['name']} foi rejeitada. Motivo: {data.rejection_reason}",
        related_id=reservation_id,
        action_url=f"/player/reservations/{reservation_id}"
    )
    
    await db.notifications.insert_one(notification.dict(by_alias=True, exclude={"id"}))
    
    return {
        "id": str(updated_reservation["_id"]),
        **{k: v for k, v in updated_reservation.items() if k != "_id"}
    }

# Marcar reserva como concluída
@manager_router.post("/{reservation_id}/complete", response_model=ReservationResponse)
async def complete_reservation(
    reservation_id: str = Path(..., description="ID da reserva"),
    current_manager=Depends(get_current_manager),
    db=Depends(get_database)
):
    try:
        reservation_doc = await db.reservations.find_one({"_id": ObjectId(reservation_id)})
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ID de reserva inválido"
        )
        
    if not reservation_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reserva não encontrada"
        )
    
    # Verificar se o espaço pertence ao gerente
    try:
        space = await db.spaces.find_one({"_id": ObjectId(reservation_doc["space_id"])})
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ID de espaço inválido na reserva"
        )
        
    if not space or space["manager_id"] != str(current_manager["_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso não autorizado a esta reserva"
        )
    
    # Verificar se a reserva está aprovada
    if reservation_doc["status"] != ReservationStatus.APPROVED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Não é possível marcar como concluída uma reserva com status {reservation_doc['status']}"
        )
    
    # Verificar se a data de fim da reserva já passou
    if reservation_doc["end_time"] > datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Não é possível marcar como concluída uma reserva que ainda não terminou"
        )
    
    # Atualizar status da reserva
    await db.reservations.update_one(
        {"_id": ObjectId(reservation_id)},
        {"$set": {"status": ReservationStatus.COMPLETED, "updated_at": datetime.utcnow()}}
    )
    
    # Buscar a reserva atualizada
    updated_reservation = await db.reservations.find_one({"_id": ObjectId(reservation_id)})
    
    # Incrementar contador de eventos participados no perfil do jogador
    try:
        await db.player_profiles.update_one(
            {"user_id": ObjectId(reservation_doc["organizer_id"])},
            {"$inc": {"events_participated": 1}}
        )
    except Exception:
        # Ignorar erro se o perfil não existir
        pass
    
    return {
        "id": str(updated_reservation["_id"]),
        **{k: v for k, v in updated_reservation.items() if k != "_id"}
    }