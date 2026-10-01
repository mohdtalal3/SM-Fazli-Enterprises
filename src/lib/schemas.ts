import { z } from 'zod';

/* ── site.json ─────────────────────────────────────────────────────── */
export const SiteSchema = z.object({
  siteName: z.string(),
  siteUrl: z.string().url(),
  defaultTitle: z.string(),
  defaultDescription: z.string(),
  ogImage: z.string().default(''),
  language: z.string().default('en'),
  theme: z
    .object({
      defaultMode: z.enum(['light', 'dark']).default('light'),
      allowToggle: z.boolean().default(true),
    })
    .default({ defaultMode: 'light', allowToggle: true }),
  inquiry: z
    .object({
      method: z.array(z.enum(['whatsapp', 'email', 'endpoint'])).default([]),
      whatsappNumber: z.string().default(''),
      email: z.string().default(''),
      formEndpoint: z.string().default(''),
    })
    .default({ method: [], whatsappNumber: '', email: '', formEndpoint: '' }),
  features: z
    .object({
      search: z.boolean().default(true),
      inquiryList: z.boolean().default(true),
      floatingWhatsapp: z.boolean().default(true),
      testimonials: z.boolean().default(true),
    })
    .default({ search: true, inquiryList: true, floatingWhatsapp: true, testimonials: true }),
  credit: z.object({ text: z.string().default(''), url: z.string().default('') }).default({ text: '', url: '' }),
});

/* ── company.json ──────────────────────────────────────────────────── */
const IconTextSchema = z.object({
  title: z.string(),
  description: z.string().default(''),
  icon: z.string().default(''),
});

export const CompanySchema = z.object({
  name: z.string(),
  shortName: z.string().default(''),
  tagline: z.string().default(''),
  logo: z
    .object({ light: z.string().default(''), dark: z.string().default(''), icon: z.string().default('') })
    .default({ light: '', dark: '', icon: '' }),
  foundedYear: z.number().optional(),
  about: z.string().default(''),
  story: z.array(z.string()).default([]),
  mission: z.string().default(''),
  vision: z.string().default(''),
  stats: z
    .array(z.object({ label: z.string(), value: z.number(), suffix: z.string().default('') }))
    .default([]),
  values: z.array(IconTextSchema).default([]),
  whyChooseUs: z.array(IconTextSchema).default([]),
  milestones: z
    .array(z.object({ year: z.number(), title: z.string(), description: z.string().default('') }))
    .default([]),
  certifications: z.array(z.object({ name: z.string(), image: z.string().default('') })).default([]),
});

/* ── contact.json ──────────────────────────────────────────────────── */
export const ContactSchema = z.object({
  primary: z.object({
    phone: z.string().default(''),
    whatsapp: z.string().default(''),
    email: z.string().default(''),
    address: z.string().default(''),
    hours: z.string().default(''),
    mapEmbedUrl: z.string().default(''),
    mapLink: z.string().default(''),
  }),
  departments: z
    .array(
      z.object({
        name: z.string(),
        person: z.string().default(''),
        phone: z.string().default(''),
        email: z.string().default(''),
      })
    )
    .default([]),
  socials: z.array(z.object({ platform: z.string(), url: z.string() })).default([]),
});

/* ── navigation.json ───────────────────────────────────────────────── */
export const NavigationSchema = z.object({
  header: z
    .array(
      z.object({
        label: z.string(),
        href: z.string(),
        megaMenu: z.string().optional(),
      })
    )
    .default([]),
  cta: z.object({ label: z.string(), href: z.string() }).default({ label: 'Request a Quote', href: '/quote' }),
  footerColumns: z
    .array(
      z.object({
        title: z.string(),
        links: z.array(z.object({ label: z.string(), href: z.string() })).default([]),
      })
    )
    .default([]),
  legalLinks: z.array(z.object({ label: z.string(), href: z.string() })).default([]),
});

/* ── team.json ─────────────────────────────────────────────────────── */
export const TeamMemberSchema = z.object({
  id: z.string(),
  isFounder: z.boolean().default(false),
  name: z.string(),
  role: z.string().default(''),
  photo: z.string().default(''),
  shortBio: z.string().default(''),
  bio: z.array(z.string()).default([]),
  quote: z.string().default(''),
  experienceYears: z.number().optional(),
  expertise: z.array(z.string()).default([]),
  experience: z
    .array(
      z.object({
        period: z.string(),
        title: z.string(),
        organization: z.string().default(''),
        description: z.string().default(''),
      })
    )
    .default([]),
  education: z
    .array(z.object({ degree: z.string(), institution: z.string().default(''), year: z.string().default('') }))
    .default([]),
  socials: z.array(z.object({ platform: z.string(), url: z.string() })).default([]),
  order: z.number().default(99),
});
export const TeamSchema = z.array(TeamMemberSchema);

/* ── products.json ─────────────────────────────────────────────────── */
export const ItemSchema = z.object({
  slug: z.string(),
  name: z.string(),
  shortDescription: z.string().default(''),
  description: z.string().default(''),
  images: z.array(z.string()).default([]),
  specs: z.record(z.string(), z.string()).default({}),
  variants: z.array(z.string()).default([]),
  applications: z.array(z.string()).default([]),
  datasheet: z.string().default(''),
  featured: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
});

export const SubcategorySchema = z.object({
  slug: z.string(),
  name: z.string(),
  description: z.string().default(''),
  image: z.string().default(''),
  menuLabel: z.string().default(''),
  items: z.array(ItemSchema).default([]),
});

export const CategorySchema = z.object({
  slug: z.string(),
  name: z.string(),
  icon: z.string().default(''),
  image: z.string().default(''),
  description: z.string().default(''),
  menuLabel: z.string().default(''),
  order: z.number().default(0),
  subcategories: z.array(SubcategorySchema).default([]),
});

export const ProductsSchema = z.object({
  categories: z.array(CategorySchema).default([]),
});

/* ── projects.json ─────────────────────────────────────────────────── */
export const ProjectSchema = z.object({
  slug: z.string(),
  title: z.string(),
  client: z.string().default(''),
  industry: z.string().default(''),
  year: z.number().default(0),
  location: z.string().default(''),
  featured: z.boolean().default(false),
  cover: z.string().default(''),
  summary: z.string().default(''),
  challenge: z.string().default(''),
  solution: z.string().default(''),
  results: z.array(z.string()).default([]),
  productsSupplied: z.array(z.string()).default([]),
  gallery: z.array(z.object({ src: z.string(), alt: z.string().default('') })).default([]),
  tags: z.array(z.string()).default([]),
  testimonial: z.object({ quote: z.string(), author: z.string() }).optional(),
  link: z.string().default(''),
});
export const ProjectsSchema = z.array(ProjectSchema);

/* ── partners.json ─────────────────────────────────────────────────── */
export const PartnerSchema = z.object({
  name: z.string(),
  type: z.enum(['client', 'supplier', 'brand', 'partner']).default('partner'),
  logo: z.string().default(''),
  website: z.string().default(''),
  description: z.string().default(''),
  featured: z.boolean().default(false),
});
export const PartnersSchema = z.array(PartnerSchema);

/* ── industries.json / testimonials.json ───────────────────────────── */
export const IndustriesSchema = z.array(
  z.object({ name: z.string(), icon: z.string().default(''), description: z.string().default('') })
);

export const TestimonialSchema = z.object({
  quote: z.string(),
  author: z.string().default(''),
  role: z.string().default(''),
  company: z.string().default(''),
  photo: z.string().default(''),
});
export const TestimonialsSchema = z.array(TestimonialSchema);

/* ── home.json ─────────────────────────────────────────────────────── */
export const HomeSchema = z.object({
  sections: z.array(z.object({ id: z.string(), enabled: z.boolean().default(true) })).default([]),
  hero: z
    .object({
      eyebrow: z.string().default(''),
      headline: z.string().default(''),
      subheadline: z.string().default(''),
      primaryCta: z.object({ label: z.string(), href: z.string() }).default({ label: 'Request a Quote', href: '/quote' }),
      secondaryCta: z.object({ label: z.string(), href: z.string() }).default({ label: 'Browse Products', href: '/products' }),
      searchPlaceholder: z.string().default(''),
      quickSearches: z.array(z.string()).default([]),
      backgroundImage: z.string().default(''),
    })
    .default({
      eyebrow: '',
      headline: '',
      subheadline: '',
      primaryCta: { label: 'Request a Quote', href: '/quote' },
      secondaryCta: { label: 'Browse Products', href: '/products' },
      searchPlaceholder: '',
      quickSearches: [],
      backgroundImage: '',
    }),
});

/* ── Inferred types ────────────────────────────────────────────────── */
export type Site = z.infer<typeof SiteSchema>;
export type Company = z.infer<typeof CompanySchema>;
export type Contact = z.infer<typeof ContactSchema>;
export type Navigation = z.infer<typeof NavigationSchema>;
export type TeamMember = z.infer<typeof TeamMemberSchema>;
export type Item = z.infer<typeof ItemSchema>;
export type Subcategory = z.infer<typeof SubcategorySchema>;
export type Category = z.infer<typeof CategorySchema>;
export type Products = z.infer<typeof ProductsSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type Partner = z.infer<typeof PartnerSchema>;
export type Industry = z.infer<typeof IndustriesSchema>[number];
export type Testimonial = z.infer<typeof TestimonialSchema>;
export type Home = z.infer<typeof HomeSchema>;
