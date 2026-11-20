import React from "react";
import Link from "next/link";
import { LucideIcon, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

export interface ActionCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  tag?: string;
  badgeVariant?: "brand" | "navy" | "ochre" | "neutral" | "success";
  color?: "brand" | "navy" | "ochre";
}

export function ActionCard({
  title,
  description,
  icon: Icon,
  href,
  tag,
  badgeVariant = "brand",
  color = "brand",
}: ActionCardProps) {
  const iconColors = {
    brand: "bg-brand-400/15 text-brand-300 border-brand-400/30",
    navy: "bg-teal-500/15 text-teal-300 border-teal-500/30",
    ochre: "bg-ochre-500/15 text-ochre-300 border-ochre-500/30",
  };

  return (
    <Link
      href={href}
      className="block group focus:outline-none focus:ring-2 focus:ring-brand-400 rounded-2xl h-full"
    >
      <Card
        hoverable
        className="flex flex-col justify-between p-6 h-full relative overflow-hidden bg-[#0C231A]/85 backdrop-blur-md border border-white/[0.08] group-hover:border-brand-400/40 group-hover:-translate-y-1 group-hover:shadow-card-hover transition-all duration-200 ease-spring-gentle"
      >
        <div>
          {/* Header Row: Icon & Tag */}
          <div className="flex items-center justify-between gap-3 mb-4">
            <div
              className={cn(
                "p-3 rounded-xl border shrink-0 transition-transform group-hover:scale-105 duration-200 shadow-2xs",
                iconColors[color]
              )}
            >
              <Icon className="w-5.5 h-5.5" />
            </div>
            {tag && (
              <Badge variant={badgeVariant} className="text-[10px] py-0.5 px-2">
                {tag}
              </Badge>
            )}
          </div>

          {/* Title & Description */}
          <h3 className="text-base font-bold text-white group-hover:text-brand-300 transition-colors tracking-tight mb-2">
            {title}
          </h3>
          <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
            {description}
          </p>
        </div>

        {/* Circular Arrow Button at bottom right, matching the reference */}
        <div className="pt-4 flex justify-end items-center">
          <div className="w-8 h-8 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center text-gray-400 group-hover:bg-brand-400 group-hover:text-[#071A13] group-hover:border-brand-400 group-hover:shadow-glow-brand transition-all duration-200 ease-spring-gentle">
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </div>
        </div>
      </Card>
    </Link>
  );
}
