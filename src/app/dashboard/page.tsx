import type { Metadata } from "next";
import { LodestarApp } from "@/components/lodestar-app";

export const metadata: Metadata = {
  title: "Dashboard | Lodestar",
  description: "Your Lodestar dashboard.",
};

export default function DashboardPage() {
  return <LodestarApp />;
}
