// app/(dashboard)/admin/users/UserDetailsDialog.tsx
'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/app/components/ui/dialog'
import { Button } from '@/app/components/ui/button'
import { Badge } from '@/app/components/ui/badge'
import { Separator } from '@/app/components/ui/separator'
import { Edit2, Mail, Phone, Building, Calendar, Award, Activity } from 'lucide-react'
import type { User } from './types'

interface UserDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User | null
  onEdit: () => void
}

const roleColors: Record<string, { bg: string; text: string }> = {
  ADMIN: { bg: 'bg-purple-100', text: 'text-purple-800' },
  DISPATCHER: { bg: 'bg-orange-100', text: 'text-orange-800' },
  NURSE: { bg: 'bg-blue-100', text: 'text-blue-800' },
}

export default function UserDetailsDialog({ open, onOpenChange, user, onEdit }: UserDetailsDialogProps) {
  if (!user) return null

  const roleColor = roleColors[user.role] || { bg: 'bg-gray-100', text: 'text-gray-800' }
  const joinDate = new Date(user.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>User Details</DialogTitle>
            <Badge className={`${roleColor.bg} ${roleColor.text}`}>{user.role}</Badge>
          </div>
          <DialogDescription>View complete profile information for this user.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Avatar and Basic Info */}
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center text-2xl font-bold text-indigo-600">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="h-16 w-16 rounded-full" />
              ) : (
                user.name.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold">{user.name}</h3>
              <p className="text-sm text-gray-500">{user.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`h-2 w-2 rounded-full ${user.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                <span className="text-xs text-gray-500">{user.isOnline ? 'Online' : 'Offline'}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Contact Information */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-500 uppercase">Contact Information</h4>
            <div className="grid gap-3">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-gray-400" />
                <span className="text-sm">{user.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-gray-400" />
                <span className="text-sm">{user.phone || 'Not provided'}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Department and Specializations */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-500 uppercase">Organization</h4>
            <div className="grid gap-3">
              <div className="flex items-center gap-3">
                <Building className="h-4 w-4 text-gray-400" />
                <span className="text-sm">{user.department?.name || 'Not assigned'}</span>
              </div>
              {user.specializations && user.specializations.length > 0 && (
                <div className="flex items-start gap-3">
                  <Award className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div className="flex flex-wrap gap-1">
                    {user.specializations.map((spec) => (
                      <Badge key={spec.specializationId} variant="outline" className="text-xs">
                        {spec.specialization?.name || 'Unknown'}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Statistics */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-500 uppercase">Statistics</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Activity className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-lg font-semibold">{user._count?.dispatches || 0}</p>
                  <p className="text-xs text-gray-500">Active Tasks</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm">{joinDate}</p>
                  <p className="text-xs text-gray-500">Joined</p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`h-3 w-3 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <span className="text-sm font-medium">{user.isActive ? 'Active' : 'Inactive'}</span>
            </div>
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit2 className="mr-2 h-4 w-4" />
              Edit User
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}