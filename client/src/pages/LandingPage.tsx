import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { ScrollText, Users, Mic, Lock } from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function LandingPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      setLocation("/chats");
    }
  }, [isAuthenticated, isLoading, setLocation]);

  if (isLoading) return null;

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center">
        {/* Background Effects */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-accent/20 rounded-full blur-[120px] translate-x-1/2 translate-y-1/2" />
          
          {/* Grid Pattern */}
          <div className="absolute inset-0 opacity-10" style={{ 
            backgroundImage: "radial-gradient(circle at center, #ffffff 1px, transparent 1px)", 
            backgroundSize: "40px 40px" 
          }} />
        </div>

        <div className="container relative z-10 px-4 md:px-6 flex flex-col items-center text-center">
          <div className="inline-flex items-center justify-center p-3 mb-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 shadow-2xl animate-in-fade">
            <ScrollText className="w-10 h-10 text-primary mr-3" />
            <span className="text-3xl font-display font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              RolePlay
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-display font-bold mb-6 tracking-tight leading-tight max-w-4xl animate-in-fade" style={{ animationDelay: "100ms" }}>
            Immersive Stories <br/>
            <span className="text-white/50">Private Worlds</span>
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl animate-in-fade" style={{ animationDelay: "200ms" }}>
            Create scenes, adopt avatars, and roleplay with friends in encrypted, atmospheric chat rooms.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 animate-in-fade" style={{ animationDelay: "300ms" }}>
            <Button 
              size="lg" 
              className="text-lg px-8 py-6 rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25"
              onClick={() => window.location.href = "/api/login"}
            >
              Start Your Adventure
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg px-8 py-6 rounded-xl border-white/10 hover:bg-white/5"
            >
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-black/20">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={Mic}
              title="Voice & Transcription"
              description="Speak in character. We'll transcribe your voice in real-time while keeping the audio private."
            />
            <FeatureCard 
              icon={Users}
              title="Character Avatars"
              description="Upload distinct avatars for each scenario. React and express yourself visually."
            />
            <FeatureCard 
              icon={Lock}
              title="Encrypted & Private"
              description="Your stories are yours. End-to-end encryption ensures your roleplay stays private."
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description }: { icon: any, title: string, description: string }) {
  return (
    <div className="p-8 rounded-2xl bg-card/50 border border-white/5 hover:border-primary/30 transition-colors">
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
        <Icon className="w-6 h-6 text-primary" />
      </div>
      <h3 className="text-xl font-bold mb-3 font-display">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}
