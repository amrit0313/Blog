import Link from "next/link";
import Button from "../components/ui/Button";
import Navbar from "../components/navbar/Navbar";
import Footer from "../components/footer/Footer";

export default function Home() {
  return (
    <main className="flex min-h-full flex-1 flex-col">
      <Navbar />
      <section className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-12 px-6 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-28">
        <div>
          <p className="eyebrow mb-4">Ideas worth sharing</p>
          <h1 className="max-w-2xl text-5xl leading-[1.08] sm:text-6xl">
           Publish your passions,{" "} 
            <span className="text-primary">your way.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8">
            Discover thoughtful writing from a growing Nepali community. Read
            something useful, then add your own voice.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Button
              href="/main/blogs"
              className="rounded-md px-6 py-3 font-semibold no-underline shadow-sm"
            >
              Browse Blogs
            </Button>
            <Button
              variant="outline"
              href="/register"
              className="rounded-md px-6 py-3 font-semibold no-underline"
            >
              Join the community
            </Button>
          </div>
        </div>
        <div className="card relative overflow-hidden p-8 sm:p-10">
          <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-secondary" />
          <p className="eyebrow relative">Featured this week</p>
          <h2 className="relative mt-5 text-3xl leading-tight">
            Write your Blog
          </h2>
          <p className="relative mt-4 leading-7">
            Get started with writing your stories, stories remain alive for
            generations.
          </p>
          <Link
            href="/main/blogs"
            className="relative mt-8 inline-flex font-semibold no-underline"
          >
            Read the latest <span className="ml-2">-&gt;</span>
          </Link>
        </div>
      </section>
      <Footer />
    </main>
  );
}



