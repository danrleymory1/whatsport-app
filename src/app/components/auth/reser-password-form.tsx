"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { useRouter, useSearchParams } from "next/navigation";

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, { message: "A senha deve ter pelo menos 8 caracteres." }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token"); // Obtém o token da URL

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(data: ResetPasswordFormData) {
    setLoading(true);
    setError(null);
    setSuccess(false);

    if (!token) {
      setError("Token de redefinição inválido.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/auth/reset-password?token=${token}`, {
          method: "POST",
          headers:{
              "Content-Type": "application/json"
          },
          body: JSON.stringify({
              password: data.password,
              confirmPassword: data.confirmPassword
          })
      });


      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao redefinir a senha.");
      }

      const responseData = await response.json();
      console.log("Redefinição bem-sucedida:", responseData);
      setSuccess(true);
      // router.push('/auth/sign-in');  // Redirecionar para o login

    } catch (err: any) {
      setError(err.message || "Erro ao redefinir a senha.");
      console.error("Erro na redefinição:", err);
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="text-center">
        <p className="text-red-500">Token de redefinição inválido.</p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nova Senha</FormLabel>
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
              <FormLabel>Confirmar Nova Senha</FormLabel>
              <FormControl>
                <Input type="password" placeholder="********" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Redefinindo..." : "Redefinir Senha"}
        </Button>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        {success && (
          <p className="text-green-500 text-sm">
            Senha redefinida com sucesso!
          </p>
        )}
      </form>
    </Form>
  );
}