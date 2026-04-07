export type IconHeaderProps = { icon: React.ElementType; title: string };

export const IconHeader: React.FC<IconHeaderProps> = (props) => {
  const { icon: Icon, title } = props;

  return (
    <div className="mb-4 flex items-center gap-3">
      <div className="m-icon-box flex size-10 shrink-0 items-center justify-center rounded-xl">
        <Icon className="m-accent-color size-4" strokeWidth={1.5} />
      </div>
      <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
    </div>
  );
};
