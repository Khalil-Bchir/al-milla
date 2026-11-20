export default function LoadingPage() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center text-foreground"
    >
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-secondary border-t-primary" />
      <p className="mt-4 text-base font-medium text-muted-foreground">
        جاري التحميل...
      </p>
    </div>
  );
}
