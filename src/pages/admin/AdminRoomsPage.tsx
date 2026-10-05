import React, { useState, useEffect } from 'react'
import { Plus, Edit3, Trash2, ExternalLink, Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Room } from '@/types'
import { useToast } from '@/context/ToastContext'

export const AdminRoomsPage: React.FC = () => {
  const { showToast } = useToast()
  const [rooms, setRooms] = useState<Room[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingRoom, setEditingRoom] = useState<Room | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    tagline: '',
    description: '',
    image: '',
  })

  const fetchRooms = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/rooms')
      if (res.ok) {
        const data = await res.json()
        setRooms(data)
      } else {
        showToast('Error', 'Failed to load rooms from database.', 'error')
      }
    } catch {
      showToast('Error', 'Network error loading rooms.', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchRooms()
  }, [])

  const openAdd = () => {
    setEditingRoom(null)
    setFormData({
      name: '',
      slug: '',
      tagline: '',
      description: '',
      image: '',
    })
    setIsModalOpen(true)
  }

  const openEdit = (room: Room) => {
    setEditingRoom(room)
    setFormData({
      name: room.name,
      slug: room.slug,
      tagline: room.tagline || '',
      description: room.description || '',
      image: room.image || '',
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete the room "${name}"?`)) {
      return
    }

    try {
      const token = localStorage.getItem('gm_auth_token')
      const res = await fetch(`/api/admin/rooms/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (res.ok) {
        setRooms((prev) => prev.filter((r) => r.id !== id))
        showToast('Room Deleted', `Room "${name}" was permanently removed.`, 'info')
      } else {
        const err = await res.json()
        showToast('Delete Failed', err.message || 'Could not delete room.', 'error')
      }
    } catch {
      showToast('Error', 'Network error deleting room.', 'error')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    const token = localStorage.getItem('gm_auth_token')

    try {
      if (editingRoom) {
        const res = await fetch(`/api/admin/rooms/${editingRoom.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        })
        if (res.ok) {
          const updated = await res.json()
          setRooms((prev) =>
            prev.map((r) => (r.id === editingRoom.id ? updated : r))
          )
          showToast('Room Updated', `Room "${formData.name}" saved.`, 'success')
          setIsModalOpen(false)
        } else {
          const err = await res.json()
          showToast('Update Failed', err.message || 'Could not update room.', 'error')
        }
      } else {
        const res = await fetch('/api/admin/rooms', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        })
        if (res.ok) {
          const created = await res.json()
          setRooms((prev) => [...prev, created])
          showToast('Room Created', `New room "${formData.name}" added to database.`, 'success')
          setIsModalOpen(false)
        } else {
          const err = await res.json()
          showToast('Creation Failed', err.message || 'Could not create room.', 'error')
        }
      }
    } catch {
      showToast('Error', 'Network error saving room.', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-border gap-4">
        <div>
          <span className="editorial-badge text-muted">Rooms</span>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight mt-1">
            Rooms
          </h1>
          <p className="text-xs text-muted mt-0.5">
            Manage "Shop by Room" categories and imagery stored in PostgreSQL.
          </p>
        </div>

        <Button variant="primary" size="md" onClick={openAdd} className="flex items-center gap-1.5">
          <Plus className="w-4 h-4" />
          <span>Add Room</span>
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted" />
        </div>
      ) : rooms.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-lg">
          <p className="text-sm font-medium text-foreground">No rooms found in database</p>
          <p className="text-xs text-muted mt-1">Click "Add Room" above to create your first room category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="bg-background border border-border flex flex-col justify-between overflow-hidden"
            >
              <div>
                <div className="relative aspect-[16/9] w-full bg-surface overflow-hidden">
                  <img src={room.image} alt={room.name} className="w-full h-full object-cover" />
                  <span className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/80 text-white text-[10px] uppercase font-mono">
                    {room.featuredProductIds ? room.featuredProductIds.length : 0} Products
                  </span>
                </div>

                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-foreground">{room.name}</h3>
                    <Link
                      to={`/rooms/${room.slug}`}
                      target="_blank"
                      className="text-muted hover:text-foreground p-1"
                      title="View live room page"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                  {room.tagline && (
                    <p className="text-xs text-muted mt-1 italic">"{room.tagline}"</p>
                  )}
                  <p className="text-xs text-muted mt-2 line-clamp-2 leading-relaxed">
                    {room.description}
                  </p>
                </div>
              </div>

              <div className="p-4 pt-0 border-t border-border mt-auto flex items-center justify-between text-xs">
                <span className="font-mono text-[11px] text-muted">/rooms/{room.slug}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEdit(room)}
                    className="p-1 text-muted hover:text-foreground transition-colors"
                    title="Edit room"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(room.id, room.name)}
                    className="p-1 text-muted hover:text-rose-600 transition-colors"
                    title="Delete room"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Room Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRoom ? 'Edit Room' : 'Create Room'}
        description="Configure room details and storefront display."
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs pt-2">
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
              Room Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  name: e.target.value,
                  slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
                })
              }
              className="w-full h-10 bg-background border border-border px-3 text-xs focus:border-foreground focus:outline-none"
              placeholder="e.g. Dining Room, Living Room"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
              Tagline
            </label>
            <input
              type="text"
              value={formData.tagline}
              onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
              className="w-full h-10 bg-background border border-border px-3 text-xs focus:border-foreground focus:outline-none"
              placeholder="e.g. Thoughtful spaces for gathering and dining"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
              Image URL
            </label>
            <input
              type="url"
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              className="w-full h-10 bg-background border border-border px-3 text-xs focus:border-foreground focus:outline-none"
              placeholder="https://images.unsplash.com/..."
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-background border border-border p-3 text-xs focus:border-foreground focus:outline-none"
              placeholder="Brief description of this room"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Room'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
