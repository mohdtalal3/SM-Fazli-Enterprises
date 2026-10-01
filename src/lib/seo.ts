import { site, company, contact } from './data';
import type { Item, Category, Subcategory } from './schemas';

const absolute = (path: string): string => {
  try {
    return new URL(path, site.siteUrl).href;
  } catch {
    return path;
  }
};

const stripHtml = (text: string): string => text.replace(/\s+/g, ' ').trim();

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: company.name,
    url: absolute('/'),
    logo: absolute(company.logo.icon || '/favicon.svg'),
    description: stripHtml(site.defaultDescription),
    foundingDate: company.foundedYear ? String(company.foundedYear) : undefined,
    address: {
      '@type': 'PostalAddress',
      streetAddress: contact.primary.address,
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: contact.primary.phone,
      contactType: 'sales',
      email: contact.primary.email,
    },
    sameAs: contact.socials.map((s) => s.url).filter((u) => u && u !== '#'),
  };
}

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: site.siteName,
    url: absolute('/'),
  };
}

export function breadcrumbJsonLd(items: { name: string; url?: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url ? absolute(item.url) : undefined,
    })),
  };
}

export function productJsonLd(ref: { item: Item; category: Category; subcategory: Subcategory; url: string }) {
  const { item, category, subcategory, url } = ref;
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: item.name,
    description: stripHtml(
      item.shortDescription || item.description || `${item.name} supplied by ${company.name}. Request a quote for grades, sizes and pricing.`
    ),
    category: `${category.name} › ${subcategory.name}`,
    url: absolute(url),
    brand: { '@type': 'Brand', name: company.name },
  };
}
