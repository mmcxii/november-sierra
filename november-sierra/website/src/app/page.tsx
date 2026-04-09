import { SideNav } from "@/components/nav/side-nav";
import { About } from "@/components/sections/about";
import { Contact } from "@/components/sections/contact";
import { Footer } from "@/components/sections/footer";
import { Hero } from "@/components/sections/hero";
import { Products } from "@/components/sections/products";

const HomePage: React.FC = () => {
  return (
    <>
      <a className="skip-link" href="#about">
        Skip to content
      </a>
      <SideNav />
      <main>
        <Hero />
        <About />
        <Products />
        <Contact />
      </main>
      <Footer />
    </>
  );
};

export default HomePage;
