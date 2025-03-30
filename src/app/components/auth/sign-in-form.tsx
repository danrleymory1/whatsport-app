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
import { useAuth } from "@/app/context/auth-context";
import { useRouter, useSearchParams } from "next/navigation";
import { apiService } from "@/services/api-service";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle } from "lucide-react";

const signInSchema = z.object({
  email: z.string().email({ message: "Insira um e-mail válido." }),
  password: z.string().min(1, { message: "A senha é obrigatória." }),
});

type SignInFormData = z.infer<typeof signInSchema>;

export function SignInForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const form = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Check for registration success message
  useEffect(() => {
    if (searchParams.get('registered') === 'true') {
      setSuccessMessage('Cadastro realizado com sucesso! Faça login para continuar.');
    }
    if (searchParams.get('reset') === 'true') {
      setSuccessMessage('Senha redefinida com sucesso! Faça login com sua nova senha.');
    }
  }, [searchParams]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  async function onSubmit(data: SignInFormData) {
    setLoading(true);
    setError(null);
  
    try {
      const response = await apiService.login({
        username: data.email,
        password: data.password,
      });
  
      console.log("Login bem-sucedido:", response);
      
      // Verificar se response.data existe antes de acessar
      if (response.data && response.data.access_token) {
        login(response.data.access_token, data.email);
      } else {
        throw new Error("Resposta da API inválida");
      }
      
    } catch (err: any) {
      setError(err.message || "Erro ao fazer login. Verifique suas credenciais.");
      console.error("Erro de login", err);
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
            {loading ? "Entrando..." : "Entrar"}
          </Button>
          
          {error && <p className="text-red-500 text-sm">{error}</p>}
          
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