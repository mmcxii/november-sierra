export const DeveloperApiVisual: React.FC = () => (
  <div className="mt-5">
    <div className="m-embed-bg-bg m-embed-border overflow-hidden rounded-xl font-mono text-[10px] leading-relaxed">
      <div className="flex items-center gap-1.5 border-b border-inherit px-4 py-2">
        <div className="m-muted-bg-15 size-2 rounded-full" />
        <div className="m-muted-bg-15 size-2 rounded-full" />
        <div className="m-muted-bg-15 size-2 rounded-full" />
      </div>
      <div className="px-4 py-3">
        {/* eslint-disable anchr/no-raw-string-jsx -- decorative code snippet in mockup */}
        <div>
          <span className="m-muted-40">curl </span>
          <span className="m-accent-55-color">anchr.to/api/v1/links</span>
        </div>
        <div className="m-muted-25 mt-2">{"// → 200 OK"}</div>
        <div className="m-muted-40">{"{"}</div>
        <div className="ml-3">
          <span className="m-accent-color">&quot;links&quot;</span>
          <span className="m-muted-40">: [</span>
          <span className="m-muted-25">...</span>
          <span className="m-muted-40">]</span>
        </div>
        <div className="m-muted-40">{"}"}</div>
        {/* eslint-enable anchr/no-raw-string-jsx */}
      </div>
    </div>
  </div>
);
