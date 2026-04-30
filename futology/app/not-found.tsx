import Link from "next/link";
import { Compass } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center">
      <EmptyState
        icon={Compass}
        title="Page not found"
        description="The page you're looking for doesn't exist or has been moved."
        action={
          <Link
            href="/"
            className="inline-flex items-center rounded-lg bg-accent px-3 py-2 text-sm font-medium text-bg-primary transition-colors hover:bg-accent-hover"
          >
            Go home
          </Link>
        }
        className="mx-auto w-full max-w-md"
      />
    </div>
  );
}
