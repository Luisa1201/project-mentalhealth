import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import LoginPage from "./pages/LoginPage/LoginPage";
import RegisterForm from "./pages/RegisterForm/RegisterForm";
import ForgotPassword from "./pages/ForgotPassword/ForgotPassword";
import ResetPage from "./pages/ResetPage/ResetPage";
import Dashboard from "./pages/Dashboard/Dashboard";
import Servicios from "./pages/Servicios/Servicios";
import Estudiantes from "./pages/Estudiantes/Estudiantes";
import Psicoorientadores from "./pages/Psicoorientador/Psicoorientador";
import SessionHistory from "./pages/SessionHistory/SessionHistory";
import AdminRoute from "./Components/AdminRoute";
import ProtectedRoute from "./Components/ProtectedRoute";

function App() {

  return (
   <BrowserRouter>
   <Routes>
    <Route path="/" element={<LoginPage />} />
    <Route path="/loginPage" element={<LoginPage/>} />
    <Route path="/registerForm" element={<RegisterForm/>} />
    <Route path="/forgotPassword" element={<ForgotPassword/>} />
    <Route path="/resetPage" element={<ResetPage/>} />
    
    {/* Protected Routes */}
    <Route path="/dashboard" element={
      <ProtectedRoute>
        <Dashboard/>
      </ProtectedRoute>
    } />
    
    <Route path="/servicios" element={
      <ProtectedRoute>
        <Servicios/>
      </ProtectedRoute>
    } />
    
    <Route path="/estudiantes" element={
      <ProtectedRoute>
        <Estudiantes/>
      </ProtectedRoute>
    } />
    
    <Route path="/psicoorientadores" element={
      <ProtectedRoute>
        <Psicoorientadores/>
      </ProtectedRoute>
    } />
    
    <Route path="/session-history" element={
      <ProtectedRoute>
        <AdminRoute>
          <SessionHistory/>
        </AdminRoute>
      </ProtectedRoute>
    } />
   </Routes>
   </BrowserRouter>
  );
}

export default App;