import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { fetchVenuePhoto } from '@/services/backend'

function kindOf(category?: string) {
  if (category === 'hotel') return 'hotel'
  if (category === 'restaurant' || category === 'cafe') return 'food'
  return 'place'
}

function isSatellite(url?: string) {
  return Boolean(url && /arcgisonline|World_Imagery|basemaps\.cartocdn/i.test(url))
}

export function PlaceImage({
  src,
  name,
  city,
  className,
  imgClassName,
  category,
}: {
  src?: string
  name: string
  city?: string
  lat?: number
  lng?: number
  category?: string
  className?: string
  imgClassName?: string
}) {
  const given = src && !isSatellite(src) ? src : ''
  const [url, setUrl] = useState(given)

  useEffect(() => {
    const start = src && !isSatellite(src) ? src : ''
    setUrl(start)
    let live = true
    void fetchVenuePhoto(name, city, kindOf(category)).then((photo) => {
      if (!live || !photo) return
      setUrl(photo)
    })
    return () => {
      live = false
    }
  }, [src, name, city, category])

  if (url) {
    return (
      <img
        src={url}
        alt={name}
        referrerPolicy="no-referrer"
        className={cn('bg-sand-200 object-cover', className, imgClassName)}
        onError={() => setUrl('')}
      />
    )
  }

  return (
    <div
      className={cn(
        'grid place-items-center bg-gradient-to-br from-teal-800 via-teal-700 to-ink-900 text-white',
        className,
        imgClassName,
      )}
      aria-hidden
    >
      <span className="font-display text-2xl opacity-90">{name.slice(0, 1)}</span>
    </div>
  )
}
