import { cookies } from "next/headers";
import { THEME_COOKIE } from "@/lib/theme-constants";

export default async function ThemeInit() {
  const cookieStore = await cookies();
  const theme = cookieStore.get(THEME_COOKIE)?.value || "";

  const script = `
    (function(){
      try {
        var m = document.cookie.match(/(^| )${THEME_COOKIE}=([^;]+)/);
        var t = m ? decodeURIComponent(m[2]) : ${JSON.stringify(theme)};
        var dark = t === 'dark';
        if (!t) {
          dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
        var root = document.documentElement;
        if (dark) root.classList.add('dark');
        else root.classList.remove('dark');
      } catch(e){}
    })();
  `;

  return (
    <script
      dangerouslySetInnerHTML={{ __html: script }}
      suppressHydrationWarning
    />
  );
}
