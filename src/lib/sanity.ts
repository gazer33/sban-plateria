import { createClient } from "@sanity/client";
import imageUrlBuilder from "@sanity/image-url";
import type { SanityImageSource } from "@sanity/image-url/lib/types/types";
import { featuredProducts as fallbackFeaturedProducts, productCatalog as fallbackProductCatalog, productPreview as fallbackProductPreview } from "@/data/site";

export type CatalogProduct = {
  id: string;
  name: string;
  slug: string;
  category: string;
  collection: string;
  finish: string;
  price: string;
  availability: string;
  badge: string;
  description: string;
  featured: boolean;
  image?: SanityImageSource;
};

const projectId = import.meta.env.PUBLIC_SANITY_PROJECT_ID ?? "568be4l1";
const dataset = import.meta.env.PUBLIC_SANITY_DATASET ?? "production";
const apiVersion = import.meta.env.PUBLIC_SANITY_API_VERSION ?? "2025-02-19";

const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true,
  perspective: "published"
});

const imageBuilder = imageUrlBuilder(client);

export const urlForProductImage = (source: SanityImageSource) => imageBuilder.image(source);

const productsQuery = `*[_type == "product"] | order(featured desc, _createdAt desc) {
  "_id": _id,
  name,
  "slug": slug.current,
  category,
  finish,
  price,
  availability,
  badge,
  description,
  featured,
  "collectionTitle": collection->title,
  mainImage
}`;

type SanityProductRecord = {
  _id: string;
  name?: string;
  slug?: string;
  category?: string;
  finish?: string;
  price?: string;
  availability?: string;
  badge?: string;
  description?: string;
  featured?: boolean;
  collectionTitle?: string;
  mainImage?: SanityImageSource;
};

const normalizeProduct = (product: SanityProductRecord): CatalogProduct => ({
  id: product._id,
  name: product.name ?? "Pieza sin nombre",
  slug: product.slug ?? product._id,
  category: product.category ?? "Sin categoria",
  collection: product.collectionTitle ?? "Sin coleccion",
  finish: product.finish ?? "Por definir",
  price: product.price ?? "Precio pendiente",
  availability: product.availability ?? "Disponible",
  badge: product.badge ?? (product.featured ? "Destacado" : "SBAN"),
  description: product.description ?? "Pieza artesanal en plata con una lectura sobria y contemporanea.",
  featured: Boolean(product.featured),
  image: product.mainImage
});

const fallbackCatalogProducts = fallbackProductCatalog.map((product, index) => ({
  id: `fallback-${index}`,
  name: product.name,
  slug: `fallback-${index}`,
  category: product.category,
  collection: product.collection,
  finish: product.finish,
  price: product.price,
  availability: product.availability,
  badge: product.badge,
  description: product.description,
  featured: index < 3
}));

export const fetchCatalogProducts = async (): Promise<CatalogProduct[]> => {
  try {
    const products = await client.fetch<SanityProductRecord[]>(productsQuery);

    if (!products.length) {
      return fallbackCatalogProducts;
    }

    return products.map(normalizeProduct);
  } catch {
    return fallbackCatalogProducts;
  }
};

export const getFeaturedProducts = (products: CatalogProduct[]) => {
  const featured = products.filter((product) => product.featured);
  const source = featured.length >= 3 ? featured : products;

  return source.slice(0, 3).map((product, index) => ({
    title: product.name,
    description: product.description,
    tag: product.badge || fallbackFeaturedProducts[index]?.tag || "Destacado",
    image: product.image
  }));
};

export const getPreviewProducts = (products: CatalogProduct[]) =>
  products.slice(0, 4).map((product, index) => ({
    name: product.name,
    category: product.category,
    price: product.price,
    image: product.image,
    fallbackShape: index
  }));

export const getProductFilterGroups = (products: CatalogProduct[]) => ({
  categories: ["Todos", ...new Set(products.map((product) => product.category))],
  collections: ["Todas", ...new Set(products.map((product) => product.collection))],
  availability: ["Todas", ...new Set(products.map((product) => product.availability))],
  sort: ["Destacados", "Precio menor", "Precio mayor", "Nombre A-Z"]
});

export const getCatalogSummary = (products: CatalogProduct[]) => ({
  totalProducts: products.length,
  totalCategories: new Set(products.map((product) => product.category)).size,
  totalCollections: new Set(products.map((product) => product.collection)).size
});

export const getFallbackPreviewProducts = () => fallbackProductPreview;
