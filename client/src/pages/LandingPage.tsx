import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { MessageSquare, Users, Mic, Lock } from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function LandingPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && isAuthenticated) setLocation("/chats");
  }, [isAuthenticated, isLoading, setLocation]);

  if (isLoading) return null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <section className="relative min-h-screen flex items-center justify-center px-4">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-primary/8 rounded-full blur-[100px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-primary/5 rounded-full blur-[80px]" />
        </div>

        <div className="relative z-10 flex flex-col items-center text-center max-w-2xl">
          <div className="inline-flex items-center gap-2 mb-8 px-3 py-1.5 rounded-full bg-secondary border text-sm text-muted-foreground">
            <MessageSquare className="w-4 h-4 text-primary" />
            RolePlay
          </div>

          <h1 className="text-4xl md:text-6xl font-bold mb-4 tracking-tight leading-tight" data-testid="text-hero-title">
            Immersive Stories.
            <br />
            <span className="text-muted-foreground">Private Worlds.</span>
          </h1>

          <p className="text-lg text-muted-foreground mb-8 max-w-md" data-testid="text-hero-subtitle">
            Create scenes, adopt avatars, and roleplay with friends in encrypted chat rooms.
          </p>

          <div className="flex gap-3">
            <Button 
              size="lg"
              onClick={() => window.location.href = "/api/login"}
              data-testid="button-login"
            >
              Get Started
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              data-testid="button-learn-more"
            >
              Learn More
            </Button>
          </div>
        </div>
      </section>

      <section className="py-16 border-t">
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard icon={Mic} title="Voice Chat" description="Speak in character with real-time transcription." />
          <FeatureCard icon={Users} title="Avatars" description="Distinct avatars for every scenario and character." />
          <FeatureCard icon={Lock} title="Private" description="Your stories stay yours with encrypted messaging." />
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description }: { icon: any, title: string, description: string }) {
  return (
    <div className="p-5 rounded-md bg-card border">
      <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center mb-3">
        <Icon className="w-4.5 h-4.5 text-primary" style={{ width: 18, height: 18 }} />
      </div>
      <h3 className="text-sm font-semibold mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}
