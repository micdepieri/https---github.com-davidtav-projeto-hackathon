
"use client";

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useAuth, useDoc, useFirestore, useUser } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useMemo } from 'react';
import { doc } from 'firebase/firestore';
import Link from 'next/link';

const userAvatar = PlaceHolderImages.find((img) => img.id === 'user-avatar-1');

interface UserProfile {
    roles?: string[];
    displayName?: string;
}

export function DashboardHeader() {
  const auth = useAuth();
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const userProfileRef = useMemo(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);

  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);

  const isAdmin = useMemo(() => userProfile?.roles?.includes('admin'), [userProfile]);
  const displayName = useMemo(() => userProfile?.displayName || user?.displayName || 'Usuário', [userProfile, user]);
  const fallback = useMemo(() => displayName?.charAt(0).toUpperCase() || 'U', [displayName]);

  const handleLogout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      router.push('/login');
      toast({ title: 'Você saiu da sua conta.' });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao sair',
        description: 'Não foi possível fazer logout. Tente novamente.',
      });
    }
  };


  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur sm:px-6">
      <SidebarTrigger className="sm:hidden" />
      <div className="flex-1">{/* Can add breadcrumbs or title here */}</div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="overflow-hidden rounded-full"
          >
            <Avatar className="h-8 w-8">
              {user?.photoURL ? (
                <AvatarImage
                  src={user.photoURL}
                  alt={displayName}
                />
              ) : userAvatar && (
                <AvatarImage
                  src={userAvatar.imageUrl}
                  alt={userAvatar.description}
                  data-ai-hint={userAvatar.imageHint}
                />
              )}
              <AvatarFallback>{fallback}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{displayName}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {isAdmin && (
             <DropdownMenuItem asChild>
                <Link href="/dashboard/users">Configurações</Link>
             </DropdownMenuItem>
          )}
          <DropdownMenuItem>Suporte</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>Sair</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
