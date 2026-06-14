"use client";

export interface Member {
  id: string;
  name: string;
  phone: string;
  hasPaidThisMonth: boolean;
}

export interface Admin {
  email: string;
  password: string;
  name: string;
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  date: string;
}

export const INITIAL_MEMBERS: Member[] = [
  { id: '1', name: 'Jathindas', phone: '918330039531', hasPaidThisMonth: false },
  { id: '2', name: 'Nived', phone: '919496832396', hasPaidThisMonth: false },
  { id: '3', name: 'Arpit', phone: '918921394409', hasPaidThisMonth: false },
  { id: '4', name: 'Rahul', phone: '917012345678', hasPaidThisMonth: false },
];

export const CLUB_EMAIL = 'strikersudinur@gmail.com';
export const ADMIN_PASSWORD = 'strikers123';
export const TREASURER_NAME = 'Jathindas';
export const TREASURER_PHONE = '+91 83300 39531';

export function getClubState() {
  if (typeof window === 'undefined') return null;
  const saved = localStorage.getItem('strikers_ledger_state');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to parse club state, resetting...", e);
    }
  }
  
  const initialState = {
    revenue: 30000,
    members: INITIAL_MEMBERS,
    admins: [
      { email: CLUB_EMAIL, password: ADMIN_PASSWORD, name: 'Super Admin' }
    ] as Admin[],
    transactions: [
      { id: 't1', type: 'income', amount: 30000, description: 'Initial club balance', date: new Date().toISOString() }
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
