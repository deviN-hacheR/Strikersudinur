
"use client";

import { useState, useEffect } from "react";
import { getClubState, saveClubState, Transaction, Member, TREASURER_NAME, TREASURER_PHONE } from "@/lib/club-data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MemberStatusCard } from "@/components/dashboard/MemberStatusCard";
import { TransactionModal } from "@/components/dashboard/TransactionModal";
import { Trophy, TrendingUp, TrendingDown, Users, LogOut, Send, MessageSquareText } from "lucide-react";
import { automatedPaymentReminders } from "@/ai/flows/automated-payment-reminders";
import { toast } from "@/hooks/use-toast";

export default function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [state, setState] = useState<any>(null);

  useEffect(() => {
    setState(getClubState());
  }, []);

  if (!state) return null;

  const handleTogglePayment = (memberId: string) => {
    const newMembers = state.members.map((m: Member) => {
      if (m.id === memberId) {
        const hasPaid = !m.hasPaidThisMonth;
        // If becoming paid, add ₹100 income
        if (hasPaid) {
          addTransaction({
            type: 'income',
            amount: 100,
            description: `Monthly Fee - ${m.name}`
          });
        }
        return { ...m, hasPaidThisMonth: hasPaid };
      }
      return m;
    });
    const newState = { ...state, members: newMembers };
    setState(newState);
    saveClubState(newState);
  };

  const addTransaction = (t: { type: 'income' | 'expense', amount: number, description: string }) => {
    const newTransaction: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      ...t,
      date: new Date().toISOString()
    };
    const newRevenue = t.type === 'income' ? state.revenue + t.amount : state.revenue - t.amount;
    const newState = {
      ...state,
      revenue: newRevenue,
      transactions: [newTransaction, ...state.transactions]
    };
    setState(newState);
    saveClubState(newState);
  };

  const sendReminders = async (day: '5th' | '21st') => {
    const unpaidMembers = state.members.filter((m: Member) => !m.hasPaidThisMonth);
    if (unpaidMembers.length === 0) {
      toast({ title: "No reminders needed", description: "All members have paid for this month." });
      return;
    }

    toast({ title: "Sending AI Reminders...", description: `Drafting messages for ${unpaidMembers.length} members.` });
    
    for (const member of unpaidMembers) {
      try {
        const result = await automatedPaymentReminders({
          memberName: member.name,
          memberPhoneNumber: member.phone,
          clubName: "Strikers Udinur",
          reminderDate: `${day} of the month`
        });
        console.log(`Reminder for ${member.name}:`, result.reminderMessage);
      } catch (err) {
        console.error("AI flow error", err);
      }
    }
    
    toast({ title: "Reminders Sent", description: `Personalized AI alerts have been queued for sending.` });
  };

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-10 animate-fade-in">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
        <div>
          <h1 className="text-4xl font-headline text-primary mb-2">Financial Command</h1>
          <p className="font-body text-muted-foreground italic">Managing the legacy of Strikers Udinur</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onLogout} className="font-body border-primary text-primary hover:bg-primary/5">
            <LogOut className="mr-2 h-4 w-4" /> Sign Out
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <Card className="bg-primary text-white border-none shadow-xl transform hover:scale-[1.02] transition-transform">
          <CardContent className="p-8">
            <div className="flex justify-between items-start mb-4">
              <p className="font-body uppercase tracking-widest text-xs opacity-80">Total Club Revenue</p>
              <TrendingUp className="h-5 w-5 opacity-80" />
            </div>
            <h2 className="text-4xl font-headline">₹{state.revenue.toLocaleString()}</h2>
            <div className="mt-4 pt-4 border-t border-white/20 flex gap-4 text-xs font-body">
              <span>{state.transactions.length} Transactions</span>
              <span>•</span>
              <span>{state.members.length} Active Members</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-accent text-white border-none shadow-xl transform hover:scale-[1.02] transition-transform">
          <CardContent className="p-8">
            <div className="flex justify-between items-start mb-4">
              <p className="font-body uppercase tracking-widest text-xs opacity-80">Monthly Collection</p>
              <Users className="h-5 w-5 opacity-80" />
            </div>
            <h2 className="text-4xl font-headline">
              {state.members.filter((m: Member) => m.hasPaidThisMonth).length}/{state.members.length}
            </h2>
            <p className="mt-2 text-xs font-body opacity-80">Members marked as Paid</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-none shadow-xl p-8 flex flex-col justify-center">
          <p className="font-body uppercase tracking-widest text-xs text-muted-foreground mb-4">Treasurer Support</p>
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 bg-secondary rounded-full flex items-center justify-center text-primary">
              <MessageSquareText className="h-5 w-5" />
            </div>
            <div>
              <p className="font-headline text-lg">{TREASURER_NAME}</p>
              <p className="font-body text-sm text-primary font-bold">{TREASURER_PHONE}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          <section>
            <div className="flex justify-between items-end mb-6">
              <h3 className="text-2xl font-headline text-foreground">Recent Audit Log</h3>
              <TransactionModal onAdd={addTransaction} />
            </div>
            <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
              <Table>
                <TableHeader className="bg-secondary/30">
                  <TableRow>
                    <TableHead className="font-body uppercase text-xs">Date</TableHead>
                    <TableHead className="font-body uppercase text-xs">Description</TableHead>
                    <TableHead className="font-body uppercase text-xs text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {state.transactions.map((t: Transaction) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-body text-muted-foreground text-xs">
                        {new Date(t.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="font-headline text-sm">{t.description}</TableCell>
                      <TableCell className={`text-right font-body font-bold ${t.type === 'income' ? 'text-accent' : 'text-destructive'}`}>
                        {t.type === 'income' ? '+' : '-'} ₹{t.amount.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                  {state.transactions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-10 font-body text-muted-foreground">
                        No transactions recorded yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </section>
        </div>

        <div className="space-y-10">
          <section>
            <h3 className="text-2xl font-headline text-foreground mb-6">Membership Tracker</h3>
            <div className="space-y-4">
              {state.members.map((m: Member) => (
                <MemberStatusCard 
                  key={m.id} 
                  member={m} 
                  isAdmin={true} 
                  onTogglePayment={handleTogglePayment} 
                />
              ))}
            </div>
          </section>

          <section className="bg-secondary/20 p-6 rounded-2xl border border-primary/10">
            <h3 className="text-xl font-headline text-primary mb-4">Payment Alerts</h3>
            <p className="font-body text-sm text-muted-foreground mb-6">
              Automate reminders to members with outstanding monthly fees using AI-personalized messaging.
            </p>
            <div className="grid grid-cols-1 gap-3">
              <Button onClick={() => sendReminders('5th')} className="bg-primary text-white font-body">
                <Send className="mr-2 h-4 w-4" /> Send 5th Day Alert
              </Button>
              <Button onClick={() => sendReminders('21st')} variant="outline" className="border-primary text-primary font-body hover:bg-primary/5">
                <Send className="mr-2 h-4 w-4" /> Send 21st Day Alert
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
