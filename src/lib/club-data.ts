
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
  
  const defaultInitialState = {
    revenue: 30000,
    members: INITIAL_MEMBERS,
    admins: [
      { email: CLUB_EMAIL, password: ADMIN_PASSWORD, name: 'Super Admin' }
    ] as Admin[],
    transactions: [
      { id: 'initial-bal', type: 'income', amount: 30000, description: 'Initial club balance', date: new Date().toISOString() }
    ] as Transaction[]
  };

  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      // Ensure admins array exists even in old saves
      if (!parsed.admins || !Array.isArray(parsed.admins)) {
        parsed.admins = defaultInitialState.admins;
      }
      // Ensure initial balance transaction exists
      if (!parsed.transactions.some((t: any) => t.id === 'initial-bal')) {
        parsed.transactions.push(defaultInitialState.transactions[0]);
        parsed.revenue += 30000;
      }
      return parsed;
    } catch (e) {
      console.error("Failed to parse club state, resetting...", e);
    }
  }
  
  saveClubState(defaultInitialState);
  return defaultInitialState;
}

export function saveClubState(state: any) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('strikers_ledger_state', JSON.stringify(state));
  }
}
