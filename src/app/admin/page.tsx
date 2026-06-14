
"use client";

import { useState, useEffect } from "react";
import { getClubState, saveClubState, Transaction, Member, TREASURER_NAME, TREASURER_PHONE } from "@/lib/club-data";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MemberStatusCard } from "@/components/dashboard/MemberStatusCard";
import { TransactionModal } from "@/components/dashboard/TransactionModal";
import { TrendingUp, Users, LogOut, Send, MessageSquareText, Loader2, ExternalLink, AlertCircle } from "lucide-react";
import { automatedPaymentReminders } from "@/ai/flows/automated-payment-reminders";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

export default function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [state, setState] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [reminderQueue, setReminderQueue] = useState<{ member: Member, message: string }[]>([]);
  const [showQueueModal, setShowQueueModal] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const clubState = getClubState();
    if (clubState) {
      setState(clubState);
    }
  }, []);

  if (!state) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleTogglePayment = (memberId: string) => {
    const memberIndex = state.members.findIndex((m: Member) => m.id === memberId);
    if (memberIndex === -1) return;

    const member = state.members[memberIndex];
    const becomingPaid = !member.hasPaidThisMonth;
    
    const newMembers = [...state.members];
    newMembers[memberIndex] = { ...member, hasPaidThisMonth: becomingPaid };

    let newTransactions = [...state.transactions];
    let newRevenue = state.revenue;

    if (becomingPaid) {
      // Create a fee income record automatically
      const t: Transaction = {
        id: `fee-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        type: 'income',
        amount: 100,
        description: `Monthly Fee - ${member.name}`,
        date: new Date().toISOString()
      };
      newTransactions = [t, ...newTransactions];
      newRevenue += 100;
    } else {
      // Find and remove the latest fee record for this member if unmarking
      const lastTransactionIndex = newTransactions.findIndex(t => 
        t.description === `Monthly Fee - ${member.name}` && t.type === 'income'
      );
      if (lastTransactionIndex !== -1) {
        newRevenue -= newTransactions[lastTransactionIndex].amount;
        newTransactions = newTransactions.filter((_, idx) => idx !== lastTransactionIndex);
      }
    }

    const newState = {
      ...state,
      members: newMembers,
      revenue: newRevenue,
      transactions: newTransactions
    };

    setState(newState);
    saveClubState(newState);
    
    toast({
      title: becomingPaid ? "Payment Verified" : "Verification Revoked",
      description: becomingPaid 
        ? `₹100 added to revenue from ${member.name}.`
        : `₹100 deducted from revenue for ${member.name}.`,
      variant: becomingPaid ? "default" : "destructive"
    });
  };

  const addTransaction = (t: { type: 'income' | 'expense', amount: number, description: string }) => {
    const newTransaction: Transaction = {
      id: `trx-${Date.now()}`,
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
    toast({ title: "Entry Recorded", description: `${t.type.toUpperCase()}: ₹${t.amount} saved to ledger.` });
  };

  const generateReminders = async (dayLabel: string) => {
    const unpaidMembers = state.members.filter((m: Member) => !m.hasPaidThisMonth);
    
    if (unpaidMembers.length === 0) {
      toast({ 
        title: "All Clear", 
        description: "No members are currently in arrears for this month.",
      });
      return;
    }

    setIsGenerating(true);
    toast({ 
      title: "AI Drafts Initialized", 
      description: `Analyzing dues for ${unpaidMembers.length} members...`,
    });
    
    try {
      const results: { member: Member, message: string }[] = [];
      
      for (const member of unpaidMembers) {
        try {
          const result = await automatedPaymentReminders({
            memberName: member.name,
            memberPhoneNumber: member.phone,
            clubName: "Strikers Udinur",
            reminderDate: dayLabel
          });
          results.push({ member, message: result.reminderMessage });
        } catch (err) {
          console.error(`AI Failure for ${member.name}:`, err);
        }
      }
      
      if (results.length === 0) {
        throw new Error("The AI failed to generate messages. Check your API configuration.");
      }

      setReminderQueue(results);
      setShowQueueModal(true);
      toast({ 
        title: "Drafts Ready", 
        description: `Successfully prepared ${results.length} reminder alerts.` 
      });
    } catch (error: any) {
      toast({
        title: "Alert System Offline",
        description: error.message || "We encountered an error generating the messages.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const sendToWhatsApp = (phone: string, message: string) => {
    const cleanPhone = phone.replace(/\s+/g, '').replace('+', '');
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
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
        <Card className="bg-primary text-white border-none shadow-xl transform hover:scale-[1.01] transition-transform">
          <CardContent className="p-8">
            <div className="flex justify-between items-start mb-4">
              <p className="font-body uppercase tracking-widest text-xs opacity-80">Total Revenue</p>
              <TrendingUp className="h-5 w-5 opacity-80" />
            </div>
            <h2 className="text-4xl font-headline">₹{state.revenue.toLocaleString()}</h2>
            <div className="mt-4 pt-4 border-t border-white/20 flex gap-4 text-xs font-body">
              <span>{state.transactions.length} Records</span>
              <span>•</span>
              <span>{state.members.length} Members</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-accent text-white border-none shadow-xl transform hover:scale-[1.01] transition-transform">
          <CardContent className="p-8">
            <div className="flex justify-between items-start mb-4">
              <p className="font-body uppercase tracking-widest text-xs opacity-80">Active Collections</p>
              <Users className="h-5 w-5 opacity-80" />
            </div>
            <h2 className="text-4xl font-headline">
              {state.members.filter((m: Member) => m.hasPaidThisMonth).length}/{state.members.length}
            </h2>
            <p className="mt-2 text-xs font-body opacity-80">Members Paid This Month</p>
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
              <h3 className="text-2xl font-headline text-foreground">Audit Ledger</h3>
              <TransactionModal onAdd={addTransaction} />
            </div>
            <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
              <div className="max-h-[500px] overflow-y-auto">
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
                        <TableCell className="font-body text-muted-foreground text-xs whitespace-nowrap">
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
                          No transactions found in ledger.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-10">
          <section>
            <h3 className="text-2xl font-headline text-foreground mb-6">Member Registry</h3>
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
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
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="h-5 w-5 text-primary" />
              <h3 className="text-xl font-headline text-primary">Automated Alerts</h3>
            </div>
            <p className="font-body text-sm text-muted-foreground mb-6">
              Generate personalized WhatsApp reminders for all unpaid members in one click.
            </p>
            <div className="flex flex-col gap-3">
              <Button 
                onClick={() => generateReminders('the 5th of the month')} 
                disabled={isGenerating}
                className="bg-primary text-white font-body py-6 shadow-md"
              >
                {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Send 5th Day Alert
              </Button>
              <Button 
                onClick={() => generateReminders('the 21st of the month')} 
                disabled={isGenerating}
                variant="outline" 
                className="border-primary text-primary font-body hover:bg-primary/5 py-6"
              >
                {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Send 21st Day Alert
              </Button>
            </div>
          </section>
        </div>
      </div>

      <Dialog open={showQueueModal} onOpenChange={setShowQueueModal}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-white rounded-3xl">
          <DialogHeader className="p-6 border-b bg-secondary/10">
            <DialogTitle className="text-2xl font-headline flex items-center gap-2">
              <MessageSquareText className="h-6 w-6 text-primary" />
              WhatsApp Reminder Queue
            </DialogTitle>
            <DialogDescription className="font-body text-base">
              Personalized drafts for {reminderQueue.length} members. 
              Review and click "Send" to open WhatsApp for each.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-secondary/5">
            {reminderQueue.map((item, index) => (
              <div key={index} className="bg-white p-5 rounded-2xl border shadow-sm flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-headline font-bold text-lg text-primary block">{item.member.name}</span>
                    <span className="text-xs font-body text-muted-foreground">{item.member.phone}</span>
                  </div>
                  <div className="bg-destructive/10 text-destructive text-[10px] font-bold px-2 py-1 rounded-full">
                    UNPAID
                  </div>
                </div>
                <div className="p-4 bg-secondary/20 rounded-xl border border-dashed border-primary/20">
                  <p className="font-body text-sm leading-relaxed whitespace-pre-wrap italic">"{item.message}"</p>
                </div>
                <Button 
                  onClick={() => sendToWhatsApp(item.member.phone, item.message)}
                  className="w-full bg-accent text-white font-body h-12 hover:bg-accent/90 shadow-md rounded-xl"
                >
                  <ExternalLink className="mr-2 h-4 w-4" /> Send WhatsApp to {item.member.name.split(' ')[0]}
                </Button>
              </div>
            ))}
          </div>
          
          <DialogFooter className="p-6 border-t bg-white">
            <Button variant="ghost" onClick={() => setShowQueueModal(false)} className="font-body">
              Close Queue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
