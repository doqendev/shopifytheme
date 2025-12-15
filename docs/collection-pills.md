## Collection Product-Type Pills

### Overview
Custom filter pills that appear below the collection heading, allowing quick filtering by product type. The pills use the theme's color scheme variables for consistent styling across different color schemes.

### Features
- **Custom pill configuration** per collection via metafield
- **Automatic fallback** to available Product type filter values
- **Smart active state** with toggle behavior
- **Clean integration** that hides duplicate native filter chips
- **Responsive design** with mobile-optimized sizing and spacing

### Behavior
- Clicking a pill **toggles** the corresponding Product type filter
- Other active filters and sort options are **preserved**
- The native "Product type" filter chip is **automatically hidden** to prevent duplicate UI
- "Remover tudo" (clear all) button is **conditionally hidden** when Product type is the only active filter

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

### Implementation Details

**Files modified:**
- `snippets/collection-pills.liquid` — Main component with rendering logic, styling, and filter integration
- `sections/main-collection-product-grid.liquid:426` — Includes the pills snippet below the collection header

**Styling approach:**
- Uses theme color scheme variables (`--color-foreground`, `--color-background`)
- Wrapped in `page-width` class for proper alignment with page content
- Mobile-responsive with adjusted spacing and font sizes
- Smooth transitions and hover states for better UX
