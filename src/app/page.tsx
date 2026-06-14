"use client";

import { useState, useEffect } from "react";
import { getClubState, saveClubState, Member, Admin } from "@/lib/club-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Trophy, ShieldCheck, User as UserIcon, LogOut } from "lucide-react";
import AdminDashboard from "./admin/page";
import MemberPortal from "./member/page";

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<{ role: 'admin' | 'member', data?: Member | Admin } | null>(null);
  const [error, setError] = useState("");
  const [clubState, setClubState] = useState<any>(null);

  useEffect(() => {
    setClubState(getClubState());
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!clubState) return;

    // Check Admins
    const admin = clubState.admins.find((a: Admin) => a.email === email && a.password === password);
    if (admin) {
      setUser({ role: 'admin', data: admin });
      return;
    }

    // Check Members
    const member = clubState.members.find((m: Member) => m.phone.replace(/\s/g, '') === password.replace(/\s/g, ''));
    if (member && email === clubState.admins[0].email) { // Use super admin email as identifier or just match member
        setUser({ role: 'member', data: member });
        return;
    }
    
    // Fallback for members just using phone
    if (email.length < 5 && !email.includes('@')) {
        const memberByPhone = clubState.members.find((m: Member) => m.phone.replace(/\s/g, '') === password.replace(/\s/g, ''));
        if (memberByPhone) {
            setUser({ role: 'member', data: memberByPhone });
            return;
        }
    }

    setError("Invalid credentials. Please check your login details.");
  };

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
              <label className="text-sm font-bold text-muted-foreground font-body uppercase tracking-wider">Login ID / Email</label>
              <Input 
                type="text" 
                placeholder="strikersudinur@gmail.com or Member ID" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
            {error && <p className="text-destructive text-sm font-body bg-destructive/5 p-3 rounded-md border border-destructive/10 text-center">{error}</p>}
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white h-12 text-lg font-headline transition-all duration-300 transform hover:scale-[1.02]">
              Secure Login
            </Button>
          </form>
        </CardContent>
      </Card>
      
      <div className="mt-12 text-center text-muted-foreground font-body text-sm max-w-xs opacity-60">
        <p>Strikers Ledger v1.2 • Udinur, Kasargod, Kerala</p>
      </div>
    </div>
  );
}
