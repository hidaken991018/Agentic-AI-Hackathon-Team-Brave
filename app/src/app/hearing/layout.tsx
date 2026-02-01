import { HearingProvider } from "@/context/HearingContext";

export default function HearingLayout({ children }: { children: React.ReactNode }) {
  return <HearingProvider>{children}</HearingProvider>;
}
