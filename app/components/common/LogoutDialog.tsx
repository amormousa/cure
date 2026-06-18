// app/components/common/LogoutDialog.tsx
'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog'
import { Button } from '@/app/components/ui/button'
import { LogOut, ShieldAlert } from 'lucide-react'

interface LogoutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  loading: boolean
}

export function LogoutDialog({ open, onOpenChange, onConfirm, loading }: LogoutDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[420px]"
        style={{
          backgroundColor: 'var(--cure-bg-elevated)',
          borderColor: 'var(--cure-border)',
          color: 'var(--cure-text)',
        }}
      >
        <DialogHeader>
          <div className="flex items-start gap-4">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
              style={{
                backgroundColor: 'rgba(239,68,68,0.12)',
                color: '#EF4444',
              }}
            >
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div className="flex-1 space-y-1.5">
              <DialogTitle
                className="text-base font-bold"
                style={{ color: 'var(--cure-text)' }}
              >
                Sign Out of CURE
              </DialogTitle>
              <DialogDescription
                className="text-sm leading-relaxed"
                style={{ color: 'var(--cure-text-dim)' }}
              >
                Are you sure you want to log out of{' '}
                <span className="font-semibold" style={{ color: 'var(--cure-text)' }}>
                  CURE Command Center
                </span>
                ? Your session will be terminated and you will be redirected to the login page.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div
          className="rounded-lg border p-3 text-xs"
          style={{
            borderColor: 'var(--cure-border)',
            backgroundColor: 'var(--cure-bg-card)',
            color: 'var(--cure-text-dim)',
          }}
        >
          <ul className="space-y-1.5">
            <li className="flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-[var(--cure-text-dim)]" />
              All active sessions will be invalidated
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-[var(--cure-text-dim)]" />
              Local cache and permissions will be cleared
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-[var(--cure-text-dim)]" />
              You can safely close this window after logout
            </li>
          </ul>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            style={{
              borderColor: 'var(--cure-border)',
              color: 'var(--cure-text)',
            }}
          >
            Stay Signed In
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={loading}
            className="min-w-[140px]"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Signing Out...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <LogOut className="h-4 w-4" />
                Yes, Sign Out
              </span>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
