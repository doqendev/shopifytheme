## Collection Product-Type Pills

### Overview
A clean, minimal filtering system with two components:
- **Product type pills** displayed below the collection heading (always visible, toggleable)
- **FILTROS button** shows a count indicator when other filters are active

This approach keeps the interface clean while providing clear feedback about active filters without cluttering the UI with multiple filter chips.

### Key Features

**Product Type Pills:**
- Always visible below collection title (from metafield or fallback to filter values)
- Toggleable on/off behavior
- Clean styling with solid fill when active
- Quick access to common product type filtering

**FILTROS Count Indicator:**
- Shows total active filter count in parentheses: "FILTROS (2)"
- Counts ALL filter types: product type, color, size, price, etc.
- Automatically updates when filters are added/removed (pills or drawer)
- Clean, unobtrusive design

**Benefits:**
- Clean, minimal interface
- No UI clutter from multiple filter chips
- Clear indication of active filters
- Seamless integration with Search & Discovery drawer

### Setup Steps

#### 1. Create the metafield definition
Navigate to: **Admin → Settings → Custom data → Collections → Add definition**

Configure:
- **Name**: Quick filter pills
- **Namespace and key**: `custom.quick_filter_pills`
- **Type**: List of single-line text
- **Description** (optional): Product type labels for quick filters

#### 2. Configure collections
For each collection where you want custom pills:
- Open the collection in admin
- Scroll to **Metafields** section
- Set `quick_filter_pills` values (e.g., `Vestidos`, `Camisolas`, `T-shirts`)
- Each value becomes a separate pill

**Note**: If left empty, pills will automatically populate from the available Product type filter values.

#### 3. Verify filter availability
Ensure the **Product type** filter is enabled in **Search & Discovery** settings so filter URLs resolve correctly.

### How It Works

**Visual Layout:**
```
Collection Title
[Vestidos] [Camisolas] [T-shirts]

Grid Controls: [Layouts] | [FILTROS (2)]
```

**Interaction Flow:**
1. User sees product type pills immediately upon landing on collection page
2. User clicks "Vestidos" pill → products filter, FILTROS shows "(1)"
3. User clicks "Camisolas" pill → FILTROS shows "(2)" (each product type = +1)
4. User clicks FILTROS button → drawer opens with all available filters
5. User selects color "Azul" → drawer closes, FILTROS shows "(3)" (2 types + 1 color)
6. User opens drawer, selects ANOTHER color "Vermelho" → FILTROS stays "(3)" (colors grouped as 1)
7. User selects size "M" → FILTROS shows "(4)" (2 types + 1 color + 1 size)
8. User can click FILTROS again to manage or remove any filters

**Filter Integration:**
- Product type pills remain persistent (always visible)
- Product type filters ALSO counted in FILTROS indicator
- Other filters (color, size, price) managed through FILTROS drawer
- Count indicator shows total of ALL active filters (including product type)
- Count updates automatically for pills or drawer interactions
- ALL native active filter chips are hidden (not shown outside drawer)
- Filters only visible via count indicator or inside drawer
- Clean, minimal UI without any filter chip clutter

### Implementation Details

**Files modified:**
- `snippets/collection-pills.liquid` — Product type pills component
- `sections/main-collection-product-grid.liquid:426` — Includes pills snippet below collection header
- `sections/main-collection-product-grid.liquid:460-483` — FILTROS button with count logic

**Technical approach:**

*Pills Component:*
- Renders product type pills from metafield or filter values
- Pills always visible when configured
- Matches against Shopify filter API for toggle URLs
- Hides native product_type filter chips

*FILTROS Count:*
- Server-side: Liquid logic calculates initial count on page load
- Client-side: JavaScript dynamically updates count without page refresh
- Smart counting rules:
  - **Product type**: Each selection counts separately (Vestidos + Camisolas = 2)
  - **Other filters**: Grouped by type (Blue + Red color = 1, S + M size = 1)
  - **Price range**: Counted as 1 only if minimum > 0 (ignores default ranges)
- Skips empty or default values
- Excludes only sort_by parameter (not a filter)
- Count displayed as "(n)" next to FILTROS text
- Updates automatically when filters are applied via pills or drawer

**JavaScript (Dynamic Updates):**
- `updateFiltrosCount()` function parses URL and counts filters intelligently
- Special handling for product_type: Each value counted separately
  - `filter.p.product_type=Vestidos` → count +1
  - `filter.p.product_type=Camisolas` → count +1
  - Total: 2 filters
- Other filters grouped by type:
  - `filter.v.t.shopify.color-pattern` → all colors = 1 filter
  - `filter.v.option.size` → all sizes = 1 filter
  - `filter.v.price.gte` + `filter.v.price.lte` → 1 filter (only if min > 0)
- Smart price handling: Ignores default price ranges (gte=0) to avoid false positives
- Skips empty values to avoid counting default/unset filters
- MutationObserver watches product grid for AJAX updates
- Event listeners for: form submission, popstate, section load
- Handles all filter application methods (drawer, URL, back button)
- No page refresh needed - updates instantly

**Styling:**
- Product type pills: Clean design with solid fill on active state
- Pills aligned with collection title (25px desktop, 20px mobile)
- Count indicator: Subtle, inline display with reduced opacity
- Responsive spacing and sizing
- Smooth transitions and hover states
- All native active filter displays hidden via CSS (displayed only in drawer)
