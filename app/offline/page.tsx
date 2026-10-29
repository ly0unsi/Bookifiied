export default function OfflinePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8f4e9] px-6 py-16 text-center">
      <section className="max-w-md rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="font-serif text-3xl font-semibold text-[#212a3b]">
          You’re offline
        </h1>
        <p className="mt-3 text-[#3d485e]">
          Bookified needs an internet connection to open your library and book conversations.
          Reconnect and try again.
        </p>
      </section>
    </main>
  );
}
