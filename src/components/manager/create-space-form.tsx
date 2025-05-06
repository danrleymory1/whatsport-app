// src/app/components/manager/create-space-form.tsx
"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { firebaseService } from "@/services/firebase-service";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash, Building, MapPin, Calendar } from "lucide-react";
import { googleMapsService } from "@/services/google-maps-service";
import { auth } from "@/lib/firebase";

// Define schema for opening hours
const openingHoursSchema = z.record(
  z.string(), // Day of week (0-6)
  z.object({
    opens_at: z.string(),
    closes_at: z.string(),
  })
  );


// Define schema for space
const spaceSchema = z.object({
  name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
  description: z.string().min(10, "A descrição deve ter pelo menos 10 caracteres"),
  location: z.object({
    address: z.string().min(1, "Endereço é obrigatório"),
    city: z.string().optional(),
    state: z.string().optional(),
    postal_code: z.string().optional(),
    lat: z.number(),
    lng: z.number(),
  }),
  available_sports: z.array(
    z.object({
      sport_type: z.string().min(1, "Tipo de esporte é obrigatório"),
      price_per_hour: z.number().min(0, "Preço deve ser maior ou igual a zero"),
      max_participants: z.number().min(1, "Número mínimo de participantes é 1"),
      description: z.string().optional(),
    })
  ).min(1, "Adicione pelo menos um esporte"),
  amenities: z.array(z.string()).optional(),
  opening_hours: openingHoursSchema,
});

type CreateSpaceFormValues = z.infer<typeof spaceSchema>;

// Week days for opening hours
const weekDays = [
  { value: "0", label: "Segunda-feira" },
  { value: "1", label: "Terça-feira" },
  { value: "2", label: "Quarta-feira" },
  { value: "3", label: "Quinta-feira" },
  { value: "4", label: "Sexta-feira" },
  { value: "5", label: "Sábado" },
  { value: "6", label: "Domingo" },
];

// Common amenities
const commonAmenities = [
  { id: "parking", label: "Estacionamento" },
  { id: "shower", label: "Chuveiros" },
  { id: "locker", label: "Vestiários" },
  { id: "water", label: "Bebedouros" },
  { id: "wifi", label: "Wi-Fi" },
  { id: "lighting", label: "Iluminação noturna" },
  { id: "restroom", label: "Banheiros" },
  { id: "cafe", label: "Cafeteria/Lanchonete" },
  { id: "accessibility", label: "Acessibilidade" },
];

// Common sports
const commonSports = [
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
  "Musculação",
  "Dança",
  "Padel",
];

export function CreateSpaceForm() {
  const router = useRouter();
  const [searchAddress, setSearchAddress] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with default values
  const form = useForm<CreateSpaceFormValues>({
    resolver: zodResolver(spaceSchema),
    defaultValues: {
      name: "",
      description: "",
      location: {
        address: "",
        city: "",
        state: "",
        postal_code: "",
        lat: 0,
        lng: 0,
      },
      available_sports: [
        {
          sport_type: "",
          price_per_hour: 0,
          max_participants: 10,
          description: "",
        },
      ],
      amenities: [],
      opening_hours: {
        "0": { opens_at: "08:00", closes_at: "22:00" },
        "1": { opens_at: "08:00", closes_at: "22:00" },
        "2": { opens_at: "08:00", closes_at: "22:00" },
        "3": { opens_at: "08:00", closes_at: "22:00" },
        "4": { opens_at: "08:00", closes_at: "22:00" },
        "5": { opens_at: "08:00", closes_at: "22:00" },
        "6": { opens_at: "08:00", closes_at: "22:00" },
      },
    },
  });

  // Use field array for sports
  const { fields: sportsFields, append: appendSport, remove: removeSport } = useFieldArray({
    control: form.control,
    name: "available_sports",
  });

  // Search address
  const handleAddressSearch = async () => {
    if (!searchAddress.trim()) return;

    setIsSearching(true);
    try {
      const results = await googleMapsService.searchAddress(searchAddress);
      setSearchResults(results);
    } catch (error) {
      console.error("Error searching address:", error);
      toast.error("Erro ao buscar endereço");
    } finally {
      setIsSearching(false);
    }
  };

  // Select address
  const selectAddress = (result: any) => {
    const location = googleMapsService.toLocation(result);
    form.setValue("location", {
      address: location.address || "",
      city: location.city || "",
      state: location.state || "",
      postal_code: location.postal_code || "",
      lat: location.lat,
      lng: location.lng,
    });
    setSearchResults([]);
  };

  // Toggle amenities
  const toggleAmenity = (amenity: string) => {
    const currentAmenities = form.getValues("amenities") || [];
    if (currentAmenities.includes(amenity)) {
      form.setValue(
        "amenities",
        currentAmenities.filter((a) => a !== amenity)
      );
    } else {
      form.setValue("amenities", [...currentAmenities, amenity]);
    }
  };

  // Submit form
  const onSubmit = async (data: CreateSpaceFormValues) => {
    setIsSubmitting(true);
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        toast.error("Usuário não autenticado");
        return;
      }
      
      const response = await firebaseService.createSpace(data, userId);
      toast.success("Espaço criado com sucesso!");
      
      // Redirect to space detail or spaces list
      router.push(`/manager/spaces/${response.id}`);
    } catch (error: any) {
      console.error("Error creating space:", error);
      toast.error(error.message || "Erro ao criar espaço");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Cadastrar Novo Espaço</h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid grid-cols-4 mb-8">
              <TabsTrigger value="basic">Informações Básicas</TabsTrigger>
              <TabsTrigger value="location">Localização</TabsTrigger>
              <TabsTrigger value="sports">Esportes</TabsTrigger>
              <TabsTrigger value="hours">Horários e Comodidades</TabsTrigger>
            </TabsList>

            {/* Basic Information */}
            <TabsContent value="basic">
              <Card>
                <CardHeader>
                  <CardTitle>Informações Básicas</CardTitle>
                  <CardDescription>
                    Forneça as informações básicas do seu espaço esportivo
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Espaço</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Arena Sports Center" {...field} />
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
                            placeholder="Descreva seu espaço, incluindo características, diferenciais e outras informações relevantes"
                            {...field}
                            rows={5}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Location */}
            <TabsContent value="location">
              <Card>
                <CardHeader>
                  <CardTitle>Localização</CardTitle>
                  <CardDescription>Informe a localização do seu espaço</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Buscar Endereço</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Digite o endereço para buscar"
                        value={searchAddress}
                        onChange={(e) => setSearchAddress(e.target.value)}
                      />
                      <Button
                        type="button"
                        onClick={handleAddressSearch}
                        disabled={isSearching}
                      >
                        {isSearching ? "Buscando..." : "Buscar"}
                      </Button>
                    </div>
                  </div>

                  {searchResults.length > 0 && (
                    <Card>
                      <CardContent className="p-2 max-h-60 overflow-y-auto">
                        <ul className="divide-y divide-gray-200">
                          {searchResults.map((result, index) => (
                            <li
                              key={index}
                              className="py-2 px-2 hover:bg-gray-50 cursor-pointer"
                              onClick={() => selectAddress(result)}
                            >
                              {result.address.freeformAddress}
                              {result.address.countrySubdivision &&
                                `, ${result.address.countrySubdivision}`}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  <FormField
                    control={form.control}
                    name="location.address"
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

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="location.city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cidade</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="location.state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estado</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="location.postal_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CEP</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Hidden latitude and longitude */}
                  <input
                    type="hidden"
                    {...form.register("location.lat", { valueAsNumber: true })}
                  />
                  <input
                    type="hidden"
                    {...form.register("location.lng", { valueAsNumber: true })}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Sports */}
            <TabsContent value="sports">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Esportes Disponíveis</CardTitle>
                      <CardDescription>
                        Adicione os esportes disponíveis no seu espaço
                      </CardDescription>
                    </div>
                    <Button
                      type="button"
                      onClick={() =>
                        appendSport({
                          sport_type: "",
                          price_per_hour: 0,
                          max_participants: 10,
                          description: "",
                        })
                      }
                    >
                      <Plus className="mr-2 h-4 w-4" /> Adicionar Esporte
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {sportsFields.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                      Nenhum esporte adicionado. Clique em "Adicionar Esporte" acima.
                    </div>
                  ) : (
                    sportsFields.map((field, index) => (
                      <Card key={field.id} className="border">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-base">Esporte {index + 1}</CardTitle>
                            {sportsFields.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeSport(index)}
                              >
                                <Trash className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-0">
                          <FormField
                            control={form.control}
                            name={`available_sports.${index}.sport_type`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Tipo de Esporte</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    list="sport-suggestions"
                                    placeholder="Ex: Futebol, Tênis, Basquete"
                                  />
                                </FormControl>
                                <datalist id="sport-suggestions">
                                  {commonSports.map((sport) => (
                                    <option key={sport} value={sport} />
                                  ))}
                                </datalist>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name={`available_sports.${index}.price_per_hour`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Preço por Hora (R$)</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      {...field}
                                      onChange={(e) =>
                                        field.onChange(parseFloat(e.target.value))
                                      }
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`available_sports.${index}.max_participants`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Capacidade Máxima</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      min="1"
                                      {...field}
                                      onChange={(e) =>
                                        field.onChange(parseInt(e.target.value))
                                      }
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={form.control}
                            name={`available_sports.${index}.description`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Descrição (opcional)</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Detalhes sobre a quadra, equipamentos disponíveis, etc."
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </CardContent>
                      </Card>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Hours and Amenities */}
            <TabsContent value="hours">
              <Card>
                <CardHeader>
                  <CardTitle>Horários de Funcionamento</CardTitle>
                  <CardDescription>
                    Defina os horários de funcionamento do seu espaço
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {weekDays.map((day) => (
                      <div key={day.value} className="border p-4 rounded-md">
                        <h3 className="font-medium mb-2">{day.label}</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Abre às</Label>
                            <Input
                              type="time"
                              {...form.register(`opening_hours.${day.value}.opens_at`)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Fecha às</Label>
                            <Input
                              type="time"
                              {...form.register(`opening_hours.${day.value}.closes_at`)}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Comodidades</CardTitle>
                  <CardDescription>Selecione as comodidades disponíveis no seu espaço</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {commonAmenities.map((amenity) => (
                      <div key={amenity.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={amenity.id}
                          checked={form.watch("amenities")?.includes(amenity.id)}
                          onCheckedChange={() => toggleAmenity(amenity.id)}
                        />
                        <Label htmlFor={amenity.id}>{amenity.label}</Label>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Criando..." : "Criar Espaço"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
