// constants/routes.ts

export const ROUTES = {
  HOME: "/",

  AUTH: {
    LOGIN: "/login",
    REGISTER: "/register",
  },

  BLOG: {
    LIST: "/blogs",
    CREATE: "/blogs/create",
    DETAILS: (id: string) => `/blogs/${id}`,
    EDIT: (id: string) => `/blogs/${id}/edit`,
  },

  PROFILE: {
    VIEW: "/profile",
    EDIT: "/profile/edit",
  },

  ADMIN: {
    DASHBOARD: "/admin",
    USERS: "/admin/users",
    BLOGS: "/admin/blogs",
  },
} as const;


//we can do
// import { ROUTES } from "@/constants/routes";

// <Link href={ROUTES.BLOG.LIST}>
//   Blogs
// </Link>


//for dynamic routing
// <Link href={ROUTES.BLOG.DETAILS(blog._id)}>
//   Read More
// </Link>
