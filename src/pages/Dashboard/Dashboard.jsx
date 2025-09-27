// dashboard.jsx
import React from "react";
import "./dashboard.css";

const Dashboard = () => {
  return (
    <div className="dashboard-container">
        <Sidebar/>
        <Header onLogout={onLogout} />


      <h2 className="titulo">Resultados generales</h2>

      {/* Indicadores principales */}
      <div className="indicadores">
        <div className="card">
          <span className="icono"></span>
          <h3>Tip del día</h3>
          <p>practica la respiración consciente por 5 minutos</p>
        </div>
        <div className="card">
          <span className="icono"></span>
          <h3>Estado de ánimo</h3>
          <p>“Hoy te sientes: Tranquilo 🌿. Recuerda que cada emoción es válida, obsérvala sin juzgar.”</p>
        </div>
        <div className="card">
          <span className="icono"></span>
          <h3>Frase motivacional</h3>
          <p>No tienes que ser productivo todo el tiempo, descansar también es avanzar.</p>
        </div>
      </div>


      {/* Recomendaciones */}
      <div className="recomendaciones">
        <h4>Recomendaciones de autocuidado:</h4>
        <p>-  Duerme al menos 7–8 horas. </p>
        <p>- Haz una pausa de 10 minutos cada 2 horas de trabajo/estudio.</p>
        <p>- Escribe 3 cosas por las que te sientas agradecido hoy.</p>
      </div>

      {/* Resultados por mes */}
      <div className="graficos">
        <div className="grafico-linea">
          <h4>Resultados por mes</h4>
          <img
            src="https://quickchart.io/chart?c={type:'line',data:{labels:['Enero','Febrero','Marzo','Abril','Mayo'],datasets:[{label:'Participantes',data:[15,20,18,28,30],borderColor:'purple',fill:false}]}}"
            alt="Gráfico de resultados"
          />
        </div>

        {/* Demografía */}
        <div className="grafico-barras">
          <h4></h4>
          <img
            src="https://quickchart.io/chart?c={type:'bar',data:{labels:['18-24','25-34','35-44','45-54'],datasets:[{label:'Mujeres',data:[20,15,10,5],backgroundColor:'pink'},{label:'Hombres',data:[18,12,8,4],backgroundColor:'lightblue'}]}}"
            alt="Gráfico de demografía"
          />
        </div>

        {/* Cumplimiento objetivo */}
        <div className="grafico-circular">
        </div>
      </div>
      
       <Footer className="footer"/>
    </div>
  );
};

export default Dashboard;