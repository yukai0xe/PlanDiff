import { BrowserRouter, Routes, Route } from "react-router-dom";
import RouteComparePage from "./pages/routeCompare";
import RouteOverviewPage from "./pages/routeOverview";
import RouteMappingPage from "./pages/routeMapping";
import NavBarBlock from "@/components/NavbarBlock";

import { Toaster } from "react-hot-toast";
import { useEffect } from "react";

function App() {
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  return (
    <BrowserRouter>
      <main className="p-6">
        <Routes>
          <Route path="/" element={<RouteOverviewPage />} />
          <Route path="/mapping" element={<RouteMappingPage/>} />
          <Route path="/compare" element={<RouteComparePage />} />
        </Routes>
      </main>
      <footer>
        © {new Date().getFullYear()} created by yukai0xe
      </footer>
      <NavBarBlock />
      <Toaster
        toastOptions={{
          success: {
            position: "bottom-right",
            iconTheme: {
              primary: "var(--success-color)",
              secondary: "var(--white)",
            },
          },
          error: {
            position: "top-center",
            style: {
              maxWidth: "500px",
              background: "var(--tertiary-color)",
              color: "var(--white)",
              fontWeight: 600,
              fontSize: "15px",
              padding: "12px 18px",
              borderRadius: "10px",
              boxShadow: "0 4px 15px rgba(0,0,0,0.25)",
            },
          },
        }}
      />
    </BrowserRouter>
  );
}

export default App;
