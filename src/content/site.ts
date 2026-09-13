import siteJson from "./site.json";
import aboutJson from "./about.json";
import servicesJson from "./services.json";
import testimonialsJson from "./testimonials.json";

export interface SiteConfig {
  name: string; title: string; subtitle: string; email: string; phone: string;
  location: string; availability: string;
  social: { instagram: string; youtube: string; linkedin: string };
}
export interface TimelineEntry { year: number; title: string; description: string }
export interface Award { year: number; title: string; event: string }
export interface AboutContent {
  bio: string; longBio: string; timeline: TimelineEntry[]; equipment: string[]; awards: Award[];
}
export interface Service { id: string; title: string; description: string; icon: string }
export interface Testimonial { id: string; quote: string; name: string; role: string; company: string }

export const site: SiteConfig = siteJson;
export const about: AboutContent = aboutJson;
export const services: Service[] = servicesJson;
export const testimonials: Testimonial[] = testimonialsJson;
export const PROCESS_PHASES = [
  { title: "Discovery", description: "Understanding your vision, audience and goals." },
  { title: "Pre-production", description: "Shot design, lookbooks, and planning every frame." },
  { title: "Production", description: "On-set cinematography and direction." },
  { title: "Delivery", description: "Color grading and final output in every format you need." },
] as const;
