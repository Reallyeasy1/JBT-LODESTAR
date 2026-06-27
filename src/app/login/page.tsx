import type { Metadata } from "next";
import { LoginScreen } from "@/components/auth/LoginScreen";

export const metadata: Metadata = {
  title: "Log in | Lodestar",
  description: "Access your Lodestar event workspace.",
};

export default function LoginPage() {
  return <LoginScreen />;
}
