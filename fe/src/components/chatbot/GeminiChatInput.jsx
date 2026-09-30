import React, { useState, useRef, useEffect } from "react";
import styled from "styled-components";
import SendIcon from "@mui/icons-material/Send";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import DescriptionIcon from "@mui/icons-material/Description";
import CloseIcon from "@mui/icons-material/Close";

const ChatContainer = styled.div`
  background: #f8f9fa;
  padding: 0 24px 24px 24px;
  max-width: 900px;
  margin: 0 auto;
  width: 100%;
`;

const AttachedFiles = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
`;

const FileChip = styled.div`
  display: flex;
  align-items: center;
  background: #e8f0fe;
  border: 1px solid #dadce0;
  border-radius: 12px;
  padding: 8px 12px;
  font-size: 14px;
  color: #1a73e8;
  max-width: 250px;
  
  .file-icon {
    margin-right: 8px;
    font-size: 18px;
    flex-shrink: 0;
  }
  
  .file-info {
    flex: 1;
    min-width: 0;
  }
  
  .file-name {
    max-width: 180px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-weight: 500;
  }
  
  .file-size {
    font-size: 12px;
    color: #5f6368;
    margin-top: 2px;
  }
  
  .remove-btn {
    background: none;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    color: #5f6368;
    padding: 4px;
    border-radius: 50%;
    margin-left: 8px;
    flex-shrink: 0;
    
    &:hover {
      background: #dadce0;
    }
  }
`;

const ImagePreviewChip = styled.div`
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #dadce0;
  
  img {
    display: block;
    max-width: 150px;
    max-height: 100px;
    object-fit: cover;
  }
  
  .remove-btn {
    position: absolute;
    top: 4px;
    right: 4px;
    background: rgba(0, 0, 0, 0.6);
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    color: white;
    padding: 4px;
    border-radius: 50%;
    
    &:hover {
      background: rgba(0, 0, 0, 0.8);
    }
  }
  
  .file-name {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: rgba(0, 0, 0, 0.6);
    color: white;
    font-size: 11px;
    padding: 4px 8px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

const InputSection = styled.div`
  display: flex;
  align-items: flex-end;
  width: 100%;
`;

const TextInputWrapper = styled.div`
  width: 100%;
  background: white;
  border-radius: 24px;
  border: 1px solid #dadce0;
  overflow: hidden;
  position: relative;
  
  &:focus-within {
    border-color: #dadce0;
    box-shadow: 0 1px 6px rgba(32, 33, 36, 0.28);
  }
`;

const StyledTextarea = styled.textarea`
  width: 100%;
  min-height: 52px;
  max-height: 120px;
  padding: 16px 60px 16px 20px;
  border: none;
  outline: none;
  font-family: inherit;
  font-size: 16px;
  resize: none;
  background: transparent;
  
  &::placeholder {
    color: #9aa0a6;
  }
`;

const InputActions = styled.div`
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  gap: 4px;
`;

const ActionButton = styled.button`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: ${props => props.primary ? '#1a73e8' : 'transparent'};
  color: ${props => props.primary ? 'white' : '#5f6368'};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.primary ? '#1557b0' : '#f1f3f4'};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;



const HiddenFileInput = styled.input`
  display: none;
`;

const GeminiChatInput = ({ onSendMessage, onFileUpload, isLoading = false }) => {
  const [message, setMessage] = useState("");
  const [attachedFiles, setAttachedFiles] = useState([]);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [message]);

  const handleSubmit = () => {
    if (message.trim() && !isLoading && onSendMessage) {
      onSendMessage(message.trim());
      setMessage("");
      setAttachedFiles([]);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      // Add file to attached files list
      const fileObj = {
        id: Date.now() + Math.random(),
        file,
        name: file.name,
        type: file.type
      };
      setAttachedFiles(prev => [...prev, fileObj]);
      
      // Upload file
      if (onFileUpload) {
        onFileUpload(file);
      }
    });
    e.target.value = ""; // Reset input
  };

  const removeFile = (fileId) => {
    setAttachedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const getFileIcon = (fileType) => {
    if (fileType?.includes('pdf')) {
      return <PictureAsPdfIcon className="file-icon" style={{ color: '#ea4335' }} />;
    }
    return <DescriptionIcon className="file-icon" style={{ color: '#4285f4' }} />;
  };

  return (
    <ChatContainer>
      {attachedFiles.length > 0 && (
        <AttachedFiles>
          {attachedFiles.map(file => (
            <FileChip key={file.id}>
              {getFileIcon(file.type)}
              <span className="file-name" title={file.name}>
                {file.name}
              </span>
              <button 
                className="remove-btn" 
                onClick={() => removeFile(file.id)}
                type="button"
              >
                <CloseIcon style={{ fontSize: '14px' }} />
              </button>
            </FileChip>
          ))}
        </AttachedFiles>
      )}
      
      <InputSection>
        <TextInputWrapper>
          <StyledTextarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Nhập câu hỏi của bạn..."
            disabled={isLoading}
          />
          <InputActions>
            <ActionButton
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              title="Attach file"
            >
              <AttachFileIcon style={{ fontSize: '20px' }} />
            </ActionButton>
            <ActionButton
              primary
              onClick={handleSubmit}
              disabled={!message.trim() || isLoading}
              title="Send message"
            >
              <SendIcon style={{ fontSize: '20px' }} />
            </ActionButton>
          </InputActions>
        </TextInputWrapper>
      </InputSection>
      
      <HiddenFileInput
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.doc,.txt,.md"
        onChange={handleFileSelect}
        multiple
      />
    </ChatContainer>
  );
};

export default GeminiChatInput;