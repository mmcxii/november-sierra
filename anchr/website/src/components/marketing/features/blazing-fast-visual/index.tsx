export const BlazingFastVisual: React.FC = () => (
  <div className="mt-5">
    <div className="m-embed-bg-bg m-embed-border overflow-hidden rounded-xl">
      {/* Loading bar */}
      <div className="h-[2px]">
        <div className="m-accent-bg h-full [animation:speed-bar_4s_ease-in-out_infinite]" />
      </div>
      {/* Page content that appears */}
      <div className="[animation:speed-content_4s_ease-in-out_infinite] space-y-2.5 px-5 py-4">
        <div className="m-accent-bg-22 mx-auto size-6 rounded-full" />
        <div className="space-y-1.5">
          <div className="m-accent-16-bg h-2 rounded-full" />
          <div className="m-muted-bg-10 h-2 rounded-full" />
          <div className="m-muted-bg-08 h-2 rounded-full" />
        </div>
      </div>
    </div>
  </div>
);
