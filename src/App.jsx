import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import LoginPage from "./pages/LoginPage/LoginPage";
import RegisterForm from "./pages/RegisterForm/RegisterForm";
import ForgotPassword from "./pages/ForgotPassword/ForgotPassword";
import Dashboard from "./pages/Dashboard/Dashboard";
import Servicios from "./pages/Servicios/Servicios";

function App() {

  return (
   <BrowserRouter>
   <Routes>
    <Route path="/" element={<LoginPage />} />
    <Route path='/loginPage' element={<LoginPage/>}></Route>
    <Route path='/registerForm' element={<RegisterForm/>}></Route>
    <Route path='/forgotPassword' element={<ForgotPassword/>}></Route>
    <Route path='/dashboard' element={<Dashboard/>}></Route>
    <Route path='/servicios' element={<Servicios/>}></Route>
   </Routes>
   </BrowserRouter>
  );
}

export default App;