from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel
from typing import Dict, Any, Optional

# Import NYC Open Data queries
from .nyc_data import check_hpd_violations, check_hpd_complaints, check_dob_complaints, check_dob_permits

from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

# Load from DoorGuard-NYC/.env
load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), "../../.env"))

from .voice import router as voice_router

print("--- DOORGUARD API STARTING ---")
app = FastAPI(title="DoorGuard NYC API")

# CORS — allow frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the voice router for WebSockets
app.include_router(voice_router)

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "DoorGuard NYC Backend"}

# Data models
class AddressInput(BaseModel):
    houseNumber: str
    street: str
    borough: str
    apartment: Optional[str] = None

class VerificationRequest(BaseModel):
    address: AddressInput
    visitor_claim: str

def generate_verdict(claim: str, hpd_viol: list, hpd_compl: list, dob_compl: list, dob_permits: list) -> dict:
    """Analyze the open data results against the visitor's claim to generate a verdict."""
    claim = claim.lower()
    
    # 1. HPD / Mold / Maintenance Inspector
    if "hpd" in claim or "mold" in claim or "heat" in claim or "inspector" in claim:
        if len(hpd_viol) > 0 or len(hpd_compl) > 0:
            return {
                "status": "VERIFIED",
                "reasoning": f"Found {len(hpd_viol)} open violations and {len(hpd_compl)} complaints matching this claim.",
                "tenant_rights": "You may allow the inspector inside to check the documented issues."
            }
        else:
            return {
                "status": "UNVERIFIED",
                "reasoning": "Visitor claims to be HPD/Inspector, but NO open complaints or violations exist for this building in NYC Open Data.",
                "tenant_rights": "Admin Code §27-2043: You are not required to grant access if there is no emergency and no prior 24-hour written notice."
            }
            
    # 2. DOB / Construction / Renovation
    elif "dob" in claim or "construction" in claim or "builder" in claim or "renovation" in claim:
        if len(dob_permits) > 0:
            return {
                "status": "VERIFIED",
                "reasoning": f"Found {len(dob_permits)} active working permits for this building matching the construction claim.",
                "tenant_rights": "Construction workers have valid active permits."
            }
        else:
             return {
                "status": "BLOCKED",
                "reasoning": "Visitor claims to be construction workers, but ZERO active DOB permits exist for this address.",
                "tenant_rights": "Do not open the door. Report illegal construction or scam attempts to 311."
            }
    
    # 3. Default Management/Landlord fallback
    elif "landlord" in claim or "management" in claim or "owner" in claim:
        return {
            "status": "UNVERIFIED",
            "reasoning": "Verifying management. Did they provide 24-hour written notice?",
            "tenant_rights": "Admin Code §27-2043: Landlords and agents MUST provide 24-hour written notice for non-emergency inspections or repairs."
        }
        
    # Catch all
    return {
        "status": "UNKNOWN",
        "reasoning": "Could not match claim to a specific NYC dataset check.",
        "tenant_rights": "Always ask for official ID before opening the door."
    }

@app.post("/api/verify")
async def verify_visitor(req: VerificationRequest):
    """Core endpoint that takes an address + claim and checks NYC Open Data"""
    addr = req.address
    h_num = addr.houseNumber
    street = addr.street
    boro = addr.borough
    
    print(f"Verifying visitor at {h_num} {street}, {boro}. Claim: {req.visitor_claim}")
    
    # Fire off all 4 exact dataset checks
    try:
        hpd_viol = await check_hpd_violations(h_num, street, boro)
        hpd_compl = await check_hpd_complaints(h_num, street, boro)
        dob_compl = await check_dob_complaints(h_num, street, boro)
        dob_permits = await check_dob_permits(h_num, street, boro)
        
        # Cross reference the data with the claim to generate the verdict
        verdict = generate_verdict(req.visitor_claim, hpd_viol, hpd_compl, dob_compl, dob_permits)
        
        # Include the raw data sets in the payload so the frontend can display metrics
        return {
            "verdict": verdict["status"],
            "reasoning": verdict["reasoning"],
            "rights_citation": verdict["tenant_rights"],
            "datasets": {
                "hpd_violations_found": len(hpd_viol),
                "hpd_complaints_found": len(hpd_compl),
                "dob_complaints_found": len(dob_compl),
                "dob_permits_found": len(dob_permits)
            }
        }
    except Exception as e:
        print(f"Verification Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# We'll use absolute imports here just in case FastAPI complains about relative imports at the top
