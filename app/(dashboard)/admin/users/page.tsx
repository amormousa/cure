// app/(dashboard)/admin/users/page.tsx
'use client'

import React, { useEffect, useState } from 'react'
import { Badge } from '@/app/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { LoadingSpinner } from '@/app/components/common/LoadingSpinner'
import { Search, Plus, Edit2, Trash2, UserX } from 'lucide-react'
import { userApi } from '@/app/lib/api/endpoints'
import { getErrorMessage } from '@/app/lib/api/client'
import UserDialog from './UserDialog'
import DeleteConfirmDialog from './DeleteConfirmDialog'

// Types
interface User {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'DISPATCHER' | 'NURSE'
  phone: string | null
  isActive: boolean
  isOnline: boolean
  avatar?: string
  _count?: { dispatches: number }
  createdAt?: string
  updatedAt?: string
}

const roleColors: Record<string, { bg: string; text: string; border: string }> = {
  ADMIN: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200' },
  DISPATCHER: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200' },
  NURSE: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [filterRole, setFilterRole] = useState<'ALL' | 'ADMIN' | 'DISPATCHER' | 'NURSE'>('ALL')
  const [filterActive, setFilterActive] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL')
  const [searchTerm, setSearchTerm] = useState('')

  // Dialog states
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const result = await userApi.list()
      if (result.ok && result.data?.data) {
        setUsers(
          result.data.data.map((u) => ({
            ...u,
            phone: u.phone ?? null,
            avatar: u.avatar ?? undefined,
            isActive: u.isActive ?? true,
            isOnline: u.isOnline ?? false,
          }))
        )
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleOpenUserDialog = (user?: User) => {
    if (user) {
      setEditingUser(user)
    } else {
      setEditingUser(null)
    }
    setIsUserDialogOpen(true)
  }

  const handleCloseUserDialog = () => {
    setIsUserDialogOpen(false)
    setEditingUser(null)
  }

  const handleUserSaved = () => {
    handleCloseUserDialog()
    fetchUsers()
  }

  const handleOpenDeleteDialog = (user: User) => {
    setUserToDelete(user)
    setIsDeleteDialogOpen(true)
  }

  const handleCloseDeleteDialog = () => {
    setIsDeleteDialogOpen(false)
    setUserToDelete(null)
  }

  const handleConfirmDelete = async () => {
    if (!userToDelete) return

    try {
      setDeleteLoading(true)
      const result = await userApi.delete(userToDelete.id)
      if (result.ok) {
        setUsers(users.filter((u) => u.id !== userToDelete.id))
        handleCloseDeleteDialog()
      }
    } catch (error) {
      console.error('Failed to delete user:', error)
    } finally {
      setDeleteLoading(false)
    }
  }

  const filteredUsers = users.filter((user) => {
    const matchRole = filterRole === 'ALL' ? true : user.role === filterRole
    const matchActive = filterActive === 'ALL' ? true : filterActive === 'ACTIVE' ? user.isActive : !user.isActive
    const matchSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    return matchRole && matchActive && matchSearch
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">Users Management</h2>
          <p className="text-sm text-gray-500">Manage all user accounts, roles, and permissions.</p>
        </div>
        <Button className="gap-2" onClick={() => handleOpenUserDialog()}>
          <Plus className="h-4 w-4" /> Add User
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col gap-4 rounded-lg border bg-white p-4 shadow-sm md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search by name or email..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="rounded-md border p-2 text-sm"
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value as any)}
        >
          <option value="ALL">All Roles</option>
          <option value="ADMIN">Admin</option>
          <option value="DISPATCHER">Dispatcher</option>
          <option value="NURSE">Nurse</option>
        </select>
        <select
          className="rounded-md border p-2 text-sm"
          value={filterActive}
          onChange={(e) => setFilterActive(e.target.value as any)}
        >
          <option value="ALL">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      {/* Table or Empty State */}
      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50">
          <LoadingSpinner className="h-8 w-8 text-indigo-600" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 bg-gray-50 text-gray-500">
          <UserX className="h-10 w-10 text-gray-400" />
          <p className="text-sm font-medium">No users found matching your filters.</p>
          <p className="text-xs text-gray-400">Try adjusting the search or filter options.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border bg-white shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden sm:table-cell">Email</TableHead>
                <TableHead className="hidden md:table-cell">Phone</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="hidden sm:table-cell">Presence</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => {
                const roleColor = roleColors[user.role]
                return (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-gray-600">{user.email}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm">{user.phone || '-'}</TableCell>
                    <TableCell>
                      <Badge className={`${roleColor.bg} ${roleColor.text} hover:${roleColor.bg} border ${roleColor.border}`}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {user.isOnline ? (
                        <span className="flex items-center gap-1 text-sm text-green-600">
                          <span className="h-2 w-2 rounded-full bg-green-600"></span>Online
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-sm text-gray-500">
                          <span className="h-2 w-2 rounded-full bg-gray-400"></span>Offline
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.isActive ? (
                        <span className="flex items-center gap-1 text-sm">
                          <span className="h-2 w-2 rounded-full bg-green-500"></span>
                          <span className="text-green-700">Active</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-sm">
                          <span className="h-2 w-2 rounded-full bg-red-500"></span>
                          <span className="text-red-700">Inactive</span>
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenUserDialog(user)}
                          className="gap-1"
                        >
                          <Edit2 className="h-4 w-4" />
                          <span className="hidden sm:inline">Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDeleteDialog(user)}
                          className="gap-1 text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="hidden sm:inline">Delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* User Dialog (Add/Edit) */}
      <UserDialog
        open={isUserDialogOpen}
        onOpenChange={setIsUserDialogOpen}
        editingUser={editingUser}
        onUserSaved={handleUserSaved}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        user={userToDelete}
        onConfirm={handleConfirmDelete}
        loading={deleteLoading}
      />
    </div>
  )
}
