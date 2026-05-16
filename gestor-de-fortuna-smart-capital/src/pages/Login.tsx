 import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../lib/supabase"

function Login() {
  const navigate = useNavigate()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  async function loginWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    })
  }

  async function loginWithEmail() {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      alert(error.message)
      return
    }

    navigate("/dashboard")
  }

  async function registerWithEmail() {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      alert(error.message)
      return
    }

    alert("Cuenta creada. Ahora puedes iniciar sesión.")
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-3xl border border-[#E0B04B]/20 bg-black/30 p-8">
        <h1 className="text-3xl font-bold">
          Bienvenido a Smart <span className="text-[#E0B04B]">Capital</span>
        </h1>

        <p className="mt-3 text-gray-400">
          Inicia sesión para guardar y proteger tus datos financieros.
        </p>

        <button
          onClick={loginWithGoogle}
          className="mt-8 w-full rounded-full bg-white px-5 py-3 font-bold text-black"
        >
          Continuar con Google
        </button>

        <div className="my-6 text-center text-sm text-gray-500">
          o ingresa con correo
        </div>

        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-[#111111] px-4 py-3 text-white outline-none"
          placeholder="Correo electrónico"
        />

        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-4 w-full rounded-xl border border-white/10 bg-[#111111] px-4 py-3 text-white outline-none"
          placeholder="Contraseña"
          type="password"
        />

        <button
          onClick={loginWithEmail}
          className="mt-6 w-full rounded-full bg-[#E0B04B] px-5 py-3 font-bold text-black"
        >
          Iniciar sesión
        </button>

        <button
          onClick={registerWithEmail}
          className="mt-4 w-full rounded-full border border-[#E0B04B]/40 px-5 py-3 font-bold text-[#E0B04B]"
        >
          Crear cuenta gratis
        </button>
      </div>
    </div>
  )
}

export default Login