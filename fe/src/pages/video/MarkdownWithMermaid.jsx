import React, { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import mermaid from "mermaid";

const MarkdownWithMermaid = ({ content }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const blocks = containerRef.current.querySelectorAll("code.language-mermaid");
    blocks.forEach((block) => {
      const parent = block.parentElement;
      const code = block.textContent;
      const wrapper = document.createElement("div");
      wrapper.className = "mermaid";
      wrapper.textContent = code;
      parent.replaceWith(wrapper);
      mermaid.init(undefined, wrapper);
    });
  }, [content]);

  return (
    <div ref={containerRef}>
      <ReactMarkdown
        children={content}
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex, rehypeRaw]}
      />
    </div>
  );
};

export default MarkdownWithMermaid;
