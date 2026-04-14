import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
// Database is managed via Supabase Cloud

createRoot(document.getElementById("root")!).render(<App />);
