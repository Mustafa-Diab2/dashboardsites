'use client';
import { useState } from 'react';
import { LogIn } from 'lucide-react';
import { initiateEmailSignIn } from '@/firebase/non-blocking-login';
import { useAuth } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export function AuthCard() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const auth = useAuth();
  const { toast } = useToast();

  const login = async () => {
    setLoading(true);
    try {
      await initiateEmailSignIn(auth, email, password);
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Sign in failed",
        description: e.message || "An unexpected error occurred.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      login();
    }
  };


  return (
    <section className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LogIn className="w-5 h-5" />
            Sign in to continue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handlePasswordKeyDown}
                placeholder="••••••••"
              />
            </div>
            <Button onClick={login} disabled={loading} className="w-full">
              <LogIn className="mr-2" />
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
