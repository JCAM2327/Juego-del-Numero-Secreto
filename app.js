const NUMERO_MAXIMO = 10;
const CLAVE_MEJOR_MARCA = "juego-numero-secreto-mejor-marca";

const elementos = {
  formulario: document.getElementById("formulario"),
  input: document.getElementById("valorUsuario"),
  botonIntentar: document.getElementById("botonIntentar"),
  botonReiniciar: document.getElementById("botonReiniciar"),
  mensaje: document.getElementById("mensaje"),
  historial: document.getElementById("historial"),
  intentos: document.getElementById("intentos"),
  mejorMarca: document.getElementById("mejorMarca"),
  estadoRonda: document.getElementById("estadoRonda"),
  rondaInfo: document.getElementById("rondaInfo"),
  juego: document.getElementById("game"),
};

let numeroSecreto = null;
let intentos = 0;
let numerosSorteados = new Set();
let rondaTerminada = false;
let pistaActual = null;

function leerMejorMarca() {
  try {
    const valor = Number(localStorage.getItem(CLAVE_MEJOR_MARCA));
    return Number.isInteger(valor) && valor > 0 ? valor : null;
  } catch {
    return null;
  }
}

function guardarMejorMarca(valor) {
  try {
    localStorage.setItem(CLAVE_MEJOR_MARCA, String(valor));
  } catch {
    return;
  }
}

function mostrarMejorMarca() {
  const mejor = leerMejorMarca();
  elementos.mejorMarca.textContent = mejor
    ? `${mejor} ${mejor === 1 ? "intento" : "intentos"}`
    : "—";
}

function elegirNumeroSecreto() {
  if (numerosSorteados.size >= NUMERO_MAXIMO) {
    numerosSorteados.clear();
  }

  const disponibles = [];
  for (let numero = 1; numero <= NUMERO_MAXIMO; numero += 1) {
    if (!numerosSorteados.has(numero)) {
      disponibles.push(numero);
    }
  }

  const numeroElegido = disponibles[Math.floor(Math.random() * disponibles.length)];
  numerosSorteados.add(numeroElegido);
  return numeroElegido;
}

function actualizarRondaInfo() {
  elementos.rondaInfo.textContent = `Números sorteados: ${numerosSorteados.size} de ${NUMERO_MAXIMO}`;
}

function mensajePredeterminado() {
  return pistaActual
    ? `El número secreto ${pistaActual}.`
    : `Elige un número del 1 al ${NUMERO_MAXIMO}.`;
}

function limpiarEstadoVisual() {
  elementos.juego.classList.remove("is-won", "is-error");
  elementos.estadoRonda.classList.remove("is-won");
  elementos.mensaje.className = "game__message";
  elementos.input.removeAttribute("aria-invalid");
}

function iniciarRonda() {
  numeroSecreto = elegirNumeroSecreto();
  intentos = 0;
  rondaTerminada = false;
  pistaActual = null;
  elementos.historial.replaceChildren();
  elementos.input.value = "";
  elementos.input.disabled = false;
  elementos.botonIntentar.disabled = false;
  elementos.botonReiniciar.disabled = true;
  elementos.intentos.textContent = "0";
  elementos.estadoRonda.textContent = "En juego";
  elementos.mensaje.textContent = mensajePredeterminado();
  limpiarEstadoVisual();
  actualizarRondaInfo();
  elementos.input.focus();
}

function validarIntento(valor) {
  if (valor === "") {
    return elementos.input.validity.badInput
      ? "Escribe solo dígitos, sin letras ni símbolos."
      : "Escribe un número antes de probar.";
  }

  const numero = Number(valor);
  if (!Number.isInteger(numero)) {
    return "El intento debe ser un número entero.";
  }

  if (numero < 1 || numero > NUMERO_MAXIMO) {
    return `El número debe estar entre 1 y ${NUMERO_MAXIMO}.`;
  }

  return null;
}

function crearFichaIntento(numero, pista, acertado = false) {
  const ficha = document.createElement("li");
  ficha.className = acertado ? "attempt is-correct" : "attempt";

  const valor = document.createElement("strong");
  valor.textContent = String(numero);

  ficha.append(valor, ` ${pista}`);
  return ficha;
}

function mostrarError(texto) {
  elementos.mensaje.textContent = texto;
  elementos.mensaje.className = "game__message is-error";
  elementos.input.setAttribute("aria-invalid", "true");
  elementos.juego.classList.remove("is-error");
  void elementos.juego.offsetWidth;
  elementos.juego.classList.add("is-error");
  elementos.input.focus();
}

function finalizarRonda() {
  rondaTerminada = true;
  elementos.input.disabled = true;
  elementos.botonIntentar.disabled = true;
  elementos.botonReiniciar.disabled = false;
  elementos.estadoRonda.textContent = "¡Ganaste!";
  elementos.estadoRonda.classList.add("is-won");
  elementos.juego.classList.add("is-won");

  const mejor = leerMejorMarca();
  if (!mejor || intentos < mejor) {
    guardarMejorMarca(intentos);
    mostrarMejorMarca();
    elementos.mensaje.textContent += " Nuevo récord personal.";
  }

  if (numerosSorteados.size >= NUMERO_MAXIMO) {
    elementos.mensaje.textContent += " Completaste los 10 números: pulsa Nuevo juego para reiniciar el ciclo.";
  }

  elementos.botonReiniciar.focus();
}

function comprobarIntento(evento) {
  evento.preventDefault();

  if (rondaTerminada) {
    return;
  }

  const valor = elementos.input.value.trim();
  const error = validarIntento(valor);

  if (error) {
    mostrarError(error);
    return;
  }

  const numero = Number(valor);
  intentos += 1;
  elementos.intentos.textContent = String(intentos);
  elementos.input.removeAttribute("aria-invalid");

  if (numero === numeroSecreto) {
    elementos.mensaje.textContent =
      intentos === 1 ? "¡Acertaste en 1 intento!" : `¡Acertaste en ${intentos} intentos!`;
    elementos.mensaje.className = "game__message is-success";
    elementos.historial.appendChild(crearFichaIntento(numero, "acertado", true));
    finalizarRonda();
  } else {
    pistaActual = numero > numeroSecreto ? "es menor" : "es mayor";
    elementos.mensaje.textContent = `El número secreto ${pistaActual}.`;
    elementos.mensaje.className = "game__message";
    elementos.historial.appendChild(crearFichaIntento(numero, pistaActual));
    elementos.input.value = "";
    elementos.input.focus();
  }

  actualizarRondaInfo();
}

elementos.formulario.addEventListener("submit", comprobarIntento);
elementos.botonReiniciar.addEventListener("click", iniciarRonda);

elementos.input.addEventListener("input", () => {
  if (elementos.mensaje.classList.contains("is-error")) {
    elementos.mensaje.textContent = mensajePredeterminado();
    elementos.mensaje.className = "game__message";
    elementos.juego.classList.remove("is-error");
    elementos.input.removeAttribute("aria-invalid");
  }
});

mostrarMejorMarca();
iniciarRonda();
