import { supabase } from '@/lib/supabase'
import { Metadata } from 'next'

// ⚠️ Next.js 16 : force le rendu dynamique (pas de prerender statique)
export const instant = false

const extractUrls = (d: any): string[] => {
  if (!d) return []
  try {
    let p = typeof d === 'string' ? JSON.parse(d) : d
    if (!Array.isArray(p)) p = [p]
    return p.filter((u: any) => typeof u === 'string' && u.startsWith('http'))
  } catch {
    return ((typeof d === 'string' ? d : JSON.stringify(d)).match(/(https?:\/\/[^\s"',\]}]+)/g)) || []
  }
}
const isVid = (u: string) => /\.(mp4|mov|mkv|3gp|webm)$/i.test(u)

// ⚠️ Next.js 16 : params est une Promise → type Promise<{ id: string }>
type PageProps = {
  params: Promise<{ id: string }>
}

// ── Métadonnées (Open Graph) ──
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  // ⚠️ IMPORTANT : await params
  const { id } = await params

  const { data: post } = await supabase
    .from('posts')
    .select('*, profiles!user_id(full_name, avatar_url)')
    .eq('id', id)
    .single()

  if (!post) return { title: 'Publication introuvable' }

  const media = extractUrls(post.media_urls)[0]
  const profile = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles
  const author = profile?.full_name || 'Ganbanaaxu'

  return {
    title: `${author} sur Ganbanaaxu`,
    description: post.caption || 'Rejoignez Ganbanaaxu !',
    openGraph: {
      title: `${author} sur Ganbanaaxu`,
      description: post.caption || 'Rejoignez Ganbanaaxu !',
      images: media && !isVid(media) ? [{ url: media }] : [],
      url: `https://ganbanaaxu.vercel.app/post/${id}`,
      siteName: 'Ganbanaaxu',
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${author} sur Ganbanaaxu`,
      description: post.caption || 'Rejoignez Ganbanaaxu !',
      images: media && !isVid(media) ? [media] : [],
    },
  }
}

// ── Page ──
export default async function PostPage({ params }: PageProps) {
  // ⚠️ IMPORTANT : await params
  const { id } = await params

  const { data: post } = await supabase
    .from('posts')
    .select('*, profiles!user_id(full_name, avatar_url)')
    .eq('id', id)
    .single()

  if (!post) {
    return (
      <html lang="fr">
        <body style={{ margin: 0, fontFamily: 'sans-serif', background: '#0B141A', color: '#FFF' }}>
          <div style={{ maxWidth: 600, margin: '0 auto', padding: 40, textAlign: 'center' }}>
            <h1>Publication introuvable</h1>
            <p style={{ color: '#888' }}>Elle a peut-être été supprimée.</p>
            <InstallButtons />
          </div>
        </body>
      </html>
    )
  }

  const media = extractUrls(post.media_urls)
  const profile = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles
  const author = profile?.full_name || 'Anonyme'
  const avatar = profile?.avatar_url

  return (
    <html lang="fr">
      <body style={{ margin: 0, fontFamily: 'sans-serif', background: '#0B141A', color: '#FFF' }}>
        <div style={{ maxWidth: 600, margin: '0 auto', padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            {avatar && <img src={avatar} width={48} height={48} style={{ borderRadius: 24 }} alt="avatar" />}
            <div>
              <div style={{ fontWeight: 'bold', fontSize: 16 }}>{author}</div>
              <div style={{ color: '#888', fontSize: 12 }}>
                {new Date(post.created_at).toLocaleDateString('fr-FR')}
              </div>
            </div>
          </div>

          {media.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              {media.map((u, i) =>
                isVid(u) ? (
                  <video key={i} src={u} controls style={{ width: '100%', borderRadius: 12 }} />
                ) : (
                  <img key={i} src={u} style={{ width: '100%', borderRadius: 12, marginBottom: 8 }} alt={`media-${i}`} />
                )
              )}
            </div>
          )}

          {post.caption && <p style={{ fontSize: 16, lineHeight: 1.5, marginBottom: 24 }}>{post.caption}</p>}

          <InstallButtons />
        </div>
      </body>
    </html>
  )
}

function InstallButtons() {
  return (
    <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid #333' }}>
      <h2 style={{ fontSize: 20, marginBottom: 16 }}>📱 Télécharger Ganbanaaxu</h2>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <a
          href="https://play.google.com/store/apps/details?id=com.godapps.Ganbanaaxu"
          style={{
            display: 'inline-block', padding: '12px 24px', background: '#6200EE',
            color: '#FFF', borderRadius: 8, textDecoration: 'none', fontWeight: 'bold',
          }}
        >
          Android
        </a>
        <a
          href="https://apps.apple.com/app/idTON_ID"
          style={{
            display: 'inline-block', padding: '12px 24px', background: '#6200EE',
            color: '#FFF', borderRadius: 8, textDecoration: 'none', fontWeight: 'bold',
          }}
        >
          iOS
        </a>
      </div>
    </div>
  )
}