import React from "react";
import "./Footer.css";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Sección izquierda */}
        <div className="footer-about">
          <h3>Project Mental Health</h3>
          <p>
            Una plataforma pensada para acompañar tu bienestar emocional,
            brindando acceso a herramientas y recursos que apoyan tu salud mental.
          </p>
        </div>

        {/* Sección enlaces */}
        <div className="footer-links">
          <h4>Enlaces útiles</h4>
          <ul>
            <li><a href="/index">Inicio</a></li>
            <li><a href="/register">Registro</a></li>
            <li><a href="/forgot">Recuperar contraseña</a></li>
            <li><a href="#">Contacto</a></li>
          </ul>
        </div>

        {/* Sección contacto */}
        <div className="footer-contact">
          <h4>Contáctanos</h4>
          <p>Email: soporte@mentalhealth.com</p>
          <p>Tel: +57 320 123 4567</p>
          <div className="footer-socials">
            <a href="#"><i className="bi bi-facebook"></i></a>
            <a href="#"><i className="bi bi-twitter"></i></a>
            <a href="#"><i className="bi bi-instagram"></i></a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} Project Mental Health. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
};

export default Footer;
