/**
 * Typed shapes of a tenant's website document (stored as JSON in
 * SiteConfig.content). Documents are template-aware: `marketing-v1` and
 * `restaurant-v1` share common pieces (branding/hero/about/gallery/contact)
 * and add their own sections.
 *
 * Each template is a fixed layout with editable content + branding. New
 * optional fields can be added over time without breaking existing sites.
 */

export type SiteTemplate = 'marketing-v1' | 'restaurant-v1';

// --- Shared building blocks -------------------------------------------------

export interface SiteBranding {
  siteName: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  /** Google-font-style family name, e.g. "Poppins". */
  fontFamily: string;
}

export interface SiteHero {
  headline: string;
  subheadline: string;
  backgroundImageUrl: string;
  ctaLabel: string;
  ctaUrl: string;
}

export interface SiteAbout {
  heading: string;
  body: string;
  imageUrl: string;
}

export interface SiteEvent {
  title: string;
  /** ISO date-time; used for the "next event" countdown. */
  date: string;
  venue: string;
  description: string;
  ticketUrl: string;
}

export interface SiteContact {
  email: string;
  phone: string;
  address: string;
  instagram: string;
  facebook: string;
  twitter: string;
}

// --- Restaurant-specific blocks ---------------------------------------------

export type MenuCategory = string;

export interface MenuItem {
  name: string;
  description: string;
  price: number;
  category: MenuCategory;
  /** Optional badge, e.g. "signature" or "special". */
  tag: string;
}

export interface OpeningHours {
  days: string;
  time: string;
}

// --- Section toggles (per template) -----------------------------------------

export interface MarketingSectionToggles {
  hero: boolean;
  about: boolean;
  events: boolean;
  gallery: boolean;
  contact: boolean;
}

export interface RestaurantSectionToggles {
  hero: boolean;
  about: boolean;
  menu: boolean;
  hours: boolean;
  amenities: boolean;
  events: boolean;
  gallery: boolean;
  contact: boolean;
}

// --- Template documents (discriminated by `template`) -----------------------

export interface MarketingSiteDocument {
  template: 'marketing-v1';
  branding: SiteBranding;
  hero: SiteHero;
  about: SiteAbout;
  events: SiteEvent[];
  gallery: string[];
  contact: SiteContact;
  sections: MarketingSectionToggles;
}

export interface RestaurantSiteDocument {
  template: 'restaurant-v1';
  branding: SiteBranding;
  hero: SiteHero;
  about: SiteAbout;
  /** Category labels in display order, e.g. ["African Cuisine", "Drinks"]. */
  menuCategories: string[];
  menu: MenuItem[];
  hours: OpeningHours[];
  amenities: string[];
  orderUrl: string;
  events: SiteEvent[];
  gallery: string[];
  contact: SiteContact;
  sections: RestaurantSectionToggles;
}

export type SiteDocument = MarketingSiteDocument | RestaurantSiteDocument;

// --- Factories --------------------------------------------------------------

function baseBranding(siteName: string): SiteBranding {
  return {
    siteName,
    logoUrl: '',
    primaryColor: '#111827',
    secondaryColor: '#f59e0b',
    fontFamily: 'Inter',
  };
}

function baseContact(): SiteContact {
  return { email: '', phone: '', address: '', instagram: '', facebook: '', twitter: '' };
}

export function emptyMarketingDocument(siteName = 'My Website'): MarketingSiteDocument {
  return {
    template: 'marketing-v1',
    branding: baseBranding(siteName),
    hero: {
      headline: siteName,
      subheadline: 'Tell visitors what you do in one line.',
      backgroundImageUrl: '',
      ctaLabel: 'Get in touch',
      ctaUrl: '#contact',
    },
    about: { heading: 'About us', body: 'Share your story here.', imageUrl: '' },
    events: [],
    gallery: [],
    contact: baseContact(),
    sections: { hero: true, about: true, events: true, gallery: true, contact: true },
  };
}

export function emptyRestaurantDocument(siteName = 'My Restaurant'): RestaurantSiteDocument {
  return {
    template: 'restaurant-v1',
    branding: baseBranding(siteName),
    hero: {
      headline: siteName,
      subheadline: 'Great food, warm hospitality.',
      backgroundImageUrl: '',
      ctaLabel: 'View Menu',
      ctaUrl: '#menu',
    },
    about: { heading: 'About us', body: 'Share your story here.', imageUrl: '' },
    menuCategories: [],
    menu: [],
    hours: [],
    amenities: [],
    orderUrl: '',
    events: [],
    gallery: [],
    contact: baseContact(),
    sections: {
      hero: true,
      about: true,
      menu: true,
      hours: true,
      amenities: true,
      events: false,
      gallery: true,
      contact: true,
    },
  };
}

/** Blank document for the given template. */
export function emptySiteDocument(
  template: SiteTemplate,
  siteName = 'My Website',
): SiteDocument {
  return template === 'restaurant-v1'
    ? emptyRestaurantDocument(siteName)
    : emptyMarketingDocument(siteName);
}
