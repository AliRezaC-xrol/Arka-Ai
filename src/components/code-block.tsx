"use client";

/**
 * ARKA AI Platform — Confidential & Proprietary
 * Copyright (c) 2026 AliRezaC-xrol (https://github.com/AliRezaC-xrol/arka). All rights reserved.
 * PROPRIETARY & CLOSED-SOURCE: Unauthorized copying, modification, or distribution is strictly prohibited.
 */

import * as React from "react";
import { Check, Code2, Copy, Eye } from "lucide-react";

import { cn } from "@/lib/utils";

interface CodeBlockProps {
  language?: string;
  code: string;
}

/** Renders HTML/SVG live inside a locked-down iframe. */
function PreviewFrame({ doc }: { doc: string }) {
  return (
    <iframe
      title="پیش‌نمایش"
      srcDoc={doc}
      // No allow-same-origin: the preview can run its own scripts but can never
      // reach the parent document, its cookies or its storage.
      sandbox="allow-scripts allow-modals"
      referrerPolicy="no-referrer"
      loading="lazy"
      className="h-[22rem] w-full border-0 bg-white"
    />
  );
}

export function CodeBlock({ language = "code", code }: CodeBlockProps) {
  const [copied, setCopied] = React.useState(false);

  const isHtml = /^(html|htm)$/i.test(language);
  const isSvg = /^svg$/i.test(language) || /^\s*<svg[\s>]/i.test(code);
  const canPreview = isHtml || isSvg;

  const [showPreview, setShowPreview] = React.useState(canPreview);

  /** Wrap a bare SVG fragment in a minimal document so it centres nicely. */
  const previewDoc = React.useMemo(() => {
    if (isSvg && !isHtml) {
      return `<!doctype html><html><head><meta charset="utf-8"><style>
        html,body{margin:0;height:100%;background:#ffffff;display:grid;place-items:center}
        svg{max-width:92%;max-height:92%}
      </style></head><body>${code}</body></html>`;
    }
    return code;
  }, [code, isHtml, isSvg]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = code;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="my-4 overflow-hidden rounded-control border border-line bg-[#0c0c0c] text-start font-mono text-[13px] leading-6"
      dir="ltr"
    >
      <div className="flex items-center justify-between border-b border-line/60 bg-[#141414] px-3.5 py-1.5 text-xs text-neutral-400">
        <span className="font-semibold uppercase tracking-wider text-neutral-300">{language}</span>

        <div className="flex items-center gap-1">
          {canPreview && (
            <button
              type="button"
              onClick={() => setShowPreview((v) => !v)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5 text-[11.5px] transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none",
                showPreview && "text-white",
              )}
              title={showPreview ? "نمایش کد" : "نمایش پیش‌نمایش زنده"}
            >
              {showPreview ? <Code2 className="size-3.5" /> : <Eye className="size-3.5" />}
              <span>{showPreview ? "نمایش کد" : "پیش‌نمایش"}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5 text-[11.5px] transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none"
            title="کپی در کلیپ‌بورد"
          >
            {copied ? (
              <>
                <Check className="copy-pop size-3.5 text-emerald-400" />
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
      </div>

      {canPreview && showPreview ? (
        <PreviewFrame doc={previewDoc} />
      ) : (
        <div className="overflow-x-auto p-4 text-neutral-200">
          <pre className="whitespace-pre font-mono">
            <code>{code}</code>
          </pre>
        </div>
      )}
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

  /**
   * Push a plain-text run, pulling any bare `<svg>…</svg>` out of it and
   * rendering it through CodeBlock so it gets a live preview plus a copy
   * button. Models often emit SVG without a fenced block.
   */
  const pushText = (text: string, keyBase: string) => {
    const svgRegex = /<svg[\s\S]*?<\/svg>/gi;
    let cursor = 0;
    let i = 0;
    let svgMatch: RegExpExecArray | null;

    while ((svgMatch = svgRegex.exec(text)) !== null) {
      const before = text.substring(cursor, svgMatch.index);
      if (before.trim()) {
        parts.push(
          <span key={`${keyBase}-t${i}`} className="whitespace-pre-wrap leading-7">
            {renderInlineMarkdown(before)}
          </span>,
        );
      }
      parts.push(
        <CodeBlock key={`${keyBase}-svg${i}`} language="svg" code={svgMatch[0].trim()} />,
      );
      cursor = svgMatch.index + svgMatch[0].length;
      i++;
    }

    const after = text.substring(cursor);
    if (after.trim()) {
      parts.push(
        <span key={`${keyBase}-end`} className="whitespace-pre-wrap leading-7">
          {renderInlineMarkdown(after)}
        </span>,
      );
    }
  };

  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let blockIndex = 0;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    const textBefore = content.substring(lastIndex, match.index);
    if (textBefore.trim()) {
      pushText(textBefore, `pre-${blockIndex}`);
    }

    const language = match[1] || "code";
    const code = match[2].trim();
    parts.push(<CodeBlock key={`code-${blockIndex}`} language={language} code={code} />);

    lastIndex = match.index + match[0].length;
    blockIndex++;
  }

  const remainingText = content.substring(lastIndex);
  if (remainingText.trim()) {
    pushText(remainingText, `tail-${blockIndex}`);
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
