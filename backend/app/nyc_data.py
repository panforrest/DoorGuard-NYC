import httpx
import urllib.parse
from typing import Dict, Any, List

# NYC Open Data Socrata API Endpoints
DATASETS = {
    "hpd_violations": "wvxf-dwi5",
    "hpd_complaints": "uwyv-629c",
    "dob_complaints": "eabe-havv",
    "dob_permits": "ic3t-wcy2",
    "hpd_registrations": "feu5-w2e2"
}

BASE_URL = "https://data.cityofnewyork.us/resource"

async def query_nyc_data(dataset_key: str, where_clause: str, limit: int = 5) -> List[Dict[str, Any]]:
    """Generic function to query any of the 5 Socrata NYC Open Data datasets."""
    dataset_id = DATASETS.get(dataset_key)
    if not dataset_id:
        raise ValueError(f"Unknown dataset key: {dataset_key}")

    url = f"{BASE_URL}/{dataset_id}.json"
    params = {
        "$where": where_clause,
        "$limit": limit
    }
    
    async with httpx.AsyncClient() as client:
        try:
            # NYC Open Data API doesn't require a key for public endpoints
            response = await client.get(url, params=params, timeout=10.0)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Error querying NYC Open Data ({dataset_key}): {str(e)}")
            return []

async def check_hpd_violations(house_number: str, street: str, borough: str) -> List[Dict]:
    """Check Dataset 1: HPD Violations"""
    street_clean = street.upper().replace(" STREET", " ST").replace(" AVENUE", " AVE")
    where = f"housenumber='{house_number}' AND streetname LIKE '%{street_clean}%' AND boro='{borough.upper()}' AND violationstatus='Open'"
    return await query_nyc_data("hpd_violations", where)

async def check_hpd_complaints(house_number: str, street: str, borough: str) -> List[Dict]:
    """Check Dataset 2: HPD Complaints"""
    street_clean = street.upper()
    where = f"housenumber='{house_number}' AND streetname LIKE '%{street_clean}%' AND borough='{borough.upper()}'"
    return await query_nyc_data("hpd_complaints", where)

async def check_dob_complaints(house_number: str, street: str, borough: str) -> List[Dict]:
    """Check Dataset 3: DOB Complaints"""
    street_clean = street.upper()
    where = f"house_number='{house_number}' AND house_street LIKE '%{street_clean}%' AND borough='{borough.upper()}'"
    return await query_nyc_data("dob_complaints", where)

async def check_dob_permits(house_number: str, street: str, borough: str) -> List[Dict]:
    """Check Dataset 4: DOB Permits"""
    where = f"house__='{house_number}' AND street_name LIKE '%{street.upper()}%' AND borough='{borough.upper()}'"
    return await query_nyc_data("dob_permits", where)
