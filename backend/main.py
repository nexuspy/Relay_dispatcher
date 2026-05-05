from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from database import get_db, init_db, engine
import models
import schemas
from agent import run_support_agent
from config import settings
from cache import cache
from logger import logger
import uvicorn
from typing import List, Optional
from sqlalchemy import func
from datetime import datetime
import json

app = FastAPI(
    title=settings.PROJECT_NAME,
    debug=settings.DEBUG
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, specify the frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    logger.info("Application starting up...")
    async with engine.begin() as conn:
        await conn.run_sync(models.Base.metadata.create_all)
    
    # Connect to Redis
    await cache.connect()

    async with AsyncSession(engine) as db:
        # Seed data
        result = await db.execute(select(models.Tenant).limit(1))
        if not result.scalars().first():
            logger.info("Seeding database...")
            # Acme Corp Seed
            db.add(models.Tenant(id="acme_corp", name="Acme Corp"))
            db.add(models.Customer(tenant_id="acme_corp", email="user@example.com", tier="Gold"))
            db.add(models.Customer(tenant_id="acme_corp", email="tech@acme.com", tier="Platinum"))
            db.add(models.KnowledgeBase(tenant_id="acme_corp", title="Billing Issues", content="For billing issues, please contact billing@acme.com."))
            db.add(models.KnowledgeBase(tenant_id="acme_corp", title="API Authentication", content="Include your API Key in the X-API-Key header."))
            db.add(models.TenantSettings(tenant_id="acme_corp", auto_triage_enabled=1, default_model=settings.AI_MODEL_NAME, max_retry_attempts=3))

            # Globex Seed
            db.add(models.Tenant(id="globex", name="Globex"))
            db.add(models.Customer(tenant_id="globex", email="hr@globex.com", tier="Silver"))
            db.add(models.Customer(tenant_id="globex", email="sales@globex.com", tier="Gold"))
            db.add(models.KnowledgeBase(tenant_id="globex", title="Office Access", content="Contact facilities-globex@example.com for keycards."))
            db.add(models.KnowledgeBase(tenant_id="globex", title="CRM Login", content="CRM is at https://crm.globex.internal. Use SSO."))
            db.add(models.TenantSettings(tenant_id="globex", auto_triage_enabled=1, default_model=settings.AI_MODEL_NAME, max_retry_attempts=3))

            # Synthesis Seed
            db.add(models.Tenant(id="synthesis", name="Synthesis Inc"))
            db.add(models.Customer(tenant_id="synthesis", email="dev@synthesis.io", tier="Platinum"))
            db.add(models.KnowledgeBase(tenant_id="synthesis", title="Cloud Deployment", content="Push to 'release' branch for automatic Jenkins deployment."))
            db.add(models.TenantSettings(tenant_id="synthesis", auto_triage_enabled=1, default_model=settings.AI_MODEL_NAME, max_retry_attempts=3))
            
            await db.commit()

@app.on_event("shutdown")
async def shutdown():
    logger.info("Application shutting down...")
    await cache.close()

async def process_ticket_background(ticket_id: int, tenant_id: str, email: str, message: str):
    async with AsyncSession(engine) as db:
        agent_output = await run_support_agent(
            db, 
            tenant_id, 
            email, 
            message, 
            ticket_id
        )

        stmt = select(models.Ticket).where(models.Ticket.id == ticket_id)
        result = await db.execute(stmt)
        ticket = result.scalars().first()
        
        if ticket:
            ticket.priority = agent_output.get("priority")
            ticket.suggested_resolution = agent_output.get("suggested_resolution")
            ticket.sentiment = agent_output.get("sentiment")
            ticket.category = agent_output.get("category")
            ticket.routing_action = agent_output.get("routing_action")
            ticket.target_team = agent_output.get("target_team")
            ticket.ticket_metadata = json.dumps(agent_output.get("entities", {}))
            await db.commit()

api_router = APIRouter()

@api_router.post("/tickets", response_model=schemas.TicketResponse)
async def create_ticket(request: schemas.TicketRequest, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):
    new_ticket = models.Ticket(
        tenant_id=request.tenant_id,
        email=request.email,
        message=request.message,
        status="open"
    )
    db.add(new_ticket)
    await db.commit()
    await db.refresh(new_ticket)

    # Queue the AI triage in the background
    background_tasks.add_task(
        process_ticket_background,
        new_ticket.id,
        request.tenant_id,
        request.email,
        request.message
    )

    return {
        "ticket_id": new_ticket.id,
        "priority": "Processing...",
        "suggested_resolution": "AI is analyzing your request..."
    }

@api_router.get("/tickets", response_model=List[schemas.TicketDetailResponse])
async def list_tickets(tenant_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(models.Ticket).where(models.Ticket.tenant_id == tenant_id).options(selectinload(models.Ticket.logs))
    result = await db.execute(stmt)
    return result.scalars().all()

@api_router.get("/tickets/{ticket_id}", response_model=schemas.TicketDetailResponse)
async def get_ticket(ticket_id: int, tenant_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(models.Ticket).where(
        models.Ticket.id == ticket_id,
        models.Ticket.tenant_id == tenant_id
    ).options(selectinload(models.Ticket.logs))
    result = await db.execute(stmt)
    ticket = result.scalars().first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    # Calculate customer stats
    count_stmt = select(func.count(models.Ticket.id)).where(
        models.Ticket.email == ticket.email,
        models.Ticket.tenant_id == tenant_id
    )
    count_res = await db.execute(count_stmt)
    ticket.customer_ticket_count = count_res.scalar()
    
    return ticket

@api_router.patch("/tickets/{ticket_id}")
async def update_ticket(ticket_id: int, request: dict, db: AsyncSession = Depends(get_db)):
    stmt = select(models.Ticket).where(models.Ticket.id == ticket_id)
    result = await db.execute(stmt)
    ticket = result.scalars().first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    for key, value in request.items():
        if hasattr(ticket, key):
            setattr(ticket, key, value)
    
    await db.commit()
    return {"status": "updated"}

@api_router.post("/tickets/{ticket_id}/reply")
async def send_reply(ticket_id: int, request: dict, db: AsyncSession = Depends(get_db)):
    logger.info(f"Sending reply to ticket {ticket_id}", reply=request.get("message"))
    return {"status": "sent"}

@api_router.get("/analytics")
async def get_analytics(tenant_id: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    # Total tickets
    total_stmt = select(func.count(models.Ticket.id))
    if tenant_id:
        total_stmt = total_stmt.where(models.Ticket.tenant_id == tenant_id)
    total_res = await db.execute(total_stmt)
    total_count = total_res.scalar()

    # Priority distribution
    priority_stmt = select(models.Ticket.priority, func.count(models.Ticket.id)).group_by(models.Ticket.priority)
    if tenant_id:
        priority_stmt = priority_stmt.where(models.Ticket.tenant_id == tenant_id)
    priority_res = await db.execute(priority_stmt)
    priority_dist = {p: count for p, count in priority_res.all()}

    # Tenant distribution (only relevant if no tenant_id is provided)
    tenant_dist = {}
    if not tenant_id:
        tenant_stmt = select(models.Ticket.tenant_id, func.count(models.Ticket.id)).group_by(models.Ticket.tenant_id)
        tenant_res = await db.execute(tenant_stmt)
        tenant_dist = {t: count for t, count in tenant_res.all()}

    # Status distribution
    status_stmt = select(models.Ticket.status, func.count(models.Ticket.id)).group_by(models.Ticket.status)
    if tenant_id:
        status_stmt = status_stmt.where(models.Ticket.tenant_id == tenant_id)
    status_res = await db.execute(status_stmt)
    status_dist = {s: count for s, count in status_res.all()}

    # Average Resolution Time (in minutes)
    res_time_stmt = select(models.Ticket.created_at, models.Ticket.resolved_at).where(models.Ticket.resolved_at.isnot(None))
    if tenant_id:
        res_time_stmt = res_time_stmt.where(models.Ticket.tenant_id == tenant_id)
    res_time_res = await db.execute(res_time_stmt)
    times = [(r[1] - r[0]).total_seconds() / 60 for r in res_time_res.all()]
    avg_res_time = sum(times) / len(times) if times else 0

    return {
        "total_tickets": total_count,
        "priority_distribution": priority_dist,
        "tenant_distribution": tenant_dist,
        "status_distribution": status_dist,
        "avg_resolution_time_min": round(avg_res_time, 2),
        "last_updated": datetime.now().isoformat(),
        "tenant_id": tenant_id
    }

@api_router.get("/tenants", response_model=List[schemas.TenantSchema])
async def list_tenants(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.Tenant))
    return result.scalars().all()

@api_router.get("/settings", response_model=schemas.SettingsSchema)
async def get_settings(tenant_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(models.TenantSettings).where(models.TenantSettings.tenant_id == tenant_id)
    result = await db.execute(stmt)
    settings = result.scalars().first()
    if not settings:
        raise HTTPException(status_code=404, detail="Settings not found")
@api_router.post("/settings", response_model=schemas.SettingsSchema)
async def update_settings(request: schemas.SettingsSchema, db: AsyncSession = Depends(get_db)):
    stmt = select(models.TenantSettings).where(models.TenantSettings.tenant_id == request.tenant_id)
    result = await db.execute(stmt)
    settings_obj = result.scalars().first()
    
    if not settings_obj:
        settings_obj = models.TenantSettings(tenant_id=request.tenant_id)
        db.add(settings_obj)
        
    settings_obj.auto_triage_enabled = 1 if request.auto_triage_enabled else 0
    settings_obj.default_model = request.default_model
    settings_obj.max_retry_attempts = request.max_retry_attempts
    
    await db.commit()
    await db.refresh(settings_obj)
    return {
        "tenant_id": settings_obj.tenant_id,
        "auto_triage_enabled": bool(settings_obj.auto_triage_enabled),
        "default_model": settings_obj.default_model,
        "max_retry_attempts": settings_obj.max_retry_attempts
    }

# Include all v1 routes
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
async def root():
    return {"status": "ok", "project": settings.PROJECT_NAME, "version": "v1"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
