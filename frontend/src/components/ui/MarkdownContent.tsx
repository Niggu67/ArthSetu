"use client";

import React, { useMemo } from "react";
import { marked } from "marked";

export interface MarkdownContentProps {
  content: string;
  className?: string;
}

export function MarkdownContent({ content, className = "" }: MarkdownContentProps) {
  const html = useMemo(() => {
    if (!content) return "";
    try {
      return marked.parse(content, {
        async: false,
        breaks: true,
        gfm: true,
      }) as string;
    } catch {
      return content;
    }
  }, [content]);

  return (
    <div
      className={`ai-markdown-content ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
