import Link from "next/link";

export default function NotFound() {
  return (
    <div className="rounded-lg border border-stone-200 bg-white p-8 text-center">
      <h1 className="text-2xl font-semibold text-stone-900">Product not found</h1>
      <p className="mt-2 text-sm text-stone-600">
        The product you are looking for does not exist or was removed.
      </p>
      <Link
        href="/"
        className="mt-4 inline-block text-sm font-medium text-stone-800 underline"
      >
        Return to listing
      </Link>
    </div>
  );
}
