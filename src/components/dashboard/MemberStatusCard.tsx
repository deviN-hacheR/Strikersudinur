
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Member } from "@/lib/club-data";
import { User, Phone } from "lucide-react";

interface MemberStatusCardProps {
  member: Member;
  isAdmin: boolean;
  onTogglePayment?: (id: string) => void;
}

export function MemberStatusCard({ member, isAdmin, onTogglePayment }: MemberStatusCardProps) {
  return (
    <Card className="overflow-hidden border-none shadow-sm hover:shadow-md transition-all duration-300 bg-white/50">
      <CardContent className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center text-primary">
            <User className="h-6 w-6" />
          </div>
          <div>
            <h4 className="font-headline text-lg text-foreground">{member.name}</h4>
            <div className="flex items-center text-muted-foreground text-sm gap-1">
              <Phone className="h-3 w-3" />
              <span className="font-body">{member.phone}</span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-2">
          {isAdmin ? (
            <div className="flex items-center gap-3">
              <span className="text-xs font-body text-muted-foreground">Monthly Fee (₹100)</span>
              <Checkbox 
                checked={member.hasPaidThisMonth} 
                onCheckedChange={() => onTogglePayment?.(member.id)}
                className="h-6 w-6 data-[state=checked]:bg-accent data-[state=checked]:border-accent"
              />
            </div>
          ) : (
            <div className={`px-3 py-1 rounded-full text-xs font-bold font-body ${member.hasPaidThisMonth ? 'bg-accent/10 text-accent' : 'bg-destructive/10 text-destructive'}`}>
              {member.hasPaidThisMonth ? 'PAID' : 'PENDING'}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
