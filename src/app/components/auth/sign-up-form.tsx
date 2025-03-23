"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { useRouter } from "next/navigation"; // Import useRouter

// Schema de validação com Zod
const signUpSchema = z.object({
  email: z.string().email({ message: "Por favor, insira um e-mail válido." }),
  password: z
    .string()
    .min(8, { message: "A senha deve ter pelo menos 8 caracteres." }),
  userType: z.enum(["jogador", "gerente"], {
    errorMap: () => ({ message: "Selecione um tipo de usuário." }),
  }),
});

type SignUpFormData = z.infer<typeof signUpSchema>;

export function SignUpForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth(); //Verifica se está logado
  const router = useRouter(); // Inicializa o router

  const form = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      password: "",
      userType: "jogador",
    },
  });

    useEffect(()=>{
        if(isAuthenticated){
            router.push("/")
        }
    }, [isAuthenticated, router])


  async function onSubmit(data: SignUpFormData) {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("http://localhost:8000/auth/sign-up", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
            email: data.email,
            password: data.password,
            user_type: data.userType
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao cadastrar.");
      }

      const responseData = await response.json();
      console.log("Cadastro bem-sucedido:", responseData);
      router.push("/auth/sign-in"); // Redireciona para o login após o cadastro
      // Adicione aqui o redirecionamento ou atualização do estado de autenticação

    } catch (err: any) {
      setError(err.message || "Erro ao cadastrar. Tente novamente.");
      console.error("Erro no cadastro:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
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
              <FormField
                  control={form.control}
                  name="userType"
                  render={({ field }) => (
                      <FormItem>
                          <FormLabel>Tipo de Usuário</FormLabel>
                          <FormControl>
                              <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                      <Button variant="outline" className="w-full">
                                          {field.value === "jogador" ? "Jogador" : "Gerente"}

                                      </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="start">
                                      <DropdownMenuItem
                                          onSelect={() => field.onChange("jogador")}
                                          className={field.value === "jogador" ? "font-bold" : ""}
                                      >
                                          Jogador
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                          onSelect={() => field.onChange("gerente")}
                                          className={field.value === "gerente" ? "font-bold" : ""}
                                      >
                                          Gerente
                                      </DropdownMenuItem>
                                  </DropdownMenuContent>
                              </DropdownMenu>
                          </FormControl>
                          <FormMessage />
                      </FormItem>
                  )}
              />
              <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Cadastrando..." : "Cadastrar"}
              </Button>
              {error && <p className="text-red-500 text-sm">{error}</p>}

              <div className="text-sm text-center">
                  Já tem uma conta?{" "}
                  <Link href="/auth/sign-in" className="text-blue-500 hover:underline">
                      Faça login
                  </Link>
              </div>
          </form>
      </Form>
  );
}