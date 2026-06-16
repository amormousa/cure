// app/(dashboard)/admin/users/UserDialog.tsx
'use client'

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import { userApi } from '@/app/lib/api/endpoints'
import { getErrorMessage } from '@/app/lib/api/client'

interface User {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'DISPATCHER' | 'NURSE'
  phone: string | null
  isActive: boolean
  isOnline: boolean
  avatar?: string
  createdAt?: string
  updatedAt?: string
}

interface UserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingUser?: User | null
  onUserSaved?: () => void
}

interface FormData {
  name: string
  email: string
  password: string
  role: 'ADMIN' | 'DISPATCHER' | 'NURSE'
  phone: string
  isActive: boolean
}

export default function UserDialog({
  open,
  onOpenChange,
  editingUser,
  onUserSaved,
}: UserDialogProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    role: 'NURSE',
    phone: '',
    isActive: true,
  })
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')

  // Initialize form with editing user data
  useEffect(() => {
    if (editingUser) {
      setFormData({
        name: editingUser.name,
        email: editingUser.email,
        password: '',
        role: editingUser.role,
        phone: editingUser.phone || '',
        isActive: editingUser.isActive,
      })
    } else {
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'NURSE',
        phone: '',
        isActive: true,
      })
    }
    setFormError('')
  }, [editingUser, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)
    setFormError('')

    try {
      // Validation
      if (!formData.name.trim()) {
        setFormError('Name is required')
        setFormLoading(false)
        return
      }
      if (!formData.email.trim()) {
        setFormError('Email is required')
        setFormLoading(false)
        return
      }
      if (!editingUser && !formData.password) {
        setFormError('Password is required for new users')
        setFormLoading(false)
        return
      }
      if (!editingUser && formData.password.length < 6) {
        setFormError('Password must be at least 6 characters')
        setFormLoading(false)
        return
      }

      if (editingUser) {
        // Update existing user
        const updateData: any = {
          name: formData.name,
          role: formData.role,
          phone: formData.phone,
          isActive: formData.isActive,
        }
        if (formData.password) {
          updateData.password = formData.password
        }

        const result = await userApi.update(editingUser.id, updateData)
        if (result.ok) {
          onOpenChange(false)
          onUserSaved?.()
        } else {
          setFormError(getErrorMessage(result.error))
        }
      } else {
        // Create new user
        const result = await userApi.create({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          phone: formData.phone,
        })
        if (result.ok) {
          onOpenChange(false)
          onUserSaved?.()
        } else {
          setFormError(getErrorMessage(result.error))
        }
      }
    } catch (error) {
      setFormError('An error occurred')
      console.error(error)
    } finally {
      setFormLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle>
          <DialogDescription>
            {editingUser
              ? 'Update the user information below.'
              : 'Create a new user account and assign a role.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {formError && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
              {formError}
            </div>
          )}

          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="John Doe"
              disabled={formLoading}
              required
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="john@example.com"
              disabled={formLoading || !!editingUser}
              required
            />
            {editingUser && <p className="text-xs text-gray-500">Email cannot be changed</p>}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">
              Password {editingUser ? '(leave empty to keep current)' : '*'}
            </Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder={editingUser ? 'Leave empty to keep current password' : 'Minimum 6 characters'}
              disabled={formLoading}
              minLength={6}
              {...(!editingUser && { required: true })}
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+1234567890"
              disabled={formLoading}
            />
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label htmlFor="role">Role *</Label>
            <select
              id="role"
              value={formData.role}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  role: e.target.value as 'ADMIN' | 'DISPATCHER' | 'NURSE',
                })
              }
              disabled={formLoading}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              required
            >
              <option value="NURSE">Nurse</option>
              <option value="DISPATCHER">Dispatcher</option>
              <option value="ADMIN">Admin</option>
            </select>
            <p className="text-xs text-gray-500">
              Choose the user's role and permissions level.
            </p>
          </div>

          {/* Active Status */}
          {editingUser && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  disabled={formLoading}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Active Account</span>
              </Label>
              <p className="text-xs text-gray-500">
                Uncheck to deactivate this user account.
              </p>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={formLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={formLoading}>
              {formLoading ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                  {editingUser ? 'Updating...' : 'Creating...'}
                </>
              ) : editingUser ? (
                'Update User'
              ) : (
                'Create User'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
