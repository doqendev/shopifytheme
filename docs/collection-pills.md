## Collection Unified Filter Bar

### Overview
A unified filter bar that appears below the collection heading, combining:
- **Product type pills** (always visible, toggleable)
- **Active filter chips** from all other filters (color, size, price, etc.)
- **Clear all button** when any filters are active

This creates a cohesive filtering experience where users can see and manage all filters in one place, eliminating the messy fragmentation between pills and native Search & Discovery filter displays.

### Key Features

**Product Type Pills:**
- Always visible (from metafield or fallback to filter values)
- Toggleable on/off behavior
- Distinctive styling (solid fill when active)

**Active Filter Chips:**
- Automatically appear when other filters are selected
- Removable via X icon
- Visually distinct from product type pills (lighter styling)
- Support all filter types: color, size, price ranges, etc.

**Unified Experience:**
- Single location for all active filters
- Native duplicate filter displays are hidden
- Clean, organized visual hierarchy
- Responsive design for all screen sizes

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
[Product Type Pill] [Product Type Pill] [Product Type Pill] | [Color: Red ×] [Size: M ×] [Clear all]
```

**Interaction Flow:**
1. User sees product type pills immediately upon landing on collection page
2. User clicks a product type pill → it toggles on/off, filters products
3. User opens filter drawer and selects a color → color chip appears next to pills
4. User can remove individual filters by clicking X on chips or pill
5. User can clear all filters at once with "Clear all" button

**Filter Integration:**
- Product type pills remain persistent (always visible)
- Other active filters dynamically appear as removable chips
- All filters work together seamlessly with Search & Discovery
- Native duplicate filter displays are hidden automatically

### Implementation Details

**Files modified:**
- `snippets/collection-pills.liquid` — Unified filter bar component with pills + chips rendering
- `sections/main-collection-product-grid.liquid:426` — Includes the filter bar below collection header

**Technical approach:**
- Product type pills rendered from metafield or filter values (always visible)
- Iterates through `collection.filters` to find active filters (excluding product_type)
- Renders active filter chips with remove URLs from Shopify's filter API
- Hides native `.active-facets` displays to prevent duplication
- Uses theme color variables for consistent theming
- Fully responsive with mobile-optimized spacing

**Styling:**
- Product type pills: Solid border, fills on active state
- Active filter chips: Light background, subtle border, with X icon
- Visual divider separates pills from chips
- Clear all button: Underlined text link
- Smooth transitions and hover states throughout
