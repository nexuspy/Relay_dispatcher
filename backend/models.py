from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class Tenant(Base):
    __tablename__ = "tenants"
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)

class Customer(Base):
    __tablename__ = "customers"
    id = Column(Integer, primary_key=True, autoincrement=True)
    tenant_id = Column(String, ForeignKey("tenants.id"), nullable=False)
    email = Column(String, nullable=False)
    tier = Column(String, default="Gold") # Updated to Gold/Silver as per new prompt

class Ticket(Base):
    __tablename__ = "tickets"
    id = Column(Integer, primary_key=True, autoincrement=True)
    tenant_id = Column(String, ForeignKey("tenants.id"), nullable=False)
    email = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    status = Column(String, default="open") # open/pending/resolved
    priority = Column(String, nullable=True) # low/high
    suggested_resolution = Column(Text, nullable=True)
    sentiment = Column(String, nullable=True)
    category = Column(String, nullable=True)
    routing_action = Column(String, nullable=True)
    target_team = Column(String, nullable=True)
    ticket_metadata = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    resolved_at = Column(DateTime(timezone=True), nullable=True)

    logs = relationship("AgentLog", back_populates="ticket")

class KnowledgeBase(Base):
    __tablename__ = "knowledge_base"
    id = Column(Integer, primary_key=True, autoincrement=True)
    tenant_id = Column(String, ForeignKey("tenants.id"), nullable=False)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)

class AgentLog(Base):
    __tablename__ = "agent_logs"
    id = Column(Integer, primary_key=True, autoincrement=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"), nullable=False)
    step = Column(String, nullable=False)
    output = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    ticket = relationship("Ticket", back_populates="logs")

class TenantSettings(Base):
    __tablename__ = "tenant_settings"
    tenant_id = Column(String, ForeignKey("tenants.id"), primary_key=True)
    auto_triage_enabled = Column(Integer, default=1)
    default_model = Column(String, default="openai/gpt-oss-120b")
    max_retry_attempts = Column(Integer, default=3)
