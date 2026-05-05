import os
import json
import time
import hashlib
import google.generativeai as genai
from config import settings
from cache import cache
from logger import logger
from tools import get_customer_info, search_kb, log_agent_step
from sqlalchemy.future import select
import models

# Initialize Gemini
genai.configure(api_key=settings.GOOGLE_API_KEY)
model = genai.GenerativeModel(settings.AI_MODEL_NAME)

SYSTEM_PROMPT = """
🧠 RESOLUTION RULES:
- Your primary goal is **SELF-SERVICE RESOLUTION**. 
- Always provide the full, step-by-step solution from the KNOWLEDGE BASE.
- DO NOT simply tell the customer to "contact support" or "email us" if the information is available.
- If KNOWLEDGE BASE is empty, provide professional general advice based on the TICKET MESSAGE, but still aim to help the user solve it themselves.

📤 OUTPUT FORMAT (STRICT JSON):
{
  "priority": "low | high",
  "suggested_resolution": "A comprehensive, empathetic, and technical step-by-step resolution that allows the user to solve their own problem.",
  "sentiment": "positive | neutral | negative",
  "category": "e.g. Billing, Technical, Auth",
  "routing_action": "self_solve",
  "target_team": "none",
  "entities": {"ids": [], "emails": []},
  "reasoning": ["Analyze problem", "Match with KB", "Construct final guide"]
}

OUTPUT ONLY THE JSON OBJECT. DO NOT INCLUDE ANY PREAMBLE OR POST-TEXT.
"""

def extract_json(text: str):
    if not text: return None
    try:
        # Remove potential markdown code blocks
        clean_text = text
        if "```json" in text:
            clean_text = text.split("```json")[1].split("```")[0]
        elif "```" in text:
            parts = text.split("```")
            if len(parts) >= 3:
                clean_text = parts[1]
                
        start = clean_text.find('{')
        end = clean_text.rfind('}') + 1
        if start != -1 and end > start:
            return json.loads(clean_text[start:end])
    except Exception as e:
        logger.error(f"JSON Parse Error: {e}", raw_text=text)
        try:
            start = text.find('{')
            end = text.rfind('}') + 1
            if start != -1 and end > start:
                return json.loads(text[start:end])
        except:
            pass
    return None

async def run_support_agent(db, tenant_id, email, message, ticket_id):
    start_time = time.time()
    
    # Generate cache key based on tenant and message content
    input_str = f"{tenant_id}:{message}".strip().lower()
    cache_key = f"triage:{hashlib.md5(input_str.encode()).hexdigest()}"
    
    if settings.CACHE_ENABLED:
        try:
            cached_res = await cache.get(cache_key)
            if cached_res:
                logger.info("Cache hit for support agent", ticket_id=ticket_id, tenant_id=tenant_id)
                await log_agent_step(db, ticket_id, "cache_hit", {"cached": True})
                return cached_res
        except Exception as e:
            logger.warning(f"Cache get failed: {e}")

    logger.info("Agent starting triage with Gemini", ticket_id=ticket_id, tenant_id=tenant_id, email=email)
    
    # 1. Gather Data
    customer = await get_customer_info(db, tenant_id, email)
    await log_agent_step(db, ticket_id, "get_customer_info", customer)
    
    kb = await search_kb(db, tenant_id, message)
    await log_agent_step(db, ticket_id, "search_kb", kb)
    
    # 2. Final Generation
    prompt = f"""
    {SYSTEM_PROMPT}
    
    CONTEXT DATA:
    CUSTOMER: {json.dumps(customer)}
    KNOWLEDGE BASE: {json.dumps(kb)}
    
    USER REQUEST: {message}
    """
    
    try:
        # Use synchronous call for now as the Gemini SDK's async implementation can be tricky in some environments
        # or use to_thread if needed. But let's try the direct async call if available.
        response = await model.generate_content_async(
            prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=0.2,
                max_output_tokens=2048,
            )
        )
        
        output = response.text
        parsed = extract_json(output)
        
        if parsed and "suggested_resolution" in parsed:
            latency = round((time.time() - start_time) * 1000)
            await log_agent_step(db, ticket_id, "telemetry", {"latency_ms": latency})
            
            # Store in cache
            if settings.CACHE_ENABLED:
                try:
                    await cache.set(cache_key, parsed)
                except Exception as e:
                    logger.warning(f"Cache set failed: {e}")
                
            return parsed
            
        logger.warning("Gemini output parsing failed, using fallback", ticket_id=ticket_id, raw_output=output)
        return build_fallback_resolution({"customer": customer, "kb": kb}, output, message)
        
    except Exception as e:
        logger.error(f"Gemini API error: {e}", ticket_id=ticket_id)
        return build_deterministic_resolution({"customer": customer, "kb": kb}, message)

def build_fallback_resolution(tool_results, raw_text, message):
    customer = tool_results.get("customer", {})
    tier = customer.get("tier", "unknown")
    priority = "high" if tier.lower() in ("gold", "platinum", "enterprise") or "urgent" in message.lower() else "low"
    
    return {
        "priority": priority,
        "suggested_resolution": raw_text.strip() if raw_text.strip() else "I have analyzed your request and logged it for our team.",
        "sentiment": "neutral",
        "category": "general",
        "entities": {},
        "reasoning": ["Automatic fallback from raw AI response"]
    }

def build_deterministic_resolution(tool_results, message):
    customer = tool_results.get("customer", {})
    tier = customer.get("tier", "unknown")
    kb = tool_results.get("kb", {})
    priority = "high" if tier.lower() in ("gold", "platinum", "enterprise") or "urgent" in message.lower() else "low"
    
    if kb and kb.get("content"):
        res = f"Based on our KB: {kb['content']}"
    else:
        res = f"Hello. We have received your request regarding '{message[:50]}...'. We've identified you as a {tier} customer and an agent will follow up shortly."
        
    return {
        "priority": priority,
        "suggested_resolution": res,
        "sentiment": "neutral",
        "category": "general",
        "entities": {},
        "reasoning": ["Deterministic fallback triggered"]
    }
