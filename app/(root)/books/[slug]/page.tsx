import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { ArrowLeft, Mic, MicOff } from "lucide-react";
import { Suspense } from "react";
import { connection } from "next/server";

import { getBookBySlug } from "@/lib/actions/book.actions";
import { Skeleton } from "@/components/ui/skeleton";
import VapiControls from "@/components/VapiControls";

type BookPageProps = PageProps<"/books/[slug]">;
type BookDetailsProps = Pick<BookPageProps, "params">;

async function BookDetails({ params }: BookDetailsProps) {
  await connection();

  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { slug } = await params;
  const result = await getBookBySlug(slug);

  if (!result.success || !result.data) redirect("/");

  const book = result.data;

  return (
    <main className="book-page-container">
      <div className="vapi-main-container gap-6">
        <VapiControls book={book} />
      </div>

      <Link
        href="/"
        className="back-btn-floating hidden md:flex"
        aria-label="Back to library"
      >
        <ArrowLeft className="size-5" aria-hidden="true" />
      </Link>
    </main>
  );
}

function BookDetailsSkeleton() {
  return (
    <main className="book-page-container">
      <div className="vapi-main-container gap-6">
        <section className="vapi-header-card w-full">
          <Skeleton className="h-[180px] w-[120px] shrink-0 rounded-lg" />
          <div className="flex-1 space-y-3">
            <Skeleton className="mx-auto h-8 w-2/3 sm:mx-0" />
            <Skeleton className="mx-auto h-5 w-1/3 sm:mx-0" />
            <Skeleton className="h-9 w-full max-w-[320px]" />
          </div>
        </section>
        <section className="transcript-container min-h-[400px] w-full" />
      </div>
    </main>
  );
}

export default function BookPage(props: BookPageProps) {
  return (
    <Suspense fallback={<BookDetailsSkeleton />}>
      <BookDetails params={props.params} />
    </Suspense>
  );
}

