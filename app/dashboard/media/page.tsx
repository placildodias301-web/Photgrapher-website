import MediaLibrary from "./MediaLibrary";
export const metadata = { title: "Media Library" };
export default function Page() {
  return (<><h1 className="font-display text-4xl font-light mb-2">Media Library</h1>
    <p className="text-sm text-mute mb-10">Every photo and video you’ve uploaded, and where it’s used. Files that are in use can’t be deleted until you remove them from where they appear.</p>
    <MediaLibrary /></>);
}
