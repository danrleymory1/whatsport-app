// src/components/manager/space-detail.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Space } from "@/types/space";
import { MapPin, Building, Calendar, Users, Edit, Trash, Clock, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { firebaseService } from "@/services/firebase-service";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface SpaceDetailProps {
  space: Space;
}

export function SpaceDetail({ space }: SpaceDetailProps) {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  
  // Navigate to edit page
  const handleEdit = () => {
    router.push(`/manager/spaces/${space.id}/edit`);
  };
  
  // Delete space
  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      
      // Call to delete space would go here
      // await firebaseService.deleteSpace(space.id);
      
      toast.success("Espaço excluído com sucesso");
      router.push("/manager/spaces");
    } catch (error) {
      console.error("Error deleting space:", error);
      toast.error("Erro ao excluir espaço");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };
  
  // Get day name
  const getDayName = (day: string) => {
    const days = [
      "Segunda-feira",
      "Terça-feira",
      "Quarta-feira",
      "Quinta-feira",
      "Sexta-feira",
      "Sábado",
      "Domingo"
    ];
    
    return days[parseInt(day)];
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">{space.name}</h1>
          <p className="text-muted-foreground">{space.location.address}</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleEdit}>
            <Edit className="h-4 w-4 mr-2" /> Editar
          </Button>
          <Button 
            variant="destructive"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash className="h-4 w-4 mr-2" /> Excluir
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Detalhes do Espaço</CardTitle>
              <CardDescription>
                Informações sobre o espaço esportivo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Descrição</h3>
                <p className="text-muted-foreground">{space.description}</p>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Localização</h3>
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>{space.location.address}</span>
                </div>
                {space.location.city && (
                  <div className="flex items-center mt-1">
                    <Building className="h-4 w-4 mr-2" />
                    <span>{space.location.city}, {space.location.state}</span>
                  </div>
                )}
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Comodidades</h3>
                <div className="flex flex-wrap gap-2">
                  {space.amenities && space.amenities.length > 0 ? (
                    space.amenities.map((amenity) => (
                      <Badge key={amenity} variant="outline">
                        {amenity}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-muted-foreground">Nenhuma comodidade cadastrada</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Tabs defaultValue="sports">
            <TabsList className="w-full">
              <TabsTrigger value="sports">Esportes</TabsTrigger>
              <TabsTrigger value="hours">Horários</TabsTrigger>
              <TabsTrigger value="reservations">Reservas</TabsTrigger>
            </TabsList>
            
            <TabsContent value="sports" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Esportes Disponíveis</CardTitle>
                  <CardDescription>
                    Gerencia os esportes oferecidos neste espaço
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {space.available_sports && space.available_sports.length > 0 ? (
                    <div className="space-y-4">
                      {space.available_sports.map((sport, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <h3 className="font-medium">{sport.sport_type}</h3>
                            <Badge>
                              {formatCurrency(sport.price_per_hour)}/hora
                            </Badge>
                          </div>
                          
                          <div className="flex items-center mt-2 text-sm text-muted-foreground">
                            <Users className="h-4 w-4 mr-1" />
                            <span>Capacidade máxima: {sport.max_participants} pessoas</span>
                          </div>
                          
                          {sport.description && (
                            <p className="mt-2 text-sm text-muted-foreground">
                              {sport.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center py-6 text-muted-foreground">
                      Nenhum esporte cadastrado
                    </p>
                  )}
                </CardContent>
                <CardFooter>
                  <Button onClick={handleEdit} className="w-full">
                    Gerenciar Esportes
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="hours" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Horários de Funcionamento</CardTitle>
                  <CardDescription>
                    Horários em que o espaço está disponível
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {space.opening_hours ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {Object.entries(space.opening_hours).map(([day, hours]) => (
                        <div key={day} className="border rounded-lg p-4">
                          <h3 className="font-medium">{getDayName(day)}</h3>
                          <div className="flex items-center mt-2 text-sm">
                            <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                            <span>{hours.opens_at} - {hours.closes_at}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center py-6 text-muted-foreground">
                      Horários não definidos
                    </p>
                  )}
                </CardContent>
                <CardFooter>
                  <Button onClick={handleEdit} className="w-full">
                    Editar Horários
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="reservations" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Reservas</CardTitle>
                  <CardDescription>
                    Visualize as reservas para este espaço
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-center py-6 text-muted-foreground">
                    Sem reservas para exibir. Vá para a seção de Reservas para ver todas as reservas.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button asChild className="w-full">
                    <a href="/manager/reservations">Ver Todas as Reservas</a>
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        <div>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Estatísticas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Reservas Totais</span>
                <span className="font-medium">0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Faturamento</span>
                <span className="font-medium">R$ 0,00</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Taxa de Ocupação</span>
                <span className="font-medium">0%</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <a href="/manager/reservations">
                  <Calendar className="h-4 w-4 mr-2" />
                  Ver Reservas
                </a>
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={handleEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Editar Espaço
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <a href="/manager/spaces">
                  <Building className="h-4 w-4 mr-2" />
                  Todos os Espaços
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Espaço</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este espaço? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}