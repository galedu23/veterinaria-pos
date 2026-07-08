"use client";

// ============================================================
// app/login/page.tsx — Pantalla de inicio de sesión (mock).
// Valida contra las credenciales quemadas de services/auth.ts.
// Credenciales de prueba:
//   admin@vet.com / admin123  (Administrador)
//   vet@vet.com / vet123      (Veterinario)
//   recepcion@vet.com / rec123 (Recepción)
// TODO: Conectar con Supabase Auth (solo cambia services/auth.ts).
// ============================================================

import * as React from "react";
import { useRouter } from "next/navigation";
import { PawPrint, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";

export default function PaginaLogin() {
  const router = useRouter();
  const { iniciarSesion, usuario, cargando } = useAuth();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [enviando, setEnviando] = React.useState(false);

  // Si ya hay sesión activa, mandamos directo al dashboard
  React.useEffect(() => {
    if (!cargando && usuario) router.replace("/");
  }, [cargando, usuario, router]);

  /** manejarEnvio: intenta iniciar sesión y muestra errores amigables */
  const manejarEnvio = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setEnviando(true);
    try {
      await iniciarSesion(email, password);
      router.replace("/"); // sesión correcta -> dashboard
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-900 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600">
            <PawPrint className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-xl">Soft - VetGram</CardTitle>
          <CardDescription>Sistema de Control Veterinario</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={manejarEnvio} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@vet.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {/* Mensaje de error de credenciales */}
            {error && (
              <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
            )}

            <Button type="submit" className="w-full" disabled={enviando}>
              {enviando && <Loader2 className="h-4 w-4 animate-spin" />}
              Iniciar Sesión
            </Button>
          </form>

          {/* Ayuda visible solo en desarrollo: credenciales de prueba */}
          <div className="mt-4 rounded-md bg-muted p-3 text-xs text-muted-foreground">
            <p className="mb-1 font-semibold">Credenciales de prueba:</p>
            <p>admin@vet.com / admin123</p>
            <p>vet@vet.com / vet123</p>
            <p>recepcion@vet.com / rec123</p>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
