"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { firebaseService } from "@/services/firebase-service";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Input 
} from "@/components/ui/input";
import { 
  Button 
} from "@/components/ui/button";
import { 
  Avatar, 
  AvatarFallback, 
  AvatarImage 
} from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  Users, 
  UserPlus, 
  Search, 
  MoreVertical, 
  MessageSquare, 
  UserMinus, 
  UserX, 
  CheckCircle, 
  XCircle,
  Settings,
  LogOut,
  Shield,
  Plus,
  Edit,
  RefreshCw,
  UserCheck,
  Eye,
  EyeOff,
  Mail,
  Trash
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import Link from "next/link";
import { useRouter } from "next/navigation";

// ------------------------------
// Types for social functionality
// ------------------------------

// Friend status types
enum FriendshipStatus {
  PENDING = "pending",
  ACCEPTED = "accepted",
  DECLINED = "declined",
  BLOCKED = "blocked"
}

// Friend object
interface Friend {
  id: string;
  user_id: string;
  name: string;
  email: string;
  profile_image?: string;
  status: FriendshipStatus;
  created_at: string;
  updated_at: string;
  requested_by: string;
  blocked_by?: string;
}

// User search result
interface UserSearchResult {
  id: string;
  name: string;
  email: string;
  profile_image?: string;
  friendship_status?: FriendshipStatus;
}

// Group member role
enum GroupMemberRole {
  ADMIN = "admin",
  MEMBER = "member",
}

// Group member
interface GroupMember {
  user_id: string;
  user_name: string;
  user_profile_image?: string;
  role: GroupMemberRole;
  joined_at: string;
}

// Group
interface Group {
  id: string;
  name: string;
  description?: string;
  creator_id: string;
  members: GroupMember[];
  photo?: string;
  is_private: boolean;
  created_at: string;
  updated_at: string;
}

// ------------------------------
// Form Schemas
// ------------------------------

// Schema for creating/editing groups
const groupFormSchema = z.object({
  name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
  description: z.string().optional(),
  is_private: z.boolean().default(false),
});

type GroupFormValues = z.infer<typeof groupFormSchema>;

// ------------------------------
// Main Component
// ------------------------------

export function FriendsGroups() {
  const { user } = useAuth();
  const router = useRouter();
  
  // State for friends
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Friend[]>([]);
  const [sentRequests, setSentRequests] = useState<Friend[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<Friend[]>([]);
  
  // State for groups
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  
  // Search and dialog states
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [addFriendDialogOpen, setAddFriendDialogOpen] = useState(false);
  const [createGroupDialogOpen, setCreateGroupDialogOpen] = useState(false);
  const [editGroupDialogOpen, setEditGroupDialogOpen] = useState(false);
  const [inviteToGroupDialogOpen, setInviteToGroupDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ action: string; id: string }>({ action: '', id: '' });
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [groupsLoading, setGroupsLoading] = useState(false);
  
  // Group form
  const groupForm = useForm<GroupFormValues>({
    resolver: zodResolver(groupFormSchema),
    defaultValues: {
      name: "",
      description: "",
      is_private: false,
    },
  });
  
  // ----------------------------
  // Data Fetching
  // ----------------------------
  
  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;
      
      setLoading(true);
      try {
        await Promise.all([
          fetchFriends(),
          fetchGroups()
        ]);
      } catch (error) {
        console.error("Error fetching social data:", error);
        toast.error("Erro ao carregar dados sociais");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user?.id]);
  
  // Fetch friends data
  const fetchFriends = async () => {
    if (!user?.id) return;
    
    setFriendsLoading(true);
    try {
      // Get all friendships
      const friendships = await firebaseService.getFriendships();
      
      // Separate into different categories
      const acceptedFriends: Friend[] = [];
      const pending: Friend[] = [];
      const sent: Friend[] = [];
      const blocked: Friend[] = [];
      
      friendships.forEach(friendship => {
        if (friendship.status === FriendshipStatus.ACCEPTED) {
          acceptedFriends.push(friendship);
        } else if (friendship.status === FriendshipStatus.PENDING) {
          if (friendship.requested_by === user.id) {
            sent.push(friendship);
          } else {
            pending.push(friendship);
          }
        } else if (friendship.status === FriendshipStatus.BLOCKED) {
          blocked.push(friendship);
        }
      });
      
      setFriends(acceptedFriends);
      setPendingRequests(pending);
      setSentRequests(sent);
      setBlockedUsers(blocked);
    } catch (error) {
      console.error("Error fetching friends:", error);
      toast.error("Erro ao carregar amigos");
    } finally {
      setFriendsLoading(false);
    }
  };
  
  // Fetch groups data
  const fetchGroups = async () => {
    if (!user?.id) return;
    
    setGroupsLoading(true);
    try {
      // Get user's groups
      const userGroups = await firebaseService.getUserGroups();
      setGroups(userGroups);
      
      // Set first group as selected if no group is selected
      if (userGroups.length > 0 && !selectedGroup) {
        setSelectedGroup(userGroups[0]);
      }
    } catch (error) {
      console.error("Error fetching groups:", error);
      toast.error("Erro ao carregar grupos");
    } finally {
      setGroupsLoading(false);
    }
  };
  
  // ----------------------------
  // Friend Functions
  // ----------------------------
  
  // Search for users
  const searchUsers = async () => {
    if (!searchQuery.trim()) return;
    
    setSearchLoading(true);
    try {
      const results = await firebaseService.searchUsers(searchQuery);
      
      // Filter out current user and mark friendship status
      const filteredResults = results.filter(result => result.id !== user?.id);
      
      // Mark friendship status for each user
      const enrichedResults = await Promise.all(
        filteredResults.map(async (result) => {
          const friendshipStatus = await firebaseService.getFriendshipStatus(user?.id || '', result.id);
          return {
            ...result,
            friendship_status: friendshipStatus
          };
        })
      );
      
      setSearchResults(enrichedResults);
    } catch (error) {
      console.error("Error searching users:", error);
      toast.error("Erro ao buscar usuários");
    } finally {
      setSearchLoading(false);
    }
  };
  
  // Send friend request
  const sendFriendRequest = async (userId: string) => {
    try {
      await firebaseService.sendFriendRequest(userId);
      
      // Update UI
      toast.success("Solicitação de amizade enviada");
      setSearchResults(prev => 
        prev.map(user => 
          user.id === userId 
            ? { ...user, friendship_status: FriendshipStatus.PENDING } 
            : user
        )
      );
      
      // Refresh friends lists
      fetchFriends();
    } catch (error) {
      console.error("Error sending friend request:", error);
      toast.error("Erro ao enviar solicitação de amizade");
    }
  };
  
  // Accept friend request
  const acceptFriendRequest = async (friendshipId: string) => {
    try {
      await firebaseService.respondToFriendRequest(friendshipId, true);
      
      toast.success("Solicitação de amizade aceita");
      
      // Refresh friends lists
      fetchFriends();
    } catch (error) {
      console.error("Error accepting friend request:", error);
      toast.error("Erro ao aceitar solicitação de amizade");
    }
  };
  
  // Decline friend request
  const declineFriendRequest = async (friendshipId: string) => {
    try {
      await firebaseService.respondToFriendRequest(friendshipId, false);
      
      toast.success("Solicitação de amizade recusada");
      
      // Refresh friends lists
      fetchFriends();
    } catch (error) {
      console.error("Error declining friend request:", error);
      toast.error("Erro ao recusar solicitação de amizade");
    }
  };
  
  // Cancel sent friend request
  const cancelFriendRequest = async (friendshipId: string) => {
    try {
      await firebaseService.cancelFriendRequest(friendshipId);
      
      toast.success("Solicitação de amizade cancelada");
      
      // Refresh friends lists
      fetchFriends();
    } catch (error) {
      console.error("Error canceling friend request:", error);
      toast.error("Erro ao cancelar solicitação de amizade");
    }
  };
  
  // Remove friend
  const removeFriend = async (friendshipId: string) => {
    try {
      await firebaseService.removeFriend(friendshipId);
      
      toast.success("Amigo removido com sucesso");
      
      // Refresh friends lists
      fetchFriends();
    } catch (error) {
      console.error("Error removing friend:", error);
      toast.error("Erro ao remover amigo");
    }
  };
  
  // Block user
  const blockUser = async (userId: string, friendshipId?: string) => {
    try {
      await firebaseService.blockUser(userId, friendshipId);
      
      toast.success("Usuário bloqueado com sucesso");
      
      // Refresh friends lists
      fetchFriends();
    } catch (error) {
      console.error("Error blocking user:", error);
      toast.error("Erro ao bloquear usuário");
    }
  };
  
  // Unblock user
  const unblockUser = async (friendshipId: string) => {
    try {
      await firebaseService.unblockUser(friendshipId);
      
      toast.success("Usuário desbloqueado com sucesso");
      
      // Refresh friends lists
      fetchFriends();
    } catch (error) {
      console.error("Error unblocking user:", error);
      toast.error("Erro ao desbloquear usuário");
    }
  };
  
  // Start chat with friend
  const startChat = (friendId: string, friendName: string) => {
    // Navigate to chat page with friend
    router.push(`/player/messages?friend=${friendId}&name=${encodeURIComponent(friendName)}`);
  };
  
  // ----------------------------
  // Group Functions
  // ----------------------------
  
  // Create group
  const createGroup = async (data: GroupFormValues) => {
    try {
      await firebaseService.createGroup({
        name: data.name,
        description: data.description || "",
        is_private: data.is_private
      });
      
      toast.success("Grupo criado com sucesso");
      setCreateGroupDialogOpen(false);
      groupForm.reset();
      
      // Refresh groups
      fetchGroups();
    } catch (error) {
      console.error("Error creating group:", error);
      toast.error("Erro ao criar grupo");
    }
  };
  
  // Edit group
  const editGroup = async (data: GroupFormValues) => {
    if (!selectedGroup) return;
    
    try {
      await firebaseService.updateGroup(selectedGroup.id, {
        name: data.name,
        description: data.description || "",
        is_private: data.is_private
      });
      
      toast.success("Grupo atualizado com sucesso");
      setEditGroupDialogOpen(false);
      
      // Refresh groups
      fetchGroups();
    } catch (error) {
      console.error("Error updating group:", error);
      toast.error("Erro ao atualizar grupo");
    }
  };
  
  // Leave group
  const leaveGroup = async (groupId: string) => {
    try {
      await firebaseService.leaveGroup(groupId);
      
      toast.success("Você saiu do grupo");
      
      // Refresh groups
      fetchGroups();
      
      // If current group was left, select another group
      if (selectedGroup?.id === groupId) {
        setSelectedGroup(null);
      }
    } catch (error) {
      console.error("Error leaving group:", error);
      toast.error("Erro ao sair do grupo");
    }
  };
  
  // Delete group
  const deleteGroup = async (groupId: string) => {
    try {
      await firebaseService.deleteGroup(groupId);
      
      toast.success("Grupo excluído com sucesso");
      
      // Refresh groups
      fetchGroups();
      
      // If current group was deleted, select another group
      if (selectedGroup?.id === groupId) {
        setSelectedGroup(null);
      }
    } catch (error) {
      console.error("Error deleting group:", error);
      toast.error("Erro ao excluir grupo");
    }
  };
  
  // Invite user to group
  const inviteToGroup = async (userId: string) => {
    if (!selectedGroup) return;
    
    try {
      await firebaseService.inviteToGroup(selectedGroup.id, userId);
      
      toast.success("Convite enviado com sucesso");
      
      // Refresh groups
      fetchGroups();
    } catch (error) {
      console.error("Error inviting to group:", error);
      toast.error("Erro ao convidar para o grupo");
    }
  };
  
  // Remove user from group
  const removeFromGroup = async (groupId: string, userId: string) => {
    try {
      await firebaseService.removeFromGroup(groupId, userId);
      
      toast.success("Usuário removido do grupo");
      
      // Refresh groups
      fetchGroups();
    } catch (error) {
      console.error("Error removing from group:", error);
      toast.error("Erro ao remover do grupo");
    }
  };
  
  // Change user role in group
  const changeGroupRole = async (groupId: string, userId: string, newRole: GroupMemberRole) => {
    try {
      await firebaseService.changeGroupRole(groupId, userId, newRole);
      
      toast.success(`Usuário agora é ${newRole === GroupMemberRole.ADMIN ? "administrador" : "membro"}`);
      
      // Refresh groups
      fetchGroups();
    } catch (error) {
      console.error("Error changing group role:", error);
      toast.error("Erro ao alterar função no grupo");
    }
  };
  
  // Open edit group dialog
  const openEditGroupDialog = () => {
    if (!selectedGroup) return;
    
    groupForm.reset({
      name: selectedGroup.name,
      description: selectedGroup.description || "",
      is_private: selectedGroup.is_private
    });
    
    setEditGroupDialogOpen(true);
  };
  
  // Handle confirmation dialog
  const openConfirmDialog = (action: string, id: string) => {
    setConfirmAction({ action, id });
    setConfirmDialogOpen(true);
  };
  
  // Execute confirmed action
  const executeConfirmedAction = async () => {
    const { action, id } = confirmAction;
    
    switch (action) {
      case 'removeFriend':
        await removeFriend(id);
        break;
      case 'blockUser':
        await blockUser(id);
        break;
      case 'leaveGroup':
        await leaveGroup(id);
        break;
      case 'deleteGroup':
        await deleteGroup(id);
        break;
      default:
        console.warn("Unknown action:", action);
    }
    
    setConfirmDialogOpen(false);
  };
  
  // Get user initials for avatar
  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .slice(0, 2)
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };
  
  // Check if user is group admin
  const isGroupAdmin = (group: Group) => {
    const currentUserMember = group.members.find(member => member.user_id === user?.id);
    return currentUserMember?.role === GroupMemberRole.ADMIN;
  };
  
  // ------------------------------
  // Render Component
  // ------------------------------
  
  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Amigos e Grupos</h1>
      
      <Tabs defaultValue="friends">
        <TabsList className="mb-6">
          <TabsTrigger value="friends">Amigos</TabsTrigger>
          <TabsTrigger value="groups">Grupos</TabsTrigger>
        </TabsList>
        
        {/* FRIENDS TAB */}
        <TabsContent value="friends">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Friends List Column */}
            <div className="md:col-span-2">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center">
                    <CardTitle>Meus Amigos</CardTitle>
                    <Dialog open={addFriendDialogOpen} onOpenChange={setAddFriendDialogOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <UserPlus className="mr-2 h-4 w-4" />
                          Adicionar Amigo
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Adicionar Amigo</DialogTitle>
                          <DialogDescription>
                            Busque por nome ou email para adicionar um amigo
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="flex gap-2 mb-4">
                          <Input
                            placeholder="Nome ou email"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                          />
                          <Button onClick={searchUsers} disabled={searchLoading}>
                            {searchLoading ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            ) : (
                              <Search className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        
                        <div className="max-h-[300px] overflow-y-auto">
                          {searchResults.length === 0 ? (
                            <div className="text-center py-4 text-muted-foreground">
                              {searchQuery ? "Nenhum usuário encontrado" : "Digite um nome ou email para buscar"}
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {searchResults.map((user) => (
                                <div key={user.id} className="flex justify-between items-center p-3 rounded-md border">
                                  <div className="flex items-center gap-3">
                                    <Avatar>
                                      <AvatarImage src={user.profile_image} />
                                      <AvatarFallback>{getUserInitials(user.name || user.email)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <p className="font-medium">{user.name || "Usuário"}</p>
                                      <p className="text-sm text-muted-foreground">{user.email}</p>
                                    </div>
                                  </div>
                                  
                                  {/* Action button based on friendship status */}
                                  {!user.friendship_status && (
                                    <Button onClick={() => sendFriendRequest(user.id)}>
                                      <UserPlus className="mr-2 h-4 w-4" />
                                      Adicionar
                                    </Button>
                                  )}
                                  
                                  {user.friendship_status === FriendshipStatus.PENDING && (
                                    <Badge>Solicitação Pendente</Badge>
                                  )}
                                  
                                  {user.friendship_status === FriendshipStatus.ACCEPTED && (
                                    <Badge variant="outline" className="bg-green-50 text-green-700">
                                      Já é amigo
                                    </Badge>
                                  )}
                                  
                                  {user.friendship_status === FriendshipStatus.BLOCKED && (
                                    <Badge variant="outline" className="bg-red-50 text-red-700">
                                      Bloqueado
                                    </Badge>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <CardDescription>
                    Você tem {friends.length} amigos
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {friendsLoading ? (
                    <div className="flex justify-center py-6">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : friends.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 mx-auto text-muted-foreground opacity-20" />
                      <p className="mt-4 text-muted-foreground">Você ainda não tem amigos</p>
                      <Button 
                        className="mt-4"
                        onClick={() => setAddFriendDialogOpen(true)}
                      >
                        <UserPlus className="mr-2 h-4 w-4" />
                        Adicionar Amigo
                      </Button>
                    </div>
                  ) : (
                    <div>
                      {/* Search friends */}
                      <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Buscar amigos..."
                          className="pl-10"
                        />
                      </div>
                      
                      {/* Friends list */}
                      <div className="space-y-2">
                        {friends.map((friend) => (
                          <div key={friend.id} className="flex justify-between items-center p-3 rounded-md border hover:bg-muted/30">
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarImage src={friend.profile_image} />
                                <AvatarFallback>{getUserInitials(friend.name || friend.email)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{friend.name || "Usuário"}</p>
                                <p className="text-sm text-muted-foreground">{friend.email}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => startChat(friend.user_id, friend.name)}
                              >
                                <MessageSquare className="h-4 w-4" />
                              </Button>
                              
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => startChat(friend.user_id, friend.name)}>
                                    <MessageSquare className="mr-2 h-4 w-4" />
                                    Enviar Mensagem
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => openConfirmDialog('removeFriend', friend.id)}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <UserMinus className="mr-2 h-4 w-4" />
                                    Remover Amigo
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => openConfirmDialog('blockUser', friend.user_id)}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <UserX className="mr-2 h-4 w-4" />
                                    Bloquear Usuário
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            {/* Pending Requests Column */}
            <div>
              <div className="space-y-6">
                {/* Incoming Friend Requests */}
                <Card>
                  <CardHeader>
                    <CardTitle>Solicitações de Amizade</CardTitle>
                    <CardDescription>
                      {pendingRequests.length} solicitações pendentes
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {pendingRequests.length === 0 ? (
                      <div className="text-center py-4">
                        <p className="text-muted-foreground">Nenhuma solicitação pendente</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {pendingRequests.map((request) => (
                          <div key={request.id} className="flex justify-between items-center p-3 rounded-md border">
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarImage src={request.profile_image} />
                                <AvatarFallback>{getUserInitials(request.name || request.email)}</AvatarFallback>
                              </Avatar>
                              <div>
                              <p className="font-medium">{request.name || "Usuário"}</p>
                                <p className="text-sm text-muted-foreground">
                                  Solicitado em {formatDate(request.created_at)}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-green-500 text-green-500 hover:bg-green-50"
                                onClick={() => acceptFriendRequest(request.id)}
                              >
                                <CheckCircle className="mr-1 h-3 w-3" />
                                Aceitar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-red-500 text-red-500 hover:bg-red-50"
                                onClick={() => declineFriendRequest(request.id)}
                              >
                                <XCircle className="mr-1 h-3 w-3" />
                                Recusar
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {/* Sent Friend Requests */}
                <Card>
                  <CardHeader>
                    <CardTitle>Solicitações Enviadas</CardTitle>
                    <CardDescription>
                      {sentRequests.length} solicitações aguardando resposta
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {sentRequests.length === 0 ? (
                      <div className="text-center py-4">
                        <p className="text-muted-foreground">Nenhuma solicitação enviada</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {sentRequests.map((request) => (
                          <div key={request.id} className="flex justify-between items-center p-3 rounded-md border">
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarImage src={request.profile_image} />
                                <AvatarFallback>{getUserInitials(request.name || request.email)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{request.name || "Usuário"}</p>
                                <p className="text-sm text-muted-foreground">
                                  Enviado em {formatDate(request.created_at)}
                                </p>
                              </div>
                            </div>
                            
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => cancelFriendRequest(request.id)}
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Cancelar
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {/* Blocked Users */}
                <Card>
                  <CardHeader>
                    <CardTitle>Usuários Bloqueados</CardTitle>
                    <CardDescription>
                      {blockedUsers.length} usuários bloqueados
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {blockedUsers.length === 0 ? (
                      <div className="text-center py-4">
                        <p className="text-muted-foreground">Nenhum usuário bloqueado</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {blockedUsers.map((blocked) => (
                          <div key={blocked.id} className="flex justify-between items-center p-3 rounded-md border">
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarImage src={blocked.profile_image} />
                                <AvatarFallback>{getUserInitials(blocked.name || blocked.email)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{blocked.name || "Usuário"}</p>
                                <p className="text-sm text-muted-foreground">
                                  Bloqueado em {formatDate(blocked.updated_at)}
                                </p>
                              </div>
                            </div>
                            
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => unblockUser(blocked.id)}
                            >
                              Desbloquear
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </TabsContent>
        
        {/* GROUPS TAB */}
        <TabsContent value="groups">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Groups List Column */}
            <div>
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Meus Grupos</CardTitle>
                    <Dialog open={createGroupDialogOpen} onOpenChange={setCreateGroupDialogOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="mr-2 h-4 w-4" />
                          Criar Grupo
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Criar Novo Grupo</DialogTitle>
                          <DialogDescription>
                            Crie um grupo para conectar-se com amigos
                          </DialogDescription>
                        </DialogHeader>
                        
                        <Form {...groupForm}>
                          <form onSubmit={groupForm.handleSubmit(createGroup)} className="space-y-4">
                            <FormField
                              control={groupForm.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Nome do Grupo</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Ex: Amigos do Futebol" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={groupForm.control}
                              name="description"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Descrição (opcional)</FormLabel>
                                  <FormControl>
                                    <Textarea
                                      placeholder="Descreva o propósito do grupo"
                                      {...field}
                                      value={field.value || ""}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={groupForm.control}
                              name="is_private"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                  <div className="space-y-0.5">
                                    <FormLabel>Grupo Privado</FormLabel>
                                    <FormDescription>
                                      Apenas membros convidados podem participar
                                    </FormDescription>
                                  </div>
                                  <FormControl>
                                    <Switch
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            
                            <DialogFooter>
                              <Button type="button" variant="outline" onClick={() => setCreateGroupDialogOpen(false)}>
                                Cancelar
                              </Button>
                              <Button type="submit">Criar Grupo</Button>
                            </DialogFooter>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <CardDescription>
                    Você participa de {groups.length} grupos
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  {groupsLoading ? (
                    <div className="flex justify-center py-6">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : groups.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 mx-auto text-muted-foreground opacity-20" />
                      <p className="mt-4 text-muted-foreground">Você ainda não participa de nenhum grupo</p>
                      <Button 
                        className="mt-4"
                        onClick={() => setCreateGroupDialogOpen(true)}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Criar Grupo
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {groups.map((group) => (
                        <div 
                          key={group.id} 
                          className={`flex items-center p-3 rounded-md border hover:bg-muted/30 cursor-pointer ${
                            selectedGroup?.id === group.id ? 'bg-muted/30 border-primary' : ''
                          }`}
                          onClick={() => setSelectedGroup(group)}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">{group.name}</h3>
                              {group.is_private && (
                                <Badge variant="outline" className="text-xs">
                                  <EyeOff className="h-3 w-3 mr-1" />
                                  Privado
                                </Badge>
                              )}
                              {isGroupAdmin(group) && (
                                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                                  <Shield className="h-3 w-3 mr-1" />
                                  Admin
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {group.members.length} {group.members.length === 1 ? 'membro' : 'membros'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            {/* Group Details Column */}
            <div className="md:col-span-2">
              <Card>
                {selectedGroup ? (
                  <>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {selectedGroup.name}
                            {selectedGroup.is_private && (
                              <Badge variant="outline" className="text-xs">
                                <EyeOff className="h-3 w-3 mr-1" />
                                Privado
                              </Badge>
                            )}
                          </CardTitle>
                          <CardDescription>
                            Criado em {formatDate(selectedGroup.created_at)}
                          </CardDescription>
                        </div>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Ações do Grupo</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            
                            {isGroupAdmin(selectedGroup) ? (
                              // Admin actions
                              <>
                                <DropdownMenuItem onClick={openEditGroupDialog}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Editar Grupo
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setInviteToGroupDialogOpen(true)}>
                                  <UserPlus className="mr-2 h-4 w-4" />
                                  Convidar Membros
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => openConfirmDialog('deleteGroup', selectedGroup.id)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash className="mr-2 h-4 w-4" />
                                  Excluir Grupo
                                </DropdownMenuItem>
                              </>
                            ) : (
                              // Member actions
                              <DropdownMenuItem 
                                onClick={() => openConfirmDialog('leaveGroup', selectedGroup.id)}
                                className="text-destructive focus:text-destructive"
                              >
                                <LogOut className="mr-2 h-4 w-4" />
                                Sair do Grupo
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-6">
                      {/* Group Description */}
                      {selectedGroup.description && (
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground mb-1">Descrição</h3>
                          <p>{selectedGroup.description}</p>
                        </div>
                      )}
                      
                      {/* Group Members */}
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="text-sm font-medium text-muted-foreground">Membros ({selectedGroup.members.length})</h3>
                          {isGroupAdmin(selectedGroup) && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setInviteToGroupDialogOpen(true)}
                            >
                              <UserPlus className="mr-2 h-3 w-3" />
                              Convidar
                            </Button>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          {selectedGroup.members.map((member) => (
                            <div key={member.user_id} className="flex justify-between items-center p-3 rounded-md border">
                              <div className="flex items-center gap-3">
                                <Avatar>
                                  <AvatarImage src={member.user_profile_image} />
                                  <AvatarFallback>{getUserInitials(member.user_name)}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-medium">{member.user_name}</p>
                                    {member.role === GroupMemberRole.ADMIN && (
                                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                                        Admin
                                      </Badge>
                                    )}
                                    {member.user_id === user?.id && (
                                      <Badge variant="outline" className="text-xs">
                                        Você
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    Entrou em {formatDate(member.joined_at)}
                                  </p>
                                </div>
                              </div>
                              
                              {/* Admin controls for other members */}
                              {isGroupAdmin(selectedGroup) && member.user_id !== user?.id && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Gerenciar Membro</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    {member.role === GroupMemberRole.MEMBER ? (
                                      <DropdownMenuItem onClick={() => changeGroupRole(selectedGroup.id, member.user_id, GroupMemberRole.ADMIN)}>
                                        <Shield className="mr-2 h-4 w-4" />
                                        Tornar Administrador
                                      </DropdownMenuItem>
                                    ) : (
                                      <DropdownMenuItem onClick={() => changeGroupRole(selectedGroup.id, member.user_id, GroupMemberRole.MEMBER)}>
                                        <UserCheck className="mr-2 h-4 w-4" />
                                        Tornar Membro
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem 
                                      onClick={() => removeFromGroup(selectedGroup.id, member.user_id)}
                                      className="text-destructive focus:text-destructive"
                                    >
                                      <UserMinus className="mr-2 h-4 w-4" />
                                      Remover do Grupo
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Group Actions */}
                      <div className="border-t pt-4 flex flex-wrap gap-2">
                        <Button asChild>
                          <Link href={`/player/groups/${selectedGroup.id}/chat`}>
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Chat do Grupo
                          </Link>
                        </Button>
                        
                        <Button variant="outline" onClick={() => fetchGroups()}>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Atualizar
                        </Button>
                      </div>
                    </CardContent>
                    
                    {/* Edit Group Dialog */}
                    <Dialog open={editGroupDialogOpen} onOpenChange={setEditGroupDialogOpen}>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Editar Grupo</DialogTitle>
                          <DialogDescription>
                            Altere as informações do grupo
                          </DialogDescription>
                        </DialogHeader>
                        
                        <Form {...groupForm}>
                          <form onSubmit={groupForm.handleSubmit(editGroup)} className="space-y-4">
                            <FormField
                              control={groupForm.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Nome do Grupo</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={groupForm.control}
                              name="description"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Descrição (opcional)</FormLabel>
                                  <FormControl>
                                    <Textarea
                                      {...field}
                                      value={field.value || ""}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={groupForm.control}
                              name="is_private"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                  <div className="space-y-0.5">
                                    <FormLabel>Grupo Privado</FormLabel>
                                    <FormDescription>
                                      Apenas membros convidados podem participar
                                    </FormDescription>
                                  </div>
                                  <FormControl>
                                    <Switch
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            
                            <DialogFooter>
                              <Button type="button" variant="outline" onClick={() => setEditGroupDialogOpen(false)}>
                                Cancelar
                              </Button>
                              <Button type="submit">Salvar Alterações</Button>
                            </DialogFooter>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
                    
                    {/* Invite to Group Dialog */}
                    <Dialog open={inviteToGroupDialogOpen} onOpenChange={setInviteToGroupDialogOpen}>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Convidar para o Grupo</DialogTitle>
                          <DialogDescription>
                            Convide amigos para participar do grupo {selectedGroup.name}
                          </DialogDescription>
                        </DialogHeader>
                        
                        <Command className="rounded-lg border shadow-md">
                          <CommandInput placeholder="Buscar amigos..." />
                          <CommandList>
                            <CommandEmpty>Nenhum amigo encontrado</CommandEmpty>
                            <CommandGroup heading="Meus Amigos">
                              {friends
                                // Filter out friends already in the group
                                .filter(friend => 
                                  !selectedGroup.members.some(member => 
                                    member.user_id === friend.user_id
                                  )
                                )
                                .map(friend => (
                                <CommandItem
                                  key={friend.id}
                                  onSelect={() => {
                                    inviteToGroup(friend.user_id);
                                    setInviteToGroupDialogOpen(false);
                                  }}
                                  className="flex items-center gap-2 p-2"
                                >
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={friend.profile_image} />
                                    <AvatarFallback>{getUserInitials(friend.name)}</AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <p className="text-sm font-medium">{friend.name}</p>
                                  </div>
                                  <UserPlus className="h-4 w-4 text-muted-foreground" />
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                        
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setInviteToGroupDialogOpen(false)}>
                            Cancelar
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center p-12">
                    <Users className="h-16 w-16 text-muted-foreground opacity-20" />
                    <h3 className="mt-4 text-lg font-medium">Nenhum grupo selecionado</h3>
                    <p className="mt-2 text-muted-foreground text-center">
                      Selecione um grupo para ver os detalhes ou crie um novo grupo
                    </p>
                    <Button 
                      className="mt-6"
                      onClick={() => setCreateGroupDialogOpen(true)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Criar Grupo
                    </Button>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction.action === 'removeFriend' && "Remover Amigo"}
              {confirmAction.action === 'blockUser' && "Bloquear Usuário"}
              {confirmAction.action === 'leaveGroup' && "Sair do Grupo"}
              {confirmAction.action === 'deleteGroup' && "Excluir Grupo"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction.action === 'removeFriend' && "Tem certeza que deseja remover este amigo? Esta ação não pode ser desfeita."}
              {confirmAction.action === 'blockUser' && "Tem certeza que deseja bloquear este usuário? Ele não poderá mais interagir com você."}
              {confirmAction.action === 'leaveGroup' && "Tem certeza que deseja sair deste grupo?"}
              {confirmAction.action === 'deleteGroup' && "Tem certeza que deseja excluir este grupo? Esta ação não pode ser desfeita."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeConfirmedAction}
              className={confirmAction.action === 'blockUser' || confirmAction.action === 'deleteGroup' ? 'bg-destructive hover:bg-destructive/90' : ''}
            >
              {confirmAction.action === 'removeFriend' && "Remover"}
              {confirmAction.action === 'blockUser' && "Bloquear"}
              {confirmAction.action === 'leaveGroup' && "Sair"}
              {confirmAction.action === 'deleteGroup' && "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}