# ExpenseBuddy

This project is a simple expense tracking application with a FastAPI backend and a Next.js frontend.

## Backend

The backend is located in the `backend` directory and uses **FastAPI**. To run it locally:

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The API will start on `http://localhost:8000` with the following endpoints:

- `GET /expenses` – list expenses
- `POST /expenses` – create a new expense
- `GET /expenses/{id}` – get a specific expense
- `DELETE /expenses/{id}` – delete an expense

## Frontend

The frontend lives in the `frontend` directory and is built with **Next.js**. To start the development server:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000` in your browser. The page allows you to view and add expenses using the backend API.

