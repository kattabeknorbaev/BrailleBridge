import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";


const removeLovableBadge = () => {
  const badge = document.getElementById("lovable-badge");
  if (badge) badge.remove();
};


removeLovableBadge();
setInterval(removeLovableBadge, 100);

createRoot(document.getElementById("root")!).render(<App />);
