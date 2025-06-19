from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from uuid import uuid4
from datetime import date
from sqlmodel import SQLModel, Field, Session, create_engine, select

from .core.config import settings

class ExpenseBase(SQLModel):
    description: str
    amount: float
    date: date = date.today()

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
