from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

class TicketRequest(BaseModel):
    tenant_id: str
    email: EmailStr
    message: str

class TicketResponse(BaseModel):
    ticket_id: int
    priority: Optional[str]
    suggested_resolution: Optional[str]

class AgentLogSchema(BaseModel):
    id: int
    ticket_id: int
    step: str
    output: str
    created_at: datetime

    class Config:
        from_attributes = True

class TicketDetailResponse(BaseModel):
    id: int
    tenant_id: str
    email: str
    message: str
    status: str
    priority: Optional[str]
    suggested_resolution: Optional[str]
    created_at: datetime
    logs: List[AgentLogSchema]
    customer_ticket_count: Optional[int] = 1

    class Config:
        from_attributes = True

class SettingsSchema(BaseModel):
    tenant_id: str
    auto_triage_enabled: bool
    default_model: str
    max_retry_attempts: int

    class Config:
        from_attributes = True

class TenantSchema(BaseModel):
    id: str
    name: str

    class Config:
        from_attributes = True
