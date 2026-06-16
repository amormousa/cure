// app/(dashboard)/admin/users/DeleteConfirmDialog.tsx
'use client'

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog'
import { Button } from '@/app/components/ui/button'
import { AlertCircle } from 'lucide-react'

interface User {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'DISPATCHER' | 'NURSE'
  phone: string | null
  isActive: boolean
  isOnline: boolean
}

interface DeleteConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User | null
  onConfirm: () => void
  loading: boolean
}

export default function DeleteConfirmDialog({
  open,
  onOpenChange,
  user,
  onConfirm,
  loading,
}: DeleteConfirmDialogProps) {
  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            Delete User Account
          </DialogTitle>
          <DialogDescription>
            This action will deactivate the user account. The account can be reactivated later.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg bg-red-50 p-4">
            <p className="text-sm font-medium text-red-900">
              Are you sure you want to delete <strong>{user.name}</strong> ({user.email})?
            </p>
            <ul className="mt-3 space-y-1 text-xs text-red-800">
              <li>• The account will be marked as inactive</li>
              <li>• All assigned tasks will remain but new assignments won't be possible</li>
              <li>• The account can be reactivated from the user settings</li>
              <li>• Audit logs will record this action</li>
            </ul>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                Deleting...
              </>
            ) : (
              'Delete User'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
