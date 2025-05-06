// src/components/manager/profile.tsx
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
import { BankingInfo, CompanyInfo, UserType } from "@/types/user";
import { useRouter } from "next/navigation";


export function ManagerProfile() {
  const { user, userEmail, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    position: "",
    company_info: {
      name: "",
      legal_name: "",
      tax_id: "",
      address: "",
      phone: ""
    } as CompanyInfo,
    banking_info: {
      bank_name: "",
      account_type: "",
      account_number: "",
      branch_number: "",
      pix_key: ""
    } as BankingInfo
  });
  
  // Load user data
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
        position: user.position || "",
        company_info: user.company_info || {
          name: "",
          legal_name: "",
          tax_id: "",
          address: "",
          phone: ""
        },
        banking_info: user.banking_info || {
          bank_name: "",
          account_type: "",
          account_number: "",
          branch_number: "",
          pix_key: ""
        }
      });
    }
  }, [user]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      // Handle nested fields (company_info, banking_info)
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as Record<string, any> || {}),
          [child]: value
        }
      }));
    } else {
      // Handle regular fields
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      
      const updatedData = {
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        position: formData.position,
        company_info: formData.company_info,
        banking_info: formData.banking_info
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

  const initials = user?.name 
    ? user.name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
    : userEmail 
      ? userEmail.substring(0, 2).toUpperCase() 
      : "U";

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Perfil do Gerente</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <Card>
            <CardHeader className="flex flex-col items-center">
              <Avatar className="h-24 w-24">
                <AvatarImage src={user?.profile_image || ""} alt={user?.name || userEmail || ""} />
                <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
              </Avatar>
              <CardTitle className="mt-4">{user?.name || userEmail}</CardTitle>
              <CardDescription>Gerente de Espaço</CardDescription>
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
                          <Label htmlFor="position">Cargo</Label>
                          <Input 
                            id="position"
                            name="position"
                            value={formData.position} 
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="address">Endereço Comercial</Label>
                        <Input 
                          id="address" 
                          name="address"
                          value={formData.address} 
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
                          <h3 className="text-sm font-medium text-muted-foreground">Cargo</h3>
                          <p>{user?.position || "—"}</p>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Endereço Comercial</h3>
                        <p>{user?.address || "—"}</p>
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
            
            <TabsContent value="company" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Dados da Empresa</CardTitle>
                  <CardDescription>
                    Informações da empresa que gerencia os espaços
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="company_name">Nome Fantasia</Label>
                          <Input 
                            id="company_name" 
                            name="company_info.name"
                            value={formData.company_info.name} 
                            onChange={handleInputChange}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="legal_name">Razão Social</Label>
                          <Input 
                            id="legal_name" 
                            name="company_info.legal_name"
                            value={formData.company_info.legal_name} 
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="tax_id">CNPJ</Label>
                          <Input 
                            id="tax_id" 
                            name="company_info.tax_id"
                            value={formData.company_info.tax_id} 
                            onChange={handleInputChange}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="company_phone">Telefone Comercial</Label>
                          <Input 
                            id="company_phone" 
                            name="company_info.phone"
                            value={formData.company_info.phone} 
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="company_address">Endereço da Sede</Label>
                        <Input 
                          id="company_address" 
                          name="company_info.address"
                          value={formData.company_info.address} 
                          onChange={handleInputChange}
                        />
                      </div>
                      
                      <Button 
                        onClick={handleSaveProfile}
                        disabled={loading}
                      >
                        {loading ? "Salvando..." : "Salvar Alterações"}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Nome Fantasia</h3>
                          <p>{user?.company_info?.name || "—"}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Razão Social</h3>
                          <p>{user?.company_info?.legal_name || "—"}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">CNPJ</h3>
                          <p>{user?.company_info?.tax_id || "—"}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Telefone Comercial</h3>
                          <p>{user?.company_info?.phone || "—"}</p>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Endereço da Sede</h3>
                        <p>{user?.company_info?.address || "—"}</p>
                      </div>
                      
                      <Button variant="outline" onClick={() => setIsEditing(true)}>Editar Dados da Empresa</Button>
                    </div>
                  )}
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
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="bank_name">Banco</Label>
                          <Input 
                            id="bank_name" 
                            name="banking_info.bank_name"
                            value={formData.banking_info.bank_name} 
                            onChange={handleInputChange}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="branch_number">Agência</Label>
                          <Input 
                            id="branch_number" 
                            name="banking_info.branch_number"
                            value={formData.banking_info.branch_number} 
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="account_number">Conta</Label>
                          <Input 
                            id="account_number" 
                            name="banking_info.account_number"
                            value={formData.banking_info.account_number} 
                            onChange={handleInputChange}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="account_type">Tipo de Conta</Label>
                          <Input 
                            id="account_type" 
                            name="banking_info.account_type"
                            value={formData.banking_info.account_type} 
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="pix_key">Chave PIX</Label>
                        <Input 
                          id="pix_key" 
                          name="banking_info.pix_key"
                          value={formData.banking_info.pix_key} 
                          onChange={handleInputChange}
                        />
                      </div>
                      
                      <Button 
                        onClick={handleSaveProfile}
                        disabled={loading}
                      >
                        {loading ? "Salvando..." : "Salvar Alterações"}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Banco</h3>
                          <p>{user?.banking_info?.bank_name || "—"}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Agência</h3>
                          <p>{user?.banking_info?.branch_number || "—"}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Conta</h3>
                          <p>{user?.banking_info?.account_number || "—"}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Tipo de Conta</h3>
                          <p>{user?.banking_info?.account_type || "—"}</p>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Chave PIX</h3>
                        <p>{user?.banking_info?.pix_key || "—"}</p>
                      </div>
                      
                      <Button variant="outline" onClick={() => setIsEditing(true)}>Editar Dados Bancários</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}