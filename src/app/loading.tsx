import { LogoMark } from "@/components/logo";

/** Route-level loading screen. */
export default function Loading() {
  return (
    <div role="status" aria-label="Loading" className="flex min-h-[50vh] items-center justify-center">
      <LogoMark className="h-16 animate-pulse" />
    </div>
  );
}
