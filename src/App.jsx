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

function App() {

  return (
   <BrowserRouter>
   <Routes>
    <Route path="/" element={<LoginPage />} />
    <Route path='/loginPage' element={<LoginPage/>}></Route>
    <Route path='/registerForm' element={<RegisterForm/>}></Route>
    <Route path='/forgotPassword' element={<ForgotPassword/>}></Route>
    <Route path='/resetPage' element={<ResetPage/>}></Route>
    <Route path='/dashboard' element={<Dashboard/>}></Route>
    <Route path='/servicios' element={<Servicios/>}></Route>
     <Route path='/estudiantes' element={<Estudiantes/>}></Route>
     <Route path="/psicoorientadores" element={<Psicoorientadores/>}></Route>
   </Routes>
   </BrowserRouter>
  );
}

export default App;