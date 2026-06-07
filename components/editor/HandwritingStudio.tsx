"use client";

import { useEffect, useRef } from "react";
import {
  ELIG_MAP,
  ALL_IDS,
  PAGE_SIZES,
  LINE_COLOR,
  mulberry32,
  type PaperType,
  type RotDirection,
  type PageSizeId,
  type UserVariant,
} from "./handwriting-engine";
import { WATERMARK_TEXT } from "@/lib/constants";
import type { Tier } from "@/lib/constants";

export type BlockReason = "limit_reached";

interface HandwritingStudioProps {
  // The user's plan. Free tier has the realism controls (size variation,
  // character rotation, line start offset, snap to lines) locked off — they are
  // Student/Pro features.
  tier: Tier;
  // Whether the user has at least one uploaded handwriting font. When false the
  // preview shows a blank page with an "upload a font first" prompt and export
  // is blocked — there's nothing to write with yet.
  hasFonts: boolean;
  // The user's own approved handwriting variants. When non-empty the engine
  // writes ONLY with these. When empty, the editor runs in DEMO mode using the
  // built-in handwriting pool so a first-time user can type immediately.
  userFonts: UserVariant[];
  // True when no approved user font exists yet → built-in demo handwriting.
  isDemo?: boolean;
  // Called when the server blocks an export so the parent can open the modal.
  onBlocked: (reason: BlockReason) => void;
  // Called after a successful, authorised export so usage can be refreshed.
  onExported: () => void;
}

interface ExportTreatment {
  watermark: boolean;
  multiPage: boolean;
}

const DEFAULT_TEXT =
  "Dear Grandma,\n\nThank you so much for the birthday card and the lovely note — it made my whole week. I wanted to write back to you by hand.\n\nWith love,\nAlex";

// ─────────────────────────────────────────────────────────────────────────
// The entire index(3).html engine runs imperatively against the DOM nodes
// below. React owns only the static skeleton; the #preview node and every
// page sheet / separator / copy button is created by the engine, exactly as
// in the original standalone file. Export buttons additionally pass through
// the authoritative Supabase /api/export gate before any pixels are produced.
// ─────────────────────────────────────────────────────────────────────────
export function HandwritingStudio({
  tier,
  hasFonts,
  userFonts,
  isDemo = false,
  onBlocked,
  onExported,
}: HandwritingStudioProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Free tier: the four realism controls below are gated to Student/Pro.
  const locked = tier === "free";

  // Keep the latest callbacks reachable from the mount-only effect.
  const onBlockedRef = useRef(onBlocked);
  const onExportedRef = useRef(onExported);
  const hasFontsRef = useRef(hasFonts);
  const userFontsRef = useRef(userFonts);
  const lockedRef = useRef(locked);
  onBlockedRef.current = onBlocked;
  onExportedRef.current = onExported;
  hasFontsRef.current = hasFonts;
  userFontsRef.current = userFonts;
  lockedRef.current = locked;

  useEffect(() => {
    if (!rootRef.current || !scrollRef.current) return;
    // Non-null locals so the nested engine closures don't lose the narrowing.
    const root: HTMLDivElement = rootRef.current;
    const scroll: HTMLDivElement = scrollRef.current;

    const q = <T extends Element = HTMLElement>(sel: string): T =>
      root.querySelector(sel) as T;
    const qa = <T extends Element = HTMLElement>(sel: string): T[] =>
      Array.from(root.querySelectorAll(sel)) as T[];

    // ── Control nodes (read directly, just like getElementById) ───────────
    const inputText = q<HTMLTextAreaElement>('[data-ctl="text"]');
    const sliderFontSize = q<HTMLInputElement>('[data-ctl="fontSize"]');
    const sliderSizeVar = q<HTMLInputElement>('[data-ctl="sizeVariation"]');
    const sliderLS = q<HTMLInputElement>('[data-ctl="letterSpacing"]');
    const sliderLH = q<HTMLInputElement>('[data-ctl="lineHeight"]');
    const sliderWS = q<HTMLInputElement>('[data-ctl="wordSpacing"]');
    const sliderMess = q<HTMLInputElement>('[data-ctl="messiness"]');
    const sliderRot = q<HTMLInputElement>('[data-ctl="rotIntensity"]');
    const sliderQuality = q<HTMLInputElement>('[data-ctl="exportQuality"]');
    const sliderTopMargin = q<HTMLInputElement>('[data-ctl="topMargin"]');
    const sliderLineStart = q<HTMLInputElement>('[data-ctl="lineStart"]');
    const selPageSize = q<HTMLSelectElement>('[data-ctl="pageSize"]');
    const pickerText = q<HTMLInputElement>('[data-ctl="textColor"]');
    const pickerBg = q<HTMLInputElement>('[data-ctl="bgColor"]');
    const cbTransparent = q<HTMLInputElement>('[data-ctl="bgTransparent"]');
    const cbSnapToLines = q<HTMLInputElement>('[data-ctl="snap"]');
    const snapRow = q('[data-row="snap"]');
    const rowLineHeight = q('[data-row="lineHeight"]');
    const rowTopMargin = q('[data-row="topMargin"]');

    const valOf = (name: string) => q(`[data-val="${name}"]`);

    const btnExportPDF = q<HTMLButtonElement>('[data-act="pdf"]');
    const btnClear = q<HTMLButtonElement>('[data-act="clear"]');
    const btnRandomise = q<HTMLButtonElement>('[data-act="randomise"]');

    // ── The handwriting layer — created imperatively so React never owns it
    const preview = document.createElement("div");
    preview.className = "hw-preview";
    scroll.appendChild(preview);

    // ── State ───────────────────────────────────────────────────────────
    let globalSeed = Math.floor(Math.random() * 0xffffffff);
    let rotDirection: RotDirection = "both";
    let paperType: PaperType = "plain";
    let snapToLines = false;
    let pageSize: PageSizeId = "a4";
    const activeFonts = new Set(ALL_IDS);

    // ── Free-tier feature gate ────────────────────────────────────────────
    // Size variation, character rotation, line start offset and snap-to-lines
    // are Student/Pro features. On Free we neutralise them (so output stays
    // clean) and disable the inputs; the JSX badges them as upgrades. Done
    // before the first render/label pass below so the locked-off values take.
    if (lockedRef.current) {
      sliderSizeVar.value = "0";
      sliderSizeVar.disabled = true;
      sliderLineStart.value = "0";
      sliderLineStart.disabled = true;
      sliderRot.value = "0";
      sliderRot.disabled = true;
      rotDirection = "none";
      cbSnapToLines.disabled = true;
      // Reflect rotation "none" in the direction button row and lock it.
      qa<HTMLButtonElement>(".hw-rot-btn[data-dir]").forEach((b) => {
        b.classList.toggle("active", b.dataset.dir === "none");
        b.disabled = true;
      });
    }

    // The user's own variants + a per-variant code-point coverage set. When the
    // user has any, the engine writes ONLY with their hand (see eligibleFor).
    const userVariants = userFontsRef.current;
    const variantCoverage = userVariants.map((v) => ({
      family: v.family,
      covers: new Set(v.codepoints),
    }));

    // Whether the in-flight export should burn a watermark into each page.
    let exportWatermark = false;

    function rng(idx: number, slot: number): number {
      return mulberry32(globalSeed ^ (idx * 2654435761) ^ (slot * 1234567891));
    }

    function eligibleFor(ch: string): string[] {
      const cp = ch.codePointAt(0) as number;
      // ONLY the user's own handwriting — never the built-in product fonts.
      // Pick among the variants that actually contain this character; if none
      // of their sheets cover it, fall back to any of THEIR variants (the glyph
      // simply won't draw). The built-in pool below is a legacy safety net that
      // is never reached because the studio is not mounted without user fonts.
      if (variantCoverage.length > 0) {
        const own = variantCoverage
          .filter((v) => v.covers.has(cp))
          .map((v) => v.family);
        return own.length > 0 ? own : variantCoverage.map((v) => v.family);
      }
      const ids = ELIG_MAP[cp];
      const pool = ids && ids.length > 0 ? ids : ALL_IDS;
      const filtered = pool.filter((id) => activeFonts.has(id));
      return filtered.length > 0 ? filtered : pool;
    }

    // ── Render ────────────────────────────────────────────────────────────
    function render() {
      // The preview always renders with the built-in handwriting (HW6…HW20 in
      // globals.css) — that's the product font the engine draws every glyph
      // from, independent of whether the user has uploaded their own samples.
      const text = inputText.value;
      const fontSize = parseFloat(sliderFontSize.value);
      const sizeVar = parseInt(sliderSizeVar.value, 10);
      const ls = parseFloat(sliderLS.value);
      const lh = parseFloat(sliderLH.value);
      const ws = parseFloat(sliderWS.value);
      const messiness = parseInt(sliderMess.value, 10);
      const rotMax = parseFloat(sliderRot.value);
      const textColor = pickerText.value;
      const topMargin = parseInt(sliderTopMargin.value, 10);
      const lineStartMax = parseInt(sliderLineStart.value, 10);

      preview.style.fontSize = fontSize + "px";
      preview.style.letterSpacing = ls + "px";
      preview.style.wordSpacing = ws + "px";
      preview.style.color = textColor;

      let charIdx = 0;
      let wordIdx = 0;

      const isSnapMode =
        snapToLines && (paperType === "lined" || paperType === "squared");

      // Handwriting glyphs (umlaut dots, tall ascenders, deep descenders) extend
      // well past the font's nominal em box, and `vertical-align:top` leaves the
      // first line no leading above it. Without headroom those tops spill above
      // the paper onto the dark studio background and look "cut off" — even
      // though the canvas export draws the full glyph (which is why only the live
      // preview is affected). Reserve room, scaled to the font size, so the
      // first/last lines always land on the paper. (Snap mode positions lines
      // absolutely on the ruled grid, which already leaves room, so leave it.)
      const inkHeadroom = Math.ceil(fontSize * 0.5);
      if (!isSnapMode) {
        preview.style.lineHeight = String(lh);
        preview.style.paddingTop = topMargin + inkHeadroom + "px";
        preview.style.paddingBottom = inkHeadroom + "px";
      } else {
        preview.style.lineHeight = "normal";
        preview.style.paddingTop = "0";
        preview.style.paddingBottom = "0";
      }

      const isTransp = cbTransparent.checked;
      preview.classList.toggle("transparent-bg", isTransp);
      preview.style.backgroundColor = "transparent";

      preview.querySelectorAll(".page-guide").forEach((g) => g.remove());

      // Build char spans for one logical line into a container.
      function buildLineContent(
        lineText: string,
        _lineIdxLocal: number,
        container: HTMLElement,
      ) {
        let prevNormTy = 0,
          prevNormRot = 0;
        const SMOOTH = 0.6;
        let wordSpanL: HTMLElement | null = null;
        let wordSizeMultL = 1;

        function flushW() {
          if (wordSpanL) {
            container.appendChild(wordSpanL);
            wordSpanL = null;
          }
        }

        for (let i = 0; i < lineText.length; ) {
          const cp = lineText.codePointAt(i) as number;
          const ch = String.fromCodePoint(cp);
          const step = ch.length;

          if (cp === 32) {
            flushW();
            container.appendChild(document.createTextNode(" "));
            prevNormTy = 0;
            prevNormRot = 0;
            i += step;
            charIdx++;
            continue;
          }

          if (!wordSpanL) {
            wordSpanL = document.createElement("span");
            wordSpanL.className = "word";
            wordSpanL.style.verticalAlign = "top";
            prevNormTy = 0;
            prevNormRot = 0;
            wordIdx++;
            wordSizeMultL =
              sizeVar > 0
                ? 1 + (rng(wordIdx, 20) - 0.5) * (sizeVar / 100) * 0.5
                : 1;
            wordSpanL.style.marginRight = 3 * (rng(wordIdx, 99) * 2 - 1) + "px";
          }

          const span = document.createElement("span");
          span.className = "char";
          span.textContent = ch;
          span.style.verticalAlign = "top";

          const pool = eligibleFor(ch);
          const fontIdx = Math.floor(rng(charIdx, 10) * pool.length);
          span.style.fontFamily = `'${pool[fontIdx]}', cursive`;
          span.style.fontSize = fontSize * wordSizeMultL + "px";

          let ty = 0,
            rotDeg = 0,
            scale = 1;
          if (messiness > 0) {
            const maxTy = messiness * 0.45;
            const maxRot = messiness * 0.45;
            const rawTy = rng(charIdx, 0) - 0.5;
            const rawRot = rng(charIdx, 1) - 0.5;
            const r3 = rng(charIdx, 2);
            let normTy = prevNormTy * SMOOTH + rawTy * (1 - SMOOTH);
            let normRot = prevNormRot * SMOOTH + rawRot * (1 - SMOOTH);
            normTy = Math.max(-0.6, Math.min(0.6, normTy));
            normRot = Math.max(-0.6, Math.min(0.6, normRot));
            ty = normTy * maxTy;
            rotDeg = normRot * maxRot;
            const sr = 0.001 * messiness;
            scale = 1 - sr + r3 * sr * 2;
            prevNormTy = normTy;
            prevNormRot = normRot;
          }
          if (rotDirection !== "none" && rotMax > 0) {
            const rv = rng(charIdx, 12);
            let extra = 0;
            if (rotDirection === "left") extra = -(rv * rotMax);
            else if (rotDirection === "right") extra = rv * rotMax;
            else extra = (rv - 0.5) * 2 * rotMax;
            rotDeg += Math.round(extra * 100) / 100;
          }
          span.style.transform = `translateY(${ty}px) rotate(${rotDeg}deg) scale(${scale})`;

          wordSpanL.appendChild(span);
          i += step;
          charIdx++;
        }
        flushW();
      }

      preview.textContent = "";

      if (isSnapMode) {
        // Absolute-position each \n-line at its exact mm-derived Y.
        const pw = preview.clientWidth || preview.offsetWidth || 600;
        const size = PAGE_SIZES[pageSize];
        const pxPerMm = pw / size.w;
        const GAP = 90;

        let lineH_px: number, topPad_px: number, linesPerPage: number;
        if (paperType === "lined") {
          lineH_px = (size.h / 47.8) * pxPerMm;
          topPad_px = 3.8 * lineH_px;
          linesPerPage = 43;
        } else {
          lineH_px = (size.h / 53) * pxPerMm;
          // Squared paper gets an adjustable top margin (the Top margin slider).
          // Express it in whole grid rows so text keeps snapping to the grid.
          const topMarginRows = Math.max(0, Math.round(topMargin / lineH_px));
          topPad_px = (1 + topMarginRows) * lineH_px;
          linesPerPage = Math.max(1, 52 - topMarginRows);
        }

        const pageH = pw * (size.h / size.w);
        const logicalLines = text.split("\n");

        const lineDivs = logicalLines.map((lineText, li) => {
          const lineDiv = document.createElement("div");
          lineDiv.className = "snap-line";
          lineDiv.style.cssText =
            `position:absolute; top:0; left:0; right:0; ` +
            `padding:0 28px; overflow:visible; white-space:normal; ` +
            // Internal row spacing MUST equal the ruled-line spacing (lineH_px),
            // otherwise every wrapped row in a paragraph drifts cumulatively
            // below its guide. The char spans inherit this as a fixed length,
            // so each visual row is exactly one ruled line tall.
            `line-height:${lineH_px}px; word-break:normal; overflow-wrap:anywhere;`;
          buildLineContent(lineText, li, lineDiv);
          preview.appendChild(lineDiv);
          return lineDiv;
        });

        let currentRow = 0;
        lineDivs.forEach((div) => {
          const exactH = div.getBoundingClientRect().height;
          const rowsUsed = Math.max(1, Math.round(exactH / lineH_px));
          const lastRow = currentRow + rowsUsed - 1;
          const pageIdx = Math.floor(lastRow / linesPerPage);
          const rowInPage = lastRow % linesPerPage;
          const y =
            pageIdx * (pageH + GAP) + topPad_px + rowInPage * lineH_px;
          div.style.top = y - rowsUsed * lineH_px + lineH_px * 0.3 + "px";
          currentRow += rowsUsed;
        });

        if (lineStartMax > 0) {
          let visualLine = 0;
          lineDivs.forEach((div) => {
            const words = Array.from(
              div.querySelectorAll<HTMLElement>("span.word"),
            );
            let prevTop = -Infinity;
            for (const word of words) {
              const top = word.offsetTop;
              if (top > prevTop + 2) {
                const offset = Math.floor(
                  rng(visualLine, 88) * (lineStartMax + 1),
                );
                if (offset > 0) word.style.marginLeft = offset + "px";
                visualLine++;
                prevTop = top;
              }
            }
          });
        }

        const lastPage = Math.floor((currentRow - 1) / linesPerPage);
        preview.style.minHeight = (lastPage + 1) * (pageH + GAP) + "px";
      } else {
        // Normal flow rendering.
        const frag = document.createDocumentFragment();
        let wordSizeMult = 1;
        let prevNormTy = 0;
        let prevNormRot = 0;
        const SMOOTH = 0.6;
        let wordSpan: HTMLElement | null = null;

        function flushWord() {
          if (wordSpan) {
            frag.appendChild(wordSpan);
            wordSpan = null;
          }
        }

        for (let i = 0; i < text.length; ) {
          const cp = text.codePointAt(i) as number;
          const ch = String.fromCodePoint(cp);
          const step = ch.length;

          if (cp === 10) {
            flushWord();
            frag.appendChild(document.createElement("br"));
            prevNormTy = 0;
            prevNormRot = 0;
            i += step;
            charIdx++;
            continue;
          }
          if (cp === 32) {
            flushWord();
            frag.appendChild(document.createTextNode(" "));
            prevNormTy = 0;
            prevNormRot = 0;
            i += step;
            charIdx++;
            continue;
          }

          if (!wordSpan) {
            wordSpan = document.createElement("span");
            wordSpan.className = "word";
            prevNormTy = 0;
            prevNormRot = 0;
            wordIdx++;
            wordSizeMult =
              sizeVar > 0
                ? 1 + (rng(wordIdx, 20) - 0.5) * (sizeVar / 100) * 0.5
                : 1;
            wordSpan.style.marginRight = 3 * (rng(wordIdx, 99) * 2 - 1) + "px";
          }

          const span = document.createElement("span");
          span.className = "char";
          span.textContent = ch;

          const pool = eligibleFor(ch);
          const fontIdx = Math.floor(rng(charIdx, 10) * pool.length);
          span.style.fontFamily = `'${pool[fontIdx]}', cursive`;
          span.style.fontSize = fontSize * wordSizeMult + "px";

          let ty = 0,
            rotDeg = 0,
            scale = 1;
          if (messiness > 0) {
            const maxTy = messiness * 0.45;
            const maxRot = messiness * 0.45;
            const rawTy = rng(charIdx, 0) - 0.5;
            const rawRot = rng(charIdx, 1) - 0.5;
            const r3 = rng(charIdx, 2);
            let normTy = prevNormTy * SMOOTH + rawTy * (1 - SMOOTH);
            let normRot = prevNormRot * SMOOTH + rawRot * (1 - SMOOTH);
            normTy = Math.max(-0.6, Math.min(0.6, normTy));
            normRot = Math.max(-0.6, Math.min(0.6, normRot));
            ty = normTy * maxTy;
            rotDeg = normRot * maxRot;
            const sr = 0.001 * messiness;
            scale = 1 - sr + r3 * sr * 2;
            prevNormTy = normTy;
            prevNormRot = normRot;
          }
          if (rotDirection !== "none" && rotMax > 0) {
            const rv = rng(charIdx, 12);
            let extra = 0;
            if (rotDirection === "left") extra = -(rv * rotMax);
            else if (rotDirection === "right") extra = rv * rotMax;
            else extra = (rv - 0.5) * 2 * rotMax;
            rotDeg += Math.round(extra * 100) / 100;
          }
          span.style.transform = `translateY(${ty}px) rotate(${rotDeg}deg) scale(${scale})`;

          wordSpan.appendChild(span);
          i += step;
          charIdx++;
        }
        flushWord();
        preview.appendChild(frag);
      }

      requestAnimationFrame(applyLineStartOffsetsAndSeparators);
    }

    // ── Post-layout: apply line-start offset to every visual line ──────────
    function applyLineStartOffsetsAndSeparators() {
      const lineStartMax = parseInt(sliderLineStart.value, 10);
      const isSnap =
        snapToLines && (paperType === "lined" || paperType === "squared");

      if (!isSnap) {
        preview
          .querySelectorAll<HTMLElement>("span.word")
          .forEach((w) => {
            w.style.marginLeft = "";
          });
      }

      if (lineStartMax > 0 && !isSnap) {
        void preview.getBoundingClientRect();
        const words = Array.from(
          preview.querySelectorAll<HTMLElement>("span.word"),
        );
        let prevTop = -Infinity;
        let visualLine = 0;
        for (const word of words) {
          const top = word.offsetTop;
          if (top > prevTop + 2) {
            visualLine++;
            const offset = Math.floor(rng(visualLine, 88) * (lineStartMax + 1));
            if (offset > 0) word.style.marginLeft = offset + "px";
            prevTop = top;
          }
        }
      }

      insertPageSeparators();
    }

    // ── Page sheet layout ─────────────────────────────────────────────────
    function insertPageSeparators() {
      const savedScrollTop = scroll.scrollTop;

      const oldHost = scroll.querySelector(".pages-host");
      if (oldHost) {
        scroll.insertBefore(preview, oldHost);
        oldHost.remove();
      }

      preview.style.position = "relative";
      preview.style.top = "";
      preview.style.left = "";
      preview.style.right = "";
      preview.style.zIndex = "2";
      preview.style.minHeight = "";

      preview.querySelectorAll(".page-sep").forEach((s) => s.remove());

      const size = PAGE_SIZES[pageSize];
      const pw = preview.clientWidth || preview.offsetWidth;
      if (!pw) return;
      const pageH = pw * (size.h / size.w);
      const GAP = 90;

      void preview.getBoundingClientRect();

      const isSnap =
        snapToLines && (paperType === "lined" || paperType === "squared");

      if (!isSnap) {
        const items: {
          node: HTMLElement;
          naturalTop: number;
          naturalHeight: number;
        }[] = [];
        for (const node of Array.from(preview.childNodes)) {
          if (
            node.nodeType === Node.ELEMENT_NODE &&
            (node as HTMLElement).classList &&
            (node as HTMLElement).classList.contains("word")
          ) {
            const el = node as HTMLElement;
            items.push({
              node: el,
              naturalTop: el.offsetTop,
              naturalHeight: el.offsetHeight,
            });
          }
        }

        const MARGIN = 26;
        let cumShift = 0;

        for (const { node, naturalTop, naturalHeight } of items) {
          const visualTop = naturalTop + cumShift;
          const visualBottom = visualTop + naturalHeight;
          const curPage = Math.floor(visualTop / (pageH + GAP));
          const breakAt = curPage * (pageH + GAP) + pageH - MARGIN;
          const landAt = (curPage + 1) * (pageH + GAP) + MARGIN;

          if (visualBottom > breakAt) {
            const sepH = Math.ceil(landAt - visualTop);
            if (sepH > 0) {
              const sep = document.createElement("div");
              sep.className = "page-sep";
              sep.style.cssText = `display:block; height:${sepH}px; background:transparent; pointer-events:none;`;
              preview.insertBefore(sep, node);
              cumShift += sepH;
            }
          }
        }
      }

      void preview.getBoundingClientRect();
      const totalH = Math.max(preview.scrollHeight, pageH);
      const nPages = Math.max(1, Math.ceil(totalH / (pageH + GAP)));

      const hostH = nPages * (pageH + GAP) + 65;

      const host = document.createElement("div");
      host.className = "pages-host";
      host.style.cssText = `position:relative; width:100%; height:${hostH}px;`;
      preview.style.minHeight = hostH + "px";

      const paperColor = cbTransparent.checked
        ? "transparent"
        : pickerBg.value || "#f3f1ec";

      for (let p = 0; p < nPages; p++) {
        const sheetTop = p * (pageH + GAP);

        const sheet = document.createElement("div");
        sheet.className = "hw-page-sheet";
        sheet.style.cssText =
          `position:absolute; left:0; right:0; top:${sheetTop}px; height:${pageH}px; ` +
          `overflow:visible; z-index:1; background:${paperColor};`;

        if (paperType === "lined") {
          const h = pageH / 47.8;
          for (let k = 0; k < 44; k++) {
            const y = (2.8 + k) * h;
            const ld = document.createElement("div");
            ld.style.cssText = `position:absolute;left:0;right:0;top:${y}px;height:0.5px;background:${LINE_COLOR};pointer-events:none;`;
            sheet.appendChild(ld);
          }
        } else if (paperType === "squared") {
          const rh = pageH / 53;
          const cw = pw / 37;
          for (let k = 1; k < 53; k++) {
            const ld = document.createElement("div");
            ld.style.cssText = `position:absolute;left:0;right:0;top:${k * rh}px;height:0.5px;background:${LINE_COLOR};pointer-events:none;`;
            sheet.appendChild(ld);
          }
          for (let k = 1; k < 37; k++) {
            const ld = document.createElement("div");
            ld.style.cssText = `position:absolute;top:0;bottom:0;left:${k * cw}px;width:0.5px;background:${LINE_COLOR};pointer-events:none;`;
            sheet.appendChild(ld);
          }
        }

        if (nPages > 1) {
          const lbl = document.createElement("div");
          lbl.style.cssText =
            "position:absolute; bottom:8px; right:14px; font-size:9px; " +
            "color:rgba(0,0,0,.18); font-family:system-ui; letter-spacing:.06em; " +
            "text-transform:uppercase; pointer-events:none;";
          lbl.textContent = `Seite ${p + 1}`;
          sheet.appendChild(lbl);
        }
        host.appendChild(sheet);
      }

      host.appendChild(preview);
      scroll.appendChild(host);

      requestAnimationFrame(() => {
        scroll.scrollTop = savedScrollTop;
      });
    }

    // ── Slider fill + labels ───────────────────────────────────────────────
    function fillSlider(sl: HTMLInputElement) {
      const min = parseFloat(sl.min),
        max = parseFloat(sl.max);
      const pct = ((parseFloat(sl.value) - min) / (max - min)) * 100;
      sl.style.background = `linear-gradient(to right, var(--th-amber) 0%, var(--th-amber) ${pct}%, var(--th-editor-border) ${pct}%, var(--th-editor-border) 100%)`;
    }

    function updateLabels() {
      valOf("fontSize").textContent = sliderFontSize.value;
      valOf("sizeVariation").textContent = sliderSizeVar.value;
      valOf("letterSpacing").textContent = parseFloat(sliderLS.value)
        .toFixed(1)
        .replace(/\.0$/, "");
      valOf("lineHeight").textContent = parseFloat(sliderLH.value)
        .toFixed(2)
        .replace(/0$/, "");
      valOf("wordSpacing").textContent = parseFloat(sliderWS.value)
        .toFixed(1)
        .replace(/\.0$/, "");
      valOf("messiness").textContent = sliderMess.value;
      valOf("rotIntensity").textContent = parseFloat(sliderRot.value).toFixed(1);
      valOf("topMargin").textContent = sliderTopMargin.value;
      valOf("lineStart").textContent = sliderLineStart.value;
      valOf("exportQuality").textContent = sliderQuality.value;
    }

    // ── Split a full canvas into per-page canvases (kept for parity) ───────
    function splitCanvasIntoPages(canvas: HTMLCanvasElement) {
      const size = PAGE_SIZES[pageSize];
      const pageH = Math.round(canvas.width * (size.h / size.w));
      const pages: HTMLCanvasElement[] = [];
      let y = 0;
      while (y < canvas.height) {
        const sliceH = Math.min(pageH, canvas.height - y);
        const pc = document.createElement("canvas");
        pc.width = canvas.width;
        pc.height = pageH;
        const ctx = pc.getContext("2d")!;
        ctx.drawImage(canvas, 0, y, canvas.width, sliceH, 0, 0, canvas.width, sliceH);
        pages.push(pc);
        y += pageH;
      }
      return pages;
    }
    void splitCanvasIntoPages;

    // ── Debounced render ────────────────────────────────────────────────────
    let renderTimer: ReturnType<typeof setTimeout> | null = null;
    function scheduleRender() {
      if (renderTimer) clearTimeout(renderTimer);
      renderTimer = setTimeout(render, 66);
    }

    // ── safeScale: cap canvas to 16 MP (iOS Safari limit) ─────────────────
    function safeScale(requestedScale: number) {
      const pw = preview.offsetWidth;
      const size = PAGE_SIZES[pageSize];
      const ph = pw * (size.h / size.w);
      const MAX = 16 * 1024 * 1024;
      const maxScale = Math.floor(Math.sqrt(MAX / (pw * ph)));
      return Math.max(1, Math.min(requestedScale, maxScale));
    }

    function downloadBlob(blob: Blob, filename: string) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    }

    // ── Native per-page canvas renderer — crisp text at any scale ──────────
    async function capturePageNative(pageIndex: number, scale: number) {
      if (document.fonts && document.fonts.ready) {
        await Promise.race([
          document.fonts.ready,
          new Promise((r) => setTimeout(r, 3000)),
        ]);
      }

      const size = PAGE_SIZES[pageSize];
      const previewW = preview.offsetWidth;
      const pageH = Math.round(previewW * (size.h / size.w));
      const GAP = 90;
      const pageTopInHost = pageIndex * (pageH + GAP);

      const canvas = document.createElement("canvas");
      canvas.width = Math.round(previewW * scale);
      canvas.height = Math.round(pageH * scale);
      const ctx = canvas.getContext("2d")!;

      if (!cbTransparent.checked) {
        ctx.fillStyle = pickerBg.value || "#f3f1ec";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      const previewTopInHost = preview.offsetTop;

      if (paperType !== "plain") {
        ctx.strokeStyle = LINE_COLOR;
        ctx.lineWidth = Math.max(0.5, scale * 0.25);

        if (paperType === "lined") {
          const h = canvas.height / 47.8;
          for (let k = 0; k < 44; k++) {
            const y = Math.round((2.8 + k) * h) + 0.5;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
          }
        } else if (paperType === "squared") {
          const rh = canvas.height / 53;
          const cw = canvas.width / 37;
          for (let k = 1; k < 53; k++) {
            const y = Math.round(k * rh) + 0.5;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
          }
          for (let k = 1; k < 37; k++) {
            const x = Math.round(k * cw) + 0.5;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
          }
        }
      }

      ctx.fillStyle = pickerText.value || "#1a1a1a";

      const previewRect = preview.getBoundingClientRect();
      for (const span of Array.from(
        preview.querySelectorAll<HTMLElement>("span.char"),
      )) {
        const spanRect = span.getBoundingClientRect();
        const spanTop = spanRect.top - previewRect.top;
        const spanLeft = spanRect.left - previewRect.left;
        const spanW = span.offsetWidth;
        const spanH = span.offsetHeight;

        const topInHost = previewTopInHost + spanTop;
        if (
          topInHost + spanH <= pageTopInHost ||
          topInHost >= pageTopInHost + pageH
        )
          continue;

        const relTop = topInHost - pageTopInHost;
        const relLeft = spanLeft;

        const cs = window.getComputedStyle(span);
        const fontSize = parseFloat(cs.fontSize);
        const rawFamily = cs.fontFamily
          .split(",")[0]
          .trim()
          .replace(/^["']|["']$/g, "");
        const fontFamily = '"' + rawFamily + '"';

        const tfm = span.style.transform || "";
        let ty = 0,
          rotDeg = 0,
          scl = 1;
        const tyM = tfm.match(/translateY\(([+-]?[\d.]+)px\)/);
        const rotM = tfm.match(/rotate\(([+-]?[\d.]+)deg\)/);
        const sclM = tfm.match(/scale\(([+-]?[\d.]+)\)/);
        if (tyM) ty = parseFloat(tyM[1]);
        if (rotM) rotDeg = parseFloat(rotM[1]);
        if (sclM) scl = parseFloat(sclM[1]);

        const pivotX = (relLeft + spanW * 0.5) * scale;
        const pivotY = (relTop + spanH * 0.5 + ty) * scale;

        ctx.save();
        ctx.translate(pivotX, pivotY);
        if (rotDeg !== 0) ctx.rotate((rotDeg * Math.PI) / 180);
        if (scl !== 1) ctx.scale(scl, scl);
        ctx.translate(-pivotX, -pivotY);

        const scaledFS = fontSize * scale;
        ctx.font = scaledFS + "px " + fontFamily;
        ctx.textBaseline = "alphabetic";
        ctx.fillText(
          span.textContent || "",
          relLeft * scale,
          (relTop + ty + fontSize * 0.82) * scale,
        );
        ctx.restore();
      }

      // Free-tier watermark — burned into pixels, not a strippable overlay.
      if (exportWatermark) {
        const pad = Math.round(canvas.width * 0.02);
        const fontPx = Math.max(11, Math.round(canvas.width * 0.014));
        ctx.font = `${fontPx}px system-ui, -apple-system, sans-serif`;
        ctx.textBaseline = "bottom";
        ctx.textAlign = "right";
        const x = canvas.width - pad;
        const y = canvas.height - pad;
        const m = ctx.measureText(WATERMARK_TEXT);
        ctx.fillStyle = "rgba(255,255,255,0.72)";
        ctx.fillRect(x - m.width - 8, y - fontPx - 4, m.width + 12, fontPx + 10);
        ctx.fillStyle = "rgba(26,26,26,0.55)";
        ctx.fillText(WATERMARK_TEXT, x, y);
        ctx.textAlign = "left";
      }

      return canvas;
    }

    // ── Authoritative Supabase export gate ─────────────────────────────────
    async function authorize(): Promise<ExportTreatment | null> {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exportType: "pdf", font: "My Handwriting" }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.reason === "limit_reached") {
          onBlockedRef.current(data.reason as BlockReason);
          return null;
        }
        throw new Error(data.error || "Export failed. Please try again.");
      }
      return {
        watermark: Boolean(data.watermark),
        multiPage: Boolean(data.multiPage),
      };
    }

    // Exports use the same built-in handwriting the preview shows, so there's
    // nothing to gate on here — the server /api/export call still enforces
    // auth and per-tier limits before any pixels leave.
    function guardHasFont(): boolean {
      return true;
    }

    // ── Export PDF ──────────────────────────────────────────────────────────
    async function onExportPdf() {
      if (!guardHasFont()) return;
      // Open the viewer tab synchronously inside the click gesture so iOS Safari
      // doesn't block it; we point it at the PDF once it's ready.
      const newTab = window.open("", "_blank");
      // Paint an immediate placeholder so the tab isn't a stark about:blank
      // while the PDF renders — users were closing the empty tab too early.
      if (newTab) {
        newTab.document.write(
          '<!doctype html><meta charset="utf-8"><title>Generating PDF…</title>' +
            '<body style="margin:0;height:100vh;display:flex;align-items:center;' +
            'justify-content:center;font:16px system-ui,-apple-system,sans-serif;' +
            'background:#0d0d0f;color:#9aa0a6">Generating your PDF…</body>',
        );
        newTab.document.close();
      }
      const orig = btnExportPDF.textContent;
      btnExportPDF.disabled = true;
      try {
        const treatment = await authorize();
        if (!treatment) {
          if (newTab) newTab.close();
          return;
        }
        exportWatermark = treatment.watermark;

        const allPages = root.querySelectorAll(".hw-page-sheet").length || 1;
        // Multi-page PDF is a Pro perk; other tiers export the first page only.
        const nPages = treatment.multiPage ? allPages : 1;
        const scale = safeScale(parseInt(sliderQuality.value, 10) || 10);
        const size = PAGE_SIZES[pageSize];
        const { jsPDF } = await import("jspdf");
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: [size.w, size.h],
        });
        const isTransp = cbTransparent.checked;
        for (let p = 0; p < nPages; p++) {
          btnExportPDF.textContent = `Rendering ${p + 1}/${nPages}…`;
          if (p > 0) pdf.addPage([size.w, size.h]);
          const canvas = await capturePageNative(p, scale);
          if (isTransp) {
            const dataUrl = canvas.toDataURL("image/png");
            pdf.addImage(dataUrl, "PNG", 0, 0, size.w, size.h, undefined, "FAST");
          } else {
            const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
            pdf.addImage(dataUrl, "JPEG", 0, 0, size.w, size.h, undefined, "FAST");
          }
        }
        const blob = pdf.output("blob");

        // Show the PDF immediately via a local blob URL — don't make the user
        // wait on the server upload round-trip (that was the slow part that left
        // the tab on about:blank). Persisting to the dashboard happens in the
        // background below.
        const blobUrl = URL.createObjectURL(blob);
        if (newTab) newTab.location.href = blobUrl;
        else downloadBlob(blob, "handwriting.pdf");
        setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);

        btnExportPDF.textContent = "✓ Saved";
        onExportedRef.current();

        // Persist the finished PDF under the user's profile so it stays
        // accessible (read-only) from the dashboard. Best-effort and fully
        // out of the critical path — the user already has the PDF.
        void (async () => {
          try {
            const fd = new FormData();
            fd.append("file", blob, "handwriting.pdf");
            await fetch("/api/export/save", { method: "POST", body: fd });
          } catch {
            /* ignore — saving is non-critical */
          }
        })();
      } catch (e) {
        if (newTab) newTab.close();
        alert("PDF export failed: " + (e as Error).message);
      } finally {
        exportWatermark = false;
        setTimeout(() => {
          btnExportPDF.textContent = orig;
          btnExportPDF.disabled = false;
        }, 2000);
      }
    }

    // ── Events ──────────────────────────────────────────────────────────────
    const layoutSliders = [
      sliderFontSize,
      sliderSizeVar,
      sliderLS,
      sliderLH,
      sliderWS,
      sliderMess,
      sliderRot,
      sliderTopMargin,
      sliderLineStart,
    ];
    const sliderHandlers: Array<[HTMLInputElement, () => void]> = [];
    layoutSliders.forEach((sl) => {
      const h = () => {
        fillSlider(sl);
        updateLabels();
        scheduleRender();
      };
      sl.addEventListener("input", h);
      sliderHandlers.push([sl, h]);
      fillSlider(sl);
    });
    const qualityHandler = () => {
      fillSlider(sliderQuality);
      updateLabels();
    };
    sliderQuality.addEventListener("input", qualityHandler);
    fillSlider(sliderQuality);

    const colorPickers = [pickerText, pickerBg];
    const colorHandler = () => {
      qa(".hw-ink-swatch").forEach((s) => s.classList.remove("active"));
      render();
    };
    colorPickers.forEach((p) => p.addEventListener("input", colorHandler));

    const transpHandler = () => {
      pickerBg.disabled = cbTransparent.checked;
      pickerBg.style.opacity = cbTransparent.checked ? "0.35" : "1";
      render();
    };
    cbTransparent.addEventListener("change", transpHandler);

    const pageSizeHandler = () => {
      pageSize = selPageSize.value as PageSizeId;
      insertPageSeparators();
    };
    selPageSize.addEventListener("change", pageSizeHandler);

    const rotBtns = qa<HTMLButtonElement>(".hw-rot-btn[data-dir]");
    const rotHandlers: Array<[HTMLButtonElement, () => void]> = [];
    rotBtns.forEach((btn) => {
      const h = () => {
        rotBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        rotDirection = btn.dataset.dir as RotDirection;
        render();
      };
      btn.addEventListener("click", h);
      rotHandlers.push([btn, h]);
    });

    // Which control rows are relevant depends on paper + snap. Line height is
    // irrelevant once snapping. Top margin stays adjustable everywhere EXCEPT
    // lined+snap (lined has a fixed notebook margin); squared+snap keeps it.
    function updateSnapRows() {
      rowLineHeight.style.display = snapToLines ? "none" : "";
      rowTopMargin.style.display =
        snapToLines && paperType === "lined" ? "none" : "";
    }

    const paperBtns = qa<HTMLButtonElement>("[data-paper]");
    const paperHandlers: Array<[HTMLButtonElement, () => void]> = [];
    paperBtns.forEach((btn) => {
      const h = () => {
        paperBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        paperType = btn.dataset.paper as PaperType;
        snapRow.style.display =
          paperType === "lined" || paperType === "squared" ? "" : "none";
        if (paperType === "plain") {
          snapToLines = false;
          cbSnapToLines.checked = false;
        }
        updateSnapRows();
        render();
      };
      btn.addEventListener("click", h);
      paperHandlers.push([btn, h]);
    });

    const snapHandler = () => {
      snapToLines = cbSnapToLines.checked;
      updateSnapRows();
      render();
    };
    cbSnapToLines.addEventListener("change", snapHandler);

    const swatches = qa<HTMLButtonElement>(".hw-ink-swatch");
    const swatchHandlers: Array<[HTMLButtonElement, () => void]> = [];
    swatches.forEach((swatch) => {
      const h = () => {
        swatches.forEach((s) => s.classList.remove("active"));
        swatch.classList.add("active");
        pickerText.value = swatch.dataset.color as string;
        render();
      };
      swatch.addEventListener("click", h);
      swatchHandlers.push([swatch, h]);
    });

    const inputHandler = () => {
      globalSeed = (globalSeed ^ (Date.now() & 0xffff)) >>> 0;
      render();
    };
    inputText.addEventListener("input", inputHandler);

    const randomiseHandler = () => {
      globalSeed = Math.floor(Math.random() * 0xffffffff);
      render();
    };
    btnRandomise.addEventListener("click", randomiseHandler);

    const clearHandler = () => {
      inputText.value = "";
      render();
    };
    btnClear.addEventListener("click", clearHandler);

    btnExportPDF.addEventListener("click", onExportPdf);

    // ── Boot ─────────────────────────────────────────────────────────────
    // Proactively load every variant so canvas exports never miss a glyph —
    // and, just as important, re-render once they resolve. With
    // font-display:block the first render() measures blank glyphs, so the
    // preview can come up empty until the fonts actually arrive; re-rendering
    // on load guarantees it paints.
    let disposed = false;
    // Register the user's own variants as runtime @font-face entries so both
    // the preview CSS and the canvas export can resolve them by family name.
    const addedFaces: FontFace[] = [];
    if (typeof FontFace !== "undefined" && document.fonts) {
      for (const v of userVariants) {
        try {
          const face = new FontFace(v.family, `url(${v.url})`, {
            display: "block",
          });
          document.fonts.add(face);
          addedFaces.push(face);
        } catch {
          /* ignore a malformed variant; built-in fallback still renders */
        }
      }
    }
    if (document.fonts) {
      const loads = [...ALL_IDS, "HW6"].map((id) => {
        try {
          return document.fonts.load(`16px "${id}"`);
        } catch {
          return Promise.resolve();
        }
      });
      const userLoads = addedFaces.map((f) => f.load().catch(() => {}));
      Promise.all([...loads, ...userLoads])
        .then(() => {
          if (!disposed) render();
        })
        .catch(() => {});
      document.fonts.ready
        .then(() => {
          if (!disposed) render();
        })
        .catch(() => {});
    }
    updateLabels();
    render();

    // Re-paginate on resize (page proportions are width-derived).
    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    const resizeHandler = () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(render, 150);
    };
    window.addEventListener("resize", resizeHandler);

    // ── Cleanup ───────────────────────────────────────────────────────────
    return () => {
      disposed = true;
      if (renderTimer) clearTimeout(renderTimer);
      if (resizeTimer) clearTimeout(resizeTimer);
      window.removeEventListener("resize", resizeHandler);
      sliderHandlers.forEach(([sl, h]) => sl.removeEventListener("input", h));
      sliderQuality.removeEventListener("input", qualityHandler);
      colorPickers.forEach((p) => p.removeEventListener("input", colorHandler));
      cbTransparent.removeEventListener("change", transpHandler);
      selPageSize.removeEventListener("change", pageSizeHandler);
      rotHandlers.forEach(([b, h]) => b.removeEventListener("click", h));
      paperHandlers.forEach(([b, h]) => b.removeEventListener("click", h));
      cbSnapToLines.removeEventListener("change", snapHandler);
      swatchHandlers.forEach(([s, h]) => s.removeEventListener("click", h));
      inputText.removeEventListener("input", inputHandler);
      btnRandomise.removeEventListener("click", randomiseHandler);
      btnClear.removeEventListener("click", clearHandler);
      btnExportPDF.removeEventListener("click", onExportPdf);
      // Drop the runtime user @font-face entries so a remount doesn't stack
      // duplicates (their content is identical, but keep the set tidy).
      for (const f of addedFaces) {
        try {
          document.fonts.delete(f);
        } catch {
          /* no-op */
        }
      }
      // Tear down everything the engine created inside the React-owned scroll.
      scroll.innerHTML = "";
    };
  }, []);

  // ── Static skeleton — React owns this; the engine fills .hw-preview-scroll
  return (
    <div className="hw-studio" ref={rootRef}>
      <div className="hw-main">
        {/* LEFT — text + actions */}
        <div className="hw-col-input">
          <div className="hw-input-panel">
            <div className="hw-panel-label">Text</div>
            <textarea
              data-ctl="text"
              defaultValue={DEFAULT_TEXT}
              placeholder="Type your text here…"
              spellCheck={false}
            />
          </div>
          <div className="hw-btn-stack">
            <button type="button" className="hw-btn accent" data-act="randomise">
              ↻ Randomise
            </button>
            <button type="button" className="hw-btn primary" data-act="pdf">
              📄 Export as PDF
            </button>
            <button type="button" className="hw-btn secondary" data-act="clear">
              Clear
            </button>
          </div>
        </div>

        {/* CENTER — live preview (engine-controlled) */}
        <div className="hw-col-preview">
          <div className="hw-preview-label">
            Live preview
            {isDemo && (
              <span
                style={{
                  marginLeft: 8,
                  borderRadius: 6,
                  background: "rgba(212,150,42,0.2)",
                  padding: "1px 6px",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  color: "var(--th-amber)",
                }}
              >
                Demo font
              </span>
            )}
          </div>
          <div className="hw-preview-scroll" ref={scrollRef} />
        </div>

        {/* RIGHT — settings */}
        <div className="hw-col-settings">
          <div>
            <div className="hw-section-label">Typography</div>
            <div className="hw-sliders">
              <div className="hw-slider-row">
                <div className="hw-slider-label">
                  Font size <span data-val="fontSize">10</span>px
                </div>
                <input type="range" data-ctl="fontSize" min={6} max={80} defaultValue={10} step={1} />
              </div>
              <div className="hw-slider-row">
                <div className="hw-slider-label">
                  Size variation <span data-val="sizeVariation">10</span>%
                  {locked && <span className="hw-lock-badge">Student</span>}
                </div>
                <input type="range" data-ctl="sizeVariation" min={0} max={100} defaultValue={10} step={1} />
              </div>
              <div className="hw-slider-row">
                <div className="hw-slider-label">
                  Letter spacing <span data-val="letterSpacing">-1</span>px
                </div>
                <input type="range" data-ctl="letterSpacing" min={-10} max={30} defaultValue={-1} step={0.5} />
              </div>
              <div className="hw-slider-row" data-row="lineHeight">
                <div className="hw-slider-label">
                  Line height <span data-val="lineHeight">1.09</span>
                </div>
                <input type="range" data-ctl="lineHeight" min={1.0} max={1.5} defaultValue={1.09} step={0.01} />
              </div>
              <div className="hw-slider-row">
                <div className="hw-slider-label">
                  Word spacing <span data-val="wordSpacing">12</span>px
                </div>
                <input type="range" data-ctl="wordSpacing" min={-5} max={20} defaultValue={12} step={0.5} />
              </div>
              <div className="hw-slider-row">
                <div className="hw-slider-label">
                  Messiness <span data-val="messiness">7</span>
                </div>
                <input type="range" data-ctl="messiness" min={0} max={20} defaultValue={7} step={1} />
              </div>
              <div className="hw-slider-row">
                <div className="hw-slider-label">
                  Line start offset <span data-val="lineStart">5</span>px
                  {locked && <span className="hw-lock-badge">Student</span>}
                </div>
                <input type="range" data-ctl="lineStart" min={0} max={10} defaultValue={5} step={1} />
              </div>
              <div className="hw-slider-row" data-row="topMargin">
                <div className="hw-slider-label">
                  Top margin <span data-val="topMargin">37</span>px
                </div>
                <input type="range" data-ctl="topMargin" min={0} max={66} defaultValue={37} step={1} />
              </div>
            </div>
          </div>

          <div className="hw-ctrl-divider" />

          <div>
            <div className="hw-section-label">
              Rotation per character
              {locked && <span className="hw-lock-badge">Student</span>}
            </div>
            <div className="hw-rot-dir-row">
              <button type="button" className="hw-rot-btn" data-dir="none">None</button>
              <button type="button" className="hw-rot-btn" data-dir="left">◄ Left</button>
              <button type="button" className="hw-rot-btn" data-dir="right">Right ►</button>
              <button type="button" className="hw-rot-btn active" data-dir="both">◄► Both</button>
            </div>
            <div className="hw-sliders" style={{ marginTop: 10 }}>
              <div className="hw-slider-row">
                <div className="hw-slider-label">
                  Intensity <span data-val="rotIntensity">7.0</span>°
                </div>
                <input type="range" data-ctl="rotIntensity" min={0} max={45} defaultValue={7} step={0.1} />
              </div>
            </div>
          </div>

          <div className="hw-ctrl-divider" />

          <div>
            <div className="hw-section-label">Paper</div>
            <div className="hw-rot-dir-row">
              <button type="button" className="hw-rot-btn active" data-paper="plain">Plain</button>
              <button type="button" className="hw-rot-btn" data-paper="lined">Lined</button>
              <button type="button" className="hw-rot-btn" data-paper="squared">Squared</button>
            </div>
            <div data-row="snap" style={{ display: "none", marginTop: 10 }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  cursor: "pointer",
                  fontSize: 12,
                  color: "rgba(255,255,255,.7)",
                }}
              >
                <input type="checkbox" data-ctl="snap" />
                <span>Snap to lines</span>
                {locked && <span className="hw-lock-badge">Student</span>}
              </label>
            </div>
          </div>

          <div className="hw-ctrl-divider" />

          <div>
            <div className="hw-section-label">Colors</div>
            <div className="hw-ink-swatches">
              <button type="button" className="hw-ink-swatch active" data-color="#1a1a1a" style={{ background: "#1a1a1a" }} title="Black" />
              <button type="button" className="hw-ink-swatch" data-color="#1c3a5e" style={{ background: "#1c3a5e" }} title="Navy Blue" />
              <button type="button" className="hw-ink-swatch" data-color="#1e4620" style={{ background: "#1e4620" }} title="Dark Green" />
              <button type="button" className="hw-ink-swatch" data-color="#6b6b6b" style={{ background: "#6b6b6b" }} title="Pencil Grey" />
              <button type="button" className="hw-ink-swatch" data-color="#7a1f1f" style={{ background: "#7a1f1f" }} title="Dark Red" />
              <button type="button" className="hw-ink-swatch" data-color="#4a3018" style={{ background: "#4a3018" }} title="Brown" />
            </div>
            <div className="hw-color-row">
              <div className="hw-color-field">
                <label>Text (custom)</label>
                <input type="color" data-ctl="textColor" defaultValue="#1a1a1a" />
              </div>
              <div className="hw-color-field">
                <label>Background</label>
                <input type="color" data-ctl="bgColor" defaultValue="#f8f7e9" />
                <label className="hw-transp-label" style={{ marginTop: 4 }}>
                  <input type="checkbox" data-ctl="bgTransparent" />
                  <span>Transparent</span>
                </label>
              </div>
            </div>
          </div>

          <div className="hw-ctrl-divider" />

          <div>
            <div className="hw-section-label">Page size</div>
            <div className="hw-select-wrap">
              <select data-ctl="pageSize" defaultValue="a4">
                <option value="a4">A4 — 210 × 297 mm</option>
                <option value="letter">Letter — 8.5 × 11 in</option>
                <option value="a5">A5 — 148 × 210 mm</option>
              </select>
            </div>
          </div>

          <div className="hw-ctrl-divider" />

          <div>
            <div className="hw-section-label">Export</div>
            <div className="hw-sliders">
              <div className="hw-slider-row">
                <div className="hw-slider-label">
                  Qualität <span data-val="exportQuality">20</span>×
                </div>
                <input type="range" data-ctl="exportQuality" min={4} max={40} defaultValue={20} step={2} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
