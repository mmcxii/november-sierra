type JsonValue = JsonValue[] | boolean | null | number | string | { [key: string]: JsonValue };

type JsonLdProps = {
  data: Record<string, JsonValue>;
};

export const JsonLd: React.FC<JsonLdProps> = (props) => {
  const { data } = props;

  // Replace "</script" (case-insensitive) to prevent breaking out of the JSON-LD block.
  const json = JSON.stringify(data).replace(/<\/script/gi, "<\\/script");

  return <script dangerouslySetInnerHTML={{ __html: json }} type="application/ld+json" />;
};
