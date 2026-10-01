import { z } from 'zod';
import {
  SiteSchema,
  CompanySchema,
  ContactSchema,
  NavigationSchema,
  TeamSchema,
  ProductsSchema,
  ProjectsSchema,
  PartnersSchema,
  IndustriesSchema,
  TestimonialsSchema,
  HomeSchema,
  type Site,
  type Company,
  type Contact,
  type Navigation,
  type TeamMember,
  type Item,
  type Subcategory,
  type Category,
  type Products,
  type Project,
  type Partner,
  type Industry,
  type Testimonial,
  type Home,
} from './schemas';

import siteJson from '../data/site.json';
import companyJson from '../data/company.json';
import contactJson from '../data/contact.json';
import navigationJson from '../data/navigation.json';
import teamJson from '../data/team.json';
import productsJson from '../data/products.json';
import projectsJson from '../data/projects.json';
import partnersJson from '../data/partners.json';
import industriesJson from '../data/industries.json';
import testimonialsJson from '../data/testimonials.json';
import homeJson from '../data/home.json';

/** Parse a JSON file against a Zod schema with a readable build-time error. */
function parse<T extends z.ZodTypeAny>(schema: T, value: unknown, file: string): z.infer<T> {
  const result = schema.safeParse(value);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  • ${i.path.length ? i.path.join('.') : '(root)'}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid data in src/data/${file}:\n${issues}`);
  }
  return result.data;
}

/* ── Parsed site data (validated once at build/startup) ────────────── */
export const site: Site = parse(SiteSchema, siteJson, 'site.json');
export const company: Company = parse(CompanySchema, companyJson, 'company.json');
export const contact: Contact = parse(ContactSchema, contactJson, 'contact.json');
export const navigation: Navigation = parse(NavigationSchema, navigationJson, 'navigation.json');
export const team: TeamMember[] = parse(TeamSchema, teamJson, 'team.json');
export const products: Products = parse(ProductsSchema, productsJson, 'products.json');
export const projects: Project[] = parse(ProjectsSchema, projectsJson, 'projects.json');
export const partners: Partner[] = parse(PartnersSchema, partnersJson, 'partners.json');
export const industries: Industry[] = parse(IndustriesSchema, industriesJson, 'industries.json');
export const testimonials: Testimonial[] = parse(TestimonialsSchema, testimonialsJson, 'testimonials.json');
export const home: Home = parse(HomeSchema, homeJson, 'home.json');

/* Simple accessors */
export const getSite = () => site;
export const getCompany = () => company;
export const getContact = () => contact;
export const getNavigation = () => navigation;
export const getHome = () => home;
export const getIndustries = () => industries;
export const getTestimonials = () => testimonials;

/* ── Products ──────────────────────────────────────────────────────── */
export interface ProductRef {
  item: Item;
  subcategory: Subcategory;
  category: Category;
}

export const getCategories = (): Category[] =>
  [...products.categories].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));

export const getCategory = (slug: string): Category | undefined =>
  getCategories().find((c) => c.slug === slug);

export function getSubcategory(
  categorySlug: string,
  subcategorySlug: string
): { category: Category; subcategory: Subcategory } | undefined {
  const category = getCategory(categorySlug);
  const subcategory = category?.subcategories.find((s) => s.slug === subcategorySlug);
  return category && subcategory ? { category, subcategory } : undefined;
}

export function getItem(
  categorySlug: string,
  subcategorySlug: string,
  itemSlug: string
): ProductRef | undefined {
  const parent = getSubcategory(categorySlug, subcategorySlug);
  const item = parent?.subcategory.items.find((i) => i.slug === itemSlug);
  return parent && item ? { ...parent, item } : undefined;
}

export const countItems = (category: Category): number =>
  category.subcategories.reduce((n, s) => n + s.items.length, 0);

export const totalItemCount = (): number => getCategories().reduce((n, c) => n + countItems(c), 0);

export const getFeaturedProducts = (): ProductRef[] => {
  const refs: ProductRef[] = [];
  for (const category of getCategories()) {
    for (const subcategory of category.subcategories) {
      for (const item of subcategory.items) {
        if (item.featured) refs.push({ item, subcategory, category });
      }
    }
  }
  return refs;
};

export const productUrl = (category: string, subcategory: string, item: string): string =>
  `/products/${category}/${subcategory}/${item}`;

/* ── Projects ──────────────────────────────────────────────────────── */
export const getProjects = (): Project[] => [...projects].sort((a, b) => b.year - a.year);
export const getProject = (slug: string): Project | undefined => projects.find((p) => p.slug === slug);
export const getFeaturedProjects = (n = 3): Project[] => {
  const featured = getProjects().filter((p) => p.featured);
  return (featured.length ? featured : getProjects()).slice(0, n);
};

/* ── Partners ──────────────────────────────────────────────────────── */
export const getPartners = (): Partner[] => partners;

export function getPartnersByType(): Record<Partner['type'], Partner[]> {
  const grouped: Record<Partner['type'], Partner[]> = { client: [], supplier: [], brand: [], partner: [] };
  for (const p of partners) grouped[p.type].push(p);
  return grouped;
}

export const getFeaturedPartners = (): Partner[] => {
  const featured = partners.filter((p) => p.featured);
  return featured.length ? featured : partners;
};

/* ── Team ──────────────────────────────────────────────────────────── */
export const getFounder = (): TeamMember | undefined => team.find((m) => m.isFounder);
export const getTeamMembers = (): TeamMember[] =>
  team.filter((m) => !m.isFounder).sort((a, b) => a.order - b.order);

/* ── Search index (consumed by /search-index.json + SearchModal) ───── */
export interface SearchEntry {
  type: 'category' | 'subcategory' | 'product' | 'project';
  name: string;
  url: string;
  crumb: string;
}

export function buildSearchIndex(): SearchEntry[] {
  const entries: SearchEntry[] = [];
  for (const category of getCategories()) {
    entries.push({ type: 'category', name: category.name, url: `/products/${category.slug}`, crumb: 'Products' });
    for (const subcategory of category.subcategories) {
      entries.push({
        type: 'subcategory',
        name: subcategory.name,
        url: `/products/${category.slug}/${subcategory.slug}`,
        crumb: category.name,
      });
      for (const item of subcategory.items) {
        entries.push({
          type: 'product',
          name: item.name,
          url: productUrl(category.slug, subcategory.slug, item.slug),
          crumb: `${category.name} › ${subcategory.name}`,
        });
      }
    }
  }
  for (const project of getProjects()) {
    entries.push({ type: 'project', name: project.title, url: `/projects/${project.slug}`, crumb: project.industry });
  }
  return entries;
}
