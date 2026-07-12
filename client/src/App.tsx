import Admin from "./pages/Admin";
import Kds from "./pages/Kds";
import Kiosk from "./pages/Kiosk";
import Login from "./pages/Login";
import TokenDisplay from "./pages/TokenDisplay";

import SuperAdmin from "./pages/SuperAdmin";

export default function App() {
  const path = window.location.pathname;

  if (path.startsWith("/super-admin")) return <SuperAdmin />;
  if (path.startsWith("/admin")) return <Admin />;
  if (path.startsWith("/kds")) return <Kds />;
  if (path.startsWith("/display")) return <TokenDisplay />;
  if (path.startsWith("/login")) return <Login />;
  return <Kiosk />;
}
