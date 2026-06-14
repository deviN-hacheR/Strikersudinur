'use server';
/**
 * @fileOverview A Genkit flow for generating personalized payment reminder messages.
 *
 * - automatedPaymentReminders - A function that generates a personalized payment reminder message.
 * - AutomatedPaymentRemindersInput - The input type for the automatedPaymentReminders function.
 * - AutomatedPaymentRemindersOutput - The return type for the automatedPaymentReminders function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AutomatedPaymentRemindersInputSchema = z.object({
  memberName: z.string().describe('The name of the member.'),
  memberPhoneNumber: z.string().describe('The phone number of the member.'),
  clubName: z.string().describe('The name of the club.'),
  reminderDate: z.string().describe('The date the reminder is being sent (e.g., "5th of the month" or "21st of the month").'),
});
export type AutomatedPaymentRemindersInput = z.infer<typeof AutomatedPaymentRemindersInputSchema>;

const AutomatedPaymentRemindersOutputSchema = z.object({
  reminderMessage: z.string().describe('The personalized payment reminder message.'),
});
export type AutomatedPaymentRemindersOutput = z.infer<typeof AutomatedPaymentRemindersOutputSchema>;

export async function automatedPaymentReminders(input: AutomatedPaymentRemindersInput): Promise<AutomatedPaymentRemindersOutput> {
  return automatedPaymentRemindersFlow(input);
}

const prompt = ai.definePrompt({
  name: 'paymentReminderPrompt',
  input: {schema: AutomatedPaymentRemindersInputSchema},
  output: {schema: AutomatedPaymentRemindersOutputSchema},
  prompt: `You are an AI assistant for a sports and arts club named '{{clubName}}'.
Your task is to generate a polite and personalized payment reminder message for a club member who has not yet paid their monthly membership fee of ₹100.
The reminder is being sent on the {{reminderDate}}.

Please include the member's name and gently remind them about the outstanding payment of ₹100.
The message should encourage them to pay as soon as possible to avoid further reminders.

Member Name: {{{memberName}}}
Member Phone Number: {{{memberPhoneNumber}}}

Generate the message in a friendly yet professional tone.`,
});

const automatedPaymentRemindersFlow = ai.defineFlow(
  {
    name: 'automatedPaymentRemindersFlow',
    inputSchema: AutomatedPaymentRemindersInputSchema,
    outputSchema: AutomatedPaymentRemindersOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
