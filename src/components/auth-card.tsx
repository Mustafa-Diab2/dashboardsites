'use client';
import { useState } from 'react';
import { LogIn, UserPlus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
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
import { useLanguage } from '@/context/language-context';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function AuthCard() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('trainee');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();

  const handleAuthError = (error: any) => {
    toast({
      variant: 'destructive',
      title: t('auth_failed_title'),
      description: error.message || t('auth_failed_desc'),
    });
  };

  const login = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
    } catch (e: any) {
      handleAuthError(e);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role,
          },
        },
      });
      if (error) throw error;
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
    action: () => void
  ) => {
    if (event.key === 'Enter') {
      action();
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen w-full bg-background p-4">
      <Card className="w-full max-w-md shadow-2xl border-primary/20 backdrop-blur-sm bg-card/80">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <LogIn className="w-8 h-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold font-headline">
            {t('sign_in_continue')}
          </CardTitle>
          <p className="text-muted-foreground text-sm mt-1">
            {t('welcome_back_desc')}
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="email-signin">{t('email')}</Label>
              <Input
                id="email-signin"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                onKeyDown={(e) => handleKeyDown(e, login)}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password-signin">{t('password')}</Label>
              <Input
                id="password-signin"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, login)}
                placeholder="••••••••"
                className="h-11"
              />
            </div>
            <Button
              onClick={login}
              disabled={loading}
              className="w-full h-11 text-lg mt-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                  {t('signing_in')}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <LogIn className="h-5 w-5" />
                  {t('sign_in')}
                </div>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
