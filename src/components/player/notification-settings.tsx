// src/components/player/notification-settings.tsx
"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { NotificationType } from "@/types/notification";

interface NotificationSettings {
  [key: string]: boolean;
}

// Default settings for notifications
const DEFAULT_SETTINGS: NotificationSettings = {
  // Events notifications
  [NotificationType.EVENT_INVITATION]: true,
  [NotificationType.EVENT_REMINDER]: true,
  [NotificationType.EVENT_CREATED]: true,
  [NotificationType.EVENT_UPDATED]: true,
  [NotificationType.EVENT_CANCELED]: true,
  [NotificationType.EVENT_NEW_PARTICIPANT]: true,
  [NotificationType.EVENT_PARTICIPANT_LEFT]: true,
  
  // Reservation notifications
  [NotificationType.RESERVATION_REQUEST]: true,
  [NotificationType.RESERVATION_APPROVED]: true,
  [NotificationType.RESERVATION_REJECTED]: true,
  [NotificationType.RESERVATION_CANCELED]: true,
  
  // Social notifications
  [NotificationType.FRIEND_REQUEST]: true,
  [NotificationType.NEW_MESSAGE]: true,
  
  // Notification methods
  emailNotifications: true,
  pushNotifications: true,
};

interface NotificationItem {
  type: string;
  label: string;
}

interface NotificationGroup {
  title: string;
  items: NotificationItem[];
}

export function NotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettings>({ ...DEFAULT_SETTINGS });
  const [saving, setSaving] = useState(false);
  
  // Group notification types for better organization
  const notificationGroups: NotificationGroup[] = [
    {
      title: "Eventos",
      items: [
        { type: NotificationType.EVENT_INVITATION, label: "Convites para eventos" },
        { type: NotificationType.EVENT_REMINDER, label: "Lembretes de eventos" },
        { type: NotificationType.EVENT_CREATED, label: "Eventos criados por você" },
        { type: NotificationType.EVENT_UPDATED, label: "Atualizações em eventos" },
        { type: NotificationType.EVENT_CANCELED, label: "Eventos cancelados" },
        { type: NotificationType.EVENT_NEW_PARTICIPANT, label: "Novos participantes em eventos" },
        { type: NotificationType.EVENT_PARTICIPANT_LEFT, label: "Participantes que saíram de eventos" },
      ]
    },
    {
      title: "Reservas",
      items: [
        { type: NotificationType.RESERVATION_REQUEST, label: "Solicitações de reserva" },
        { type: NotificationType.RESERVATION_APPROVED, label: "Reservas aprovadas" },
        { type: NotificationType.RESERVATION_REJECTED, label: "Reservas rejeitadas" },
        { type: NotificationType.RESERVATION_CANCELED, label: "Reservas canceladas" },
      ]
    },
    {
      title: "Social",
      items: [
        { type: NotificationType.FRIEND_REQUEST, label: "Solicitações de amizade" },
        { type: NotificationType.NEW_MESSAGE, label: "Novas mensagens" },
      ]
    },
  ];
  
  // Update a specific setting
  const updateSetting = (key: string, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };
  
  // Enable all notifications
  const enableAll = () => {
    const updatedSettings = { ...settings };
    Object.keys(updatedSettings).forEach(key => {
      updatedSettings[key] = true;
    });
    setSettings(updatedSettings);
  };
  
  // Disable all notifications
  const disableAll = () => {
    const updatedSettings = { ...settings };
    Object.keys(updatedSettings).forEach(key => {
      updatedSettings[key] = false;
    });
    setSettings(updatedSettings);
  };
  
  // Save settings
  const saveSettings = async () => {
    setSaving(true);
    
    try {
      // This would be an API call to save notification preferences
      // await apiService.updateNotificationSettings(settings);
      
      // For now, we'll just show a success toast
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success("Preferências de notificação salvas com sucesso");
    } catch (error) {
      console.error("Error saving notification settings:", error);
      toast.error("Erro ao salvar preferências de notificação");
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações de Notificações</CardTitle>
        <CardDescription>
          Gerencie como e quando você recebe notificações
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Notification methods */}
        <div>
          <h3 className="text-lg font-medium mb-2">Métodos de Notificação</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-notifications" className="font-medium">Notificações por Email</Label>
                <p className="text-sm text-muted-foreground">
                  Receba notificações por email
                </p>
              </div>
              <Switch
                id="email-notifications"
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => updateSetting('emailNotifications', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="push-notifications" className="font-medium">Notificações Push</Label>
                <p className="text-sm text-muted-foreground">
                  Receba notificações no navegador e no aplicativo
                </p>
              </div>
              <Switch
                id="push-notifications"
                checked={settings.pushNotifications}
                onCheckedChange={(checked) => updateSetting('pushNotifications', checked)}
              />
            </div>
          </div>
        </div>
        
        <Separator />
        
        {/* Notification types */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-medium">Tipos de Notificação</h3>
            <div className="space-x-2">
              <Button variant="outline" size="sm" onClick={enableAll}>
                Ativar todos
              </Button>
              <Button variant="outline" size="sm" onClick={disableAll}>
                Desativar todos
              </Button>
            </div>
          </div>
          
          <div className="space-y-6">
            {notificationGroups.map((group) => (
              <div key={group.title}>
                <h4 className="font-medium mb-2">{group.title}</h4>
                <div className="space-y-3">
                  {group.items.map((item) => (
                    <div key={item.type} className="flex items-center justify-between">
                      <Label htmlFor={item.type}>{item.label}</Label>
                      <Switch
                        id={item.type}
                        checked={settings[item.type]}
                        onCheckedChange={(checked) => updateSetting(item.type, checked)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end space-x-2">
        <Button variant="outline" onClick={() => setSettings({ ...DEFAULT_SETTINGS })}>
          Restaurar Padrões
        </Button>
        <Button onClick={saveSettings} disabled={saving}>
          {saving ? "Salvando..." : "Salvar Configurações"}
        </Button>
      </CardFooter>
    </Card>
  );
}