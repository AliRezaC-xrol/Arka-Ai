"use client";

/**
 * ARKA AI Platform — Confidential & Proprietary
 * Copyright (c) 2026 AliRezaC-xrol (https://github.com/AliRezaC-xrol/arka). All rights reserved.
 * PROPRIETARY & CLOSED-SOURCE: Unauthorized copying, modification, or distribution is strictly prohibited.
 */

import * as React from "react";
import { Check, Copy } from "lucide-react";

interface CodeBlockProps {
  language?: string;
  code: string;
}

export function CodeBlock({ language = "code", code }: CodeBlockProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback copy
      const textarea = document.createElement("textarea");
      textarea.value = code;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="my-4 overflow-hidden rounded-control border border-line bg-[#0c0c0c] text-start font-mono text-[13px] leading-6" dir="ltr">
      <div className="flex items-center justify-between border-b border-line/60 bg-[#141414] px-3.5 py-1.5 text-xs text-neutral-400">
        <span className="font-semibold uppercase tracking-wider text-neutral-300">
          {language}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5 text-[11.5px] transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none"
          title="کپی در کلیپ‌بورد"
        >
          {copied ? (
            <>
              <Check className="size-3.5 text-emerald-400" />
              <span className="text-emerald-400">کپی شد</span>
            </>
          ) : (
            <>
              <Copy className="size-3.5" />
              <span>کپی کد</span>
            </>
          )}
        </button>
      </div>
      <div className="overflow-x-auto p-4 text-neutral-200">
        <pre className="whitespace-pre font-mono">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}

/**
 * Helper to render markdown content with embedded code blocks
 */
export function FormattedMessage({ content }: { content: string }) {
  // Regex to match ```language ... ```
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  const parts: React.ReactNode[] = [];

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    const textBefore = content.substring(lastIndex, match.index);
    if (textBefore) {
      parts.push(
        <span key={`text-${lastIndex}`} className="whitespace-pre-wrap leading-7">
          {renderInlineMarkdown(textBefore)}
        </span>,
      );
    }

    const language = match[1] || "code";
    const code = match[2].trim();
    parts.push(<CodeBlock key={`code-${match.index}`} language={language} code={code} />);

    lastIndex = match.index + match[0].length;
  }

  const remainingText = content.substring(lastIndex);
  if (remainingText) {
    parts.push(
      <span key={`text-${lastIndex}`} className="whitespace-pre-wrap leading-7">
        {renderInlineMarkdown(remainingText)}
      </span>,
    );
  }

  return <div className="space-y-1">{parts}</div>;
}

function renderInlineMarkdown(text: string): React.ReactNode {
  // Bold **text**
  const boldRegex = /\*\*(.*?)\*\*/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = boldRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    parts.push(
      <strong key={match.index} className="font-semibold text-foreground">
        {match[1]}
      </strong>,
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}
