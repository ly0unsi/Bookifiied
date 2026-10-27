import Image from "next/image";
import { notFound } from "next/navigation";

import { sampleBooks } from "@/lib/constants";

export function generateStaticParams() {
  return sampleBooks.map(({ slug }) => ({ slug }));
}

export default async function BookPage(
  props: PageProps<"/books/[slug]">,
) {
  const { slug } = await props.params;
  const book = sampleBooks.find((item) => item.slug === slug);

  if (!book) {
    notFound();
  }

  return (
    <main className="wrapper container">
      <article className="flex flex-col gap-6 md:flex-row md:items-start">
        <Image
          src={book.coverURL}
          alt={book.title}
          width={266}
          height={400}
          className="book-card-cover"
        />
        <div>
          <p className="subtitle">Interactive book</p>
          <h1 className="page-title-xl">{book.title}</h1>
          <p className="subtitle">by {book.author}</p>
        </div>
      </article>
    </main>
  );
}
