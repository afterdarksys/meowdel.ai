import { notFound } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/lib/db'
import { userProfiles, brainNotes } from '@/lib/db/schema'
import { eq, and, desc, count, sum } from 'drizzle-orm'
import AskMyBrain from './AskMyBrain'

export const dynamic = 'force-dynamic'

interface Props {
  params: { username: string }
}

export async function generateMetadata({ params }: Props) {
  const username = decodeURIComponent(params.username).replace(/^@/, '')
  const [profile] = await db
    .select({ displayName: userProfiles.displayName, bio: userProfiles.bio })
    .from(userProfiles)
    .where(eq(userProfiles.username, username))
    .limit(1)

  if (!profile) return { title: 'Profile not found' }
  return {
    title: `${profile.displayName || username}'s Brain — Meowdel`,
    description: profile.bio || `Explore ${username}'s public knowledge base on Meowdel`,
  }
}

export default async function PublicProfilePage({ params }: Props) {
  const username = decodeURIComponent(params.username).replace(/^@/, '')

  const [profile] = await db
    .select({
      userId: userProfiles.userId,
      displayName: userProfiles.displayName,
      bio: userProfiles.bio,
      profileImageUrl: userProfiles.profileImageUrl,
      bannerImageUrl: userProfiles.bannerImageUrl,
      isPublic: userProfiles.isPublic,
      meowcoinsEarned: userProfiles.meowcoinsEarned,
      website: userProfiles.website,
      location: userProfiles.location,
    })
    .from(userProfiles)
    .where(eq(userProfiles.username, username))
    .limit(1)

  if (!profile || !profile.isPublic) {
    notFound()
  }

  const publicNotes = await db
    .select({
      id: brainNotes.id,
      slug: brainNotes.slug,
      title: brainNotes.title,
      summary: brainNotes.summary,
      tags: brainNotes.tags,
      wordCount: brainNotes.wordCount,
      updatedAt: brainNotes.updatedAt,
    })
    .from(brainNotes)
    .where(and(
      eq(brainNotes.userId, profile.userId),
      eq(brainNotes.isPublic, true),
      eq(brainNotes.isDeleted, false),
    ))
    .orderBy(desc(brainNotes.updatedAt))
    .limit(50)

  const [stats] = await db
    .select({
      noteCount: count(brainNotes.id),
      totalWords: sum(brainNotes.wordCount),
    })
    .from(brainNotes)
    .where(and(
      eq(brainNotes.userId, profile.userId),
      eq(brainNotes.isPublic, true),
      eq(brainNotes.isDeleted, false),
    ))

  const displayName = profile.displayName || username
  const initial = displayName.charAt(0).toUpperCase()

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-purple-500">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-bl from-purple-900/30 via-pink-900/10 to-transparent rounded-full mix-blend-screen filter blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-indigo-900/30 via-blue-900/10 to-transparent rounded-full mix-blend-screen filter blur-3xl" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-12 space-y-10">

        {/* Profile Header */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 flex flex-col sm:flex-row gap-6 items-center sm:items-start">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {profile.profileImageUrl ? (
              <img
                src={profile.profileImageUrl}
                alt={displayName}
                className="w-24 h-24 rounded-full ring-2 ring-purple-500/50 object-cover"
              />
            ) : (
              <div className="w-24 h-24 bg-gradient-to-br from-pink-500 to-indigo-600 rounded-full flex items-center justify-center text-4xl font-black shadow-[0_0_30px_rgba(236,72,153,0.3)]">
                {initial}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-2xl font-bold">{displayName}</h1>
            <p className="text-purple-400 text-sm font-medium mt-0.5">@{username}</p>
            {profile.bio && (
              <p className="text-zinc-300 mt-3 text-sm leading-relaxed">{profile.bio}</p>
            )}
            <div className="flex flex-wrap gap-4 mt-4 justify-center sm:justify-start text-sm text-zinc-400">
              {profile.location && <span>📍 {profile.location}</span>}
              {profile.website && (
                <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 transition-colors">
                  🔗 {profile.website.replace(/^https?:\/\//, '')}
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4">
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-purple-400">{stats?.noteCount ?? 0}</p>
            <p className="text-xs text-zinc-400 mt-1">Public Notes</p>
          </div>
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-pink-400">
              {stats?.totalWords ? Math.round(Number(stats.totalWords) / 1000) + 'k' : '0'}
            </p>
            <p className="text-xs text-zinc-400 mt-1">Words Written</p>
          </div>
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-yellow-400">{profile.meowcoinsEarned ?? 0}</p>
            <p className="text-xs text-zinc-400 mt-1">Meowcoins</p>
          </div>
        </div>

        {/* Ask My Brain */}
        <AskMyBrain username={username} displayName={displayName} />

        {/* Public Notes */}
        {publicNotes.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4 text-zinc-200">Published Notes</h2>
            <div className="space-y-3">
              {publicNotes.map(note => (
                <Link
                  key={note.id}
                  href={`/@${username}/notes/${note.slug}`}
                  className="block backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 hover:border-purple-500/30 transition-all group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white group-hover:text-purple-300 transition-colors truncate">
                        {note.title}
                      </h3>
                      {note.summary && (
                        <p className="text-zinc-400 text-sm mt-1 line-clamp-2">{note.summary}</p>
                      )}
                      {note.tags && note.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {note.tags.slice(0, 4).map(tag => (
                            <span key={tag} className="px-2 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-md text-xs">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0 text-xs text-zinc-500">
                      <p>{note.wordCount} words</p>
                      <p className="mt-1">{new Date(note.updatedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {publicNotes.length === 0 && (
          <div className="text-center py-12 text-zinc-500">
            <p className="text-4xl mb-3">📓</p>
            <p>No public notes yet.</p>
          </div>
        )}

        {/* CTA */}
        <div className="text-center pt-4 pb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-purple-400 transition-colors"
          >
            Build your own AI Brain with
            <span className="font-bold text-purple-400">Meowdel</span>
            →
          </Link>
        </div>
      </div>
    </div>
  )
}
