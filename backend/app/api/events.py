# backend/app/api/events.py
from fastapi import APIRouter, Depends, HTTPException, Query, Path, status
from typing import List, Optional
from datetime import datetime, timedelta
from bson.objectid import ObjectId
import math

from ..core.database import get_database
from ..core.security import get_current_user, get_current_player
from ..models.event import Event, Participant
from ..schemas.event import (
    EventCreate, 
    EventUpdate, 
    EventResponse, 
    EventList, 
    JoinEventRequest, 
    JoinEventResponse
)

router = APIRouter(prefix="/player/events", tags=["player-events"])

def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two points using Haversine formula."""
    from math import sin, cos, sqrt, atan2, radians
    
    # Convert decimal degrees to radians
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    
    # Haversine formula
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * atan2(sqrt(a), sqrt(1-a))
    radius = 6371  # Radius of earth in kilometers
    
    return radius * c

def format_event_for_response(event_doc, distance=None):
    """Format a MongoDB event document for API response."""
    result = {
        "id": str(event_doc["_id"]),
    }
    
    # Add all fields except _id
    for k, v in event_doc.items():
        if k != "_id":
            # Handle ObjectId conversion
            if isinstance(v, ObjectId):
                result[k] = str(v)
            # Handle datetime conversion
            elif isinstance(v, datetime):
                result[k] = v.isoformat()
            else:
                result[k] = v
    
    # Add distance if provided
    if distance is not None:
        result["distance"] = round(distance, 2)  # Round to 2 decimal places
        
    return result

# Listar eventos
@router.get("", response_model=EventList)
async def list_events(
    participant: Optional[bool] = Query(None, description="Filtrar por eventos que o usuário participa"),
    upcoming: Optional[bool] = Query(None, description="Filtrar por eventos futuros"),
    sport_type: Optional[str] = Query(None, description="Filtrar por tipo de esporte"),
    skill_level: Optional[str] = Query(None, description="Filtrar por nível de habilidade"),
    page: int = Query(1, ge=1, description="Número da página"),
    per_page: int = Query(10, ge=1, le=100, description="Itens por página"),
    current_user=Depends(get_current_player),
    db=Depends(get_database)
):
    # Construir filtro
    filter_query = {}
    
    # Filtrar eventos privados
    filter_query["$or"] = [
        {"is_private": False},
        {"organizer_id": str(current_user["_id"])},
        {"participants.user_id": str(current_user["_id"])}
    ]
    
    # Filtrar por participação do usuário
    if participant is True:
        filter_query["participants.user_id"] = str(current_user["_id"])
    
    # Filtrar por eventos futuros
    if upcoming is True:
        filter_query["end_time"] = {"$gte": datetime.utcnow()}
    
    # Filtrar por tipo de esporte
    if sport_type:
        filter_query["sport_type"] = sport_type
    
    # Filtrar por nível de habilidade
    if skill_level:
        filter_query["skill_level"] = skill_level
    
    # Contar total de eventos
    total = await db.events.count_documents(filter_query)
    
    # Buscar eventos paginados
    skip = (page - 1) * per_page
    cursor = db.events.find(filter_query).sort("start_time", 1).skip(skip).limit(per_page)
    
    events = []
    async for doc in cursor:
        events.append({
            "id": str(doc["_id"]),
            **{k: v for k, v in doc.items() if k != "_id"}
        })
    
    return {
        "events": events,
        "total": total,
        "page": page,
        "per_page": per_page
    }

# Obter evento por ID
@router.get("/{event_id}", response_model=EventResponse)
async def get_event(
    event_id: str = Path(..., description="ID do evento"),
    current_user=Depends(get_current_player),
    db=Depends(get_database)
):
    try:
        event_doc = await db.events.find_one({"_id": ObjectId(event_id)})
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
    
    # Verificar permissão para eventos privados
    if event_doc.get("is_private", False):
        is_organizer = event_doc["organizer_id"] == str(current_user["_id"])
        is_participant = any(p["user_id"] == str(current_user["_id"]) for p in event_doc.get("participants", []))
        
        if not (is_organizer or is_participant):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Este é um evento privado"
            )
    
    return {
        "id": str(event_doc["_id"]),
        **{k: v for k, v in event_doc.items() if k != "_id"}
    }

# Criar evento
@router.post("", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
async def create_event(
    event_data: EventCreate,
    current_user=Depends(get_current_player),
    db=Depends(get_database)
):
    # Verificar conflitos de horário
    conflict_query = {
        "organizer_id": str(current_user["_id"]),
        "$or": [
            # Evento começa durante outro evento
            {
                "start_time": {"$lte": event_data.start_time},
                "end_time": {"$gt": event_data.start_time}
            },
            # Evento termina durante outro evento
            {
                "start_time": {"$lt": event_data.end_time},
                "end_time": {"$gte": event_data.end_time}
            },
            # Evento cobre completamente outro evento
            {
                "start_time": {"$gte": event_data.start_time},
                "end_time": {"$lte": event_data.end_time}
            }
        ]
    }
    
    conflict = await db.events.find_one(conflict_query)
    if conflict:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Você já tem um evento programado neste horário"
        )
    
    # Verificar se o space_id existe, se fornecido
    space_name = None
    if event_data.space_id:
        try:
            space = await db.spaces.find_one({"_id": ObjectId(event_data.space_id)})
            if not space:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Espaço não encontrado"
                )
            space_name = space.get("name", "")
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="ID de espaço inválido"
            )
    
    # Criar objeto de evento
    new_event = Event(
        **event_data.dict(),
        organizer_id=str(current_user["_id"]),
        organizer_name=current_user.get("full_name") or current_user["email"].split("@")[0],
        participants=[],  # Organizador não é automaticamente adicionado como participante
        space_name=space_name
    )
    
    # Inserir no banco de dados
    result = await db.events.insert_one(new_event.dict(by_alias=True, exclude={"id"}))
    
    # Buscar o evento inserido
    created_event = await db.events.find_one({"_id": result.inserted_id})
    
    # Criar notificação para o organizador
    from ..models.notification import Notification, NotificationType
    notification = Notification(
        user_id=str(current_user["_id"]),
        type=NotificationType.EVENT_CREATED,
        title="Evento criado com sucesso",
        message=f"Seu evento \"{event_data.title}\" foi criado com sucesso.",
        related_id=str(result.inserted_id),
        action_url=f"/player/events/{str(result.inserted_id)}"
    )
    
    await db.notifications.insert_one(notification.dict(by_alias=True, exclude={"id"}))
    
    return {
        "id": str(created_event["_id"]),
        **{k: v for k, v in created_event.items() if k != "_id"}
    }

# Atualizar evento
@router.put("/{event_id}", response_model=EventResponse)
async def update_event(
    event_data: EventUpdate,
    event_id: str = Path(..., description="ID do evento"),
    current_user=Depends(get_current_player),
    db=Depends(get_database)
):
    try:
        # Verificar se o evento existe
        event_doc = await db.events.find_one({"_id": ObjectId(event_id)})
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
    
    # Verificar se o usuário é o organizador
    if event_doc["organizer_id"] != str(current_user["_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas o organizador pode atualizar o evento"
        )
    
    # Verificar conflitos de horário se as datas forem alteradas
    if event_data.start_time or event_data.end_time:
        start_time = event_data.start_time if event_data.start_time else event_doc["start_time"]
        end_time = event_data.end_time if event_data.end_time else event_doc["end_time"]
        
        conflict_query = {
            "_id": {"$ne": ObjectId(event_id)},  # Excluir o próprio evento
            "organizer_id": str(current_user["_id"]),
            "$or": [
                # Evento começa durante outro evento
                {
                    "start_time": {"$lte": start_time},
                    "end_time": {"$gt": start_time}
                },
                # Evento termina durante outro evento
                {
                    "start_time": {"$lt": end_time},
                    "end_time": {"$gte": end_time}
                },
                # Evento cobre completamente outro evento
                {
                    "start_time": {"$gte": start_time},
                    "end_time": {"$lte": end_time}
                }
            ]
        }
        
        conflict = await db.events.find_one(conflict_query)
        if conflict:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Você já tem um evento programado neste horário"
            )
    
    # Verificar se o space_id existe, se fornecido
    if event_data.space_id:
        try:
            space = await db.spaces.find_one({"_id": ObjectId(event_data.space_id)})
            if not space:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Espaço não encontrado"
                )
            # Atualizar nome do espaço
            space_name = space.get("name", "")
            event_data_dict = {**event_data.dict(exclude_unset=True), "space_name": space_name}
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="ID de espaço inválido"
            )
    else:
        event_data_dict = event_data.dict(exclude_unset=True)
    
    # Atualizar a data de atualização
    from datetime import datetime
    event_data_dict["updated_at"] = datetime.utcnow()
    
    # Atualizar no banco de dados
    await db.events.update_one(
        {"_id": ObjectId(event_id)},
        {"$set": event_data_dict}
    )
    
    # Buscar o evento atualizado
    updated_event = await db.events.find_one({"_id": ObjectId(event_id)})
    
    # Notificar participantes sobre a atualização
    if event_data.start_time or event_data.end_time or event_data.location:
        from ..models.notification import Notification, NotificationType
        
        # Obter IDs de participantes
        participant_ids = [p["user_id"] for p in updated_event.get("participants", [])]
        
        # Criar notificações para cada participante
        notifications = []
        for user_id in participant_ids:
            notification = Notification(
                user_id=user_id,
                type=NotificationType.EVENT_UPDATED,
                title="Evento atualizado",
                message=f"O evento \"{updated_event['title']}\" foi atualizado pelo organizador.",
                related_id=event_id,
                action_url=f"/player/events/{event_id}"
            )
            notifications.append(notification.dict(by_alias=True, exclude={"id"}))
        
        if notifications:
            await db.notifications.insert_many(notifications)
    
    return {
        "id": str(updated_event["_id"]),
        **{k: v for k, v in updated_event.items() if k != "_id"}
    }

# Excluir evento
@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_event(
    event_id: str = Path(..., description="ID do evento"),
    current_user=Depends(get_current_player),
    db=Depends(get_database)
):
    try:
        # Verificar se o evento existe
        event_doc = await db.events.find_one({"_id": ObjectId(event_id)})
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
    
    # Verificar se o usuário é o organizador
    if event_doc["organizer_id"] != str(current_user["_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas o organizador pode excluir o evento"
        )
    
    # Notificar participantes sobre o cancelamento
    from ..models.notification import Notification, NotificationType
    
    # Obter IDs de participantes
    participant_ids = [p["user_id"] for p in event_doc.get("participants", [])]
    
    # Criar notificações para cada participante
    notifications = []
    for user_id in participant_ids:
        notification = Notification(
            user_id=user_id,
            type=NotificationType.EVENT_CANCELED,
            title="Evento cancelado",
            message=f"O evento \"{event_doc['title']}\" foi cancelado pelo organizador.",
            related_id=None
        )
        notifications.append(notification.dict(by_alias=True, exclude={"id"}))
    
    if notifications:
        await db.notifications.insert_many(notifications)
    
    # Excluir evento do banco de dados
    await db.events.delete_one({"_id": ObjectId(event_id)})
    
    return None

# Participar de um evento
@router.post("/{event_id}/join", response_model=JoinEventResponse)
async def join_event(
    join_data: JoinEventRequest,
    event_id: str = Path(..., description="ID do evento"),
    current_user=Depends(get_current_player),
    db=Depends(get_database)
):
    try:
        # Verificar se o evento existe
        event_doc = await db.events.find_one({"_id": ObjectId(event_id)})
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
    
    # Verificar se o evento já passou
    if event_doc["start_time"] < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este evento já começou ou já passou"
        )
    
    # Verificar se o usuário já é participante
    participants = event_doc.get("participants", [])
    if any(p["user_id"] == str(current_user["_id"]) for p in participants):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Você já está participando deste evento"
        )
    
    # Verificar limite de participantes
    if len(participants) >= event_doc["max_participants"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este evento já atingiu o limite máximo de participantes"
        )
    
    # Verificar posição, se fornecida
    position_name = None
    if join_data.position_id and event_doc.get("positions"):
        position = next((p for p in event_doc["positions"] if str(p.get("_id", "")) == join_data.position_id), None)
        if not position:
            position = next((p for p in event_doc["positions"] if p["name"] == join_data.position_id), None)
            
        if not position:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Posição não encontrada"
            )
        
        # Verificar se há vagas disponíveis para esta posição
        position_count = sum(1 for p in participants if p.get("position_id") == join_data.position_id)
        if position_count >= position["quantity"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Não há mais vagas disponíveis para a posição '{position['name']}'"
            )
        
        position_name = position["name"]
    
    # Criar novo participante
    new_participant = Participant(
        user_id=str(current_user["_id"]),
        user_name=current_user.get("full_name") or current_user["email"].split("@")[0],
        user_email=current_user["email"],
        position_id=join_data.position_id,
        position_name=position_name,
        confirmed=True,  # Auto-confirmação para participantes que se inscrevem
        joined_at=datetime.utcnow()
    )
    
    # Adicionar participante ao evento
    await db.events.update_one(
        {"_id": ObjectId(event_id)},
        {
            "$push": {"participants": new_participant.dict()},
            "$set": {"updated_at": datetime.utcnow()}
        }
    )
    
    # Notificar organizador sobre o novo participante
    from ..models.notification import Notification, NotificationType
    
    notification = Notification(
        user_id=event_doc["organizer_id"],
        type=NotificationType.EVENT_NEW_PARTICIPANT,
        title="Novo participante no evento",
        message=f"{current_user.get('full_name') or current_user['email']} se inscreveu no seu evento \"{event_doc['title']}\".",
        related_id=event_id,
        action_url=f"/player/events/{event_id}"
    )
    
    await db.notifications.insert_one(notification.dict(by_alias=True, exclude={"id"}))
    
    return {
        "event_id": event_id,
        "user_id": str(current_user["_id"]),
        "success": True,
        "message": "Você foi adicionado ao evento com sucesso!"
    }

# Sair de um evento
@router.post("/{event_id}/leave", response_model=JoinEventResponse)
async def leave_event(
    event_id: str = Path(..., description="ID do evento"),
    current_user=Depends(get_current_player),
    db=Depends(get_database)
):
    try:
        # Verificar se o evento existe
        event_doc = await db.events.find_one({"_id": ObjectId(event_id)})
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
    
    # Verificar se o evento já passou
    if event_doc["start_time"] < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este evento já começou ou já passou"
        )
    
    # Verificar se o usuário é participante
    participants = event_doc.get("participants", [])
    if not any(p["user_id"] == str(current_user["_id"]) for p in participants):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Você não está participando deste evento"
        )
    
    # Remover participante do evento
    await db.events.update_one(
        {"_id": ObjectId(event_id)},
        {
            "$pull": {"participants": {"user_id": str(current_user["_id"])}},
            "$set": {"updated_at": datetime.utcnow()}
        }
    )
    
    # Notificar organizador sobre a saída do participante
    from ..models.notification import Notification, NotificationType
    
    notification = Notification(
        user_id=event_doc["organizer_id"],
        type=NotificationType.EVENT_PARTICIPANT_LEFT,
        title="Participante saiu do evento",
        message=f"{current_user.get('full_name') or current_user['email']} saiu do seu evento \"{event_doc['title']}\".",
        related_id=event_id,
        action_url=f"/player/events/{event_id}"
    )
    
    await db.notifications.insert_one(notification.dict(by_alias=True, exclude={"id"}))
    
    return {
        "event_id": event_id,
        "user_id": str(current_user["_id"]),
        "success": True,
        "message": "Você saiu do evento com sucesso!"
    }

@router.get("/nearby", response_model=EventList)
async def get_nearby_events(
    lat: float = Query(..., description="Latitude"),
    lng: float = Query(..., description="Longitude"),
    radius: float = Query(10.0, description="Raio em km"),
    page: int = Query(1, ge=1, description="Número da página"),
    per_page: int = Query(10, ge=1, le=100, description="Itens por página"),
    current_user=Depends(get_current_player),
    db=Depends(get_database)
):
    try:
        # Filtrar eventos próximos 
        # Em produção, seria melhor usar índices geoespaciais do MongoDB

        # Buscar todos os eventos futuros
        now = datetime.utcnow()
        filter_query = {
            "end_time": {"$gte": now},
            "$or": [
                {"is_private": False},
                {"organizer_id": str(current_user["_id"])},
                {"participants.user_id": str(current_user["_id"])}
            ]
        }
        
        # Buscar eventos
        cursor = db.events.find(filter_query)
        
        events_with_distance = []
        async for doc in cursor:
            try:
                # Verificar se o documento possui os campos necessários
                if "location" not in doc or "lat" not in doc["location"] or "lng" not in doc["location"]:
                    continue
                
                # Calcular distância aproximada
                event_lat = doc["location"]["lat"]
                event_lng = doc["location"]["lng"]
                
                # Cálculo aproximado da distância usando a fórmula de Haversine
                from math import sin, cos, sqrt, atan2, radians
                
                R = 6371  # Raio da Terra em km
                dlat = radians(event_lat - lat)
                dlng = radians(event_lng - lng)
                
                a = sin(dlat/2)**2 + cos(radians(lat)) * cos(radians(event_lat)) * sin(dlng/2)**2
                c = 2 * atan2(sqrt(a), sqrt(1-a))
                distance = R * c
                
                if distance <= radius:
                    event_data = {
                        "id": str(doc["_id"]),
                        "distance": distance,
                    }
                    
                    # Copy all fields except _id which we already handled
                    for k, v in doc.items():
                        if k != "_id":
                            # Convert any ObjectId to string
                            if isinstance(v, ObjectId):
                                event_data[k] = str(v)
                            # Convert datetime to ISO format string
                            elif isinstance(v, datetime):
                                event_data[k] = v.isoformat()
                            else:
                                event_data[k] = v
                                
                    events_with_distance.append(event_data)
            except Exception as e:
                # Log error but continue processing other events
                print(f"Error processing event document: {e}")
                continue
        
        # Ordenar por distância
        events_with_distance.sort(key=lambda e: e.get("distance", float('inf')))
        
        # Paginação manual
        total = len(events_with_distance)
        start_idx = (page - 1) * per_page
        end_idx = min(start_idx + per_page, total)
        paginated_events = events_with_distance[start_idx:end_idx]
        
        # Remover campo distance antes de retornar
        events = []
        for event in paginated_events:
            event.pop("distance", None)
            events.append(event)
        
        return {
            "events": events,
            "total": total,
            "page": page,
            "per_page": per_page
        }
    except Exception as e:
        # Log detalhado do erro para depuração
        import traceback
        error_detail = f"{str(e)}\n{traceback.format_exc()}"
        print(f"Error in get_nearby_events: {error_detail}")
        
        # Retornar uma resposta vazia em vez de erro
        return {
            "events": [],
            "total": 0,
            "page": page,
            "per_page": per_page
        }