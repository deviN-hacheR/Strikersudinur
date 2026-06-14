
"use client";

export interface Member {
  id: string;
  name: string;
  phone: string;
  hasPaidThisMonth: boolean;
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  date: string;
}

export const INITIAL_MEMBERS: Member[] = [
  { id: '1', name: 'Jathindas', phone: '8330039531', hasPaidThisMonth: false },
  { id: '2', name: 'Nived', phone: '9496832396', hasPaidThisMonth: false },
  { id: '3', name: 'Arpit', phone: '8921394409', hasPaidThisMonth: false },
];

export const CLUB_EMAIL = 'strikersudinur@gmail.com';
export const ADMIN_PASSWORD = 'strikers123';
export const TREASURER_NAME = 'Jathindas';
export const TREASURER_PHONE = '8330039531';

export function getClubState() {
  if (typeof window === 'undefined') return null;
  const saved = localStorage.getItem('strikers_ledger_state');
  if (saved) return JSON.parse(saved);
  
  const initialState = {
    revenue: 5000,
    members: INITIAL_MEMBERS,
    transactions: [
      { id: 't1', type: 'income', amount: 5000, description: 'Initial club balance', date: new Date().toISOString() }
    ] as Transaction[]
  };
  saveClubState(initialState);
  return initialState;
}

export function saveClubState(state: any) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('strikers_ledger_state', JSON.stringify(state));
  }
}
