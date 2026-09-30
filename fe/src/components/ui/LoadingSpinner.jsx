import React from "react";
import styled, { keyframes } from "styled-components";

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const SpinnerWrapper = styled.div`
  display: inline-block;
  width: ${(props) => props.size || "20px"};
  height: ${(props) => props.size || "20px"};
  margin-right: 8px;
`;

const SpinnerCircle = styled.div`
  width: 100%;
  height: 100%;
  border: 2px solid transparent;
  border-top-color: currentColor;
  border-radius: 50%;
  animation: ${spin} 0.8s linear infinite;
`;

const LoadingSpinner = ({ size }) => (
  <SpinnerWrapper size={size}>
    <SpinnerCircle />
  </SpinnerWrapper>
);

export default LoadingSpinner;
