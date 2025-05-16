// src/components/player/settings.tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export function UserSettings() {
  const [saving, setSaving] = useState(false);

  const handleSaveSettings = async () => {
    setSaving(true);
    
    try {
      // Simulação de uma chamada API para salvar as configurações
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
      
      <Card>
        <CardHeader>
          <CardTitle>Preferências do Aplicativo</CardTitle>
          <CardDescription>
            Gerencie suas preferências e configurações
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Configurações de Idioma */}
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
          
          {/* Configurações de Tema */}
          <div className="space-y-2">
            <Label htmlFor="theme">Tema</Label>
            <Select defaultValue="system">
              <SelectTrigger id="theme">
                <SelectValue placeholder="Selecione um tema" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Claro</SelectItem>
                <SelectItem value="dark">Escuro</SelectItem>
                <SelectItem value="system">Sistema</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Configurações de Notificações Simplificadas */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Notificações</h3>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-notifications" className="font-medium">Notificações por Email</Label>
                <p className="text-sm text-muted-foreground">
                  Receba notificações por email
                </p>
              </div>
              <Switch id="email-notifications" defaultChecked={true} />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="push-notifications" className="font-medium">Notificações Push</Label>
                <p className="text-sm text-muted-foreground">
                  Receba notificações no navegador e no aplicativo
                </p>
              </div>
              <Switch id="push-notifications" defaultChecked={true} />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="event-notifications" className="font-medium">Notificações de Eventos</Label>
                <p className="text-sm text-muted-foreground">
                  Notificações sobre eventos e convites
                </p>
              </div>
              <Switch id="event-notifications" defaultChecked={true} />
            </div>
          </div>
          
          {/* Configurações Gerais */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Configurações Gerais</h3>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="location-sharing" className="font-medium">Compartilhamento de Localização</Label>
                <p className="text-sm text-muted-foreground">
                  Permite que o aplicativo acesse sua localização
                </p>
              </div>
              <Switch id="location-sharing" defaultChecked={true} />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="marketing-emails" className="font-medium">Emails promocionais</Label>
                <p className="text-sm text-muted-foreground">
                  Receba ofertas e novidades sobre o WhatsPort
                </p>
              </div>
              <Switch id="marketing-emails" defaultChecked={true} />
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-end space-x-2">
          <Button variant="outline">Restaurar Padrões</Button>
          <Button onClick={handleSaveSettings} disabled={saving}>
            {saving ? "Salvando..." : "Salvar Configurações"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}