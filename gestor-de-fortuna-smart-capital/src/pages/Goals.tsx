 import { useEffect, useState } from "react"
import Sidebar from "../components/Sidebar"
import { supabase } from "../lib/supabase"

function Goals() {
  const [name, setName] = useState("")
  const [targetAmount, setTargetAmount] = useState("")
  const [currentAmount, setCurrentAmount] = useState("")
  const [currency, setCurrency] = useState("₡")
  const [date, setDate] = useState("")
  const [goals, setGoals] = useState<any[]>([])

  useEffect(() => {
    fetchGoals()
  }, [])

  async function fetchGoals() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      alert(error.message)
      return
    }

    setGoals(data || [])
  }

  async function addGoal() {
    if (!name || !targetAmount) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from("goals").insert({
      user_id: user.id,
      name,
      target_amount: Number(targetAmount),
      current_amount: Number(currentAmount || 0),
      currency,
      target_date: date || null,
    })

    if (error) {
      alert(error.message)
      return
    }

    setName("")
    setTargetAmount("")
    setCurrentAmount("")
    setCurrency("₡")
    setDate("")
    fetchGoals()
  }

  async function deleteGoal(id: string) {
    const confirmDelete = confirm("¿Seguro que quieres eliminar esta meta?")
    if (!confirmDelete) return

    const { error } = await supabase.from("goals").delete().eq("id", id)

    if (error) {
      alert(error.message)
      return
    }

    fetchGoals()
  }

  async function addContribution(goal: any) {
    const contribution = prompt("¿Cuánto quieres aportar a esta meta?")
    if (!contribution) return

    const newAmount = Number(goal.current_amount) + Number(contribution)

    const { error } = await supabase
      .from("goals")
      .update({ current_amount: newAmount })
      .eq("id", goal.id)

    if (error) {
      alert(error.message)
      return
    }

    fetchGoals()
  }

  const inputClass =
    "rounded-xl border border-white/10 bg-input px-4 py-3 text-white outline-none focus:border-primary/60"

  return (
    <div className="min-h-screen bg-background text-white lg:flex">
      <Sidebar />

      <div className="w-full flex-1 overflow-x-hidden">
        <header className="border-b border-white/10 px-4 py-5 lg:px-8">
          <h1 className="text-2xl font-bold">
            Metas <span className="text-primary">Financieras</span>
          </h1>

          <p className="text-sm text-textSecondary">
            Crea objetivos y mide tu progreso financiero.
          </p>
        </header>

        <main className="p-4 lg:p-8">
          <div className="rounded-3xl border border-primary/20 bg-card p-5 lg:p-6">
            <h2 className="text-xl font-bold">Nueva meta</h2>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre de la meta"
                className={inputClass}
              />

              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className={inputClass}
              >
                <option value="₡">Colones ₡</option>
                <option value="$">Dólares $</option>
                <option value="€">Euros €</option>
                <option value="₿">Bitcoin ₿</option>
              </select>

              <input
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                placeholder="Monto objetivo"
                type="number"
                className={inputClass}
              />

              <input
                value={currentAmount}
                onChange={(e) => setCurrentAmount(e.target.value)}
                placeholder="Monto ahorrado actual"
                type="number"
                className={inputClass}
              />

              <input
                value={date}
                onChange={(e) => setDate(e.target.value)}
                type="date"
                className={`${inputClass} sm:col-span-2`}
              />
            </div>

            <button
              onClick={addGoal}
              className="mt-6 w-full rounded-full bg-primary px-6 py-3 font-bold text-white sm:w-auto"
            >
              Crear meta
            </button>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            {goals.length === 0 ? (
              <div className="rounded-3xl border border-white/10 bg-card p-5 lg:p-6">
                <p className="text-textSecondary">Aún no tienes metas creadas.</p>
              </div>
            ) : (
              goals.map((goal) => {
                const progress = Math.min(
                  Math.round(
                    (Number(goal.current_amount) / Number(goal.target_amount)) * 100
                  ),
                  100
                )

                return (
                  <div
                    key={goal.id}
                    className="rounded-3xl border border-white/10 bg-card p-5 lg:p-6"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm text-primary">Meta financiera</p>

                        <h3 className="mt-1 break-words text-2xl font-bold">
                          {goal.name}
                        </h3>
                      </div>

                      <button
                        onClick={() => deleteGoal(goal.id)}
                        className="w-full rounded-full border border-red-400/40 px-4 py-2 text-sm font-bold text-red-400 sm:w-auto"
                      >
                        Eliminar
                      </button>
                    </div>

                    <p className="mt-5 break-words text-textSecondary">
                      {goal.currency}
                      {goal.current_amount} / {goal.currency}
                      {goal.target_amount}
                    </p>

                    <div className="mt-4 h-3 rounded-full bg-input">
                      <div
                        className="h-3 rounded-full bg-primary"
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    <p className="mt-3 text-sm text-textSecondary">
                      {progress}% completado
                    </p>

                    {goal.target_date && (
                      <p className="mt-2 text-sm text-textSecondary/70">
                        Fecha objetivo: {goal.target_date}
                      </p>
                    )}

                    <button
                      onClick={() => addContribution(goal)}
                      className="mt-5 w-full rounded-full border border-primary/40 px-5 py-2 font-bold text-primary sm:w-auto"
                    >
                      Agregar aporte
                    </button>
                  </div>
                )
              })
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

export default Goals