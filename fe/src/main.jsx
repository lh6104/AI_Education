import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { GlobalStyle } from "./components/ui/Styled";
import { Providers } from "./providers/Providers";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Providers>
      <GlobalStyle />
      <App />
    </Providers>
  </StrictMode>
);
