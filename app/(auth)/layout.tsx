export const dynamic = "force-dynamic";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="villa-bg"><div className="relative z-10">{children}</div></div>;
}
