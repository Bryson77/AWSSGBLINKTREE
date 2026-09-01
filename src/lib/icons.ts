/**
 * Platform icon mapping — maps platform slugs to react-icons.
 * PRD §4: Monochrome treatment, white/light gray at rest.
 * Recognized platforms get brand glyphs; unknown gets globe fallback.
 */
import { IconType } from "react-icons";
import {
  SiInstagram,
  SiX,
  SiWhatsapp,
  SiTiktok,
  SiYoutube,
  SiFacebook,
  SiDiscord,
  SiGithub,
  SiTelegram,
  SiMeetup,
  SiMedium,
  SiDevdotto,
  SiHashnode,
} from "react-icons/si";
import { FaLinkedinIn, FaAws } from "react-icons/fa6";
import { HiGlobeAlt } from "react-icons/hi2";

const platformIcons: Record<string, IconType> = {
  aws: FaAws,
  "aws-skill-builder": FaAws,
  meetup: SiMeetup,
  instagram: SiInstagram,
  x: SiX,
  twitter: SiX,
  linkedin: FaLinkedinIn,
  whatsapp: SiWhatsapp,
  tiktok: SiTiktok,
  youtube: SiYoutube,
  facebook: SiFacebook,
  discord: SiDiscord,
  github: SiGithub,
  telegram: SiTelegram,
  medium: SiMedium,
  devto: SiDevdotto,
  hashnode: SiHashnode,
};

/** Returns the matching brand icon or a globe fallback. */
export function getIconForPlatform(platform: string): IconType {
  return platformIcons[platform.toLowerCase()] ?? HiGlobeAlt;
}
