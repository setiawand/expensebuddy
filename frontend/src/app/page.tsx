"use client";
import { useEffect, useState, FormEvent, useRef, useCallback } from "react";
import { useSession, signIn, signOut } from "next-auth/react";

interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string;
}

export default function Home() {
  const { data: session } = useSession();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [currency, setCurrency] = useState("USD");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8004";

  const currencies = [
    { code: "USD", symbol: "$", name: "US Dollar" },
    { code: "IDR", symbol: "Rp", name: "Indonesian Rupiah" },
  ];

  const getCurrentCurrency = () => currencies.find(c => c.code === currency) || currencies[0];

  const fetchExpenses = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/expenses`);
      if (response.ok) {
        const data = await response.json();
        setExpenses(data);
      }
    } catch (error) {
      console.error("Failed to fetch expenses:", error);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!description || !amount) return

    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/expenses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description,
          amount: parseFloat(amount),
        }),
      })

      if (response.ok) {
        setDescription('')
        setAmount('')
        fetchExpenses()
      }
    } catch (error) {
      console.error('Error adding expense:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReceiptUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`${API_URL}/expenses/upload-receipt`, {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        fetchExpenses()
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      } else {
        const errorData = await response.json()
        alert(`Error uploading receipt: ${errorData.detail}`)
      }
    } catch (error) {
      console.error('Error uploading receipt:', error)
      alert('Error uploading receipt. Please try again.')
    } finally {
      setUploadLoading(false)
    }
  }

  async function deleteExpense(id: string) {
    try {
      const resp = await fetch(`${API_URL}/expenses/${id}`, {
        method: "DELETE",
      });
      
      if (resp.ok) {
        setExpenses(expenses.filter(exp => exp.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete expense:", error);
    }
  }

  const formatCurrency = (amount: number) => {
    const currencyInfo = getCurrentCurrency();
    if (currencyInfo.code === "IDR") {
      return `${currencyInfo.symbol} ${amount.toLocaleString("id-ID")}`;
    }
    return `${currencyInfo.symbol}${amount.toFixed(2)}`;
  };

  const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">💰 ExpenseBuddy</h1>
              <p className="text-gray-600">Smart expense management made simple</p>
            </div>
            
            {!session ? (
              <button
                onClick={() => signIn("google")}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign in with Google
              </button>
            ) : (
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm text-gray-600">Welcome back,</p>
                  <p className="font-medium text-gray-800">{session.user?.name}</p>
                </div>
                <button 
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                  onClick={() => signOut()}
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add Expense Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Add New Expense</h2>
              
              {/* Currency Selector */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Currency
                </label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                >
                  {currencies.map((curr) => (
                    <option key={curr.code} value={curr.code}>
                      {curr.symbol} {curr.name}
                    </option>
                  ))}
                </select>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 placeholder-gray-500 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Coffee, Lunch, Gas"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount ({getCurrentCurrency().symbol})
                  </label>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 placeholder-gray-500 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={currency === "IDR" ? "10000" : "0.00"}
                    type="number"
                    step={currency === "IDR" ? "1000" : "0.01"}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button 
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? "Adding..." : "Add Expense"}
                  </button>
                  
                  <div className="flex-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleReceiptUpload}
                      className="hidden"
                      id="receipt-upload"
                    />
                    <label
                      htmlFor="receipt-upload"
                      className={`w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200 cursor-pointer inline-flex items-center justify-center ${
                        uploadLoading ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {uploadLoading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing...
                        </>
                      ) : (
                        <>
                          📷 Upload Receipt
                        </>
                      )}
                    </label>
                  </div>
                </div>
              </form>
            </div>

            {/* Summary Card */}
            <div className="bg-white rounded-lg shadow-md p-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Expenses:</span>
                  <span className="font-medium">{expenses.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Amount:</span>
                  <span className="font-bold text-lg text-green-600">{formatCurrency(totalAmount)}</span>
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  Currency: {getCurrentCurrency().name}
                </div>
              </div>
            </div>
          </div>

          {/* Expenses List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Expenses</h2>
              
              {expenses.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">📝</div>
                  <p className="text-gray-500 text-lg">No expenses yet</p>
                  <p className="text-gray-400">Add your first expense to get started!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {expenses.map((exp) => (
                    <div key={exp.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-800">{exp.description}</h3>
                        <p className="text-sm text-gray-500">
                          {new Date(exp.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-semibold text-green-600">
                          {formatCurrency(exp.amount)}
                        </span>
                        <button
                          onClick={() => deleteExpense(exp.id)}
                          className="text-red-500 hover:text-red-700 p-1 rounded transition-colors duration-200"
                          title="Delete expense"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
