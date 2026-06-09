import { BottomNav } from "@/components/bottom-nav";
import { ToastProvider } from "@/components/toast";
import { ErrorBoundary } from "@/components/error-boundary";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <ErrorBoundary>
        <div className="villa-bg">
          <main className="flex-1 pb-20 relative z-10">{children}</main>
        </div>
      </ErrorBoundary>
      <BottomNav />
    </ToastProvider>
  );
}
