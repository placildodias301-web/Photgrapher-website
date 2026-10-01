import { getAbout } from "@/lib/public";
import AboutForm from "./AboutForm";
export const dynamic = "force-dynamic";
export const metadata = { title: "About" };
export default async function Page() {
  return (<><h1 className="font-display text-4xl font-light mb-2">About</h1>
    <p className="text-sm text-mute mb-10">Your photo, name and story, shown on the About page and previewed on the homepage.</p>
    <AboutForm initial={await getAbout()} /></>);
}
