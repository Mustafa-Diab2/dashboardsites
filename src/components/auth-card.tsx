'use client';
import { useState } from 'react';
import { LogIn } from 'lucide-react';
import {
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { useAuth } from '@/firebase';
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
import { FirebaseError } from 'firebase/app';
import { useLanguage } from '@/context/language-context';

export function AuthCard() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const auth = useAuth();
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

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === 'Enter') {
      login();
    }
  };

  return (
    <section className="flex items-center justify-center min-h-screen bg-background p-4">
      <Tabs defaultValue="signin" className="w-full max-w-md">
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="signin">{t('sign_in')}</TabsTrigger>
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
                    onKeyDown={handleKeyDown}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-signin">{t('password')}</Label>
                  <Input
                    id="password-signin"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={handleKeyDown}
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
      </Tabs>
    </section>
  );
}
