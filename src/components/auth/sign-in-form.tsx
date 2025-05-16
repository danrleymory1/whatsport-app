"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/auth-context";
import { useRouter, useSearchParams } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, Loader2 } from "lucide-react";

const signInSchema = z.object({
  email: z.string().email({ message: "Insira um e-mail válido." }),
  password: z.string().min(1, { message: "A senha é obrigatória." }),
});

type SignInFormData = z.infer<typeof signInSchema>;

export function SignInForm() {
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { login, error: authError, isAuthenticated, userType } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Inicializando o formulário corretamente
  const form = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Redirect based on user type when authenticated
  useEffect(() => {
    if (isAuthenticated && userType) {
      // Verificar se há uma URL de retorno nos parâmetros de consulta
      const returnUrl = searchParams.get('returnUrl');
      
      // Add a small delay to ensure Firebase auth state is fully processed
      const redirectTimer = setTimeout(() => {
        if (returnUrl) {
          // Redirecionar para a URL de retorno se existir
          router.push(returnUrl);
        } else {
          // Redirecionar para o dashboard apropriado
          if (userType === "jogador") {
            router.push("/player/dashboard");
          } else if (userType === "gerente") {
            router.push("/manager/dashboard");
          }
        }
      }, 300);
      
      return () => clearTimeout(redirectTimer);
    }
  }, [isAuthenticated, userType, router, searchParams]);

  // Check for registration success message
  useEffect(() => {
    if (searchParams.get('registered') === 'true') {
      setSuccessMessage('Cadastro realizado com sucesso! Faça login para continuar.');
    }
    if (searchParams.get('reset') === 'true') {
      setSuccessMessage('Senha redefinida com sucesso! Faça login com sua nova senha.');
    }
  }, [searchParams]);

  async function onSubmit(data: SignInFormData) {
    setLoading(true);

    try {
      await login(data.email, data.password);
      // Redirection will be handled by the useEffect above
    } catch (err) {
      console.error("Login submission error:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
      <>
        {successMessage && (
            <Alert className="mb-6 bg-green-50 text-green-700 border-green-200">
              <CheckCircle className="h-4 w-4 mr-2" />
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-mail</FormLabel>
                      <FormControl>
                        <Input placeholder="seu@email.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="********" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                )}
            />

            <div className="text-right">
              <Link
                  href="/auth/forgot-password"
                  className="text-blue-500 hover:underline text-sm"
              >
                Esqueceu a senha?
              </Link>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </Button>

            {authError && <p className="text-red-500 text-sm mt-2">{authError}</p>}

            <div className="text-sm text-center">
              Não tem uma conta?{" "}
              <Link href="/auth/sign-up" className="text-blue-500 hover:underline">
                Cadastre-se
              </Link>
            </div>
          </form>
        </Form>
      </>
  );
}