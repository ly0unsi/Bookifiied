import BookCard from "@/components/BookCard";
import HeroSection from "@/components/HeroSection";
import { Suspense } from "react";
import { connection } from "next/server";
import { getAllBooks } from "@/lib/actions/book.actions";
import { Skeleton } from "@/components/ui/skeleton";

const BookLibrarySkeleton = () => (
  <div className="library-books-grid" role="status" aria-busy="true">
    <span className="sr-only">Loading books</span>
    {Array.from({ length: 6 }, (_, index) => (
      <article className="book-card" key={index}>
        <div className="book-card-cover-wrapper">
          <Skeleton className="h-42.5 w-35 rounded-lg md:h-50" />
        </div>
        <div className="book-card-meta">
          <Skeleton className="h-5 w-4/5" />
          <Skeleton className="h-4 w-3/5" />
        </div>
      </article>
    ))}
  </div>
);

const BookLibrary = async () => {
  await connection();
  const booksResults = await getAllBooks();
  const books = booksResults.success ? (booksResults.data ?? []) : [];

  return (
    <div className="library-books-grid">
      {books.map((book) => (
        <BookCard
          key={book._id}
          title={book.title}
          author={book.author}
          coverURL={book.coverURL}
          slug={book.slug}
        />
      ))}
    </div>
  );
};

const page = () => {
  return (
    <main className="wrapper container">
      <HeroSection />
      <Suspense fallback={<BookLibrarySkeleton />}>
        <BookLibrary />
      </Suspense>
    </main>
  );
};

export default page;

