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
import { useSearchParams } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle } from "lucide-react";

const signInSchema = z.object({
  email: z.string().email({ message: "Insira um e-mail válido." }),
  password: z.string().min(1, { message: "A senha é obrigatória." }),
});

type SignInFormData = z.infer<typeof signInSchema>;

export function SignInForm() {
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { login, error: authError } = useAuth();
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

  async function onSubmit(data: SignInFormData) {
    setLoading(true);

    try {
      await login(data.email, data.password);
      // Navigation happens in the auth context when login is successful
    } catch (err) {
      // Error handling is done in the auth context
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
              {loading ? "Entrando..." : "Entrar"}
            </Button>

            {authError && <p className="text-red-500 text-sm">{authError}</p>}

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