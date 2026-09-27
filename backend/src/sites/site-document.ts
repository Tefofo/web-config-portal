/**
 * Typed shape of a tenant's marketing website document (stored as JSON in
 * SiteConfig.content). This is the "marketing-v1" template contract shared
 * between the portal editor and the public site renderer.
 *
 * v1 is a fixed layout with editable content + branding. New optional fields
 * can be added over time without breaking existing sites.
 */

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
  /** Gallery image URLs. */
  gallery: string[];
  contact: SiteContact;
  sections: SiteSectionToggles;
}

/** A blank, valid site document new tenants start from. */
export function emptySiteDocument(siteName = 'My Website'): SiteDocument {
  return {
    branding: {
      siteName,
      logoUrl: '',
      primaryColor: '#111827',
      secondaryColor: '#f59e0b',
      fontFamily: 'Inter',
    },
    hero: {
      headline: siteName,
      subheadline: 'Tell visitors what you do in one line.',
      backgroundImageUrl: '',
      ctaLabel: 'Get in touch',
      ctaUrl: '#contact',
    },
    about: {
      heading: 'About us',
      body: 'Share your story here.',
      imageUrl: '',
    },
    events: [],
    gallery: [],
    contact: {
      email: '',
      phone: '',
      address: '',
      instagram: '',
      facebook: '',
      twitter: '',
    },
    sections: {
      hero: true,
      about: true,
      events: true,
      gallery: true,
      contact: true,
    },
  };
}
