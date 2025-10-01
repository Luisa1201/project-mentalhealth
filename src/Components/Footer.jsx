import React from "react";
import "../assets/Footer.css";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <div className="footer-logo">
            <span className="footer-logo-icon">🧠</span>
            <span className="footer-logo-text">Salud Mental</span>
          </div>
          <p className="footer-description">
            Comprometidos con tu bienestar emocional y mental. 
            Brindamos apoyo y recursos para estudiantes y psicoorientadores.
          </p>
        </div>

        <div className="footer-section">
          <h3 className="footer-title">Enlaces Rápidos</h3>
          <ul className="footer-links">
            <li><a href="#inicio">Inicio</a></li>
            <li><a href="#servicios">Servicios</a></li>
            <li><a href="#recursos">Recursos</a></li>
            <li><a href="#contacto">Contacto</a></li>
          </ul>
        </div>

        <div className="footer-section">
          <h3 className="footer-title">Recursos</h3>
          <ul className="footer-links">
            <li><a href="#estudiantes">Para Estudiantes</a></li>
            <li><a href="#psicoorientadores">Para Psicoorientadores</a></li>
            <li><a href="#articulos">Artículos</a></li>
            <li><a href="#faq">Preguntas Frecuentes</a></li>
          </ul>
        </div>

        <div className="footer-section">
          <h3 className="footer-title">Contacto</h3>
          <ul className="footer-contact">
            <li>📧 info@saludmental.com</li>
            <li>📞 +57 300 123 4567</li>
            <li>📍 Bogotá, Colombia</li>
          </ul>
          <div className="footer-social">
            <a href="#facebook" className="social-link" aria-label="Facebook">📘</a>
            <a href="#twitter" className="social-link" aria-label="Twitter">🐦</a>
            <a href="#instagram" className="social-link" aria-label="Instagram">📷</a>
            <a href="#linkedin" className="social-link" aria-label="LinkedIn">💼</a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} Salud Mental. Todos los derechos reservados.</p>
        <div className="footer-legal">
          <a href="#privacidad">Política de Privacidad</a>
          <span className="separator">|</span>
          <a href="#terminos">Términos y Condiciones</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
