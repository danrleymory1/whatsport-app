"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { UserSport } from "@/types/user";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogTrigger
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { QRCodeCanvas } from 'qrcode.react';
import { 
  Download, 
  Plus, 
  Edit, 
  Trash,
  Trophy, 
  Check
} from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// Sport options
const sportOptions = [
  "Futebol",
  "Futsal",
  "Society",
  "Tênis",
  "Beach Tennis",
  "Vôlei",
  "Basquete",
  "Natação",
  "Corrida",
  "CrossFit",
  "Handebol",
  "Muay Thai",
  "Jiu-Jitsu",
  "Boxe",
  "Pilates",
  "Yoga",
  "Padel",
];

// Skill level options
const skillLevelOptions = [
  { value: "beginner", label: "Iniciante" },
  { value: "intermediate", label: "Intermediário" },
  { value: "advanced", label: "Avançado" },
];

// Schema for sport form
const sportFormSchema = z.object({
  sport_type: z.string().min(1, "Selecione um esporte"),
  skill_level: z.string().min(1, "Selecione um nível"),
  years_experience: z.number().min(0, "Deve ser um número positivo").optional(),
  preferred_position: z.string().optional(),
});

type SportFormValues = z.infer<typeof sportFormSchema>;

export function UserProfile() {
  const { user, userEmail, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sportDialogOpen, setSportDialogOpen] = useState(false);
  const [editingSport, setEditingSport] = useState<UserSport | null>(null);
  const [vcardDialogOpen, setVcardDialogOpen] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    birth_date: "",
    bio: ""
  });
  
  // Sport form
  const sportForm = useForm<SportFormValues>({
    resolver: zodResolver(sportFormSchema),
    defaultValues: {
      sport_type: "",
      skill_level: "",
      years_experience: 0,
      preferred_position: "",
    },
  });
  
  // Load user data
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
        birth_date: user.birth_date || "",
        bio: user.bio || ""
      });
    }
  }, [user]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      
      const updatedData = {
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        birth_date: formData.birth_date,
        bio: formData.bio
      };
      
      const success = await updateProfile(updatedData);
      
      if (success) {
        toast.success("Perfil atualizado com sucesso");
        setIsEditing(false);
      } else {
        toast.error("Erro ao atualizar perfil");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Erro ao atualizar perfil");
    } finally {
      setLoading(false);
    }
  };

  // Handle adding/editing sport
  const handleSportSubmit = async (values: SportFormValues) => {
    try {
      setLoading(true);
      
      // Create new sports array
      const currentSports = user?.sports || [];
      let updatedSports: UserSport[];
      
      if (editingSport) {
        // Edit existing sport
        updatedSports = currentSports.map(sport => 
          sport.sport_type === editingSport.sport_type ? values : sport
        );
      } else {
        // Add new sport
        updatedSports = [...currentSports, values];
      }
      
      // Update profile
      const success = await updateProfile({ sports: updatedSports });
      
      if (success) {
        toast.success(editingSport ? "Esporte atualizado" : "Esporte adicionado");
        setSportDialogOpen(false);
        setEditingSport(null);
        sportForm.reset();
      } else {
        toast.error("Erro ao atualizar esportes");
      }
    } catch (error) {
      console.error("Error updating sports:", error);
      toast.error("Erro ao atualizar esportes");
    } finally {
      setLoading(false);
    }
  };
  
  // Handle removing sport
  const handleRemoveSport = async (sportType: string) => {
    try {
      setLoading(true);
      
      const currentSports = user?.sports || [];
      const updatedSports = currentSports.filter(sport => sport.sport_type !== sportType);
      
      const success = await updateProfile({ sports: updatedSports });
      
      if (success) {
        toast.success("Esporte removido");
      } else {
        toast.error("Erro ao remover esporte");
      }
    } catch (error) {
      console.error("Error removing sport:", error);
      toast.error("Erro ao remover esporte");
    } finally {
      setLoading(false);
    }
  };
  
  // Edit sport
  const openEditSport = (sport: UserSport) => {
    setEditingSport(sport);
    sportForm.reset({
      sport_type: sport.sport_type,
      skill_level: sport.skill_level,
      years_experience: sport.years_experience || 0,
      preferred_position: sport.preferred_position || "",
    });
    setSportDialogOpen(true);
  };
  
  // Add new sport
  const openAddSport = () => {
    setEditingSport(null);
    sportForm.reset({
      sport_type: "",
      skill_level: "",
      years_experience: 0,
      preferred_position: "",
    });
    setSportDialogOpen(true);
  };
  
  // Download VCard QR Code
  const handleDownloadQRCode = () => {
    const canvas = document.getElementById('vcard-qrcode') as HTMLCanvasElement;
    if (canvas) {
      const pngUrl = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
      const downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = `vcard_${user?.id || 'user'}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };
  
  // Generate VCard data
  const getVCardData = () => {
    if (!user) return '';
    
    // Basic user info for QR code
    return JSON.stringify({
      id: user.id,
      name: user.name || userEmail,
      email: user.email,
      type: 'player'
    });
  };

  const initials = user?.name 
    ? user.name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
    : userEmail 
      ? userEmail.substring(0, 2).toUpperCase() 
      : "U";

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Meu Perfil</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <Card>
            <CardHeader className="flex flex-col items-center">
              <Avatar className="h-24 w-24">
                <AvatarImage src={user?.profile_image || ""} alt={user?.name || userEmail || ""} />
                <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
              </Avatar>
              <CardTitle className="mt-4">{user?.name || userEmail}</CardTitle>
              <CardDescription>Jogador</CardDescription>
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
        
        <div className="md:col-span-2">
          <Tabs defaultValue="info">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="info">Informações</TabsTrigger>
              <TabsTrigger value="sports">Esportes</TabsTrigger>
              <TabsTrigger value="vcard">VCard</TabsTrigger>
            </TabsList>
            
            <TabsContent value="info" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Informações Pessoais</CardTitle>
                  <CardDescription>
                    Gerencie suas informações pessoais
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isEditing ? (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Nome</Label>
                          <Input 
                            id="name" 
                            name="name"
                            value={formData.name} 
                            onChange={handleInputChange}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input 
                            id="email" 
                            name="email"
                            value={formData.email} 
                            disabled 
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="phone">Telefone</Label>
                          <Input 
                            id="phone" 
                            name="phone"
                            value={formData.phone} 
                            onChange={handleInputChange}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="birth_date">Data de Nascimento</Label>
                          <Input 
                            id="birth_date" 
                            name="birth_date"
                            type="date" 
                            value={formData.birth_date} 
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="address">Endereço</Label>
                        <Input 
                          id="address" 
                          name="address"
                          value={formData.address} 
                          onChange={handleInputChange}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="bio">Biografia</Label>
                        <textarea
                          id="bio"
                          name="bio"
                          className="w-full min-h-[100px] px-3 py-2 border rounded-md"
                          value={formData.bio}
                          onChange={handleInputChange}
                        />
                      </div>
                    </>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Nome</h3>
                          <p>{user?.name || "—"}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Email</h3>
                          <p>{user?.email}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Telefone</h3>
                          <p>{user?.phone || "—"}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Data de Nascimento</h3>
                          <p>
                            {user?.birth_date 
                              ? new Date(user.birth_date).toLocaleDateString('pt-BR') 
                              : "—"}
                          </p>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Endereço</h3>
                        <p>{user?.address || "—"}</p>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Biografia</h3>
                        <p>{user?.bio || "—"}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
                {isEditing && (
                  <CardFooter>
                    <Button 
                      onClick={handleSaveProfile}
                      disabled={loading}
                    >
                      {loading ? "Salvando..." : "Salvar Alterações"}
                    </Button>
                  </CardFooter>
                )}
              </Card>
            </TabsContent>
            
            <TabsContent value="sports" className="mt-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle>Meus Esportes</CardTitle>
                    <CardDescription>
                      Gerencie seus esportes favoritos e níveis de habilidade
                    </CardDescription>
                  </div>
                  <Dialog open={sportDialogOpen} onOpenChange={setSportDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={openAddSport}>
                        <Plus className="mr-2 h-4 w-4" />
                        Adicionar Esporte
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{editingSport ? 'Editar Esporte' : 'Adicionar Novo Esporte'}</DialogTitle>
                      </DialogHeader>
                      <Form {...sportForm}>
                        <form onSubmit={sportForm.handleSubmit(handleSportSubmit)} className="space-y-4">
                          <FormField
                            control={sportForm.control}
                            name="sport_type"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Esporte</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                  disabled={!!editingSport}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecione um esporte" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {sportOptions.map((sport) => (
                                      <SelectItem key={sport} value={sport}>
                                        {sport}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={sportForm.control}
                            name="skill_level"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nível de Habilidade</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecione um nível" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {skillLevelOptions.map((level) => (
                                      <SelectItem key={level.value} value={level.value}>
                                        {level.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={sportForm.control}
                            name="years_experience"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Anos de Experiência</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min="0"
                                    {...field}
                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={sportForm.control}
                            name="preferred_position"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Posição Preferida</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormDescription>
                                  Ex: Goleiro, Atacante, Levantador, etc.
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setSportDialogOpen(false)}>
                              Cancelar
                            </Button>
                            <Button type="submit" disabled={loading}>
                              {loading ? "Salvando..." : editingSport ? "Atualizar" : "Adicionar"}
                            </Button>
                          </DialogFooter>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {user?.sports && user.sports.length > 0 ? (
                      user.sports.map((sport, index) => (
                        <div key={index} className="p-4 border rounded-md">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center">
                              <Trophy className="h-5 w-5 mr-3 text-primary" />
                              <div>
                                <h3 className="text-lg font-medium">{sport.sport_type}</h3>
                                <div className="flex items-center text-sm text-muted-foreground">
                                  <span className="mr-4">
                                    Nível: {sport.skill_level === 'beginner' ? 'Iniciante' : 
                                            sport.skill_level === 'intermediate' ? 'Intermediário' : 'Avançado'}
                                  </span>
                                  {sport.years_experience !== undefined && (
                                    <span className="mr-4">Experiência: {sport.years_experience} {sport.years_experience === 1 ? 'ano' : 'anos'}</span>
                                  )}
                                  {sport.preferred_position && (
                                    <span>Posição: {sport.preferred_position}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => openEditSport(sport)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleRemoveSport(sport.sport_type)}
                                disabled={loading}
                              >
                                <Trash className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6">
                        <Trophy className="h-12 w-12 mx-auto text-muted-foreground opacity-20" />
                        <p className="mt-4 text-muted-foreground">
                          Você ainda não adicionou nenhum esporte ao seu perfil
                        </p>
                        <Button 
                          variant="outline" 
                          className="mt-4" 
                          onClick={openAddSport}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Adicionar Esporte
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="vcard" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Meu VCard</CardTitle>
                  <CardDescription>
                    Seu VCard é usado para autenticação em eventos
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                  <Dialog open={vcardDialogOpen} onOpenChange={setVcardDialogOpen}>
                    <DialogTrigger asChild>
                      <div className="cursor-pointer hover:scale-105 transition-transform">
                        <div className="p-4 border rounded-md bg-black text-white">
                          <QRCodeCanvas
                            id="vcard-qrcode-small"
                            value={getVCardData()}
                            size={150}
                            level="H"
                            includeMargin={true}
                          />
                        </div>
                        <p className="text-sm text-center mt-2 text-muted-foreground">
                          Clique para expandir
                        </p>
                      </div>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>QR Code do VCard</DialogTitle>
                      </DialogHeader>
                      <div className="flex flex-col items-center p-4">
                        <div className="p-6 border rounded-md bg-black text-white">
                          <QRCodeCanvas
                            id="vcard-qrcode"
                            value={getVCardData()}
                            size={300}
                            level="H"
                            includeMargin={true}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button 
                          variant="outline" 
                          onClick={handleDownloadQRCode}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Baixar QR Code
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  
                  <div className="space-y-2 mt-6 w-full">
                    <div className="flex justify-between p-3 border rounded-md items-center">
                      <div className="flex items-center">
                        <Check className="text-green-500 mr-2" />
                        <span className="font-medium">Status: </span>
                        <span className="ml-2">Válido</span>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setVcardDialogOpen(true)}>
                        Ver QR Code
                      </Button>
                    </div>
                    
                    <div className="p-4 bg-muted/30 rounded-md text-sm">
                      <h3 className="font-medium mb-2">Como usar seu VCard:</h3>
                      <ul className="space-y-2 list-disc list-inside text-muted-foreground">
                        <li>Apresente o QR Code ao chegar em eventos para confirmar sua presença</li>
                        <li>O organizador irá escanear o código para validar sua participação</li>
                        <li>Você pode baixar o QR Code para ter acesso offline</li>
                        <li>Seu VCard é único e está vinculado à sua conta</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}