
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useDoc, useFirestore, useCollection } from '@/firebase';
import { doc, collection, query } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { getUsers, updateUser } from '@/app/dashboard/actions';

import { Loader2, UserPlus, Edit } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  roles?: string[];
  cityId?: string;
}

interface City {
  id: string;
  name: string;
}

function EditUserDialog({ user, cities, onFinished }: { user: UserProfile; cities: City[]; onFinished: () => void }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleFinished = () => {
    onFinished();
    setIsOpen(false);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Usuário</DialogTitle>
        </DialogHeader>
        <EditUserForm user={user} cities={cities} onFinished={handleFinished} />
      </DialogContent>
    </Dialog>
  );
}

function EditUserForm({ user, cities, onFinished }: { user: UserProfile; cities: City[]; onFinished: () => void }) {
  const [displayName, setDisplayName] = useState(user.displayName);
  const [role, setRole] = useState(user.roles?.[0] || 'gestor_publico');
  const [cityId, setCityId] = useState(user.cityId || '');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    const formData = new FormData();
    formData.append('userId', user.id);
    formData.append('displayName', displayName);
    formData.append('role', role);
    if (cityId) {
        formData.append('cityId', cityId);
    }
    
    const result = await updateUser(formData);

    if (result.success) {
      toast({ title: 'Usuário Atualizado', description: 'Os dados do usuário foram salvos com sucesso.' });
      onFinished();
    } else {
      toast({ variant: 'destructive', title: 'Erro ao Salvar', description: result.error });
    }
    setIsSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
      <div className="grid gap-2">
        <Label htmlFor="displayName">Nome</Label>
        <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" value={user.email} disabled />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="role">Perfil</Label>
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione um perfil" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="gestor_publico">Gestor Público</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="city">Cidade</Label>
        <Select value={cityId} onValueChange={setCityId} disabled={role === 'admin'}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione uma cidade" />
          </SelectTrigger>
          <SelectContent>
             <SelectItem value="">Nenhuma</SelectItem>
            {cities.map((city) => (
              <SelectItem key={city.id} value={city.id}>
                {city.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" disabled={isSaving}>
        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Salvar Alterações
      </Button>
    </form>
  );
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  
  const { user: currentUser, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const userProfileRef = useMemo(() => {
    if (!currentUser || !firestore) return null;
    return doc(firestore, 'users', currentUser.uid);
  }, [currentUser, firestore]);
  const { data: userProfile, loading: profileLoading } = useDoc<UserProfile>(userProfileRef);

  const citiesQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'cities'));
  }, [firestore]);
  const { data: cities, loading: citiesLoading } = useCollection<City>(citiesQuery);

  const fetchUsers = async () => {
      setIsLoadingUsers(true);
      const result = await getUsers();
      if (result.success && result.data) {
          setUsers(result.data as UserProfile[]);
      } else {
          toast({ variant: 'destructive', title: 'Erro ao buscar usuários', description: result.error });
      }
      setIsLoadingUsers(false);
  }

  useEffect(() => {
    if (!userLoading && !profileLoading) {
      if (!currentUser) {
        router.push('/login');
        return;
      }
      const isAdmin = userProfile?.roles?.includes('admin');
      if (!isAdmin) {
        router.push('/dashboard');
        toast({
          variant: 'destructive',
          title: 'Acesso Negado',
          description: 'Você não tem permissão para acessar esta página.',
        });
      } else {
        fetchUsers();
      }
    }
  }, [currentUser, userProfile, userLoading, profileLoading, router, toast]);

  const onEditFinished = () => {
    fetchUsers(); // Refresh user list
  }
  
  const pageIsLoading = userLoading || profileLoading;
  const isAdmin = userProfile?.roles?.includes('admin');

  if (pageIsLoading || !isAdmin) {
    return (
      <div className="flex h-[calc(100vh-8rem)] w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="grid flex-1 items-start gap-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gerenciamento de Usuários</CardTitle>
              <CardDescription>Visualize, crie e edite usuários do sistema.</CardDescription>
            </div>
            {/* <Button><UserPlus className="mr-2 h-4 w-4" /> Novo Usuário</Button> */}
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingUsers || citiesLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Perfil</TableHead>
                  <TableHead>Cidade</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => {
                  const userCity = cities?.find(c => c.id === user.cityId);
                  return (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.displayName}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell className="capitalize">{user.roles?.join(', ').replace('_', ' ')}</TableCell>
                      <TableCell>{userCity?.name || 'N/A'}</TableCell>
                      <TableCell>
                        {cities && <EditUserDialog user={user} cities={cities} onFinished={onEditFinished} />}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
