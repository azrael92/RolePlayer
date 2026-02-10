import { storage } from "./storage";

export async function seedDatabase() {
  const scenarios = await storage.getScenarios();
  if (scenarios.length > 0) return;

  console.log("Seeding database...");

  // Create scenarios
  const cyberpunk = await storage.createScenario({
    title: "Cyberpunk Heist",
    description: "In the year 2077, a group of runners attempts the impossible.",
    genre: "Sci-Fi",
    maturityRating: "R",
    tags: ["cyberpunk", "action", "heist"],
    isPublic: true,
  });

  const fantasy = await storage.createScenario({
    title: "The Dragon's Lair",
    description: "Adventurers seek the treasure of the ancient dragon.",
    genre: "Fantasy",
    maturityRating: "PG-13",
    tags: ["fantasy", "adventure", "dragons"],
    isPublic: true,
  });

  // Create scenes
  await storage.createScene({
    scenarioId: cyberpunk.id,
    title: "Neon Streets",
    backgroundImageUrl: "https://images.unsplash.com/photo-1555680202-c86f0e12f086?q=80&w=2070&auto=format&fit=crop",
    order: 1,
  });

  await storage.createScene({
    scenarioId: cyberpunk.id,
    title: "The Safehouse",
    backgroundImageUrl: "https://images.unsplash.com/photo-1605806616949-1e87b487bc2a?q=80&w=1974&auto=format&fit=crop",
    order: 2,
  });

  await storage.createScene({
    scenarioId: fantasy.id,
    title: "Tavern",
    backgroundImageUrl: "https://images.unsplash.com/photo-1574067339753-469c43e2a747?q=80&w=2070&auto=format&fit=crop",
    order: 1,
  });

  console.log("Database seeded successfully!");
}
