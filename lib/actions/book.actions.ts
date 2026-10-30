"use server";

import { CreateBook, TextSegment } from "@/types";
import { connectToDatabase } from "@/database/mongoose";
import { escapeRegex, generateSlug, serializeData } from "@/lib/utils";
import Book from "@/database/models/book.model";
import BookSegment from "@/database/models/book-segment.model";
import { PLANS } from "@/lib/subscription-constants";
import { getPlanFromHas } from "@/lib/subscription-utils";
import { auth } from "@clerk/nextjs/server";

export const getAllBooks = async () => {
  try {
    await connectToDatabase();

    // let query = {};

    // if (search) {
    //   const escapedSearch = escapeRegex(search);
    //   const regex = new RegExp(escapedSearch, "i");
    //   query = {
    //     $or: [{ title: { $regex: regex } }, { author: { $regex: regex } }],
    //   };
    // }

    const books = await Book.find().sort({ createdAt: -1 }).lean();

    return {
      success: true,
      data: serializeData(books),
    };
  } catch (e) {
    console.error("Error connecting to database", e);
    return {
      success: false,
      error: e,
    };
  }
};

export const getBookBySlug = async (slug: string) => {
  try {
    await connectToDatabase();

    const book = await Book.findOne({ slug }).lean();

    if (!book) {
      return { success: false, data: null };
    }

    return {
      success: true,
      data: serializeData(book),
    };
  } catch (e) {
    console.error("Error fetching book by slug", e);
    return {
      success: false,
      data: null,
      error: e instanceof Error ? e.message : String(e),
    };
  }
};

export const createBook = async (data: CreateBook) => {
  try {
    const { userId, has } = await auth();

    if (!userId || userId !== data.clerkId) {
      return { success: false, error: "Unauthorized" };
    }

    await connectToDatabase();

    const slug = generateSlug(data.title);

    const existingBook = await Book.findOne({ slug }).lean();

    if (existingBook) {
      return {
        success: true,
        data: serializeData(existingBook),
        alreadyExists: true,
      };
    }

    const plan = getPlanFromHas(has);
    const bookCount = await Book.countDocuments({ clerkId: userId });
    const bookLimit = PLANS[plan].maxBooks;

    if (bookCount >= bookLimit) {
      return {
        success: false,
        error: `Your ${plan} plan allows up to ${bookLimit} books. Upgrade your plan to add more.`,
        isBillingError: true,
      };
    }

    const book = await Book.create({
      ...data,
      clerkId: userId,
      slug,
      totalSegments: 0,
    });

    return {
      success: true,
      data: serializeData(book),
    };
  } catch (e) {
    console.error("Error creating a book", e);

    return {
      success: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
};

export const saveBookSegments = async (
  bookId: string,
  clerkId: string,
  segments: TextSegment[],
) => {
  try {
    await connectToDatabase();

    console.log("Saving book segments...");

    const segmentsToInsert = segments.map(
      ({ text, segmentIndex, pageNumber, wordCount }) => ({
        clerkId,
        bookId,
        content: text,
        segmentIndex,
        pageNumber,
        wordCount,
      }),
    );

    await BookSegment.insertMany(segmentsToInsert);

    await Book.findByIdAndUpdate(bookId, { totalSegments: segments.length });

    console.log("Book segments saved successfully.");

    return {
      success: true,
      data: { segmentsCreated: segments.length },
    };
  } catch (e) {
    console.error("Error saving book segments", e);

    return {
      success: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
};

export const searchBookSegments = async (
  bookId: string,
  query: string,
  limit: number,
) => {
  try {
    await connectToDatabase();

    const segments = await BookSegment.find(
      { bookId, $text: { $search: query } },
      { score: { $meta: "textScore" } },
    )
      .sort({ score: { $meta: "textScore" } })
      .limit(limit)
      .select({ content: 1, segmentIndex: 1, pageNumber: 1, _id: 0 })
      .lean();

    return { success: true, data: segments };
  } catch (e) {
    console.error("Error searching book segments", e);
    return {
      success: false,
      data: [],
      error: e instanceof Error ? e.message : String(e),
    };
  }
};

export const getBookCitationPages = async (
  bookId: string,
  query: string,
): Promise<{ success: boolean; data: number[]; error?: string }> => {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, data: [], error: "Authentication required." };
    }

    if (!/^[\da-f]{24}$/i.test(bookId) || !query.trim()) {
      return { success: false, data: [], error: "Invalid book or query." };
    }

    await connectToDatabase();

    const segments = await BookSegment.find(
      {
        bookId,
        clerkId: userId,
        $text: { $search: query.trim() },
      },
      { score: { $meta: "textScore" } },
    )
      .sort({ score: { $meta: "textScore" } })
      .limit(3)
      .select({ pageNumber: 1, _id: 0 })
      .lean();

    const pages = [
      ...new Set(
        segments
          .map((segment) => segment.pageNumber)
          .filter(
            (pageNumber): pageNumber is number =>
              typeof pageNumber === "number" &&
              Number.isInteger(pageNumber) &&
              pageNumber > 0,
          ),
      ),
    ];

    return { success: true, data: pages };
  } catch (error) {
    console.error("Error fetching book citation pages", error);
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : String(error),
    };
  }
};

export const checkBookExists = async (title: string) => {
  try {
    await connectToDatabase();

    const slug = generateSlug(title);

    const existingBook = await Book.findOne({ slug }).lean();

    if (existingBook) {
      return {
        exists: true,
        book: serializeData(existingBook),
      };
    }

    return {
      exists: false,
    };
  } catch (e) {
    console.error("Error checking book exists", e);
    return {
      exists: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
};
