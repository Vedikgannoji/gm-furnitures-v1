import React, { useState } from 'react'
import { Plus, Edit3, Trash2, Home, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { mockRooms, mockProducts } from '@/data/mockData'
import { Room } from '@/types'
import { useToast } from '@/context/ToastContext'

export const AdminRoomsPage: React.FC = () => {
  const { showToast } = useToast()
  const [rooms, setRooms] = useState<Room[]>(mockRooms)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRoom, setEditingRoom] = useState<Room | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    tagline: '',
    description: '',
    image: '',
    featuredProductIds: [] as string[],
  })

  const openAdd = () => {
    setEditingRoom(null)
    setFormData({
      name: '',
      slug: '',
      tagline: '',
      description: '',
      image: '',
      featuredProductIds: ['gm-prod-01', 'gm-prod-03'],
    })
    setIsModalOpen(true)
  }

  const openEdit = (room: Room) => {
    setEditingRoom(room)
    setFormData({
      name: room.name,
      slug: room.slug,
      tagline: room.tagline,
      description: room.description,
      image: room.image,
      featuredProductIds: room.featuredProductIds,
    })
    setIsModalOpen(true)
  }

  const handleDelete = (id: string) => {
    setRooms((prev) => prev.filter((r) => r.id !== id))
    showToast('Room Removed', 'Room showcase removed.', 'info')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingRoom) {
      setRooms((prev) =>
        prev.map((r) => (r.id === editingRoom.id ? { ...r, ...formData } : r))
      )
      showToast('Room Updated', `"${formData.name}" was modified.`, 'success')
    } else {
      const newRoom: Room = {
        id: `room-${Date.now()}`,
        name: formData.name,
        slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-'),
        tagline: formData.tagline,
        description: formData.description,
        image:
          formData.image ||
          'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1600&q=80',
        featuredProductIds: formData.featuredProductIds,
      }
      setRooms((prev) => [...prev, newRoom])
      showToast('Room Created', `New room environment "${formData.name}" created.`, 'success')
    }
    setIsModalOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-border gap-4">
        <div>
          <span className="editorial-badge text-muted">Spatial Showcase</span>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight mt-1">
            Room Environment Curations
          </h1>
          <p className="text-xs text-muted mt-0.5">
            Manage "Shop the Room" architectural interior sets and linked catalog pieces.
          </p>
        </div>

        <Button variant="primary" size="md" onClick={openAdd} className="flex items-center gap-1.5">
          <Plus className="w-4 h-4" />
          <span>Add Room Curation</span>
        </Button>
      </div>

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
                  {room.featuredProductIds.length} Linked Pieces
                </span>
              </div>

              <div className="p-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-foreground">{room.name}</h3>
                  <Link
                    to={`/rooms/${room.slug}`}
                    target="_blank"
                    className="text-muted hover:text-foreground p-1"
                    title="View live room suite"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
                <p className="text-xs text-muted mt-1 italic">"{room.tagline}"</p>
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
                  onClick={() => handleDelete(room.id)}
                  className="p-1 text-muted hover:text-rose-600 transition-colors"
                  title="Remove room"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Room Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRoom ? 'Edit Room Curation' : 'Create Room Environment'}
        description="Configure room suite metadata and assigned furniture pieces."
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
                  slug: e.target.value.toLowerCase().replace(/\s+/g, '-'),
                })
              }
              className="w-full h-10 bg-background border border-border px-3 text-xs focus:border-foreground focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
              Tagline
            </label>
            <input
              type="text"
              required
              value={formData.tagline}
              onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
              className="w-full h-10 bg-background border border-border px-3 text-xs focus:border-foreground focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
              Showcase Image URL
            </label>
            <input
              type="url"
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              className="w-full h-10 bg-background border border-border px-3 text-xs focus:border-foreground focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
              Atmosphere Description
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-background border border-border p-3 text-xs focus:border-foreground focus:outline-none"
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
            <Button type="submit" variant="primary" size="sm">
              Save Room Curation
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
