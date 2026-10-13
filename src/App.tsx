import { useEffect, useMemo, useState } from 'react'
import './App.css'
import CatGallery from './CatGallery'

const PAGE_SIZE = 10
const POSTS_URL = 'https://dummyjson.com/posts'

type Post = {
  id: number
  title: string
  body: string
  tags: string[]
  reactions: {
    likes: number
    dislikes: number
  }
  views: number
}

type PostsResponse = {
  posts: Post[]
  total: number
  skip: number
  limit: number
}

async function fetchPosts(skip: number, signal?: AbortSignal) {
  const response = await fetch(`${POSTS_URL}?limit=${PAGE_SIZE}&skip=${skip}`, {
    signal,
  })

  if (!response.ok) {
    throw new Error(`Не удалось загрузить публикации (ошибка ${response.status}).`)
  }

  return (await response.json()) as PostsResponse
}

function NewsFeed() {
  const today = new Intl.DateTimeFormat('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
    .format(new Date())
    .toLocaleUpperCase('ru-RU')
  const [posts, setPosts] = useState<Post[]>([])
  const [totalPosts, setTotalPosts] = useState(0)
  const [selectedTag, setSelectedTag] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    async function loadFirstPage() {
      setIsLoading(true)
      setError('')

      try {
        const data = await fetchPosts(0, controller.signal)
        setPosts(data.posts)
        setTotalPosts(data.total)
      } catch (loadError) {
        if (controller.signal.aborted) return
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Не удалось загрузить публикации. Попробуйте ещё раз.',
        )
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }

    void loadFirstPage()
    return () => controller.abort()
  }, [reloadKey])

  const tags = useMemo(
    () => [...new Set(posts.flatMap((post) => post.tags))].sort(),
    [posts],
  )

  const visiblePosts = useMemo(
    () =>
      selectedTag === 'all'
        ? posts
        : posts.filter((post) => post.tags.includes(selectedTag)),
    [posts, selectedTag],
  )

  async function loadMorePosts() {
    if (isLoadingMore || posts.length >= totalPosts) return

    setIsLoadingMore(true)
    setError('')

    try {
      const data = await fetchPosts(posts.length)
      setPosts((currentPosts) => {
        const knownIds = new Set(currentPosts.map((post) => post.id))
        return [...currentPosts, ...data.posts.filter((post) => !knownIds.has(post.id))]
      })
      setTotalPosts(data.total)
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Не удалось загрузить следующие публикации.',
      )
    } finally {
      setIsLoadingMore(false)
    }
  }

  return (
    <main className="page-content">
        <section className="intro" aria-labelledby="page-title">
          <div className="intro-copy">
            <p className="eyebrow">{today}</p>
            <h1 id="page-title">
              Хорошие идеи
              <br />
              <span>начинаются здесь.</span>
            </h1>
            <p className="intro-description">
              Истории, мысли и открытия сообщества — собрали в одной ленте.
            </p>
          </div>
          <div className="intro-art" aria-hidden="true">
            <div className="art-orbit orbit-one" />
            <div className="art-orbit orbit-two" />
            <div className="art-sun" />
            <span className="art-spark spark-one">✳</span>
            <span className="art-spark spark-two">✳</span>
            <span className="art-caption">мысли<br />в движении</span>
          </div>
        </section>

        <section className="feed-section" aria-labelledby="feed-title">
          <div className="feed-heading">
            <div>
              <p className="eyebrow">СВЕЖИЕ ПУБЛИКАЦИИ</p>
              <h2 id="feed-title">Лента сообщества</h2>
            </div>
            <label className="filter-control">
              <span>Тема</span>
              <select
                value={selectedTag}
                onChange={(event) => setSelectedTag(event.target.value)}
                disabled={isLoading || tags.length === 0}
                aria-label="Фильтр по теме"
              >
                <option value="all">Все темы</option>
                {tags.map((tag) => (
                  <option value={tag} key={tag}>
                    #{tag}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {error && (
            <div className="error-message" role="alert">
              <p>{error}</p>
              {!posts.length && (
                <button
                  className="text-button"
                  type="button"
                  onClick={() => setReloadKey((key) => key + 1)}
                >
                  Попробовать снова
                </button>
              )}
            </div>
          )}

          {isLoading ? (
            <div className="status-panel" role="status">
              <span className="loader" aria-hidden="true" />
              Загружаем свежие публикации…
            </div>
          ) : (
            <>
              <div className="post-list" aria-live="polite">
                {visiblePosts.map((post, index) => (
                  <article className="post-card" key={post.id}>
                    <div className="post-index">
                      {String(index + 1).padStart(2, '0')}
                    </div>
                    <div className="post-content">
                      <div className="post-meta">
                        <span className="post-bullet" />
                        <span>ПОСТ № {String(post.id).padStart(3, '0')}</span>
                        <span className="meta-divider">/</span>
                        <span>{post.views.toLocaleString('ru-RU')} просмотров</span>
                      </div>
                      <h3>{post.title}</h3>
                      <p className="post-body">{post.body}</p>
                      <div className="post-footer">
                        <div className="post-tags">
                          {post.tags.map((tag) => (
                            <button
                              className={`tag-chip${selectedTag === tag ? ' is-selected' : ''}`}
                              key={tag}
                              type="button"
                              onClick={() => setSelectedTag(tag)}
                              aria-label={`Показать публикации по теме ${tag}`}
                            >
                              #{tag}
                            </button>
                          ))}
                        </div>
                        <div className="reactions" aria-label="Реакции">
                          <span title="Нравится">
                            <span aria-hidden="true">↑</span> {post.reactions.likes}
                          </span>
                          <span title="Не нравится">
                            <span aria-hidden="true">↓</span> {post.reactions.dislikes}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className={`post-mark mark-${(post.id % 4) + 1}`} aria-hidden="true">
                      <span>{String(post.id).padStart(2, '0')}</span>
                    </div>
                  </article>
                ))}
              </div>

              {!isLoading && posts.length > 0 && visiblePosts.length === 0 && (
                <div className="status-panel">
                  В загруженных публикациях пока нет темы «#{selectedTag}».
                </div>
              )}

              {posts.length > 0 && posts.length < totalPosts && (
                <div className="load-more-wrap">
                  <button
                    className="load-more-button"
                    type="button"
                    onClick={loadMorePosts}
                    disabled={isLoadingMore}
                  >
                    {isLoadingMore ? (
                      <>
                        <span className="loader loader-light" aria-hidden="true" />
                        Загружаем…
                      </>
                    ) : (
                      <>
                        Загрузить ещё
                        <span aria-hidden="true">↓</span>
                      </>
                    )}
                  </button>
                  <p>
                    Показано {posts.length} из {totalPosts} публикаций
                  </p>
                </div>
              )}
            </>
          )}
        </section>

        <footer className="page-footer">
          <span>ЛЕНТА — МЕСТО ДЛЯ ХОРОШИХ МЫСЛЕЙ</span>
          <span>СДЕЛАНО С ЛЮБОПЫТСТВОМ <span aria-hidden="true">✳</span></span>
        </footer>
    </main>
  )
}

type HomeworkPage = 'feed' | 'cats'

function App() {
  const [page, setPage] = useState<HomeworkPage>('feed')
  const [hasOpenedCats, setHasOpenedCats] = useState(false)

  return (
    <div className="site-shell">
      <header className="topbar">
        <a
          className="wordmark"
          href="#"
          aria-label="Практика React — на главную"
          onClick={(event) => {
            event.preventDefault()
            setPage('feed')
          }}
        >
          <span className="wordmark-icon" aria-hidden="true">
            r.
          </span>
          <span>react lab</span>
        </a>
        <nav className="homework-nav" aria-label="Учебные задания">
          <button
            className={`homework-nav-button${page === 'feed' ? ' is-active' : ''}`}
            type="button"
            aria-current={page === 'feed' ? 'page' : undefined}
            onClick={() => setPage('feed')}
          >
            Лента
          </button>
          <button
            className={`homework-nav-button${page === 'cats' ? ' is-active' : ''}`}
            type="button"
            aria-current={page === 'cats' ? 'page' : undefined}
            onClick={() => {
              setHasOpenedCats(true)
              setPage('cats')
            }}
          >
            Random Cat
          </button>
        </nav>
        <div className="topbar-date">ПРАКТИКА РАБОТЫ С API</div>
      </header>
      <div hidden={page !== 'feed'}>
        <NewsFeed />
      </div>
      {hasOpenedCats && (
        <div hidden={page !== 'cats'}>
          <CatGallery />
        </div>
      )}
    </div>
  )
}

export default App
