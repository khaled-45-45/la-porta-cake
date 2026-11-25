import type {
  Category,
  Design,
  ImageRef,
  Occasion,
  Product,
  StoreSettings,
} from '@la-porta/domain';

// Small, hand-written records for component tests. Real content is tested separately
// through the local repositories (see exposure.test.tsx).

export function image(src: string, status: 'approved' | 'pending' = 'approved'): ImageRef {
  return {
    src,
    width: 960,
    height: 1200,
    alt: { ar: 'صورة', en: 'Photo' },
    sourceAssetId: 'a'.repeat(32),
    review: status === 'approved' ? { status, reasons: [] } : { status, reasons: ['people'] },
  } as ImageRef;
}

export const flavourCakes: Category = {
  id: 'flavour-cakes',
  slug: 'flavour-cakes',
  name: { ar: 'كيك بالنكهات', en: 'Flavour cakes' },
  description: null,
  layout: 'flavour-wall',
  sort: 0,
};

export const sweets: Category = {
  id: 'sweets',
  slug: 'sweets',
  name: { ar: 'حلويات', en: 'Sweets' },
  description: null,
  layout: 'menu-list',
  sort: 1,
};

export function product(overrides: Partial<Product> = {}): Product {
  return {
    id: 'lotus-cake',
    slug: 'lotus-cake',
    categoryId: 'flavour-cakes',
    name: { ar: 'كيكة لوتس', en: 'Lotus cake' },
    description: null,
    availability: 'ready',
    prepLeadHours: null,
    variants: [],
    images: [image('/images/products/lotus-cake.jpg')],
    sort: 0,
    isActive: true,
    ...overrides,
  };
}

export const birthday: Occasion = {
  id: 'birthday',
  slug: 'birthday',
  name: { ar: 'عيد ميلاد', en: 'Birthday' },
  sort: 0,
};

export const graduation: Occasion = {
  id: 'graduation',
  slug: 'graduation',
  name: { ar: 'تخرّج', en: 'Graduation' },
  sort: 1,
};

export function design(overrides: Partial<Design> = {}): Design {
  return {
    id: 'rose-cake',
    slug: 'rose-cake',
    title: { ar: 'كيكة الورد', en: 'Rose cake' },
    decoration: 'sugar',
    occasionIds: ['birthday'],
    isMini: false,
    image: image('/images/designs/rose-cake.jpg'),
    sort: 0,
    isPublished: true,
    ...overrides,
  };
}

export const settings: StoreSettings = {
  name: { ar: 'لابورتا كيك', en: 'La Porta Cake' },
  phone: { e164: '+962788890049', display: '0788890049' },
  whatsapp: { number: '962788890049', url: 'https://wa.me/962788890049' },
  instagram: { handle: 'laportacake', url: 'https://www.instagram.com/laportacake/' },
  facebook: { url: 'https://www.facebook.com/share/19r78WtxnX/' },
  messenger: { url: null },
  address: {
    ar: 'التطوير الحضري، الرصيفة، الزرقاء، الأردن',
    en: 'Al-Tatweer Al-Hadari, Russeifa, Zarqa, Jordan',
  },
  mapsUrl: 'https://maps.app.goo.gl/MRRZ49LmJsrivkUa6',
  hours: [{ days: 'daily', opens: '11:00', closes: '23:00' }],
  delivery: { available: true, areas: null, fees: null },
  defaultLeadHours: 24,
  currency: 'JOD',
  onlinePayment: false,
  images: {
    shopWindow: image('/images/site/shop-window.jpg'),
    shopInterior: image('/images/site/shop-interior.jpg'),
  },
};
