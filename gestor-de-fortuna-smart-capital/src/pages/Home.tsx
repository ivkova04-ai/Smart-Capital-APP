 import { Link } from "react-router-dom"

function Home() {
  return (
    <div className="min-h-screen bg-background text-white">
      <header className="flex items-center justify-between px-6 py-6 lg:px-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Smart <span className="text-primary">Capital</span>
          </h1>

          <p className="text-sm text-primary">
            Gestor de Fortuna
          </p>
        </div>

        <Link
          to="/login"
          className="rounded-full border border-primary/40 px-5 py-2 text-sm font-medium text-primary transition hover:bg-primary hover:text-white"
        >
          Iniciar sesión
        </Link>
      </header>

      <main className="flex min-h-[80vh] items-center justify-center px-6 lg:px-8">
        <section className="max-w-5xl text-center">
          <p className="mb-5 text-sm uppercase tracking-[0.35em] text-primary">
            Finanzas personales inteligentes
          </p>

          <h2 className="text-4xl font-bold leading-tight md:text-6xl lg:text-7xl">
            Organiza tu dinero y construye
            <span className="block text-primary">
              libertad financiera
            </span>
          </h2>

          <p className="mx-auto mt-8 max-w-3xl text-lg leading-relaxed text-textSecondary md:text-xl">
            Registra ingresos, gastos, patrimonio, presupuestos y metas
            financieras desde una única plataforma diseñada para tomar mejores
            decisiones con tu dinero.
          </p>

          <div className="mt-12 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              to="/login"
              className="rounded-full bg-primary px-8 py-3 font-bold text-white transition hover:opacity-90"
            >
              Comenzar gratis
            </Link>

            <button className="rounded-full border border-white/20 px-8 py-3 font-bold text-white transition hover:bg-white/5">
              Ver demo
            </button>
          </div>

          <div className="mt-20 grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-card p-6">
              <h3 className="text-lg font-bold text-primary">
                Control total
              </h3>

              <p className="mt-3 text-sm text-textSecondary">
                Registra cada ingreso y gasto para conocer exactamente a dónde
                va tu dinero.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-card p-6">
              <h3 className="text-lg font-bold text-secondary">
                Metas financieras
              </h3>

              <p className="mt-3 text-sm text-textSecondary">
                Define objetivos, registra aportes y mide tu progreso en tiempo
                real.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-card p-6">
              <h3 className="text-lg font-bold text-primary">
                Analytics inteligente
              </h3>

              <p className="mt-3 text-sm text-textSecondary">
                Obtén información accionable sobre ahorro, patrimonio y hábitos
                financieros.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default Home