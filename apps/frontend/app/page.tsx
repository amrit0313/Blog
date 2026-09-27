import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-full flex-1 flex-col">
      <header className="border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5 lg:px-8">
          <Link
            href="/"
            className="text-xl font-bold tracking-tight text-foreground hover:text-primary"
          >
            Sajilo<span className="text-primary">Blog</span>
          </Link>
          <nav className="flex items-center gap-5 text-sm font-medium text-muted-foreground">
            <a href="/main/blogs" className="hover:text-primary">
              Explore
            </a>
            <a
              href="/auth/login"
              className="rounded-md bg-primary px-4 py-2 text-primary-foreground no-underline hover:bg-[#c92f3d]"
            >
              Sign in
            </a>
          </nav>
        </div>
      </header>
      <section className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-12 px-6 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-28">
        <div>
          <p className="eyebrow mb-4">Ideas worth sharing</p>
          <h1 className="max-w-2xl text-5xl leading-[1.08] sm:text-6xl">
            Stories and insights, made for{" "}
            <span className="text-primary">everyday life.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8">
            Discover thoughtful writing from a growing Nepali community. Read
            something useful, then add your own voice.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <a
              href="/main/blogs"
              className="rounded-md bg-primary px-6 py-3 font-semibold text-primary-foreground no-underline shadow-sm hover:bg-[#c92f3d]"
            >
              Browse stories
            </a>
            <a
              href="/auth/register"
              className="rounded-md border bg-white px-6 py-3 font-semibold text-foreground no-underline hover:border-primary hover:text-primary"
            >
              Join the community
            </a>
          </div>
        </div>
        <div className="card relative overflow-hidden p-8 sm:p-10">
          <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-secondary" />
          <p className="eyebrow relative">Featured this week</p>
          <h2 className="relative mt-5 text-3xl leading-tight">
            Small ideas can make a big difference.
          </h2>
          <p className="relative mt-4 leading-7">
            A calm place for practical lessons, personal stories, and fresh
            perspectives from close to home.
          </p>
          <a
            href="/main/blogs"
            className="relative mt-8 inline-flex font-semibold no-underline"
          >
            Read the latest <span className="ml-2">-&gt;</span>
          </a>
        </div>
      </section>
      <footer className="border-t bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-6 py-7 text-sm sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <span className="font-semibold text-foreground">SajiloBlog</span>
          <span className="text-muted-foreground">
            A warm place for useful stories.
          </span>
        </div>
      </footer>
    </main>
  );
}



