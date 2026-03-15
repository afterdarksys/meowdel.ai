"use client"

import { useState } from 'react'
import { Tag, Plus, X } from 'lucide-react'

export interface TagManagerProps {
  tags: string[]
  onTagsChange?: (tags: string[]) => void
}

export function TagManager({ tags: initialTags, onTagsChange }: TagManagerProps) {
  const [tags, setTags] = useState<string[]>(initialTags || [])
  const [inputValue, setInputValue] = useState('')
  const [isEditing, setIsEditing] = useState(false)

  const handleAddTag = () => {
    if (!inputValue.trim()) return
    const newTag = inputValue.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-')
    
    if (!tags.includes(newTag)) {
      const newTags = [...tags, newTag]
      setTags(newTags)
      if (onTagsChange) onTagsChange(newTags)
    }
    setInputValue('')
    setIsEditing(false)
  }

  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = tags.filter(t => t !== tagToRemove)
    setTags(newTags)
    if (onTagsChange) onTagsChange(newTags)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    } else if (e.key === 'Escape') {
      setIsEditing(false)
      setInputValue('')
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 mt-2">
      {tags.map(tag => (
        <span 
          key={tag} 
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium group transition-colors hover:bg-primary/20"
        >
          <Tag className="w-3 h-3" />
          {tag}
          <button 
            onClick={() => handleRemoveTag(tag)}
            className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive focus:opacity-100 outline-none"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
      
      {isEditing ? (
        <div className="flex items-center gap-1">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleAddTag}
            autoFocus
            className="text-xs bg-secondary border border-border rounded-md px-2 py-1 outline-none focus:ring-1 focus:ring-primary w-24"
            placeholder="new-tag"
          />
        </div>
      ) : (
        <button 
          onClick={() => setIsEditing(true)}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-dashed border-border text-muted-foreground text-xs hover:text-foreground hover:border-foreground transition-colors"
        >
          <Plus className="w-3 h-3" />
          Add Tag
        </button>
      )}
    </div>
  )
}
