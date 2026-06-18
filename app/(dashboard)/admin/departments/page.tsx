'use client'

import { useEffect, useMemo, useState } from 'react'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'
import { departmentApi, type Department } from '@/app/lib/api/endpoints'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Badge } from '@/app/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog'
import { Label } from '@/app/components/ui/label'

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Department | null>(null)
  const [form, setForm] = useState({ name: '', description: '' })
  const [error, setError] = useState('')

  const filtered = useMemo(
    () =>
      departments
        .filter((department) => department.name.toLowerCase().includes(query.toLowerCase()))
        .sort((a, b) => {
          // Active items first, then inactive
          if (a.isActive === b.isActive) return 0
          return a.isActive ? -1 : 1
        }),
    [departments, query],
  )

  async function loadDepartments() {
    setLoading(true)
    const response = await departmentApi.list()
    if (response.ok && response.data) setDepartments(response.data.data)
    setLoading(false)
  }

  useEffect(() => {
    loadDepartments()
  }, [])

  function startCreate() {
    setEditing(null)
    setForm({ name: '', description: '' })
    setError('')
    setOpen(true)
  }

  function startEdit(department: Department) {
    setEditing(department)
    setForm({ name: department.name, description: department.description ?? '' })
    setError('')
    setOpen(true)
  }

  async function saveDepartment() {
    setSaving(true)
    setError('')
    const payload = { name: form.name.trim(), description: form.description.trim() || null }
    const response = editing
      ? await departmentApi.update(editing.id, payload)
      : await departmentApi.create(payload)

    if (!response.ok) {
      setError(response.error?.message ?? 'Unable to save department')
      setSaving(false)
      return
    }

    setOpen(false)
    setSaving(false)
    await loadDepartments()
  }

  async function disableDepartment(department: Department) {
    await departmentApi.delete(department.id)
    await loadDepartments()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Departments</h1>
          <p className="text-sm text-gray-600">Manage operational teams and nurse grouping.</p>
        </div>
        <Button onClick={startCreate}>
          <Plus className="mr-2 h-4 w-4" />
          New Department
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        <Input className="pl-9" placeholder="Search departments" value={query} onChange={(event) => setQuery(event.target.value)} />
      </div>

      <div className="overflow-hidden rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Users</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><td className="px-4 py-6 text-center text-gray-500" colSpan={5}>Loading departments...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td className="px-4 py-6 text-center text-gray-500" colSpan={5}>No departments found</td></tr>
            ) : filtered.map((department) => (
              <tr key={department.id}>
                <td className="px-4 py-3 font-medium">{department.name}</td>
                <td className="px-4 py-3 text-gray-600">{department.description || '-'}</td>
                <td className="px-4 py-3">{department._count?.users ?? 0}</td>
                <td className="px-4 py-3"><Badge variant={department.isActive ? 'default' : 'secondary'}>{department.isActive ? 'Active' : 'Inactive'}</Badge></td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => startEdit(department)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="outline" size="sm" onClick={() => disableDepartment(department)} disabled={!department.isActive}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit Department' : 'Create Department'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input id="description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={saveDepartment} disabled={saving || form.name.trim().length < 2}>{saving ? 'Saving...' : 'Save'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
