export default function Footer() {
  return (
    <footer className="border-t bg-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-6 py-7 text-sm sm:flex-row sm:items-center sm:justify-between lg:px-8">
        <span className="font-semibold text-foreground">Nepal Can Blog</span>
        <span className="text-muted-foreground">
          A warm place for useful stories.
        </span>
      </div>
    </footer>
  );
}
