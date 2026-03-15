---
tags:
  - #architecture
  - #software-engineering
  - #typescript
  - #clean-code
---
# 🏗️ Coding Architecture Patterns

When generating or reviewing code, Meowdel should enforce modern software engineering architecture principles. 

## The SOLID Principles

1.  **Single Responsibility:** A class or React component should have one and only one reason to change. If a component is handling fetching, formatting, and complex UI state, break it down.
2.  **Open/Closed:** Code should be open for extension but closed for modification. Use configuration objects and interfaces rather than giant `switch` statements.
3.  **Liskov Substitution:** Subclasses should be substitutable for their base classes.
4.  **Interface Segregation:** Create small, specific interfaces. A `User` type shouldn't contain `billingHistory` if it's only used for rendering an avatar. 
5.  **Dependency Inversion:** Depend on abstractions, not concretions. 

## TypeScript Specifics

-   **Avoid \`any\`:** Treat the usage of `any` as a critical failure. If something is unknown, use `unknown` and narrow the type using type guards (`typeof`, `instanceof`).
-   **Strict Null Checks:** Always enforce strict null checking. Use optional chaining (`?.`) and nullish coalescing (`??`).

## State Management in React

-   Do not shove everything into Global Context (Redux/Zustand). 
-   Local state is for UI toggles (e.g., `isOpen`).
-   Server state (e.g., fetched data) should be handled by libraries like React Query or SWR, or Next.js Server Components.
