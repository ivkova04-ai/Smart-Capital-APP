 import { useEffect, useState } from "react"
import Sidebar from "../components/Sidebar"
import { supabase } from "../lib/supabase"

function Wealth() {
  const [assetName, setAssetName] = useState("")
  const [assetAmount, setAssetAmount] = useState("")
  const [assetCurrency, setAssetCurrency] = useState("₡")

  const [liabilityName, setLiabilityName] = useState("")
  const [liabilityAmount, setLiabilityAmount] = useState("")
  const [liabilityCurrency, setLiabilityCurrency] = useState("₡")

  const [assets, setAssets] = useState<any[]>([])
  const [liabilities, setLiabilities] = useState<any[]>([])

  useEffect(() => {
    fetchAssets()
    fetchLiabilities()
  }, [])

  async function fetchAssets() {
    const { data: { user } } = await supabase.auth.getUser()
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

  async function fetchLiabilities() {
    const { data: { user } } = await supabase.auth.getUser()
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

  async function addAsset() {
    if (!assetName || !assetAmount) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from("assets").insert({
      user_id: user.id,
      name: assetName,
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

  async function addLiability() {
    if (!liabilityName || !liabilityAmount) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from("liabilities").insert({
      user_id: user.id,
      name: liabilityName,
      amount: Number(liabilityAmount),
      currency: liabilityCurrency,
    })

    if (error) {
      alert(error.message)
      return
    }

    setLiabilityName("")
    setLiabilityAmount("")
    setLiabilityCurrency("₡")
    fetchLiabilities()
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
      ...liabilities.map((liability) => liability.currency),
    ]),
  ]

  function getTotalsByCurrency(currency: string) {
    const totalAssets = assets
      .filter((asset) => asset.currency === currency)
      .reduce((acc, asset) => acc + Number(asset.amount), 0)

    const totalLiabilities = liabilities
      .filter((liability) => liability.currency === currency)
      .reduce((acc, liability) => acc + Number(liability.amount), 0)

    return {
      assets: totalAssets,
      liabilities: totalLiabilities,
      netWorth: totalAssets - totalLiabilities,
    }
  }

  return (
    <div className="flex min-h-screen bg-[#121212] text-white">
      <Sidebar />

      <div className="flex-1">
        <header className="border-b border-white/10 px-8 py-5">
          <h1 className="text-2xl font-bold">
            Mi <span className="text-[#E0B04B]">Patrimonio</span>
          </h1>

          <p className="text-sm text-gray-400">
            Gestiona tus activos y pasivos reales.
          </p>
        </header>

        <main className="p-8">
          {usedCurrencies.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-[#1a1a1a] p-8 text-center">
              <p className="text-gray-400">
                Aún no tienes activos ni pasivos registrados.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-3">
              {usedCurrencies.map((currency) => {
                const totals = getTotalsByCurrency(currency)

                return (
                  <div
                    key={currency}
                    className="rounded-3xl border border-white/10 bg-[#1a1a1a] p-6"
                  >
                    <p className="text-sm text-gray-400">
                      Fortuna real en {currency}
                    </p>

                    <h2 className="mt-3 text-4xl font-bold text-[#E0B04B]">
                      {currency}
                      {totals.netWorth}
                    </h2>

                    <div className="mt-5 space-y-2 text-sm">
                      <p className="text-green-400">
                        Activos: {currency}
                        {totals.assets}
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
          )}

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl border border-green-500/20 bg-[#1a1a1a] p-6">
              <h2 className="text-2xl font-bold text-green-400">Activos</h2>

              <div className="mt-6 space-y-4">
                <input
                  value={assetName}
                  onChange={(e) => setAssetName(e.target.value)}
                  placeholder="Ej: Cuenta bancaria"
                  className="w-full rounded-xl border border-white/10 bg-[#111111] px-4 py-3 outline-none"
                />

                <input
                  value={assetAmount}
                  onChange={(e) => setAssetAmount(e.target.value)}
                  placeholder="Monto"
                  type="number"
                  className="w-full rounded-xl border border-white/10 bg-[#111111] px-4 py-3 outline-none"
                />

                <select
                  value={assetCurrency}
                  onChange={(e) => setAssetCurrency(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#111111] px-4 py-3 outline-none"
                >
                  <option value="₡">Colones ₡</option>
                  <option value="$">Dólares $</option>
                  <option value="€">Euros €</option>
                  <option value="₿">Bitcoin ₿</option>
                </select>

                <button
                  onClick={addAsset}
                  className="w-full rounded-full bg-green-400 px-5 py-3 font-bold text-black"
                >
                  Agregar activo
                </button>
              </div>

              <div className="mt-8 space-y-4">
                {assets.length === 0 ? (
                  <p className="text-gray-500">No tienes activos registrados.</p>
                ) : (
                  assets.map((asset) => (
                    <div
                      key={asset.id}
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#111111] p-4"
                    >
                      <div>
                        <p className="font-bold">{asset.name}</p>
                        <p className="text-sm text-gray-500">Activo</p>
                      </div>

                      <div className="flex items-center gap-4">
                        <p className="text-lg font-bold text-green-400">
                          {asset.currency}
                          {asset.amount}
                        </p>

                        <button
                          onClick={() => deleteAsset(asset.id)}
                          className="text-red-400"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-red-500/20 bg-[#1a1a1a] p-6">
              <h2 className="text-2xl font-bold text-red-400">Pasivos</h2>

              <div className="mt-6 space-y-4">
                <input
                  value={liabilityName}
                  onChange={(e) => setLiabilityName(e.target.value)}
                  placeholder="Ej: Tarjeta de crédito"
                  className="w-full rounded-xl border border-white/10 bg-[#111111] px-4 py-3 outline-none"
                />

                <input
                  value={liabilityAmount}
                  onChange={(e) => setLiabilityAmount(e.target.value)}
                  placeholder="Monto"
                  type="number"
                  className="w-full rounded-xl border border-white/10 bg-[#111111] px-4 py-3 outline-none"
                />

                <select
                  value={liabilityCurrency}
                  onChange={(e) => setLiabilityCurrency(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#111111] px-4 py-3 outline-none"
                >
                  <option value="₡">Colones ₡</option>
                  <option value="$">Dólares $</option>
                  <option value="€">Euros €</option>
                  <option value="₿">Bitcoin ₿</option>
                </select>

                <button
                  onClick={addLiability}
                  className="w-full rounded-full bg-red-400 px-5 py-3 font-bold text-black"
                >
                  Agregar pasivo
                </button>
              </div>

              <div className="mt-8 space-y-4">
                {liabilities.length === 0 ? (
                  <p className="text-gray-500">No tienes pasivos registrados.</p>
                ) : (
                  liabilities.map((liability) => (
                    <div
                      key={liability.id}
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#111111] p-4"
                    >
                      <div>
                        <p className="font-bold">{liability.name}</p>
                        <p className="text-sm text-gray-500">Pasivo</p>
                      </div>

                      <div className="flex items-center gap-4">
                        <p className="text-lg font-bold text-red-400">
                          {liability.currency}
                          {liability.amount}
                        </p>

                        <button
                          onClick={() => deleteLiability(liability.id)}
                          className="text-red-400"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default Wealth