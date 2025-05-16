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
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { UserType } from "@/types/user";
import { toast } from "sonner";
import { Loader2, User, Building2 } from "lucide-react";

// Schema for validation with Zod
const signUpSchema = z.object({
  firstName: z.string().min(2, { message: "Nome deve ter pelo menos 2 caracteres." }),
  lastName: z.string().min(2, { message: "Sobrenome deve ter pelo menos 2 caracteres." }),
  username: z.string()
    .min(3, { message: "Username deve ter pelo menos 3 caracteres." })
    .regex(/^[a-zA-Z0-9_]+$/, { message: "Username deve conter apenas letras, números e underscore." }),
  email: z.string().email({ message: "Por favor, insira um e-mail válido." }),
  password: z
      .string()
      .min(8, { message: "A senha deve ter pelo menos 8 caracteres." })
      .regex(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
        message: "A senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número.",
      }),
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
  const [checkingUsername, setCheckingUsername] = useState(false);
  const { signup } = useAuth();
  const router = useRouter();

  const form = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      userType: "jogador",
    },
  });

  // Function to check if username is unique (simulated)
  const checkUsernameUnique = async (username: string) => {
    if (username.length < 3) return true; // Skip short usernames
    
    setCheckingUsername(true);
    try {
      // Simulate API call to check username
      await new Promise(resolve => setTimeout(resolve, 500));
      // For now, let's assume all usernames are available
      // In a real implementation, this would check your Firestore database
      return true;
    } catch (error) {
      console.error("Error checking username:", error);
      return false;
    } finally {
      setCheckingUsername(false);
    }
  };

  async function onSubmit(data: SignUpFormData) {
    // First check if username is unique
    const isUnique = await checkUsernameUnique(data.username);
    if (!isUnique) {
      form.setError("username", { 
        type: "manual", 
        message: "Este username já está em uso." 
      });
      return;
    }

    setLoading(true);

    try {
      // Combine first and last name
      const fullName = `${data.firstName} ${data.lastName}`;
      
      // The signup function should be modified to include the new fields
      const success = await signup(
        data.email, 
        data.password, 
        data.userType as UserType, 
        {
          name: fullName,
          username: data.username
        }
      );

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
          <div className="grid grid-cols-2 gap-4">
            <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input placeholder="Seu nome" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sobrenome</FormLabel>
                      <FormControl>
                        <Input placeholder="Seu sobrenome" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                )}
            />
          </div>

          <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="seu_username" 
                        {...field} 
                        onChange={(e) => {
                          field.onChange(e);
                          if (e.target.value.length >= 3) {
                            checkUsernameUnique(e.target.value);
                          }
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      {checkingUsername ? "Verificando disponibilidade..." : "Este será seu identificador único no sistema."}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
              )}
          />

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
                    <FormDescription>
                      Mínimo 8 caracteres, contendo letras maiúsculas, minúsculas e números.
                    </FormDescription>
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
                          <Button variant="outline" className="w-full flex justify-between items-center">
                            <div className="flex items-center">
                              {field.value === "jogador" ? (
                                <>
                                  <User className="h-4 w-4 mr-2" />
                                  <span>Jogador</span>
                                </>
                              ) : (
                                <>
                                  <Building2 className="h-4 w-4 mr-2" />
                                  <span>Gerente</span>
                                </>
                              )}
                            </div>
                            <span className="ml-2">▼</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="start"
                          className="min-w-[--radix-dropdown-menu-trigger-width] w-auto"
                          style={{ minWidth: "var(--radix-dropdown-menu-trigger-width)" }}
                        >
                          {[
                            {
                              value: "jogador",
                              label: "Jogador",
                              icon: <User className="h-4 w-4 mr-2" />,
                              description: "Participe de eventos esportivos.",
                            },
                            {
                              value: "gerente",
                              label: "Gerente",
                              icon: <Building2 className="h-4 w-4 mr-2" />,
                              description: "Administre espaços esportivos.",
                            },
                          ].map((option) => (
                            <DropdownMenuItem
                              key={option.value}
                              onSelect={() => field.onChange(option.value)}
                              className={`flex flex-col items-start gap-0.5 ${
                                field.value === option.value ? "font-bold bg-muted" : ""
                              }`}
                              aria-selected={field.value === option.value}
                            >
                              <span className="flex items-center">
                                {option.icon}
                                {option.label}
                              </span>
                              <span className="text-xs text-muted-foreground ml-6">{option.description}</span>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </FormControl>
                    <FormDescription>
                      Jogador: Participe de eventos esportivos. Gerente: Administre espaços esportivos.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
              )}
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cadastrando...
              </>
            ) : (
              "Cadastrar"
            )}
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