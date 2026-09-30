import React, { useState, useRef, useEffect } from "react";
import styled from "styled-components";
import SendIcon from "@mui/icons-material/Send";
import AttachFileIcon from "@mui/icons-material/AttachFile";

const InputContainer = styled.div`
  display: flex;
  align-items: flex-end;
  padding: 16px 24px;
  background-color: #fff;
  border-top: 1px solid rgba(15, 23, 42, 0.1);
`;

const TextAreaWrapper = styled.div`
  flex-grow: 1;
  position: relative;
  margin-right: 12px;
`;

const StyledTextarea = styled.textarea`
  width: 100%;
  min-height: 48px;
  max-height: 150px;
  padding: 12px 16px;
  border-radius: 24px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  font-family: inherit;
  font-size: 14px;
  resize: none;
  outline: none;
  
  &:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const IconButton = styled.button`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  border: none;
  cursor: pointer;
  background-color: ${(props) => (props.disabled ? "#e0e0e0" : "var(--accent)")};
  color: white;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${(props) => (props.disabled ? "#e0e0e0" : "#2563eb")};
  }
  
  &:disabled {
    cursor: not-allowed;
  }
`;

const FileInputButton = styled.label`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  background-color: #f2f2f2;
  color: #666;
  margin-right: 8px;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #e0e0e0;
  }
  
  input {
    display: none;
  }
`;

const ChatInput = ({ onSendMessage, onFileUpload, isLoading = false }) => {
  const [message, setMessage] = useState("");
  const textAreaRef = useRef(null);

  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = "48px";
      const scrollHeight = textAreaRef.current.scrollHeight;
      textAreaRef.current.style.height = scrollHeight + "px";
    }
  }, [message]);

  const handleSubmit = () => {
    if (message.trim() && !isLoading) {
      onSendMessage(message);
      setMessage("");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0] && !isLoading) {
      onFileUpload(e.target.files[0]);
      e.target.value = ""; // Reset input
    }
  };

  return (
    <InputContainer>
      <FileInputButton>
        <input
          type="file"
          accept=".pdf,.docx,.doc,.txt,.md"
          onChange={handleFileChange}
          disabled={isLoading}
        />
        <AttachFileIcon fontSize="small" />
      </FileInputButton>
      
      <TextAreaWrapper>
        <StyledTextarea
          ref={textAreaRef}
          placeholder="Nhập câu hỏi của bạn..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          rows={1}
        />
      </TextAreaWrapper>
      
      <IconButton 
        onClick={handleSubmit} 
        disabled={!message.trim() || isLoading}
      >
        <SendIcon fontSize="small" />
      </IconButton>
    </InputContainer>
  );
};

export default ChatInput;

