import { cn } from "@/libs/shadcn/utils";
interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level?: 1 | 2 | 3 | 4;
}

export function Heading({
  children,
  level = 1,
  className,
  ...props
}: HeadingProps) {
  const Tag = `h${level}` as const;

  const styles = {
    1: "text-3xl font-bold tracking-tight text-foreground mb-6",
    2: "text-2xl font-semibold tracking-tight text-foreground mb-4",
    3: "text-xl font-medium tracking-tight text-foreground mb-2",
    4: "text-lg font-medium tracking-tight text-foreground mb-2",
  };

  return (
    <Tag className={cn(styles[level], className)} {...props}>
      {children}
    </Tag>
  );
}
