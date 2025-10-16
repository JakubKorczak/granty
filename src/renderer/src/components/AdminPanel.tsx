import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, Edit2, Save } from 'lucide-react'
import type { AppData } from '@/types/electron'

interface AdminPanelProps {
  data: AppData
  onDataChange: (data: AppData) => void
}

export function AdminPanel({ data, onDataChange }: AdminPanelProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [newDirectLabel, setNewDirectLabel] = useState('')
  const [newIndirectLabel, setNewIndirectLabel] = useState('')
  const [newDirectGroupName, setNewDirectGroupName] = useState('')
  const [newIndirectGroupName, setNewIndirectGroupName] = useState('')

  const directGroupKeys = Object.keys(data.categories.DIRECT.groups)
  const indirectGroupKeys = Object.keys(data.categories.INDIRECT.groups)

  const [selectedDirectGroup, setSelectedDirectGroup] = useState<string>(directGroupKeys[0] || '')
  const [selectedIndirectGroup, setSelectedIndirectGroup] = useState<string>(
    indirectGroupKeys[0] || ''
  )

  // Rozpocznij edycję
  const startEdit = (id: string, currentLabel: string) => {
    setEditingId(id)
    setEditValue(currentLabel)
  }

  // Zapisz edycję - Koszty bezpośrednie
  const saveDirectEdit = (groupKey: string, itemId: string) => {
    const newData = JSON.parse(JSON.stringify(data)) // głęboka kopia
    const items = newData.categories.DIRECT.groups[groupKey]
    const index = items.findIndex((item: { id: string }) => item.id === itemId)
    if (index !== -1) {
      newData.categories.DIRECT.groups[groupKey] = items.map(
        (item: { id: string; label: string }, i: number) =>
          i === index ? { ...item, label: editValue } : item
      )
      onDataChange(newData)
    }
    setEditingId(null)
  }

  // Zapisz edycję - Koszty pośrednie
  const saveIndirectEdit = (groupKey: string, itemId: string) => {
    const newData = JSON.parse(JSON.stringify(data)) // głęboka kopia
    const items = newData.categories.INDIRECT.groups[groupKey]
    const index = items.findIndex((item: { id: string }) => item.id === itemId)
    if (index !== -1) {
      newData.categories.INDIRECT.groups[groupKey] = items.map(
        (item: { id: string; label: string }, i: number) =>
          i === index ? { ...item, label: editValue } : item
      )
      onDataChange(newData)
    }
    setEditingId(null)
  }

  // Usuń element - Koszty bezpośrednie
  const deleteDirectItem = (groupKey: string, itemId: string) => {
    if (!confirm('Czy na pewno chcesz usunąć tę kategorię?')) return

    const newData = JSON.parse(JSON.stringify(data)) // głęboka kopia
    newData.categories.DIRECT.groups[groupKey] = newData.categories.DIRECT.groups[groupKey].filter(
      (item: { id: string; label: string }) => item.id !== itemId
    )
    onDataChange(newData)
  }

  // Usuń element - Koszty pośrednie
  const deleteIndirectItem = (groupKey: string, itemId: string) => {
    if (!confirm('Czy na pewno chcesz usunąć tę kategorię?')) return

    const newData = JSON.parse(JSON.stringify(data)) // głęboka kopia
    newData.categories.INDIRECT.groups[groupKey] = newData.categories.INDIRECT.groups[
      groupKey
    ].filter((item: { id: string; label: string }) => item.id !== itemId)
    onDataChange(newData)
  }

  // Dodaj nowy element - Koszty bezpośrednie
  const addDirectItem = () => {
    if (!newDirectLabel.trim()) return

    const newData = JSON.parse(JSON.stringify(data)) // głęboka kopia
    const group = newData.categories.DIRECT.groups[selectedDirectGroup]
    const newId = `${selectedDirectGroup.charAt(0)}.${group.length + 1}`

    newData.categories.DIRECT.groups[selectedDirectGroup] = [
      ...group,
      { id: newId, label: newDirectLabel }
    ]
    onDataChange(newData)
    setNewDirectLabel('')
  }

  // Dodaj nowy element - Koszty pośrednie
  const addIndirectItem = () => {
    if (!newIndirectLabel.trim()) return

    const newData = JSON.parse(JSON.stringify(data)) // głęboka kopia
    const group = newData.categories.INDIRECT.groups[selectedIndirectGroup]
    const newId = `${selectedIndirectGroup.charAt(0)}.${group.length + 1}`

    newData.categories.INDIRECT.groups[selectedIndirectGroup] = [
      ...group,
      { id: newId, label: newIndirectLabel }
    ]
    onDataChange(newData)
    setNewIndirectLabel('')
  }

  // Dodaj nową grupę - Koszty bezpośrednie
  const addDirectGroup = () => {
    if (!newDirectGroupName.trim()) return
    if (data.categories.DIRECT.groups[newDirectGroupName]) {
      alert('Grupa o tej nazwie już istnieje!')
      return
    }

    const newData = JSON.parse(JSON.stringify(data))
    newData.categories.DIRECT.groups[newDirectGroupName] = []
    onDataChange(newData)
    setSelectedDirectGroup(newDirectGroupName)
    setNewDirectGroupName('')
  }

  // Dodaj nową grupę - Koszty pośrednie
  const addIndirectGroup = () => {
    if (!newIndirectGroupName.trim()) return
    if (data.categories.INDIRECT.groups[newIndirectGroupName]) {
      alert('Grupa o tej nazwie już istnieje!')
      return
    }

    const newData = JSON.parse(JSON.stringify(data))
    newData.categories.INDIRECT.groups[newIndirectGroupName] = []
    onDataChange(newData)
    setSelectedIndirectGroup(newIndirectGroupName)
    setNewIndirectGroupName('')
  }

  // Usuń grupę - Koszty bezpośrednie
  const deleteDirectGroup = (groupKey: string) => {
    if (!confirm(`Czy na pewno chcesz usunąć całą grupę "${groupKey}"?`)) return

    const newData = JSON.parse(JSON.stringify(data))
    delete newData.categories.DIRECT.groups[groupKey]
    onDataChange(newData)

    const remainingKeys = Object.keys(newData.categories.DIRECT.groups)
    if (remainingKeys.length > 0) {
      setSelectedDirectGroup(remainingKeys[0])
    }
  }

  // Usuń grupę - Koszty pośrednie
  const deleteIndirectGroup = (groupKey: string) => {
    if (!confirm(`Czy na pewno chcesz usunąć całą grupę "${groupKey}"?`)) return

    const newData = JSON.parse(JSON.stringify(data))
    delete newData.categories.INDIRECT.groups[groupKey]
    onDataChange(newData)

    const remainingKeys = Object.keys(newData.categories.INDIRECT.groups)
    if (remainingKeys.length > 0) {
      setSelectedIndirectGroup(remainingKeys[0])
    }
  }

  return (
    <div className="space-y-8">
      {/* Koszty Bezpośrednie */}
      <Card className="border-2 border-blue-200 shadow-lg">
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold text-blue-900 mb-6 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-600"></span>
            Koszty Bezpośrednie
          </h2>

          {/* Selektor grupy */}
          <div className="mb-6">
            <Label className="text-sm font-semibold mb-2 block">Wybierz grupę:</Label>
            <div className="flex gap-3 flex-wrap items-center">
              {directGroupKeys.map((groupKey) => (
                <div key={groupKey} className="flex gap-1">
                  <Button
                    variant={selectedDirectGroup === groupKey ? 'default' : 'outline'}
                    onClick={() => setSelectedDirectGroup(groupKey)}
                    className="transition-all duration-200"
                  >
                    {groupKey}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteDirectGroup(groupKey)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Dodaj nową grupę */}
            <div className="flex gap-3 mt-4 pt-4 border-t border-gray-200">
              <Input
                placeholder="Nazwa nowej grupy..."
                value={newDirectGroupName}
                onChange={(e) => setNewDirectGroupName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addDirectGroup()
                }}
              />
              <Button onClick={addDirectGroup} className="whitespace-nowrap" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Dodaj grupę
              </Button>
            </div>
          </div>

          {/* Lista elementów wybranej grupy */}
          <div className="space-y-3 mb-6">
            {(data.categories.DIRECT.groups[selectedDirectGroup] || []).map((item, idx) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-all duration-200"
              >
                <span className="text-sm font-mono text-gray-500 min-w-[60px]">{idx + 1}</span>

                {editingId === item.id ? (
                  <Input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="flex-1"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveDirectEdit(selectedDirectGroup, item.id)
                      if (e.key === 'Escape') setEditingId(null)
                    }}
                  />
                ) : (
                  <span className="flex-1 text-gray-900">{item.label}</span>
                )}

                <div className="flex gap-2">
                  {editingId === item.id ? (
                    <Button
                      size="sm"
                      onClick={() => saveDirectEdit(selectedDirectGroup, item.id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => startEdit(item.id, item.label)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteDirectItem(selectedDirectGroup, item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Dodaj nowy element */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Input
              placeholder="Nazwa nowej kategorii..."
              value={newDirectLabel}
              onChange={(e) => setNewDirectLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') addDirectItem()
              }}
            />
            <Button onClick={addDirectItem} className="whitespace-nowrap">
              <Plus className="h-4 w-4 mr-2" />
              Dodaj
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Koszty Pośrednie */}
      <Card className="border-2 border-indigo-200 shadow-lg">
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold text-indigo-900 mb-6 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-indigo-600"></span>
            Koszty Pośrednie
          </h2>

          {/* Selektor grupy */}
          <div className="mb-6">
            <Label className="text-sm font-semibold mb-2 block">Wybierz grupę:</Label>
            <div className="flex gap-3 flex-wrap items-center">
              {indirectGroupKeys.map((groupKey) => (
                <div key={groupKey} className="flex gap-1">
                  <Button
                    variant={selectedIndirectGroup === groupKey ? 'default' : 'outline'}
                    onClick={() => setSelectedIndirectGroup(groupKey)}
                    className="transition-all duration-200"
                  >
                    {groupKey}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteIndirectGroup(groupKey)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Dodaj nową grupę */}
            <div className="flex gap-3 mt-4 pt-4 border-t border-gray-200">
              <Input
                placeholder="Nazwa nowej grupy..."
                value={newIndirectGroupName}
                onChange={(e) => setNewIndirectGroupName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addIndirectGroup()
                }}
              />
              <Button onClick={addIndirectGroup} className="whitespace-nowrap" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Dodaj grupę
              </Button>
            </div>
          </div>

          {/* Lista elementów wybranej grupy */}
          <div className="space-y-3 mb-6">
            {(data.categories.INDIRECT.groups[selectedIndirectGroup] || []).map((item, idx) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-indigo-300 transition-all duration-200"
              >
                <span className="text-sm font-mono text-gray-500 min-w-[60px]">{idx + 1}</span>

                {editingId === item.id ? (
                  <Input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="flex-1"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveIndirectEdit(selectedIndirectGroup, item.id)
                      if (e.key === 'Escape') setEditingId(null)
                    }}
                  />
                ) : (
                  <span className="flex-1 text-gray-900">{item.label}</span>
                )}

                <div className="flex gap-2">
                  {editingId === item.id ? (
                    <Button
                      size="sm"
                      onClick={() => saveIndirectEdit(selectedIndirectGroup, item.id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => startEdit(item.id, item.label)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteIndirectItem(selectedIndirectGroup, item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Dodaj nowy element */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Input
              placeholder="Nazwa nowej kategorii..."
              value={newIndirectLabel}
              onChange={(e) => setNewIndirectLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') addIndirectItem()
              }}
            />
            <Button onClick={addIndirectItem} className="whitespace-nowrap">
              <Plus className="h-4 w-4 mr-2" />
              Dodaj
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
