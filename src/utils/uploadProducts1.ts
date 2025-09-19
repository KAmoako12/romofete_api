import axios from "axios";

const API_BASE = "https://romofete-api-1.onrender.com";
const AUTH_TOKEN = "Bearer YOUR_JWT_TOKEN_HERE"; // Replace with actual token

const headers = {
  "Content-Type": "application/json",
  "Authorization": AUTH_TOKEN
};

interface Product {
  name: string;
  description: string;
  price: number;
  stock: number;
  images: string[];
  extra_properties: Record<string, any>;
}

interface ProductType {
  name: string;
  allowed_types?: string[] | null;
  products: Product[];
}

const productTypes: ProductType[] = [
  {
    name: "Alcohol",
    products: [
      {
        name: "Veuve Cliquot Brut NV Champagne 750ml",
        description: "",
        price: 1200,
        stock: 10,
        images: [],
        extra_properties: { volume: "750ml", restriction: "18+" }
      },
      {
        name: "Moët & Chandon Impérial Brut NV Champagne 750ml",
        description: "",
        price: 1400,
        stock: 10,
        images: [],
        extra_properties: { volume: "750ml", restriction: "18+" }
      },
      {
        name: "Moët & Chandon Impérial Brut NV Champagne 20cl",
        description: "",
        price: 450,
        stock: 10,
        images: [],
        extra_properties: { volume: "20cl", restriction: "18+" }
      },
      {
        name: "Moët & Chandon Nectar Impérial Rosé Champagne 750ml",
        description: "",
        price: 1350,
        stock: 10,
        images: [],
        extra_properties: { volume: "750ml", restriction: "18+" }
      },
      {
        name: "Whispering Angel Rosé 750ml",
        description: "",
        price: 1350,
        stock: 10,
        images: [],
        extra_properties: { volume: "750ml", restriction: "18+" }
      },
      {
        name: "JP Chenet Ice Edition 750ml",
        description: "",
        price: 300,
        stock: 10,
        images: [],
        extra_properties: { volume: "750ml", restriction: "18+" }
      },
      {
        name: "Bottega Gold Prosecco 750ml",
        description: "",
        price: 700,
        stock: 10,
        images: [],
        extra_properties: { volume: "750ml", restriction: "18+" }
      },
      {
        name: "Bottega Gold Prosecco 20cl",
        description: "",
        price: 450,
        stock: 10,
        images: [],
        extra_properties: { volume: "20cl", restriction: "18+" }
      },
      {
        name: "Hennessy Very Special Cognac 70cl",
        description: "",
        price: 1100,
        stock: 10,
        images: [],
        extra_properties: { volume: "70cl", restriction: "18+" }
      }
    ]
  },
  {
    name: "Gifts",
    // allowed_types: ["mug", "candle", "diffuser", "balloon", "car-accessory", "cocktail"],
    products: [
      {
        name: "Portrait Photo Upload Mug",
        description: "Custom mug with photo or text",
        price: 300,
        stock: 10,
        images: [],
        extra_properties: {}
      },
      {
        name: "Rituals Mehr Gift Set",
        description: "",
        price: 700,
        stock: 10,
        images: [],
        extra_properties: {}
      },
      {
        name: "Rituals Mehr Mini Reed Diffuser 70ml",
        description: "",
        price: 600,
        stock: 10,
        images: [],
        extra_properties: { volume: "70ml" }
      },
      {
        name: "Rituals Mehr Car Air Freshener (2x3g)",
        description: "",
        price: 600,
        stock: 10,
        images: [],
        extra_properties: {}
      },
      {
        name: "Dr Vranjes Rosso Nobile Diffuser 250ml",
        description: "",
        price: 1600,
        stock: 10,
        images: [],
        extra_properties: { volume: "250ml" }
      },
      {
        name: "Dr Vranjes Oud Nobile Diffuser 250ml",
        description: "",
        price: 1600,
        stock: 10,
        images: [],
        extra_properties: { volume: "250ml" }
      },
      {
        name: "Cocktail Buzz Gift Set + Recipes",
        description: "",
        price: 700,
        stock: 10,
        images: [],
        extra_properties: { items: 16 }
      },
      {
        name: "Personalised Bubble Balloon",
        description: "",
        price: 300,
        stock: 10,
        images: [],
        extra_properties: {}
      },
      {
        name: "Foil Number Helium Balloon",
        description: "",
        price: 100,
        stock: 10,
        images: [],
        extra_properties: { duration: "24h" }
      },
      {
        name: "Foil Number Balloons + Balloon Bouquet",
        description: "",
        price: 650,
        stock: 10,
        images: [],
        extra_properties: { duration: "24h" }
      }
    ]
  }
];

async function uploadData(): Promise<void> {
  for (const type of productTypes) {
    try {
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsImVtYWlsIjoiYWRtaW5Acm9tb2ZldGUudGVzdCIsInJvbGUiOiJzdXBlckFkbWluIiwidXNlcl90eXBlIjoiYWRtaW4iLCJpYXQiOjE3NTgyOTg4NTEsImV4cCI6MTc1ODkwMzY1MX0.2kJcMR6ob3rsO23i03Efjic98X8g7IjamcuZqaYQ7EQ`, // Ensure you have your API key in environment variables
      };
      const typeResponse = await axios.post(`${API_BASE}/product-types`, {
        name: type.name,
        allowed_types: type.allowed_types
      }, { headers });

      const productTypeId = typeResponse.data.id;
      console.log(`✔ Created product type: ${type.name} (id: ${productTypeId})`);

      for (const product of type.products) {
        const prodResponse = await axios.post(`${API_BASE}/products`, {
          ...product,
          product_type_id: productTypeId
        }, { headers });

        console.log(`  ↳ Uploaded: ${prodResponse.data.name}`);
      }
    } catch (err: any) {
      console.error(`✖ Error uploading ${type.name}:`, err.response?.data || err.message);
    }
  }
}

uploadData();