"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Show,
  SignInButton,
  UserButton,
  useUser,
} from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { Menu as MenuIcon, X as CloseIcon } from "lucide-react";
import { useEffect, useState } from "react";

const navItems = [
  { label: "Library", href: "/" },
  { label: "Add New", href: "/books/new" },
  { label: "Pricing", href: "/subscriptions" },
];

const Navbar = () => {
  const pathName = usePathname();
  const { user } = useUser();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathName]);

  return (
    <header className="w-full fixed z-50 bg-(--bg-primary)">
      <div className="wrapper navbar-height py-4 flex justify-between items-center">
        <Link href="/" className="flex gap-0.5 items-center">
          <Image src="/assets/logo.png" alt="Bookfied" width={42} height={26} />
          <span className="logo-text">Bookified</span>
        </Link>

        <nav className="hidden w-fit items-center gap-7.5 md:flex">
          {navItems.map(({ label, href }) => {
            const isActive =
              pathName === href || (href !== "/" && pathName.startsWith(href));

            return (
              <Link
                href={href}
                key={label}
                className={cn(
                  "nav-link-base",
                  isActive ? "nav-link-active" : "text-black hover:opacity-70",
                )}
              >
                {label}
              </Link>
            );
          })}

          <Show when="signed-out">
            <div className="flex gap-3 items-center">
              <SignInButton mode="modal">
                <button
                  type="button"
                  className="nav-link-base text-black hover:opacity-70"
                >
                  Sign in
                </button>
              </SignInButton>
            </div>
          </Show>
          <Show when="signed-in">
            <div className="nav-user-link">
              <UserButton />
              {user?.firstName && (
                <Link href="/subscriptions" className="nav-user-name">
                  {user.firstName}
                </Link>
              )}
            </div>
          </Show>
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <Show when="signed-in">
            <UserButton />
          </Show>
          <button
            type="button"
            className="flex size-10 items-center justify-center rounded-lg text-[#212a3b] transition hover:bg-[#f3e4c7]"
            aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setIsMenuOpen((open) => !open)}
          >
            {isMenuOpen ? (
              <CloseIcon className="size-5" aria-hidden="true" />
            ) : (
              <MenuIcon className="size-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="absolute inset-x-0 top-full border-t border-[rgba(33,42,59,0.12)] bg-[#f8f4e9] p-4 shadow-lg md:hidden">
          <nav id="mobile-navigation" className="mx-auto flex w-full max-w-7xl flex-col gap-1">
            {navItems.map(({ label, href }) => {
              const isActive =
                pathName === href || (href !== "/" && pathName.startsWith(href));

              return (
                <Link
                  href={href}
                  key={label}
                  onClick={() => setIsMenuOpen(false)}
                  className={cn(
                    "rounded-lg px-4 py-3 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-[#f3e4c7] text-[#212a3b]"
                      : "text-[#3d485e] hover:bg-[#fff6e5]",
                  )}
                >
                  {label}
                </Link>
              );
            })}

            <Show when="signed-out">
              <SignInButton mode="modal">
                <button
                  type="button"
                  onClick={() => setIsMenuOpen(false)}
                  className="rounded-lg px-4 py-3 text-left text-sm font-medium text-[#3d485e] transition-colors hover:bg-[#fff6e5]"
                >
                  Sign in
                </button>
              </SignInButton>
            </Show>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;
