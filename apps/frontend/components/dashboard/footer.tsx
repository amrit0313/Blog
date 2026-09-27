import { ReactNode } from "react";

export interface FooterProps {
  children?: ReactNode;
  className?: string;
}

export default function Footer({
  children,
  className = "",
}: FooterProps) {
  return (
    <footer className={["border-t bg-white", className].join(" ")}>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-6 py-6 text-sm sm:flex-row sm:items-center sm:justify-between lg:px-8">
        {children ?? (
          <>
            <span className="font-semibold text-foreground">NepalCanBlog</span>
            <span className="text-muted-foreground">
              A warm place for useful stories.
            </span>
          </>
        )}
      </div>
    </footer>
  );
}
