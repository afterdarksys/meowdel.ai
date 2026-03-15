"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, Bell, Brain, Calendar } from "lucide-react"
import Link from "next/link"

import { ReminderTodo, ReminderRevisit } from "@/app/api/brain/reminders/route"

export function SmartReminders() {
  const [todos, setTodos] = useState<ReminderTodo[]>([])
  const [revisit, setRevisit] = useState<ReminderRevisit[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/brain/reminders')
        const data = await res.json()
        setTodos(data.todos || [])
        setRevisit(data.revisit || [])
      } catch (err) {
        console.error("Failed to fetch reminders:", err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <Card className="w-full mb-8 border-primary/20 bg-background/50 backdrop-blur-sm">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mr-2" />
          <span className="text-muted-foreground">Fetching brain reminders...</span>
        </CardContent>
      </Card>
    )
  }

  if (todos.length === 0 && revisit.length === 0) {
    return null // Only show if there's something to remind
  }

  return (
    <Card className="w-full mb-8 border-primary/20 bg-gradient-to-br from-background to-primary/5 shadow-md">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
          <Bell className="h-5 w-5 text-primary" />
          Smart Reminders
        </CardTitle>
        <CardDescription>
          Action items and knowledge extracted directly from your brain.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* TODOs Section */}
          {todos.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2 text-sm text-muted-foreground uppercase tracking-wider">
                <Checkbox className="h-4 w-4 bg-muted border-none" checked={true} disabled />
                Pending Actions
              </h3>
              <ScrollArea className="h-[200px] w-full rounded-md border p-4 bg-background/50">
                <div className="space-y-4">
                  {todos.map((todo) => (
                    <div key={todo.id} className="flex items-start gap-3 group">
                      <Checkbox 
                        id={todo.id} 
                        checked={todo.completed} 
                        className="mt-1 transition-all"
                      />
                      <div className="flex flex-col gap-1">
                        <label 
                          htmlFor={todo.id} 
                          className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${todo.completed ? 'line-through text-muted-foreground' : ''}`}
                        >
                          {todo.text}
                        </label>
                        <Link 
                          href={`/brain/notes/${todo.noteSlug}`}
                          className="text-xs text-primary/70 hover:text-primary transition-colors flex items-center gap-1"
                        >
                          <Brain className="h-3 w-3" />
                          from {todo.noteTitle}
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
           </div>
          )}

          {/* Revisit Section */}
          {revisit.length > 0 && (
            <div className="space-y-4">
               <h3 className="font-semibold flex items-center gap-2 text-sm text-muted-foreground uppercase tracking-wider">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Time to Revisit
              </h3>
              <ScrollArea className="h-[200px] w-full rounded-md border p-4 bg-background/50">
                <div className="space-y-3">
                  {revisit.map((item, i) => (
                    <Link 
                      key={i} 
                      href={`/brain/notes/${item.noteSlug}`}
                      className="flex flex-col gap-2 p-3 rounded-md bg-muted/30 hover:bg-muted/60 transition-colors border border-transparent hover:border-primary/20"
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-sm font-semibold">{item.noteTitle}</span>
                        <Badge variant="outline" className="text-[10px] uppercase">{item.reason}</Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              </ScrollArea>
           </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
