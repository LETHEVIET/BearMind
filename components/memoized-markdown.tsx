import { marked } from "marked";
import React, { memo, useMemo, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Check, Copy } from "lucide-react";
import { Button } from "./ui/button";
import { ScrollArea, ScrollBar } from "./ui/scroll-area";
import { TabDisplayWithHover } from "./tab-display-with-hover";
import {
  CodeBlock,
  CodeBlockCode,
  CodeBlockGroup,
} from "./ui/code-block";
import { useAppContext } from "./AppContext";

const Pre = ({ children, language, codeString }) => {
  const [copied, setCopied] = useState(false);
  const { ui } = useAppContext();

  const handleCopy = () => {
    navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <CodeBlock className="my-2 w-full max-w-full">
      <CodeBlockGroup className="border-border border-b py-1 pr-2 pl-2s">
        <div className="flex items-center gap-2">
          <div className="text-primary italic rounded px-2 text-xs font-medium">
            {language || "text"}
          </div>
        </div>
        <Button
          variant="ghost"
          size="no"
          onClick={handleCopy}
        >
          {copied ? (
            <Check className="h-3 w-3 text-green-500" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </Button>
      </CodeBlockGroup>
      <CodeBlockCode code={codeString} language={language || "text"} theme={`github-${ui.theme}`} />
    </CodeBlock>
  );
};

const MemoizedMarkdownBlock = memo(
  ({ content, blockKey, tabs }) => {
    return (
      <Markdown
        rehypePlugins={[rehypeRaw]}
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h1 className="text-3xl font-bold my-4 text-foreground">{children}</h1>,
          h2: ({ children }) => <h2 className="text-2xl font-bold my-3 text-foreground">{children}</h2>,
          h3: ({ children }) => <h3 className="text-xl font-bold my-2 text-foreground">{children}</h3>,
          h4: ({ children }) => <h4 className="text-lg font-bold my-2 text-foreground">{children}</h4>,
          h5: ({ children }) => <h5 className="text-base font-bold my-1 text-foreground">{children}</h5>,
          h6: ({ children }) => <h6 className="text-sm font-bold my-1 text-foreground">{children}</h6>,
          
          ul: ({ children }) => <ul className="list-disc pl-6 my-2 text-foreground">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-6 my-2 text-foreground">{children}</ol>,
          li: ({ children }) => <li className="my-1 text-foreground">{children}</li>,
          
          blockquote: ({ children }) => <blockquote className="border-l-4 border-border pl-4 py-1 my-2 italic bg-muted text-foreground">{children}</blockquote>,
          
          a: ({ href, children }) => <a href={href} className="text-accent-foreground hover:underline">{children}</a>,
          
          hr: () => <hr className="my-4 border-border" />,
          
          // Custom text renderer to detect and render tab references
          p({ children }) {
            
            // Helper function to process a string for TAB references
            const processString = (str, keyPrefix = '') => {
              const tabRegex = /TAB-(\d+)/g;
              const parts = [];
              let lastIndex = 0;
              let match;
              
              // Reset regex state
              tabRegex.lastIndex = 0;
              
              while ((match = tabRegex.exec(str)) !== null) {
                // Add text before the match
                if (match.index > lastIndex) {
                  parts.push(str.substring(lastIndex, match.index));
                }
                
                // Extract the tab ID and find the actual tab in the tabs array
                const tabId = Number(match[1]);
                const tab = tabs?.find(t => t.id === tabId) || {
                  id: tabId,
                  title: `Tab ${tabId}`,
                  url: `#tab-${tabId}`,
                  favicon: null
                };
                
                parts.push(
                  <div key={`${keyPrefix}tab-ref-${tabId}`} className="inline-block">
                    <TabDisplayWithHover tab={tab} />
                  </div>
                );
                
                lastIndex = match.index + match[0].length;
              }
              
              // If we found any matches
              if (parts.length > 0) {
                // Add any remaining text
                if (lastIndex < str.length) {
                  parts.push(str.substring(lastIndex));
                }
                
                return parts;
              }
              
              // No matches found, return the original string
              return [str];
            };
            
            // Handle children based on its type
            if (Array.isArray(children)) {
              // Process each child
              const processedChildren = children.flatMap((child, index) => {
                if (typeof child === 'string') {
                  return processString(child, `array-${index}-`);
                }
                return child;
              });
              
              return <p className="text-foreground">{processedChildren}</p>;
            } else if (typeof children === 'string') {
              // Process single string
              const processed = processString(children);
              return <p className="text-foreground">{processed}</p>;
            }
            
            // Default case: just return children as is
            return <p className="text-foreground">{children}</p>;
          },
          code({ node, inline, className = "blog-code", children, ...props }) {
            const match = /language-(\w+)/.exec(className || "");
            const codeString = String(children).replace(/\n$/, "");
            return !inline && match ? (
              <Pre language={match[1]} codeString={codeString} />
            ) : (
              <code className="bg-muted text-foreground px-1.5 py-0.5 rounded-sm" {...props}>
                {codeString}
              </code>
            );
          },
        }}
      >
        {content}
      </Markdown>
    );
  },
  (prevProps, nextProps) => prevProps.content === nextProps.content
);

MemoizedMarkdownBlock.displayName = "MemoizedMarkdownBlock";

function parseMarkdownIntoBlocks(markdown) {
  const tokens = marked.lexer(markdown);
  return tokens.map((token) => token.raw);
}

export const MemoizedMarkdown = memo(({ content, id, tabs}) => {
  const blocks = useMemo(() => parseMarkdownIntoBlocks(content), [content]);

  return blocks.map((block, index) => (
    <MemoizedMarkdownBlock
      content={block}
      blockKey={`${id}-block_${index}`}
      key={`${id}-block_${index}`}
      tabs={tabs}
    />
  ));
});

MemoizedMarkdown.displayName = "MemoizedMarkdown";
