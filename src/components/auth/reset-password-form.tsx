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
  const oobCode = searchParams.get("oobCode") || searchParams.get("code") || "";

  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuth();

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(data: ResetPasswordFormData) {
    setLoading(true);

    if (!oobCode) {
      toast.error("Código de redefinição inválido", {
        description: "O código de redefinição de senha é inválido ou expirou.",
      });
      setLoading(false);
      return;
    }

    try {
      const success = await resetPassword(oobCode, data.password);

      if (success) {
        // Navigate to sign-in page with success message
        router.push("/auth/sign-in?reset=true");
      }
    } catch (error) {
      // Error handling done in auth context
      console.error("Error during password reset:", error);
    } finally {
      setLoading(false);
    }
  }

  if (!oobCode) {
    return (
        <div className="text-center">
          <p className="text-red-500">Código de redefinição inválido ou expirado.</p>
          <Button
              className="mt-4"
              onClick={() => router.push('/auth/forgot-password')}
          >
            Solicitar nova redefinição
          </Button>
        </div>
    );
  }

  return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Defina sua nova senha abaixo.
            </p>

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
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Redefinindo..." : "Redefinir Senha"}
          </Button>
        </form>
      </Form>
  );
}