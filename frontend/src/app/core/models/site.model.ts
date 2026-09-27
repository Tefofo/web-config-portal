/** Website document (mirrors backend SiteDocument). Template-aware union. */

export type SiteTemplate = 'marketing-v1' | 'restaurant-v1';

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

export interface MenuItem {
  name: string;
  description: string;
  price: number;
  category: string;
  tag: string;
}

export interface OpeningHours {
  days: string;
  time: string;
}

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

/** Response from GET/PUT /sites/me. */
export interface SiteView {
  slug: string;
  template: SiteTemplate;
  published: boolean;
  content: SiteDocument;
  updatedAt: string;
}

export interface UpdateSiteRequest {
  content: SiteDocument;
  published?: boolean;
}
