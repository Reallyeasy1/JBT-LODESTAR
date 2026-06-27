import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-950 text-white p-8">
      <h1 className="text-4xl font-bold mb-4">Lodestar</h1>
      <p className="text-gray-400 text-lg mb-8 text-center max-w-md">
        Scan the room. Know who matters. Follow up before the opportunity goes cold.
      </p>
      <Link
        href={`/events/${process.env.NEXT_PUBLIC_DEMO_EVENT_ID ?? "cle00000000000000000001"}`}
        className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
      >
        Open Demo Event →
      </Link>
    </main>
  );
}
