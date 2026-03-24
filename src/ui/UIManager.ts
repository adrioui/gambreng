import gsap from "gsap";
import { encodeParticipantsToURL } from "@/config";
import type { Participant } from "@/types";
import { colorToHex } from "@/utils/colorToHex";

export class UIManager {
  private copyLinkResetTimeout: number | null = null;
  private editBtn: HTMLButtonElement;
  private startBtn: HTMLButtonElement;
  private handleBtn: HTMLButtonElement;
  private resetBtn: HTMLButtonElement;
  private editorOverlay: HTMLElement;
  private editorForm: HTMLFormElement;
  private editorRows: HTMLElement;
  private saveEditorBtn: HTMLButtonElement;
  private cancelEditorBtn: HTMLButtonElement;
  private copyLinkBtn: HTMLButtonElement;
  private resultOverlay: HTMLElement;
  private resultContent: HTMLElement;
  private winnerThemeEl: HTMLElement;
  private winnerParticipantEl: HTMLElement;
  private participantThemesEl: HTMLElement;
  private titleEl: HTMLElement;

  constructor() {
    this.editBtn = document.getElementById("edit-btn") as HTMLButtonElement;
    this.startBtn = document.getElementById("start-btn") as HTMLButtonElement;
    this.handleBtn = document.getElementById("handle-btn") as HTMLButtonElement;
    this.resetBtn = document.getElementById("reset-btn") as HTMLButtonElement;
    this.editorOverlay = document.getElementById("editor-overlay")!;
    this.editorForm = document.getElementById("editor-form") as HTMLFormElement;
    this.editorRows = this.editorForm.querySelector(".editor-rows")!;
    this.saveEditorBtn = document.getElementById("save-editor-btn") as HTMLButtonElement;
    this.cancelEditorBtn = document.getElementById("cancel-editor-btn") as HTMLButtonElement;
    this.copyLinkBtn = document.getElementById("copy-link-btn") as HTMLButtonElement;
    this.resultOverlay = document.getElementById("result-overlay")!;
    this.resultContent = document.getElementById("result-content")!;
    this.winnerThemeEl = document.getElementById("winner-theme")!;
    this.winnerParticipantEl = document.getElementById("winner-participant")!;
    this.participantThemesEl = document.getElementById("participant-themes")!;
    this.titleEl = document.getElementById("title")!;
  }

  bindEvents(handlers: {
    start: () => void;
    spin: () => void;
    reset: () => void;
    edit: () => void;
    saveParticipants: (participants: Participant[]) => void;
  }): void {
    this.startBtn.addEventListener("click", handlers.start);
    this.handleBtn.addEventListener("click", handlers.spin);
    this.resetBtn.addEventListener("click", handlers.reset);
    this.editBtn.addEventListener("click", handlers.edit);
    this.cancelEditorBtn.addEventListener("click", () => this.closeEditor());
    this.saveEditorBtn.addEventListener("click", () => {
      handlers.saveParticipants(this.readEditorParticipants());
    });
    this.copyLinkBtn.addEventListener("click", () => this.copyShareLink());
  }

  openEditor(participants: Participant[]): void {
    this.editorRows.innerHTML = "";
    participants.forEach((p, i) => {
      const row = document.createElement("div");
      row.className = "editor-row";
      const colorHex = colorToHex(p.color);
      row.innerHTML = `
        <label>Peserta ${i + 1}</label>
        <div class="row-fields">
          <input type="text" name="name-${i}" value="${this.escapeHtml(p.name)}" placeholder="Nama">
          <input type="text" name="theme-${i}" value="${this.escapeHtml(p.theme)}" placeholder="Tema">
          <input type="color" name="color-${i}" value="${colorHex}">
        </div>
      `;
      this.editorRows.appendChild(row);
    });
    this.editorOverlay.classList.remove("hidden");
  }

  closeEditor(): void {
    this.editorOverlay.classList.add("hidden");
  }

  readEditorParticipants(): Participant[] {
    const participants: Participant[] = [];
    for (let i = 0; i < 4; i++) {
      const name =
        (this.editorForm.querySelector(`[name="name-${i}"]`) as HTMLInputElement).value.trim() ||
        `Peserta ${i + 1}`;
      const theme =
        (this.editorForm.querySelector(`[name="theme-${i}"]`) as HTMLInputElement).value.trim() ||
        `Tema ${i + 1}`;
      const colorVal = (this.editorForm.querySelector(`[name="color-${i}"]`) as HTMLInputElement)
        .value;
      const color = parseInt(colorVal.slice(1), 16);
      participants.push({ name, theme, color });
    }
    return participants;
  }

  setEditEnabled(enabled: boolean): void {
    this.editBtn.classList.toggle("hidden", !enabled);
  }

  async copyShareLink(): Promise<void> {
    const participants = this.readEditorParticipants();
    const shareURL = new URL(window.location.href);
    shareURL.search = encodeParticipantsToURL(participants).slice(1);

    try {
      await this.writeClipboardText(shareURL.toString());
      this.flashCopyButtonLabel("TERSALIN!");
    } catch {
      this.flashCopyButtonLabel("GAGAL SALIN");
    }
  }

  hideTitle(): void {
    gsap.to(this.titleEl, {
      opacity: 0,
      y: -40,
      duration: 0.5,
      onComplete: () => {
        this.titleEl.classList.add("hidden");
        this.titleEl.style.opacity = "";
        this.titleEl.style.transform = "";
      },
    });
    this.startBtn.classList.add("hidden");
  }

  showParticipantThemes(participants: Participant[]): void {
    this.participantThemesEl.innerHTML = participants
      .map(
        (p, i) =>
          `<div class="theme-item p${i + 1}">P${i + 1}: ${this.escapeHtml(p.name)} — "${this.escapeHtml(p.theme)}"</div>`,
      )
      .join("");
    this.participantThemesEl.classList.remove("hidden");
    gsap.from(this.participantThemesEl, { opacity: 0, x: 50, duration: 0.5 });
  }

  hideParticipantThemes(): void {
    this.participantThemesEl.classList.add("hidden");
  }

  fadeOutParticipantThemes(): void {
    gsap.to(this.participantThemesEl, {
      opacity: 0,
      duration: 0.3,
      onComplete: () => this.participantThemesEl.classList.add("hidden"),
    });
  }

  showHandleButton(): void {
    this.handleBtn.classList.remove("hidden");
    gsap.from(this.handleBtn, { scale: 0, duration: 0.5, ease: "back.out(2)" });
  }

  disableHandleButton(): void {
    this.handleBtn.disabled = true;
    this.handleBtn.classList.add("spinning");
  }

  showResetButton(): void {
    this.handleBtn.classList.add("hidden");
    this.resetBtn.classList.remove("hidden");
  }

  showResult(winner: Participant): void {
    const col = colorToHex(winner.color);
    this.winnerThemeEl.textContent = `"${winner.theme}"`;
    this.winnerThemeEl.style.color = col;
    this.winnerParticipantEl.textContent = `Diusulkan oleh: ${winner.name}`;
    this.resultContent.style.borderColor = col;
    this.resultOverlay.classList.remove("hidden");
    gsap.from(this.resultContent, {
      scale: 0,
      rotation: -0.08,
      duration: 0.7,
      ease: "elastic.out(1, 0.5)",
    });
  }

  hideResult(): void {
    gsap.to(this.resultContent, {
      scale: 0,
      duration: 0.3,
      ease: "back.in(1.7)",
      onComplete: () => {
        this.resultOverlay.classList.add("hidden");
        this.resultContent.style.transform = "";
      },
    });
  }

  resetAll(): void {
    this.resetBtn.classList.add("hidden");
    this.startBtn.classList.remove("hidden");
    this.handleBtn.classList.add("hidden");
    this.handleBtn.disabled = false;
    this.handleBtn.classList.remove("spinning");
    this.titleEl.classList.remove("hidden");
    this.participantThemesEl.classList.add("hidden");
    this.participantThemesEl.style.opacity = "";
  }

  private escapeHtml(text: string): string {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  private async writeClipboardText(text: string): Promise<void> {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "true");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);

    const copied = document.execCommand("copy");
    document.body.removeChild(textarea);

    if (!copied) {
      throw new Error("Clipboard copy failed");
    }
  }

  private flashCopyButtonLabel(label: string): void {
    if (this.copyLinkResetTimeout !== null) {
      window.clearTimeout(this.copyLinkResetTimeout);
    }

    const originalText = "SALIN LINK";
    this.copyLinkBtn.textContent = label;
    this.copyLinkResetTimeout = window.setTimeout(() => {
      this.copyLinkBtn.textContent = originalText;
      this.copyLinkResetTimeout = null;
    }, 2000);
  }
}
