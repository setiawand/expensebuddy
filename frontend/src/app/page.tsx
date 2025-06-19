"use client";
import { useEffect, useState, FormEvent } from "react";

interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string;
}

export default function Home() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8004";

  useEffect(() => {
    fetch(`${API_URL}/expenses`)
      .then((res) => res.json())
      .then(setExpenses)
      .catch(() => {});
  }, []);

  async function addExpense(e: FormEvent) {
    e.preventDefault();
    const resp = await fetch(`${API_URL}/expenses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description, amount: parseFloat(amount) }),
    });
    if (resp.ok) {
      const data = await resp.json();
      setExpenses([...expenses, data]);
      setDescription("");
      setAmount("");
    }
  }

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">Expenses</h1>
      <ul className="mb-4">
        {expenses.map((exp) => (
          <li key={exp.id} className="mb-1">
            {exp.description} - ${'{'}exp.amount.toFixed(2){'}'}
          </li>
        ))}
      </ul>
      <form onSubmit={addExpense} className="flex gap-2">
        <input
          className="border p-1"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
        <input
          className="border p-1"
          placeholder="Amount"
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
        <button className="border px-2" type="submit">
          Add
        </button>
      </form>
    </main>
  );
}
