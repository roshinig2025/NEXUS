import { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

export function Layout({ children }: Props) {
  return (
    <div className="layout">
      <header className="header">
        <h1>Self-Optimizing Web Application</h1>
        <span className="subtitle">Problem 04</span>
      </header>
      <main className="main">{children}</main>
    </div>
  );
}
