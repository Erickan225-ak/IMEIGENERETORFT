const amountInput = document.querySelector("#amount");
const prefixInput = document.querySelector("#prefix");
const results = document.querySelector("#results");
const status = document.querySelector("#status");
const generateBtn = document.querySelector("#generate");
const selectAllBtn = document.querySelector("#selectAll");
const copyBtn = document.querySelector("#copy");
const progressWrap = document.querySelector("#progressWrap");
const progressBar = document.querySelector("#progressBar");
const progressLabel = document.querySelector("#progressLabel");

const LOAD_DURATION_MS = 3000;

function randomDigit() {
  return String(Math.floor(Math.random() * 10));
}

// Calcule le chiffre de contrôle Luhn pour 14 chiffres (règle IMEI :
// on double les index impairs en partant de la gauche).
function luhnCheckDigit(firstFourteen) {
  let sum = 0;
  for (let index = 0; index < 14; index += 1) {
    let digit = Number(firstFourteen[index]);
    if (index % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return (10 - (sum % 10)) % 10;
}

// Vérifie un IMEI complet de 15 chiffres (somme Luhn mod 10 = 0).
function isValidImei(imei) {
  if (!/^\d{15}$/.test(imei)) return false;
  let sum = 0;
  for (let i = 0; i < 15; i += 1) {
    let digit = Number(imei[i]);
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return sum % 10 === 0;
}

function makeTestValue(prefix) {
  let firstFourteen = prefix;
  while (firstFourteen.length < 14) {
    firstFourteen += randomDigit();
  }
  return firstFourteen + luhnCheckDigit(firstFourteen);
}

// Anime la barre de progression de 1 à 100 sur LOAD_DURATION_MS.
function animateProgress() {
  return new Promise(resolve => {
    progressWrap.hidden = false;
    progressBar.style.width = "1%";
    progressBar.setAttribute("aria-valuenow", "1");
    progressLabel.textContent = "1%";

    const start = performance.now();

    function frame(now) {
      const elapsed = now - start;
      const ratio = Math.min(elapsed / LOAD_DURATION_MS, 1);
      const percent = Math.max(1, Math.round(ratio * 100));

      progressBar.style.width = `${percent}%`;
      progressBar.setAttribute("aria-valuenow", String(percent));
      progressLabel.textContent = `${percent}%`;

      if (ratio < 1) {
        requestAnimationFrame(frame);
      } else {
        resolve();
      }
    }

    requestAnimationFrame(frame);
  });
}

function renderList(amount, prefix) {
  results.replaceChildren();
  for (let index = 0; index < amount; index += 1) {
    const item = document.createElement("li");

    const number = document.createElement("span");
    number.className = "item-number";
    number.textContent = `${index + 1}.`;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = true;
    checkbox.setAttribute("aria-label", `Sélectionner la valeur ${index + 1}`);

    const value = document.createElement("code");
    const imei = makeTestValue(prefix);
    value.textContent = imei;

    const valid = isValidImei(imei);
    const badge = document.createElement("span");
    badge.className = valid ? "badge" : "badge invalid";
    badge.textContent = valid ? "✓ valide" : "✗ Invalide";

    item.append(number, checkbox, value, badge);
    results.append(item);
  }
}

let isGenerating = false;

async function generate() {
  if (isGenerating) return;

  const amount = Number(amountInput.value);
  const prefix = prefixInput.value.replace(/\D/g, "");
  prefixInput.value = prefix;

  if (!Number.isInteger(amount) || amount < 1 || amount > 100) {
    status.textContent = "Choisissez un nombre d'emei entre 1 et 100.";
    return;
  }
  if (prefix.length > 14) {
    status.textContent = "Le préfixe ne peut pas dépasser 14 chiffres.";
    return;
  }

  isGenerating = true;
  generateBtn.disabled = true;
  selectAllBtn.disabled = true;
  copyBtn.disabled = true;
  results.replaceChildren();
  status.textContent = "Génération en cours…";

  try {
    await animateProgress();
    renderList(amount, prefix);
    status.textContent = `${amount} IMEI de test généré${amount > 1 ? "s" : ""}.`;
  } finally {
    progressWrap.hidden = true;
    progressBar.style.width = "1%";
    progressBar.setAttribute("aria-valuenow", "1");
    progressLabel.textContent = "1%";
    isGenerating = false;
    generateBtn.disabled = false;
    selectAllBtn.disabled = false;
    copyBtn.disabled = false;
  }
}

generateBtn.addEventListener("click", generate);

selectAllBtn.addEventListener("click", () => {
  results.querySelectorAll('input[type="checkbox"]').forEach(box => {
    box.checked = true;
  });
});

copyBtn.addEventListener("click", async () => {
  const selected = [...results.querySelectorAll("li")]
    .filter(item => item.querySelector("input").checked)
    .map(item => item.querySelector("code").textContent);

  if (selected.length === 0) {
    status.textContent = "Sélectionnez au moins une valeur.";
    return;
  }

  try {
    await navigator.clipboard.writeText(selected.join("\n"));
    status.textContent = `${selected.length} valeur${selected.length > 1 ? "s" : ""} copiée${selected.length > 1 ? "s" : ""}.`;
  } catch (error) {
    status.textContent = "Copie impossible dans ce navigateur. Sélectionnez les valeurs manuellement.";
  }
});

prefixInput.addEventListener("input", () => {
  prefixInput.value = prefixInput.value.replace(/\D/g, "").slice(0, 14);
});
