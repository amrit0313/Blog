import Card from "../../../../components/dashboard/card";

const viewsData = [
  { month: "Apr", views: 120 },
  { month: "May", views: 180 },
  { month: "Jun", views: 240 },
  { month: "Jul", views: 310 },
  { month: "Aug", views: 420 },
  { month: "Sep", views: 567 },
];

const topBlogs = [
  { title: "The Future of AI in Content Writing", views: 567, likes: 89 },
  { title: "Getting Started with Next.js 16", views: 234, likes: 45 },
  { title: "Why I Switched to Tailwind CSS 4", views: 189, likes: 32 },
];

const maxViews = Math.max(...viewsData.map((d) => d.views));

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <p className="mt-1 text-muted-foreground">
          Track your blog performance over time.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card padding="md">
          <p className="text-sm text-muted-foreground">Total Views</p>
          <p className="mt-1 text-2xl font-bold text-foreground">1,429</p>
        </Card>
        <Card padding="md">
          <p className="text-sm text-muted-foreground">Total Likes</p>
          <p className="mt-1 text-2xl font-bold text-foreground">347</p>
        </Card>
        <Card padding="md">
          <p className="text-sm text-muted-foreground">Avg. Views/Blog</p>
          <p className="mt-1 text-2xl font-bold text-foreground">286</p>
        </Card>
      </div>

      <Card padding="lg">
        <h2 className="mb-6 font-semibold text-foreground">
          Views Over Time
        </h2>
        <div className="flex items-end gap-3 h-48">
          {viewsData.map((d) => (
            <div key={d.month} className="flex flex-1 flex-col items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                {d.views}
              </span>
              <div
                className="w-full rounded-t-md bg-primary/80 transition-all"
                style={{ height: `${(d.views / maxViews) * 100}%` }}
              />
              <span className="text-xs text-muted-foreground">{d.month}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card padding="none">
        <div className="border-b border-border px-6 py-4">
          <h2 className="font-semibold text-foreground">Top Performing Blogs</h2>
        </div>
        <div className="divide-y divide-border">
          {topBlogs.map((blog, i) => (
            <div key={blog.title} className="flex items-center gap-4 px-6 py-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-sm font-bold text-secondary-foreground">
                {i + 1}
              </span>
              <div className="flex-1">
                <p className="font-medium text-foreground">{blog.title}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">{blog.views} views</p>
                <p className="text-xs text-muted-foreground">{blog.likes} likes</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
