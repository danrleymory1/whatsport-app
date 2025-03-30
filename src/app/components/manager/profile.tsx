// src/components/manager/profile.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

interface ManagerProfileProps {
  userEmail: string | null;
}

export function ManagerProfile({ userEmail }: ManagerProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  
  const handleSaveProfile = () => {
    setIsEditing(false);
    toast.success("Perfil atualizado com sucesso");
  };

  const initials = userEmail ? userEmail.substring(0, 2).toUpperCase() : "U";

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Perfil do Gerente</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <Card>
            <CardHeader className="flex flex-col items-center">
              <Avatar className="h-24 w-24">
                <AvatarImage src="" alt={userEmail || ""} />
                <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
              </Avatar>
              <CardTitle className="mt-4">{userEmail}</CardTitle>
              <CardDescription>Gerente de Espaço</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Membro desde</span>
                  <span>Março 2023</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Espaços gerenciados</span>
                  <span>3</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Eventos realizados</span>
                  <span>42</span>
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
              <TabsTrigger value="company">Empresa</TabsTrigger>
              <TabsTrigger value="banking">Dados Bancários</TabsTrigger>
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
                          <Input id="name" defaultValue="Gerente WhatsPort" />
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
                          <Label htmlFor="position">Cargo</Label>
                          <Input id="position" defaultValue="Gerente de Espaços" />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="address">Endereço Comercial</Label>
                        <Input id="address" defaultValue="Rua dos Esportes, 200 - São Paulo, SP" />
                      </div>
                    </>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Nome</h3>
                          <p>Gerente WhatsPort</p>
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
                          <h3 className="text-sm font-medium text-muted-foreground">Cargo</h3>
                          <p>Gerente de Espaços</p>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Endereço Comercial</h3>
                        <p>Rua dos Esportes, 200 - São Paulo, SP</p>
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
            
            <TabsContent value="company" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Dados da Empresa</CardTitle>
                  <CardDescription>
                    Informações da empresa que gerencia os espaços
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Razão Social</h3>
                        <p>Esportes & Cia Ltda</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">CNPJ</h3>
                        <p>12.345.678/0001-90</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Inscrição Estadual</h3>
                        <p>123.456.789.000</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Telefone Comercial</h3>
                        <p>(11) 3456-7890</p>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Endereço da Sede</h3>
                      <p>Av. das Quadras, 1500 - São Paulo, SP - CEP 01234-567</p>
                    </div>
                    
                    <Button variant="outline">Editar Dados da Empresa</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="banking" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Dados Bancários</CardTitle>
                  <CardDescription>
                    Informações bancárias para recebimento de pagamentos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Banco</h3>
                        <p>Banco WhatsPort</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Agência</h3>
                        <p>1234</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Conta</h3>
                        <p>56789-0</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Tipo de Conta</h3>
                        <p>Corrente</p>
                      </div>
                    </div>
                    
                    <Button variant="outline">Editar Dados Bancários</Button>
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











