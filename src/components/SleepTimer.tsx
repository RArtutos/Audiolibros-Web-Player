import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Moon, X } from 'lucide-react';
import { cn } from '../lib/utils';

interface SleepTimerProps {
  activeTimer: number | null;
  onTimerSet: (minutes: number) => void;
  remainingTime: string | null;
}

const TIMER_OPTIONS = [
  { label: '15 minutos', value: 15 },
  { label: '30 minutos', value: 30 },
  { label: '45 minutos', value: 45 },
  { label: '60 minutos', value: 60 },
  { label: '90 minutos', value: 90 },
  { label: '120 minutos', value: 120 }
];

export default function SleepTimer({ activeTimer, onTimerSet, remainingTime }: SleepTimerProps) {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className={cn(
            "relative p-2 rounded-full transition-all",
            activeTimer ? "text-secondary" : "text-textSecondary hover:bg-background"
          )}
        >
          <Moon className="w-5 h-5" />
          {activeTimer && remainingTime && (
            <div className="absolute -top-2 -right-2 text-xs bg-secondary text-white px-1 rounded-full">
              {remainingTime}
            </div>
          )}
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-surface p-6 rounded-xl shadow-xl border border-border">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-semibold text-text">
              Temporizador de sueño
            </Dialog.Title>
            <Dialog.Close className="p-2 hover:bg-background rounded-full">
              <X className="w-5 h-5" />
            </Dialog.Close>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {TIMER_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => onTimerSet(option.value)}
                className={cn(
                  "p-4 rounded-xl transition-all text-center",
                  activeTimer === option.value
                    ? "bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-accent/25"
                    : "bg-background text-textSecondary hover:bg-opacity-70"
                )}
              >
                <div className="font-medium">{option.label}</div>
                {activeTimer === option.value && remainingTime && (
                  <div className="text-sm opacity-80">Restante: {remainingTime}</div>
                )}
              </button>
            ))}
          </div>

          {activeTimer && (
            <button
              onClick={() => onTimerSet(activeTimer)}
              className="w-full mt-4 p-3 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
            >
              Cancelar temporizador
            </button>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}