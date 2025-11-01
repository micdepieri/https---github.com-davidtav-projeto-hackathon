
'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Leaf, Loader2 } from 'lucide-react';
import { useAuth, useFirestore, useUser, useCollection } from '@/firebase';
import { GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, type User as FirebaseUser } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, collection, query } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { seedInitialData } from '@/app/dashboard/actions';

function GoogleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px">
      <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
      <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
      <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.223,0-9.655-3.417-11.297-7.915l-6.573,4.817C9.86,39.625,16.425,44,24,44z" />
      <path fill="#1976D2" d="M43.611,20.083L43.595,20L42,20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C39.99,34.556,44,28.717,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
    </svg>
  );
}

const signInSchema = z.object({
  email: z.string().email('E-mail inválido.'),
  password: z.string().min(1, 'A senha é obrigatória.'),
});
type SignInFormValues = z.infer<typeof signInSchema>;

const signUpSchema = z.object({
  displayName: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres.'),
  email: z.string().email('E-mail inválido.'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres.'),
  cityId: z.string().optional(),
});
type SignUpFormValues = z.infer<typeof signUpSchema>;

interface City {
    id: string;
    name: string;
}

export default function LoginPage() {
  const { user, loading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const citiesQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'cities'));
  }, [firestore]);
  
  const { data: cities, loading: citiesLoading } = useCollection<City>(citiesQuery);

  const signInForm = useForm<SignInFormValues>({ resolver: zodResolver(signInSchema) });
  const signUpForm = useForm<SignUpFormValues>({ resolver: zodResolver(signUpSchema) });

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  const handleUserCreation = async (user: FirebaseUser, cityId?: string) => {
    if (!firestore || !user) return;
    const userRef = doc(firestore, 'users', user.uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      const roles = cityId ? ['gestor_publico'] : ['admin'];
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        roles: roles,
        cityId: cityId || null,
      }, { merge: true });
      toast({ title: "Bem-vindo!", description: "Sua conta foi criada." });
    } else {
      await setDoc(userRef, { lastLogin: serverTimestamp() }, { merge: true });
    }
    router.push('/dashboard');
  };

  const handleGoogleSignIn = async () => {
    if (!auth) return;
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      // For Google sign-in, we can't ask for a city, so they become admins by default
      // or we can implement a post-login step to choose a city.
      // For now, let's make them admins.
      await handleUserCreation(result.user);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Falha na autenticação", description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignIn = async ({ email, password }: SignInFormValues) => {
    if (!auth) return;
    setIsLoading(true);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      await handleUserCreation(result.user);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Falha na autenticação", description: error.code === 'auth/invalid-credential' ? 'E-mail ou senha inválidos.' : error.message });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleEmailSignUp = async ({ displayName, email, password, cityId }: SignUpFormValues) => {
    if (!auth) return;
    setIsLoading(true);
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(result.user, { displayName });
      // reload user to get the updated profile
      await result.user.reload(); 
      const updatedUser = auth.currentUser;
      if(updatedUser) {
        await handleUserCreation(updatedUser, cityId);
      }
    } catch (error: any)      {
      toast({ variant: "destructive", title: "Falha no cadastro", description: error.code === 'auth/email-already-in-use' ? 'Este e-mail já está em uso.' : error.message });
    } finally {
      setIsLoading(false);
    }
  };


  if (loading || user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <main className="flex h-screen w-screen flex-col items-center justify-center bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex justify-center">
            <Leaf className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl">Cool Cities Climate Planner</CardTitle>
          <CardDescription>Acesse seu painel de planejamento climático.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Criar Conta</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <form onSubmit={signInForm.handleSubmit(handleEmailSignIn)} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">E-mail</Label>
                  <Input id="signin-email" type="email" placeholder="nome@exemplo.com" {...signInForm.register('email')} />
                  {signInForm.formState.errors.email && <p className="text-sm text-destructive">{signInForm.formState.errors.email.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Senha</Label>
                  <Input id="signin-password" type="password" {...signInForm.register('password')} />
                  {signInForm.formState.errors.password && <p className="text-sm text-destructive">{signInForm.formState.errors.password.message}</p>}
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                   {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Entrar
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={signUpForm.handleSubmit(handleEmailSignUp)} className="space-y-4 pt-4">
                 <div className="space-y-2">
                  <Label htmlFor="signup-name">Nome</Label>
                  <Input id="signup-name" placeholder="Seu Nome" {...signUpForm.register('displayName')} />
                  {signUpForm.formState.errors.displayName && <p className="text-sm text-destructive">{signUpForm.formState.errors.displayName.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">E-mail</Label>
                  <Input id="signup-email" type="email" placeholder="nome@exemplo.com" {...signUpForm.register('email')} />
                  {signUpForm.formState.errors.email && <p className="text-sm text-destructive">{signUpForm.formState.errors.email.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Senha</Label>
                  <Input id="signup-password" type="password" {...signUpForm.register('password')} />
                   {signUpForm.formState.errors.password && <p className="text-sm text-destructive">{signUpForm.formState.errors.password.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="signup-city">Cidade (Opcional para Admins)</Label>
                    <Controller
                        name="cityId"
                        control={signUpForm.control}
                        render={({ field }) => (
                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={citiesLoading}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione sua cidade (deixe em branco para admin)" />
                                </SelectTrigger>
                                <SelectContent>
                                    {citiesLoading ? (
                                        <SelectItem value="loading" disabled>Carregando cidades...</SelectItem>
                                    ) : (
                                        cities?.map(city => (
                                            <SelectItem key={city.id} value={city.id}>{city.name}</SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        )}
                    />
                    {signUpForm.formState.errors.cityId && <p className="text-sm text-destructive">{signUpForm.formState.errors.cityId.message}</p>}
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Criar Conta
                </Button>
              </form>
            </TabsContent>
             <div className="relative mt-6">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Ou continue com</span>
                </div>
            </div>
             <Button onClick={handleGoogleSignIn} variant="outline" className="w-full mt-6" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon />}
                Entrar com Google
            </Button>
          </Tabs>
        </CardContent>
      </Card>
    </main>
  );
}
