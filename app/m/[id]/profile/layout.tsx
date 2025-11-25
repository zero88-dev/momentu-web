export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full" style={{ marginTop: "-20px" }}>
      {children}
    </div>
  );
}
