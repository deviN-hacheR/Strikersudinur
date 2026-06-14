
"use client";

import { useState, useEffect } from "react";
import { getClubState, saveClubState, Transaction, Member, TREASURER_NAME, TREASURER_PHONE } from "@/lib/club-data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MemberStatusCard } from "@/components/dashboard/MemberStatusCard";
import { TransactionModal } from "@/components/dashboard/TransactionModal";
import { Trophy, TrendingUp, TrendingDown, Users, LogOut, Send, MessageSquareText, CheckCircle2, Loader2, ExternalLink } from "lucide-react";
import { automatedPaymentReminders } from "@/ai/flows/automated-payment-reminders";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

export default function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [state, setState] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [reminderQueue, setReminderQueue] = useState<{ member: Member, message: string }[]>([]);
  const [showQueueModal, setShowQueueModal] = useState(false);

  useEffect(() => {
    setState(getClubState());
  }, []);

  if (!state) return null;

  const handleTogglePayment = (memberId: string) => {
    const member = state.members.find((m: Member) => m.id === memberId);
    if (!member) return;

    const becomingPaid = !member.hasPaidThisMonth;
    
    // Create new transaction if becoming paid
    let newTransactions = [...state.transactions];
    let newRevenue = state.revenue;

    if (becomingPaid) {
      const t: Transaction = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'income',
        amount: 100,
        description: `Monthly Fee - ${member.name}`,
        date: new Date().toISOString()
      };
      newTransactions = [t, ...newTransactions];
      newRevenue += 100;
    }

    const newMembers = state.members.map((m: Member) => {
      if (m.id === memberId) {
        return { ...m, hasPaidThisMonth: becomingPaid };
      }
      return m;
    });

    const newState = {
      ...state,
      members: newMembers,
      revenue: newRevenue,
      transactions: newTransactions
    };

    setState(newState);
    saveClubState(newState);
    
    if (becomingPaid) {
      toast({
        title: "Payment Recorded",
        description: `₹100 added to revenue for ${member.name}.`
      });
    }
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

  const generateReminders = async (day: '5th' | '21st') => {
    const unpaidMembers = state.members.filter((m: Member) => !m.hasPaidThisMonth);
    if (unpaidMembers.length === 0) {
      toast({ title: "All Settled", description: "Every member has paid their fee for this month." });
      return;
    }

    setIsGenerating(true);
    toast({ title: "AI Working...", description: `Generating personalized messages for ${unpaidMembers.length} members.` });
    
    const queue = [];
    for (const member of unpaidMembers) {
      try {
        const result = await automatedPaymentReminders({
          memberName: member.name,
          memberPhoneNumber: member.phone,
          clubName: "Strikers Udinur",
          reminderDate: `${day} of the month`
        });
        queue.push({ member, message: result.reminderMessage });
      } catch (err) {
        console.error("AI flow error", err);
      }
    }
    
    setReminderQueue(queue);
    setIsGenerating(false);
    setShowQueueModal(true);
  };

  const sendToWhatsApp = (phone: string, message: string) => {
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phone.replace(/\s/g, '')}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
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
            <div className="bg-white rounded-2xl shadow-sm border overflow-hidden max-h-[600px] overflow-y-auto">
              <Table>
                <TableHeader className="bg-secondary/30 sticky top-0 z-10">
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
              Automatically draft AI-personalized WhatsApp messages for all members with outstanding fees.
            </p>
            <div className="grid grid-cols-1 gap-3">
              <Button 
                onClick={() => generateReminders('5th')} 
                disabled={isGenerating}
                className="bg-primary text-white font-body"
              >
                {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Send 5th Day Alert
              </Button>
              <Button 
                onClick={() => generateReminders('21st')} 
                disabled={isGenerating}
                variant="outline" 
                className="border-primary text-primary font-body hover:bg-primary/5"
              >
                {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Send 21st Day Alert
              </Button>
            </div>
          </section>
        </div>
      </div>

      {/* Reminder Queue Modal */}
      <Dialog open={showQueueModal} onOpenChange={setShowQueueModal}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col p-0 overflow-hidden bg-white">
          <DialogHeader className="p-6 border-b">
            <DialogTitle className="text-2xl font-headline">AI Reminder Queue</DialogTitle>
            <DialogDescription className="font-body">
              Below are personalized messages generated for unpaid members. Click send to open WhatsApp for each.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {reminderQueue.map((item, index) => (
              <div key={index} className="bg-secondary/20 p-4 rounded-xl border border-border">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-headline font-bold text-primary">{item.member.name}</span>
                  <span className="text-xs font-body text-muted-foreground">{item.member.phone}</span>
                </div>
                <p className="font-body text-sm italic mb-4 whitespace-pre-wrap">"{item.message}"</p>
                <Button 
                  size="sm" 
                  onClick={() => sendToWhatsApp(item.member.phone, item.message)}
                  className="w-full bg-accent text-white font-body"
                >
                  <ExternalLink className="mr-2 h-4 w-4" /> Send via WhatsApp
                </Button>
              </div>
            ))}
          </div>
          <DialogFooter className="p-6 border-t bg-secondary/10">
            <Button onClick={() => setShowQueueModal(false)} className="bg-primary text-white font-body">
              Done Processing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
