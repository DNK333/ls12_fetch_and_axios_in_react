import { useEffect, useState } from 'react'
import './CatGallery.css'

const CAT_API_URL = 'https://api.thecatapi.com/v1/images/search'

type CatImage = {
  id: string
  url: string
  width: number
  height: number
}

async function fetchRandomCat(signal?: AbortSignal): Promise<CatImage> {
  const response = await fetch(CAT_API_URL, { signal })

  if (!response.ok) {
    throw new Error(`Не удалось загрузить кота (ошибка ${response.status}).`)
  }

  const data: unknown = await response.json()
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('Сервис не вернул изображение кота. Попробуйте ещё раз.')
  }

  const result: unknown = data[0]
  if (
    typeof result !== 'object' ||
    result === null ||
    !('id' in result) ||
    typeof result.id !== 'string' ||
    !('url' in result) ||
    typeof result.url !== 'string' ||
    !('width' in result) ||
    typeof result.width !== 'number' ||
    !('height' in result) ||
    typeof result.height !== 'number'
  ) {
    throw new Error('Сервис вернул изображение в неожиданном формате.')
  }

  return {
    id: result.id,
    url: result.url,
    width: result.width,
    height: result.height,
  }
}

function CatGallery() {
  const [cat, setCat] = useState<CatImage | null>(null)
  const [favorites, setFavorites] = useState<CatImage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  async function getNewCat(signal?: AbortSignal) {
    setIsLoading(true)
    setError('')

    try {
      const nextCat = await fetchRandomCat(signal)
      setCat(nextCat)
    } catch (loadError) {
      if (signal?.aborted) return
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Не удалось загрузить кота. Попробуйте ещё раз.',
      )
    } finally {
      if (!signal?.aborted) setIsLoading(false)
    }
  }

  useEffect(() => {
    const controller = new AbortController()
    void getNewCat(controller.signal)
    return () => controller.abort()
  }, [])

  const isFavorite = cat
    ? favorites.some((favorite) => favorite.id === cat.id)
    : false

  function toggleFavorite() {
    if (!cat) return

    setFavorites((currentFavorites) =>
      currentFavorites.some((favorite) => favorite.id === cat.id)
        ? currentFavorites.filter((favorite) => favorite.id !== cat.id)
        : [cat, ...currentFavorites],
    )
  }

  return (
    <main className="page-content cat-page">
      <section className="cat-intro" aria-labelledby="cat-title">
        <p className="eyebrow">МАЛЕНЬКАЯ ПАУЗА ДЛЯ РАДОСТИ</p>
        <h1 id="cat-title">
          Random <span>Cat</span>
        </h1>
        <p>Никогда не знаешь, кто появится следующим.</p>
      </section>

      <section className="cat-stage" aria-label="Случайный кот">
        <div className={`cat-image-frame${isLoading ? ' is-loading' : ''}`}>
          {cat && (
            <img
              className="cat-image"
              src={cat.url}
              alt="Случайная фотография кота"
              onError={() => {
                setCat(null)
                setError('Не удалось показать изображение. Попробуйте загрузить другого кота.')
              }}
            />
          )}
          {isLoading && (
            <div className="cat-loading" role="status">
              <span className="loader" aria-hidden="true" />
              Ищем котика…
            </div>
          )}
          {!isLoading && !cat && !error && (
            <div className="cat-placeholder">🐱</div>
          )}
        </div>

        {error && (
          <div className="cat-error" role="alert">
            {error}
          </div>
        )}

        <div className="cat-actions">
          <button
            className="load-more-button cat-new-button"
            type="button"
            onClick={() => void getNewCat()}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="loader loader-light" aria-hidden="true" />
                Загружаем…
              </>
            ) : (
              <>
                Новый кот <span aria-hidden="true">🐾</span>
              </>
            )}
          </button>
          <button
            className={`favorite-button${isFavorite ? ' is-favorite' : ''}`}
            type="button"
            onClick={toggleFavorite}
            disabled={!cat || isLoading}
            aria-pressed={isFavorite}
          >
            <span aria-hidden="true">{isFavorite ? '♥' : '♡'}</span>
            {isFavorite ? 'В избранном' : 'Добавить в избранное'}
          </button>
        </div>
      </section>

      <section className="favorites-section" aria-labelledby="favorites-title">
        <div className="favorites-heading">
          <div>
            <p className="eyebrow">ВАША КОЛЛЕКЦИЯ</p>
            <h2 id="favorites-title">Избранные коты</h2>
          </div>
          <span className="favorites-count">
            {favorites.length.toString().padStart(2, '0')}
          </span>
        </div>

        {favorites.length === 0 ? (
          <p className="favorites-empty">
            Здесь пока пусто. Сохраните котика, который понравился.
          </p>
        ) : (
          <div className="favorites-grid">
            {favorites.map((favorite) => (
              <article className="favorite-card" key={favorite.id}>
                <button
                  className="favorite-image-button"
                  type="button"
                  onClick={() => {
                    setCat(favorite)
                    setError('')
                  }}
                  aria-label="Показать этого кота"
                >
                  <img src={favorite.url} alt="Избранный кот" loading="lazy" />
                </button>
                <button
                  className="remove-favorite"
                  type="button"
                  onClick={() =>
                    setFavorites((currentFavorites) =>
                      currentFavorites.filter((item) => item.id !== favorite.id),
                    )
                  }
                  aria-label="Убрать кота из избранного"
                  title="Убрать из избранного"
                >
                  ♥
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      <footer className="page-footer">
        <span>ОДИН КОТ ЗА ДРУГИМ</span>
        <span>СДЕЛАНО С ЛЮБОПЫТСТВОМ <span aria-hidden="true">✳</span></span>
      </footer>
    </main>
  )
}

export default CatGallery
