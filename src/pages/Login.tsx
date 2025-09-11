import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import miauMiauLogo from "/lovable-uploads/9f868334-2970-46f8-a783-9ab32ecc297b.png";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, isLoading, error, clearError, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  // Limpiar errores cuando el usuario empiece a escribir
  useEffect(() => {
    if (error) {
      clearError();
    }
  }, [email, password, error, clearError]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      return;
    }

    await login({
      correo_electronico: email,
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
              Arena aglutinante para gato
            </p>
          </div>
        </div>

        {/* Login form */}
        <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Iniciar Sesión</CardTitle>
            <CardDescription>
              Accede a tu panel de administración
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              {/* Mostrar errores */}
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Correo Electrónico
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@miaumiau.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-11"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Contraseña
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
                  "Ingresar al Panel"
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

export default Login;