from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from uuid import uuid4
from datetime import date

from .core.config import settings

class ExpenseBase(BaseModel):
    description: str
    amount: float
    date: date = date.today()

class Expense(ExpenseBase):
    id: str

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_hosts,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_expenses: List[Expense] = []

@app.get("/expenses", response_model=List[Expense])
def list_expenses() -> List[Expense]:
    return _expenses

@app.post("/expenses", response_model=Expense)
def create_expense(expense: ExpenseBase) -> Expense:
    new_expense = Expense(id=str(uuid4()), **expense.model_dump())
    _expenses.append(new_expense)
    return new_expense

@app.get("/expenses/{expense_id}", response_model=Expense)
def get_expense(expense_id: str) -> Expense:
    for expense in _expenses:
        if expense.id == expense_id:
            return expense
    raise HTTPException(status_code=404, detail="Expense not found")

@app.delete("/expenses/{expense_id}", status_code=204)
def delete_expense(expense_id: str) -> None:
    for i, expense in enumerate(_expenses):
        if expense.id == expense_id:
            del _expenses[i]
            return
    raise HTTPException(status_code=404, detail="Expense not found")
