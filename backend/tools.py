from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from models import Customer, KnowledgeBase, AgentLog
import json

async def get_customer_info(db: AsyncSession, tenant_id: str, email: str):
    """Fetch customer tier for current tenant"""
    query = select(Customer).where(Customer.tenant_id == tenant_id, Customer.email == email)
    result = await db.execute(query)
    customer = result.scalars().first()
    if customer:
        return {"email": customer.email, "tier": customer.tier}
    return {"email": email, "tier": "unknown"}

async def search_kb(db: AsyncSession, tenant_id: str, query: str):
    """Search knowledge base for current tenant"""
    # Simple keyword-based search for prototype
    words = [w.lower() for w in query.split() if len(w) > 3]
    if not words:
        words = [query.lower()]
        
    from sqlalchemy import or_
    conditions = []
    for word in words:
        conditions.append(KnowledgeBase.title.ilike(f"%{word}%"))
        conditions.append(KnowledgeBase.content.ilike(f"%{word}%"))
        
    stmt = select(KnowledgeBase).where(
        KnowledgeBase.tenant_id == tenant_id,
        or_(*conditions)
    ).limit(1)
    result = await db.execute(stmt)
    article = result.scalars().first()
    if article:
        return {"title": article.title, "content": article.content}
    return {"error": "No relevant articles found."}

async def log_agent_step(db: AsyncSession, ticket_id: int, step: str, output: any):
    """Store each tool call + reasoning in agent_logs"""
    log_entry = AgentLog(
        ticket_id=ticket_id,
        step=step,
        output=json.dumps(output) if not isinstance(output, str) else output
    )
    db.add(log_entry)
    await db.commit()
