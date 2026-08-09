import { THEME_STORAGE_KEY } from "@/lib/theme";
import * as React from "react";

export const ThemeScript: React.FC = () => {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `(function(){try{var t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});if(t==="light"||t==="dark"){document.documentElement.setAttribute("data-theme",t)}}catch(e){}})()`,
      }}
      suppressHydrationWarning
    />
  );
};
