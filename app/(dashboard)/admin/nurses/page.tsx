// app/(dashboard)/admin/nurses/page.tsx
'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/app/components/ui/badge'
import { Switch } from '@/app/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/app/components/ui/dialog'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import { LoadingSpinner } from '@/app/components/common/LoadingSpinner'
import { Search, Plus, UserX } from 'lucide-react'

// Types
type Nurse = {
  id: string
  name: string
  email: string
  phone: string | null
  isActive: boolean
  isOnline: boolean
  _count?: { dispatches: number }
}

export default function NursesPage() {
  const [nurses, setNurses] = useState<Nurse[]>([])
  const [loading, setLoading] = useState(true)
  const [filterActive, setFilterActive] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL')
  const [filterOnline, setFilterOnline] = useState<'ALL' | 'ONLINE' | 'OFFLINE'>('ALL')
  const [searchTerm, setSearchTerm] = useState('')
  
  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '' })
  const [formError, setFormError] = useState('')

  const fetchNurses = async () => {
    try {
      const res = await fetch('/api/users')
      const { data } = await res.json()
      if (res.ok) {
        setNurses(data.filter((u: any) => u.role === 'NURSE'))
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNurses()
  }, [])

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      })
      if (res.ok) {
        setNurses(nurses.map(n => n.id === id ? { ...n, isActive: !currentStatus } : n))
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)
    setFormError('')
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, role: 'NURSE' }),
      })
      const data = await res.json()
      if (res.ok) {
        setIsDialogOpen(false)
        setFormData({ name: '', email: '', phone: '', password: '' })
        fetchNurses()
      } else {
        setFormError(data.error || 'Failed to create nurse')
      }
    } catch (e) {
      setFormError('An error occurred')
    } finally {
      setFormLoading(false)
    }
  }

  const filteredNurses = nurses.filter(n => {
    const matchActive = filterActive === 'ALL' ? true : filterActive === 'ACTIVE' ? n.isActive : !n.isActive
    const matchOnline = filterOnline === 'ALL' ? true : filterOnline === 'ONLINE' ? n.isOnline : !n.isOnline
    const matchSearch = n.name.toLowerCase().includes(searchTerm.toLowerCase()) || n.email.toLowerCase().includes(searchTerm.toLowerCase())
    return matchActive && matchOnline && matchSearch
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">Nurses Management</h2>
          <p className="text-sm text-gray-500">Manage nurses, their status, and active assignments.</p>
        </div>
        <Button className="gap-2" onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4" /> Add Nurse
        </Button>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Nurse</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 pt-4">
              {formError && <div className="rounded-md bg-red-50 p-2 text-sm text-red-600">{formError}</div>}
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Temporary Password</Label>
                <Input id="password" type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required minLength={8} />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={formLoading}>{formLoading ? 'Creating...' : 'Create'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col gap-4 rounded-lg border bg-white p-4 shadow-sm md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input placeholder="Search by name or email..." className="pl-9" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <select className="rounded-md border p-2 text-sm" value={filterActive} onChange={e => setFilterActive(e.target.value as any)}>
          <option value="ALL">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
        <select className="rounded-md border p-2 text-sm" value={filterOnline} onChange={e => setFilterOnline(e.target.value as any)}>
          <option value="ALL">All Presence</option>
          <option value="ONLINE">Online</option>
          <option value="OFFLINE">Offline</option>
        </select>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50">
          <LoadingSpinner className="h-8 w-8 text-indigo-600" />
        </div>
      ) : filteredNurses.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 bg-gray-50 text-gray-500">
          <UserX className="h-10 w-10 text-gray-400" />
          <p className="text-sm font-medium">No nurses found matching your filters.</p>
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
                <TableHead>Tasks</TableHead>
                <TableHead className="hidden sm:table-cell">Presence</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredNurses.map((nurse) => (
                <TableRow key={nurse.id}>
                  <TableCell className="font-medium">
                    <Link href={`/admin/nurses/${nurse.id}`} className="text-indigo-600 hover:underline">
                      {nurse.name}
                    </Link>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{nurse.email}</TableCell>
                  <TableCell className="hidden md:table-cell">{nurse.phone || '-'}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{nurse._count?.dispatches || 0} active</Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {nurse.isOnline ? (
                      <span className="flex items-center gap-1 text-sm text-green-600"><span className="h-2 w-2 rounded-full bg-green-600"></span>Online</span>
                    ) : (
                      <span className="flex items-center gap-1 text-sm text-gray-500"><span className="h-2 w-2 rounded-full bg-gray-400"></span>Offline</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch checked={nurse.isActive} onCheckedChange={() => toggleStatus(nurse.id, nurse.isActive)} />
                      <span className="hidden text-sm text-gray-500 sm:inline">{nurse.isActive ? 'Active' : 'Inactive'}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
