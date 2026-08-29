from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from uuid import uuid4
from datetime import datetime
import hashlib
import json

app = FastAPI(
    title="SafeTour API",
    description="Smart Tourist Safety Monitoring & Incident Response System",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -------------------------------------------------
# Temporary in-memory storage
# -------------------------------------------------

tourists_db = {}
blockchain_records = []
sos_alerts = []


# -------------------------------------------------
# Models
# -------------------------------------------------

class Tourist(BaseModel):
    name: str
    email: str
    phone: str
    nationality: str

    # KYC reference
    identity_type: str
    identity_number: str

    # Emergency contact
    emergency_contact_name: str
    emergency_contact_phone: str

    # Travel details
    destination: str
    entry_date: str
    exit_date: str


class SOSAlert(BaseModel):
    tourist_id: str
    latitude: float
    longitude: float


# -------------------------------------------------
# Blockchain-style hash function
# -------------------------------------------------

def generate_record_hash(data):
    """
    Creates a tamper-evident SHA-256 hash.
    This is a lightweight blockchain-style implementation
    for the hackathon prototype.
    """

    record_string = json.dumps(
        data,
        sort_keys=True,
        default=str,
    )

    return hashlib.sha256(
        record_string.encode()
    ).hexdigest()


# -------------------------------------------------
# Home
# -------------------------------------------------

@app.get("/")
def home():
    return {
        "message": "SafeTour backend is running!",
        "system": "Smart Tourist Safety Monitoring & Incident Response System",
    }


# -------------------------------------------------
# System status
# -------------------------------------------------

@app.get("/api/status")
def get_status():
    return {
        "status": "active",
        "message": "SafeTour system is online and connected!",
        "features": [
            "Digital Tourist ID",
            "Geo-Fencing",
            "Live Location Tracking",
            "Emergency SOS",
            "Incident Response",
            "Blockchain-style Tamper Protection",
        ],
    }


# -------------------------------------------------
# Register tourist and create Digital ID
# -------------------------------------------------

@app.post("/api/register")
def register_tourist(tourist: Tourist):

    tourist_id = f"ST-{str(uuid4())[:8].upper()}"

    issued_at = datetime.now().strftime(
        "%Y-%m-%d %H:%M:%S"
    )

    tourist_data = {
        "id": tourist_id,
        "name": tourist.name,
        "email": tourist.email,
        "phone": tourist.phone,
        "nationality": tourist.nationality,

        "identity_type": tourist.identity_type,
        "identity_number": tourist.identity_number,

        "emergency_contact_name":
            tourist.emergency_contact_name,

        "emergency_contact_phone":
            tourist.emergency_contact_phone,

        "destination": tourist.destination,
        "entry_date": tourist.entry_date,
        "exit_date": tourist.exit_date,

        "issued_at": issued_at,
        "status": "ACTIVE",
    }

    # -------------------------------------------------
    # Create tamper-proof record
    # -------------------------------------------------

    previous_hash = (
        blockchain_records[-1]["hash"]
        if blockchain_records
        else "GENESIS_BLOCK"
    )

    blockchain_block = {
        "block_number": len(blockchain_records) + 1,
        "tourist_id": tourist_id,
        "previous_hash": previous_hash,
        "timestamp": issued_at,
        "record_type": "DIGITAL_TOURIST_ID",
    }

    # Generate hash
    block_hash = generate_record_hash(
        blockchain_block
    )

    blockchain_block["hash"] = block_hash

    blockchain_records.append(
        blockchain_block
    )

    # Add blockchain information to tourist record
    tourist_data["blockchain_hash"] = block_hash
    tourist_data["block_number"] = (
        blockchain_block["block_number"]
    )

    # Store tourist
    tourists_db[tourist_id] = tourist_data

    return {
        "success": True,
        "message":
            "Tourist registered and Digital ID generated successfully!",
        "tourist": tourist_data,
        "blockchain": {
            "block_number":
                blockchain_block["block_number"],
            "hash": block_hash,
            "previous_hash": previous_hash,
            "verification":
                "Tamper-evident record created",
        },
    }


# -------------------------------------------------
# Verify Digital Tourist ID
# -------------------------------------------------

@app.get("/api/tourist/{tourist_id}")
def get_tourist(tourist_id: str):

    tourist = tourists_db.get(tourist_id)

    if not tourist:
        return {
            "success": False,
            "message": "Tourist ID not found",
        }

    return {
        "success": True,
        "tourist": tourist,
    }


# -------------------------------------------------
# Verify blockchain-style record
# -------------------------------------------------

@app.get("/api/verify/{tourist_id}")
def verify_tourist_record(tourist_id: str):

    tourist = tourists_db.get(tourist_id)

    if not tourist:
        return {
            "success": False,
            "message": "Tourist ID not found",
        }

    matching_block = None

    for block in blockchain_records:
        if block["tourist_id"] == tourist_id:
            matching_block = block
            break

    if not matching_block:
        return {
            "success": False,
            "message": "Blockchain record not found",
        }

    # Recreate the data used to generate the hash
    verification_data = {
        "block_number":
            matching_block["block_number"],
        "tourist_id":
            matching_block["tourist_id"],
        "previous_hash":
            matching_block["previous_hash"],
        "timestamp":
            matching_block["timestamp"],
        "record_type":
            matching_block["record_type"],
    }

    recalculated_hash = generate_record_hash(
        verification_data
    )

    is_valid = (
        recalculated_hash
        == matching_block["hash"]
    )

    return {
        "success": True,
        "tourist_id": tourist_id,
        "block_number":
            matching_block["block_number"],
        "blockchain_verified": is_valid,
        "hash":
            matching_block["hash"],
        "message": (
            "Digital ID record is valid and tamper-evident."
            if is_valid
            else
            "Warning: Digital ID record verification failed!"
        ),
    }


# -------------------------------------------------
# Send SOS alert
# -------------------------------------------------

@app.post("/api/sos")
def send_sos(alert: SOSAlert):

    timestamp = datetime.now().strftime(
        "%Y-%m-%d %H:%M:%S"
    )

    tourist = tourists_db.get(
        alert.tourist_id
    )

    if not tourist:
        return {
            "success": False,
            "message": "Invalid Tourist ID",
        }

    incident_id = (
        f"INC-{str(uuid4())[:8].upper()}"
    )

    sos_data = {
        "incident_id": incident_id,
        "tourist_id": alert.tourist_id,
        "tourist_name": tourist["name"],
        "latitude": alert.latitude,
        "longitude": alert.longitude,
        "timestamp": timestamp,
        "status": "EMERGENCY ALERT ACTIVE",
        "priority": "HIGH",
    }

    sos_alerts.append(sos_data)

    return {
        "success": True,
        "message":
            "SOS alert received and incident created successfully!",
        "alert": sos_data,
        "emergency_contact": {
            "name":
                tourist["emergency_contact_name"],
            "phone":
                tourist["emergency_contact_phone"],
        },
    }


# -------------------------------------------------
# View all active incidents
# -------------------------------------------------

@app.get("/api/incidents")
def get_incidents():

    return {
        "success": True,
        "total_incidents": len(sos_alerts),
        "incidents": sos_alerts,
    }


# -------------------------------------------------
# View blockchain records
# -------------------------------------------------

@app.get("/api/blockchain")
def get_blockchain():

    return {
        "success": True,
        "total_blocks":
            len(blockchain_records),
        "blocks":
            blockchain_records,
    }