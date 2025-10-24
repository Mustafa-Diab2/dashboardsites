'use client';
import { useState } from 'react';
import { LogIn, UserPlus } from 'lucide-react';
import {
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { useAuth, useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FirebaseError } from 'firebase/app';
import { User, UserCredential, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { useLanguage } from '@/context/language-context';

export function AuthCard() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('frontend');
  const [isMember, setIsMember] = useState(true);
  const [loading, setLoading] = useState(false);
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { t } = useLanguage();

  const handleAuthError = (error: any) => {
    let title = t('auth_failed_title');
    let description = t('auth_failed_desc');

    if (error instanceof FirebaseError) {
      switch (error.code) {
        case 'auth/user-not-found':
          title = t('user_not_found_title');
          description = t('user_not_found_desc');
          break;
        case 'auth/wrong-password':
          title = t('invalid_password_title');
          description = t('invalid_password_desc');
          break;
        case 'auth/invalid-email':
          title = t('invalid_email_title');
          description = t('invalid_email_desc');
          break;
        case 'auth/email-already-in-use':
          title = t('email_in_use_title');
          description = t('email_in_use_desc');
          break;
        case 'auth/weak-password':
          title = t('weak_password_title');
          description = t('weak_password_desc');
          break;
        case 'auth/invalid-credential':
          title = t('invalid_credential_title');
          description = t('invalid_credential_desc');
          break;
        default:
          description = error.message;
      }
    } else if (error instanceof Error) {
      description = error.message;
    }

    toast({
      variant: 'destructive',
      title: title,
      description: description,
    });
  };

  const login = async () => {
    setLoading(true);
    try {
      if (!auth) throw new Error('Auth service not available');
      await signInWithEmailAndPassword(auth, email, password);
    } catch (e: any) {
      handleAuthError(e);
    } finally {
      setLoading(false);
    }
  };

  const signup = async () => {
    if (!fullName) {
       toast({
        variant: 'destructive',
        title: t('missing_info_title'),
        description: t('missing_info_desc'),
      });
      return;
    }

    setLoading(true);
    if (!auth || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Firebase is not initialized.',
      });
      setLoading(false);
      return;
    }
    try {
      const userCredential: UserCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user: User = userCredential.user;
      
      await updateProfile(user, { displayName: fullName });

      const userDocRef = doc(firestore, 'users', user.uid);
      const finalRole = isMember ? role : 'admin';
      
      const userData = {
        id: user.uid,
        fullName: fullName,
        email: user.email,
        role: finalRole,
        createdAt: serverTimestamp(),
      };
      
      await setDoc(userDocRef, userData);

      toast({
        title: t('signup_success_title'),
        description: t('signup_success_desc'),
      });
    } catch (e: any) {
      handleAuthError(e);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
    action: 'login' | 'signup'
  ) => {
    if (event.key === 'Enter') {
      if (action === 'login') login();
      if (action === 'signup') signup();
    }
  };

  return (
    <section className="flex items-center justify-center min-h-screen bg-background p-4">
      <Tabs defaultValue="signin" className="w-full max-w-md">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="signin">{t('sign_in')}</TabsTrigger>
          <TabsTrigger value="signup">{t('sign_up')}</TabsTrigger>
        </TabsList>
        <TabsContent value="signin">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LogIn className="w-5 h-5" />
                {t('sign_in_continue')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-signin">{t('email')}</Label>
                  <Input
                    id="email-signin"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    onKeyDown={e => handleKeyDown(e, 'login')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-signin">{t('password')}</Label>
                  <Input
                    id="password-signin"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => handleKeyDown(e, 'login')}
                    placeholder="••••••••"
                  />
                </div>
                <Button onClick={login} disabled={loading} className="w-full">
                  <LogIn className="mr-2" />
                  {loading ? t('signing_in') : t('sign_in')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="signup">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                {t('create_account')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName-signup">{t('full_name')}</Label>
                  <Input
                    id="fullName-signup"
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder={t('your_name_placeholder')}
                    onKeyDown={e => handleKeyDown(e, 'signup')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-signup">{t('email')}</Label>
                  <Input
                    id="email-signup"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    onKeyDown={e => handleKeyDown(e, 'signup')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-signup">{t('password')}</Label>
                  <Input
                    id="password-signup"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => handleKeyDown(e, 'signup')}
                    placeholder="••••••••"
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t('role')}</Label>
                  <Tabs
                    defaultValue="member"
                    onValueChange={value => setIsMember(value === 'member')}
                  >
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="member">{t('member')}</TabsTrigger>
                      <TabsTrigger value="admin">{t('admin')}</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                {isMember && (
                  <div className="space-y-2">
                    <Label htmlFor="team-select">{t('team')}</Label>
                    <Select value={role} onValueChange={setRole}>
                      <SelectTrigger id="team-select">
                        <SelectValue placeholder={t('select_team')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="frontend">{t('frontend')}</SelectItem>
                        <SelectItem value="backend">{t('backend')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <Button onClick={signup} disabled={loading} className="w-full">
                  <UserPlus className="mr-2" />
                  {loading ? t('signing_up') : t('sign_up')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </section>
  );
}
