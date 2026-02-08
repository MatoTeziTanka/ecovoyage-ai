---
title: "EcoVoyage AI: Sustainable Travel Companion Powered by Algolia"
published: true
tags: algolia, ai, sustainability, travel
---

*This is a submission for the [Algolia Agent Studio Challenge](https://dev.to/challenges/algolia): Consumer-Facing Conversational Experiences*

## What I Built

**EcoVoyage AI** is a conversational AI travel companion that helps users plan eco-conscious trips. Unlike generic travel planners, EcoVoyage puts sustainability at the center of every recommendation.

The agent guides users through natural dialogue to:
- **Discover 1000+ eco-rated destinations** across 44 countries
- **Compare carbon footprints** across 8 transport modes (train, bus, electric car, ferry, bicycle, sailing, hybrid car, and economy flight)
- **Find green accommodations** with sustainability ratings (eco-lodges, treehouses, farm-stays, glamping, yurts)
- **Get personalized green offset tips** based on their travel choices
- **Filter by budget, family-friendliness, season, and activities**

Every destination includes a sustainability score, carbon footprint rating, and actionable tips to reduce environmental impact.

## Demo

**Live Demo:** [https://ecovoyage-ai.vercel.app](https://ecovoyage-ai.vercel.app)

**GitHub:** [github.com/MatoTeziTanka/ecovoyage-ai](https://github.com/MatoTeziTanka/ecovoyage-ai)

### Screenshots

**The conversational interface searching for eco-friendly destinations:**
The chat interface shows destination cards with sustainability scores, carbon meters, transport comparison charts, and green offset tips — all retrieved in under 50ms.

**Key interaction flow:**
1. User describes their dream trip ("eco-lodges in Italy")
2. Algolia instantly retrieves matching destinations from the indexed database
3. Results show with carbon comparisons, green features, and accommodation ratings
4. User can drill down into transport options or ask follow-up questions

**No login required** — try it immediately.

## How I Used Algolia Agent Studio

### Data Indexing

I indexed **1000 eco-travel destinations** across 44 countries with rich, structured data:

```json
{
  "name": "Tuscany Eco Beach Retreat",
  "country": "Italy",
  "region": "Tuscany",
  "sustainability_score": 8.7,
  "carbon_footprint_score": 2.3,
  "transport_options": [
    {"mode": "train", "carbon_kg_per_1000km": 14},
    {"mode": "ferry", "carbon_kg_per_1000km": 120},
    {"mode": "economy_flight", "carbon_kg_per_1000km": 255}
  ],
  "accommodations": [
    {"type": "eco-lodge", "green_rating": 5, "description": "Solar powered..."}
  ],
  "sustainability_features": ["solar powered", "zero waste policy"],
  "activities": ["kayaking", "olive oil tasting", "cycling tour"],
  "green_offset_tip": "Switch from flying to train to reduce emissions by 90%"
}
```

### Search Configuration

- **Searchable attributes:** name, country, region, category, description, activities, sustainability features, accommodation types
- **Facet filters:** country, category, continent, season, price tier, group size, family-friendly, activities
- **Custom ranking:** sustainability score (descending), then carbon footprint (ascending) — so the greenest destinations surface first
- **Highlighting:** name, description, activities, and sustainability features

### Two-Layer Algolia Integration

EcoVoyage uses Algolia in two complementary ways:

**1. Conversational Search (Chat Interface)**
Each message triggers an Algolia search via `algoliasearch/lite`. Results are processed into natural language responses with destination cards showing carbon comparisons, sustainability scores, and green tips. An **autocomplete dropdown** fires debounced searches as the user types, showing matching destinations in real-time.

**2. Explore Section (InstantSearch Widgets)**
A dedicated "Explore Destinations" section uses `react-instantsearch` with `SearchBox`, `useHits`, and `Configure` — providing a traditional search-as-you-type experience alongside the conversational interface.

## Why Fast Retrieval Matters

Sustainable travel planning involves comparing multiple factors simultaneously: carbon footprint, sustainability score, transport options, accommodation ratings, activities, and budget. Users need to see these comparisons **instantly** to make informed decisions.

Algolia's sub-50ms retrieval makes this possible:

1. **Real-time carbon comparison:** When a user asks "compare train vs flight to Norway," Algolia retrieves matching destinations with transport data instantly, allowing the UI to render comparison charts without loading spinners.

2. **Instant autocomplete:** As users type in the chat, debounced Algolia queries return matching destinations in a dropdown — countries, regions, and destination names appear before the user finishes typing.

3. **Sustainability-first ranking:** With custom ranking on sustainability score, the greenest options always surface first. With Algolia, it happens on every query.

4. **Multi-factor filtering:** A single query can filter by country + category + season + budget + family-friendly, all with sub-50ms response times. This enables the conversational agent to narrow down from 1000 destinations to the perfect match in a single retrieval.

The speed isn't just a nice-to-have — it's what makes the conversational experience feel natural. Every message gets grounded in real, relevant data before the user notices any delay.
