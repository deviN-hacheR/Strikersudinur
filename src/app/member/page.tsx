
"use client";

import { Member, TREASURER_NAME, TREASURER_PHONE } from "@/lib/club-data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut, CheckCircle2, XCircle, Phone, MessageCircle } from "lucide-react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
export default function MemberPortal({ member, onLogout }: { member: Member, onLogout: () => void }) {
  if (!member) {
  return <div>Member not found</div>;
}
  return (
    <div className="max-w-3xl mx-auto p-6 md:p-10 animate-fade-in flex flex-col justify-center min-h-[80vh]">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-3xl font-headline text-primary">Member Workspace</h1>
        <Button variant="ghost" onClick={onLogout} className="font-body text-muted-foreground hover:text-primary">
          <LogOut className="mr-2 h-4 w-4" /> Sign Out
        </Button>
      </div>

      <Card className="border-none shadow-2xl bg-white overflow-hidden rounded-3xl mb-8">
        <div className={`h-3 w-full ${member.hasPaidThisMonth ? 'bg-accent' : 'bg-destructive'}`} />
        <CardContent className="p-10 text-center">
          <div className="mb-6 flex justify-center">
            {member.hasPaidThisMonth ? (
              <div className="h-24 w-24 bg-accent/10 rounded-full flex items-center justify-center text-accent">
                <CheckCircle2 className="h-12 w-12" />
              </div>
            ) : (
              <div className="h-24 w-24 bg-destructive/10 rounded-full flex items-center justify-center text-destructive">
                <XCircle className="h-12 w-12" />
              </div>
            )}
          </div>
          
          <h2 className="text-4xl font-headline mb-2">Namaste, {member.name}</h2>
          <p className="font-body text-muted-foreground text-lg mb-8 italic">Member ID: {member.id}</p>
         
          
          <div className="p-6 bg-secondary/30 rounded-2xl mb-8">
            <p className="font-body uppercase tracking-widest text-xs text-muted-foreground mb-2">Monthly Fee Status</p>
            <h3 className={`text-3xl font-headline ${member.hasPaidThisMonth ? 'text-accent' : 'text-destructive'}`}>
              {member.hasPaidThisMonth ? 'Successfully Paid (₹100)' : 'Payment Pending (₹100)'}
            </h3>
            <p className="font-body text-sm mt-2 text-muted-foreground">
              {member.hasPaidThisMonth 
                ? "Thank you for your timely contribution to Strikers Udinur." 
                : "Please settle your dues by the 5th of the month to support club activities."}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-lg bg-primary text-white rounded-3xl overflow-hidden">
        <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <h3 className="text-xl font-headline mb-1">Discrepancy in records?</h3>
            <p className="font-body text-white/80 text-sm">Contact our Treasurer {TREASURER_NAME} directly.</p>
          </div>
          <div className="flex gap-4">
            <a href={`tel:${TREASURER_PHONE}`}>
              <Button className="bg-white text-primary hover:bg-white/90 font-body rounded-full px-6">
                <Phone className="mr-2 h-4 w-4" /> Call Now
              </Button>
            </a>
            <a href={`https://wa.me/${TREASURER_PHONE.replace(/\s/g, '')}`}>
              <Button variant="outline" className="border-white text-white hover:bg-white/10 font-body rounded-full px-6">
                <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp
              </Button>
            </a>
          </div>
        </CardContent>
      </Card>
      
      <p className="mt-12 text-center text-muted-foreground font-body text-xs opacity-60">
        Strikers Udinur • Kerala, Kasargod, Udinur
      </p>
    </div>
  );
}
