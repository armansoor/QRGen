const qrForm = document.getElementById("qrForm");
const qrType = document.getElementById("qrType");
const dynamicInputs = document.getElementById("dynamicInputs");
const qrContainer = document.getElementById("qrContainer");
const downloadBtns = document.getElementById("downloadBtns");

let qr;
let currentTheme = kpopThemes[0];

// Preset KPOP themes
const kpopThemes = [
  { fg: "#ff4da6", bg: "#fff0f6" }, // Blackpink pink
  { fg: "#9d4dff", bg: "#f5e6ff" }, // BTS purple
  { fg: "#00c3a5", bg: "#e6fff9" }, // NewJeans mint
  { fg: "#4db8ff", bg: "#f0f9ff" }, // IVE blue
  { fg: "#ff9966", bg: "#fff5e6" }, // Red Velvet orange
  { fg: "#ffcc00", bg: "#fffbe6" }  // Twice yellow
];

// Dynamic inputs
function renderInputs(type) {
  dynamicInputs.innerHTML = "";
  if (type === "text" || type === "url") {
    dynamicInputs.innerHTML = `<input type="text" id="qrData" placeholder="Enter ${type}" required>`;
  } else if (type === "image" || type === "video" || type === "file") {
    dynamicInputs.innerHTML = `<input type="file" id="qrFile" accept="${type}/*">`;
  } else if (type === "wifi") {
    dynamicInputs.innerHTML = `
      <input type="text" id="ssid" placeholder="WiFi SSID" required>
      <input type="text" id="password" placeholder="WiFi Password" required>
    `;
  } else if (type === "contact") {
    dynamicInputs.innerHTML = `
      <input type="text" id="name" placeholder="Name" required>
      <input type="text" id="phone" placeholder="Phone">
      <input type="email" id="email" placeholder="Email">
    `;
  } else if (type === "social") {
    dynamicInputs.innerHTML = `
      <input type="url" id="socialUrl" placeholder="Enter profile link" required>
    `;
  }
}
qrType.addEventListener("change", e => renderInputs(e.target.value));
renderInputs(qrType.value);

// Generate QR
qrForm.addEventListener("submit", async e => {
  e.preventDefault();

  let data = "";
  const type = qrType.value;

  if (type === "text" || type === "url") {
    data = document.getElementById("qrData").value;
  } else if (type === "image" || type === "video" || type === "file") {
    const file = document.getElementById("qrFile").files[0];
    if (!file) return alert("Please upload a file");
    data = await fileToBase64(file);
  } else if (type === "wifi") {
    const ssid = document.getElementById("ssid").value;
    const password = document.getElementById("password").value;
    data = `WIFI:T:WPA;S:${ssid};P:${password};;`;
  } else if (type === "contact") {
    const name = document.getElementById("name").value;
    const phone = document.getElementById("phone").value;
    const email = document.getElementById("email").value;
    data = `MECARD:N:${name};TEL:${phone};EMAIL:${email};;`;
  } else if (type === "social") {
    data = document.getElementById("socialUrl").value;
  }

  generateQR(data);
});

function generateQR(data) {
  qrContainer.innerHTML = "";

  // Pick random KPOP theme
  const theme = kpopThemes[Math.floor(Math.random() * kpopThemes.length)];
  currentTheme = theme;

  qr = new QRCode(qrContainer, {
    text: data,
    width: 256,
    height: 256,
    colorDark: theme.fg,
    colorLight: theme.bg,
    correctLevel: QRCode.CorrectLevel.H
  });

  downloadBtns.classList.remove("hidden");
}

async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Download buttons
document.getElementById("downloadPNG").addEventListener("click", () => {
  const canvas = qrContainer.querySelector("canvas");
  if (!canvas) return;
  const link = document.createElement("a");
  link.download = "qrcode.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
});

document.getElementById("downloadSVG").addEventListener("click", () => {
  // qrcodejs renders to canvas, so build a real vector SVG from the QR module matrix
  if (!qr || !qr._oQRCode) return;
  const matrix = qr._oQRCode;
  const count = matrix.getModuleCount();
  const size = 256;
  const scale = size / count;
  let rects = "";
  for (let r = 0; r < count; r++) {
    for (let c = 0; c < count; c++) {
      if (matrix.isDark(r, c)) {
        rects += `<rect x="${(c * scale).toFixed(2)}" y="${(r * scale).toFixed(2)}" width="${(scale + 0.1).toFixed(2)}" height="${(scale + 0.1).toFixed(2)}"/>`;
      }
    }
  }
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">` +
    `<rect width="${size}" height="${size}" fill="${currentTheme.bg}"/>` +
    `<g fill="${currentTheme.fg}">${rects}</g></svg>`;
  const blob = new Blob([svg], { type: "image/svg+xml" });
  const link = document.createElement("a");
  link.download = "qrcode.svg";
  link.href = URL.createObjectURL(blob);
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 2000);
});
