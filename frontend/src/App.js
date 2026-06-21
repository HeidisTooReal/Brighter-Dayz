import React, { useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import api from "@/lib/api";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import AuthPage from "@/pages/AuthPage";
import Profiles from "@/pages/Profiles";
import KidHome from "@/pages/KidHome";
import ChatBuddy from "@/pages/ChatBuddy";
import Breathe from "@/pages/Breathe";
import StoryTime from "@/pages/StoryTime";
import Affirmations from "@/pages/Affirmations";
import Games from "@/pages/Games";
import Badges from "@/pages/Badges";
import Crisis from "@/pages/Crisis";
import ParentDashboard from "@/pages/ParentDashboard";

function Loading() {
  return <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7]"><Loader2 className="h-10 w-10 animate-spin text-[#457B9D]" /></div>;
}

function Protected({ children }) {
  const { user } = useAuth();
  if (user === null) return <Loading />;
  if (!user) return <Navigate to="/" replace />;
  return children;
}

function TeenHome() {
  const navigate = useNavigate();
  useEffect(() => {
    api.get("/children").then((r) => {
      if (r.data && r.data[0]) navigate(`/kid/${r.data[0].id}`, { replace: true });
    });
  }, [navigate]);
  return <Loading />;
}

function Root() {
  const { user } = useAuth();
  if (user === null) return <Loading />;
  if (!user) return <AuthPage />;
  if (user.role === "teen") return <TeenHome />;
  return <Profiles />;
}

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Root />} />
            <Route path="/parent" element={<Protected><ParentDashboard /></Protected>} />
            <Route path="/kid/:childId" element={<Protected><KidHome /></Protected>} />
            <Route path="/kid/:childId/chat" element={<Protected><ChatBuddy /></Protected>} />
            <Route path="/kid/:childId/breathe" element={<Protected><Breathe /></Protected>} />
            <Route path="/kid/:childId/story" element={<Protected><StoryTime /></Protected>} />
            <Route path="/kid/:childId/affirmations" element={<Protected><Affirmations /></Protected>} />
            <Route path="/kid/:childId/games" element={<Protected><Games /></Protected>} />
            <Route path="/kid/:childId/badges" element={<Protected><Badges /></Protected>} />
            <Route path="/help" element={<Crisis />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
