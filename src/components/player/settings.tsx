// src/components/player/settings.tsx
"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NotificationSettings } from "./notification-settings";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export function UserSettings() {
  const [saving, setSaving] = useState(false);

  const handleSaveProfile = async () => {
    setSaving(true);
    
    try {
      // This would be an API call to save profile settings
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success("Configurações salvas com sucesso");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Erro ao salvar configurações");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Configurações</h1>
      
      <Tabs defaultValue="account">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="account">Conta</TabsTrigger>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
          <TabsTrigger value="privacy">Privacidade</TabsTrigger>
        </TabsList>
        
        {/* Account Settings */}
        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Configurações da Conta</CardTitle>
              <CardDescription>
                Gerencie suas informações de conta e preferências
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Nome de exibição</Label>
                    <Input id="displayName" defaultValue="Usuário WhatsPort" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username">Nome de usuário</Label>
                    <Input id="username" defaultValue="usuario" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" defaultValue="usuario@example.com" disabled />
                  <p className="text-sm text-muted-foreground">
                    Para alterar seu email, entre em contato com o suporte.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="language">Idioma</Label>
                  <Select defaultValue="pt-BR">
                    <SelectTrigger id="language">
                      <SelectValue placeholder="Selecione um idioma" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                      <SelectItem value="en-US">English (US)</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="marketing-emails">Emails de marketing</Label>
                    <p className="text-sm text-muted-foreground">
                      Receba ofertas e novidades sobre o WhatsPort
                    </p>
                  </div>
                  <Switch id="marketing-emails" defaultChecked={true} />
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline">Cancelar</Button>
                <Button onClick={handleSaveProfile} disabled={saving}>
                  {saving ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Notification Settings */}
        <TabsContent value="notifications">
          <NotificationSettings />
        </TabsContent>
        
        {/* Privacy Settings */}
        <TabsContent value="privacy">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Privacidade</CardTitle>
              <CardDescription>
                Gerencie suas configurações de privacidade e visibilidade
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="profile-visibility">Visibilidade do perfil</Label>
                    <p className="text-sm text-muted-foreground">
                      Quem pode ver seu perfil no WhatsPort
                    </p>
                  </div>
                  <Select defaultValue="friends">
                    <SelectTrigger id="profile-visibility" className="w-[180px]">
                      <SelectValue placeholder="Selecione a visibilidade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Público</SelectItem>
                      <SelectItem value="friends">Apenas amigos</SelectItem>
                      <SelectItem value="private">Privado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="location-sharing">Compartilhamento de localização</Label>
                    <p className="text-sm text-muted-foreground">
                      Permite que outros usuários vejam sua localização durante eventos
                    </p>
                  </div>
                  <Switch id="location-sharing" defaultChecked={true} />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="activity-status">Status de atividade</Label>
                    <p className="text-sm text-muted-foreground">
                      Mostrar quando você está online
                    </p>
                  </div>
                  <Switch id="activity-status" defaultChecked={true} />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="data-collection">Coleta de dados de uso</Label>
                    <p className="text-sm text-muted-foreground">
                      Permite a coleta de dados para melhorar a experiência
                    </p>
                  </div>
                  <Switch id="data-collection" defaultChecked={true} />
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline">Cancelar</Button>
                <Button onClick={handleSaveProfile} disabled={saving}>
                  {saving ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}