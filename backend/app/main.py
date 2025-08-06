from fastapi import Depends, FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from uuid import uuid4
from datetime import date as dt_date
from sqlmodel import SQLModel, Field, Session, create_engine, select
import re
import io
from PIL import Image
import pytesseract

from .core.config import settings

class ExpenseBase(SQLModel):
    description: str
    amount: float
    date: dt_date = Field(default_factory=dt_date.today)

class Expense(ExpenseBase, table=True):
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)

class ExpenseRead(ExpenseBase):
    id: str

class ExpenseCreate(ExpenseBase):
    pass

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_hosts,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

engine = create_engine("sqlite:///./expenses.db")

def create_db_and_tables() -> None:
    SQLModel.metadata.create_all(engine)

@app.on_event("startup")
def on_startup() -> None:
    create_db_and_tables()

def get_session():
    with Session(engine) as session:
        yield session

def extract_expense_from_receipt(text: str) -> dict:
    """Extract expense information from OCR text"""
    lines = text.split('\n')
    
    # Look for total amount patterns
    amount_patterns = [
        r'total[:\s]*[\$]?(\d+[.,]\d{2})',
        r'amount[:\s]*[\$]?(\d+[.,]\d{2})',
        r'[\$](\d+[.,]\d{2})',
        r'(\d+[.,]\d{2})',
    ]
    
    amount = 0.0
    description = "Receipt expense"
    
    # Extract amount
    for line in lines:
        line_lower = line.lower().strip()
        for pattern in amount_patterns:
            match = re.search(pattern, line_lower)
            if match:
                amount_str = match.group(1).replace(',', '.')
                try:
                    amount = float(amount_str)
                    break
                except ValueError:
                    continue
        if amount > 0:
            break
    
    # Extract description (look for merchant name or first meaningful line)
    for line in lines:
        line = line.strip()
        if len(line) > 3 and not re.match(r'^[\d\s\$\.,:-]+$', line):
            # Skip lines that are mostly numbers, symbols, or very short
            if not re.search(r'(receipt|total|amount|tax|subtotal)', line.lower()):
                description = line[:50]  # Limit description length
                break
    
    return {
        "description": description,
        "amount": amount if amount > 0 else 0.0
    }

@app.get("/expenses", response_model=List[ExpenseRead])
def list_expenses(session: Session = Depends(get_session)) -> List[Expense]:
    expenses = session.exec(select(Expense)).all()
    return expenses

@app.post("/expenses", response_model=ExpenseRead)
def create_expense(expense: ExpenseCreate, session: Session = Depends(get_session)) -> Expense:
    db_expense = Expense.from_orm(expense)
    session.add(db_expense)
    session.commit()
    session.refresh(db_expense)
    return db_expense

@app.post("/expenses/upload-receipt", response_model=ExpenseRead)
async def upload_receipt(file: UploadFile = File(...), session: Session = Depends(get_session)) -> Expense:
    """Upload receipt image and extract expense information using OCR"""
    
    # Validate file type
    if not file.content_type or not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    try:
        # Read image file
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        
        # Convert to RGB if necessary
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Extract text using OCR
        extracted_text = pytesseract.image_to_string(image)
        
        # Parse expense information from text
        expense_data = extract_expense_from_receipt(extracted_text)
        
        # Create expense
        expense_create = ExpenseCreate(**expense_data)
        db_expense = Expense.from_orm(expense_create)
        session.add(db_expense)
        session.commit()
        session.refresh(db_expense)
        
        return db_expense
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing receipt: {str(e)}")

@app.get("/expenses/{expense_id}", response_model=ExpenseRead)
def get_expense(expense_id: str, session: Session = Depends(get_session)) -> Expense:
    expense = session.get(Expense, expense_id)
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    return expense

@app.delete("/expenses/{expense_id}", status_code=204)
def delete_expense(expense_id: str, session: Session = Depends(get_session)) -> None:
    expense = session.get(Expense, expense_id)
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    session.delete(expense)
    session.commit()
