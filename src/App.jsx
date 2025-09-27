import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import LoginPage from "./pages/LoginPage/LoginPage";
import RegisterForm from "./pages/RegisterForm/RegisterForm";
import ForgotPassword from "./pages/ForgotPassword/ForgotPassword";
import Dashboard from "./pages/Dashboard/Dashboard"; 

function App() {

  return (
   <BrowserRouter>
   <Routes>
    <Route path="/" element={<LoginPage />} />
    <Route path='/loginPage' element={<LoginPage/>}></Route>
    <Route path='/registerForm' element={<RegisterForm/>}></Route>
    <Route path='/forgotPassword' element={<ForgotPassword/>}></Route>
    <Route path='/dashboard' element={<Dashboard/>}></Route>
   </Routes>
   </BrowserRouter>
  );
}

export default App;