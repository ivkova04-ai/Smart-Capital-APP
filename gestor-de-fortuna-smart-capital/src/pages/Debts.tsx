 import { useEffect, useState } from "react"
import Sidebar from "../components/Sidebar"
import { supabase } from "../lib/supabase"

function Debts() {
  const [liabilities, setLiabilities] = useState<any[]>([])
  const [debtPayments, setDebtPayments] = useState<any[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  async function getUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    return user
  }

  async function fetchData() {
    const user = await getUser()
    if (!user) return

    const { data: liabilitiesData, error: liabilitiesError } = await supabase
      .from("liabilities")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (liabilitiesError) {
      alert(liabilitiesError.message)
      return
    }

    const { data: paymentsData, error: paymentsError } = await supabase
      .from("movements")
      .select("*, liabilities(name)")
      .eq("user_id", user.id)
      .eq("type", "abono_deuda")
      .order("movement_date", { ascending: false })

    if (paymentsError) {
      alert(paymentsError.message)
      return
    }

    setLiabilities(liabilitiesData || [])
    setDebtPayments(paymentsData || [])
  }

  function getPaymentsForDebt(liabilityId: string) {
    return debtPayments.filter((payment) => payment.liability_id === liabilityId)
  }

  function getPaidAmount(liabilityId: string) {
    return getPaymentsForDebt(liabilityId).reduce(
      (acc, payment) => acc + Number(payment.amount),
      0
    )
  }

  function getOriginalAmount(liability: any) {
    return Number(liability.original_amount || liability.amount || 0)
  }

  function getProgress(liability: any) {
    const originalAmount = getOriginalAmount(liability)
    if (originalAmount <= 0) return 0

    const paid = getPaidAmount(liability.id)
    return Math.min(Math.round((paid / originalAmount) * 100), 100)
  }

  function formatMoney(currency: string, amount: number) {
    return `${currency || "₡"}${Number(amount || 0).toLocaleString("es-CR")}`
  }

  const totalOriginalByCurrency = liabilities.reduce((acc: any, item) => {
    const currency = item.currency || "₡"
    acc[currency] = (acc[currency] || 0) + getOriginalAmount(item)
    return acc
  }, {})

  const totalCurrentByCurrency = liabilities.reduce((acc: any, item) => {
    const currency = item.currency || "₡"
    acc[currency] = (acc[currency] || 0) + Number(item.amount || 0)
    return acc
  }, {})

  const totalPaidByCurrency = liabilities.reduce((acc: any, item) => {
    const currency = item.currency || "₡"
    acc[currency] = (acc[currency] || 0) + getPaidAmount(item.id)
    return acc
  }, {})

  const currencies = [
    ...new Set([
      ...Object.keys(totalOriginalByCurrency),
      ...Object.keys(totalCurrentByCurrency),
      ...Object.keys(totalPaidByCurrency),
    ]),
  ]

  const cardClass = "rounded-3xl border border-white/10 bg-card p-5 lg:p-6"

  return (
    <div className="min-h-screen bg-background text-white lg:flex">
      <Sidebar />

      <div className="w-full flex-1 overflow-x-hidden">
        <header className="border-b border-white/10 px-4 py-5 lg:px-8">
          <h1 className="text-2xl font-bold">
            Centro de <span className="text-primary">Deudas</span>
          </h1>

          <p className="mt-1 text-sm text-textSecondary">
            Visualiza tus pasivos, pagos realizados y avance de reducción.
          </p>
        </header>

        <main className="p-4 lg:p-8">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {currencies.length === 0 ? (
              <div className="rounded-3xl border border-white/10 bg-card p-8 text-center sm:col-span-2 xl:col-span-3">
                <p className="text-textSecondary">
                  Aún no tienes deudas registradas.
                </p>
              </div>
            ) : (
              currencies.map((currency) => {
                const original = totalOriginalByCurrency[currency] || 0
                const current = totalCurrentByCurrency[currency] || 0
                const paid = totalPaidByCurrency[currency] || 0

                return (
                  <div key={currency} className={cardClass}>
                    <p className="text-sm text-textSecondary">
                      Resumen en {currency}
                    </p>

                    <h2 className="mt-3 break-words text-3xl font-bold text-red-400 lg:text-4xl">
                      {formatMoney(currency, current)}
                    </h2>

                    <div className="mt-5 space-y-2 text-sm">
                      <p className="break-words text-textSecondary">
                        Deuda original: {formatMoney(currency, original)}
                      </p>

                      <p className="break-words text-secondary">
                        Pagado: {formatMoney(currency, paid)}
                      </p>

                      <p className="break-words text-red-400">
                        Pendiente: {formatMoney(currency, current)}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          <div className="mt-8 rounded-3xl border border-red-500/20 bg-card p-4 lg:p-6">
            <h2 className="text-xl font-bold text-red-400">
              Deudas registradas
            </h2>

            <div className="mt-6 space-y-5">
              {liabilities.length === 0 ? (
                <p className="text-textSecondary">
                  No tienes pasivos registrados todavía.
                </p>
              ) : (
                liabilities.map((liability) => {
                  const originalAmount = getOriginalAmount(liability)
                  const currentAmount = Number(liability.amount || 0)
                  const paidAmount = getPaidAmount(liability.id)
                  const progress = getProgress(liability)
                  const payments = getPaymentsForDebt(liability.id)

                  return (
                    <div
                      key={liability.id}
                      className="rounded-2xl border border-white/10 bg-input p-4 lg:p-5"
                    >
                      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0 flex-1">
                          <h3 className="break-words text-lg font-bold text-white">
                            {liability.name}
                          </h3>

                          <div className="mt-3 grid gap-3 sm:grid-cols-3">
                            <div className="rounded-2xl bg-card p-4">
                              <p className="text-xs text-textSecondary">
                                Original
                              </p>
                              <p className="mt-1 break-words font-bold text-white">
                                {formatMoney(liability.currency, originalAmount)}
                              </p>
                            </div>

                            <div className="rounded-2xl bg-card p-4">
                              <p className="text-xs text-textSecondary">
                                Pagado
                              </p>
                              <p className="mt-1 break-words font-bold text-secondary">
                                {formatMoney(liability.currency, paidAmount)}
                              </p>
                            </div>

                            <div className="rounded-2xl bg-card p-4">
                              <p className="text-xs text-textSecondary">
                                Actual
                              </p>
                              <p className="mt-1 break-words font-bold text-red-400">
                                {formatMoney(liability.currency, currentAmount)}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="w-full lg:w-72">
                          <div className="mb-2 flex justify-between text-sm">
                            <span className="text-textSecondary">Avance</span>
                            <span className="font-bold text-secondary">
                              {progress}%
                            </span>
                          </div>

                          <div className="h-3 rounded-full bg-card">
                            <div
                              className="h-3 rounded-full bg-secondary"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 rounded-2xl border border-white/10 bg-card p-4">
                        <h4 className="font-bold">Historial de abonos</h4>

                        <div className="mt-4 space-y-3">
                          {payments.length === 0 ? (
                            <p className="text-sm text-textSecondary">
                              No hay abonos registrados para esta deuda.
                            </p>
                          ) : (
                            payments.map((payment) => (
                              <div
                                key={payment.id}
                                className="flex flex-col gap-3 rounded-xl bg-input p-3 sm:flex-row sm:items-center sm:justify-between"
                              >
                                <div className="min-w-0">
                                  <p className="break-words font-bold text-secondary">
                                    {formatMoney(
                                      payment.currency,
                                      Number(payment.amount)
                                    )}
                                  </p>

                                  <p className="text-xs text-textSecondary">
                                    {payment.movement_date}
                                  </p>

                                  {payment.description && (
                                    <p className="mt-1 break-words text-sm text-textSecondary">
                                      {payment.description}
                                    </p>
                                  )}
                                </div>

                                <span className="w-fit rounded-full bg-secondary/10 px-3 py-1 text-xs font-bold text-secondary">
                                  Abono deuda
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default Debts