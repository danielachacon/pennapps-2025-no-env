from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from ..db.mongo import get_db

router = APIRouter(prefix="/profile", tags=["profile"]) 


class PolicyholderDriver(BaseModel):
    policy_number: Optional[str] = None
    name_of_policyholder_full_first: Optional[str] = None
    name_of_policyholder_full_middle: Optional[str] = None
    name_of_policyholder_last: Optional[str] = None
    occupation: Optional[str] = None
    policyholder_ssn: Optional[str] = None
    home_address: Optional[str] = None
    home_email: Optional[str] = None
    home_phone: Optional[str] = None
    business_address: Optional[str] = None
    business_phone: Optional[str] = None

    driver_full_first: Optional[str] = None
    driver_full_middle: Optional[str] = None
    driver_last: Optional[str] = None
    driver_address: Optional[str] = None
    driver_license_no: Optional[str] = None
    driver_state_license_issued: Optional[str] = None
    driver_ssn: Optional[str] = None
    driver_age: Optional[int] = None
    driver_dob: Optional[str] = None  # use ISO string from client
    driver_years_experience: Optional[int] = None
    driver_relation_to_policyholder: Optional[str] = None
    driver_authorized_by: Optional[str] = None
    policyholder_car_occupants: Optional[str] = None


class Automobile(BaseModel):
    make: Optional[str] = None
    year: Optional[int] = None
    body_type: Optional[str] = None
    model: Optional[str] = None
    license_plate_and_state: Optional[str] = None
    identification_number: Optional[str] = None
    holder_of_title_if_not_policyholder: Optional[str] = None
    owner_if_other_than_policyholder: Optional[str] = None
    owner_address: Optional[str] = None
    car_permanently_garaged_at: Optional[str] = None


class ProfileSetupRequest(BaseModel):
    user_id: str
    policyholder_driver: PolicyholderDriver
    automobile: Automobile


class ProfileSetupResponse(BaseModel):
    success: bool
    message: str | None = None


@router.post("/setup", response_model=ProfileSetupResponse)
async def setup_profile(payload: ProfileSetupRequest, db: AsyncIOMotorDatabase = Depends(get_db)):
    profiles = db["profiles"]
    # validate ObjectId
    try:
        user_oid = ObjectId(payload.user_id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid user_id")

    doc = {
        "policyholder_driver": payload.policyholder_driver.model_dump(exclude_none=True),
        "automobile": payload.automobile.model_dump(exclude_none=True),
        "updated_at": datetime.utcnow(),
    }
    try:
        # upsert by email
        await profiles.update_one(
            {"user_id": user_oid},
            {"$set": doc, "$setOnInsert": {"created_at": datetime.utcnow(), "user_id": user_oid}},
            upsert=True,
        )
        return ProfileSetupResponse(success=True, message="Profile saved")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save profile: {e}",
        )
