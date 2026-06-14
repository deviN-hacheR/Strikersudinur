
"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PlusCircle } from "lucide-react";

interface TransactionModalProps {
  onAdd: (transaction: { type: 'income' | 'expense', amount: number, description: string }) => void;
}

export function TransactionModal({ onAdd }: TransactionModalProps) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = () => {
    if (!amount || !description) return;
    onAdd({ type, amount: parseFloat(amount), description });
    setAmount("");
    setDescription("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="font-body bg-accent hover:bg-accent/90">
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Transaction
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-background">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl text-primary">New Transaction</DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <RadioGroup defaultValue="expense" onValueChange={(v) => setType(v as 'income' | 'expense')} className="flex gap-4">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="income" id="income" />
              <Label htmlFor="income" className="font-body">Income</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="expense" id="expense" />
              <Label htmlFor="expense" className="font-body">Expense</Label>
            </div>
          </RadioGroup>
          <div className="space-y-2">
            <Label htmlFor="amount" className="font-body">Amount (₹)</Label>
            <Input id="amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="font-body" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description" className="font-body">Description</Label>
            <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Buying footballs" className="font-body" />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} className="bg-primary text-white font-body w-full">Confirm Record</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
