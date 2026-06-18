// app/(dashboard)/admin/users/page.tsx
'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { Badge } from '@/app/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { LoadingSpinner } from '@/app/components/common/LoadingSpinner'
import { Search, Plus, Edit2, Trash2, UserX, ChevronLeft, ChevronRight, Users as UsersIcon, Calendar, Mail, Phone, Building, Award } from 'lucide-react'
import { userApi } from '@/app/lib/api/endpoints'
import { getErrorMessage } from '@/app/lib/api/client'
import UserDialog from './UserDialog'
import DeleteConfirmDialog from './DeleteConfirmDialog'
import UserDetailsDialog from './UserDetailsDialog'
import type { User, Department, Specialization } from './types'

const roleColors: Record<string, { bg: string; text: string; border: string }> = {
  ADMIN: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200' },
  DISPATCHER: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200' },
  NURSE: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
}

const ITEMS_PER_PAGE = 10

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1, limit: ITEMS_PER_PAGE })
  const [filterRole, setFilterRole] = useState<'ALL' | 'ADMIN' | 'DISPATCHER' | 'NURSE'>('ALL')
  const [filterActive, setFilterActive] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL')
  const [searchTerm, setSearchTerm] = useState('')
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null)

  // Dialog states
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [viewingUser, setViewingUser] = useState<User | null>(null)

  // Status toggle loading
  const [statusToggleLoading, setStatusToggleLoading] = useState<string | null>(null)

  const fetchUsers = useCallback(async (page = 1) => {
    try {
      setLoading(true)
      const isActive = filterActive === 'ALL' ? undefined : filterActive === 'ACTIVE'
      const result = await userApi.list({
        role: filterRole === 'ALL' ? undefined : filterRole,
        search: searchTerm || undefined,
        isActive,
        page,
        limit: ITEMS_PER_PAGE,
      })

      if (result.ok && result.data?.data) {
        setUsers(result.data.data)
        if (result.data.pagination) {
          setPagination({
            total: result.data.pagination.total,
            page: result.data.pagination.page,
            pages: result.data.pagination.pages,
            limit: result.data.pagination.limit,
          })
        }
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }, [filterRole, filterActive, searchTerm])

  // Initial load
  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  // Debounced search
  useEffect(() => {
    if (searchTimeout) clearTimeout(searchTimeout)
    const timeout = setTimeout(() => {
      fetchUsers(1) // Reset to page 1 on search
    }, 300)
    setSearchTimeout(timeout)
    return () => {
      if (timeout) clearTimeout(timeout)
    }
  }, [searchTerm])

  // Reset to page 1 when filters change
  useEffect(() => {
    fetchUsers(1)
  }, [filterRole, filterActive])

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      fetchUsers(newPage)
    }
  }

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
    fetchUsers(pagination.page)
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
        // Refresh to maintain pagination
        fetchUsers(pagination.page)
      }
    } catch (error) {
      console.error('Failed to delete user:', error)
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleOpenDetailsDialog = async (user: User) => {
    setViewingUser(user)
    setIsDetailsDialogOpen(true)
  }

  const handleCloseDetailsDialog = () => {
    setIsDetailsDialogOpen(false)
    setViewingUser(null)
  }

  const handleToggleStatus = async (user: User) => {
    try {
      setStatusToggleLoading(user.id)
      const newStatus = !user.isActive
      await userApi.update(user.id, { isActive: newStatus })
      // Update local state
      setUsers(users.map(u => u.id === user.id ? { ...u, isActive: newStatus } : u))
    } catch (error) {
      console.error('Failed to toggle status:', error)
    } finally {
      setStatusToggleLoading(null)
    }
  }

  const filteredUsers = users // Already filtered from server

  // Calculate pagination display
  const startItem = (pagination.page - 1) * pagination.limit + 1
  const endItem = Math.min(pagination.page * pagination.limit, pagination.total)

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
            placeholder="Search by name, email, or phone..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value as any)}
        >
          <option value="ALL">All Roles</option>
          <option value="ADMIN">Admin</option>
          <option value="DISPATCHER">Dispatcher</option>
          <option value="NURSE">Nurse</option>
        </select>
        <select
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
        <div className="space-y-4">
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
                    <TableRow key={user.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        <button
                          onClick={() => handleOpenDetailsDialog(user)}
                          className="text-left hover:text-indigo-600 hover:underline"
                        >
                          {user.name}
                        </button>
                      </TableCell>
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
                            <span className="h-2 w-2 rounded-full bg-green-600 animate-pulse"></span>Online
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-sm text-gray-500">
                            <span className="h-2 w-2 rounded-full bg-gray-400"></span>Offline
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => handleToggleStatus(user)}
                          disabled={statusToggleLoading === user.id}
                          className={`flex items-center gap-1 text-sm cursor-pointer hover:opacity-75 transition-opacity ${
                            user.isActive ? 'text-green-700' : 'text-red-700'
                          }`}
                        >
                          {statusToggleLoading === user.id ? (
                            <LoadingSpinner className="h-3 w-3" />
                          ) : user.isActive ? (
                            <>
                              <span className="h-2 w-2 rounded-full bg-green-500"></span>
                              <span>Active</span>
                            </>
                          ) : (
                            <>
                              <span className="h-2 w-2 rounded-full bg-red-500"></span>
                              <span>Inactive</span>
                            </>
                          )}
                        </button>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDetailsDialog(user)}
                            className="h-8 w-8 p-0"
                            title="View details"
                          >
                            <UsersIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenUserDialog(user)}
                            className="h-8 w-8 p-0"
                            title="Edit"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDeleteDialog(user)}
                            className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex flex-col items-center justify-between gap-4 rounded-lg border bg-white px-4 py-3 sm:flex-row">
              <div className="text-sm text-gray-600">
                Showing <span className="font-medium">{startItem}</span> to{' '}
                <span className="font-medium">{endItem}</span> of{' '}
                <span className="font-medium">{pagination.total}</span> results
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-gray-600">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.pages}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* User Dialog (Add/Edit) */}
      <UserDialog
        open={isUserDialogOpen}
        onOpenChange={setIsUserDialogOpen}
        editingUser={editingUser as any}
        onUserSaved={handleUserSaved}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        user={userToDelete as any}
        onConfirm={handleConfirmDelete}
        loading={deleteLoading}
      />

      {/* User Details Dialog */}
      <UserDetailsDialog
        open={isDetailsDialogOpen}
        onOpenChange={setIsDetailsDialogOpen}
        user={viewingUser}
        onEdit={() => {
          handleCloseDetailsDialog()
          handleOpenUserDialog(viewingUser!)
        }}
      />
    </div>
  )
}