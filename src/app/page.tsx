
"use client";

import { useState, useEffect } from "react";
import { getClubState, Member, Admin, CLUB_EMAIL, ADMIN_PASSWORD } from "@/lib/club-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Trophy, ShieldCheck, User as UserIcon, LogOut, Loader2, AlertCircle } from "lucide-react";
import AdminDashboard from "./admin/page";
import MemberPortal from "./member/page";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Home() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<{ role: 'admin' | 'member', data?: Member | Admin } | null>(null);
  const [error, setError] = useState("");
  const [clubState, setClubState] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Small delay to ensure localStorage is ready and layout is hydrated
    const timer = setTimeout(() => {
      const state = getClubState();
      setClubState(state);
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!clubState) {
        setError("Club registry not loaded. Please refresh.");
        return;
    }

    const trimmedId = identifier.trim();
    const trimmedPass = password.trim();

    if (!trimmedId || !trimmedPass) {
        setError("Please enter both credentials.");
        return;
    }

    // 1. Check Admins
    const admin = clubState.admins.find(
      (a: Admin) => a.email.toLowerCase() === trimmedId.toLowerCase() && a.password === trimmedPass
    );
    
    if (admin) {
      setUser({ role: 'admin', data: admin });
      return;
    }

    // 2. Check Members
    const member = clubState.members.find((m: Member) => {
      const phoneOnly = m.phone.replace(/\s+/g, '').replace('+', '');
      const passOnly = trimmedPass.replace(/\s+/g, '').replace('+', '');
      const idOnly = trimmedId.replace(/\s+/g, '').replace('+', '');
      
      const isPasswordMatch = phoneOnly.endsWith(passOnly) || passOnly.endsWith(phoneOnly);
      const isIdentifierMatch = 
        m.name.toLowerCase() === trimmedId.toLowerCase() || 
        phoneOnly.endsWith(idOnly) || 
        idOnly.endsWith(phoneOnly);

      return isPasswordMatch && isIdentifierMatch;
    });

    if (member) {
      setUser({ role: 'member', data: member });
      return;
    }

    setError("Invalid credentials. For admins, use your email. For members, use your phone as password.");
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="font-headline text-lg text-primary animate-pulse">Initializing Strikers Ledger...</p>
      </div>
    );
  }

  if (user?.role === 'admin') return <AdminDashboard onLogout={() => setUser(null)} />;
  if (user?.role === 'member') return <MemberPortal member={user.data as Member} onLogout={() => setUser(null)} />;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 animate-fade-in bg-background">
      <div className="mb-12 text-center">
        <div className="mx-auto w-20 h-20 bg-primary rounded-full flex items-center justify-center mb-6 shadow-lg shadow-primary/20">
          <Trophy className="text-white h-10 w-10" />
        </div>
        <h1 className="text-5xl font-headline text-primary mb-2">Strikers Udinur</h1>
        <p className="text-muted-foreground font-body text-lg italic tracking-wide">Kerala's Arts & Sports Pride</p>
      </div>

      <Card className="w-full max-w-md border-none shadow-2xl bg-white/80 backdrop-blur-sm overflow-hidden rounded-2xl">
        <div className="h-2 bg-primary w-full" />
        <CardHeader className="pt-10 pb-6 text-center">
          <CardTitle className="font-headline text-3xl">Portal Login</CardTitle>
          <CardDescription className="font-body text-base">Enter your credentials to access the ledger</CardDescription>
        </CardHeader>
        <CardContent className="pb-10 px-8">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-muted-foreground font-body uppercase tracking-wider">Email or Name</label>
              <Input 
                type="text" 
                placeholder="strikersudinur@gmail.com" 
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="bg-secondary/30 border-none h-12 text-base focus-visible:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-muted-foreground font-body uppercase tracking-wider">Password / Phone</label>
              <Input 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-secondary/30 border-none h-12 text-base focus-visible:ring-primary"
              />
              <p className="text-[10px] text-muted-foreground font-body">Members: Use your phone number as password</p>
            </div>
            {error && (
              <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs font-body">{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white h-12 text-lg font-headline transition-all duration-300 transform hover:scale-[1.02]">
              Secure Login
            </Button>
          </form>
        </CardContent>
      </Card>
      
      <div className="mt-12 text-center text-muted-foreground font-body text-sm max-w-xs opacity-60">
        <p>Strikers Ledger v1.4 • Udinur, Kasargod, Kerala</p>
      </div>
    </div>
  );
}
