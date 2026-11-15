import type { ConfigCalcul, ExCalcul } from "@/motor/calcul/tipuri";
import { coloaneFisa, textRaspuns } from "@/motor/calcul/generator";

function descarca(blob: Blob, nume: string) {
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), { href: url, download: nume });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/** Textul exercițiului pe un singur rând (și pentru cele așezate în coloană). */
export function textExercitiu(e: ExCalcul): string {
  const gol = "______";
  if (e.raspuns.tip === "rest") return `${e.text} ${gol} rest ${gol}`;
  return `${e.text} ${e.inainte ? `${e.inainte} ` : ""}${gol}`;
}

/** CSV cu „;” (Excel în română) și BOM, ca diacriticele să apară corect. */
export function exportCsv(cfg: ConfigCalcul, ex: ExCalcul[]) {
  const q = (s: string) => `"${s.replace(/"/g, '""')}"`;
  const rand = ["Nr.", "Exercițiu", "Răspuns", "Tip"].map(q).join(";");
  const linii = ex.map((e, i) => [String(i + 1), `${e.text}${e.inainte ? ` ${e.inainte}` : ""}`, textRaspuns(e), e.tip].map(q).join(";"));
  descarca(new Blob(["﻿" + [rand, ...linii].join("\r\n")], { type: "text/csv;charset=utf-8" }), `fisa-calcul-${cfg.seed}.csv`);
}

/** Document Word editabil: antet, exercițiile în tabel pe coloane, apoi baremul pe pagină nouă. */
export async function exportDocx(cfg: ConfigCalcul, ex: ExCalcul[]) {
  const d = await import("docx");
  const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType, HeadingLevel } = d;
  const col = coloaneFisa(cfg, ex);
  const fara = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
  const faraMargini = { top: fara, bottom: fara, left: fara, right: fara, insideHorizontal: fara, insideVertical: fara };
  const marime = col === 4 ? 21 : col === 3 ? 24 : 27; // jumătăți de punct
  const tabel = (celule: string[][], nCol: number, sz: number) => {
    const randuri: InstanceType<typeof TableRow>[] = [];
    for (let i = 0; i < celule.length; i += nCol) {
      randuri.push(new TableRow({
        children: Array.from({ length: nCol }, (_, j) => new TableCell({
          width: { size: Math.floor(100 / nCol), type: WidthType.PERCENTAGE },
          children: [new Paragraph({ spacing: { before: 120, after: 120 }, children: (celule[i + j] ?? [""]).map((t, k) => new TextRun({ text: t, bold: k === 2, size: sz, color: k === 0 ? "6A59A7" : undefined })) })],
        })),
      }));
    }
    return new Table({ rows: randuri, width: { size: 100, type: WidthType.PERCENTAGE }, borders: faraMargini });
  };
  const a = cfg.antet;
  const doc = new Document({
    styles: { default: { document: { run: { font: "Arial" } } } },
    sections: [
      {
        children: [
          ...(a.centru ? [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: a.centru, bold: true, color: "6A59A7" })] })] : []),
          ...(a.profesor ? [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `Profesor: ${a.profesor}`, size: 20 })] })] : []),
          new Paragraph({ heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, children: [new TextRun({ text: a.titlu, bold: true, color: "4A3D80" })] }),
          new Paragraph({ spacing: { after: 240 }, children: [new TextRun({ text: `Numele și prenumele: ______________________   Data: ${a.data || "__________"}   Timp de lucru: ${a.timp || "________"}`, size: 21 })] }),
          tabel(ex.map((e, i) => [`${i + 1}. `, textExercitiu(e)]), col, marime),
          new Paragraph({ spacing: { before: 240 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: `Cod fișă ${cfg.seed} · ${ex.length} exerciții`, size: 16, color: "777777" })] }),
        ],
      },
      {
        children: [
          new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: "Barem de corectare", bold: true, color: "4A3D80" })] }),
          new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: `${a.titlu} · cod fișă ${cfg.seed}`, size: 20 })] }),
          tabel(ex.map((e, i) => [`${i + 1}. `, e.inainte ? `${e.inainte} ` : "", textRaspuns(e)]), 5, 21),
        ],
      },
    ],
  });
  descarca(await Packer.toBlob(doc), `fisa-calcul-${cfg.seed}.docx`);
}
