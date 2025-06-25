import { cn } from "@/lib/utils";
import type { SVGProps } from "react";

export function AppLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <div className="flex items-center gap-2" {...props}>
      <svg width="125" height="50" viewBox="0 0 125 50" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("h-auto", props.className)} style={{ width: '100px' }}>
        <rect width="125" height="50" fill="black"/>
        <path d="M0 25H125V50H0V25Z" fill="#E40000"/>
        <text x="10" y="18" fontFamily="Poppins, sans-serif" fontSize="16" fontWeight="bold" fill="white">AGRO</text>
        <text x="10" y="40" fontFamily="Poppins, sans-serif" fontSize="16" fontWeight="bold" fill="white">BOX</text>
      </svg>
      <span className="font-headline text-2xl font-bold text-foreground group-data-[sidebar=sidebar]:hidden">LAB</span>
    </div>
  );
}
