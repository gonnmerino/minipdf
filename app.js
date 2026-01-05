document.addEventListener("DOMContentLoaded", () => {

  // =============================
  // 1. INICIALIZAR QUILL
  // =============================
  const quill = new Quill("#editor", {
    theme: "snow",
    placeholder: "Escribe tu documento acá...",
    modules: {
      toolbar: [
        ["bold", "italic", "underline", "strike"],
        [{ header: [1, 2, 3, false] }],
        [{ list: "ordered" }, { list: "bullet" }],
        [{ align: [] }],
        ["clean"]
      ]
    }
  });

  // =============================
  // 2. GUARDADO AUTOMÁTICO
  // =============================
  const STORAGE_KEY = "miniPdfContent";
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    quill.root.innerHTML = saved;
  }

  quill.on("text-change", () => {
    localStorage.setItem(STORAGE_KEY, quill.root.innerHTML);
  });

  // =============================
  // 3. ELEMENTOS DOM
  // =============================
  const exportBtn = document.getElementById("exportBtn");
  const clearBtn = document.getElementById("clearBtn");
  const filenameInput = document.getElementById("filename");

  exportBtn.addEventListener("click", exportToPDF_TextoReal);

  clearBtn.addEventListener("click", () => {
    if (confirm("¿Seguro que querés borrar todo el contenido?")) {
      quill.setText("");
      localStorage.removeItem(STORAGE_KEY);
    }
  });

  // =============================
  // 4. EXPORTAR PDF (TEXTO REAL)
  // =============================
  async function exportToPDF_TextoReal() {
    const { jsPDF } = window.jspdf;

    if (quill.getText().trim() === "") {
      alert("El documento está vacío");
      return;
    }

    // ===== ESTADO DEL BOTÓN =====
    exportBtn.disabled = true;
    const originalHTML = exportBtn.innerHTML;
    const originalWidth = exportBtn.offsetWidth;

    exportBtn.style.width = `${originalWidth}px`;
    exportBtn.innerHTML = "Convirtiendo...";
    exportBtn.classList.add("opacity-80", "cursor-not-allowed");

    // 🔑 permitir repaint
    await new Promise(resolve => setTimeout(resolve, 50));

    // ===== CONFIG PDF =====
    const doc = new jsPDF("p", "mm", "a4");

    const marginX = 20;
    let cursorY = 20;
    const pageHeight = doc.internal.pageSize.height;
    const maxWidth = 170;

    const temp = document.createElement("div");
    temp.innerHTML = quill.root.innerHTML;

    temp.childNodes.forEach(node => {

      // ---------- H1 ----------
      if (node.nodeName === "H1") {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(24);
        cursorY = newPageIfNeeded(doc, cursorY, pageHeight);
        doc.text(node.innerText, marginX, cursorY);
        cursorY += 14;
      }

      // ---------- H2 ----------
      else if (node.nodeName === "H2") {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(18);
        cursorY = newPageIfNeeded(doc, cursorY, pageHeight);
        doc.text(node.innerText, marginX, cursorY);
        cursorY += 12;
      }

      // ---------- H3 ----------
      else if (node.nodeName === "H3") {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        cursorY = newPageIfNeeded(doc, cursorY, pageHeight);
        doc.text(node.innerText, marginX, cursorY);
        cursorY += 10;
      }

      // ---------- P ----------
      else if (node.nodeName === "P") {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(12);
        const lines = doc.splitTextToSize(node.innerText, maxWidth);
        cursorY = newPageIfNeeded(doc, cursorY + 4, pageHeight);
        doc.text(lines, marginX, cursorY);
        cursorY += lines.length * 6;
      }

      // ---------- LISTAS ----------
      else if (node.nodeName === "UL" || node.nodeName === "OL") {
        let index = 1;
        const ordered = node.nodeName === "OL";

        node.querySelectorAll("li").forEach(li => {
          const prefix = ordered ? `${index}. ` : "• ";
          const lines = doc.splitTextToSize(prefix + li.innerText, maxWidth);
          cursorY = newPageIfNeeded(doc, cursorY, pageHeight);
          doc.text(lines, marginX, cursorY);
          cursorY += lines.length * 6;
          index++;
        });
      }
    });

    // ===== GUARDAR =====
    doc.save(`${filenameInput.value || "documento"}.pdf`);

    // ===== RESTAURAR BOTÓN (UX SUAVE) =====
    setTimeout(() => {
      exportBtn.disabled = false;
      exportBtn.innerHTML = originalHTML;
      exportBtn.style.width = "";
      exportBtn.classList.remove("opacity-80", "cursor-not-allowed");
    }, 800);
  }

  // =============================
  // 5. PAGINADO
  // =============================
  function newPageIfNeeded(doc, y, pageHeight) {
    if (y > pageHeight - 20) {
      doc.addPage();
      return 20;
    }
    return y;
  }

});
const whatsappBtn = document.getElementById("whatsappBtn");

whatsappBtn.addEventListener("click", () => {

  exportToPDF_TextoReal();

  const text = encodeURIComponent(
    "Te comparto este PDF"
  );

  const waUrl = `https://wa.me/?text=${text}`;

  window.open(waUrl, "_blank");
});

