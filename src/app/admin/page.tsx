
"use client";

import { useState, useEffect } from "react";
import { getClubState, saveClubState, Transaction, Member, Admin, TREASURER_NAME, TREASURER_PHONE } from "@/lib/club-data";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MemberStatusCard } from "@/components/dashboard/MemberStatusCard";
import { TransactionModal } from "@/components/dashboard/TransactionModal";
import { TrendingUp, Users, LogOut, Send, MessageSquareText, Loader2, ExternalLink, AlertCircle, UserPlus, ShieldAlert } from "lucide-react";
import { automatedPaymentReminders } from "@/ai/flows/automated-payment-reminders";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [state, setState] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [reminderQueue, setReminderQueue] = useState<{ member: Member, message: string }[]>([]);
  const [showQueueModal, setShowQueueModal] = useState(false);
  const { toast } = useToast();

  const [newMember, setNewMember] = useState({ name: '', phone: '' });
  const [newAdmin, setNewAdmin] = useState({ name: '', email: '', password: '' });
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

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

  const handleAddMember = () => {
    if (!newMember.name || !newMember.phone) return;
    const member: Member = {
        id: `m-${Date.now()}`,
        name: newMember.name,
        phone: newMember.phone,
        hasPaidThisMonth: false
    };
    const newState = { ...state, members: [...state.members, member] };
    setState(newState);
    saveClubState(newState);
    setNewMember({ name: '', phone: '' });
    setIsMemberModalOpen(false);
    toast({ title: "Member Added", description: `${member.name} joined the club registry.` });
  };

  const handleAddAdmin = () => {
    if (!newAdmin.name || !newAdmin.email || !newAdmin.password) return;
    const admin: Admin = { ...newAdmin };
    const newState = { ...state, admins: [...state.admins, admin] };
    setState(newState);
    saveClubState(newState);
    setNewAdmin({ name: '', email: '', password: '' });
    setIsAdminModalOpen(false);
    toast({ title: "Admin Authorized", description: `${admin.name} now has administrative access.` });
  };

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
      const t: Transaction = {
        id: `fee-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        type: 'income',
        amount: 100,
        description: `Monthly Fee - ${member.name}`,
        date: new Date().toISOString()
      };
      newTransactions = [t, ...newTransactions];
      newRevenue += 100;
      toast({ title: "Payment Verified", description: `₹100 added to revenue and ledger for ${member.name}.` });
    } else {
      const lastTransactionIndex = newTransactions.findIndex(t => 
        t.description === `Monthly Fee - ${member.name}` && t.type === 'income'
      );
      if (lastTransactionIndex !== -1) {
        newRevenue -= newTransactions[lastTransactionIndex].amount;
        newTransactions = newTransactions.filter((_, idx) => idx !== lastTransactionIndex);
      }
      toast({ title: "Verification Revoked", description: `₹100 removed from records.`, variant: "destructive" });
    }

    const newState = { ...state, members: newMembers, revenue: newRevenue, transactions: newTransactions };
    setState(newState);
    saveClubState(newState);
  };

  const addTransaction = (t: { type: 'income' | 'expense', amount: number, description: string }) => {
    const newTransaction: Transaction = {
      id: `trx-${Date.now()}`,
      ...t,
      date: new Date().toISOString()
    };
    const newRevenue = t.type === 'income' ? state.revenue + t.amount : state.revenue - t.amount;
    const newState = { ...state, revenue: newRevenue, transactions: [newTransaction, ...state.transactions] };
    setState(newState);
    saveClubState(newState);
    toast({ title: "Entry Recorded", description: `₹${t.amount} saved to ledger.` });
  };

  const generateReminders = async (dayLabel: string) => {
    const unpaidMembers = state.members.filter((m: Member) => !m.hasPaidThisMonth);
    if (unpaidMembers.length === 0) {
      toast({ title: "All Clear", description: "No members are currently in arrears." });
      return;
    }

    setIsGenerating(true);
    toast({ title: "AI Drafts Initialized", description: `Processing alerts for ${unpaidMembers.length} members...` });
    
    try {
      const results: { member: Member, message: string }[] = [];
      // Sequential processing for reliability
      for (const member of unpaidMembers) {
        const result = await automatedPaymentReminders({
          memberName: member.name,
          memberPhoneNumber: member.phone,
          clubName: "Strikers Udinur",
          reminderDate: dayLabel
        });
        results.push({ member, message: result.reminderMessage });
      }
      setReminderQueue(results);
      setShowQueueModal(true);
    } catch (error: any) {
      console.error("AI Error:", error);
      toast({ 
        title: "System Error", 
        description: error.message || "Failed to generate AI messages. Check your connection or API key.", 
        variant: "destructive" 
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const sendToWhatsApp = (phone: string, message: string) => {
    const cleanPhone = phone.replace(/\s+/g, '').replace('+', '');
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${cleanPhone}?text=${encodedMessage}`, '_blank');
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
        <Card className="bg-primary text-white border-none shadow-xl">
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

        <Card className="bg-accent text-white border-none shadow-xl">
          <CardContent className="p-8">
            <div className="flex justify-between items-start mb-4">
              <p className="font-body uppercase tracking-widest text-xs opacity-80">Collection Status</p>
              <Users className="h-5 w-5 opacity-80" />
            </div>
            <h2 className="text-4xl font-headline">
              {state.members.filter((m: Member) => m.hasPaidThisMonth).length}/{state.members.length}
            </h2>
            <p className="mt-2 text-xs font-body opacity-80">Members Settled This Month</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-none shadow-xl p-8 flex flex-col justify-center">
          <p className="font-body uppercase tracking-widest text-xs text-muted-foreground mb-4">Registry Control</p>
          <div className="flex flex-col gap-2">
            <Dialog open={isMemberModalOpen} onOpenChange={setIsMemberModalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full justify-start font-body"><UserPlus className="mr-2 h-4 w-4" /> Add New Member</Button>
              </DialogTrigger>
              <DialogContent className="bg-white">
                <DialogHeader>
                    <DialogTitle className="font-headline">New Member Entry</DialogTitle>
                    <DialogDescription>Register a new player or artist into the club ledger.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Full Name</Label>
                        <Input value={newMember.name} onChange={e => setNewMember({...newMember, name: e.target.value})} placeholder="e.g. Rahul Sharma" />
                    </div>
                    <div className="space-y-2">
                        <Label>Phone Number</Label>
                        <Input value={newMember.phone} onChange={e => setNewMember({...newMember, phone: e.target.value})} placeholder="91XXXXXXXXXX" />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleAddMember} className="w-full">Register Member</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={isAdminModalOpen} onOpenChange={setIsAdminModalOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full justify-start font-body text-muted-foreground hover:text-primary"><ShieldAlert className="mr-2 h-4 w-4" /> Authorize New Admin</Button>
              </DialogTrigger>
              <DialogContent className="bg-white">
                <DialogHeader>
                    <DialogTitle className="font-headline">Authorize Treasurer</DialogTitle>
                    <DialogDescription>Grant full ledger access to another person.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Admin Name</Label>
                        <Input value={newAdmin.name} onChange={e => setNewAdmin({...newAdmin, name: e.target.value})} placeholder="Full Name" />
                    </div>
                    <div className="space-y-2">
                        <Label>Email</Label>
                        <Input value={newAdmin.email} onChange={e => setNewAdmin({...newAdmin, email: e.target.value})} placeholder="admin@email.com" />
                    </div>
                    <div className="space-y-2">
                        <Label>Access Password</Label>
                        <Input type="password" value={newAdmin.password} onChange={e => setNewAdmin({...newAdmin, password: e.target.value})} placeholder="Secret Key" />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleAddAdmin} className="w-full bg-accent">Grant Access</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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
                        <TableCell className="font-body text-muted-foreground text-xs">{new Date(t.date).toLocaleDateString()}</TableCell>
                        <TableCell className="font-headline text-sm">{t.description}</TableCell>
                        <TableCell className={`text-right font-body font-bold ${t.type === 'income' ? 'text-accent' : 'text-destructive'}`}>
                          {t.type === 'income' ? '+' : '-'} ₹{t.amount.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
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
                <MemberStatusCard key={m.id} member={m} isAdmin={true} onTogglePayment={handleTogglePayment} />
              ))}
            </div>
          </section>

          <section className="bg-secondary/20 p-6 rounded-2xl border border-primary/10">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="h-5 w-5 text-primary" />
              <h3 className="text-xl font-headline text-primary">Automated Alerts</h3>
            </div>
            <div className="flex flex-col gap-3">
              <Button onClick={() => generateReminders('the 5th')} disabled={isGenerating} className="bg-primary text-white font-body py-6">
                {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Send 5th Day Alert
              </Button>
              <Button onClick={() => generateReminders('the 21st')} disabled={isGenerating} variant="outline" className="border-primary text-primary font-body py-6">
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
            <DialogTitle className="text-2xl font-headline flex items-center gap-2"><MessageSquareText className="h-6 w-6 text-primary" /> WhatsApp Queue</DialogTitle>
            <DialogDescription className="font-body text-base">Personalized drafts for {reminderQueue.length} members.</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-secondary/5">
            {reminderQueue.map((item, index) => (
              <div key={index} className="bg-white p-5 rounded-2xl border shadow-sm flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-headline font-bold text-lg text-primary block">{item.member.name}</span>
                    <span className="text-xs font-body text-muted-foreground">{item.member.phone}</span>
                  </div>
                  <div className="bg-destructive/10 text-destructive text-[10px] font-bold px-2 py-1 rounded-full">UNPAID</div>
                </div>
                <div className="p-4 bg-secondary/20 rounded-xl border border-dashed border-primary/20">
                  <p className="font-body text-sm leading-relaxed whitespace-pre-wrap italic">"{item.message}"</p>
                </div>
                <Button onClick={() => sendToWhatsApp(item.member.phone, item.message)} className="w-full bg-accent text-white font-body h-12">
                  <ExternalLink className="mr-2 h-4 w-4" /> Send WhatsApp
                </Button>
              </div>
            ))}
          </div>
          <DialogFooter className="p-6 border-t bg-white">
            <Button variant="ghost" onClick={() => setShowQueueModal(false)} className="font-body">Close Queue</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
