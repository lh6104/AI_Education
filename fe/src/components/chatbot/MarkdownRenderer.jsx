import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import styled from 'styled-components';

const MarkdownContainer = styled.div`
  line-height: 1.6;
  color: inherit;
  word-wrap: break-word;
  overflow-wrap: break-word;
  word-break: break-word;
  overflow: visible;
  width: 100%;

  /* Prevent KaTeX from causing layout jumps */
  .katex-display {
    overflow-x: auto;
    overflow-y: hidden;
    padding-bottom: 2px;
  }
  .katex-display > .katex {
    white-space: normal;
  }
  .katex {
    font-size: 1em;
  }

  /* Headings */
  h1, h2, h3, h4, h5, h6 {
    margin: 16px 0 8px 0;
    font-weight: 600;
    line-height: 1.3;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }

  h1 { font-size: 1.5em; }
  h2 { font-size: 1.3em; }
  h3 { font-size: 1.2em; }
  h4 { font-size: 1.1em; }

  /* Paragraphs */
  p {
    margin: 8px 0;
    word-wrap: break-word;
    overflow-wrap: break-word;
    word-break: break-word;
    &:first-child { margin-top: 0; }
    &:last-child { margin-bottom: 0; }
  }

  /* Lists */
  ul, ol {
    margin: 8px 0;
    padding-left: 20px;
  }

  li {
    margin: 4px 0;
  }

  /* Code blocks */
  pre {
    background-color: #f8fafc;
    border: 1px solid rgba(15, 23, 42, 0.1);
    border-radius: 8px;
    padding: 12px;
    margin: 12px 0;
    overflow-x: auto;
    font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
    font-size: 14px;
    line-height: 1.4;
  }

  /* Inline code */
  code {
    background-color: #f1f5f9;
    padding: 2px 4px;
    border-radius: 4px;
    font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
    font-size: 0.9em;
  }

  pre code {
    background: transparent;
    padding: 0;
    border-radius: 0;
  }

  /* Links */
  a {
    color: #3b82f6;
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }

  /* Strong/Bold */
  strong, b {
    font-weight: 600;
  }

  /* Emphasis/Italic */
  em, i {
    font-style: italic;
  }
`;

const MarkdownRenderer = ({ content }) => {
  // Handle empty or null content
  if (!content) {
    return null;
  }

  try {
    return (
      <MarkdownContainer>
        <ReactMarkdown 
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeKatex]}
        >
          {content}
        </ReactMarkdown>
      </MarkdownContainer>
    );
  } catch (error) {
    console.error('Error rendering markdown:', error);
    // Fallback to plain text if markdown rendering fails
    return (
      <MarkdownContainer>
        <div style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
          {content}
        </div>
      </MarkdownContainer>
    );
  }
};

export default MarkdownRenderer;