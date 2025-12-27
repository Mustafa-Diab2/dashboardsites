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
                    onKeyDown={(e) => handleKeyDown(e, login)}
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
                  />
                </div>
                <Button onClick={login} disabled={loading} className="w-full">
                  <LogIn className="mr-2 h-4 w-4" />
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
                  <Label htmlFor="fullname-signup">{t('full_name')}</Label>
                  <Input
                    id="fullname-signup"
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="John Doe"
                    onKeyDown={(e) => handleKeyDown(e, signUp)}
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
                    onKeyDown={(e) => handleKeyDown(e, signUp)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-signup">{t('password')}</Label>
                  <Input
                    id="password-signup"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, signUp)}
                    placeholder="••••••••"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role-signup">{t('role')}</Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger id="role-signup">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="trainee">{t('trainee')}</SelectItem>
                      <SelectItem value="frontend">{t('frontend')}</SelectItem>
                      <SelectItem value="backend">{t('backend')}</SelectItem>
                      <SelectItem value="ui_ux">UI/UX Designer</SelectItem>
                      <SelectItem value="ai_specialist">AI Specialist</SelectItem>
                      <SelectItem value="security">Security</SelectItem>
                      <SelectItem value="admin">{t('admin')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={signUp} disabled={loading} className="w-full">
                  <UserPlus className="mr-2 h-4 w-4" />
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
