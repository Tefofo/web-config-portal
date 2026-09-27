/**
 * Mirrors the backend SiteDocument contract (backend/src/sites/site-document.ts)
 * for the "marketing-v1" template. Kept in sync manually; a shared package
 * could replace this later.
 */

export interface SiteBranding {
  siteName: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
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

export interface SiteSectionToggles {
  hero: boolean;
  about: boolean;
  events: boolean;
  gallery: boolean;
  contact: boolean;
}

export interface SiteDocument {
  branding: SiteBranding;
  hero: SiteHero;
  about: SiteAbout;
  events: SiteEvent[];
  gallery: string[];
  contact: SiteContact;
  sections: SiteSectionToggles;
}

/** Public site response returned by GET /public/sites/:slug. */
export interface PublicSite {
  siteName: string;
  template: string;
  content: SiteDocument;
}
