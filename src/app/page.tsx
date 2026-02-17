import { initTranslations } from "@/lib/i18n/server";
import { Waitlist } from "@clerk/nextjs";

const Home: React.FC = async () => {
  //* Variables
  const { t } = await initTranslations("en");

  return (
    <div className="flex h-full flex-col items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <header>
        <h1 className="text-4xl font-bold">{t("anchr")}</h1>
      </header>
      <main className="flex h-full flex-1 items-center justify-center">
        <Waitlist />
      </main>
    </div>
  );
};

export default Home;
