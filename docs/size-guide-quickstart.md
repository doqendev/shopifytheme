# Size Guide Metafields - Quick Start

## Setup Steps

### 1. Create Metafield Definitions in Shopify

Go to **Settings** > **Custom data** > **Products** and create these three definitions:

#### Metafield 1: Product Measurements
- **Name**: Size Guide - Product Measurements
- **Namespace and key**: `custom.size_guide_product`
- **Type**: JSON
- **Description**: Product garment measurements for each size

#### Metafield 2: Body Measurements
- **Name**: Size Guide - Body Measurements
- **Namespace and key**: `custom.size_guide_body`
- **Type**: JSON
- **Description**: Body measurements that fit each size

#### Metafield 3: Measuring Instructions
- **Name**: Size Guide - Instructions
- **Namespace and key**: `custom.size_guide_instructions`
- **Type**: JSON
- **Description**: Instructions on how to measure correctly

### 2. Add Data to a Product

Go to any product and add the metafield values:

#### Example: T-Shirt Product

**Size Guide - Product Measurements**:
```json
{
  "sizes": ["S", "M", "L", "XL"],
  "measurements": [
    {
      "label": "Peito",
      "values": ["50 cm", "53 cm", "56 cm", "59 cm"]
    },
    {
      "label": "Comprimento",
      "values": ["70 cm", "72 cm", "74 cm", "76 cm"]
    },
    {
      "label": "Manga",
      "values": ["20 cm", "21 cm", "22 cm", "23 cm"]
    }
  ]
}
```

**Size Guide - Body Measurements**:
```json
{
  "sizes": ["S", "M", "L", "XL"],
  "measurements": [
    {
      "label": "Peito",
      "values": ["82-86 cm", "87-91 cm", "92-96 cm", "97-101 cm"]
    },
    {
      "label": "Cintura",
      "values": ["62-66 cm", "67-71 cm", "72-76 cm", "77-81 cm"]
    },
    {
      "label": "Anca",
      "values": ["88-92 cm", "93-97 cm", "98-102 cm", "103-107 cm"]
    }
  ]
}
```

**Size Guide - Instructions**:
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

### 3. Test

1. Go to the product page on your store
2. Click "Guia de tamanhos"
3. You should see your custom measurements!

## Benefits

- **Unique per product**: Each product can have different sizes and measurements
- **Flexible**: Add/remove sizes and measurement rows as needed
- **Easy updates**: Change measurements without touching code
- **Fallback**: Products without metafields still show default measurements based on tags

## Notes

- If you don't add metafields to a product, it will use the default measurements based on product tags (tops, saia, calcas, etc.)
- All three metafields are optional - you can add just one, two, or all three
- The number of sizes and measurements is flexible - not limited to 5 sizes
- Make sure the number of values in each measurement matches the number of sizes
