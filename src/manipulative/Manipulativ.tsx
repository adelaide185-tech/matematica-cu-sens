"use client";

import { useState } from "react";
import { BlocuriBaza10 } from "./BlocuriBaza10";
import { CadruZece, Rekenrek } from "./Rekenrek";
import { AxaNumerelor } from "./AxaNumerelor";
import { TablaSutelor } from "./TablaSutelor";
import { ModelBara } from "./ModelBara";
import { BtnUnealta, Paleta } from "./comune";
import type { StareManip } from "./stare";

/** Afișează orice manipulativ după tipul stării; uneltele mici (culoarea, „arată numărul”) stau aici. */
export function Manipulativ({ stare, onChange, blocat = false, arataNumar = true, editor = false, dezvaluie = false, modAscunde = false }: {
  stare: StareManip;
  onChange: (s: StareManip) => void;
  blocat?: boolean;
  arataNumar?: boolean;
  /** Atelier: modelul în bară se construiește liber */
  editor?: boolean;
  dezvaluie?: boolean;
  /** tabla sutelor: atingerea acoperă numere în loc să coloreze */
  modAscunde?: boolean;
}) {
  const [culoareTabla, setCuloareTabla] = useState(0);
  const [culoareCadru, setCuloareCadru] = useState<1 | 2>(1);

  switch (stare.tip) {
    case "blocuri":
      return <BlocuriBaza10 valoare={stare.v} onChange={(v) => onChange({ ...stare, v })} blocat={blocat} arataNumar={arataNumar} faraSute={stare.faraSute} />;
    case "rekenrek":
      return <Rekenrek valoare={stare.v} onChange={(v) => onChange({ ...stare, v })} blocat={blocat} arataNumar={arataNumar} randuri={stare.randuri ?? 2} />;
    case "cadru":
      return (
        <div>
          {!blocat && (
            <div className="mb-3 flex justify-center gap-2">
              <BtnUnealta activ={culoareCadru === 1} onClick={() => setCuloareCadru(1)}>🔴 Jeton roșu</BtnUnealta>
              <BtnUnealta activ={culoareCadru === 2} onClick={() => setCuloareCadru(2)}>🟡 Jeton galben</BtnUnealta>
            </div>
          )}
          <CadruZece valoare={stare.v} onChange={(v) => onChange({ ...stare, v })} culoare={culoareCadru} blocat={blocat} arataNumar={arataNumar} unSingurCadru={stare.unSingurCadru} />
        </div>
      );
    case "axa":
      return <AxaNumerelor valoare={stare.v} onChange={(v) => onChange({ ...stare, v })} blocat={blocat} moduri={stare.moduri} />;
    case "tabla":
      return (
        <div>
          {!blocat && !modAscunde && (
            <div className="mb-3 flex justify-center">
              <Paleta alesa={culoareTabla} onAlege={setCuloareTabla} />
            </div>
          )}
          <TablaSutelor valoare={stare.v} onChange={(v) => onChange({ ...stare, v })} culoare={culoareTabla} blocat={blocat} dezvaluie={dezvaluie} modAscunde={modAscunde} />
        </div>
      );
    case "bara":
      return <ModelBara valoare={stare.v} onChange={(v) => onChange({ ...stare, v })} blocat={blocat} editor={editor} />;
  }
}
