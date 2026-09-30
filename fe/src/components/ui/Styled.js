import { createGlobalStyle } from "styled-components";

export const GlobalStyle = createGlobalStyle`
  :root{--sidebar-width:240px;--gap:18px;--bg:#f6fbff;--muted:#6b7280;--card:#ffffff;--accent:#3b82f6}
  *{box-sizing:border-box}
  html,body,#root{height:100%;margin:0;font-family:Inter,Segoe UI,Arial,sans-serif}
  body{background:repeating-linear-gradient(90deg,rgba(235,245,255,0.7)0px,rgba(245,250,255,0.7)20px,rgba(255,255,255,0.7)40px),var(--bg);}
  a.more{color:var(--accent);font-size:13px}
`;
