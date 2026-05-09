import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Gallery from "./pages/Gallery.jsx";
import Creator from "./pages/Creator.jsx";
import ManageUsers from "./pages/ManageUsers.jsx";

function Private({ children, role }) {
  const { loggedIn, role: r } = useAuth();
  if (!loggedIn) return <Navigate to="/login" replace />;
  if (role && r !== role) {
    return <Navigate to={r === "creator" ? "/admin" : "/gallery"} replace />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/gallery"
        element={
          <Private>
            <Gallery />
          </Private>
        }
      />
      <Route
        path="/admin"
        element={
          <Private role="creator">
            <Creator />
          </Private>
        }
      />
      <Route
        path="/admin/users"
        element={
          <Private role="creator">
            <ManageUsers />
          </Private>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
