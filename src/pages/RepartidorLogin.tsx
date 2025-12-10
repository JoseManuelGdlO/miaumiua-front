import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Package } from "lucide-react";
import { useRepartidorAuth } from "@/hooks/useRepartidorAuth";
import miauMiauLogo from "/lovable-uploads/9f868334-2970-46f8-a783-9ab32ecc297b.png";

const RepartidorLogin = () => {
  const [email, setEmail] = useState("");
  const [codigoRepartidor, setCodigoRepartidor] = useState("");
  const [password, setPassword] = useState("");
  const [loginMethod, setLoginMethod] = useState<"email" | "codigo">("email");
  const { login, isLoading, error, clearError, isAuthenticated } = useRepartidorAuth();
  const navigate = useNavigate();

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/repartidores/dashboard");
    }
  }, [isAuthenticated, navigate]);

  // Limpiar errores después de 5 segundos
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearError();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  const handleInputChange = (setter: (value: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (error) {
      clearError();
    }
    setter(e.target.value);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password) {
      return;
    }

    if (loginMethod === "email" && !email) {
      return;
    }

    if (loginMethod === "codigo" && !codigoRepartidor) {
      return;
    }

    await login({
      email: loginMethod === "email" ? email : undefined,
      codigo_repartidor: loginMethod === "codigo" ? codigoRepartidor : undefined,
      contrasena: password,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/10 p-4 relative">
      <div className="w-full max-w-md space-y-8">
        {/* Logo and branding */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-24 h-24 rounded-3xl overflow-hidden shadow-lg">
              <img 
                src={miauMiauLogo} 
                alt="Miau Miau Logo" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Miau Miau
            </h1>
            <p className="text-sm text-muted-foreground">
              Portal de Repartidores
            </p>
          </div>
        </div>

        {/* Login form */}
        <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl flex items-center justify-center gap-2">
              <Package className="h-6 w-6" />
              Iniciar Sesión
            </CardTitle>
            <CardDescription>
              Accede a tu cuenta de repartidor
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              {/* Mostrar errores */}
              {error && (
                <Alert variant="destructive" className="border-red-500 bg-red-50 dark:bg-red-950/20 animate-in slide-in-from-top-2 duration-300">
                  <AlertDescription className="text-red-700 dark:text-red-300 font-medium flex items-center gap-2">
                    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {/* Selector de método de login */}
              <div className="flex gap-2 p-1 bg-muted rounded-lg">
                <button
                  type="button"
                  onClick={() => {
                    setLoginMethod("email");
                    setCodigoRepartidor("");
                    clearError();
                  }}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                    loginMethod === "email"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Email
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLoginMethod("codigo");
                    setEmail("");
                    clearError();
                  }}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                    loginMethod === "codigo"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Código
                </button>
              </div>

              {/* Campo de email o código */}
              {loginMethod === "email" ? (
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Correo Electrónico
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="repartidor@example.com"
                    value={email}
                    onChange={handleInputChange(setEmail)}
                    required
                    disabled={isLoading}
                    className="h-11"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="codigo" className="text-sm font-medium">
                    Código de Repartidor
                  </Label>
                  <Input
                    id="codigo"
                    type="text"
                    placeholder="REP-001"
                    value={codigoRepartidor}
                    onChange={handleInputChange(setCodigoRepartidor)}
                    required
                    disabled={isLoading}
                    className="h-11"
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Contraseña
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={handleInputChange(setPassword)}
                  required
                  disabled={isLoading}
                  className="h-11"
                />
              </div>

              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full h-11 bg-gradient-to-r from-primary to-primary-light hover:from-primary-dark hover:to-primary font-medium shadow-lg transition-all duration-300"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Iniciando sesión...
                  </>
                ) : (
                  "Ingresar"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground">
          © 2024 Miau Miau. Todos los derechos reservados.
        </p>
      </div>

      {/* Intelekia Logo - Bottom Left */}
      <div className="fixed bottom-4 left-4 z-10">
        <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg border max-w-xs">
          <div className="flex items-center gap-3">
            <img 
              src="/lovable-uploads/e7d6a686-c959-4e3a-9e6e-f7de95f74e9e.png" 
              alt="Powered by Intelekia" 
              className="w-12 h-auto object-contain opacity-80 hover:opacity-100 transition-opacity flex-shrink-0"
            />
            <div className="text-xs text-muted-foreground">
              <div className="font-medium">Powered by Intelekia</div>
              <div className="text-xs opacity-75">
                Propiedad intelectual de<br />
                <span className="font-semibold">Intelekia Consultoría</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RepartidorLogin;
