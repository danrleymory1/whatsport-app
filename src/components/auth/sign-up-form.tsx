"use client";

import { useState } from "react";
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
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { UserType } from "@/types/user";
import { toast } from "sonner";

// Schema for validation with Zod
const signUpSchema = z.object({
  email: z.string().email({ message: "Por favor, insira um e-mail válido." }),
  password: z
      .string()
      .min(8, { message: "A senha deve ter pelo menos 8 caracteres." }),
  confirmPassword: z.string(),
  userType: z.enum(["jogador", "gerente"], {
    errorMap: () => ({ message: "Selecione um tipo de usuário." }),
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type SignUpFormData = z.infer<typeof signUpSchema>;

export function SignUpForm() {
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const router = useRouter();

  const form = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      userType: "jogador",
    },
  });

  async function onSubmit(data: SignUpFormData) {
    setLoading(true);

    try {
      const success = await signup(data.email, data.password, data.userType as UserType);

      if (success) {
        toast.success("Cadastro realizado com sucesso!", {
          description: "Faça login para continuar."
        });
        router.push("/auth/sign-in?registered=true");
      }
    } catch (err: any) {
      toast.error("Erro ao cadastrar", {
        description: err.message || "Tente novamente."
      });
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
              name="confirmPassword"
              render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar Senha</FormLabel>
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