"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Button from "../ui/Button";
import Avatar from "../avatar";
import { useAuth } from "../../context/AuthContext";
import { profileApi } from "../../lib/profile";
import Image from "next/image";
import NepalCanLogo from "../../assets/navbar.png";

export default function Navbar() {
  const { isLoading, user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [avatar, setAvatar] = useState<{
    userId: string;
    value: string | null;
  } | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    let cancelled = false;
    profileApi
      .get()
      .then((response) => {
        if (!cancelled) {
          setAvatar({
            userId: user.id,
            value: response.profile?.avatar ?? null,
          });
        }
      })
      .catch(() => {
        if (!cancelled) setAvatar({ userId: user.id, value: null });
      });

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const avatarSource =
    avatar?.userId === user?.id ? (avatar?.value ?? null) : null;

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur sm:backdrop-blur-3xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5 lg:px-8">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 text-xl font-bold tracking-tight hover:text-primary"
        >
          <Image
            src={NepalCanLogo}
            alt="Nepal Can logo"
            width={32}
            height={32}
            className="h-8 w-8 shrink-0"
            unoptimized
          />
          Nepal Can<span className="text-black"> Blog</span>
        </Link>
        {isLoading ? null : user ? (
          <nav
            className="hidden items-center justify-around w-full text-sm font-medium lg:flex lg:w-2xl"
            aria-label="Primary navigation"
          >
            <Link href="/" className="flex  items-center  hover:text-primary">
              {/* <AiOutlineHome className="w-6 h-6" /> */}
              <p>Home</p>
            </Link>
            <Link
              href="/blogs"
              className="flex items-center hover:text-primary"
            >
              {/* <MdOutlineExplore className="w-6 h-6" /> */}
              <p>Explore</p>
            </Link>
            <Link
              href="/blogs/create"
              className="flex items-center hover:text-primary"
            >
              {/* <AiOutlineEdit className="w-6 h-6" /> */}
              <p>Write</p>
            </Link>
            <Link
              href="/profile"
              className="flex flex-col items-center   max-w-32 truncate hover:text-primary"
            ></Link>
            <div className="flex items-center gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={logout}
                className="rounded-md px-4 py-2"
              >
                Logout
              </Button>
              <Link href="/profile" aria-label="View profile">
                <Avatar
                  src={avatarSource}
                  name={user.name}
                  fallback="icon"
                  className="h-7 w-7"
                />
              </Link>
            </div>
          </nav>
        ) : (
          <nav
            className="hidden items-center gap-3 text-sm font-medium lg:flex"
            aria-label="Primary navigation"
          >
            <Link href="/blogs" className="hover:text-primary">
              Explore
            </Link>
            <Button
              variant="outline"
              href="/login"
              className="rounded-md px-4 py-2 no-underline"
            >
              Login
            </Button>
            <Button
              variant="primary"
              href="/register"
              className="rounded-md px-4 py-2 no-underline"
            >
              Get Started
            </Button>
          </nav>
        )}

        <button
          type="button"
          className="rounded-md p-2 text-foreground hover:bg-secondary lg:hidden"
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-navigation"
          onClick={() => setIsMenuOpen((open) => !open)}
        >
          <span className="sr-only">
            {isMenuOpen ? "Close menu" : "Open menu"}
          </span>
          <span aria-hidden="true" className="block h-5 w-5 space-y-1">
            <span className="block h-0.5 w-5 bg-current" />
            <span className="block h-0.5 w-5 bg-current" />
            <span className="block h-0.5 w-5 bg-current" />
          </span>
        </button>
      </div>

      <div
        id="mobile-navigation"
        className={`mx-auto w-full max-w-6xl overflow-hidden px-6 transition-[max-height,opacity] duration-200 lg:hidden lg:px-8 ${
          isMenuOpen ? "max-h-96 pb-5 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        {user ? (
          <nav
            className="flex flex-col gap-1 border-t pt-3 text-sm font-medium"
            aria-label="Mobile navigation"
          >
            <Link
              href="/"
              onClick={closeMenu}
              className="rounded-md px-3 py-3 hover:bg-secondary hover:text-primary"
            >
              Home
            </Link>
            <Link
              href="/blogs"
              onClick={closeMenu}
              className="rounded-md px-3 py-3 hover:bg-secondary hover:text-primary"
            >
              Explore
            </Link>
            <Link
              href="/blogs/create"
              onClick={closeMenu}
              className="rounded-md px-3 py-3 hover:bg-secondary hover:text-primary"
            >
              Write
            </Link>
            <Link
              href="/profile"
              onClick={closeMenu}
              className="rounded-md px-3 py-3 hover:bg-secondary hover:text-primary"
            >
              Profile
            </Link>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                logout();
                closeMenu();
              }}
              className="mt-2 rounded-md px-4 py-2"
            >
              Logout
            </Button>
          </nav>
        ) : (
          <nav
            className="flex flex-col gap-1 border-t pt-3 text-sm font-medium"
            aria-label="Mobile navigation"
          >
            <Link
              href="/blogs"
              onClick={closeMenu}
              className="rounded-md px-3 py-3 hover:bg-secondary hover:text-primary"
            >
              Explore
            </Link>
            <div onClick={closeMenu}>
              <Button
                variant="outline"
                href="/login"
                className="w-full rounded-md px-4 py-2 no-underline"
              >
                Login
              </Button>
            </div>
            <div onClick={closeMenu} className="mt-2">
              <Button
                variant="primary"
                href="/register"
                className="w-full rounded-md px-4 py-2 no-underline"
              >
                Get Started
              </Button>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
