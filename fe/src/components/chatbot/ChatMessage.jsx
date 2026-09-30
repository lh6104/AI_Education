import React from "react";
import styled from "styled-components";
import { Avatar } from "@mui/material";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import DescriptionIcon from "@mui/icons-material/Description";
import ImageIcon from "@mui/icons-material/Image";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import MarkdownRenderer from "./MarkdownRenderer";

const MessageContainer = styled.div`
  display: flex;
  margin-bottom: 24px;
  width: 100%;
  justify-content: ${(props) => (props.$isUser ? "flex-end" : "flex-start")};
`;

const MessageContent = styled.div`
  max-width: ${(props) => (props.$isUser ? "70%" : "90%")};
  padding: ${(props) => (props.$isUser ? "16px 24px" : "20px")};
  border-radius: ${(props) => (props.$isUser ? "24px" : "0")};
  background-color: ${(props) =>
    props.$isUser ? "#1a73e8" : "transparent"};
  color: ${(props) => (props.$isUser ? "#ffffff" : "#202124")};
  box-shadow: ${(props) => (props.$isUser ? "0 2px 8px rgba(26, 115, 232, 0.2)" : "none")};
  word-wrap: break-word;
  overflow-wrap: break-word;
  word-break: break-word;
  overflow: hidden;
  overflow-x: auto;
  font-size: 16px;
  line-height: 1.5;
`;

const SourcesContainer = styled.div`
  margin-top: 12px;
  font-size: 12px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  padding-top: 8px;
  color: #6b7280;
`;

const Source = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 4px;
  
  &:before {
    content: "📄";
    margin-right: 5px;
  }
`;

const FollowUpsWrap = styled.div`
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
`;

const FollowUpButton = styled.button`
  background: #eef2ff;
  color: #374151;
  border: 1px solid rgba(59, 130, 246, 0.25);
  padding: 6px 10px;
  border-radius: 9999px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s ease;
  &:hover { background: #e0e7ff; }
`;

// File Attachment Styles
const AttachmentsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: ${props => props.$hasContent ? '12px' : '0'};
`;

const FileAttachment = styled.div`
  display: flex;
  align-items: center;
  background: ${props => props.$isUser ? 'rgba(255,255,255,0.15)' : '#f8fafc'};
  border: 1px solid ${props => props.$isUser ? 'rgba(255,255,255,0.2)' : '#e2e8f0'};
  border-radius: 12px;
  padding: 10px 14px;
  max-width: 280px;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.$isUser ? 'rgba(255,255,255,0.2)' : '#f1f5f9'};
  }
`;

const FileIconWrapper = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: ${props => props.$bgColor || '#e2e8f0'};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  flex-shrink: 0;
`;

const FileInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const FileName = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: ${props => props.$isUser ? '#fff' : '#1e293b'};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const FileSize = styled.div`
  font-size: 12px;
  color: ${props => props.$isUser ? 'rgba(255,255,255,0.7)' : '#64748b'};
  margin-top: 2px;
`;

// Image Preview Styles
const ImagePreviewContainer = styled.div`
  margin-bottom: ${props => props.$hasContent ? '12px' : '0'};
  max-width: 300px;
`;

const ImagePreview = styled.img`
  max-width: 100%;
  max-height: 200px;
  border-radius: 12px;
  object-fit: cover;
  cursor: pointer;
  transition: transform 0.2s ease;
  
  &:hover {
    transform: scale(1.02);
  }
`;

// System message style
const SystemMessageContainer = styled.div`
  display: flex;
  justify-content: center;
  margin: 16px 0;
`;

const SystemMessageContent = styled.div`
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 12px;
  padding: 12px 16px;
  font-size: 14px;
  color: #0369a1;
  max-width: 80%;
  text-align: center;
`;

// Helper functions
const getFileIcon = (fileType, fileName) => {
  const ext = fileName?.split('.').pop()?.toLowerCase();
  
  if (fileType?.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
    return { icon: ImageIcon, color: '#10b981', bgColor: '#d1fae5' };
  }
  if (fileType?.includes('pdf') || ext === 'pdf') {
    return { icon: PictureAsPdfIcon, color: '#ef4444', bgColor: '#fee2e2' };
  }
  if (['doc', 'docx'].includes(ext) || fileType?.includes('word')) {
    return { icon: DescriptionIcon, color: '#3b82f6', bgColor: '#dbeafe' };
  }
  if (['txt', 'md'].includes(ext)) {
    return { icon: DescriptionIcon, color: '#6366f1', bgColor: '#e0e7ff' };
  }
  return { icon: InsertDriveFileIcon, color: '#64748b', bgColor: '#f1f5f9' };
};

const formatFileSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const isImageFile = (file) => {
  if (!file) return false;
  const ext = file.name?.split('.').pop()?.toLowerCase();
  return file.type?.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext);
};

function extractFollowUps(markdown) {
  if (!markdown || typeof markdown !== "string") return [];
  const lines = markdown.split(/\r?\n/);
  // Find a line indicating follow-ups. Accept exact key from system prompt: Follow_Up_Questions
  const headerIdx = lines.findIndex((l) => (
    /^(#+\s*)?follow_?up_?questions\s*:?$/i.test(l.trim()) ||
    /^(#+\s*)?(follow[_\-\s]?up|câu hỏi tiếp theo)\s*:?/i.test(l.trim())
  ));
  if (headerIdx === -1) return [];
  const items = [];
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const t = lines[i].trim();
    if (!t) break; // stop at blank line
    const m = t.match(/^[-*\u2022]\s+(.*)$/); // bullets - * •
    if (m && m[1]) {
      const cleaned = m[1].replace(/^\[(.*)\]\(.*\)$/,'$1').trim();
      if (cleaned) items.push(cleaned);
    } else if (/^\d+\./.test(t)) {
      items.push(t.replace(/^\d+\.\s+/, "").trim());
    } else if (/^#/.test(t)) {
      break; // next heading
    }
  }
  return items.slice(0, 6);
}

function stripFollowUps(markdown) {
  if (!markdown || typeof markdown !== "string") return markdown;
  const lines = markdown.split(/\r?\n/);
  const headerIdx = lines.findIndex((l) => (
    /^(#+\s*)?follow_?up_?questions\s*:?$/i.test(l.trim()) ||
    /^(#+\s*)?(follow[_\-\s]?up|câu hỏi tiếp theo)\s*:?/i.test(l.trim())
  ));
  if (headerIdx === -1) return markdown;
  const result = [];
  for (let i = 0; i < lines.length; i++) {
    if (i === headerIdx) {
      // Skip header and subsequent list lines
      i++;
      for (; i < lines.length; i++) {
        const t = lines[i].trim();
        if (!t) break; // stop on blank line
        if (/^#/.test(t)) { i--; break; } // next heading
        if (/^[-*\u2022]|^\d+\./.test(t)) continue; // skip bullets/numbers
        i--; break; // non-list content
      }
      continue;
    }
    result.push(lines[i]);
  }
  return result.join("\n").trim();
}

const ChatMessage = ({ message, isUser, onFollowUpClick }) => {
  const followUps = !isUser ? extractFollowUps(message?.content) : [];
  const cleanedContent = !isUser ? stripFollowUps(message?.content) : message?.content;
  const attachments = message?.attachments || [];
  const hasTextContent = cleanedContent && cleanedContent.trim();
  
  // Handle system messages differently
  if (message?.sender === 'system') {
    return (
      <SystemMessageContainer>
        <SystemMessageContent>
          {message.content}
        </SystemMessageContent>
      </SystemMessageContainer>
    );
  }

  // Render file attachment component
  const renderFileAttachment = (file, index) => {
    const { icon: IconComponent, color, bgColor } = getFileIcon(file.type, file.name);
    
    // Check if it's an image with preview
    if (isImageFile(file) && file.previewUrl) {
      return (
        <ImagePreviewContainer key={index} $hasContent={hasTextContent}>
          <ImagePreview 
            src={file.previewUrl} 
            alt={file.name}
            onClick={() => window.open(file.previewUrl, '_blank')}
          />
          <FileInfo style={{ marginTop: '8px' }}>
            <FileName $isUser={isUser}>{file.name}</FileName>
            {file.size && <FileSize $isUser={isUser}>{formatFileSize(file.size)}</FileSize>}
          </FileInfo>
        </ImagePreviewContainer>
      );
    }
    
    // Regular file attachment
    return (
      <FileAttachment key={index} $isUser={isUser}>
        <FileIconWrapper $bgColor={isUser ? 'rgba(255,255,255,0.2)' : bgColor}>
          <IconComponent style={{ color: isUser ? '#fff' : color, fontSize: 22 }} />
        </FileIconWrapper>
        <FileInfo>
          <FileName $isUser={isUser} title={file.name}>{file.name}</FileName>
          {file.size && <FileSize $isUser={isUser}>{formatFileSize(file.size)}</FileSize>}
        </FileInfo>
      </FileAttachment>
    );
  };

  return (
    <MessageContainer $isUser={isUser}>
      <Avatar 
        src={isUser ? "/avatar-1.svg" : "/logo.png"} 
        alt={isUser ? "User" : "AI"}
        sx={{ width: 36, height: 36 }}
      />
      <MessageContent $isUser={isUser}>
        {/* Render attachments first */}
        {attachments.length > 0 && (
          <AttachmentsContainer $hasContent={hasTextContent}>
            {attachments.map((file, index) => renderFileAttachment(file, index))}
          </AttachmentsContainer>
        )}
        
        {/* Render text content */}
        {isUser ? (
          // For user messages, render as plain text
          hasTextContent && <div style={{ whiteSpace: 'pre-wrap' }}>{message.content}</div>
        ) : (
          // For AI messages, render as markdown (without Follow_Up_Questions section)
          hasTextContent && <MarkdownRenderer content={cleanedContent} />
        )}
        
        {!isUser && message.sources && message.sources.length > 0 && (
          <SourcesContainer>
            <div style={{ fontWeight: "600", marginBottom: "4px" }}>Nguồn tham khảo:</div>
            {message.sources.map((source, index) => (
              <Source key={index}>
                {source.title || source.source}
              </Source>
            ))}
          </SourcesContainer>
        )}

        {!isUser && followUps.length > 0 && (
          <FollowUpsWrap>
            {followUps.map((q, idx) => (
              <FollowUpButton key={idx} onClick={() => onFollowUpClick && onFollowUpClick(q)}>
                {q}
              </FollowUpButton>
            ))}
          </FollowUpsWrap>
        )}
      </MessageContent>
    </MessageContainer>
  );
};

export default ChatMessage;

