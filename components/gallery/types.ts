export type Photo = {
  id: number; url: string; width: number | null; height: number | null; alt: string | null;
  title?: string; category?: string | null; href?: string;
};
export const ratio = (p: { width: number | null; height: number | null }) => (p.width && p.height ? p.height / p.width : 2 / 3);
