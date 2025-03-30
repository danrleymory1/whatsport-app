# backend/app/api/events.py
from fastapi import APIRouter, Depends, HTTPException, Query, Path, status
from typing import List, Optional
from datetime import datetime, timedelta
from bson.objectid import ObjectId

from ..core.database import get_database
from ..core.security import decode_token
from ..models.event import (
    Event, 
    EventCreate, 
    EventUpdate, 
    EventResponse, 
    EventList, 
    Participant,
    JoinEventRequest, 
    JoinEventResponse
)
from ..models.user import User
from ..schemas.user import TokenData

router = APIRouter(prefix="/player/events", tags=["player-events"])

async def get_current_user(token: str = Depends(decode_token), db = Depends(get_database)):
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
        
    return User(**user_data)

# Listar eventos
@router.get("", response_model=EventList)
async def list_events(
    participant: Optional[bool] = Query(None, description="Filtrar por eventos que o usuário participa"),
    upcoming: Optional[bool] = Query(None, description="Filtrar por eventos futuros"),
    sport_type: Optional[str] = Query(None, description="Filtrar por tipo de esporte"),
    skill_level: Optional[str] = Query(None, description="Filtrar por nível de habilidade"),
    page: int = Query(1, ge=1, description="Número da página"),
    per_page: int = Query(10, ge=1, le=100, description="Itens por página"),
    current_user: User = Depends(get_current_user),
    db = Depends(get_database)
):
    # Construir o filtro
    filter_query = {}
    
    # Filtrar eventos privados (mostrar apenas se o usuário for organizador ou participante)
    filter_query["$or"] = [
        {"is_private": False},
        {"organizer_id": str(current_user.id)},
        {"participants.user_id": str(current_user.id)}
    ]
    
    # Filtrar por participação do usuário
    if participant is True:
        filter_query["participants.user_id"] = str(current_user.id)
    
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
        events.append(EventResponse(id=str(doc["_id"]), **doc))
    
    return EventList(
        events=events,
        total=total,
        page=page,
        per_page=per_page
    )

# Obter evento por ID
@router.get("/{event_id}", response_model=EventResponse)
async def get_event(
    event_id: str = Path(..., description="ID do evento"),
    current_user: User = Depends(get_current_user),
    db = Depends(get_database)
):
    try:
        event_doc = await db.events.find_one({"_id": ObjectId(event_id)})
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ID de evento inválido",
        )
        
    if not event_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evento não encontrado",
        )
    
    # Verificar permissão para eventos privados
    if event_doc.get("is_private", False):
        is_organizer = event_doc["organizer_id"] == str(current_user.id)
        is_participant = any(p["user_id"] == str(current_user.id) for p in event_doc.get("participants", []))
        
        if not (is_organizer or is_participant):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Este é um evento privado",
            )
    
    return EventResponse(id=str(event_doc["_id"]), **event_doc)

# Criar evento
@router.post("", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
async def create_event(
    event_data: EventCreate,
    current_user: User = Depends(get_current_user),
    db = Depends(get_database)
):
    # Verificar conflitos de horário
    conflict_query = {
        "organizer_id": str(current_user.id),
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
            detail="Você já tem um evento programado neste horário",
        )
    
    # Verificar se o space_id existe, se fornecido
    if event_data.space_id:
        space = await db.spaces.find_one({"_id": ObjectId(event_data.space_id)})
        if not space:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Espaço não encontrado",
            )
        
        # Adicionar nome do espaço
        space_name = space.get("name", "")
    else:
        space_name = None
    
    # Criar objeto de evento
    new_event = Event(
        **event_data.dict(),
        organizer_id=str(current_user.id),
        organizer_name=current_user.name if hasattr(current_user, "name") else None,
        participants=[],  # Organizador não é automaticamente adicionado como participante
        space_name=space_name
    )
    
    # Inserir no banco de dados
    result = await db.events.insert_one(new_event.dict(by_alias=True, exclude={"id"}))
    
    # Buscar o evento inserido
    created_event = await db.events.find_one({"_id": result.inserted_id})
    
    return EventResponse(id=str(created_event["_id"]), **created_event)

# Atualizar evento
@router.put("/{event_id}", response_model=EventResponse)
async def update_event(
    event_data: EventUpdate,
    event_id: str = Path(..., description="ID do evento"),
    current_user: User = Depends(get_current_user),
    db = Depends(get_database)
):
    try:
        # Verificar se o evento existe
        event_doc = await db.events.find_one({"_id": ObjectId(event_id)})
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ID de evento inválido",
        )
        
    if not event_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evento não encontrado",
        )
    
    # Verificar se o usuário é o organizador
    if event_doc["organizer_id"] != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas o organizador pode atualizar o evento",
        )
    
    # Verificar conflitos de horário se as datas forem alteradas
    if event_data.start_time or event_data.end_time:
        start_time = event_data.start_time if event_data.start_time else event_doc["start_time"]
        end_time = event_data.end_time if event_data.end_time else event_doc["end_time"]
        
        conflict_query = {
            "_id": {"$ne": ObjectId(event_id)},  # Excluir o próprio evento
            "organizer_id": str(current_user.id),
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
                detail="Você já tem um evento programado neste horário",
            )
    
    # Verificar se o space_id existe, se fornecido
    if event_data.space_id:
        space = await db.spaces.find_one({"_id": ObjectId(event_data.space_id)})
        if not space:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Espaço não encontrado",
            )
        # Atualizar nome do espaço
        space_name = space.get("name", "")
        event_data_dict = {**event_data.dict(exclude_unset=True), "space_name": space_name}
    else:
        event_data_dict = event_data.dict(exclude_unset=True)
    
    # Atualizar a data de atualização
    event_data_dict["updated_at"] = datetime.utcnow()
    
    # Atualizar no banco de dados
    await db.events.update_one(
        {"_id": ObjectId(event_id)},
        {"$set": event_data_dict}
    )
    
    # Buscar o evento atualizado
    updated_event = await db.events.find_one({"_id": ObjectId(event_id)})
    
    return EventResponse(id=str(updated_event["_id"]), **updated_event)

# Excluir evento
@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_event(
    event_id: str = Path(..., description="ID do evento"),
    current_user: User = Depends(get_current_user),
    db = Depends(get_database)
):
    try:
        # Verificar se o evento existe
        event_doc = await db.events.find_one({"_id": ObjectId(event_id)})
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ID de evento inválido",
        )
        
    if not event_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evento não encontrado",
        )
    
    # Verificar se o usuário é o organizador
    if event_doc["organizer_id"] != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas o organizador pode excluir o evento",
        )
    
    # Excluir do banco de dados
    await db.events.delete_one({"_id": ObjectId(event_id)})
    
    return None

# Participar de um evento
@router.post("/{event_id}/join", response_model=JoinEventResponse)
async def join_event(
    join_data: JoinEventRequest,
    event_id: str = Path(..., description="ID do evento"),
    current_user: User = Depends(get_current_user),
    db = Depends(get_database)
):
    try:
        # Verificar se o evento existe
        event_doc = await db.events.find_one({"_id": ObjectId(event_id)})
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ID de evento inválido",
        )
        
    if not event_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evento não encontrado",
        )
    
    # Verificar se o evento já passou
    if event_doc["start_time"] < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este evento já começou ou já passou",
        )
    
    # Verificar se o usuário já é participante
    participants = event_doc.get("participants", [])
    if any(p["user_id"] == str(current_user.id) for p in participants):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Você já está participando deste evento",
        )
    
    # Verificar limite de participantes
    if len(participants) >= event_doc["max_participants"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este evento já atingiu o limite máximo de participantes",
        )
    
    # Verificar posição, se fornecida
    position_name = None
    if join_data.position_id and event_doc.get("positions"):
        position = next((p for p in event_doc["positions"] if str(p["_id"]) == join_data.position_id), None)
        if not position:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Posição não encontrada",
            )
        
        # Verificar se há vagas disponíveis para esta posição
        position_count = sum(1 for p in participants if p.get("position_id") == join_data.position_id)
        if position_count >= position["quantity"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Não há mais vagas disponíveis para a posição '{position['name']}'",
            )
        
        position_name = position["name"]
    
    # Criar novo participante
    new_participant = Participant(
        user_id=str(current_user.id),
        user_name=current_user.name if hasattr(current_user, "name") else None,
        user_email=current_user.email,
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
    
    return JoinEventResponse(
        event_id=event_id,
        user_id=str(current_user.id),
        success=True,
        message="Você foi adicionado ao evento com sucesso!"
    )

# Sair de um evento
@router.post("/{event_id}/leave", response_model=JoinEventResponse)
async def leave_event(
    event_id: str = Path(..., description="ID do evento"),
    current_user: User = Depends(get_current_user),
    db = Depends(get_database)
):
    try:
        # Verificar se o evento existe
        event_doc = await db.events.find_one({"_id": ObjectId(event_id)})
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ID de evento inválido",
        )
        
    if not event_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evento não encontrado",
        )
    
    # Verificar se o evento já passou
    if event_doc["start_time"] < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este evento já começou ou já passou",
        )
    
    # Verificar se o usuário já é participante
    participants = event_doc.get("participants", [])
    if not any(p["user_id"] == str(current_user.id) for p in participants):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Você não está participando deste evento",
        )
    
    # Remover participante do evento
    await db.events.update_one(
        {"_id": ObjectId(event_id)},
        {
            "$pull": {"participants": {"user_id": str(current_user.id)}},
            "$set": {"updated_at": datetime.utcnow()}
        }
    )
    
    return JoinEventResponse(
        event_id=event_id,
        user_id=str(current_user.id),
        success=True,
        message="Você saiu do evento com sucesso!"
    )

# Obter eventos próximos (baseado na localização)
@router.get("/nearby", response_model=EventList)
async def get_nearby_events(
    lat: float = Query(..., description="Latitude"),
    lng: float = Query(..., description="Longitude"),
    radius: float = Query(10.0, description="Raio em km"),
    page: int = Query(1, ge=1, description="Número da página"),
    per_page: int = Query(10, ge=1, le=100, description="Itens por página"),
    current_user: User = Depends(get_current_user),
    db = Depends(get_database)
):
    # Filtrar eventos próximos (não implementa busca geoespacial completa, é uma simplificação)
    # Em produção, seria recomendado usar índices geoespaciais e operadores $near do MongoDB
    
    # Buscar todos os eventos futuros
    now = datetime.utcnow()
    filter_query = {
        "end_time": {"$gte": now},
        "$or": [
            {"is_private": False},
            {"organizer_id": str(current_user.id)},
            {"participants.user_id": str(current_user.id)}
        ]
    }
    
    # Buscar eventos
    events = []
    async for doc in db.events.find(filter_query):
        # Calcular distância aproximada (simplificado)
        event_lat = doc["location"]["lat"]
        event_lng = doc["location"]["lng"]
        
        # Cálculo aproximado da distância (em km) usando a fórmula de Haversine
        from math import sin, cos, sqrt, atan2, radians
        
        R = 6371  # Raio da Terra em km
        dlat = radians(event_lat - lat)
        dlng = radians(event_lng - lng)
        
        a = sin(dlat/2)**2 + cos(radians(lat)) * cos(radians(event_lat)) * sin(dlng/2)**2
        c = 2 * atan2(sqrt(a), sqrt(1-a))
        distance = R * c
        
        if distance <= radius:
            events.append({**doc, "distance": distance})
    
    # Ordenar por distância
    events.sort(key=lambda e: e["distance"])
    
    # Paginação manual
    total = len(events)
    start_idx = (page - 1) * per_page
    end_idx = start_idx + per_page
    paginated_events = events[start_idx:end_idx]
    
    return EventList(
        events=[EventResponse(id=str(e["_id"]), **{k: v for k, v in e.items() if k != "distance"}) for e in paginated_events],
        total=total,
        page=page,
        per_page=per_page
    )