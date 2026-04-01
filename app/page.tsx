import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 p-4">
      <main className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center">
        <h1 className="text-3xl font-bold text-zinc-900 mb-4">
          Plataforma de Menús
        </h1>
        <p className="text-zinc-600 mb-8">
          Crea tu menú digital interactivo y recibe pedidos directamente en WhatsApp.
        </p>

        <div className="flex flex-col gap-4">
          <Link
            href="/dashboard"
            className="w-full bg-black text-white py-3 rounded-xl font-medium hover:bg-zinc-800 transition-colors"
          >
            Ir al Panel de Administración
          </Link>
        </div>
      </main>
    </div>
  );
}