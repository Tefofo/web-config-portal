/** Marketing website document (mirrors backend SiteDocument, marketing-v1). */

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

/** Response from GET/PUT /sites/me. */
export interface SiteView {
  slug: string;
  template: string;
  published: boolean;
  content: SiteDocument;
  updatedAt: string;
}

export interface UpdateSiteRequest {
  content: SiteDocument;
  published?: boolean;
}
