"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
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
import Link from "next/link";

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Por favor, insira um e-mail válido" }),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
  const [loading, setLoading] = useState(false);
  const { forgotPassword } = useAuth();

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(data: ForgotPasswordFormData) {
    setLoading(true);

    try {
      const success = await forgotPassword(data.email);

      if (success) {
        form.reset();
      }
    } catch (error) {
      console.error("Error during password reset request:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Digite seu e-mail abaixo e enviaremos instruções para redefinir sua senha.
            </p>

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
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Enviando..." : "Recuperar Senha"}
          </Button>

          <div className="text-sm text-center">
            <Link href="/auth/sign-in" className="text-blue-500 hover:underline">
              Voltar para o login
            </Link>
          </div>
        </form>
      </Form>
  );
}