from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Header
from pydantic import BaseModel, EmailStr, Field
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo.errors import DuplicateKeyError
from typing import Optional

from ..db.mongo import get_db
from ..core.security import hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


class Location(BaseModel):
    lat: float
    lng: float


class DriverInfo(BaseModel):
    name: str
    address: str
    phone: str
    license_no: str
    state_license_issued: str
    social_security_no: str
    driver_age: int
    date_of_birth: str
    years_driving_experience: int
    relation_to_policyholder: str
    who_authorized_to_drive: str


class PolicyholderInfo(BaseModel):
    name: str
    policy_number: str
    occupation: str
    social_security_no: str
    home_address: str
    email: str
    phone: str
    business_address: str
    business_phone: str
    name_occupants_car: str


class AutomobileInfo(BaseModel):
    make: str
    year: int
    body_type: str
    model: str
    license_plate_state: str
    identification_number: str
    name_holder_title: str
    name_owner_if_other: str
    address: str
    car_permanently_garaged_at: str


class InsuranceInfo(BaseModel):
    policyholder: PolicyholderInfo
    driver: DriverInfo
    automobile: AutomobileInfo


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    location: Location | None = None
    emergency_contacts: list[str] | None = None
    insurance_info: InsuranceInfo | None = None


class AuthResponse(BaseModel):
    success: bool
    message: str | None = None
    access_token: str | None = None

class UserResponse(BaseModel):
    email: str
    emergency_contacts: list[str]
    created_at: datetime


@router.post("/register", response_model=AuthResponse)
async def register_user(payload: RegisterRequest, db: AsyncIOMotorDatabase = Depends(get_db)):
    users = db["users"]
    try:
        doc: dict = {
            "email": payload.email.lower(),
            "password_hash": hash_password(payload.password),
            "created_at": datetime.utcnow(),
        }
        if payload.location is not None:
            doc["location"] = {
                "lat": payload.location.lat,
                "lng": payload.location.lng,
                "updated_at": datetime.utcnow(),
            }
        if payload.emergency_contacts:
            # store only non-empty strings, trimmed
            contacts = [c.strip() for c in payload.emergency_contacts if c and c.strip()]
            if contacts:
                doc["emergency_contacts"] = contacts
        
        if payload.insurance_info:
            # Store insurance information in a structured format
            doc["insurance_info"] = {
                "policyholder": {
                    "name": payload.insurance_info.policyholder.name,
                    "policy_number": payload.insurance_info.policyholder.policy_number,
                    "occupation": payload.insurance_info.policyholder.occupation,
                    "social_security_no": payload.insurance_info.policyholder.social_security_no,
                    "home_address": payload.insurance_info.policyholder.home_address,
                    "email": payload.insurance_info.policyholder.email,
                    "phone": payload.insurance_info.policyholder.phone,
                    "business_address": payload.insurance_info.policyholder.business_address,
                    "business_phone": payload.insurance_info.policyholder.business_phone,
                    "name_occupants_car": payload.insurance_info.policyholder.name_occupants_car,
                },
                "driver": {
                    "name": payload.insurance_info.driver.name,
                    "address": payload.insurance_info.driver.address,
                    "phone": payload.insurance_info.driver.phone,
                    "license_no": payload.insurance_info.driver.license_no,
                    "state_license_issued": payload.insurance_info.driver.state_license_issued,
                    "social_security_no": payload.insurance_info.driver.social_security_no,
                    "driver_age": payload.insurance_info.driver.driver_age,
                    "date_of_birth": payload.insurance_info.driver.date_of_birth,
                    "years_driving_experience": payload.insurance_info.driver.years_driving_experience,
                    "relation_to_policyholder": payload.insurance_info.driver.relation_to_policyholder,
                    "who_authorized_to_drive": payload.insurance_info.driver.who_authorized_to_drive,
                },
                "automobile": {
                    "make": payload.insurance_info.automobile.make,
                    "year": payload.insurance_info.automobile.year,
                    "body_type": payload.insurance_info.automobile.body_type,
                    "model": payload.insurance_info.automobile.model,
                    "license_plate_state": payload.insurance_info.automobile.license_plate_state,
                    "identification_number": payload.insurance_info.automobile.identification_number,
                    "name_holder_title": payload.insurance_info.automobile.name_holder_title,
                    "name_owner_if_other": payload.insurance_info.automobile.name_owner_if_other,
                    "address": payload.insurance_info.automobile.address,
                    "car_permanently_garaged_at": payload.insurance_info.automobile.car_permanently_garaged_at,
                },
                "created_at": datetime.utcnow(),
            }
        
        await users.insert_one(doc)
        return AuthResponse(success=True, message="Account created")
    except DuplicateKeyError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    except Exception as e:
        # Surface unexpected DB/connection errors
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {e}",
        )


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


@router.post("/login", response_model=AuthResponse)
async def login_user(payload: LoginRequest, db: AsyncIOMotorDatabase = Depends(get_db)):
    users = db["users"]
    user = await users.find_one({"email": payload.email.lower()})
    if not user or not verify_password(payload.password, user.get("password_hash", "")):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    # For simplicity, use email as token (in production, use proper JWT)
    token = f"user_{user['email']}"
    return AuthResponse(success=True, message="Logged in", access_token=token)

# Simple token validation (in production, use proper JWT validation)
async def get_current_user(authorization: Optional[str] = Header(None), db: AsyncIOMotorDatabase = Depends(get_db)):
    print(f"Debug: Authorization header: {authorization}")
    
    if not authorization or not authorization.startswith("Bearer "):
        print("Debug: Missing or invalid authorization header")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing or invalid token")
    
    token = authorization.split("Bearer ")[1]
    print(f"Debug: Extracted token: {token}")
    
    # Extract email from simple token (in production, decode JWT)
    if token.startswith("user_"):
        email = token.replace("user_", "")
        print(f"Debug: Looking for user with email: {email}")
        users = db["users"]
        user = await users.find_one({"email": email})
        if user:
            print(f"Debug: Found user: {user['email']}")
            return user
        else:
            print(f"Debug: User not found in database")
    else:
        print(f"Debug: Token doesn't start with 'user_'")
    
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

@router.get("/me", response_model=UserResponse)
async def get_user_profile(current_user = Depends(get_current_user)):
    return UserResponse(
        email=current_user["email"],
        emergency_contacts=current_user.get("emergency_contacts", []),
        created_at=current_user["created_at"]
    )

class AddContactRequest(BaseModel):
    phone: str

@router.post("/add-contact", response_model=AuthResponse)
async def add_emergency_contact(payload: AddContactRequest, current_user = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    users = db["users"]
    
    # Get current emergency contacts
    current_contacts = current_user.get("emergency_contacts", [])
    
    # Add new contact if not already exists
    new_phone = payload.phone.strip()
    if new_phone and new_phone not in current_contacts:
        current_contacts.append(new_phone)
        
        # Update user in database
        await users.update_one(
            {"email": current_user["email"]},
            {"$set": {"emergency_contacts": current_contacts}}
        )
        
        return AuthResponse(success=True, message="Contact added successfully")
    elif new_phone in current_contacts:
        return AuthResponse(success=False, message="Contact already exists")
    else:
        return AuthResponse(success=False, message="Invalid phone number")


class UpdateInsuranceRequest(BaseModel):
    user_id: str
    policyholder_driver: dict
    automobile: dict

@router.post("/update-insurance", response_model=AuthResponse)
async def update_insurance_info(payload: UpdateInsuranceRequest, db: AsyncIOMotorDatabase = Depends(get_db)):
    users = db["users"]
    
    try:
        # Find user by user_id (assuming it's the email for now)
        user = await users.find_one({"email": payload.user_id})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Convert the legacy format to the new insurance format
        insurance_info = {
            "policyholder": {
                "name": f"{payload.policyholder_driver.get('name_of_policyholder_full_first', '')} {payload.policyholder_driver.get('name_of_policyholder_full_middle', '')} {payload.policyholder_driver.get('name_of_policyholder_last', '')}".strip(),
                "policy_number": payload.policyholder_driver.get('policy_number', ''),
                "occupation": payload.policyholder_driver.get('occupation', ''),
                "social_security_no": payload.policyholder_driver.get('policyholder_ssn', ''),
                "home_address": payload.policyholder_driver.get('home_address', ''),
                "email": payload.policyholder_driver.get('home_email', ''),
                "phone": payload.policyholder_driver.get('home_phone', ''),
                "business_address": payload.policyholder_driver.get('business_address', ''),
                "business_phone": payload.policyholder_driver.get('business_phone', ''),
                "name_occupants_car": payload.policyholder_driver.get('policyholder_car_occupants', ''),
            },
            "driver": {
                "name": f"{payload.policyholder_driver.get('driver_full_first', '')} {payload.policyholder_driver.get('driver_full_middle', '')} {payload.policyholder_driver.get('driver_last', '')}".strip(),
                "address": payload.policyholder_driver.get('driver_address', ''),
                "phone": payload.policyholder_driver.get('home_phone', ''),  # Using home phone as fallback
                "license_no": payload.policyholder_driver.get('driver_license_no', ''),
                "state_license_issued": payload.policyholder_driver.get('driver_state_license_issued', ''),
                "social_security_no": payload.policyholder_driver.get('driver_ssn', ''),
                "driver_age": payload.policyholder_driver.get('driver_age', 0),
                "date_of_birth": payload.policyholder_driver.get('driver_dob', ''),
                "years_driving_experience": payload.policyholder_driver.get('driver_years_experience', 0),
                "relation_to_policyholder": payload.policyholder_driver.get('driver_relation_to_policyholder', ''),
                "who_authorized_to_drive": payload.policyholder_driver.get('driver_authorized_by', ''),
            },
            "automobile": {
                "make": payload.automobile.get('make', ''),
                "year": payload.automobile.get('year', 0),
                "body_type": payload.automobile.get('body_type', ''),
                "model": payload.automobile.get('model', ''),
                "license_plate_state": payload.automobile.get('license_plate_and_state', ''),
                "identification_number": payload.automobile.get('identification_number', ''),
                "name_holder_title": payload.automobile.get('holder_of_title_if_not_policyholder', ''),
                "name_owner_if_other": payload.automobile.get('owner_if_other_than_policyholder', ''),
                "address": payload.automobile.get('owner_address', ''),
                "car_permanently_garaged_at": payload.automobile.get('car_permanently_garaged_at', ''),
            },
            "created_at": datetime.utcnow(),
        }
        
        # Update user with insurance information
        await users.update_one(
            {"email": payload.user_id},
            {"$set": {"insurance_info": insurance_info}}
        )
        
        return AuthResponse(success=True, message="Insurance information updated successfully")
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update insurance information: {e}"
        )
