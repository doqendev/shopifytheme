# Size Guide Metafields Setup

This document explains how to set up custom size guide data for each product using Shopify metafields.

## Metafield Definitions

You need to create three custom metafields in Shopify Admin:

### 1. Product Measurements (Medidas Artigo)
- **Namespace and key**: `custom.size_guide_product`
- **Type**: JSON
- **Description**: Product garment measurements for each size

**Example value**:
```json
{
  "sizes": ["S", "M", "L", "XL", "XXL"],
  "measurements": [
    {
      "label": "Peito",
      "values": ["50 cm", "53 cm", "56 cm", "59 cm", "62 cm"]
    },
    {
      "label": "Comprimento",
      "values": ["70 cm", "72 cm", "74 cm", "76 cm", "78 cm"]
    },
    {
      "label": "Manga",
      "values": ["20 cm", "21 cm", "22 cm", "23 cm", "24 cm"]
    }
  ]
}
```

### 2. Body Measurements (Medidas Corporais)
- **Namespace and key**: `custom.size_guide_body`
- **Type**: JSON
- **Description**: Body measurements that fit each size

**Example value**:
```json
{
  "sizes": ["S", "M", "L", "XL", "XXL"],
  "measurements": [
    {
      "label": "Peito",
      "values": ["82-86 cm", "87-91 cm", "92-96 cm", "97-101 cm", "102-106 cm"]
    },
    {
      "label": "Cintura",
      "values": ["62-66 cm", "67-71 cm", "72-76 cm", "77-81 cm", "82-86 cm"]
    },
    {
      "label": "Anca",
      "values": ["88-92 cm", "93-97 cm", "98-102 cm", "103-107 cm", "108-112 cm"]
    }
  ]
}
```

### 3. Measuring Instructions (Como medir)
- **Namespace and key**: `custom.size_guide_instructions`
- **Type**: JSON
- **Description**: Instructions on how to measure correctly

**Example value**:
```json
{
  "steps": [
    {
      "title": "Peito",
      "description": "Medir a circunferência do peito na parte mais ampla, abaixo das axilas."
    },
    {
      "title": "Cintura",
      "description": "Medir a circunferência da cintura na parte mais estreita."
    },
    {
      "title": "Anca",
      "description": "Medir a circunferência da anca na parte mais ampla, ao nível das nádegas."
    }
  ]
}
```

## Creating Metafields in Shopify Admin

1. Go to **Settings** > **Custom data** > **Products**
2. Click **Add definition**
3. For each metafield:
   - Enter the name (e.g., "Size Guide - Product Measurements")
   - Set namespace and key (e.g., `custom.size_guide_product`)
   - Select type: **JSON**
   - Add description
   - Click **Save**

## Using Metafields

Once the metafield definitions are created:

1. Go to any **Product** in Shopify Admin
2. Scroll down to **Metafields** section
3. Find the size guide metafields
4. Enter the JSON data for that specific product
5. Click **Save**

## Fallback Behavior

If metafields are not set for a product, the size guide will fall back to:
- Default measurements based on product tags (tops, saia, calcas, etc.)
- Default measuring instructions for that category

## Benefits

- **Flexibility**: Each product can have unique measurements
- **Easy updates**: Change size guide data without touching code
- **Multi-language ready**: Can add translations in the future
- **Bulk editing**: Can use Shopify's bulk editor or API to update multiple products
