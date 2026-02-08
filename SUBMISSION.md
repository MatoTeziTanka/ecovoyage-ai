---
title: "EcoVoyage AI: Sustainable Travel Companion Powered by Algolia"
published: true
tags: algolia, ai, sustainability, travel
---

*This is a submission for the [Algolia Agent Studio Challenge](https://dev.to/challenges/algolia): Consumer-Facing Conversational Experiences*

## What I Built

**EcoVoyage AI** is a conversational AI travel companion that helps users plan eco-conscious trips. Unlike generic travel planners, EcoVoyage puts sustainability at the center of every recommendation.

The agent guides users through natural dialogue to:
- **Discover 750+ eco-rated destinations** across 20 countries
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
1. User describes their dream trip ("eco-lodges in Costa Rica")
2. Algolia instantly retrieves matching destinations from the indexed database
3. Results show with carbon comparisons, green features, and accommodation ratings
4. User can drill down into transport options or ask follow-up questions

**No login required** — try it immediately.

## How I Used Algolia Agent Studio

### Data Indexing

I indexed **750 eco-travel destinations** with rich, structured data:

```json
{
  "name": "Lofoten Fjord Explorer",
  "country": "Norway",
  "region": "Lofoten",
  "sustainability_score": 9.2,
  "carbon_footprint_score": 2.1,
  "transport_options": [
    {"mode": "train", "carbon_kg_per_1000km": 14},
    {"mode": "ferry", "carbon_kg_per_1000km": 120},
    {"mode": "economy_flight", "carbon_kg_per_1000km": 255}
  ],
  "accommodations": [
    {"type": "eco-lodge", "green_rating": 5, "description": "Solar powered..."}
  ],
  "sustainability_features": ["solar powered", "zero waste policy"],
  "activities": ["kayaking", "glacier walking", "Northern Lights viewing"],
  "green_offset_tip": "Switch from flying to train to reduce emissions by 90%"
}
```

### Search Configuration

- **Searchable attributes:** name, country, region, category, description, activities, sustainability features
- **Facet filters:** country, category, continent, season, price tier, group size, family-friendly
- **Custom ranking:** sustainability score (descending), then carbon footprint (ascending) — so the greenest destinations surface first
- **Highlighting:** name, description, activities, and sustainability features are highlighted in results

### Targeted Prompting

The Agent Studio agent is configured with sustainability-focused instructions that:
- Always prioritize high sustainability scores in retrieval
- Include carbon comparison data in responses
- Suggest green offset alternatives proactively
- Match user intent (budget, family, adventure) to filtered facets

When a user says "beach vacation under $100/night," the agent combines:
- `category:beach` facet filter
- `price_tier:budget` or `price_tier:mid-range` filter
- Natural language understanding to extract intent
- Custom ranking to surface the most sustainable options first

## Why Fast Retrieval Matters

Sustainable travel planning involves comparing multiple factors simultaneously: carbon footprint, sustainability score, transport options, accommodation ratings, activities, and budget. Users need to see these comparisons **instantly** to make informed decisions.

Algolia's sub-50ms retrieval makes this possible:

1. **Real-time carbon comparison:** When a user asks "compare train vs flight to Norway," Algolia retrieves matching destinations with transport data instantly, allowing the UI to render comparison charts without loading spinners.

2. **Dynamic faceting:** As users refine their search ("make it family-friendly," "under $100"), each refinement triggers a new search that returns in milliseconds — the experience feels like a conversation, not a database query.

3. **Sustainability-first ranking:** With custom ranking on sustainability score, the greenest options always surface first. Without fast retrieval, we'd need to pre-compute these rankings. With Algolia, it happens on every query.

4. **Multi-factor filtering:** A single query can filter by country + category + season + budget + family-friendly, all with sub-50ms response times. This enables the conversational agent to narrow down from 750 destinations to the perfect match in a single retrieval.

The speed isn't just a nice-to-have — it's what makes the conversational experience feel natural. Every message gets grounded in real, relevant data before the user notices any delay.
