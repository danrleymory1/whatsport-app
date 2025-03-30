"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Plus, Trash } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import TomTomMap from "@/components/map/tomtom-map";
import { mapService } from "@/services/map-service";
import { apiService } from "@/services/api-service";

// Schema for event creation
const createEventSchema = z.object({
  title: z.string().min(3, "O título deve ter pelo menos 3 caracteres."),
  description: z.string().min(10, "A descrição deve ter pelo menos 10 caracteres."),
  sport_type: z.string().min(1, "Selecione um esporte."),
  skill_level: z.string().min(1, "Selecione um nível de habilidade."),
  start_date: z.date({ required_error: "Selecione uma data de início." }),
  start_time: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, "Formato de hora inválido."),
  end_date: z.date({ required_error: "Selecione uma data de término." }),
  end_time: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, "Formato de hora inválido."),
  max_participants: z.number().min(2, "Mínimo de 2 participantes."),
  price_per_person: z.number().optional(),
  is_private: z.boolean().default(false),
  location: z.object({
    address: z.string().min(1, "Endereço é obrigatório."),
    lat: z.number(),
    lng: z.number(),
  }),
  positions: z.array(
    z.object({
      name: z.string().min(1, "Nome da posição é obrigatório."),
      description: z.string().optional(),
      quantity: z.number().min(1, "Mínimo de 1 vaga."),
    })
  ).optional(),
}).refine(data => {
  const startDateTime = new Date(`${format(data.start_date, 'yyyy-MM-dd')}T${data.start_time}`);
  const endDateTime = new Date(`${format(data.end_date, 'yyyy-MM-dd')}T${data.end_time}`);
  return endDateTime > startDateTime;
}, {
  message: "A data/hora de término deve ser após a data/hora de início.",
  path: ["end_date"],
});

type CreateEventFormData = z.infer<typeof createEventSchema>;

// List of sports
const sports = [
  "Futebol", 
  "Vôlei", 
  "Basquete", 
  "Tênis", 
  "Beach Tennis", 
  "Futsal", 
  "Handebol",
  "Corrida",
  "Ciclismo",
  "Natação",
  "Padel",
  "Outro"
];

// Skill levels
const skillLevels = [
  "Iniciante",
  "Intermediário",
  "Avançado",
  "Todos os níveis"
];

export default function CreateEventPage() {
  const router = useRouter();
  const [searchAddress, setSearchAddress] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [positions, setPositions] = useState<{ name: string; description: string; quantity: number }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  
  const form = useForm<CreateEventFormData>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      title: "",
      description: "",
      sport_type: "",
      skill_level: "",
      max_participants: 10,
      price_per_person: 0,
      is_private: false,
      position: [],
      location: {
        address: "",
        lat: 0,
        lng: 0,
      },
    },
  });
  
  // Search address using TomTom API
  const handleAddressSearch = async () => {
    if (!searchAddress.trim()) return;
    
    setIsSearching(true);
    try {
      const results = await mapService.searchAddress(searchAddress);
      setSearchResults(results);
    } catch (error) {
      console.error("Error searching address:", error);
    } finally {
      setIsSearching(false);
    }
  };
  
  // Select address from search results
  const selectAddress = (result: any) => {
    const location = mapService.toLocation(result);
    form.setValue("location", location);
    setSearchResults([]);
  };
  
  // Add a position
  const addPosition = () => {
    setPositions([...positions, { name: "", description: "", quantity: 1 }]);
  };
  
  // Remove a position
  const removePosition = (index: number) => {
    const newPositions = [...positions];
    newPositions.splice(index, 1);
    setPositions(newPositions);
  };
  
  // Update position
  const updatePosition = (index: number, field: string, value: any) => {
    const newPositions = [...positions];
    (newPositions[index] as any)[field] = value;
    setPositions(newPositions);
    form.setValue("positions", newPositions);
  };
  
  // Form submission
  const onSubmit = async (data: CreateEventFormData) => {
    setSubmitting(true);
    
    try {
      // Format dates
      const startDateTime = new Date(`${format(data.start_date, 'yyyy-MM-dd')}T${data.start_time}`);
      const endDateTime = new Date(`${format(data.end_date, 'yyyy-MM-dd')}T${data.end_time}`);
      
      // Prepare data for API
      const eventData = {
        ...data,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        positions: positions.length > 0 ? positions : undefined,
      };
      
      // Create event
      const response = await apiService.createEvent(eventData);
      
      // Redirect to event page
      router.push(`/player/events/${response.data.id}`);
    } catch (error) {
      console.error("Error creating event:", error);
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Criar Novo Evento</h1>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
              <CardDescription>
                Detalhes gerais sobre o evento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título do Evento</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Partida de Futebol Semanal" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descreva os detalhes do evento..." 
                        {...field} 
                        rows={4}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="sport_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Esporte</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o esporte" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {sports.map((sport) => (
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
                  control={form.control}
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
                            <SelectValue placeholder="Selecione o nível" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {skillLevels.map((level) => (
                            <SelectItem key={level} value={level}>
                              {level}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="max_participants"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Máximo de Participantes</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={2}
                          {...field}
                          onChange={e => field.onChange(parseInt(e.target.value, 10))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="price_per_person"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preço por Pessoa (R$)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={0}
                          step={0.01}
                          {...field}
                          onChange={e => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Deixe como 0 se for gratuito
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="is_private"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between p-3 border rounded-md">
                    <div className="space-y-0.5">
                      <FormLabel>Evento Privado</FormLabel>
                      <FormDescription>
                        Eventos privados só são visíveis para pessoas convidadas
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Data e Horário</CardTitle>
              <CardDescription>
                Quando o evento irá acontecer
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="start_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data de Início</FormLabel>
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
                                format(field.value, "P", { locale: ptBR })
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
                            disabled={(date) => date < new Date()}
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
                  name="start_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Horário de Início</FormLabel>
                      <FormControl>
                        <Input
                          type="time"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="end_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data de Término</FormLabel>
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
                                format(field.value, "P", { locale: ptBR })
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
                            disabled={(date) => 
                              date < (form.getValues().start_date || new Date())
                            }
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
                  name="end_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Horário de Término</FormLabel>
                      <FormControl>
                        <Input
                          type="time"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Localização</CardTitle>
              <CardDescription>
                Onde o evento será realizado
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2">
                <Input
                  placeholder="Pesquisar endereço..."
                  value={searchAddress}
                  onChange={(e) => setSearchAddress(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  type="button" 
                  onClick={handleAddressSearch}
                  disabled={isSearching}
                >
                  {isSearching ? "Buscando..." : "Buscar"}
                </Button>
              </div>
              
              {searchResults.length > 0 && (
                <div className="border rounded-md max-h-60 overflow-y-auto">
                  <ul className="divide-y">
                    {searchResults.map((result, index) => (
                      <li 
                        key={index} 
                        className="p-2 hover:bg-muted cursor-pointer"
                        onClick={() => selectAddress(result)}
                      >
                        {result.address.freeformAddress}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <FormField
                control={form.control}
                name="location.address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endereço</FormLabel>
                    <FormControl>
                      <Input readOnly {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="h-64 rounded-md overflow-hidden border">
                {form.watch("location.lat") !== 0 && form.watch("location.lng") !== 0 ? (
                  <TomTomMap
                    apiKey={process.env.NEXT_PUBLIC_TOMTOM_KEY || ""}
                    initialCenter={{
                      lat: form.watch("location.lat"),
                      lng: form.watch("location.lng"),
                    }}
                    initialZoom={15}
                    height="100%"
                    events={[{
                      id: "new-event",
                      title: form.watch("title") || "Novo Evento",
                      location: {
                        lat: form.watch("location.lat"),
                        lng: form.watch("location.lng"),
                        address: form.watch("location.address"),
                      }
                    } as any]}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center bg-muted">
                    <p className="text-muted-foreground">
                      Selecione um endereço para visualizar no mapa
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Posições</CardTitle>
                  <CardDescription>
                    Posições ou vagas disponíveis no evento (opcional)
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addPosition}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Posição
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {positions.length === 0 ? (
                <div className="text-center py-6 border rounded-md bg-muted/20">
                  <p className="text-muted-foreground">
                    Adicione posições específicas para o seu evento (ex: Goleiro, Atacante, etc.)
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {positions.map((position, index) => (
                    <div key={index} className="border rounded-md p-4">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-medium">Posição {index + 1}</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removePosition(index)}
                        >
                          <Trash className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <FormLabel>Nome da Posição</FormLabel>
                            <Input
                              value={position.name}
                              onChange={(e) => updatePosition(index, "name", e.target.value)}
                              placeholder="Ex: Goleiro"
                            />
                          </div>
                          <div>
                            <FormLabel>Quantidade</FormLabel>
                            <Input
                              type="number"
                              min={1}
                              value={position.quantity}
                              onChange={(e) => updatePosition(index, "quantity", parseInt(e.target.value, 10))}
                            />
                          </div>
                        </div>
                        <div>
                          <FormLabel>Descrição (opcional)</FormLabel>
                          <Textarea
                            value={position.description}
                            onChange={(e) => updatePosition(index, "description", e.target.value)}
                            placeholder="Descreva os requisitos para esta posição..."
                            rows={2}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Criando..." : "Criar Evento"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}