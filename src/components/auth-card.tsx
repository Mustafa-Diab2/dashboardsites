'use client';
import { useState } from 'react';
import { LogIn, UserPlus } from 'lucide-react';
import {
  initiateEmailSignIn,
  initiateEmailSignUp,
} from '@/firebase/non-blocking-login';
import { useAuth, useFirestore, addDocumentNonBlocking } from '@/firebase';
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
import { User, UserCredential, createUserWithEmailAndPassword } from 'firebase/auth';
import { setDoc, doc, serverTimestamp } from 'firebase/firestore';

export function AuthCard() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('frontend');
  const [isMember, setIsMember] = useState(true);
  const [loading, setLoading] = useState(false);
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleAuthError = (error: any) => {
    let title = 'Authentication Failed';
    let description = 'An unexpected error occurred. Please try again.';

    if (error instanceof FirebaseError) {
      switch (error.code) {
        case 'auth/user-not-found':
          title = 'User Not Found';
          description =
            'No account exists with this email. Please check your email or sign up.';
          break;
        case 'auth/wrong-password':
          title = 'Invalid Password';
          description =
            'The password you entered is incorrect. Please try again.';
          break;
        case 'auth/invalid-email':
          title = 'Invalid Email';
          description =
            'The email address is not valid. Please check the format.';
          break;
        case 'auth/email-already-in-use':
          title = 'Email In Use';
          description =
            'An account already exists with this email. Please sign in.';
          break;
        case 'auth/weak-password':
          title = 'Weak Password';
          description =
            'Your password is too weak. Please choose a stronger one.';
          break;
        case 'auth/invalid-credential':
          title = 'Invalid Credentials';
          description =
            'The email or password you entered is incorrect. Please try again.';
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
      await initiateEmailSignIn(auth, email, password);
    } catch (e: any) {
      handleAuthError(e);
    } finally {
      setLoading(false);
    }
  };

  const signup = async () => {
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

      const userDocRef = doc(firestore, 'users', user.uid);
      const finalRole = isMember ? role : 'admin';
      
      const userData = {
        fullName: user.email,
        role: finalRole,
        createdAt: serverTimestamp(),
      };
      
      await setDoc(userDocRef, userData);

      toast({
        title: 'Sign up successful!',
        description: 'You can now sign in with your credentials.',
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
          <TabsTrigger value="signin">Sign In</TabsTrigger>
          <TabsTrigger value="signup">Sign Up</TabsTrigger>
        </TabsList>
        <TabsContent value="signin">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LogIn className="w-5 h-5" />
                Sign in to continue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-signin">Email</Label>
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
                  <Label htmlFor="password-signin">Password</Label>
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
                  {loading ? 'Signing in...' : 'Sign in'}
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
                Create an account
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-signup">Email</Label>
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
                  <Label htmlFor="password-signup">Password</Label>
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
                  <Label>Role</Label>
                  <Tabs
                    defaultValue="member"
                    onValueChange={value => setIsMember(value === 'member')}
                  >
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="member">Member</TabsTrigger>
                      <TabsTrigger value="admin">Admin</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                {isMember && (
                  <div className="space-y-2">
                    <Label htmlFor="team-select">Team</Label>
                    <Select value={role} onValueChange={setRole}>
                      <SelectTrigger id="team-select">
                        <SelectValue placeholder="Select team" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="frontend">Frontend</SelectItem>
                        <SelectItem value="backend">Backend</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <Button onClick={signup} disabled={loading} className="w-full">
                  <UserPlus className="mr-2" />
                  {loading ? 'Signing up...' : 'Sign up'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </section>
  );
}
