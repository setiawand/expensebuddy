import pytest
from fastapi.testclient import TestClient
from sqlmodel import SQLModel, create_engine, Session

from app import main as app_main

@pytest.fixture
def client():
    # Use an in-memory SQLite database for tests
    engine = create_engine("sqlite:///:memory:")
    app_main.engine = engine
    SQLModel.metadata.create_all(engine)

    def override_get_session():
        with Session(engine) as session:
            yield session

    app_main.app.dependency_overrides[app_main.get_session] = override_get_session

    with TestClient(app_main.app) as c:
        yield c

    app_main.app.dependency_overrides.clear()


def test_create_and_get_expense(client):
    data = {"description": "Coffee", "amount": 3.5}
    resp = client.post("/expenses", json=data)
    assert resp.status_code == 200
    result = resp.json()
    assert result["description"] == "Coffee"
    assert result["amount"] == 3.5
    expense_id = result["id"]

    resp = client.get(f"/expenses/{expense_id}")
    assert resp.status_code == 200
    fetched = resp.json()
    assert fetched["id"] == expense_id
    assert fetched["description"] == "Coffee"
    assert fetched["amount"] == 3.5


def test_list_expenses(client):
    client.post("/expenses", json={"description": "A", "amount": 1})
    client.post("/expenses", json={"description": "B", "amount": 2})

    resp = client.get("/expenses")
    assert resp.status_code == 200
    items = resp.json()
    assert len(items) == 2
    descriptions = {item["description"] for item in items}
    assert descriptions == {"A", "B"}


def test_delete_expense(client):
    resp = client.post("/expenses", json={"description": "Temp", "amount": 5})
    expense_id = resp.json()["id"]

    del_resp = client.delete(f"/expenses/{expense_id}")
    assert del_resp.status_code == 204

    get_resp = client.get(f"/expenses/{expense_id}")
    assert get_resp.status_code == 404
