from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel  
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from passlib.context import CryptContext
from app.db.database import get_db
from app.db import models
from app.core.security import verify_password, create_access_token, get_password_hash

import passlib.handlers.bcrypt as bcrypt_handler
bcrypt_handler.detect_wrap_bug = lambda ident: False

class UserCreate(BaseModel):
    email: str
    password: str
    role: str = "ta" 

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/signup", status_code=status.HTTP_201_CREATED)
async def create_user(user: UserCreate, db: AsyncSession = Depends(get_db)): 
    result = await db.execute(select(models.User).filter(models.User.email == user.email))
    existing_user = result.scalars().first()
    
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user.password)
    new_user = models.User(
        email=user.email,
        hashed_password=hashed_password,
        role=user.role
    )
    
    user_role = user.role.upper() if hasattr(models, "UserRole") else user.role
    db.add(new_user)
    await db.commit()      
    await db.refresh(new_user) 
    
    return {"message": "User created successfully. Please log in."}


@router.post("/login")
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(), 
    db: AsyncSession = Depends(get_db)
):
    # 1. The Async way to query the database
    result = await db.execute(select(models.User).filter(models.User.email == form_data.username))
    user = result.scalars().first()

    # 2. Verify the user exists and password matches
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 3. Create the JWT Access Token
    # Handle both Enum roles (user.role.value) and String roles (user.role)
    role_str = user.role.value if hasattr(user.role, 'value') else user.role
    
    access_token = create_access_token(
        data={"sub": user.email, "role": role_str}
    )

    # 4. Return the exact JSON structure FastAPI requires
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/seed")
async def seed_demo_users(db: AsyncSession = Depends(get_db)):
    from app.core.security import get_password_hash
    
    # 1. Check if the TA already exists
    result = await db.execute(select(models.User).filter(models.User.email == "ta@gradeops.dev"))
    if result.scalars().first():
        return {"message": "Users already exist! You can log in."}
        
    # 2. Create the TA
    ta = models.User(
        email="ta@gradeops.dev",
        hashed_password=get_password_hash("ta123"),
        role=models.UserRole.TA
    )
    
    # 3. Create the Instructor
    instructor = models.User(
        email="instructor@gradeops.dev",
        hashed_password=get_password_hash("instructor123"),
        role=models.UserRole.INSTRUCTOR
    )
    
    # 4. Save to NeonDB
    db.add_all([ta, instructor])
    await db.commit()
    
    return {"message": "Success! Demo users have been injected into the database."}