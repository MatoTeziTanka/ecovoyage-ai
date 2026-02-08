'use client'

import { useState, useRef, useEffect, Component, ReactNode } from 'react'
import { liteClient as algoliasearch } from 'algoliasearch/lite'
import { InstantSearch, SearchBox, useHits, useSearchBox, Configure } from 'react-instantsearch'

// --- Algolia Config ---
const ALGOLIA_APP_ID = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || 'RM2LBYLLID'
const ALGOLIA_SEARCH_KEY = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY || '00076acd167ffcfcf8bec05ae031852a'
const ALGOLIA_INDEX = 'ecovoyage_destinations'

const searchClient = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_SEARCH_KEY)

// --- Types ---
interface TransportOption {
  mode: string
  carbon_kg_per_1000km: number
  comfort: string
  scenic: boolean
}

interface Accommodation {
  type: string
  green_rating: number
  description: string
}

interface Destination {
  objectID: string
  name: string
  country: string
  region: string
  continent: string
  category: string
  sustainability_score: number
  carbon_footprint_score: number
  green_offset_tip: string
  activities: string[]
  best_season: string
  price_tier: string
  price_range_usd: { min: number; max: number }
  description: string
  transport_options: TransportOption[]
  accommodations: Accommodation[]
  sustainability_features: string[]
  family_friendly: boolean
  image_url: string
  featured: boolean
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  destinations?: Destination[]
  error?: boolean
}

// --- Safe accessors (prevents crash on sparse records) ---
function safeArray<T>(val: T[] | undefined | null): T[] {
  return Array.isArray(val) ? val : []
}

function safeString(val: string | undefined | null, fallback = ''): string {
  return typeof val === 'string' ? val : fallback
}

function safeNumber(val: number | undefined | null, fallback = 0): number {
  return typeof val === 'number' && !isNaN(val) ? val : fallback
}

function safeObj<T>(val: T | undefined | null, fallback: T): T {
  return val != null ? val : fallback
}

// --- Error Boundary ---
class ErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  render() {
    if (this.state.hasError) return this.props.fallback
    return this.props.children
  }
}

// --- Components ---

function CarbonMeter({ score, label }: { score: number; label: string }) {
  const s = safeNumber(score, 5)
  const percentage = ((10 - s) / 10) * 100
  const color = s <= 3 ? '#22c55e' : s <= 6 ? '#eab308' : '#ef4444'

  return (
    <div className="flex items-center gap-2" role="meter" aria-label={`${label}: ${s.toFixed(1)} out of 10`} aria-valuenow={s} aria-valuemin={0} aria-valuemax={10}>
      <span className="text-xs text-gray-500 w-20 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full carbon-fill"
          style={{ '--fill-width': `${percentage}%`, backgroundColor: color } as React.CSSProperties}
        />
      </div>
      <span className="text-xs font-medium" style={{ color }}>{s.toFixed(1)}</span>
    </div>
  )
}

function TransportComparison({ options }: { options: TransportOption[] }) {
  const safe = safeArray(options)
  if (safe.length === 0) {
    return <p className="text-xs text-gray-400 italic">No transport data available</p>
  }

  const sorted = [...safe].sort((a, b) => safeNumber(a.carbon_kg_per_1000km) - safeNumber(b.carbon_kg_per_1000km))
  const maxCarbon = Math.max(...sorted.map(o => safeNumber(o.carbon_kg_per_1000km)), 1)

  const modeEmoji: Record<string, string> = {
    train: '🚆', bus: '🚌', electric_car: '⚡🚗', hybrid_car: '🚗',
    economy_flight: '✈️', bicycle: '🚲', ferry: '⛴️', sailing: '⛵',
  }

  return (
    <div className="bg-white rounded-lg p-3 border border-gray-100" role="figure" aria-label="Transport carbon comparison">
      <p className="text-xs font-semibold text-gray-700 mb-2">Carbon per 1000km</p>
      {sorted.map((opt) => {
        const carbon = safeNumber(opt.carbon_kg_per_1000km)
        return (
          <div key={opt.mode} className="flex items-center gap-2 mb-1.5">
            <span className="text-sm w-6">{modeEmoji[opt.mode] || '🚀'}</span>
            <span className="text-xs text-gray-600 w-24 capitalize">{safeString(opt.mode).replace('_', ' ')}</span>
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(carbon / maxCarbon) * 100}%`,
                  backgroundColor: carbon < 30 ? '#22c55e' : carbon < 100 ? '#eab308' : '#ef4444',
                }}
              />
            </div>
            <span className="text-xs text-gray-500 w-14 text-right">{carbon}kg</span>
          </div>
        )
      })}
    </div>
  )
}

function DestinationCard({ dest }: { dest: Destination }) {
  const [expanded, setExpanded] = useState(false)
  const activities = safeArray(dest.activities)
  const features = safeArray(dest.sustainability_features)
  const accommodations = safeArray(dest.accommodations)
  const priceRange = safeObj(dest.price_range_usd, { min: 0, max: 0 })

  return (
    <article className="bg-white rounded-xl border border-eco-200 overflow-hidden hover:shadow-lg transition-shadow">
      <div className="bg-gradient-to-r from-eco-700 to-eco-500 p-3 text-white">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-sm">{safeString(dest.name, 'Unnamed Destination')}</h3>
            <p className="text-eco-100 text-xs">{safeString(dest.region)}{dest.region && dest.country ? ', ' : ''}{safeString(dest.country)}</p>
          </div>
          <div className="flex items-center gap-1 bg-white/20 rounded-full px-2 py-0.5">
            <span className="text-xs">🌿</span>
            <span className="text-xs font-bold">{safeNumber(dest.sustainability_score).toFixed(1)}/10</span>
          </div>
        </div>
      </div>

      <div className="p-3 space-y-2">
        <CarbonMeter score={dest.carbon_footprint_score} label="Carbon" />

        <div className="flex flex-wrap gap-1">
          {activities.slice(0, 3).map((act) => (
            <span key={act} className="text-xs bg-eco-50 text-eco-700 px-2 py-0.5 rounded-full">{act}</span>
          ))}
          {dest.best_season && (
            <span className="text-xs bg-gray-50 text-gray-600 px-2 py-0.5 rounded-full capitalize">{dest.best_season}</span>
          )}
        </div>

        <div className="flex justify-between items-center text-xs text-gray-500">
          <span className="capitalize">
            {safeString(dest.price_tier, 'N/A')}
            {priceRange.min > 0 && ` · $${priceRange.min}-$${priceRange.max}/night`}
          </span>
          {dest.family_friendly && <span>👨‍👩‍👧‍👦 Family</span>}
        </div>

        {expanded && (
          <div className="space-y-2 pt-2 border-t border-eco-100">
            <TransportComparison options={dest.transport_options} />

            {features.length > 0 && (
              <div className="bg-eco-50 rounded-lg p-2">
                <p className="text-xs font-semibold text-eco-800 mb-1">🌱 Green Features</p>
                <div className="flex flex-wrap gap-1">
                  {features.map((f) => (
                    <span key={f} className="text-xs bg-white text-eco-700 px-1.5 py-0.5 rounded">{f}</span>
                  ))}
                </div>
              </div>
            )}

            {dest.green_offset_tip && (
              <div className="bg-amber-50 rounded-lg p-2">
                <p className="text-xs font-semibold text-amber-800">💡 Green Tip</p>
                <p className="text-xs text-amber-700">{dest.green_offset_tip}</p>
              </div>
            )}

            {accommodations.map((acc) => (
              <div key={acc.type} className="text-xs text-gray-600">
                <span className="font-medium capitalize">{safeString(acc.type)}</span>
                <span className="mx-1">·</span>
                <span>{"🌿".repeat(safeNumber(acc.green_rating, 0))}</span>
                {acc.description && <span className="ml-1">{acc.description}</span>}
              </div>
            ))}
          </div>
        )}

        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-eco-600 hover:text-eco-700 font-medium w-full text-center py-1"
          aria-expanded={expanded}
          aria-label={expanded ? 'Show less details' : 'Show more details and transport comparison'}
        >
          {expanded ? '▲ Less' : '▼ More details & transport comparison'}
        </button>
      </div>
    </article>
  )
}

// --- InstantSearch Explore Panel (visible Algolia widget usage) ---
function ExploreHits() {
  const { hits } = useHits<Destination>()

  if (hits.length === 0) return <p className="text-sm text-gray-400 text-center py-4">Type to explore destinations...</p>

  return (
    <div className="grid md:grid-cols-2 gap-3">
      {hits.slice(0, 6).map((dest) => (
        <ErrorBoundary key={dest.objectID} fallback={<div className="text-xs text-red-400 p-2">Card render error</div>}>
          <DestinationCard dest={dest} />
        </ErrorBoundary>
      ))}
    </div>
  )
}

// --- Search + Response Logic ---

async function searchDestinations(query: string): Promise<{ destinations: Destination[]; error?: string }> {
  try {
    const { results } = await searchClient.search<Destination>({
      requests: [{
        indexName: ALGOLIA_INDEX,
        query,
        hitsPerPage: 5,
        attributesToRetrieve: [
          'name', 'country', 'region', 'continent', 'category', 'sustainability_score',
          'carbon_footprint_score', 'green_offset_tip', 'activities', 'best_season',
          'price_tier', 'price_range_usd', 'description', 'transport_options',
          'accommodations', 'sustainability_features', 'family_friendly', 'image_url', 'featured',
        ],
      }],
    })
    const firstResult = results[0]
    if (firstResult && 'hits' in firstResult) {
      return { destinations: firstResult.hits as Destination[] }
    }
    return { destinations: [], error: 'Unexpected response format from search' }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown search error'
    return { destinations: [], error: message }
  }
}

function buildAssistantResponse(query: string, destinations: Destination[], error?: string): string {
  if (error) {
    return `I encountered an issue while searching: ${error}\n\nPlease try again or rephrase your query.`
  }

  if (destinations.length === 0) {
    return "I couldn't find destinations matching that criteria. Try specifying a country, activity type (hiking, snorkeling), or sustainability feature (solar powered, zero waste)."
  }

  const topDest = destinations[0]
  const avgSustainability = (destinations.reduce((s, d) => s + safeNumber(d.sustainability_score), 0) / destinations.length).toFixed(1)
  const avgCarbon = (destinations.reduce((s, d) => s + safeNumber(d.carbon_footprint_score), 0) / destinations.length).toFixed(1)
  const lowCarbonTransport = safeArray(topDest.transport_options)
    .filter(t => safeNumber(t.carbon_kg_per_1000km) < 50)
    .map(t => safeString(t.mode).replace('_', ' '))

  const parts: string[] = []
  parts.push(`I found ${destinations.length} eco-friendly destinations for you!`)
  parts.push('')
  parts.push(`Top Pick: ${safeString(topDest.name, 'Unknown')} (${safeString(topDest.region)}, ${safeString(topDest.country)})`)
  parts.push(`Sustainability Score: ${safeNumber(topDest.sustainability_score).toFixed(1)}/10`)
  parts.push(`Carbon Footprint: ${safeNumber(topDest.carbon_footprint_score).toFixed(1)}/10 (lower is better)`)

  if (lowCarbonTransport.length > 0) {
    parts.push(`Low-carbon transport: ${lowCarbonTransport.join(', ')}`)
  }

  parts.push('')
  parts.push(`Average sustainability: ${avgSustainability}/10 | Carbon: ${avgCarbon}/10`)

  const tip = safeString(topDest.green_offset_tip)
  if (tip) {
    parts.push('')
    parts.push(`💡 ${tip}`)
  }

  parts.push('')
  parts.push('Ask me to compare transport emissions, find lower-carbon alternatives, or show greener accommodations!')

  return parts.join('\n')
}

// --- Suggested Queries ---
const SUGGESTED_QUERIES = [
  "Eco-friendly beach destinations in Italy",
  "Lowest carbon travel through Europe",
  "Family-friendly nature trip in Jamaica",
  "Mountain retreats with solar power in Switzerland",
  "Train vs flight emissions for France",
]

// --- Main Page ---
export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Welcome to EcoVoyage AI! 🌍🌿\n\nI'm your sustainable travel companion. I help you discover eco-friendly destinations while minimizing your carbon footprint.\n\nTell me about your dream trip — where you want to go, what activities you enjoy, or what matters most to you about sustainable travel.\n\nTry: \"eco-lodges in Italy\" or \"beach destinations in Jamaica\"",
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<Array<{ name: string; country: string; region: string }>>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Autocomplete: fetch suggestions as user types
  const fetchSuggestions = (query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (query.length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const { results } = await searchClient.search<Destination>({
          requests: [{
            indexName: ALGOLIA_INDEX,
            query,
            hitsPerPage: 5,
            attributesToRetrieve: ['name', 'country', 'region'],
          }],
        })
        const firstResult = results[0]
        if (firstResult && 'hits' in firstResult) {
          const hits = firstResult.hits as Destination[]
          setSuggestions(hits.map(h => ({
            name: safeString(h.name, ''),
            country: safeString(h.country, ''),
            region: safeString(h.region, ''),
          })))
          setShowSuggestions(hits.length > 0)
        }
      } catch {
        setSuggestions([])
      }
    }, 200)
  }

  const handleInputChange = (value: string) => {
    setInput(value)
    fetchSuggestions(value)
  }

  const handleSuggestionClick = (suggestion: { name: string; country: string }) => {
    setShowSuggestions(false)
    setSuggestions([])
    handleSend(`${suggestion.name} in ${suggestion.country}`)
  }

  const handleSend = async (overrideQuery?: string) => {
    const query = overrideQuery || input.trim()
    if (!query || loading) return

    setInput('')
    setShowSuggestions(false)
    setSuggestions([])
    setMessages((prev) => [...prev, { role: 'user', content: query }])
    setLoading(true)

    const { destinations, error } = await searchDestinations(query)
    const response = buildAssistantResponse(query, destinations, error)

    setMessages((prev) => [
      ...prev,
      { role: 'assistant', content: response, destinations, error: !!error },
    ])
    setLoading(false)
    inputRef.current?.focus()
  }

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <header className="relative bg-gradient-to-br from-eco-900 via-eco-800 to-eco-700 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 text-8xl float" style={{ animationDelay: '0s' }}>🌿</div>
          <div className="absolute top-40 right-20 text-6xl float" style={{ animationDelay: '1s' }}>🌍</div>
          <div className="absolute bottom-20 left-1/3 text-7xl float" style={{ animationDelay: '2s' }}>🌱</div>
        </div>

        <nav className="relative z-10 max-w-6xl mx-auto px-6 py-4 flex justify-between items-center" aria-label="Main navigation">
          <div className="flex items-center gap-2">
            <span className="text-2xl" aria-hidden="true">🌿</span>
            <span className="text-xl font-bold">EcoVoyage AI</span>
          </div>
          <div className="flex gap-6 text-sm text-eco-200">
            <a href="#explore" className="hover:text-white transition hidden md:inline">Explore</a>
            <a href="#features" className="hover:text-white transition hidden md:inline">Features</a>
            <a href="#chat" className="bg-white text-eco-800 px-4 py-1.5 rounded-full font-semibold hover:bg-eco-50 transition">
              Start Planning
            </a>
          </div>
        </nav>

        <div className="relative z-10 max-w-6xl mx-auto px-6 py-24 text-center">
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 fade-in-up">
            Travel Green.<br />
            <span className="text-eco-300">Travel Smart.</span>
          </h1>
          <p className="text-xl text-eco-200 max-w-2xl mx-auto mb-10 fade-in-up fade-in-up-delay-1">
            AI-powered sustainable travel planning. Compare carbon footprints, discover eco-lodges,
            and build itineraries that are good for you and the planet.
          </p>
          <a href="#chat" className="inline-block bg-white text-eco-800 px-8 py-3 rounded-full text-lg font-semibold hover:bg-eco-50 transition shadow-lg hover:shadow-xl fade-in-up fade-in-up-delay-2">
            🌍 Start Your Eco Trip
          </a>

          <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto fade-in-up fade-in-up-delay-3">
            <div><div className="text-3xl font-bold">1000+</div><div className="text-eco-300 text-sm">Eco Destinations</div></div>
            <div><div className="text-3xl font-bold">45</div><div className="text-eco-300 text-sm">Countries</div></div>
            <div><div className="text-3xl font-bold">8</div><div className="text-eco-300 text-sm">Transport Modes</div></div>
          </div>
        </div>
      </header>

      {/* Explore with InstantSearch (Algolia widget showcase) */}
      <section id="explore" className="py-16 bg-eco-50">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-2">Explore Destinations</h2>
          <p className="text-gray-500 text-center mb-8">Powered by Algolia InstantSearch — real-time results as you type</p>

          <InstantSearch searchClient={searchClient} indexName={ALGOLIA_INDEX}>
            <Configure hitsPerPage={6} />
            <div className="max-w-xl mx-auto mb-8">
              <SearchBox
                placeholder="Search destinations, activities, countries..."
                classNames={{
                  root: 'w-full',
                  form: 'relative',
                  input: 'w-full px-4 py-3 rounded-xl border-2 border-eco-200 focus:border-eco-500 focus:ring-2 focus:ring-eco-100 outline-none text-sm',
                  submit: 'absolute right-3 top-3 text-eco-500',
                  reset: 'absolute right-10 top-3 text-gray-400',
                }}
              />
            </div>
            <ErrorBoundary fallback={<p className="text-center text-red-400">Error loading results</p>}>
              <ExploreHits />
            </ErrorBoundary>
          </InstantSearch>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-4">Why EcoVoyage AI?</h2>
          <p className="text-gray-600 text-center mb-16 max-w-2xl mx-auto">
            Every trip impacts the planet. EcoVoyage helps you make choices that reduce your footprint.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: '🔍', title: 'Smart Search', desc: "Powered by Algolia's lightning-fast retrieval — find destinations by sustainability, activities, budget, and carbon footprint in milliseconds." },
              { icon: '📊', title: 'Carbon Comparison', desc: 'Compare CO2 emissions across 8 transport modes. See the real impact of choosing train over flight — up to 90% less emissions.' },
              { icon: '🌱', title: 'Green Offsets', desc: 'Get personalized tips to reduce your travel impact. From packing light to choosing eco-lodges, every suggestion is backed by data.' },
            ].map((f) => (
              <div key={f.title} className="p-8 rounded-2xl bg-eco-50 border border-eco-100">
                <div className="text-4xl mb-4" aria-hidden="true">{f.icon}</div>
                <h3 className="text-xl font-bold mb-2">{f.title}</h3>
                <p className="text-gray-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Chat */}
      <section id="chat" className="py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-4">Plan Your Trip</h2>
          <p className="text-gray-600 text-center mb-12">Chat with EcoVoyage AI to discover sustainable destinations.</p>

          <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-2xl border border-eco-200 overflow-hidden">
            {/* Chat Header */}
            <div className="bg-gradient-to-r from-eco-800 to-eco-600 p-4 text-white flex items-center gap-3">
              <span className="text-2xl" aria-hidden="true">🌿</span>
              <div>
                <h3 className="font-bold">EcoVoyage AI</h3>
                <p className="text-eco-200 text-xs">Powered by Algolia Agent Studio</p>
              </div>
              <div className="ml-auto flex items-center gap-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" aria-hidden="true"></div>
                <span className="text-xs text-eco-200">Online</span>
              </div>
            </div>

            {/* Messages */}
            <div className="h-[500px] overflow-y-auto p-4 space-y-4 bg-gray-50" role="log" aria-label="Chat messages" aria-live="polite">
              {messages.map((msg, i) => (
                <div key={i}>
                  <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-r from-eco-700 to-eco-600 text-white'
                          : msg.error
                            ? 'bg-red-50 border border-red-200 text-red-800'
                            : 'bg-white border border-eco-100 text-gray-800'
                      }`}
                      role={msg.role === 'assistant' ? 'status' : undefined}
                    >
                      <div className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                    </div>
                  </div>

                  {/* Destination Cards */}
                  {msg.destinations && msg.destinations.length > 0 && (
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      {msg.destinations.slice(0, 4).map((dest) => (
                        <ErrorBoundary key={dest.objectID} fallback={<div className="text-xs text-red-400 p-2 bg-red-50 rounded">Failed to render destination</div>}>
                          <DestinationCard dest={dest} />
                        </ErrorBoundary>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-eco-100 rounded-2xl px-4 py-3" role="status" aria-label="Searching destinations">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-eco-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-eco-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-eco-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggestions (auto-send on click) */}
            {messages.length <= 1 && (
              <div className="px-4 py-2 bg-white border-t border-eco-100">
                <p className="text-xs text-gray-400 mb-2">Try these:</p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_QUERIES.slice(0, 3).map((q) => (
                    <button
                      key={q}
                      onClick={() => handleSend(q)}
                      className="text-xs bg-eco-50 text-eco-700 px-3 py-1.5 rounded-full hover:bg-eco-100 transition"
                      aria-label={`Search for: ${q}`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input with Autocomplete */}
            <div className="p-4 bg-white border-t border-eco-100">
              <div className="flex gap-3 relative">
                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setShowSuggestions(false)
                        handleSend()
                      }
                      if (e.key === 'Escape') setShowSuggestions(false)
                    }}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                    placeholder="Ask about eco-friendly destinations..."
                    className="w-full px-4 py-3 rounded-xl border-2 border-eco-200 focus:border-eco-500 focus:ring-2 focus:ring-eco-100 outline-none text-sm transition"
                    disabled={loading}
                    aria-label="Type your travel question"
                    aria-expanded={showSuggestions}
                    aria-haspopup="listbox"
                    autoComplete="off"
                  />
                  {/* Autocomplete Dropdown */}
                  {showSuggestions && suggestions.length > 0 && (
                    <ul
                      className="absolute bottom-full left-0 right-0 mb-1 bg-white border border-eco-200 rounded-xl shadow-lg z-50 overflow-hidden"
                      role="listbox"
                      aria-label="Destination suggestions"
                    >
                      {suggestions.map((s, i) => (
                        <li key={i}>
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => handleSuggestionClick(s)}
                            className="w-full text-left px-4 py-2.5 hover:bg-eco-50 transition text-sm flex items-center gap-2"
                            role="option"
                          >
                            <span className="text-eco-500">🌿</span>
                            <span className="font-medium text-gray-800">{s.name}</span>
                            <span className="text-gray-400 text-xs">— {s.region}, {s.country}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <button
                  onClick={() => handleSend()}
                  disabled={loading || !input.trim()}
                  className="bg-gradient-to-r from-eco-700 to-eco-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-eco-800 hover:to-eco-700 disabled:opacity-50 transition shadow-md"
                  aria-label="Send message"
                >
                  🌿 Send
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2 text-center">
                Powered by Algolia — start typing for instant suggestions
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-eco-900 text-eco-300 py-12">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-2xl" aria-hidden="true">🌿</span>
            <span className="text-xl font-bold text-white">EcoVoyage AI</span>
          </div>
          <p className="text-sm mb-6">
            Built for the <a href="https://dev.to/challenges/algolia-2026-01-07" className="text-eco-400 hover:text-white underline">Algolia Agent Studio Challenge</a>
          </p>
          <div className="flex justify-center gap-6 text-xs">
            <span>1000+ Eco Destinations</span><span>·</span>
            <span>45 Countries</span><span>·</span>
            <span>8 Transport Modes</span><span>·</span>
            <span>Real Carbon Data</span>
          </div>
          <p className="text-xs mt-6 text-eco-500">© 2026 EcoVoyage AI. Travel responsibly. Powered by Algolia.</p>
        </div>
      </footer>
    </div>
  )
}
