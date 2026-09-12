import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { immediatePlacePhoto, lookupPlacePhoto, streetPhoto } from '@/lib/media'

export function PlaceImage({
  src,
  name,
  city,
  lat,
  lng,
  className,
  imgClassName,
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
  const geo = immediatePlacePhoto(lat, lng)
  const [url, setUrl] = useState(src || geo)

  useEffect(() => {
    const base = src || geo
    setUrl(base)
    let live = true
    void lookupPlacePhoto(name, city).then((photo) => {
      if (!live || !photo) return
      setUrl(photo)
    })
    return () => {
      live = false
    }
  }, [src, name, city, geo])

  const onError = () => {
    setUrl((prev) => {
      if (lat != null && lng != null) {
        const sat = immediatePlacePhoto(lat, lng)
        const map = streetPhoto(lat, lng)
        if (prev && prev !== sat && prev !== map) return sat
        if (prev !== map) return map
      }
      return prev
    })
  }

  if (url) {
    return (
      <img
        src={url}
        alt={name}
        referrerPolicy="no-referrer"
        className={cn('bg-sand-200 object-cover', className, imgClassName)}
        onError={onError}
      />
    )
  }

  return <div className={cn('bg-sand-200', className, imgClassName)} aria-hidden />
}
