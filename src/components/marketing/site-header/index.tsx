import { SiteBrandmark } from "@/components/marketing/site-brandmark";
import { Container } from "@/components/ui/container";
import Link from "next/link";

export const SiteHeader: React.FC = () => {
  return (
    <Container as="header" className="relative z-10 py-6">
      <Link className="group inline-flex items-center" href="/">
        <SiteBrandmark className="transition-opacity group-hover:opacity-75" size="sm" />
      </Link>
    </Container>
  );
};
