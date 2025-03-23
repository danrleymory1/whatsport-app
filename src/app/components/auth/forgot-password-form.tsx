"use client"

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


const forgotPasswordSchema = z.object({
    email: z.string().email({ message: "Por favor, insira um e-mail válido" }),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

export function ForgotPasswordForm() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false); //Estado para mensagem de sucesso

    const form = useForm<ForgotPasswordFormData>({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: {
            email: ""
        }
    });

    async function onSubmit(data: ForgotPasswordFormData) {
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const response = await fetch("http://localhost:8000/auth/forgot-password", {
                method: "POST",
                headers:{
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({email: data.email})
            });


            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Erro ao solicitar recuperação.");
            }

            const responseData = await response.json();
            console.log("Solicitação de recuperação:", responseData);
            setSuccess(true);

        } catch (err: any) {
            setError(err.message || "Erro ao solicitar recuperação de senha.");
            console.error("Erro na recuperação:", err)
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
                <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Enviando..." : "Recuperar Senha"}
                </Button>

                {error && <p className="text-red-500 text-sm">{error}</p>}
                {success && <p className="text-green-500 text-sm">
                    Instruções de recuperação enviadas para o seu e-mail (verifique o spam).
                </p>}
            </form>
        </Form>
    )
}