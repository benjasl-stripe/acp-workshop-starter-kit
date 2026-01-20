/**
 * Shared Product Store
 * 
 * Central store for product data, shared between products.js and checkouts.js
 * This allows price and stock changes to be reflected in checkout validation.
 */

// Store original prices for reset functionality
export const originalPrices = {
  "SKI-001": 749,
  "SKI-002": 699,
  "SKI-003": 799,
  "SKI-004": 649,
  "SKI-005": 749,
  "SKI-006": 799,
  "SKI-007": 699,
  "SKI-008": 799,
  "SKI-009": 749,
  "SKI-010": 649,
  "SKI-011": 749,
  "SKI-012": 699,
  "SKI-013": 749,
  "SKI-014": 649,
  "SKI-015": 699,
  "SKI-016": 799,
  "SKI-017": 699,
  "SKI-018": 799,
  "SKI-019": 699,
  "SKI-020": 749,
  "SKI-021": 699,
  "SKI-022": 799,
  "SKI-023": 749,
  "SKI-024": 699,
  "SKI-025": 799,
  "SKI-026": 699,
  "SKI-027": 749,
  "SKI-028": 799,
  "SKI-029": 699,
  "SKI-030": 749,
  "SKI-031": 699,
  "SKI-032": 799,
  "SKI-033": 699,
  "SKI-034": 749,
  "SKI-035": 799,
  "SKI-036": 699,
  "SKI-037": 749,
  "SKI-038": 699,
  "SKI-039": 799,
  "SKI-040": 699,
  "SKI-041": 749,
  "SKI-042": 799,
  "SKI-043": 699,
  "SKI-044": 749,
  "SKI-045": 699,
  "SKI-046": 799,
  "SKI-047": 699,
  "SKI-048": 749,
  "SKI-049": 699,
  "SKI-050": 799,

  "BOOT-001": 599,
  "BOOT-002": 649,
  "BOOT-003": 699,
  "BOOT-004": 649,
  "BOOT-005": 749,
  "BOOT-006": 599,
  "BOOT-007": 649,
  "BOOT-008": 699,
  "BOOT-009": 649,
  "BOOT-010": 749,
  "BOOT-011": 649,
  "BOOT-012": 699,
  "BOOT-013": 649,
  "BOOT-014": 699,
  "BOOT-015": 749,
  "BOOT-016": 649,
  "BOOT-017": 699,
  "BOOT-018": 749,
  "BOOT-019": 649,
  "BOOT-020": 699,
  "BOOT-021": 799,
  "BOOT-022": 749,
  "BOOT-023": 799,
  "BOOT-024": 749,
  "BOOT-025": 849,
  "BOOT-026": 799,
  "BOOT-027": 899,
  "BOOT-028": 849,
  "BOOT-029": 899,
  "BOOT-030": 799,

  "POLE-001": 119,
  "POLE-002": 99,
  "POLE-003": 79,
  "POLE-004": 89,
  "POLE-005": 79,
  "POLE-006": 109,
  "POLE-007": 149,
  "POLE-008": 69,
  "POLE-009": 89,
  "POLE-010": 99,
  "POLE-011": 89,
  "POLE-012": 79,
  "POLE-013": 129,
  "POLE-014": 169,
  "POLE-015": 109,
  "POLE-016": 149,
  "POLE-017": 119,
  "POLE-018": 79,
  "POLE-019": 109,
  "POLE-020": 89
};

// In-memory product store with stock quantities
export const products = [
  {
    "id": "SKI-001",
    "type": "Skis",
    "brand": "Blizzard",
    "model": "Rustler 10",
    "title": "Blizzard Rustler 10",
    "price": 749,
    "currency": "USD",
    "thumbnail": "https://example.com/images/skis/blizzard-rustler-10.jpg",
    "description": "Playful freeride/all-mountain wide platform for soft snow, crud, and mixed conditions.",
    "category": "Ski Equipment",
    "stock": 12,
    "inStock": true,
    "rating": 4.6,
    "reviews": 1840,
    "selectors": {
      "ability": ["Intermediate", "Advanced", "Expert"],
      "terrain": ["Groomers", "Trees", "Chop/Crud"],
      "skiStyle": ["Freeride", "All-Mountain", "Powder"],
      "recommendedHeightDeltaCm": { "beginner": -15, "intermediate": -10, "advanced": -5, "expert": 0 },
      "waistWidthMm": 102,
      "turnRadiusM": 17,
      "profile": "Rocker/Camber/Rocker",
      "flex": "Medium-Stiff",
      "mountPoint": "Directional"
    }
  },
  {
    "id": "SKI-002",
    "type": "Skis",
    "brand": "Blizzard",
    "model": "Rustler 9",
    "title": "Blizzard Rustler 9",
    "price": 699,
    "currency": "USD",
    "thumbnail": "https://example.com/images/skis/blizzard-rustler-9.jpg",
    "description": "Quiver-of-one all-mountain freeride option with quick edge-to-edge feel.",
    "category": "Ski Equipment",
    "stock": 10,
    "inStock": true,
    "rating": 4.5,
    "reviews": 1320,
    "selectors": {
      "ability": ["Intermediate", "Advanced", "Expert"],
      "terrain": ["Groomers", "Moguls", "Trees"],
      "skiStyle": ["All-Mountain", "Freeride"],
      "waistWidthMm": 96,
      "turnRadiusM": 16,
      "profile": "Rocker/Camber/Rocker",
      "flex": "Medium",
      "mountPoint": "Directional"
    }
  },
  {
    "id": "SKI-003",
    "type": "Skis",
    "brand": "Blizzard",
    "model": "Anomaly 94",
    "title": "Blizzard Anomaly 94",
    "price": 799,
    "currency": "USD",
    "thumbnail": "https://example.com/images/skis/blizzard-anomaly-94.jpg",
    "description": "Stable, damp all-mountain charger biased toward firm snow performance.",
    "category": "Ski Equipment",
    "stock": 7,
    "inStock": true,
    "rating": 4.4,
    "reviews": 520,
    "selectors": {
      "ability": ["Advanced", "Expert"],
      "terrain": ["Groomers", "Chop/Crud"],
      "skiStyle": ["All-Mountain", "Carving"],
      "waistWidthMm": 94,
      "turnRadiusM": 18,
      "profile": "Rocker/Camber/Rocker",
      "flex": "Stiff",
      "mountPoint": "Directional"
    }
  },
  {
    "id": "SKI-004",
    "type": "Skis",
    "brand": "Salomon",
    "model": "QST 94",
    "title": "Salomon QST 94",
    "price": 649,
    "currency": "USD",
    "thumbnail": "https://example.com/images/skis/salomon-qst-94.jpg",
    "description": "Versatile under-100mm all-mountain ski with friendly handling in mixed snow.",
    "category": "Ski Equipment",
    "stock": 14,
    "inStock": true,
    "rating": 4.4,
    "reviews": 990,
    "selectors": {
      "ability": ["Beginner", "Intermediate", "Advanced"],
      "terrain": ["Groomers", "Trees", "Chop/Crud"],
      "skiStyle": ["All-Mountain", "Freeride"],
      "waistWidthMm": 94,
      "turnRadiusM": 16,
      "profile": "Rocker/Camber/Rocker",
      "flex": "Medium",
      "mountPoint": "Directional"
    }
  },
  {
    "id": "SKI-005",
    "type": "Skis",
    "brand": "Salomon",
    "model": "QST 98",
    "title": "Salomon QST 98",
    "price": 749,
    "currency": "USD",
    "thumbnail": "https://example.com/images/skis/salomon-qst-98.jpg",
    "description": "Balanced freeride/all-mountain shape with a playful feel and strong versatility.",
    "category": "Ski Equipment",
    "stock": 9,
    "inStock": true,
    "rating": 4.5,
    "reviews": 860,
    "selectors": {
      "ability": ["Intermediate", "Advanced", "Expert"],
      "terrain": ["Groomers", "Trees", "Powder"],
      "skiStyle": ["All-Mountain", "Freeride"],
      "waistWidthMm": 98,
      "turnRadiusM": 17,
      "profile": "Rocker/Camber/Rocker",
      "flex": "Medium",
      "mountPoint": "Directional"
    }
  },

  { "id": "SKI-006", "type": "Skis", "brand": "Nordica", "model": "Enforcer 99", "title": "Nordica Enforcer 99", "price": 799, "currency": "USD", "thumbnail": "https://example.com/images/skis/nordica-enforcer-99.jpg", "description": "Powerful all-mountain ski with strong edge hold and stability in variable conditions.", "category": "Ski Equipment", "stock": 8, "inStock": true, "rating": 4.6, "reviews": 2150, "selectors": { "ability": ["Advanced", "Expert"], "terrain": ["Groomers", "Chop/Crud"], "skiStyle": ["All-Mountain"], "waistWidthMm": 99, "turnRadiusM": 18, "profile": "Rocker/Camber/Rocker", "flex": "Stiff", "mountPoint": "Directional" } },
  { "id": "SKI-007", "type": "Skis", "brand": "Nordica", "model": "Enforcer 94", "title": "Nordica Enforcer 94", "price": 699, "currency": "USD", "thumbnail": "https://example.com/images/skis/nordica-enforcer-94.jpg", "description": "Firm-snow leaning Enforcer feel with quicker transitions and strong grip.", "category": "Ski Equipment", "stock": 10, "inStock": true, "rating": 4.5, "reviews": 1640, "selectors": { "ability": ["Advanced", "Expert"], "terrain": ["Groomers", "Moguls"], "skiStyle": ["All-Mountain", "Carving"], "waistWidthMm": 94, "turnRadiusM": 17, "profile": "Rocker/Camber/Rocker", "flex": "Stiff", "mountPoint": "Directional" } },
  { "id": "SKI-008", "type": "Skis", "brand": "Nordica", "model": "Enforcer 104 Free", "title": "Nordica Enforcer 104 Free", "price": 799, "currency": "USD", "thumbnail": "https://example.com/images/skis/nordica-enforcer-104-free.jpg", "description": "Freeride-biased Enforcer with better float and off-piste confidence.", "category": "Ski Equipment", "stock": 6, "inStock": true, "rating": 4.5, "reviews": 980, "selectors": { "ability": ["Advanced", "Expert"], "terrain": ["Powder", "Trees", "Chop/Crud"], "skiStyle": ["Freeride", "Powder"], "waistWidthMm": 104, "turnRadiusM": 18, "profile": "Rocker/Camber/Rocker", "flex": "Stiff", "mountPoint": "Directional" } },

  { "id": "SKI-009", "type": "Skis", "brand": "K2", "model": "Mindbender 99Ti", "title": "K2 Mindbender 99Ti", "price": 749, "currency": "USD", "thumbnail": "https://example.com/images/skis/k2-mindbender-99ti.jpg", "description": "Stable, metal-laminate all-mountain ski that likes speed and variable snow.", "category": "Ski Equipment", "stock": 7, "inStock": true, "rating": 4.4, "reviews": 1130, "selectors": { "ability": ["Advanced", "Expert"], "terrain": ["Groomers", "Chop/Crud"], "skiStyle": ["All-Mountain"], "waistWidthMm": 99, "turnRadiusM": 19, "profile": "Rocker/Camber/Rocker", "flex": "Stiff", "mountPoint": "Directional" } },
  { "id": "SKI-010", "type": "Skis", "brand": "K2", "model": "Mindbender 89Ti", "title": "K2 Mindbender 89Ti", "price": 649, "currency": "USD", "thumbnail": "https://example.com/images/skis/k2-mindbender-89ti.jpg", "description": "More frontside-oriented Mindbender for carving and mixed resort days.", "category": "Ski Equipment", "stock": 9, "inStock": true, "rating": 4.3, "reviews": 720, "selectors": { "ability": ["Intermediate", "Advanced"], "terrain": ["Groomers", "Moguls"], "skiStyle": ["All-Mountain", "Carving"], "waistWidthMm": 89, "turnRadiusM": 17, "profile": "Rocker/Camber/Rocker", "flex": "Medium-Stiff", "mountPoint": "Directional" } },
  { "id": "SKI-011", "type": "Skis", "brand": "K2", "model": "Mindbender 108Ti", "title": "K2 Mindbender 108Ti", "price": 749, "currency": "USD", "thumbnail": "https://example.com/images/skis/k2-mindbender-108ti.jpg", "description": "Big-mountain freeride platform built for stability in soft snow and chop.", "category": "Ski Equipment", "stock": 5, "inStock": true, "rating": 4.4, "reviews": 640, "selectors": { "ability": ["Advanced", "Expert"], "terrain": ["Powder", "Chop/Crud"], "skiStyle": ["Freeride", "Powder"], "waistWidthMm": 108, "turnRadiusM": 20, "profile": "Rocker/Camber/Rocker", "flex": "Stiff", "mountPoint": "Directional" } },

  { "id": "SKI-012", "type": "Skis", "brand": "Atomic", "model": "Bent 100", "title": "Atomic Bent 100", "price": 699, "currency": "USD", "thumbnail": "https://example.com/images/skis/atomic-bent-100.jpg", "description": "Playful, versatile freeride ski that pivots easily and favors a surfy style.", "category": "Ski Equipment", "stock": 13, "inStock": true, "rating": 4.5, "reviews": 1900, "selectors": { "ability": ["Intermediate", "Advanced", "Expert"], "terrain": ["Trees", "Powder", "Park"], "skiStyle": ["Freeride", "Powder", "Playful"], "waistWidthMm": 100, "turnRadiusM": 19, "profile": "Rocker/Camber/Rocker", "flex": "Medium", "mountPoint": "Freeride" } },
  { "id": "SKI-013", "type": "Skis", "brand": "Atomic", "model": "Bent 90", "title": "Atomic Bent 90", "price": 749, "currency": "USD", "thumbnail": "https://example.com/images/skis/atomic-bent-90.jpg", "description": "Lighter, quicker Bent feel for freestyle-friendly all-mountain skiing.", "category": "Ski Equipment", "stock": 11, "inStock": true, "rating": 4.4, "reviews": 870, "selectors": { "ability": ["Intermediate", "Advanced"], "terrain": ["Park", "Groomers", "Moguls"], "skiStyle": ["Freestyle", "All-Mountain"], "waistWidthMm": 90, "turnRadiusM": 18, "profile": "Rocker/Camber/Rocker", "flex": "Medium", "mountPoint": "Freeride" } },
  { "id": "SKI-014", "type": "Skis", "brand": "Atomic", "model": "Maverick 95 Ti", "title": "Atomic Maverick 95 Ti", "price": 649, "currency": "USD", "thumbnail": "https://example.com/images/skis/atomic-maverick-95ti.jpg", "description": "Directional all-mountain ski with a stronger backbone for mixed resort snow.", "category": "Ski Equipment", "stock": 8, "inStock": true, "rating": 4.3, "reviews": 620, "selectors": { "ability": ["Intermediate", "Advanced", "Expert"], "terrain": ["Groomers", "Chop/Crud"], "skiStyle": ["All-Mountain"], "waistWidthMm": 95, "turnRadiusM": 18, "profile": "Rocker/Camber/Rocker", "flex": "Medium-Stiff", "mountPoint": "Directional" } },

  { "id": "SKI-015", "type": "Skis", "brand": "Rossignol", "model": "Sender Soul 102", "title": "Rossignol Sender Soul 102", "price": 699, "currency": "USD", "thumbnail": "https://example.com/images/skis/rossignol-sender-soul-102.jpg", "description": "Modern freeride shape that blends stability with quick pivots in soft snow.", "category": "Ski Equipment", "stock": 6, "inStock": true, "rating": 4.5, "reviews": 410, "selectors": { "ability": ["Advanced", "Expert"], "terrain": ["Trees", "Powder", "Chop/Crud"], "skiStyle": ["Freeride", "Powder"], "waistWidthMm": 102, "turnRadiusM": 18, "profile": "Rocker/Camber/Rocker", "flex": "Medium-Stiff", "mountPoint": "Freeride" } },
  { "id": "SKI-016", "type": "Skis", "brand": "Rossignol", "model": "Experience 86 Basalt", "title": "Rossignol Experience 86 Basalt", "price": 799, "currency": "USD", "thumbnail": "https://example.com/images/skis/rossignol-experience-86-basalt.jpg", "description": "Frontside/all-mountain carver with smooth damping and accessible power.", "category": "Ski Equipment", "stock": 10, "inStock": true, "rating": 4.3, "reviews": 520, "selectors": { "ability": ["Beginner", "Intermediate", "Advanced"], "terrain": ["Groomers"], "skiStyle": ["Carving", "All-Mountain"], "waistWidthMm": 86, "turnRadiusM": 15, "profile": "Rocker/Camber/Rocker", "flex": "Medium", "mountPoint": "Directional" } },

  { "id": "SKI-017", "type": "Skis", "brand": "Volkl", "model": "Mantra M7", "title": "Völkl Mantra M7",
    "price": 699, "currency": "USD", "thumbnail": "https://example.com/images/skis/volkl-mantra-m7.jpg",
    "description": "Classic hard-charging all-mountain ski with strong edge hold and stability.",
    "category": "Ski Equipment", "stock": 7, "inStock": true, "rating": 4.5, "reviews": 1400,
    "selectors": { "ability": ["Advanced", "Expert"], "terrain": ["Groomers", "Chop/Crud"], "skiStyle": ["All-Mountain", "Carving"], "waistWidthMm": 96, "turnRadiusM": 19, "profile": "Rocker/Camber/Rocker", "flex": "Stiff", "mountPoint": "Directional" }
  },
  { "id": "SKI-018", "type": "Skis", "brand": "Volkl", "model": "Kendo 88", "title": "Völkl Kendo 88",
    "price": 799, "currency": "USD", "thumbnail": "https://example.com/images/skis/volkl-kendo-88.jpg",
    "description": "Precise frontside-to-all-mountain ski that loves firm snow and speed control.",
    "category": "Ski Equipment", "stock": 8, "inStock": true, "rating": 4.4, "reviews": 980,
    "selectors": { "ability": ["Intermediate", "Advanced", "Expert"], "terrain": ["Groomers", "Moguls"], "skiStyle": ["Carving", "All-Mountain"], "waistWidthMm": 88, "turnRadiusM": 16, "profile": "Rocker/Camber/Rocker", "flex": "Medium-Stiff", "mountPoint": "Directional" }
  },

  { "id": "SKI-019", "type": "Skis", "brand": "Head", "model": "Kore 99", "title": "Head Kore 99", "price": 699, "currency": "USD", "thumbnail": "https://example.com/images/skis/head-kore-99.jpg", "description": "Lightweight, energetic all-mountain freeride ski for quick direction changes.", "category": "Ski Equipment", "stock": 10, "inStock": true, "rating": 4.3, "reviews": 860, "selectors": { "ability": ["Advanced", "Expert"], "terrain": ["Trees", "Chop/Crud"], "skiStyle": ["All-Mountain", "Freeride"], "waistWidthMm": 99, "turnRadiusM": 17, "profile": "Rocker/Camber/Rocker", "flex": "Medium-Stiff", "mountPoint": "Directional" } },
  { "id": "SKI-020", "type": "Skis", "brand": "Head", "model": "Kore 105", "title": "Head Kore 105", "price": 749, "currency": "USD", "thumbnail": "https://example.com/images/skis/head-kore-105.jpg", "description": "Freeride-leaning Kore with better float and a nimble feel for its width.", "category": "Ski Equipment", "stock": 6, "inStock": true, "rating": 4.3, "reviews": 520, "selectors": { "ability": ["Advanced", "Expert"], "terrain": ["Powder", "Trees"], "skiStyle": ["Freeride", "Powder"], "waistWidthMm": 105, "turnRadiusM": 18, "profile": "Rocker/Camber/Rocker", "flex": "Medium-Stiff", "mountPoint": "Freeride" } },

  { "id": "SKI-021", "type": "Skis", "brand": "Elan", "model": "Ripstick 96", "title": "Elan Ripstick 96", "price": 699, "currency": "USD", "thumbnail": "https://example.com/images/skis/elan-ripstick-96.jpg", "description": "Light, quick all-mountain ski that favors a playful, agile approach.", "category": "Ski Equipment", "stock": 12, "inStock": true, "rating": 4.4, "reviews": 1120, "selectors": { "ability": ["Intermediate", "Advanced"], "terrain": ["Trees", "Moguls", "Groomers"], "skiStyle": ["All-Mountain", "Freeride"], "waistWidthMm": 96, "turnRadiusM": 16, "profile": "Rocker/Camber/Rocker", "flex": "Medium", "mountPoint": "Directional" } },
  { "id": "SKI-022", "type": "Skis", "brand": "Elan", "model": "Ripstick 106", "title": "Elan Ripstick 106", "price": 799, "currency": "USD", "thumbnail": "https://example.com/images/skis/elan-ripstick-106.jpg", "description": "Soft-snow oriented Ripstick with strong maneuverability in powder and trees.", "category": "Ski Equipment", "stock": 7, "inStock": true, "rating": 4.4, "reviews": 640, "selectors": { "ability": ["Advanced", "Expert"], "terrain": ["Powder", "Trees"], "skiStyle": ["Powder", "Freeride"], "waistWidthMm": 106, "turnRadiusM": 18, "profile": "Rocker/Camber/Rocker", "flex": "Medium", "mountPoint": "Freeride" } },

  { "id": "SKI-023", "type": "Skis", "brand": "Fischer", "model": "Ranger 102", "title": "Fischer Ranger 102", "price": 749, "currency": "USD", "thumbnail": "https://example.com/images/skis/fischer-ranger-102.jpg", "description": "Modern freeride/all-mountain shape with balanced stability and maneuverability.", "category": "Ski Equipment", "stock": 8, "inStock": true, "rating": 4.3, "reviews": 540, "selectors": { "ability": ["Intermediate", "Advanced", "Expert"], "terrain": ["Trees", "Chop/Crud"], "skiStyle": ["All-Mountain", "Freeride"], "waistWidthMm": 102, "turnRadiusM": 18, "profile": "Rocker/Camber/Rocker", "flex": "Medium-Stiff", "mountPoint": "Freeride" } },
  { "id": "SKI-024", "type": "Skis", "brand": "Fischer", "model": "Ranger 96", "title": "Fischer Ranger 96", "price": 699, "currency": "USD", "thumbnail": "https://example.com/images/skis/fischer-ranger-96.jpg", "description": "Quicker, narrower Ranger for more edge precision without losing off-piste fun.", "category": "Ski Equipment", "stock": 9, "inStock": true, "rating": 4.2, "reviews": 420, "selectors": { "ability": ["Intermediate", "Advanced"], "terrain": ["Groomers", "Trees", "Moguls"], "skiStyle": ["All-Mountain"], "waistWidthMm": 96, "turnRadiusM": 17, "profile": "Rocker/Camber/Rocker", "flex": "Medium", "mountPoint": "Directional" } },

  { "id": "SKI-025", "type": "Skis", "brand": "Dynastar", "model": "M-Free 99", "title": "Dynastar M-Free 99", "price": 799, "currency": "USD", "thumbnail": "https://example.com/images/skis/dynastar-m-free-99.jpg", "description": "Surfier freeride ski that pivots fast and thrives in soft/variable snow.", "category": "Ski Equipment", "stock": 6, "inStock": true, "rating": 4.4, "reviews": 610, "selectors": { "ability": ["Advanced", "Expert"], "terrain": ["Trees", "Powder"], "skiStyle": ["Freeride", "Playful"], "waistWidthMm": 99, "turnRadiusM": 18, "profile": "Rocker/Camber/Rocker", "flex": "Medium", "mountPoint": "Freeride" } },
  { "id": "SKI-026", "type": "Skis", "brand": "Dynastar", "model": "M-Pro 90", "title": "Dynastar M-Pro 90", "price": 699, "currency": "USD", "thumbnail": "https://example.com/images/skis/dynastar-m-pro-90.jpg", "description": "Directional all-mountain ski for strong grip and predictable turn shapes.", "category": "Ski Equipment", "stock": 10, "inStock": true, "rating": 4.2, "reviews": 380, "selectors": { "ability": ["Intermediate", "Advanced"], "terrain": ["Groomers", "Moguls"], "skiStyle": ["All-Mountain", "Carving"], "waistWidthMm": 90, "turnRadiusM": 16, "profile": "Rocker/Camber/Rocker", "flex": "Medium-Stiff", "mountPoint": "Directional" } },

  { "id": "SKI-027", "type": "Skis", "brand": "Armada", "model": "Declivity 102 Ti", "title": "Armada Declivity 102 Ti", "price": 749, "currency": "USD", "thumbnail": "https://example.com/images/skis/armada-declivity-102ti.jpg", "description": "Metal-backed all-mountain freeride ski with stability and a lively edge feel.", "category": "Ski Equipment", "stock": 7, "inStock": true, "rating": 4.3, "reviews": 410, "selectors": { "ability": ["Advanced", "Expert"], "terrain": ["Chop/Crud", "Groomers"], "skiStyle": ["All-Mountain", "Freeride"], "waistWidthMm": 102, "turnRadiusM": 19, "profile": "Rocker/Camber/Rocker", "flex": "Medium-Stiff", "mountPoint": "Directional" } },
  { "id": "SKI-028", "type": "Skis", "brand": "Armada", "model": "ARV 106", "title": "Armada ARV 106", "price": 799, "currency": "USD", "thumbnail": "https://example.com/images/skis/armada-arv-106.jpg", "description": "Freestyle-forward freeride ski for playful lines, spins, and soft-snow laps.", "category": "Ski Equipment", "stock": 9, "inStock": true, "rating": 4.4, "reviews": 690, "selectors": { "ability": ["Intermediate", "Advanced", "Expert"], "terrain": ["Park", "Trees", "Powder"], "skiStyle": ["Freestyle", "Freeride", "Playful"], "waistWidthMm": 106, "turnRadiusM": 20, "profile": "Rocker/Camber/Rocker", "flex": "Medium", "mountPoint": "Freestyle" } },

  { "id": "SKI-029", "type": "Skis", "brand": "Black Crows", "model": "Camox", "title": "Black Crows Camox", "price": 699, "currency": "USD", "thumbnail": "https://example.com/images/skis/blackcrows-camox.jpg", "description": "Balanced all-mountain ski with a playful tail and strong day-to-day versatility.", "category": "Ski Equipment", "stock": 6, "inStock": true, "rating": 4.4, "reviews": 760, "selectors": { "ability": ["Intermediate", "Advanced"], "terrain": ["Groomers", "Trees", "Moguls"], "skiStyle": ["All-Mountain"], "waistWidthMm": 97, "turnRadiusM": 18, "profile": "Rocker/Camber/Rocker", "flex": "Medium", "mountPoint": "Freeride" } },
  { "id": "SKI-030", "type": "Skis", "brand": "Black Crows", "model": "Atris", "title": "Black Crows Atris", "price": 749, "currency": "USD", "thumbnail": "https://example.com/images/skis/blackcrows-atris.jpg", "description": "Freeride ski with float and pivot for soft-snow days and playful off-piste lines.", "category": "Ski Equipment", "stock": 5, "inStock": true, "rating": 4.5, "reviews": 820, "selectors": { "ability": ["Advanced", "Expert"], "terrain": ["Powder", "Trees"], "skiStyle": ["Freeride", "Powder"], "waistWidthMm": 105, "turnRadiusM": 19, "profile": "Rocker/Camber/Rocker", "flex": "Medium", "mountPoint": "Freeride" } },

  { "id": "SKI-031", "type": "Skis", "brand": "Line", "model": "Blade", "title": "Line Blade", "price": 699, "currency": "USD", "thumbnail": "https://example.com/images/skis/line-blade.jpg", "description": "Wide, high-energy carving ski built for laying trenches on groomers.", "category": "Ski Equipment", "stock": 6, "inStock": true, "rating": 4.3, "reviews": 420, "selectors": { "ability": ["Intermediate", "Advanced", "Expert"], "terrain": ["Groomers"], "skiStyle": ["Carving"], "waistWidthMm": 95, "turnRadiusM": 13, "profile": "Camber",
    "flex": "Medium-Stiff", "mountPoint": "Directional" } },
  { "id": "SKI-032", "type": "Skis", "brand": "Salomon", "model": "Stance 90", "title": "Salomon Stance 90", "price": 799, "currency": "USD", "thumbnail": "https://example.com/images/skis/salomon-stance-90.jpg", "description": "Directional all-mountain ski with a damp feel and strong grip on firmer snow.", "category": "Ski Equipment", "stock": 11, "inStock": true, "rating": 4.2, "reviews": 530, "selectors": { "ability": ["Intermediate", "Advanced"], "terrain": ["Groomers", "Chop/Crud"], "skiStyle": ["All-Mountain", "Carving"], "waistWidthMm": 90, "turnRadiusM": 16, "profile": "Rocker/Camber/Rocker", "flex": "Medium-Stiff", "mountPoint": "Directional" } },

  { "id": "SKI-033", "type": "Skis", "brand": "Atomic", "model": "Maverick 88 Ti", "title": "Atomic Maverick 88 Ti", "price": 699, "currency": "USD", "thumbnail": "https://example.com/images/skis/atomic-maverick-88ti.jpg", "description": "Firm-snow all-mountain ski with a precise, energetic turn initiation.", "category": "Ski Equipment", "stock": 9, "inStock": true, "rating": 4.2, "reviews": 480, "selectors": { "ability": ["Intermediate", "Advanced"], "terrain": ["Groomers", "Moguls"], "skiStyle": ["Carving", "All-Mountain"], "waistWidthMm": 88, "turnRadiusM": 16, "profile": "Rocker/Camber/Rocker", "flex": "Medium-Stiff", "mountPoint": "Directional" } },
  { "id": "SKI-034", "type": "Skis", "brand": "Head", "model": "Supershape e-Titan", "title": "Head Supershape e-Titan", "price": 749, "currency": "USD", "thumbnail": "https://example.com/images/skis/head-supershape-e-titan.jpg", "description": "High-performance frontside carver designed for grip and short-to-mid turns.", "category": "Ski Equipment", "stock": 4, "inStock": true, "rating": 4.4, "reviews": 390, "selectors": { "ability": ["Advanced", "Expert"], "terrain": ["Groomers"], "skiStyle": ["Carving"], "waistWidthMm": 84, "turnRadiusM": 14, "profile": "Camber", "flex": "Stiff", "mountPoint": "Directional" } },

  { "id": "SKI-035", "type": "Skis", "brand": "Rossignol", "model": "Blackops 98", "title": "Rossignol Blackops 98", "price": 799, "currency": "USD", "thumbnail": "https://example.com/images/skis/rossignol-blackops-98.jpg", "description": "Freestyle-forward all-mountain ski for playful lines, jumps, and side hits.", "category": "Ski Equipment", "stock": 8, "inStock": true, "rating": 4.3, "reviews": 610, "selectors": { "ability": ["Intermediate", "Advanced"], "terrain": ["Park", "Trees", "Groomers"], "skiStyle": ["Freestyle", "All-Mountain"], "waistWidthMm": 98, "turnRadiusM": 19, "profile": "Rocker/Camber/Rocker", "flex": "Medium", "mountPoint": "Freestyle" } },
  { "id": "SKI-036", "type": "Skis", "brand": "Volkl", "model": "Revolt 104", "title": "Völkl Revolt 104", "price": 699, "currency": "USD", "thumbnail": "https://example.com/images/skis/volkl-revolt-104.jpg", "description": "Freestyle freeride ski for big landings, spins, and soft-snow creativity.", "category": "Ski Equipment", "stock": 6, "inStock": true, "rating": 4.2, "reviews": 410, "selectors": { "ability": ["Advanced", "Expert"], "terrain": ["Park", "Powder", "Chop/Crud"], "skiStyle": ["Freestyle", "Freeride"], "waistWidthMm": 104, "turnRadiusM": 20, "profile": "Rocker/Camber/Rocker", "flex": "Medium", "mountPoint": "Freestyle" } },

  { "id": "SKI-037", "type": "Skis", "brand": "DPS", "model": "Pagoda 100 RP", "title": "DPS Pagoda 100 RP", "price": 749, "currency": "USD", "thumbnail": "https://example.com/images/skis/dps-pagoda-100-rp.jpg", "description": "Premium lightweight freeride/all-mountain design aimed at quick, surfy turns.", "category": "Ski Equipment", "stock": 3, "inStock": true, "rating": 4.3, "reviews": 210, "selectors": { "ability": ["Advanced", "Expert"], "terrain": ["Trees", "Powder", "Groomers"], "skiStyle": ["Freeride", "All-Mountain"], "waistWidthMm": 100, "turnRadiusM": 15, "profile": "Rocker/Camber/Rocker", "flex": "Medium", "mountPoint": "Freeride" } },
  { "id": "SKI-038", "type": "Skis", "brand": "Icelantic", "model": "Nomad 105", "title": "Icelantic Nomad 105", "price": 699, "currency": "USD", "thumbnail": "https://example.com/images/skis/icelantic-nomad-105.jpg", "description": "Freeride ski with a surfy shape built for soft snow, trees, and playful turns.", "category": "Ski Equipment", "stock": 5, "inStock": true, "rating": 4.2, "reviews": 260, "selectors": { "ability": ["Advanced", "Expert"], "terrain": ["Powder", "Trees"], "skiStyle": ["Powder", "Freeride"], "waistWidthMm": 105, "turnRadiusM": 18, "profile": "Rocker/Camber/Rocker", "flex": "Medium", "mountPoint": "Freeride" } },

  { "id": "SKI-039", "type": "Skis", "brand": "ON3P", "model": "Woodsman 102", "title": "ON3P Woodsman 102", "price": 799, "currency": "USD", "thumbnail": "https://example.com/images/skis/on3p-woodsman-102.jpg", "description": "Freeride directional twin that balances stability and playful tail release.", "category": "Ski Equipment", "stock": 4, "inStock": true, "rating": 4.4, "reviews": 190, "selectors": { "ability": ["Advanced", "Expert"], "terrain": ["Trees", "Chop/Crud", "Powder"], "skiStyle": ["Freeride"], "waistWidthMm": 102, "turnRadiusM": 19, "profile": "Rocker/Camber/Rocker", "flex": "Medium-Stiff", "mountPoint": "Freeride" } },
  { "id": "SKI-040", "type": "Skis", "brand": "ON3P", "model": "Jeffrey 108", "title": "ON3P Jeffrey 108", "price": 699, "currency": "USD", "thumbnail": "https://example.com/images/skis/on3p-jeffrey-108.jpg", "description": "Freestyle freeride platform for playful, surfy skiing in deeper snow.", "category": "Ski Equipment", "stock": 3, "inStock": true, "rating": 4.3, "reviews": 170, "selectors": { "ability": ["Advanced", "Expert"], "terrain": ["Powder", "Park", "Trees"], "skiStyle": ["Freestyle", "Powder"], "waistWidthMm": 108, "turnRadiusM": 20, "profile": "Rocker/Camber/Rocker", "flex": "Medium", "mountPoint": "Freestyle" } },

  { "id": "SKI-041", "type": "Skis", "brand": "Moment", "model": "Deathwish 104", "title": "Moment Deathwish 104", "price": 749, "currency": "USD", "thumbnail": "https://example.com/images/skis/moment-deathwish-104.jpg", "description": "Freeride ski known for strong edge feel with a playful shape for soft snow.", "category": "Ski Equipment", "stock": 4, "inStock": true, "rating": 4.5, "reviews": 240, "selectors": { "ability": ["Advanced", "Expert"], "terrain": ["Trees", "Powder", "Chop/Crud"], "skiStyle": ["Freeride"], "waistWidthMm": 104, "turnRadiusM": 19, "profile": "Rocker/Camber/Rocker", "flex": "Medium-Stiff", "mountPoint": "Freeride" } },
  { "id": "SKI-042", "type": "Skis", "brand": "Faction", "model": "Prodigy 3.0", "title": "Faction Prodigy 3.0", "price": 799, "currency": "USD", "thumbnail": "https://example.com/images/skis/faction-prodigy-3.jpg", "description": "Freestyle-friendly all-mountain ski for jumps, spins, and playful resort laps.", "category": "Ski Equipment", "stock": 7, "inStock": true, "rating": 4.2, "reviews": 420, "selectors": { "ability": ["Intermediate", "Advanced"], "terrain": ["Park", "Groomers", "Trees"], "skiStyle": ["Freestyle", "All-Mountain"], "waistWidthMm": 100, "turnRadiusM": 19, "profile": "Rocker/Camber/Rocker", "flex": "Medium", "mountPoint": "Freestyle" } },

  { "id": "SKI-043", "type": "Skis", "brand": "Black Diamond", "model": "Impulse 104", "title": "Black Diamond Impulse 104", "price": 699, "currency": "USD", "thumbnail": "https://example.com/images/skis/blackdiamond-impulse-104.jpg", "description": "Resort-focused freeride ski designed for stability with a playful shape.", "category": "Ski Equipment", "stock": 5, "inStock": true, "rating": 4.1, "reviews": 210, "selectors": { "ability": ["Advanced", "Expert"], "terrain": ["Chop/Crud", "Trees"], "skiStyle": ["Freeride"], "waistWidthMm": 104, "turnRadiusM": 19, "profile": "Rocker/Camber/Rocker", "flex": "Medium-Stiff", "mountPoint": "Directional" } },
  { "id": "SKI-044", "type": "Skis", "brand": "Scott", "model": "Pure 99Ti", "title": "Scott Pure 99Ti", "price": 749, "currency": "USD", "thumbnail": "https://example.com/images/skis/scott-pure-99ti.jpg", "description": "Directional all-mountain ski with metal reinforcement for stability at speed.", "category": "Ski Equipment", "stock": 6, "inStock": true, "rating": 4.1, "reviews": 160, "selectors": { "ability": ["Advanced", "Expert"], "terrain": ["Groomers", "Chop/Crud"], "skiStyle": ["All-Mountain"], "waistWidthMm": 99, "turnRadiusM": 18, "profile": "Rocker/Camber/Rocker", "flex": "Stiff", "mountPoint": "Directional" } },

  { "id": "SKI-045", "type": "Skis", "brand": "Salomon", "model": "QST Blank", "title": "Salomon QST Blank", "price": 699, "currency": "USD", "thumbnail": "https://example.com/images/skis/salomon-qst-blank.jpg", "description": "Freeride powder tool for deeper days and high-speed soft-snow lines.", "category": "Ski Equipment", "stock": 4, "inStock": true, "rating": 4.4, "reviews": 520, "selectors": { "ability": ["Advanced", "Expert"], "terrain": ["Powder", "Chop/Crud"], "skiStyle": ["Powder", "Freeride"], "waistWidthMm": 112, "turnRadiusM": 19, "profile": "Rocker/Camber/Rocker", "flex": "Medium-Stiff", "mountPoint": "Freeride" } },
  { "id": "SKI-046", "type": "Skis", "brand": "Atomic", "model": "Bent 110", "title": "Atomic Bent 110", "price": 799, "currency": "USD", "thumbnail": "https://example.com/images/skis/atomic-bent-110.jpg", "description": "Powder-focused Bent for surfy turns and playful big-mountain lines.", "category": "Ski Equipment", "stock": 5, "inStock": true, "rating": 4.4, "reviews": 690, "selectors": { "ability": ["Advanced", "Expert"], "terrain": ["Powder", "Trees"], "skiStyle": ["Powder", "Freeride", "Playful"], "waistWidthMm": 110, "turnRadiusM": 20, "profile": "Rocker/Camber/Rocker", "flex": "Medium", "mountPoint": "Freeride" } },
  { "id": "SKI-047", "type": "Skis", "brand": "Fischer", "model": "Ranger 108", "title": "Fischer Ranger 108", "price": 699, "currency": "USD", "thumbnail": "https://example.com/images/skis/fischer-ranger-108.jpg", "description": "Soft-snow freeride ski with a balanced feel for powder and variable conditions.", "category": "Ski Equipment", "stock": 4, "inStock": true, "rating": 4.2, "reviews": 260, "selectors": { "ability": ["Advanced", "Expert"], "terrain": ["Powder", "Chop/Crud"], "skiStyle": ["Powder", "Freeride"], "waistWidthMm": 108, "turnRadiusM": 19, "profile": "Rocker/Camber/Rocker", "flex": "Medium-Stiff", "mountPoint": "Freeride" } },
  { "id": "SKI-048", "type": "Skis", "brand": "Dynastar", "model": "M-Free 108", "title": "Dynastar M-Free 108", "price": 749, "currency": "USD", "thumbnail": "https://example.com/images/skis/dynastar-m-free-108.jpg", "description": "Powder and soft-snow freeride ski built for pivot and slashy turns.", "category": "Ski Equipment", "stock": 3, "inStock": true, "rating": 4.3, "reviews": 230, "selectors": { "ability": ["Advanced", "Expert"], "terrain": ["Powder", "Trees"], "skiStyle": ["Powder", "Freeride"], "waistWidthMm": 108, "turnRadiusM": 20, "profile": "Rocker/Camber/Rocker", "flex": "Medium", "mountPoint": "Freeride" } },
  { "id": "SKI-049", "type": "Skis", "brand": "Rossignol", "model": "Sender 94 Ti", "title": "Rossignol Sender 94 Ti", "price": 699, "currency": "USD", "thumbnail": "https://example.com/images/skis/rossignol-sender-94ti.jpg", "description": "Directional all-mountain freeride ski with metal support for confidence at speed.", "category": "Ski Equipment", "stock": 6, "inStock": true, "rating": 4.2, "reviews": 310, "selectors": { "ability": ["Advanced", "Expert"], "terrain": ["Groomers", "Chop/Crud"], "skiStyle": ["All-Mountain", "Freeride"], "waistWidthMm": 94, "turnRadiusM": 18, "profile": "Rocker/Camber/Rocker", "flex": "Medium-Stiff", "mountPoint": "Directional" } },
  { "id": "SKI-050", "type": "Skis", "brand": "K2", "model": "Reckoner 112", "title": "K2 Reckoner 112", "price": 799, "currency": "USD", "thumbnail": "https://example.com/images/skis/k2-reckoner-112.jpg", "description": "Freestyle powder ski for playful deep-snow skiing and creative terrain use.", "category": "Ski Equipment", "stock": 4, "inStock": true, "rating": 4.3, "reviews": 540, "selectors": { "ability": ["Advanced", "Expert"], "terrain": ["Powder", "Park", "Trees"], "skiStyle": ["Powder", "Freestyle"], "waistWidthMm": 112, "turnRadiusM": 22, "profile": "Rocker/Camber/Rocker", "flex": "Medium", "mountPoint": "Freestyle" } },

  {
    "id": "BOOT-001",
    "type": "Boots",
    "brand": "Atomic",
    "model": "Hawx Prime 100",
    "title": "Atomic Hawx Prime 100",
    "price": 599,
    "currency": "USD",
    "thumbnail": "https://example.com/images/boots/atomic-hawx-prime-100.jpg",
    "description": "Medium-volume alpine boot for progressing skiers seeking comfort and control.",
    "category": "Ski Equipment",
    "stock": 14,
    "inStock": true,
    "rating": 4.3,
    "reviews": 820,
    "selectors": {
      "ability": ["Beginner", "Intermediate"],
      "terrain": ["Groomers", "All-Resort"],
      "skiStyle": ["All-Mountain", "Carving"],
      "bootType": "Alpine",
      "lastMm": 100,
      "flexIndex": 100,
      "volume": "Medium"
    }
  },
  { "id": "BOOT-002", "type": "Boots", "brand": "Atomic", "model": "Hawx Prime 120", "title": "Atomic Hawx Prime 120", "price": 649, "currency": "USD", "thumbnail": "https://example.com/images/boots/atomic-hawx-prime-120.jpg", "description": "Responsive medium-volume boot aimed at advanced resort skiers.", "category": "Ski Equipment", "stock": 10, "inStock": true, "rating": 4.4, "reviews": 640, "selectors": { "ability": ["Advanced", "Expert"], "terrain": ["All-Resort"], "skiStyle": ["All-Mountain"], "bootType": "Alpine", "lastMm": 100, "flexIndex": 120, "volume": "Medium" } },
  { "id": "BOOT-003", "type": "Boots", "brand": "Atomic", "model": "Hawx Ultra 110", "title": "Atomic Hawx Ultra 110", "price": 699, "currency": "USD", "thumbnail": "https://example.com/images/boots/atomic-hawx-ultra-110.jpg", "description": "Low-volume fit for precise control; best for narrower feet.", "category": "Ski Equipment", "stock": 9, "inStock": true, "rating": 4.3, "reviews": 510, "selectors": { "ability": ["Intermediate", "Advanced"], "terrain": ["All-Resort"], "skiStyle": ["Carving", "All-Mountain"], "bootType": "Alpine", "lastMm": 98, "flexIndex": 110, "volume": "Low" } },
  { "id": "BOOT-004", "type": "Boots", "brand": "Atomic", "model": "Hawx Magna 110", "title": "Atomic Hawx Magna 110", "price": 649, "currency": "USD", "thumbnail": "https://example.com/images/boots/atomic-hawx-magna-110.jpg", "description": "High-volume boot with more room in the forefoot and instep.", "category": "Ski Equipment", "stock": 10, "inStock": true, "rating": 4.2, "reviews": 420, "selectors": { "ability": ["Intermediate", "Advanced"], "terrain": ["All-Resort"], "skiStyle": ["All-Mountain"], "bootType": "Alpine", "lastMm": 102, "flexIndex": 110, "volume": "High" } },
  { "id": "BOOT-005", "type": "Boots", "brand": "Salomon", "model": "S/Pro 100", "title": "Salomon S/Pro 100", "price": 749, "currency": "USD", "thumbnail": "https://example.com/images/boots/salomon-spro-100.jpg", "description": "Comfort-forward medium-volume boot with strong heel hold and easy entry.", "category": "Ski Equipment", "stock": 12, "inStock": true, "rating": 4.3, "reviews": 760, "selectors": { "ability": ["Beginner", "Intermediate"], "terrain": ["All-Resort"], "skiStyle": ["All-Mountain"], "bootType": "Alpine", "lastMm": 100, "flexIndex": 100, "volume": "Medium" } },
  { "id": "BOOT-006", "type": "Boots", "brand": "Salomon", "model": "S/Pro 120", "title": "Salomon S/Pro 120", "price": 599, "currency": "USD", "thumbnail": "https://example.com/images/boots/salomon-spro-120.jpg", "description": "More powerful S/Pro option for advanced skiers wanting precision and support.", "category": "Ski Equipment", "stock": 8, "inStock": true, "rating": 4.4, "reviews": 590, "selectors": { "ability": ["Advanced", "Expert"], "terrain": ["All-Resort"], "skiStyle": ["Carving", "All-Mountain"], "bootType": "Alpine", "lastMm": 100, "flexIndex": 120, "volume": "Medium" } },
  { "id": "BOOT-007", "type": "Boots", "brand": "Tecnica", "model": "Mach1 MV 120", "title": "Tecnica Mach1 MV 120", "price": 649, "currency": "USD", "thumbnail": "https://example.com/images/boots/tecnica-mach1-mv-120.jpg", "description": "Classic medium-volume performance boot for resort carving and stability.", "category": "Ski Equipment", "stock": 9, "inStock": true, "rating": 4.5, "reviews": 880, "selectors": { "ability": ["Advanced", "Expert"], "terrain": ["Groomers", "All-Resort"], "skiStyle": ["Carving", "All-Mountain"], "bootType": "Alpine", "lastMm": 100, "flexIndex": 120, "volume": "Medium" } },
  { "id": "BOOT-008", "type": "Boots", "brand": "Tecnica", "model": "Mach Sport HV 100", "title": "Tecnica Mach Sport HV 100", "price": 699, "currency": "USD", "thumbnail": "https://example.com/images/boots/tecnica-mach-sport-hv-100.jpg", "description": "High-volume comfort boot for progressing skiers who prioritize fit and warmth.", "category": "Ski Equipment", "stock": 11, "inStock": true, "rating": 4.2, "reviews": 430, "selectors": { "ability": ["Beginner", "Intermediate"], "terrain": ["Groomers", "All-Resort"], "skiStyle": ["All-Mountain"], "bootType": "Alpine", "lastMm": 103, "flexIndex": 100, "volume": "High" } },

  { "id": "BOOT-009", "type": "Boots", "brand": "Nordica", "model": "Speedmachine 3 120", "title": "Nordica Speedmachine 3 120", "price": 649, "currency": "USD", "thumbnail": "https://example.com/images/boots/nordica-speedmachine-3-120.jpg", "description": "Powerful do-it-all boot with a balanced fit and strong downhill performance.", "category": "Ski Equipment", "stock": 8, "inStock": true, "rating": 4.5, "reviews": 910, "selectors": { "ability": ["Advanced", "Expert"], "terrain": ["All-Resort"], "skiStyle": ["All-Mountain"], "bootType": "Alpine", "lastMm": 100, "flexIndex": 120, "volume": "Medium" } },
  { "id": "BOOT-010", "type": "Boots", "brand": "Nordica", "model": "Sportmachine 3 100", "title": "Nordica Sportmachine 3 100", "price": 749, "currency": "USD", "thumbnail": "https://example.com/images/boots/nordica-sportmachine-3-100.jpg", "description": "High-volume comfort boot with forgiving flex for all-day resort skiing.", "category": "Ski Equipment", "stock": 10, "inStock": true, "rating": 4.2, "reviews": 540, "selectors": { "ability": ["Beginner", "Intermediate"], "terrain": ["All-Resort"], "skiStyle": ["All-Mountain"], "bootType": "Alpine", "lastMm": 102, "flexIndex": 100, "volume": "High" } },

  { "id": "BOOT-011", "type": "Boots", "brand": "Lange", "model": "RX 120", "title": "Lange RX 120", "price": 649, "currency": "USD", "thumbnail": "https://example.com/images/boots/lange-rx-120.jpg", "description": "Precision-focused resort boot popular for strong heel hold and power transfer.", "category": "Ski Equipment", "stock": 7, "inStock": true, "rating": 4.5, "reviews": 860, "selectors": { "ability": ["Advanced", "Expert"], "terrain": ["Groomers", "All-Resort"], "skiStyle": ["Carving", "All-Mountain"], "bootType": "Alpine", "lastMm": 100, "flexIndex": 120, "volume": "Medium" } },
  { "id": "BOOT-012", "type": "Boots", "brand": "Lange", "model": "XT3 Free 120", "title": "Lange XT3 Free 120", "price": 699, "currency": "USD", "thumbnail": "https://example.com/images/boots/lange-xt3-free-120.jpg", "description": "Freeride-oriented boot with walk mode (hybrid) for sidecountry and short tours.", "category": "Ski Equipment", "stock": 6, "inStock": true, "rating": 4.4, "reviews": 510, "selectors": { "ability": ["Advanced", "Expert"], "terrain": ["All-Resort", "Backcountry"], "skiStyle": ["Freeride"], "bootType": "Hybrid (Walk Mode)", "lastMm": 100, "flexIndex": 120, "volume": "Medium" } },

  { "id": "BOOT-013", "type": "Boots", "brand": "Head", "model": "Nexo LYT 110", "title": "Head Nexo LYT 110", "price": 649, "currency": "USD", "thumbnail": "https://example.com/images/boots/head-nexo-lyt-110.jpg", "description": "Lightweight resort boot designed for comfort with supportive flex.", "category": "Ski Equipment", "stock": 9, "inStock": true, "rating": 4.2, "reviews": 420, "selectors": { "ability": ["Intermediate", "Advanced"], "terrain": ["All-Resort"], "skiStyle": ["All-Mountain"], "bootType": "Alpine", "lastMm": 100, "flexIndex": 110, "volume": "Medium" } },
  { "id": "BOOT-014", "type": "Boots", "brand": "Rossignol", "model": "Alltrack 120", "title": "Rossignol Alltrack 120", "price": 699, "currency": "USD", "thumbnail": "https://example.com/images/boots/rossignol-alltrack-120.jpg", "description": "Freeride hybrid boot with walk mode for off-piste and short touring days.", "category": "Ski Equipment", "stock": 6, "inStock": true, "rating": 4.3, "reviews": 480, "selectors": { "ability": ["Advanced", "Expert"], "terrain": ["All-Resort", "Backcountry"], "skiStyle": ["Freeride"], "bootType": "Hybrid (Walk Mode)", "lastMm": 100, "flexIndex": 120, "volume": "Medium" } },

  { "id": "BOOT-015", "type": "Boots", "brand": "K2", "model": "Recon 120", "title": "K2 Recon 120", "price": 749, "currency": "USD", "thumbnail": "https://example.com/images/boots/k2-recon-120.jpg", "description": "Strong all-mountain boot designed for efficient power transfer and comfort.", "category": "Ski Equipment", "stock": 7, "inStock": true, "rating": 4.3, "reviews": 410, "selectors": { "ability": ["Advanced", "Expert"], "terrain": ["All-Resort"], "skiStyle": ["All-Mountain"], "bootType": "Alpine", "lastMm": 100, "flexIndex": 120, "volume": "Medium" } },
  { "id": "BOOT-016", "type": "Boots", "brand": "Dalbello", "model": "Panterra 120", "title": "Dalbello Panterra 120", "price": 649, "currency": "USD", "thumbnail": "https://example.com/images/boots/dalbello-panterra-120.jpg", "description": "Adjustable-fit freeride boot with walk mode; great for varied terrain use.", "category": "Ski Equipment", "stock": 6, "inStock": true, "rating": 4.3, "reviews": 370, "selectors": { "ability": ["Advanced", "Expert"], "terrain": ["All-Resort", "Backcountry"], "skiStyle": ["Freeride"], "bootType": "Hybrid (Walk Mode)", "lastMm": 100, "flexIndex": 120, "volume": "Medium/High" } },

  { "id": "BOOT-017", "type": "Boots", "brand": "Nordica", "model": "Promachine 120", "title": "Nordica Promachine 120", "price": 699, "currency": "USD", "thumbnail": "https://example.com/images/boots/nordica-promachine-120.jpg", "description": "Low-volume performance boot for precise edging and a close fit.", "category": "Ski Equipment", "stock": 6, "inStock": true, "rating": 4.5, "reviews": 540, "selectors": { "ability": ["Advanced", "Expert"], "terrain": ["Groomers"], "skiStyle": ["Carving"], "bootType": "Alpine", "lastMm": 98, "flexIndex": 120, "volume": "Low" } },
  { "id": "BOOT-018", "type": "Boots", "brand": "Tecnica", "model": "Cochise 120",
    "title": "Tecnica Cochise 120", "price": 749, "currency": "USD",
    "thumbnail": "https://example.com/images/boots/tecnica-cochise-120.jpg",
    "description": "Freeride hybrid boot with walk mode focused on downhill power and off-piste versatility.",
    "category": "Ski Equipment", "stock": 5, "inStock": true, "rating": 4.4, "reviews": 610,
    "selectors": { "ability": ["Advanced", "Expert"], "terrain": ["All-Resort", "Backcountry"], "skiStyle": ["Freeride"], "bootType": "Hybrid (Walk Mode)", "lastMm": 99, "flexIndex": 120, "volume": "Medium" }
  },

  { "id": "BOOT-019", "type": "Boots", "brand": "Salomon", "model": "Shift Pro 120", "title": "Salomon Shift Pro 120", "price": 649, "currency": "USD", "thumbnail": "https://example.com/images/boots/salomon-shift-pro-120.jpg", "description": "Hybrid boot for freeride/touring crossover with strong downhill support.", "category": "Ski Equipment", "stock": 6, "inStock": true, "rating": 4.3, "reviews": 520, "selectors": { "ability": ["Advanced", "Expert"], "terrain": ["All-Resort", "Backcountry"], "skiStyle": ["Freeride", "Touring"], "bootType": "Hybrid (Walk Mode)", "lastMm": 100, "flexIndex": 120, "volume": "Medium" } },
  { "id": "BOOT-020", "type": "Boots", "brand": "K2", "model": "Mindbender 120", "title": "K2 Mindbender 120", "price": 699, "currency": "USD", "thumbnail": "https://example.com/images/boots/k2-mindbender-120.jpg", "description": "Freeride hybrid boot with walk mode aimed at off-piste and touring crossover.", "category": "Ski Equipment", "stock": 5, "inStock": true, "rating": 4.2, "reviews": 390, "selectors": { "ability": ["Advanced", "Expert"], "terrain": ["All-Resort", "Backcountry"], "skiStyle": ["Freeride", "Touring"], "bootType": "Hybrid (Walk Mode)", "lastMm": 100, "flexIndex": 120, "volume": "Medium" } },

  { "id": "BOOT-021", "type": "Boots", "brand": "Scarpa", "model": "Maestrale", "title": "Scarpa Maestrale", "price": 799, "currency": "USD", "thumbnail": "https://example.com/images/boots/scarpa-maestrale.jpg", "description": "Touring boot designed for uphill efficiency and reliable downhill performance.",
    "category": "Ski Equipment", "stock": 6, "inStock": true, "rating": 4.4, "reviews": 720,
    "selectors": { "ability": ["Intermediate", "Advanced", "Expert"], "terrain": ["Backcountry"], "skiStyle": ["Touring"], "bootType": "Touring", "lastMm": 101, "flexIndex": 110, "volume": "Medium" }
  },
  { "id": "BOOT-022", "type": "Boots", "brand": "Tecnica", "model": "Zero G Tour Pro", "title": "Tecnica Zero G Tour Pro", "price": 749, "currency": "USD", "thumbnail": "https://example.com/images/boots/tecnica-zero-g-tour-pro.jpg", "description": "Light touring boot aimed at strong uphill performance while staying supportive downhill.",
    "category": "Ski Equipment", "stock": 4, "inStock": true, "rating": 4.5, "reviews": 540,
    "selectors": { "ability": ["Advanced", "Expert"], "terrain": ["Backcountry"], "skiStyle": ["Touring"], "bootType": "Touring", "lastMm": 99, "flexIndex": 130, "volume": "Low/Medium" }
  },
  { "id": "BOOT-023", "type": "Boots", "brand": "Dynafit", "model": "Hoji Free 110", "title": "Dynafit Hoji Free 110", "price": 799, "currency": "USD", "thumbnail": "https://example.com/images/boots/dynafit-hoji-free-110.jpg", "description": "Freeride touring boot aimed at downhill confidence with efficient transitions.",
    "category": "Ski Equipment", "stock": 4, "inStock": true, "rating": 4.3, "reviews": 430,
    "selectors": { "ability": ["Advanced", "Expert"], "terrain": ["Backcountry", "All-Resort"], "skiStyle": ["Touring", "Freeride"], "bootType": "Touring", "lastMm": 102, "flexIndex": 110, "volume": "Medium/High" }
  },
  { "id": "BOOT-024", "type": "Boots", "brand": "Atomic", "model": "Hawx Ultra XTD 120", "title": "Atomic Hawx Ultra XTD 120", "price": 749, "currency": "USD", "thumbnail": "https://example.com/images/boots/atomic-hawx-ultra-xtd-120.jpg", "description": "Crossover boot for touring and freeride with a snug, precise fit.",
    "category": "Ski Equipment", "stock": 5, "inStock": true, "rating": 4.4, "reviews": 610,
    "selectors": { "ability": ["Advanced", "Expert"], "terrain": ["Backcountry", "All-Resort"], "skiStyle": ["Touring", "Freeride"], "bootType": "Hybrid (Walk Mode)", "lastMm": 98, "flexIndex": 120, "volume": "Low" }
  },

  { "id": "BOOT-025", "type": "Boots", "brand": "Lange", "model": "Shadow 120 MV", "title": "Lange Shadow 120 MV", "price": 849, "currency": "USD", "thumbnail": "https://example.com/images/boots/lange-shadow-120.jpg", "description": "Modern performance boot aimed at powerful skiing and strong energy transfer.",
    "category": "Ski Equipment", "stock": 4, "inStock": true, "rating": 4.4, "reviews": 260,
    "selectors": { "ability": ["Advanced", "Expert"], "terrain": ["Groomers", "All-Resort"], "skiStyle": ["Carving", "All-Mountain"], "bootType": "Alpine", "lastMm": 100, "flexIndex": 120, "volume": "Medium" }
  },
  { "id": "BOOT-026", "type": "Boots", "brand": "Salomon", "model": "S/Max 120", "title": "Salomon S/Max 120", "price": 799, "currency": "USD", "thumbnail": "https://example.com/images/boots/salomon-smax-120.jpg", "description": "Frontside-focused boot for precise carving and strong edge engagement.",
    "category": "Ski Equipment", "stock": 4, "inStock": true, "rating": 4.3, "reviews": 320,
    "selectors": { "ability": ["Advanced", "Expert"], "terrain": ["Groomers"], "skiStyle": ["Carving"], "bootType": "Alpine", "lastMm": 98, "flexIndex": 120, "volume": "Low/Medium" }
  },
  { "id": "BOOT-027", "type": "Boots", "brand": "Head", "model": "Raptor WCR 120", "title": "Head Raptor WCR 120", "price": 899, "currency": "USD", "thumbnail": "https://example.com/images/boots/head-raptor-wcr-120.jpg", "description": "Race-inspired boot built for maximum precision and aggressive skiing.",
    "category": "Ski Equipment", "stock": 3, "inStock": true, "rating": 4.4, "reviews": 210,
    "selectors": { "ability": ["Expert"], "terrain": ["Groomers"], "skiStyle": ["Carving", "Race"], "bootType": "Alpine", "lastMm": 96, "flexIndex": 120, "volume": "Low" }
  },
  { "id": "BOOT-028", "type": "Boots", "brand": "Dalbello", "model": "Krypton 130", "title": "Dalbello Krypton 130", "price": 849, "currency": "USD", "thumbnail": "https://example.com/images/boots/dalbello-krypton-130.jpg", "description": "Cabrio-style freeride boot with progressive flex and strong support.",
    "category": "Ski Equipment", "stock": 4, "inStock": true, "rating": 4.3, "reviews": 280,
    "selectors": { "ability": ["Advanced", "Expert"], "terrain": ["All-Resort", "Chop/Crud"], "skiStyle": ["Freeride"], "bootType": "Alpine", "lastMm": 98, "flexIndex": 130, "volume": "Low/Medium" }
  },
  { "id": "BOOT-029", "type": "Boots", "brand": "Nordica", "model": "Speedmachine 3 130", "title": "Nordica Speedmachine 3 130", "price": 899, "currency": "USD", "thumbnail": "https://example.com/images/boots/nordica-speedmachine-3-130.jpg", "description": "High-performance all-mountain boot for strong skiers seeking maximum support.",
    "category": "Ski Equipment", "stock": 3, "inStock": true, "rating": 4.5, "reviews": 520,
    "selectors": { "ability": ["Expert"], "terrain": ["All-Resort"], "skiStyle": ["All-Mountain"], "bootType": "Alpine", "lastMm": 100, "flexIndex": 130, "volume": "Medium" }
  },
  { "id": "BOOT-030", "type": "Boots", "brand": "Rossignol", "model": "Alltrack Pro 130", "title": "Rossignol Alltrack Pro 130", "price": 799, "currency": "USD", "thumbnail": "https://example.com/images/boots/rossignol-alltrack-pro-130.jpg", "description": "Stiff freeride hybrid boot with walk mode for strong skiers and off-piste focus.",
    "category": "Ski Equipment", "stock": 3, "inStock": true, "rating": 4.3, "reviews": 260,
    "selectors": { "ability": ["Advanced", "Expert"], "terrain": ["All-Resort", "Backcountry"], "skiStyle": ["Freeride"], "bootType": "Hybrid (Walk Mode)", "lastMm": 100, "flexIndex": 130, "volume": "Medium" }
  },

  {
    "id": "POLE-001",
    "type": "Poles",
    "brand": "Leki",
    "model": "Detect S",
    "title": "Leki Detect S",
    "price": 119,
    "currency": "USD",
    "thumbnail": "https://example.com/images/poles/leki-detect-s.jpg",
    "description": "All-mountain aluminum pole with ergonomic grip and strap system.",
    "category": "Ski Equipment",
    "stock": 20,
    "inStock": true,
    "rating": 4.5,
    "reviews": 410,
    "selectors": {
      "ability": ["Beginner", "Intermediate", "Advanced", "Expert"],
      "terrain": ["Groomers", "All-Resort"],
      "skiStyle": ["All-Mountain"],
      "poleType": "Alpine",
      "material": "Aluminum",
      "lengthRule": "height_cm * 0.70"
    }
  },
  { "id": "POLE-002", "type": "Poles", "brand": "Leki", "model": "Spitfire 3D", "title": "Leki Spitfire 3D", "price": 99, "currency": "USD", "thumbnail": "https://example.com/images/poles/leki-spitfire-3d.jpg", "description": "Alpine pole with comfortable grip and strong durability.", "category": "Ski Equipment", "stock": 18, "inStock": true, "rating": 4.4, "reviews": 290, "selectors": { "ability": ["Beginner", "Intermediate", "Advanced"], "terrain": ["Groomers"], "skiStyle": ["Carving", "All-Mountain"], "poleType": "Alpine", "material": "Aluminum", "lengthRule": "height_cm * 0.70" } },
  { "id": "POLE-003", "type": "Poles", "brand": "Black Crows", "model": "Meta", "title": "Black Crows Meta", "price": 79, "currency": "USD", "thumbnail": "https://example.com/images/poles/blackcrows-meta.jpg", "description": "Lightweight freeride/all-mountain pole with clean, simple design.", "category": "Ski Equipment", "stock": 16, "inStock": true, "rating": 4.3, "reviews": 210, "selectors": { "ability": ["Intermediate", "Advanced", "Expert"], "terrain": ["All-Resort"], "skiStyle": ["Freeride", "All-Mountain"], "poleType": "Alpine", "material": "Aluminum", "lengthRule": "height_cm * 0.705" } },
  { "id": "POLE-004", "type": "Poles", "brand": "Black Diamond", "model": "Traverse Ski Poles", "title": "Black Diamond Traverse Ski Poles", "price": 89, "currency": "USD", "thumbnail": "https://example.com/images/poles/blackdiamond-traverse.jpg", "description": "Adjustable touring pole for backcountry travel and changing slope angles.", "category": "Ski Equipment", "stock": 14, "inStock": true, "rating": 4.4, "reviews": 520, "selectors": { "ability": ["Intermediate", "Advanced", "Expert"], "terrain": ["Backcountry"], "skiStyle": ["Touring"], "poleType": "Touring (Adjustable)", "material": "Aluminum", "lengthRule": "touring: slightly longer on flats" } },
  { "id": "POLE-005", "type": "Poles", "brand": "Black Diamond", "model": "Expedition 3", "title": "Black Diamond Expedition 3", "price": 79, "currency": "USD", "thumbnail": "https://example.com/images/poles/blackdiamond-expedition-3.jpg", "description": "Three-piece adjustable touring pole ideal for travel and packability.", "category": "Ski Equipment", "stock": 12, "inStock": true, "rating": 4.3, "reviews": 340, "selectors": { "ability": ["Intermediate", "Advanced", "Expert"], "terrain": ["Backcountry"], "skiStyle": ["Touring"], "poleType": "Touring (Adjustable)", "material": "Aluminum", "lengthRule": "touring: slightly longer on flats" } },
  { "id": "POLE-006", "type": "Poles", "brand": "Scott", "model": "S4", "title": "Scott S4", "price": 109, "currency": "USD", "thumbnail": "https://example.com/images/poles/scott-s4.jpg", "description": "Durable all-mountain pole built for everyday resort performance.", "category": "Ski Equipment", "stock": 15, "inStock": true, "rating": 4.2, "reviews": 220, "selectors": { "ability": ["Beginner", "Intermediate", "Advanced"], "terrain": ["All-Resort"], "skiStyle": ["All-Mountain"], "poleType": "Alpine", "material": "Aluminum", "lengthRule": "height_cm * 0.70" } },
  { "id": "POLE-007", "type": "Poles", "brand": "Komperdell", "model": "Carbon Bamboo", "title": "Komperdell Carbon Bamboo", "price": 149, "currency": "USD", "thumbnail": "https://example.com/images/poles/komperdell-carbon-bamboo.jpg", "description": "Light carbon pole for skiers wanting lower swing weight and premium feel.", "category": "Ski Equipment", "stock": 9, "inStock": true, "rating": 4.4, "reviews": 140, "selectors": { "ability": ["Intermediate", "Advanced", "Expert"], "terrain": ["All-Resort"], "skiStyle": ["All-Mountain", "Carving"], "poleType": "Alpine", "material": "Carbon", "lengthRule": "height_cm * 0.70" } },
  { "id": "POLE-008", "type": "Poles", "brand": "Salomon", "model": "Arctic", "title": "Salomon Arctic", "price": 69, "currency": "USD", "thumbnail": "https://example.com/images/poles/salomon-arctic.jpg", "description": "Reliable, budget-friendly aluminum pole for resort skiing.", "category": "Ski Equipment", "stock": 25, "inStock": true, "rating": 4.1, "reviews": 610, "selectors": { "ability": ["Beginner", "Intermediate"], "terrain": ["Groomers", "All-Resort"], "skiStyle": ["All-Mountain"], "poleType": "Alpine", "material": "Aluminum", "lengthRule": "height_cm * 0.70" } },
  { "id": "POLE-009", "type": "Poles", "brand": "Rossignol", "model": "Tactic", "title": "Rossignol Tactic", "price": 89, "currency": "USD", "thumbnail": "https://example.com/images/poles/rossignol-tactic.jpg", "description": "Sturdy all-mountain pole for daily resort laps.", "category": "Ski Equipment", "stock": 21, "inStock": true, "rating": 4.1, "reviews": 320, "selectors": { "ability": ["Beginner", "Intermediate", "Advanced"], "terrain": ["All-Resort"], "skiStyle": ["All-Mountain"], "poleType": "Alpine", "material": "Aluminum", "lengthRule": "height_cm * 0.70" } },
  { "id": "POLE-010", "type": "Poles", "brand": "Atomic", "model": "AMT", "title": "Atomic AMT", "price": 99, "currency": "USD", "thumbnail": "https://example.com/images/poles/atomic-amt.jpg", "description": "All-mountain aluminum pole with comfortable grip and dependable durability.", "category": "Ski Equipment", "stock": 18, "inStock": true, "rating": 4.2, "reviews": 280, "selectors": { "ability": ["Beginner", "Intermediate", "Advanced"], "terrain": ["All-Resort"], "skiStyle": ["All-Mountain"], "poleType": "Alpine", "material": "Aluminum", "lengthRule": "height_cm * 0.70" } },
  { "id": "POLE-011", "type": "Poles", "brand": "Line", "model": "Paintbrush", "title": "Line Paintbrush", "price": 89, "currency": "USD", "thumbnail": "https://example.com/images/poles/line-paintbrush.jpg", "description": "Freestyle-friendly pole with simple construction for park and all-mountain use.", "category": "Ski Equipment", "stock": 17, "inStock": true, "rating": 4.2, "reviews": 240, "selectors": { "ability": ["Intermediate", "Advanced"], "terrain": ["Park", "All-Resort"], "skiStyle": ["Freestyle"], "poleType": "Alpine", "material": "Aluminum", "lengthRule": "park: consider slightly shorter" } },
  { "id": "POLE-012", "type": "Poles", "brand": "Armada", "model": "Triad", "title": "Armada Triad", "price": 79, "currency": "USD", "thumbnail": "https://example.com/images/poles/armada-triad.jpg", "description": "Freeride/all-mountain aluminum pole with a straightforward grip and basket.", "category": "Ski Equipment", "stock": 19, "inStock": true, "rating": 4.1, "reviews": 210, "selectors": { "ability": ["Intermediate", "Advanced", "Expert"], "terrain": ["All-Resort"], "skiStyle": ["Freeride", "All-Mountain"], "poleType": "Alpine", "material": "Aluminum", "lengthRule": "height_cm * 0.70" } },
  { "id": "POLE-013", "type": "Poles", "brand": "Black Crows", "model": "Duos Freebird", "title": "Black Crows Duos Freebird", "price": 129, "currency": "USD", "thumbnail": "https://example.com/images/poles/blackcrows-duos-freebird.jpg", "description": "Adjustable touring pole aimed at backcountry efficiency with a freeride feel.", "category": "Ski Equipment", "stock": 10, "inStock": true, "rating": 4.3, "reviews": 160, "selectors": { "ability": ["Advanced", "Expert"], "terrain": ["Backcountry"], "skiStyle": ["Touring"], "poleType": "Touring (Adjustable)", "material": "Aluminum", "lengthRule": "touring: slightly longer on flats" } },
  { "id": "POLE-014", "type": "Poles", "brand": "Leki", "model": "Tour Stick Vario Carbon", "title": "Leki Tour Stick Vario Carbon", "price": 169, "currency": "USD", "thumbnail": "https://example.com/images/poles/leki-tour-stick-vario-carbon.jpg", "description": "Premium adjustable touring pole with low swing weight and strong locking system.", "category": "Ski Equipment", "stock": 8, "inStock": true, "rating": 4.5, "reviews": 220, "selectors": { "ability": ["Advanced", "Expert"], "terrain": ["Backcountry"], "skiStyle": ["Touring"], "poleType": "Touring (Adjustable)", "material": "Carbon", "lengthRule": "touring: slightly longer on flats" } },
  { "id": "POLE-015", "type": "Poles", "brand": "Komperdell", "model": "Big Art Carbon Vario", "title": "Komperdell Big Art Carbon Vario", "price": 109, "currency": "USD", "thumbnail": "https://example.com/images/poles/komperdell-big-art-carbon-vario.jpg", "description": "Adjustable carbon pole suited for touring and freeride crossover use.", "category": "Ski Equipment", "stock": 9, "inStock": true, "rating": 4.2, "reviews": 120, "selectors": { "ability": ["Intermediate", "Advanced", "Expert"], "terrain": ["Backcountry", "All-Resort"], "skiStyle": ["Touring", "Freeride"], "poleType": "Touring (Adjustable)", "material": "Carbon", "lengthRule": "touring: slightly longer on flats" } },
  { "id": "POLE-016", "type": "Poles", "brand": "Black Diamond", "model": "Whippet (Self-Arrest Grip)", "title": "Black Diamond Whippet",
    "price": 149, "currency": "USD", "thumbnail": "https://example.com/images/poles/blackdiamond-whippet.jpg",
    "description": "Backcountry pole with an integrated pick-style grip for steep skin tracks and icy traverses.",
    "category": "Ski Equipment", "stock": 6, "inStock": true, "rating": 4.4, "reviews": 260,
    "selectors": { "ability": ["Advanced", "Expert"], "terrain": ["Backcountry"], "skiStyle": ["Touring", "Mountaineering"], "poleType": "Touring (Specialty)", "material": "Aluminum", "lengthRule": "touring: slightly longer on flats" }
  },
  { "id": "POLE-017", "type": "Poles", "brand": "Dynafit", "model": "DNA Pole", "title": "Dynafit DNA Pole", "price": 119, "currency": "USD", "thumbnail": "https://example.com/images/poles/dynafit-dna-pole.jpg", "description": "Lightweight pole aimed at fast touring and efficiency.", "category": "Ski Equipment", "stock": 7, "inStock": true, "rating": 4.2, "reviews": 110, "selectors": { "ability": ["Advanced", "Expert"], "terrain": ["Backcountry"], "skiStyle": ["Touring"], "poleType": "Touring", "material": "Carbon", "lengthRule": "touring: slightly longer on flats" } },
  { "id": "POLE-018", "type": "Poles", "brand": "Scott", "model": "Scrapper", "title": "Scott Scrapper", "price": 79, "currency": "USD", "thumbnail": "https://example.com/images/poles/scott-scrapper.jpg", "description": "Freeride pole built for durability with a powder-friendly basket option.", "category": "Ski Equipment", "stock": 12, "inStock": true, "rating": 4.1, "reviews": 140, "selectors": { "ability": ["Intermediate", "Advanced", "Expert"], "terrain": ["Powder", "Trees"], "skiStyle": ["Freeride", "Powder"], "poleType": "Freeride", "material": "Aluminum", "lengthRule": "height_cm * 0.70" } },
  { "id": "POLE-019", "type": "Poles", "brand": "G3", "model": "VIA Carbon", "title": "G3 VIA Carbon", "price": 109, "currency": "USD", "thumbnail": "https://example.com/images/poles/g3-via-carbon.jpg", "description": "Adjustable touring pole designed for backcountry travel and low weight.", "category": "Ski Equipment", "stock": 9, "inStock": true, "rating": 4.2, "reviews": 150, "selectors": { "ability": ["Advanced", "Expert"], "terrain": ["Backcountry"], "skiStyle": ["Touring"], "poleType": "Touring (Adjustable)", "material": "Carbon", "lengthRule": "touring: slightly longer on flats" } },
  { "id": "POLE-020", "type": "Poles", "brand": "Salomon", "model": "Polar Pro S3", "title": "Salomon Polar Pro S3", "price": 89, "currency": "USD", "thumbnail": "https://example.com/images/poles/salomon-polar-pro-s3.jpg", "description": "All-mountain pole with a comfortable grip and durable shaft for resort use.", "category": "Ski Equipment", "stock": 16, "inStock": true, "rating": 4.1, "reviews": 190, "selectors": { "ability": ["Beginner", "Intermediate", "Advanced"], "terrain": ["All-Resort"], "skiStyle": ["All-Mountain"], "poleType": "Alpine", "material": "Aluminum", "lengthRule": "height_cm * 0.70" } }
];

/**
 * Helper to update inStock based on stock quantity
 */
export const updateInStock = (product) => {
  product.inStock = product.stock > 0;
  return product;
};

/**
 * Get a product by ID
 */
export const getProductById = (id) => {
  return products.find(p => p.id === id);
};

/**
 * Check if product has sufficient stock
 */
export const hasStock = (productId, quantity = 1) => {
  const product = getProductById(productId);
  return product && product.stock >= quantity;
};

// Sales history tracking
const salesHistory = [];

/**
 * Reserve stock (reduce available quantity)
 * Called when an order is completed
 */
export const reserveStock = (productId, quantity = 1) => {
  const product = getProductById(productId);
  if (product && product.stock >= quantity) {
    product.stock -= quantity;
    updateInStock(product);
    
    // Record the sale
    salesHistory.push({
      id: `sale_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      productId: product.id,
      productTitle: product.title,
      quantity,
      pricePerUnit: product.price,
      totalAmount: product.price * quantity,
      timestamp: new Date().toISOString(),
    });
    
    return true;
  }
  return false;
};

/**
 * Get sales history
 */
export const getSalesHistory = () => {
  return [...salesHistory].reverse(); // Most recent first
};

/**
 * Get sales summary by product
 */
export const getSalesSummary = () => {
  const summary = {};
  
  for (const sale of salesHistory) {
    if (!summary[sale.productId]) {
      summary[sale.productId] = {
        productId: sale.productId,
        productTitle: sale.productTitle,
        totalQuantitySold: 0,
        totalRevenue: 0,
        salesCount: 0,
      };
    }
    summary[sale.productId].totalQuantitySold += sale.quantity;
    summary[sale.productId].totalRevenue += sale.totalAmount;
    summary[sale.productId].salesCount += 1;
  }
  
  return Object.values(summary).sort((a, b) => b.totalRevenue - a.totalRevenue);
};

/**
 * Clear sales history (for reset)
 */
export const clearSalesHistory = () => {
  salesHistory.length = 0;
};

/**
 * Get products formatted for checkout (with prices in cents)
 */
export const getProductsForCheckout = () => {
  return products.map(p => ({
    id: p.id,
    title: p.title,
    price: p.price * 100, // Convert to cents for checkout
    currency: "usd",
    inStock: p.inStock,
    stock: p.stock,
  }));
};

export default {
  products,
  originalPrices,
  updateInStock,
  getProductById,
  hasStock,
  reserveStock,
  getProductsForCheckout,
  getSalesHistory,
  getSalesSummary,
  clearSalesHistory,
};

