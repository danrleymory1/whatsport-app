"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { UserType } from "@/types/user";
import { toast } from "sonner";
import { CalendarIcon, Upload, User } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Profile form schema
const profileSchema = z.object({
  name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  birth_date: z.date().optional(),
  bio: z.string().optional(),
  profile_image: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

// Profile component
export function UserProfileComponent() {
  const { user, updateProfile, userType } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [selectedTab, setSelectedTab] = useState("profile");
  
  // Initialize form with user data
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      address: user?.address || "",
      birth_date: user?.birth_date ? new Date(user.birth_date) : undefined,
      bio: user?.bio || "",
      profile_image: user?.profile_image || "",
    },
  });
  
  // Update form when user data changes
  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
        birth_date: user.birth_date ? new Date(user.birth_date) : undefined,
        bio: user.bio || "",
        profile_image: user.profile_image || "",
      });
      
      setAvatarPreview(user.profile_image || "");
    }
  }, [user, form]);
  
  // Handle avatar change
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setAvatarPreview(result);
        form.setValue("profile_image", result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Handle form submission
  const onSubmit = async (data: ProfileFormValues) => {
    try {
      // Format birth_date to string if present
      const formattedData = {
        ...data,
        birth_date: data.birth_date ? data.birth_date.toISOString() : undefined,
      };
      
      const success = await updateProfile(formattedData);
      
      if (success) {
        toast.success("Perfil atualizado com sucesso");
        setIsEditing(false);
      } else {
        toast.error("Erro ao atualizar perfil");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Erro ao atualizar perfil");
    }
  };
  
  // Get appropriate tabs based on user type
  const getTabs = () => {
    const commonTabs = [
      { id: "profile", label: "Perfil" },
      { id: "preferences", label: "Preferências" },
      { id: "security", label: "Segurança" },
    ];
    
    if (userType === UserType.PLAYER) {
      return [
        ...commonTabs,
        { id: "sports", label: "Esportes" },
        { id: "vcard", label: "VCard" },
      ];
    } else if (userType === UserType.MANAGER) {
      return [
        ...commonTabs,
        { id: "company", label: "Empresa" },
        { id: "banking", label: "Dados Bancários" },
      ];
    }
    
    return commonTabs;
  };
  
  const tabs = getTabs();
  
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">
        {userType === UserType.MANAGER ? "Perfil do Gerente" : "Meu Perfil"}
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User card */}
        <div>
          <Card>
            <CardHeader className="flex flex-col items-center">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={avatarPreview} alt={user?.name || ""} />
                  <AvatarFallback className="text-2xl">
                    {user?.name?.substring(0, 2).toUpperCase() || user?.email?.substring(0, 2).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                {isEditing && (
                  <label 
                    htmlFor="avatar-upload" 
                    className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1 cursor-pointer"
                  >
                    <Upload size={16} />
                    <input 
                      id="avatar-upload" 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleAvatarChange}
                    />
                  </label>
                )}
              </div>
              <CardTitle className="mt-4">{user?.name || user?.email}</CardTitle>
              <CardDescription>
                {userType === UserType.MANAGER ? "Gerente de Espaço" : "Jogador"}
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email</span>
                  <span>{user?.email}</span>
                </div>
                {user?.phone && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Telefone</span>
                    <span>{user.phone}</span>
                  </div>
                )}
                {user?.created_at && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Membro desde</span>
                    <span>{new Date(user.created_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                )}
              </div>
            </CardContent>
            
            <CardFooter>
              <Button 
                variant={isEditing ? "outline" : "default"} 
                className="w-full" 
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? "Cancelar" : "Editar Perfil"}
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        {/* Tabs content */}
        <div className="md:col-span-2">
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-3 md:grid-cols-5">
              {tabs.map(tab => (
                <TabsTrigger key={tab.id} value={tab.id}>{tab.label}</TabsTrigger>
              ))}
            </TabsList>
            
            {/* Profile tab */}
            <TabsContent value="profile" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Informações Pessoais</CardTitle>
                  <CardDescription>
                    {isEditing ? "Edite suas informações pessoais" : "Gerencie suas informações pessoais"}
                  </CardDescription>
                </CardHeader>
                
                {isEditing ? (
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                      <CardContent className="space-y-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nome</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input {...field} disabled />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Telefone</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Endereço</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="birth_date"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>Data de Nascimento</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant={"outline"}
                                      className={cn(
                                        "w-full pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                      )}
                                    >
                                      {field.value ? (
                                        format(field.value, "PPP", { locale: ptBR })
                                      ) : (
                                        <span>Selecione uma data</span>
                                      )}
                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    disabled={(date) => date > new Date()}
                                    initialFocus
                                    locale={ptBR}
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="bio"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Biografia</FormLabel>
                              <FormControl>
                                <Textarea 
                                  {...field} 
                                  placeholder="Conte um pouco sobre você..."
                                  rows={4}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </CardContent>
                      
                      <CardFooter>
                        <Button type="submit">Salvar Alterações</Button>
                      </CardFooter>
                    </form>
                  </Form>
                ) : (
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-muted-foreground">Nome</Label>
                        <p className="mt-1">{user?.name || "—"}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Email</Label>
                        <p className="mt-1">{user?.email}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-muted-foreground">Telefone</Label>
                        <p className="mt-1">{user?.phone || "—"}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Data de Nascimento</Label>
                        <p className="mt-1">
                          {user?.birth_date 
                            ? new Date(user.birth_date).toLocaleDateString('pt-BR') 
                            : "—"}
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-muted-foreground">Endereço</Label>
                      <p className="mt-1">{user?.address || "—"}</p>
                    </div>
                    
                    {user?.bio && (
                      <div>
                        <Label className="text-muted-foreground">Biografia</Label>
                        <p className="mt-1">{user.bio}</p>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            </TabsContent>
            
            {/* Placeholder for other tabs - implement as needed */}
            <TabsContent value="preferences" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Preferências</CardTitle>
                  <CardDescription>
                    Gerencie suas preferências do aplicativo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Conteúdo de preferências a ser implementado.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="security" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Segurança</CardTitle>
                  <CardDescription>
                    Gerencie suas configurações de segurança
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Conteúdo de segurança a ser implementado.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
            
            {userType === UserType.PLAYER && (
              <>
                <TabsContent value="sports" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Esportes</CardTitle>
                      <CardDescription>
                        Gerencie seus esportes e níveis de habilidade
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">
                        Conteúdo de esportes a ser implementado.
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="vcard" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>VCard</CardTitle>
                      <CardDescription>
                        Seu VCard para eventos esportivos
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">
                        Conteúdo de VCard a ser implementado.
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>
              </>
            )}
            
            {userType === UserType.MANAGER && (
              <>
                <TabsContent value="company" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Empresa</CardTitle>
                      <CardDescription>
                        Informações da sua empresa
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">
                        Conteúdo de empresa a ser implementado.
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="banking" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Dados Bancários</CardTitle>
                      <CardDescription>
                        Suas informações bancárias
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">
                        Conteúdo de dados bancários a ser implementado.
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>
              </>
            )}
          </Tabs>
        </div>
      </div>
    </div>
  );
}