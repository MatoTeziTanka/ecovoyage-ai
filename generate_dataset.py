#!/usr/bin/env python3
"""Generate EcoVoyage travel dataset and upload to Algolia."""

import json
import random
import hashlib
from algoliasearch.search.client import SearchClientSync

# Algolia credentials
APP_ID = "RM2LBYLLID"
ADMIN_KEY = "ec65c46d881642b155f86c16b817d716"
INDEX_NAME = "ecovoyage_destinations"

# --- Data pools ---

COUNTRIES = {
    "Canada": {"regions": ["Alberta", "British Columbia", "Ontario", "Quebec", "Nova Scotia"], "currency": "CAD"},
    "Costa Rica": {"regions": ["Guanacaste", "Puntarenas", "San Jose", "Limon"], "currency": "CRC"},
    "Norway": {"regions": ["Fjords", "Lofoten", "Tromso", "Bergen", "Oslo"], "currency": "NOK"},
    "New Zealand": {"regions": ["South Island", "North Island", "Queenstown", "Rotorua"], "currency": "NZD"},
    "Japan": {"regions": ["Kyoto", "Hokkaido", "Okinawa", "Tokyo", "Nara"], "currency": "JPY"},
    "Iceland": {"regions": ["Golden Circle", "Reykjavik", "Westfjords", "South Coast"], "currency": "ISK"},
    "Portugal": {"regions": ["Algarve", "Azores", "Lisbon", "Porto", "Madeira"], "currency": "EUR"},
    "Kenya": {"regions": ["Masai Mara", "Amboseli", "Lamu", "Nairobi", "Diani"], "currency": "KES"},
    "Peru": {"regions": ["Cusco", "Sacred Valley", "Amazon Basin", "Lima", "Arequipa"], "currency": "PEN"},
    "Slovenia": {"regions": ["Ljubljana", "Lake Bled", "Triglav", "Piran", "Postojna"], "currency": "EUR"},
    "Bhutan": {"regions": ["Paro", "Thimphu", "Punakha", "Bumthang"], "currency": "BTN"},
    "Ecuador": {"regions": ["Galapagos", "Quito", "Amazon", "Banos", "Cuenca"], "currency": "USD"},
    "Sweden": {"regions": ["Stockholm", "Lapland", "Gothenburg", "Malmo", "Gotland"], "currency": "SEK"},
    "Chile": {"regions": ["Patagonia", "Atacama", "Valparaiso", "Santiago", "Easter Island"], "currency": "CLP"},
    "Croatia": {"regions": ["Dubrovnik", "Plitvice", "Split", "Istria", "Hvar"], "currency": "EUR"},
    "Thailand": {"regions": ["Chiang Mai", "Krabi", "Koh Lanta", "Pai", "Kanchanaburi"], "currency": "THB"},
    "Scotland": {"regions": ["Highlands", "Edinburgh", "Isle of Skye", "Orkney", "Cairngorms"], "currency": "GBP"},
    "Colombia": {"regions": ["Cartagena", "Medellin", "Coffee Region", "Tayrona", "Bogota"], "currency": "COP"},
    "Finland": {"regions": ["Lapland", "Helsinki", "Lake District", "Turku"], "currency": "EUR"},
    "Morocco": {"regions": ["Marrakech", "Atlas Mountains", "Essaouira", "Fes", "Sahara"], "currency": "MAD"},
}

CATEGORIES = ["beach", "mountain", "city", "forest", "desert", "island", "fjord", "lake", "cultural", "wildlife"]

TRANSPORT_MODES = [
    {"mode": "train", "carbon_kg_per_1000km": 14, "comfort": "high", "scenic": True},
    {"mode": "bus", "carbon_kg_per_1000km": 27, "comfort": "medium", "scenic": True},
    {"mode": "electric_car", "carbon_kg_per_1000km": 53, "comfort": "high", "scenic": True},
    {"mode": "hybrid_car", "carbon_kg_per_1000km": 92, "comfort": "high", "scenic": True},
    {"mode": "economy_flight", "carbon_kg_per_1000km": 255, "comfort": "low", "scenic": False},
    {"mode": "bicycle", "carbon_kg_per_1000km": 0, "comfort": "low", "scenic": True},
    {"mode": "ferry", "carbon_kg_per_1000km": 120, "comfort": "medium", "scenic": True},
    {"mode": "sailing", "carbon_kg_per_1000km": 2, "comfort": "medium", "scenic": True},
]

ACCOMMODATION_TYPES = [
    {"type": "eco-lodge", "green_rating": 5, "price_multiplier": 1.2, "description": "Sustainable lodge with solar power and rainwater harvesting"},
    {"type": "treehouse", "green_rating": 5, "price_multiplier": 1.5, "description": "Off-grid treehouse with minimal environmental footprint"},
    {"type": "farm-stay", "green_rating": 4, "price_multiplier": 0.8, "description": "Working organic farm with local food sourcing"},
    {"type": "green-hotel", "green_rating": 4, "price_multiplier": 1.0, "description": "LEED-certified hotel with energy-efficient systems"},
    {"type": "hostel", "green_rating": 3, "price_multiplier": 0.5, "description": "Budget-friendly communal living with shared resources"},
    {"type": "glamping", "green_rating": 4, "price_multiplier": 1.3, "description": "Luxury camping with low-impact infrastructure"},
    {"type": "homestay", "green_rating": 4, "price_multiplier": 0.6, "description": "Stay with local families, supporting community economy"},
    {"type": "yurt", "green_rating": 5, "price_multiplier": 0.9, "description": "Traditional portable dwelling with zero permanent footprint"},
    {"type": "cabin", "green_rating": 3, "price_multiplier": 1.1, "description": "Rustic cabin with wood heating and well water"},
    {"type": "houseboat", "green_rating": 3, "price_multiplier": 1.4, "description": "Solar-powered floating accommodation"},
]

ECO_ACTIVITIES = [
    "hiking", "snorkeling", "kayaking", "bird watching", "wildlife safari",
    "coral reef restoration", "tree planting", "organic cooking class",
    "sustainable fishing", "glacier walking", "mountain biking",
    "whale watching", "stargazing", "hot springs", "cultural workshop",
    "permaculture tour", "mangrove restoration", "cave exploration",
    "waterfall trekking", "photography tour", "yoga retreat",
    "meditation retreat", "local market tour", "artisan workshop",
    "river rafting", "rock climbing", "botanical garden tour",
    "tea ceremony", "volcanic hiking", "Northern Lights viewing",
    "sea turtle conservation", "beach cleanup", "forest bathing",
    "cycling tour", "olive oil tasting", "wine trail", "sailing lesson"
]

SEASONS = ["spring", "summer", "autumn", "winter", "year-round"]

SUSTAINABILITY_FEATURES = [
    "solar powered", "wind energy", "rainwater harvesting", "zero waste policy",
    "organic food only", "carbon neutral certified", "plastic-free zone",
    "local employment priority", "wildlife corridor preserved", "reforestation program",
    "marine protected area", "community-owned tourism", "electric vehicle fleet",
    "composting system", "greywater recycling", "locally sourced materials",
    "fair trade partnerships", "endangered species protection", "cultural preservation program",
    "renewable energy grid", "biodiversity monitoring", "waste-to-energy system"
]

DESTINATION_TEMPLATES = {
    "beach": [
        "{region} Eco Beach Retreat", "{region} Coastal Sanctuary", "{region} Marine Reserve",
        "{region} Turtle Nesting Shores", "{region} Coral Coast"
    ],
    "mountain": [
        "{region} Alpine Eco Lodge", "{region} Mountain Refuge", "{region} Summit Sanctuary",
        "{region} Highland Trail", "{region} Peak Wilderness"
    ],
    "city": [
        "{region} Green City Break", "{region} Urban Eco Tour", "{region} Sustainable City Walk",
        "{region} Cultural Capital", "{region} Heritage Quarter"
    ],
    "forest": [
        "{region} Rainforest Canopy", "{region} Old Growth Reserve", "{region} Forest Sanctuary",
        "{region} Woodland Retreat", "{region} Canopy Walk"
    ],
    "desert": [
        "{region} Desert Starlight Camp", "{region} Oasis Retreat", "{region} Dunes Eco Camp",
        "{region} Arid Wilderness", "{region} Desert Bloom"
    ],
    "island": [
        "{region} Island Eco Haven", "{region} Archipelago Explorer", "{region} Atoll Sanctuary",
        "{region} Island Hop", "{region} Reef Island"
    ],
    "fjord": [
        "{region} Fjord Explorer", "{region} Fjord Kayak Trail", "{region} Glacier Bay",
        "{region} Deep Water Trail", "{region} Nordic Waters"
    ],
    "lake": [
        "{region} Lakeside Eco Lodge", "{region} Crystal Lake Retreat", "{region} Alpine Lake Camp",
        "{region} Lakeshore Trail", "{region} Waterside Sanctuary"
    ],
    "cultural": [
        "{region} Heritage Experience", "{region} Living Culture Tour", "{region} Artisan Trail",
        "{region} Cultural Immersion", "{region} Traditions Route"
    ],
    "wildlife": [
        "{region} Wildlife Conservation", "{region} Safari Eco Camp", "{region} Animal Sanctuary",
        "{region} Migration Trail", "{region} Birdwatcher's Paradise"
    ],
}

DESCRIPTION_TEMPLATES = [
    "Discover the breathtaking {category} landscapes of {region}, {country}. This {accommodation} offers {feature1} and {feature2}, with activities including {act1}, {act2}, and {act3}. Best visited in {season}, this destination has a sustainability score of {score}/10.",
    "Escape to {region}'s pristine {category} environment in {country}. Featuring {feature1} and {feature2}, your {accommodation} stay includes access to {act1}, {act2}, and {act3}. The {season} season offers ideal conditions for eco-conscious travelers.",
    "Experience sustainable tourism at its finest in {region}, {country}. This {category} destination features {feature1} alongside {feature2}. Guests at the {accommodation} can enjoy {act1}, {act2}, and {act3} while minimizing their environmental footprint.",
    "Immerse yourself in the natural beauty of {region}, {country}. This {category} getaway with {accommodation} accommodation boasts {feature1} and {feature2}. Activities range from {act1} to {act2} and {act3}, all with sustainability in mind.",
]

GREEN_OFFSET_TIPS = [
    "Switch from flying to train travel to reduce your carbon footprint by up to 90%",
    "Choose an eco-lodge over a standard hotel to save 40% on accommodation emissions",
    "Opt for plant-based meals during your trip to reduce food-related emissions by 50%",
    "Use public transit at your destination instead of rental cars for 70% less emissions",
    "Pack light — every kg saved on flights reduces CO2 by 0.1kg per 1000km",
    "Choose direct flights when flying — takeoffs produce the most emissions",
    "Offset remaining emissions through verified carbon credit programs",
    "Travel in shoulder season for less crowding and lower environmental impact",
    "Book experiences that directly fund local conservation projects",
    "Bring a reusable water bottle and shopping bag to eliminate single-use plastics",
]


def generate_destination(idx, country, region, category):
    """Generate a single destination record."""
    country_info = COUNTRIES[country]

    # Pick name template
    templates = DESTINATION_TEMPLATES.get(category, DESTINATION_TEMPLATES["cultural"])
    name = random.choice(templates).format(region=region)

    # Unique object ID
    slug = f"{country.lower().replace(' ', '-')}-{region.lower().replace(' ', '-')}-{category}-{idx}"
    object_id = hashlib.md5(slug.encode()).hexdigest()[:12]

    # Transport options (2-4 per destination)
    transport_count = random.randint(2, 4)
    transport = random.sample(TRANSPORT_MODES, transport_count)

    # Accommodation (1-3 per destination)
    accom_count = random.randint(1, 3)
    accommodations = random.sample(ACCOMMODATION_TYPES, accom_count)

    # Sustainability
    sustainability_score = round(random.uniform(6.0, 10.0), 1)
    features = random.sample(SUSTAINABILITY_FEATURES, random.randint(2, 5))

    # Activities (3-6 per destination)
    activities = random.sample(ECO_ACTIVITIES, random.randint(3, 6))

    # Price range
    base_prices = {"budget": [30, 80], "mid-range": [80, 200], "premium": [200, 500], "luxury": [500, 1200]}
    price_tier = random.choice(list(base_prices.keys()))
    price_min, price_max = base_prices[price_tier]

    # Best season
    season = random.choice(SEASONS)

    # Carbon footprint (lower = better, 1-10 scale)
    carbon_score = round(10 - sustainability_score + random.uniform(-0.5, 0.5), 1)
    carbon_score = max(1.0, min(10.0, carbon_score))

    # Green offset tip
    offset_tip = random.choice(GREEN_OFFSET_TIPS)

    # Description
    desc_template = random.choice(DESCRIPTION_TEMPLATES)
    description = desc_template.format(
        category=category, region=region, country=country,
        accommodation=accommodations[0]["type"],
        feature1=features[0], feature2=features[1],
        act1=activities[0], act2=activities[1], act3=activities[2],
        season=season, score=sustainability_score
    )

    return {
        "objectID": object_id,
        "name": name,
        "country": country,
        "region": region,
        "continent": get_continent(country),
        "category": category,
        "categories": [category] + random.sample([c for c in CATEGORIES if c != category], random.randint(0, 2)),
        "transport_options": transport,
        "accommodations": accommodations,
        "sustainability_score": sustainability_score,
        "sustainability_features": features,
        "carbon_footprint_score": carbon_score,
        "green_offset_tip": offset_tip,
        "activities": activities,
        "best_season": season,
        "price_tier": price_tier,
        "price_range_usd": {"min": price_min, "max": price_max},
        "currency": country_info["currency"],
        "description": description,
        "family_friendly": random.choice([True, True, False]),
        "accessibility_rating": random.choice(["full", "partial", "limited"]),
        "group_size": random.choice(["solo", "couple", "small-group", "family", "any"]),
        "duration_days": {"min": random.randint(2, 5), "max": random.randint(7, 21)},
        "image_url": f"https://source.unsplash.com/800x600/?{category},{country.lower().replace(' ', '-')}",
        "featured": random.random() > 0.85,
    }


def get_continent(country):
    """Map country to continent."""
    mapping = {
        "Canada": "North America", "Costa Rica": "Central America", "Norway": "Europe",
        "New Zealand": "Oceania", "Japan": "Asia", "Iceland": "Europe",
        "Portugal": "Europe", "Kenya": "Africa", "Peru": "South America",
        "Slovenia": "Europe", "Bhutan": "Asia", "Ecuador": "South America",
        "Sweden": "Europe", "Chile": "South America", "Croatia": "Europe",
        "Thailand": "Asia", "Scotland": "Europe", "Colombia": "South America",
        "Finland": "Europe", "Morocco": "Africa",
    }
    return mapping.get(country, "Unknown")


def generate_all_destinations(target_count=750):
    """Generate the full dataset."""
    destinations = []
    idx = 0

    # Ensure good coverage: every country+region gets at least one destination
    for country, info in COUNTRIES.items():
        for region in info["regions"]:
            category = random.choice(CATEGORIES)
            destinations.append(generate_destination(idx, country, region, category))
            idx += 1

    # Fill remaining with random combinations
    while len(destinations) < target_count:
        country = random.choice(list(COUNTRIES.keys()))
        region = random.choice(COUNTRIES[country]["regions"])
        category = random.choice(CATEGORIES)
        destinations.append(generate_destination(idx, country, region, category))
        idx += 1

    return destinations


def upload_to_algolia(records):
    """Upload records to Algolia index."""
    client = SearchClientSync(APP_ID, ADMIN_KEY)

    # Upload in batches
    batch_size = 100
    for i in range(0, len(records), batch_size):
        batch = records[i:i + batch_size]
        client.save_objects(INDEX_NAME, batch)
        print(f"  Uploaded batch {i // batch_size + 1}/{(len(records) + batch_size - 1) // batch_size}")

    # Configure index settings
    client.set_settings(INDEX_NAME, {
        "searchableAttributes": [
            "name", "country", "region", "category", "description",
            "activities", "sustainability_features", "accommodations.type"
        ],
        "attributesForFaceting": [
            "searchable(country)", "searchable(category)", "searchable(continent)",
            "searchable(best_season)", "searchable(price_tier)",
            "searchable(activities)", "searchable(group_size)",
            "family_friendly", "featured",
            "filterOnly(sustainability_score)", "filterOnly(carbon_footprint_score)"
        ],
        "customRanking": [
            "desc(sustainability_score)", "asc(carbon_footprint_score)", "desc(featured)"
        ],
        "attributesToRetrieve": [
            "name", "country", "region", "continent", "category", "categories",
            "transport_options", "accommodations", "sustainability_score",
            "sustainability_features", "carbon_footprint_score", "green_offset_tip",
            "activities", "best_season", "price_tier", "price_range_usd",
            "description", "family_friendly", "accessibility_rating",
            "group_size", "duration_days", "image_url", "featured"
        ],
        "attributesToHighlight": ["name", "description", "activities", "sustainability_features"],
        "hitsPerPage": 10,
    })
    print("  Index settings configured.")

    return len(records)


if __name__ == "__main__":
    print("Generating EcoVoyage dataset...")
    destinations = generate_all_destinations(750)
    print(f"  Generated {len(destinations)} destinations across {len(COUNTRIES)} countries")

    # Save locally
    with open("/tmp/destinations.json", "w") as f:
        json.dump(destinations, f, indent=2)
    print("  Saved to destinations.json")

    # Upload to Algolia
    print("Uploading to Algolia...")
    count = upload_to_algolia(destinations)
    print(f"  Done! {count} records indexed in '{INDEX_NAME}'")
