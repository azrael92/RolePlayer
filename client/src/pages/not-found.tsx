import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="glass-card p-12 rounded-3xl text-center max-w-md w-full border-primary/20">
        <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-6" />
        <h1 className="text-4xl font-display font-bold mb-4">404</h1>
        <p className="text-muted-foreground mb-8">
          The scene you are looking for does not exist. It may have been deleted or you took a wrong turn.
        </p>
        <Link href="/">
          <Button size="lg" className="w-full">Return Home</Button>
        </Link>
      </div>
    </div>
  );
}
