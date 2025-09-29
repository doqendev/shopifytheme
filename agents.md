# Size Selection Drawer Implementation Plan

## Overview
Implement a size selection drawer for the product page that appears when users click "Escolher tamanho" after selecting a color swatch. The drawer should reuse the existing quick add drawer UI.

## Current Workflow
1. User lands on product page
2. Color swatches are displayed (first one selected by default)
3. User selects a color swatch
4. User clicks "Escolher tamanho" button
5. Drawer opens with size options
6. User selects size
7. Product is added to cart

## Technical Requirements

### 1. Color Swatch Integration
- Ensure color selection is properly tracked
- Pass selected color variant to size selection drawer
- Maintain color selection state throughout the process

### 2. Size Selection Drawer
- Reuse existing quick add drawer UI components
- Display available sizes for the selected color variant
- Handle size selection and validation
- Provide clear visual feedback for selection

### 3. Cart Integration
- Add selected variant (color + size) to cart
- Handle inventory checks
- Provide user feedback on successful addition
- Handle error states (out of stock, etc.)

### 4. Responsive Design
- Ensure drawer works properly on mobile devices
- Maintain consistent UI/UX across desktop and mobile
- Test touch interactions and accessibility

## Files to Investigate
- Product page templates
- Quick add drawer implementation
- Color swatch functionality
- Cart integration scripts
- Mobile-specific styles

## Implementation Steps
1. Analyze existing quick add drawer code structure
2. Examine current color swatch implementation
3. Create/modify "Escolher tamanho" button
4. Implement drawer opening logic
5. Build size selection interface
6. Integrate with cart functionality
7. Test responsive behavior
8. Verify accessibility and user experience

## Success Criteria
- Users can select color, then size through intuitive drawer interface
- Drawer UI matches existing quick add drawer
- Functionality works seamlessly on both mobile and desktop
- Product variants are correctly added to cart
- Error handling works properly (out of stock, etc.)