import { TopBar } from "@/components/layout/top-bar";
import { ViewFade } from "@/components/layout/view-fade";

/**
 * The chrome every hub page shares. The race screen will live outside this
 * group so it can go full bleed without the top bar.
 */
export default function ShellLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh flex-col">
      <TopBar />
      <main className="mx-auto w-full max-w-295 flex-1 px-6 pb-12 pt-7">
        <ViewFade>{children}</ViewFade>
      </main>
    </div>
  );
}
