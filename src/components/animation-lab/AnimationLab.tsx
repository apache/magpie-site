// SPDX-License-Identifier: Apache-2.0
import { useState } from "react";
import { MagpieFlightStudy } from "./MagpieFlightStudy";
import { withBase } from "@/ui/lib/utils";
import "../../styles/animation-lab.css";

export default function AnimationLab() {
  const [take, setTake] = useState(0);
  const [view, setView] = useState("reference");
  const [comparing, setComparing] = useState(false);
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [initialTime, setInitialTime] = useState(0);
  const replay = (time: number) => {
    setComparing(false);
    setInitialTime(time);
    setPaused(false);
    setTake((value) => value + 1);
  };
  return (
    <main className="animation-lab">
      <header>
        <div><p className="lab-eyebrow">MAGPIE / ESTÚDIO DE MOVIMENTO</p><h1>Voo, pouso e interação.</h1></div>
        <a href={withBase("/")}>Voltar ao site ↗</a>
      </header>
      <p className="lab-intro">Página de teste independente. Modelo 3D articulado, reconstruído com a imagem azul original como referência. Depois que ele pousar, mova o mouse pelo cenário e clique no pássaro para ver suas gracinhas.</p>
      <div className="lab-controls" aria-label="Controles da animação">
        <button onClick={() => { setComparing(true); setView("reference"); setInitialTime(4.4); setPaused(true); setTake((value) => value + 1); }}>Comparar com a imagem</button>
        <button onClick={() => replay(0)}>Repetir voo completo</button>
        <button onClick={() => replay(3.1)}>Repetir só o pouso</button>
        <button onClick={() => replay(4.4)}>Ver pousado</button>
        <button aria-pressed={paused} onClick={() => setPaused(!paused)}>{paused ? "Continuar" : "Pausar"}</button>
        <label>Velocidade <select value={speed} onChange={(event) => setSpeed(Number(event.target.value))}><option value={1}>Normal</option><option value={0.5}>0,5×</option><option value={0.25}>0,25×</option></select></label>
        <label>Vista <select value={view} onChange={(event) => setView(event.target.value)}><option value="reference">Referência</option><option value="side">De lado</option><option value="front">De frente</option></select></label>
      </div>
      <section className={`k-hero lab-stage${comparing ? " lab-comparing" : ""}`} aria-label="Cenário de teste do Magpie">
        <span className="lab-stage-label">{comparing ? "ORIGINAL 2,5D" : "ENTRADA EM VOO"}</span>
        {comparing && <><img className="lab-compare-image" src={withBase("/illustrations/magpie/3d/magpie-front.png")} alt="Imagem original para comparação direta" /><span className="lab-model-label">MODELO 3D / POSE DE REFERÊNCIA</span></>}
        <div className="lab-landing"><span>ÁREA DE POUSO</span></div>
        <div className="lab-bird"><MagpieFlightStudy key={take} paused={paused} initialTime={initialTime} speed={speed} view={view}/></div>
      </section>
      <section className="lab-reference" aria-label="Referência original parada">
        <div><p className="lab-eyebrow">REFERÊNCIA / IMAGEM ORIGINAL</p><h2>Visual que queremos reproduzir.</h2><p>Imagem 2,5D parada para comparar rosto, proporções, asas e acabamento.</p></div>
        <img src={withBase("/illustrations/magpie/3d/magpie-front.png")} alt="Referência original do Magpie azul e branco, parada" width="1254" height="1254" />
      </section>
      <p className="lab-note">Para examinar as asas: selecione 0,25×, clique em “Repetir só o pouso” e pause no ponto desejado. Este é o mesmo modelo usado na página principal.</p>
    </main>
  );
}
