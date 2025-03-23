"use client";

import { useState } from "react";
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
import { useAuth } from "@/app/context/auth-context"; // Importe o useAuth

const signInSchema = z.object({
  email: z.string().email({ message: "Insira um e-mail válido." }),
  password: z.string().min(1, { message: "A senha é obrigatória." }),
});

type SignInFormData = z.infer<typeof signInSchema>;

export function SignInForm() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { login } = useAuth(); // Obtém a função login do contexto


  const form = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: SignInFormData) {
        setLoading(true);
        setError(null);

        try{
            const response = await fetch("http://localhost:8000/auth/sign-in", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams({
                    username: data.email,
                    password: data.password,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Erro ao fazer login.");
            }

            const responseData = await response.json();
            console.log("Login bem-sucedido:", responseData);

            // --- Usa a função login do contexto! ---
            login(responseData.access_token, data.email); // Passa o token E o email


        } catch(err:any){
            setError(err.message || "Erro ao fazer login. Verifique suas credenciais.");
            console.error("Erro de login", err);

        } finally{
            setLoading(false);
        }

  }

  return (
    // ... (o restante do seu componente SignInForm permanece o mesmo)
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
                  {loading? "Entrando..." : "Entrar"}
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
  );
}