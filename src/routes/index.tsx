import { createFileRoute } from "@tanstack/react-router";
import { StandApp } from "@/components/stand/stand-app";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <StandApp />;
}
