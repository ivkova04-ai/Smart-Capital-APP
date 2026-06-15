 import { useEffect, useState } from "react"
import Sidebar from "../components/Sidebar"
import { supabase } from "../lib/supabase"

function Wealth() {
  const [assetName, setAssetName] = useState("")
  const [assetAmount, setAssetAmount] = useState("")
  const [assetCurrency, setAssetCurrency] = useState("₡")

  const [investmentName, setInvestmentName] = useState("")
  const [investmentType, setInvestmentType] = useState("ETF")
  const [investmentAmount, setInvestmentAmount] = useState("")
  const [investmentCurrentValue, setInvestmentCurrentValue] = useState("")
  const [investmentCurrency, setInvestmentCurrency] = useState("₡")
  const [investmentNotes, setInvestmentNotes] = useState("")

  const [liabilityName, setLiabilityName] = useState("")
  const [liabilityAmount, setLiabilityAmount] = useState("")
  const [liabilityCurrency, setLiabilityCurrency] = useState("₡")

  const [assets, setAssets] = useState<any[]>([])
  const [investments, setInvestments] = useState<any[]>([])
  const [liabilities, setLiabilities] = useState<any[]>([])
  const [movements, setMovements] = useState<any[]>([])

  useEffect(() => {
    fetchAssets()
    fetchInvestments()
    fetchLiabilities()
    fetchMovements()
  }, [])

  async function getUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    return user
  }

  async function fetchAssets() {
    const user = await getUser()
    if (!user) return

    const { data, error } = await supabase
      .from("assets")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      alert(error.message)
      return
    }

    setAssets(data || [])
  }

  async function fetchInvestments() {
    const user = await getUser()
    if (!user) return

    const { data, error } = await supabase
      .from("investments")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      alert(error.message)
      return
    }

    setInvestments(data || [])
  }

  async function fetchLiabilities() {
    const user = await getUser()
    if (!user) return

    const { data, error } = await supabase
      .from("liabilities")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      alert(error.message)
      return
    }

    setLiabilities(data || [])
  }

  async function fetchMovements() {
    const user = await getUser()
    if (!user) return

    const { data, error } = await supabase
      .from("movements")
      .select("*")
      .eq("user_id", user.id)

    if (error) {
      alert(error.message)
      return
    }

    setMovements(data || [])
  }

  async function ensureDebtCategoryAndSubcategory(userId: string, debtName: string) {
    const cleanDebtName = debtName.trim()

    const { data: existingCategory, error: categorySearchError } = await supabase
      .from("categories")
      .select("*")
      .eq("user_id", userId)
      .ilike("name", "Deudas")
      .maybeSingle()

    if (categorySearchError) {
      alert(categorySearchError.message)
      return
    }

    let debtCategory = existingCategory

    if (!debtCategory) {
      const { data: createdCategory, error: createCategoryError } = await supabase
        .from("categories")
        .insert({
          user_id: userId,
          name: "Deudas",
        })
        .select()
        .single()

      if (createCategoryError) {
        alert(createCategoryError.message)
        return
      }

      debtCategory = createdCategory
    }

    const { data: existingSubcategory, error: subcategorySearchError } =
      await supabase
        .from("subcategories")
        .select("*")
        .eq("user_id", userId)
        .eq("category_id", debtCategory.id)
        .ilike("name", cleanDebtName)
        .maybeSingle()

    if (subcategorySearchError) {
      alert(subcategorySearchError.message)
      return
    }

    if (!existingSubcategory) {
      const { error: createSubcategoryError } = await supabase
        .from("subcategories")
        .insert({
          user_id: userId,
          category_id: debtCategory.id,
          name: cleanDebtName,
        })

      if (createSubcategoryError) {
        alert(createSubcategoryError.message)
      }
    }
  }

  async function addAsset() {
    if (!assetName || !assetAmount) return

    const user = await getUser()
    if (!user) return

    const { error } = await supabase.from("assets").insert({
      user_id: user.id,
      name: assetName.trim(),
      amount: Number(assetAmount),
      currency: assetCurrency,
    })

    if (error) {
      alert(error.message)
      return
    }

    setAssetName("")
    setAssetAmount("")
    setAssetCurrency("₡")
    fetchAssets()
  }

  async function addInvestment() {
    if (!investmentName || !investmentAmount) return

    const user = await getUser()
    if (!user) return

    const amountInvested = Number(investmentAmount)
    const currentValue = investmentCurrentValue
      ? Number(investmentCurrentValue)
      : amountInvested

    const { error } = await supabase.from("investments").insert({
      user_id: user.id,
      name: investmentName.trim(),
      investment_type: investmentType,
      amount_invested: amountInvested,
      current_value: currentValue,
      currency: investmentCurrency,
      notes: investmentNotes || null,
    })

    if (error) {
      alert(error.message)
      return
    }

    setInvestmentName("")
    setInvestmentType("ETF")
    setInvestmentAmount("")
    setInvestmentCurrentValue("")
    setInvestmentCurrency("₡")
    setInvestmentNotes("")
    fetchInvestments()
  }

  async function addLiability() {
    if (!liabilityName || !liabilityAmount) return

    const user = await getUser()
    if (!user) return

    const cleanLiabilityName = liabilityName.trim()

    const { error } = await supabase.from("liabilities").insert({
      user_id: user.id,
      name: cleanLiabilityName,
      amount: Number(liabilityAmount),
      currency: liabilityCurrency,
    })

    if (error) {
      alert(error.message)
      return
    }

    await ensureDebtCategoryAndSubcategory(user.id, cleanLiabilityName)

    setLiabilityName("")
    setLiabilityAmount("")
    setLiabilityCurrency("₡")
    fetchLiabilities()

    alert("Pasivo creado y subpartida de deuda generada correctamente.")
  }

  async function deleteAsset(id: string) {
    const confirmDelete = confirm("¿Seguro que quieres eliminar este activo?")
    if (!confirmDelete) return

    const { error } = await supabase.from("assets").delete().eq("id", id)

    if (error) {
      alert(error.message)
      return
    }

    fetchAssets()
  }

  async function deleteInvestment(id: string) {
    const confirmDelete = confirm("¿Seguro que quieres eliminar esta inversión?")
    if (!confirmDelete) return

    const { error } = await supabase.from("investments").delete().eq("id", id)

    if (error) {
      alert(error.message)
      return
    }

    fetchInvestments()
  }

  async function deleteLiability(id: string) {
    const confirmDelete = confirm("¿Seguro que quieres eliminar este pasivo?")
    if (!confirmDelete) return

    const { error } = await supabase.from("liabilities").delete().eq("id", id)

    if (error) {
      alert(error.message)
      return
    }

    fetchLiabilities()
  }

  const usedCurrencies = [
    ...new Set([
      ...assets.map((asset) => asset.currency),
      ...investments.map((investment) => investment.currency || "₡"),
      ...liabilities.map((liability) => liability.currency),
      ...movements.map((movement) => movement.currency),
      "₡",
    ]),
  ]

  function getTotalsByCurrency(currency: string) {
    const totalAssets = assets
      .filter((asset) => asset.currency === currency)
      .reduce((acc, asset) => acc + Number(asset.amount), 0)

    const totalInvestments = investments
      .filter((investment) => (investment.currency || "₡") === currency)
      .reduce((acc, investment) => acc + Number(investment.current_value), 0)

    const totalLiabilities = liabilities
      .filter((liability) => liability.currency === currency)
      .reduce((acc, liability) => acc + Number(liability.amount), 0)

    const totalIncome = movements
      .filter(
        (movement) => movement.currency === currency && movement.type === "ingreso"
      )
      .reduce((acc, movement) => acc + Number(movement.amount), 0)

    const totalExpenses = movements
      .filter(
        (movement) => movement.currency === currency && movement.type === "gasto"
      )
      .reduce((acc, movement) => acc + Number(movement.amount), 0)

    const totalInvestmentMovements = movements
      .filter(
        (movement) =>
          movement.currency === currency && movement.type === "inversion"
      )
      .reduce((acc, movement) => acc + Number(movement.amount), 0)

    const totalDebtPayments = movements
      .filter(
        (movement) =>
          movement.currency === currency && movement.type === "abono_deuda"
      )
      .reduce((acc, movement) => acc + Number(movement.amount), 0)

    const availableCapital =
      totalIncome - totalExpenses - totalInvestmentMovements - totalDebtPayments

    return {
      assets: totalAssets,
      investments: totalInvestments,
      liabilities: totalLiabilities,
      income: totalIncome,
      expenses: totalExpenses,
      investmentMovements: totalInvestmentMovements,
      debtPayments: totalDebtPayments,
      availableCapital,
      netWorth:
        availableCapital + totalAssets + totalInvestments - totalLiabilities,
    }
  }

  const investmentGainLoss = investments.reduce((acc, investment) => {
    return (
      acc +
      (Number(investment.current_value) - Number(investment.amount_invested))
    )
  }, 0)

  const investmentTypes = [
    "ETF",
    "Acciones",
    "Fondos",
    "Bonos",
    "Bien Raíz",
    "Negocio",
    "Otro",
  ]

  const inputClass =
    "w-full rounded-xl border border-white/10 bg-input px-4 py-3 text-white outline-none focus:border-primary/60"
      return (
    <div className="min-h-screen bg-background text-white lg:flex">
      <Sidebar />

      <div className="w-full flex-1 overflow-x-hidden">
        <header className="border-b border-white/10 px-4 py-5 lg:px-8">
          <h1 className="text-2xl font-bold">
            Mi <span className="text-primary">Patrimonio Inteligente</span>
          </h1>

          <p className="text-sm text-textSecondary">
            Activos, inversiones, pasivos y capital disponible.
          </p>
        </header>

        <main className="p-4 lg:p-8">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {usedCurrencies.map((currency) => {
              const totals = getTotalsByCurrency(currency)

              return (
                <div
                  key={currency}
                  className="rounded-3xl border border-primary/20 bg-card p-5"
                >
                  <p className="text-sm text-textSecondary">Patrimonio neto</p>

                  <h2
                    className={`mt-3 break-words text-3xl font-bold ${
                      totals.netWorth >= 0 ? "text-primary" : "text-red-400"
                    }`}
                  >
                    {currency}
                    {totals.netWorth}
                  </h2>

                  <div className="mt-4 space-y-2 text-sm">
                    <p className="text-secondary">
                      Capital disponible: {currency}
                      {totals.availableCapital}
                    </p>

                    <p className="text-secondary">
                      Activos: {currency}
                      {totals.assets}
                    </p>

                    <p className="text-primary">
                      Inversiones: {currency}
                      {totals.investments}
                    </p>

                    <p className="text-red-400">
                      Pasivos: {currency}
                      {totals.liabilities}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-8 rounded-3xl border border-primary/20 bg-card p-6">
            <h2 className="text-xl font-bold">Resumen de inversiones</h2>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl bg-input p-4">
                <p className="text-sm text-textSecondary">
                  Inversiones registradas
                </p>

                <h3 className="mt-2 text-3xl font-bold text-primary">
                  {investments.length}
                </h3>
              </div>

              <div className="rounded-2xl bg-input p-4">
                <p className="text-sm text-textSecondary">
                  Valor actual total
                </p>

                <h3 className="mt-2 text-3xl font-bold text-secondary">
                  {investments.reduce(
                    (acc, inv) => acc + Number(inv.current_value),
                    0
                  )}
                </h3>
              </div>

              <div className="rounded-2xl bg-input p-4">
                <p className="text-sm text-textSecondary">
                  Ganancia / pérdida
                </p>

                <h3
                  className={`mt-2 text-3xl font-bold ${
                    investmentGainLoss >= 0
                      ? "text-secondary"
                      : "text-red-400"
                  }`}
                >
                  {investmentGainLoss}
                </h3>
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-3xl border border-primary/20 bg-card p-5 lg:p-6">
            <h2 className="text-xl font-bold">Automatización de deudas</h2>

            <p className="mt-3 text-sm text-textSecondary">
              Cada vez que agregues un pasivo, Smart Capital creará automáticamente
              la partida <span className="font-bold text-primary">Deudas</span> y
              una subpartida con el nombre de esa deuda para usarla en tus movimientos.
            </p>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            <div className="rounded-3xl border border-secondary/20 bg-card p-6">
              <h2 className="text-xl font-bold text-secondary">Activos</h2>

              <div className="mt-5 space-y-4">
                <input
                  value={assetName}
                  onChange={(e) => setAssetName(e.target.value)}
                  placeholder="Nombre"
                  className={inputClass}
                />

                <input
                  value={assetAmount}
                  onChange={(e) => setAssetAmount(e.target.value)}
                  type="number"
                  placeholder="Monto"
                  className={inputClass}
                />

                <select
                  value={assetCurrency}
                  onChange={(e) => setAssetCurrency(e.target.value)}
                  className={inputClass}
                >
                  <option value="₡">Colones ₡</option>
                  <option value="$">Dólares $</option>
                  <option value="€">Euros €</option>
                </select>

                <button
                  onClick={addAsset}
                  className="w-full rounded-full bg-secondary py-3 font-bold text-background"
                >
                  Agregar activo
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-primary/20 bg-card p-6">
              <h2 className="text-xl font-bold text-primary">Inversiones</h2>

              <div className="mt-5 space-y-4">
                <input
                  value={investmentName}
                  onChange={(e) => setInvestmentName(e.target.value)}
                  placeholder="Nombre inversión"
                  className={inputClass}
                />

                <select
                  value={investmentType}
                  onChange={(e) => setInvestmentType(e.target.value)}
                  className={inputClass}
                >
                  {investmentTypes.map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                </select>

                <input
                  value={investmentAmount}
                  onChange={(e) => setInvestmentAmount(e.target.value)}
                  placeholder="Monto invertido"
                  type="number"
                  className={inputClass}
                />

                <input
                  value={investmentCurrentValue}
                  onChange={(e) =>
                    setInvestmentCurrentValue(e.target.value)
                  }
                  placeholder="Valor actual"
                  type="number"
                  className={inputClass}
                />

                <select
                  value={investmentCurrency}
                  onChange={(e) =>
                    setInvestmentCurrency(e.target.value)
                  }
                  className={inputClass}
                >
                  <option value="₡">Colones ₡</option>
                  <option value="$">Dólares $</option>
                  <option value="€">Euros €</option>
                </select>

                <textarea
                  value={investmentNotes}
                  onChange={(e) => setInvestmentNotes(e.target.value)}
                  placeholder="Notas"
                  className={inputClass}
                />

                <button
                  onClick={addInvestment}
                  className="w-full rounded-full bg-primary py-3 font-bold"
                >
                  Agregar inversión
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-red-500/20 bg-card p-6">
              <h2 className="text-xl font-bold text-red-400">Pasivos</h2>

              <div className="mt-5 space-y-4">
                <input
                  value={liabilityName}
                  onChange={(e) => setLiabilityName(e.target.value)}
                  placeholder="Nombre deuda"
                  className={inputClass}
                />

                <input
                  value={liabilityAmount}
                  onChange={(e) => setLiabilityAmount(e.target.value)}
                  placeholder="Monto"
                  type="number"
                  className={inputClass}
                />

                <select
                  value={liabilityCurrency}
                  onChange={(e) => setLiabilityCurrency(e.target.value)}
                  className={inputClass}
                >
                  <option value="₡">Colones ₡</option>
                  <option value="$">Dólares $</option>
                  <option value="€">Euros €</option>
                </select>

                <button
                  onClick={addLiability}
                  className="w-full rounded-full bg-red-400 py-3 font-bold text-background"
                >
                  Agregar pasivo
                </button>
              </div>
            </div>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-secondary">
                Activos registrados
              </h3>

              {assets.length === 0 ? (
                <p className="text-sm text-textSecondary">
                  No hay activos registrados.
                </p>
              ) : (
                assets.map((asset) => (
                  <div
                    key={asset.id}
                    className="rounded-2xl border border-white/10 bg-card p-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-bold">{asset.name}</p>
                        <p className="text-secondary">
                          {asset.currency}
                          {asset.amount}
                        </p>
                      </div>

                      <button
                        onClick={() => deleteAsset(asset.id)}
                        className="text-red-400"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold text-primary">
                Inversiones registradas
              </h3>

              {investments.length === 0 ? (
                <p className="text-sm text-textSecondary">
                  No hay inversiones registradas.
                </p>
              ) : (
                investments.map((investment) => (
                  <div
                    key={investment.id}
                    className="rounded-2xl border border-white/10 bg-card p-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-bold">{investment.name}</p>

                        <p className="text-primary">
                          {investment.currency || "₡"}
                          {investment.current_value}
                        </p>

                        <p className="text-xs text-textSecondary">
                          {investment.investment_type}
                        </p>
                      </div>

                      <button
                        onClick={() => deleteInvestment(investment.id)}
                        className="text-red-400"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold text-red-400">
                Pasivos registrados
              </h3>

              {liabilities.length === 0 ? (
                <p className="text-sm text-textSecondary">
                  No hay pasivos registrados.
                </p>
              ) : (
                liabilities.map((liability) => (
                  <div
                    key={liability.id}
                    className="rounded-2xl border border-white/10 bg-card p-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-bold">{liability.name}</p>

                        <p className="text-red-400">
                          {liability.currency}
                          {liability.amount}
                        </p>

                        <p className="mt-1 text-xs text-textSecondary">
                          Subpartida automática en Deudas
                        </p>
                      </div>

                      <button
                        onClick={() => deleteLiability(liability.id)}
                        className="text-red-400"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default Wealth