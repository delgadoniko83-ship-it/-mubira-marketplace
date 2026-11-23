/* MUBIRA Studio 360 — captura de secuencia fotográfica desde cámara */
(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const DB_NAME = "mubira-studio360";
  const STORE = "captures";
  const MAX_FRAMES = 24;
  const CAPTURE_INTERVAL = 450;
  let db = null, stream = null, timer = null, frames = [], activeCapture = false;
  let viewerFrames = [], viewerIndex = 0, pointerX = null, pointerCarry = 0;

  const modal = $("studio360Modal");
  const video = $("studio360Video");
  const status = $("studio360Status");
  const progress = $("studio360ProgressBar");
  const startButton = $("studio360Start");

  function openModal() {
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    refreshLibrary();
  }
  function closeModal() {
    stopCapture(false);
    stopCamera();
    modal.hidden = true;
    document.body.style.overflow = "";
  }
  function openDatabase() {
    if (db) return Promise.resolve(db);
    return new Promise((resolve, reject) => {
      if (!("indexedDB" in window)) return reject(new Error("Este navegador no permite guardar capturas localmente."));
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(STORE)) database.createObjectStore(STORE, { keyPath: "id" });
      };
      request.onsuccess = () => { db = request.result; resolve(db); };
      request.onerror = () => reject(request.error || new Error("No se pudo abrir el almacenamiento local."));
    });
  }
  async function getAll() {
    const database = await openDatabase();
    return new Promise((resolve, reject) => {
      const request = database.transaction(STORE, "readonly").objectStore(STORE).getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }
  async function saveCapture(record) {
    const database = await openDatabase();
    return new Promise((resolve, reject) => {
      const request = database.transaction(STORE, "readwrite").objectStore(STORE).put(record);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
  async function deleteCapture(id) {
    const database = await openDatabase();
    return new Promise((resolve, reject) => {
      const request = database.transaction(STORE, "readwrite").objectStore(STORE).delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
  async function refreshLibrary() {
    const box = $("studio360Library");
    try {
      const records = (await getAll()).sort((a,b) => b.createdAt - a.createdAt);
      $("studio360Count").textContent = String(records.length);
      box.replaceChildren();
      if (!records.length) {
        const empty = document.createElement("p");
        empty.className = "studio360-empty";
        empty.textContent = "Todavía no has creado vistas 360°.";
        box.append(empty);
        return;
      }
      records.forEach(record => {
        const item = document.createElement("div");
        item.className = "studio360-item";
        const image = document.createElement("img");
        image.className = "studio360-thumb";
        image.src = record.frames[0];
        image.alt = "";
        const copy = document.createElement("div");
        copy.className = "studio360-item-copy";
        const name = document.createElement("b");
        name.textContent = record.name;
        const detail = document.createElement("small");
        detail.textContent = record.frames.length + " ángulos · guardado en este dispositivo";
        copy.append(name, detail);
        const view = document.createElement("button");
        view.type = "button";
        view.textContent = "VER";
        view.addEventListener("click", () => showViewer(record));
        const remove = document.createElement("button");
        remove.type = "button";
        remove.textContent = "×";
        remove.setAttribute("aria-label", "Eliminar " + record.name);
        remove.addEventListener("click", async () => {
          if (!window.confirm("¿Eliminar esta captura de este dispositivo?")) return;
          await deleteCapture(record.id);
          refreshLibrary();
        });
        item.append(image, copy, view, remove);
        box.append(item);
      });
    } catch (error) {
      box.textContent = "No fue posible cargar las capturas: " + error.message;
    }
  }
  async function startCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      status.textContent = "Este navegador no ofrece acceso a la cámara. Abre MUBIRA desde Chrome y mediante una conexión HTTPS.";
      return;
    }
    try {
      stopCamera();
      stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 960 } }
      });
      video.srcObject = stream;
      await video.play();
      $("studio360CameraPlaceholder").hidden = true;
      startButton.disabled = false;
      $("studio360Camera").textContent = "Cámara activada";
      status.textContent = "Cámara lista. Escribe el nombre del mueble y comienza el recorrido.";
    } catch (error) {
      status.textContent = error.name === "NotAllowedError"
        ? "No diste permiso para usar la cámara. Autorízala en los ajustes del navegador."
        : "No se pudo activar la cámara: " + error.message;
    }
  }
  function stopCamera() {
    if (stream) stream.getTracks().forEach(track => track.stop());
    stream = null;
    video.srcObject = null;
    $("studio360CameraPlaceholder").hidden = false;
    startButton.disabled = true;
    $("studio360Camera").textContent = "Activar cámara";
  }
  function takeFrame() {
    if (!video.videoWidth || !video.videoHeight) return;
    const canvas = document.createElement("canvas");
    const scale = Math.min(1, 720 / video.videoWidth);
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    const context = canvas.getContext("2d", { alpha: false });
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    frames.push(canvas.toDataURL("image/jpeg", 0.76));
    progress.style.width = Math.round(frames.length / MAX_FRAMES * 100) + "%";
    status.textContent = "Capturando ángulos: " + frames.length + " de " + MAX_FRAMES + ". Sigue rodeando el mueble lentamente.";
    if (frames.length >= MAX_FRAMES) stopCapture(true);
  }
  function stopCapture(save) {
    if (timer) window.clearInterval(timer);
    timer = null;
    const wasActive = activeCapture;
    activeCapture = false;
    $("studio360Stop").hidden = true;
    startButton.disabled = !stream;
    if (!wasActive) return;
    if (save && frames.length >= 8) {
      persistFrames();
    } else if (frames.length < 8) {
      status.textContent = "Se necesitan al menos 8 ángulos. Vuelve a intentarlo rodeando el mueble.";
    }
  }
  async function persistFrames() {
    const name = $("studio360Name").value.trim() || "Mueble sin nombre";
    const record = { id: "capture-" + Date.now(), name, frames: frames.slice(), createdAt: Date.now() };
    try {
      await saveCapture(record);
      status.textContent = "¡Vista 360° creada y guardada en este dispositivo! Ya puedes abrirla desde Mis capturas.";
      await refreshLibrary();
      showViewer(record);
    } catch (error) {
      status.textContent = "La captura se hizo, pero no se pudo guardar: " + error.message;
    }
  }
  function beginCapture() {
    if (!stream || activeCapture) return;
    frames = [];
    progress.style.width = "0%";
    activeCapture = true;
    startButton.disabled = true;
    $("studio360Stop").hidden = false;
    status.textContent = "Empieza a caminar lentamente alrededor del mueble.";
    takeFrame();
    timer = window.setInterval(takeFrame, CAPTURE_INTERVAL);
  }
  function showViewer(record) {
    viewerFrames = record.frames || [];
    viewerIndex = 0;
    $("studio360ViewerName").textContent = record.name;
    $("studio360ViewerImage").src = viewerFrames[0] || "";
    $("studio360Viewer").hidden = false;
  }
  function closeViewer() { $("studio360Viewer").hidden = true; }
  function changeFrame(delta) {
    if (!viewerFrames.length) return;
    viewerIndex = (viewerIndex + delta + viewerFrames.length) % viewerFrames.length;
    $("studio360ViewerImage").src = viewerFrames[viewerIndex];
  }

  $("openStudio360").addEventListener("click", openModal);
  $("closeStudio360").addEventListener("click", closeModal);
  $("studio360Camera").addEventListener("click", startCamera);
  startButton.addEventListener("click", beginCapture);
  $("studio360Stop").addEventListener("click", () => stopCapture(true));
  $("closeStudio360Viewer").addEventListener("click", closeViewer);
  $("studio360Viewer").addEventListener("click", event => { if (event.target === $("studio360Viewer")) closeViewer(); });
  $("studio360Turntable").addEventListener("pointerdown", event => {
    pointerX = event.clientX;
    pointerCarry = 0;
    event.currentTarget.setPointerCapture(event.pointerId);
  });
  $("studio360Turntable").addEventListener("pointermove", event => {
    if (pointerX === null) return;
    pointerCarry += event.clientX - pointerX;
    pointerX = event.clientX;
    if (Math.abs(pointerCarry) >= 12) {
      const steps = Math.trunc(pointerCarry / 12);
      changeFrame(-steps);
      pointerCarry -= steps * 12;
    }
  });
  ["pointerup", "pointercancel", "lostpointercapture"].forEach(type =>
    $("studio360Turntable").addEventListener(type, () => { pointerX = null; pointerCarry = 0; })
  );
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      if (!$("studio360Viewer").hidden) closeViewer();
      else if (!modal.hidden) closeModal();
    }
  });
  window.addEventListener("pagehide", stopCamera);
  refreshLibrary();
})();