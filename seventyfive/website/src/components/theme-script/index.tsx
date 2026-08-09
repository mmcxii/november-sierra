export const ThemeScript: React.FC = () => {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `(function(){try{var t=localStorage.getItem("sf-theme");if(t==="light"||t==="dark"){document.documentElement.setAttribute("data-theme",t)}}catch(e){}})()`,
      }}
      suppressHydrationWarning
    />
  );
};
