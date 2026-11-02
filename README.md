This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Hybrid book search

Book segment retrieval combines semantic vector search with MongoDB text search.
The results are merged using reciprocal-rank fusion, which helps surface both
conceptually related passages and exact keyword matches.

In Atlas, open the `bookified.booksegments` collection's Search tab and create
or edit the `book_segment_vector_index` with this definition:

```json
{
  "fields": [
    {
      "type": "autoEmbed",
      "modality": "text",
      "path": "content",
      "model": "voyage-4"
    },
    { "type": "filter", "path": "bookId" },
    { "type": "filter", "path": "clerkId" }
  ]
}
```

The auto-embedding index generates and manages embeddings for existing and new
segment text. Wait for the index status to return to **Ready** after editing it.
See the [MongoDB Vector Search index documentation](https://www.mongodb.com/docs/atlas/atlas-vector-search/vector-search-type/)
for details.

Keyword retrieval uses the regular MongoDB text index declared by
`database/models/book-segment.model.ts` on `{ bookId: 1, content: "text" }`.
Verify it exists in the `booksegments` collection with `db.booksegments.getIndexes()`.
If it is missing, create it with:

```javascript
db.booksegments.createIndex({ bookId: 1, content: "text" })
```

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
