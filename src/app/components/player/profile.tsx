// src/components/player/profile.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

interface UserProfileProps {
  userEmail: string | null;
}

export function UserProfile({ userEmail }: UserProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  
  const handleSaveProfile = () => {
    setIsEditing(false);
    toast.success("Perfil atualizado com sucesso");
  };

  const initials = userEmail ? userEmail.substring(0, 2).toUpperCase() : "U";

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Perfil do Usuário</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <Card>
            <CardHeader className="flex flex-col items-center">
              <Avatar className="h-24 w-24">
                <AvatarImage src="" alt={userEmail || ""} />
                <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
              </Avatar>
              <CardTitle className="mt-4">{userEmail}</CardTitle>
              <CardDescription>Jogador</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Membro desde</span>
                  <span>Março 2023</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Eventos participados</span>
                  <span>12</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Esportes</span>
                  <span>Futebol, Tênis</span>
                </div>
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
                          <Input id="name" defaultValue="Usuário WhatsPort" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input id="email" defaultValue={userEmail || ""} disabled />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="phone">Telefone</Label>
                          <Input id="phone" defaultValue="(11) 98765-4321" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="birthday">Data de Nascimento</Label>
                          <Input id="birthday" type="date" defaultValue="1990-01-01" />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="address">Endereço</Label>
                        <Input id="address" defaultValue="Av. Paulista, 1000 - São Paulo, SP" />
                      </div>
                    </>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Nome</h3>
                          <p>Usuário WhatsPort</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Email</h3>
                          <p>{userEmail}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Telefone</h3>
                          <p>(11) 98765-4321</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Data de Nascimento</h3>
                          <p>01/01/1990</p>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Endereço</h3>
                        <p>Av. Paulista, 1000 - São Paulo, SP</p>
                      </div>
                    </div>
                  )}
                </CardContent>
                {isEditing && (
                  <CardFooter>
                    <Button onClick={handleSaveProfile}>Salvar Alterações</Button>
                  </CardFooter>
                )}
              </Card>
            </TabsContent>
            
            <TabsContent value="sports" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Meus Esportes</CardTitle>
                  <CardDescription>
                    Gerencie seus esportes favoritos e níveis de habilidade
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 border rounded-md">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="text-lg font-medium">Futebol</h3>
                          <p className="text-muted-foreground">Nível: Intermediário</p>
                        </div>
                        <Button variant="outline" size="sm">Editar</Button>
                      </div>
                    </div>
                    
                    <div className="p-4 border rounded-md">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="text-lg font-medium">Tênis</h3>
                          <p className="text-muted-foreground">Nível: Iniciante</p>
                        </div>
                        <Button variant="outline" size="sm">Editar</Button>
                      </div>
                    </div>
                    
                    <Button variant="outline" className="w-full">Adicionar Novo Esporte</Button>
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
                  <div className="w-64 h-64 bg-black text-white rounded-md flex items-center justify-center mb-4">
                    QR Code do VCard
                  </div>
                  <p className="text-center text-muted-foreground mb-4">
                    Apresente este QR Code ao chegar aos eventos para confirmar sua presença
                  </p>
                  <Button>Baixar VCard</Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}





