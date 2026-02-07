'use client'

import { useEffect, useRef, useState } from 'react'
import { liteClient as algoliasearch } from 'algoliasearch/lite'

const ALGOLIA_APP_ID = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || 'RM2LBYLLID'
const ALGOLIA_SEARCH_KEY = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY || '00076acd167ffcfcf8bec05ae031852a'
const ALGOLIA_INDEX = 'ecovoyage_destinations'

const searchClient = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_SEARCH_KEY)

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
  transport_options: Array<{
    mode: string
    carbon_kg_per_1000km: number
    comfort: string
    scenic: boolean
  }>
  accommodations: Array<{
    type: string
    green_rating: number
    description: string
  }>
  sustainability_features: string[]
  family_friendly: boolean
  image_url: string
  featured: boolean
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  destinations?: Destination[]
}

const SUGGESTED_QUERIES = [
  "Find me eco-friendly beach destinations in Costa Rica",
  "What's the lowest carbon way to travel through Europe?",
  "Plan a family-friendly nature trip under $100/night",
  "Show me mountain retreats with solar power",
  "Compare train vs flight emissions for Norway trip",
]

function CarbonMeter({ score, label }: { score: number; label: string }) {
  const percentage = ((10 - score) / 10) * 100
  const color = score <= 3 ? '#22c55e' : score <= 6 ? '#eab308' : '#ef4444'

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500 w-20 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full carbon-fill"
          style={{ '--fill-width': `${percentage}%`, backgroundColor: color } as React.CSSProperties}
        />
      </div>
      <span className="text-xs font-medium" style={{ color }}>{score.toFixed(1)}</span>
    </div>
  )
}

function TransportComparison({ options }: { options: Destination['transport_options'] }) {
  const sorted = [...options].sort((a, b) => a.carbon_kg_per_1000km - b.carbon_kg_per_1000km)
  const maxCarbon = Math.max(...sorted.map(o => o.carbon_kg_per_1000km))

  const modeEmoji: Record<string, string> = {
    train: '🚆', bus: '🚌', electric_car: '⚡🚗', hybrid_car: '🚗',
    economy_flight: '✈️', bicycle: '🚲', ferry: '⛴️', sailing: '⛵',
  }

  return (
    <div className="bg-white rounded-lg p-3 border border-gray-100">
      <p className="text-xs font-semibold text-gray-700 mb-2">Carbon per 1000km</p>
      {sorted.map((opt) => (
        <div key={opt.mode} className="flex items-center gap-2 mb-1.5">
          <span className="text-sm w-6">{modeEmoji[opt.mode] || '🚀'}</span>
          <span className="text-xs text-gray-600 w-24 capitalize">{opt.mode.replace('_', ' ')}</span>
          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${maxCarbon > 0 ? (opt.carbon_kg_per_1000km / maxCarbon) * 100 : 0}%`,
                backgroundColor: opt.carbon_kg_per_1000km < 30 ? '#22c55e' : opt.carbon_kg_per_1000km < 100 ? '#eab308' : '#ef4444',
              }}
            />
          </div>
          <span className="text-xs text-gray-500 w-14 text-right">{opt.carbon_kg_per_1000km}kg</span>
        </div>
      ))}
    </div>
  )
}

function DestinationCard({ dest }: { dest: Destination }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="bg-white rounded-xl border border-eco-200 overflow-hidden hover:shadow-lg transition-shadow">
      <div className="bg-gradient-to-r from-eco-700 to-eco-500 p-3 text-white">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-sm">{dest.name}</h3>
            <p className="text-eco-100 text-xs">{dest.region}, {dest.country}</p>
          </div>
          <div className="flex items-center gap-1 bg-white/20 rounded-full px-2 py-0.5">
            <span className="text-xs">🌿</span>
            <span className="text-xs font-bold">{dest.sustainability_score}/10</span>
          </div>
        </div>
      </div>

      <div className="p-3 space-y-2">
        <CarbonMeter score={dest.carbon_footprint_score} label="Carbon" />

        <div className="flex flex-wrap gap-1">
          {dest.activities.slice(0, 3).map((act) => (
            <span key={act} className="text-xs bg-eco-50 text-eco-700 px-2 py-0.5 rounded-full">{act}</span>
          ))}
          <span className="text-xs bg-gray-50 text-gray-600 px-2 py-0.5 rounded-full capitalize">{dest.best_season}</span>
        </div>

        <div className="flex justify-between items-center text-xs text-gray-500">
          <span className="capitalize">{dest.price_tier} · ${dest.price_range_usd.min}-${dest.price_range_usd.max}/night</span>
          {dest.family_friendly && <span>👨‍👩‍👧‍👦 Family</span>}
        </div>

        {expanded && (
          <div className="space-y-2 pt-2 border-t border-eco-100">
            <TransportComparison options={dest.transport_options} />

            <div className="bg-eco-50 rounded-lg p-2">
              <p className="text-xs font-semibold text-eco-800 mb-1">🌱 Green Features</p>
              <div className="flex flex-wrap gap-1">
                {dest.sustainability_features.map((f) => (
                  <span key={f} className="text-xs bg-white text-eco-700 px-1.5 py-0.5 rounded">{f}</span>
                ))}
              </div>
            </div>

            <div className="bg-amber-50 rounded-lg p-2">
              <p className="text-xs font-semibold text-amber-800">💡 Green Tip</p>
              <p className="text-xs text-amber-700">{dest.green_offset_tip}</p>
            </div>

            {dest.accommodations.map((acc) => (
              <div key={acc.type} className="text-xs text-gray-600">
                <span className="font-medium capitalize">{acc.type}</span>
                <span className="mx-1">·</span>
                <span>{"🌿".repeat(acc.green_rating)}</span>
                <span className="ml-1">{acc.description}</span>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-eco-600 hover:text-eco-700 font-medium w-full text-center py-1"
        >
          {expanded ? '▲ Less' : '▼ More details & transport comparison'}
        </button>
      </div>
    </div>
  )
}

async function searchDestinations(query: string): Promise<Destination[]> {
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
  if ('hits' in firstResult) {
    return firstResult.hits as Destination[]
  }
  return []
}

function generateAssistantResponse(query: string, destinations: Destination[]): string {
  if (destinations.length === 0) {
    return "I couldn't find destinations matching that criteria. Could you try a different search? For example, try specifying a country, activity type (hiking, snorkeling), or sustainability feature (solar powered, zero waste)."
  }

  const topDest = destinations[0]
  const avgSustainability = (destinations.reduce((s, d) => s + d.sustainability_score, 0) / destinations.length).toFixed(1)
  const avgCarbon = (destinations.reduce((s, d) => s + d.carbon_footprint_score, 0) / destinations.length).toFixed(1)

  const lowCarbonTransport = topDest.transport_options
    .filter(t => t.carbon_kg_per_1000km < 50)
    .map(t => t.mode.replace('_', ' '))

  let response = `I found ${destinations.length} eco-friendly destinations for you! Here's what stands out:\n\n`
  response += `**Top Pick: ${topDest.name}** (${topDest.region}, ${topDest.country})\n`
  response += `- Sustainability Score: ${topDest.sustainability_score}/10\n`
  response += `- Carbon Footprint: ${topDest.carbon_footprint_score}/10 (lower is better)\n`

  if (lowCarbonTransport.length > 0) {
    response += `- Low-carbon transport available: ${lowCarbonTransport.join(', ')}\n`
  }

  response += `\nAverage sustainability across results: **${avgSustainability}/10** | Average carbon score: **${avgCarbon}/10**\n\n`
  response += `💡 **${topDest.green_offset_tip}**\n\n`
  response += `Would you like me to:\n`
  response += `- Compare transport emissions for a specific destination?\n`
  response += `- Find lower-carbon alternatives?\n`
  response += `- Show accommodations with higher green ratings?`

  return response
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Welcome to EcoVoyage AI! 🌍🌿\n\nI'm your sustainable travel companion. I help you discover eco-friendly destinations while minimizing your carbon footprint.\n\nTell me about your dream trip — where you want to go, what activities you enjoy, or what matters most to you about sustainable travel. I'll find destinations that match your values!\n\n**Try asking:**\n- \"Find eco-lodges in Costa Rica\"\n- \"Compare train vs flight to Norway\"\n- \"Family-friendly nature trips under $100/night\"",
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [showChat, setShowChat] = useState(false)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }])
    setLoading(true)

    try {
      const destinations = await searchDestinations(userMessage)
      const response = generateAssistantResponse(userMessage, destinations)

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: response, destinations },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I encountered an error while searching. Please try again!' },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <header className="relative bg-gradient-to-br from-eco-900 via-eco-800 to-eco-700 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 text-8xl float" style={{ animationDelay: '0s' }}>🌿</div>
          <div className="absolute top-40 right-20 text-6xl float" style={{ animationDelay: '1s' }}>🌍</div>
          <div className="absolute bottom-20 left-1/3 text-7xl float" style={{ animationDelay: '2s' }}>🌱</div>
          <div className="absolute top-10 right-1/3 text-5xl float" style={{ animationDelay: '0.5s' }}>✈️</div>
        </div>

        <nav className="relative z-10 max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌿</span>
            <span className="text-xl font-bold">EcoVoyage AI</span>
          </div>
          <div className="flex gap-6 text-sm text-eco-200">
            <a href="#features" className="hover:text-white transition">Features</a>
            <a href="#how-it-works" className="hover:text-white transition">How it Works</a>
            <button
              onClick={() => setShowChat(true)}
              className="bg-white text-eco-800 px-4 py-1.5 rounded-full font-semibold hover:bg-eco-50 transition"
            >
              Start Planning
            </button>
          </div>
        </nav>

        <div className="relative z-10 max-w-6xl mx-auto px-6 py-24 text-center">
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 fade-in-up">
            Travel Green.
            <br />
            <span className="text-eco-300">Travel Smart.</span>
          </h1>
          <p className="text-xl text-eco-200 max-w-2xl mx-auto mb-10 fade-in-up fade-in-up-delay-1">
            AI-powered sustainable travel planning. Compare carbon footprints, discover eco-lodges,
            and build itineraries that are good for you and the planet.
          </p>
          <div className="flex gap-4 justify-center fade-in-up fade-in-up-delay-2">
            <button
              onClick={() => setShowChat(true)}
              className="bg-white text-eco-800 px-8 py-3 rounded-full text-lg font-semibold hover:bg-eco-50 transition shadow-lg hover:shadow-xl"
            >
              🌍 Start Your Eco Trip
            </button>
            <a
              href="#features"
              className="border-2 border-eco-400 text-eco-300 px-8 py-3 rounded-full text-lg font-semibold hover:bg-eco-800 transition"
            >
              Learn More
            </a>
          </div>

          <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto fade-in-up fade-in-up-delay-3">
            <div>
              <div className="text-3xl font-bold">750+</div>
              <div className="text-eco-300 text-sm">Eco Destinations</div>
            </div>
            <div>
              <div className="text-3xl font-bold">20</div>
              <div className="text-eco-300 text-sm">Countries</div>
            </div>
            <div>
              <div className="text-3xl font-bold">8</div>
              <div className="text-eco-300 text-sm">Transport Modes</div>
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-4">Why EcoVoyage AI?</h2>
          <p className="text-gray-600 text-center mb-16 max-w-2xl mx-auto">
            Every trip impacts the planet. EcoVoyage helps you make choices that reduce your footprint
            while discovering incredible destinations.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-eco-50 border border-eco-100">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-xl font-bold mb-2">Smart Search</h3>
              <p className="text-gray-600">
                Powered by Algolia's lightning-fast retrieval, find destinations by sustainability score,
                activities, budget, and carbon footprint in milliseconds.
              </p>
            </div>
            <div className="p-8 rounded-2xl bg-eco-50 border border-eco-100">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-bold mb-2">Carbon Comparison</h3>
              <p className="text-gray-600">
                Compare CO2 emissions across 8 transport modes. See the real impact of choosing
                train over flight — up to 90% less emissions.
              </p>
            </div>
            <div className="p-8 rounded-2xl bg-eco-50 border border-eco-100">
              <div className="text-4xl mb-4">🌱</div>
              <h3 className="text-xl font-bold mb-2">Green Offsets</h3>
              <p className="text-gray-600">
                Get personalized tips to reduce your travel impact. From packing light to choosing
                eco-lodges, every suggestion is backed by data.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 bg-eco-50">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-16">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: '1', icon: '💬', title: 'Tell Us Your Dream', desc: 'Describe your ideal trip — destination, activities, budget, or sustainability priorities.' },
              { step: '2', icon: '⚡', title: 'Instant AI Search', desc: 'Algolia retrieves matching destinations from our 750+ eco-rated database in milliseconds.' },
              { step: '3', icon: '📊', title: 'Compare Impact', desc: 'See carbon footprints, transport comparisons, and sustainability scores side by side.' },
              { step: '4', icon: '🌍', title: 'Travel Green', desc: 'Book eco-lodges, choose low-carbon transport, and offset the rest. Every choice counts.' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 bg-eco-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <div className="text-3xl mb-2">{item.icon}</div>
                <h3 className="font-bold mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <section id="demo" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-4">Try It Now</h2>
          <p className="text-gray-600 text-center mb-12">
            Chat with EcoVoyage AI to discover sustainable destinations.
          </p>

          <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-2xl border border-eco-200 overflow-hidden">
            {/* Chat Header */}
            <div className="bg-gradient-to-r from-eco-800 to-eco-600 p-4 text-white flex items-center gap-3">
              <span className="text-2xl">🌿</span>
              <div>
                <h3 className="font-bold">EcoVoyage AI</h3>
                <p className="text-eco-200 text-xs">Powered by Algolia Agent Studio</p>
              </div>
              <div className="ml-auto flex items-center gap-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-eco-200">Online</span>
              </div>
            </div>

            {/* Messages */}
            <div className="h-[500px] overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map((msg, i) => (
                <div key={i}>
                  <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-r from-eco-700 to-eco-600 text-white'
                          : 'bg-white border border-eco-100 text-gray-800'
                      }`}
                    >
                      <div className="text-sm whitespace-pre-wrap leading-relaxed">
                        {msg.content.split(/(\*\*.*?\*\*)/).map((part, j) =>
                          part.startsWith('**') && part.endsWith('**') ? (
                            <strong key={j}>{part.slice(2, -2)}</strong>
                          ) : (
                            <span key={j}>{part}</span>
                          )
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Destination Cards */}
                  {msg.destinations && msg.destinations.length > 0 && (
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      {msg.destinations.slice(0, 4).map((dest) => (
                        <DestinationCard key={dest.objectID} dest={dest} />
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-eco-100 rounded-2xl px-4 py-3">
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

            {/* Suggestions */}
            {messages.length <= 1 && (
              <div className="px-4 py-2 bg-white border-t border-eco-100">
                <p className="text-xs text-gray-400 mb-2">Suggestions:</p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_QUERIES.slice(0, 3).map((q) => (
                    <button
                      key={q}
                      onClick={() => { setInput(q); }}
                      className="text-xs bg-eco-50 text-eco-700 px-3 py-1.5 rounded-full hover:bg-eco-100 transition"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-4 bg-white border-t border-eco-100">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask about eco-friendly destinations..."
                  className="flex-1 px-4 py-3 rounded-xl border-2 border-eco-200 focus:border-eco-500 focus:ring-2 focus:ring-eco-100 outline-none text-sm transition"
                  disabled={loading}
                />
                <button
                  onClick={handleSend}
                  disabled={loading || !input.trim()}
                  className="bg-gradient-to-r from-eco-700 to-eco-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-eco-800 hover:to-eco-700 disabled:opacity-50 transition shadow-md"
                >
                  🌿 Send
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2 text-center">
                Powered by Algolia — results retrieved in &lt;50ms
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-eco-900 text-eco-300 py-12">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-2xl">🌿</span>
            <span className="text-xl font-bold text-white">EcoVoyage AI</span>
          </div>
          <p className="text-sm mb-6">
            Built for the <a href="https://dev.to/challenges/algolia-2026-01-07" className="text-eco-400 hover:text-white underline">Algolia Agent Studio Challenge</a>
          </p>
          <div className="flex justify-center gap-6 text-xs">
            <span>750+ Eco Destinations</span>
            <span>·</span>
            <span>20 Countries</span>
            <span>·</span>
            <span>8 Transport Modes</span>
            <span>·</span>
            <span>Real Carbon Data</span>
          </div>
          <p className="text-xs mt-6 text-eco-500">
            © 2026 EcoVoyage AI. Travel responsibly. Powered by Algolia.
          </p>
        </div>
      </footer>
    </div>
  )
}
