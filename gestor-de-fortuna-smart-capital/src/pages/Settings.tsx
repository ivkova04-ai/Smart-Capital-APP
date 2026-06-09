 import { useEffect, useState } from "react"
import Sidebar from "../components/Sidebar"
import { supabase } from "../lib/supabase"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

function Settings() {
  const [name, setName] = useState("")
  const [country, setCountry] = useState("Costa Rica")
  const [age, setAge] = useState("")
  const [profession, setProfession] = useState("")

  useEffect(() => {
    fetchProfile()
  }, [])

  async function fetchProfile() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    if (error) return

    if (data) {
      setName(data.name || "")
      setCountry(data.country || "Costa Rica")
      setAge(data.age ? String(data.age) : "")
      setProfession(data.profession || "")
    }
  }

  async function saveSettings() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      name,
      country,
      age: age ? Number(age) : null,
      profession: profession || null,
    })

    if (error) {
      alert(error.message)
      return
    }

    alert("Configuración guardada correctamente.")
  }

  async function downloadAccountPDF() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const { data: movements } = await supabase
      .from("movements")
      .select("*, categories(name), subcategories(name)")
      .eq("user_id", user.id)
      .order("movement_date", { ascending: false })

    const { data: assets } = await supabase
      .from("assets")
      .select("*")
      .eq("user_id", user.id)

    const { data: liabilities } = await supabase
      .from("liabilities")
      .select("*")
      .eq("user_id", user.id)

    const { data: goals } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", user.id)

    const safeMovements = movements || []
    const safeAssets = assets || []
    const safeLiabilities = liabilities || []
    const safeGoals = goals || []

    const totalIngresos = safeMovements
      .filter((item) => item.type === "ingreso")
      .reduce((acc, item) => acc + Number(item.amount), 0)

    const totalGastos = safeMovements
      .filter((item) => item.type === "gasto")
      .reduce((acc, item) => acc + Number(item.amount), 0)

    const balance = totalIngresos - totalGastos

    const totalActivos = safeAssets.reduce(
      (acc, item) => acc + Number(item.amount),
      0
    )

    const totalPasivos = safeLiabilities.reduce(
      (acc, item) => acc + Number(item.amount),
      0
    )

    const fortunaReal = totalActivos - totalPasivos

    const gastosPorCategoria = safeMovements
      .filter((item) => item.type === "gasto")
      .reduce((acc: any, item) => {
        const category = item.categories?.name || "Sin categoría"
        acc[category] = (acc[category] || 0) + Number(item.amount)
        return acc
      }, {})

    const doc = new jsPDF()

    doc.setFillColor(18, 18, 18)
    doc.rect(0, 0, 210, 297, "F")

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(22)
    doc.text("Smart Capital", 14, 20)

    doc.setTextColor(105, 103, 251)
    doc.setFontSize(14)
    doc.text("Resumen de estado de cuenta", 14, 30)

    doc.setTextColor(180, 190, 195)
    doc.setFontSize(10)
    doc.text(`Generado: ${new Date().toLocaleDateString()}`, 14, 38)

    autoTable(doc, {
      startY: 48,
      head: [["Perfil", "Información"]],
      body: [
        ["Nombre", name || "No indicado"],
        ["País", country || "No indicado"],
        ["Edad", age || "No indicada"],
        ["Profesión", profession || "No indicada"],
      ],
      theme: "grid",
      headStyles: { fillColor: [105, 103, 251], textColor: 255 },
      bodyStyles: { fillColor: [26, 26, 26], textColor: 255 },
      styles: { lineColor: [45, 45, 45] },
    })

    autoTable(doc, {
      startY: 90,
      head: [["Resumen financiero", "Monto"]],
      body: [
        ["Ingresos", `${totalIngresos}`],
        ["Gastos", `${totalGastos}`],
        ["Balance", `${balance}`],
        ["Activos", `${totalActivos}`],
        ["Pasivos", `${totalPasivos}`],
        ["Fortuna real", `${fortunaReal}`],
        ["Metas activas", `${safeGoals.length}`],
      ],
      theme: "grid",
      headStyles: { fillColor: [105, 103, 251], textColor: 255 },
      bodyStyles: { fillColor: [26, 26, 26], textColor: 255 },
      styles: { lineColor: [45, 45, 45] },
    })

    autoTable(doc, {
      startY: 150,
      head: [["Gastos por partida", "Total"]],
      body: Object.entries(gastosPorCategoria).map(([category, amount]: any) => [
        category,
        `${amount}`,
      ]),
      theme: "grid",
      headStyles: { fillColor: [105, 103, 251], textColor: 255 },
      bodyStyles: { fillColor: [26, 26, 26], textColor: 255 },
      styles: { lineColor: [45, 45, 45] },
    })

    doc.addPage()
    doc.setFillColor(18, 18, 18)
    doc.rect(0, 0, 210, 297, "F")

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(18)
    doc.text("Movimientos registrados", 14, 20)

    autoTable(doc, {
      startY: 30,
      head: [["Fecha", "Tipo", "Partida", "Subpartida", "Monto"]],
      body: safeMovements.map((item) => [
        item.movement_date,
        item.type,
        item.categories?.name || "-",
        item.subcategories?.name || "-",
        `${item.currency}${item.amount}`,
      ]),
      theme: "grid",
      headStyles: { fillColor: [105, 103, 251], textColor: 255 },
      bodyStyles: { fillColor: [26, 26, 26], textColor: 255 },
      styles: { lineColor: [45, 45, 45], fontSize: 8 },
    })

    doc.save("smart-capital-resumen.pdf")
  }

  function contactUs() {
    alert("Próximamente podrás contactar a Smart Capital por este medio.")
  }

  const inputClass =
    "mt-4 w-full rounded-xl border border-white/10 bg-input px-4 py-3 text-white outline-none focus:border-primary/60"
      return (
    <div className="min-h-screen bg-background text-white lg:flex">
      <Sidebar />

      <div className="w-full flex-1 overflow-x-hidden">
        <header className="border-b border-white/10 px-4 py-5 lg:px-8">
          <h1 className="text-2xl font-bold">
            Configuración <span className="text-primary">Personal</span>
          </h1>

          <p className="text-sm text-textSecondary">
            Administra tu perfil, preferencias y reportes.
          </p>
        </header>

        <main className="p-4 lg:p-8">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-primary/20 bg-card p-5 lg:p-6">
              <h2 className="text-xl font-bold">Perfil</h2>

              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre"
                className={inputClass}
              />

              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className={inputClass}
              >
                <option value="Costa Rica">Costa Rica</option>
                <option value="México">México</option>
                <option value="Colombia">Colombia</option>
                <option value="Argentina">Argentina</option>
                <option value="Chile">Chile</option>
                <option value="España">España</option>
                <option value="Estados Unidos">Estados Unidos</option>
                <option value="Otro">Otro</option>
              </select>

              <input
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="Edad opcional"
                type="number"
                className={inputClass}
              />

              <input
                value={profession}
                onChange={(e) => setProfession(e.target.value)}
                placeholder="Profesión opcional"
                className={inputClass}
              />

              <button
                onClick={saveSettings}
                className="mt-6 w-full rounded-full bg-primary px-6 py-3 font-bold text-white sm:w-auto"
              >
                Guardar configuración
              </button>
            </div>

            <div className="rounded-3xl border border-primary/20 bg-card p-5 lg:p-6">
              <h2 className="text-xl font-bold">Resumen PDF</h2>

              <p className="mt-3 text-sm text-textSecondary">
                Descarga un reporte con tu perfil, resumen financiero,
                patrimonio, metas, gastos por partida y movimientos registrados.
              </p>

              <button
                onClick={downloadAccountPDF}
                className="mt-6 w-full rounded-full bg-white px-6 py-3 font-extrabold text-primary shadow-[0_0_30px_rgba(105,103,251,0.35)] transition hover:scale-[1.02] sm:w-auto"
              >
                Descargar resumen PDF
              </button>
            </div>

            <div className="rounded-3xl border border-white/10 bg-card p-5 lg:p-6">
              <h2 className="text-xl font-bold">Estado de Smart Capital</h2>

              <div className="mt-6 space-y-4 text-sm text-textSecondary">
                <p>✅ Movimientos conectados</p>
                <p>✅ Inversiones cripto conectadas</p>
                <p>✅ Presupuesto inteligente activo</p>
                <p>✅ Patrimonio conectado</p>
                <p>✅ Metas financieras activas</p>
                <p>✅ Analytics visual funcionando</p>
                <p>✅ Reportes PDF disponibles</p>
              </div>
            </div>

            <div className="rounded-3xl border border-primary/20 bg-card p-5 lg:p-6">
              <h2 className="text-xl font-bold">Soporte</h2>

              <p className="mt-3 text-sm text-textSecondary">
                ¿Necesitas asesoría especializada?
              </p>

              <button
                onClick={contactUs}
                className="mt-6 w-full rounded-full border border-primary/40 px-6 py-3 font-bold text-primary transition hover:bg-primary hover:text-white sm:w-auto"
              >
                Contáctanos
              </button>
            </div>

            <div className="rounded-3xl border border-red-500/20 bg-card p-5 lg:col-span-2 lg:p-6">
              <h2 className="text-xl font-bold text-red-400">Seguridad</h2>

              <p className="mt-3 text-sm text-textSecondary">
                La autenticación está protegida mediante Supabase Auth.
              </p>

              <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
                <button className="w-full rounded-full border border-white/10 px-6 py-3 font-bold text-white sm:w-auto">
                  Cambiar contraseña
                </button>

                <button className="w-full rounded-full border border-red-400/40 px-6 py-3 font-bold text-red-400 sm:w-auto">
                  Eliminar cuenta
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default Settings