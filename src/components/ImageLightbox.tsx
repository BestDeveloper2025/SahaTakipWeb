import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import './ImageLightbox.css'

type Props = {
  src: string | null
  alt?: string
  onClose: () => void
}

export function ImageLightbox({ src, alt, onClose }: Props) {
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!src) return
    setLoaded(false)
    setFailed(false)
  }, [src])

  useEffect(() => {
    if (!src) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [src, onClose])

  if (!src) return null

  return createPortal(
    <div
      className="image-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label="Görsel önizleme"
    >
      <button
        type="button"
        className="image-lightbox-backdrop"
        tabIndex={-1}
        aria-label="Kapat"
        onClick={onClose}
      />
      <div className="image-lightbox-inner">
        <figure className="image-lightbox-figure">
          <button
            type="button"
            className="image-lightbox-close"
            onClick={onClose}
            aria-label="Kapat"
          >
            ×
          </button>
          {!loaded && !failed ? (
            <div className="image-lightbox-skeleton" aria-hidden />
          ) : null}
          {failed ? (
            <div className="image-lightbox-error">
              <p>Görsel yüklenemedi.</p>
              <a
                href={src}
                target="_blank"
                rel="noopener noreferrer"
                className="image-lightbox-error-link"
              >
                Bağlantıyı yeni sekmede aç
              </a>
            </div>
          ) : (
            <img
              src={src}
              alt={alt ?? 'Önizleme görseli'}
              className={`image-lightbox-img${loaded ? ' image-lightbox-img--ready' : ''}`}
              decoding="async"
              onLoad={() => setLoaded(true)}
              onError={() => setFailed(true)}
            />
          )}
        </figure>
      </div>
    </div>,
    document.body,
  )
}
