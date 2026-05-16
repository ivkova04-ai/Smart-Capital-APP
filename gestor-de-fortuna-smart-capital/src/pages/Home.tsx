 import { Link } from "react-router-dom"

function Home() {
  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white">
      <header className="flex items-center justify-between px-8 py-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Smart <span className="text-[#E0B04B]">Capital</span>
          </h1>

          <p className="text-sm text-[#E0B04B]">
            Gestor de Fortuna
          </p>
        </div>

        <Link
          to="/login"
          className="rounded-full border border-[#E0B04B]/40 px-5 py-2 text-sm text-[#E0B04B]"
        >
          Iniciar sesión
        </Link>
      </header>

      <main className="flex min-h-[80vh] items-center justify-center px-8">
        <section className="max-w-4xl text-center">
          <p className="mb-5 text-sm uppercase tracking-[0.35em] text-[#E0B04B]">
            Finanzas personales inteligentes
          </p>

          <h2 className="text-5xl font-bold leading-tight md:text-7xl">
            Organiza tu dinero y construye libertad financiera
          </h2>

          <p className="mx-auto mt-8 max-w-3xl text-xl leading-relaxed text-gray-300">
            Registra tus ingresos, gastos, metas, activos y deudas desde una sola plataforma.
          </p>

          <div className="mt-12 flex justify-center gap-4">
            <Link
              to="/login"
              className="rounded-full bg-[#E0B04B] px-7 py-3 font-bold text-black"
            >
              Comenzar gratis
            </Link>

            <button className="rounded-full border border-white/20 px-7 py-3 font-bold text-white">
              Ver demo
            </button>
          </div>
        </section>
      </main>
    </div>
  )
}

export default Home