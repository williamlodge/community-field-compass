import { html } from "../html.js";
import { icon } from "../icons.js";
import { layout, type PageContext } from "../layout.js";

export function askPage(ctx: PageContext, aiAvailable: boolean): string {
  const es = ctx.lang === "es";
  const copy = (en: string, sp: string) => es ? sp : en;
  const body = html`<div class="wrap page narrow chat-page">
    <div class="chat-heading"><div><p class="ai-label">${copy("YOUR AI GUIDE", "SU GUÍA DE IA")}</p><h1 class="page-title">${copy("Let’s work it out.", "Busquemos una solución.")}</h1></div>${icon("chat")}</div>
    <p class="lede">${copy("Real questions. Helpful next steps.", "Preguntas reales. Próximos pasos útiles.")}</p>
    <p class="notice">${copy("Pilot: AI helps interpret your request. Resource details come from directory records—not model memory. Availability and eligibility must be confirmed with the provider.", "Piloto: la IA interpreta su solicitud. Los detalles provienen del directorio, no de la memoria del modelo. Confirme disponibilidad y requisitos con el proveedor.")}</p>
    <noscript><p class="notice">${copy("Chat needs JavaScript. Directory search works without it.", "El chat necesita JavaScript. La búsqueda funciona sin él.")}</p></noscript>
    <div class="chat-log" id="chat-log" role="log" aria-live="polite" aria-label="${copy("Conversation", "Conversación")}">
      <div class="chat-bubble assistant"><p>${copy("What can we help you find? Tell me what you need, and choose your city or ZIP below.", "¿Qué necesita encontrar? Cuénteme qué necesita e indique su ciudad o código postal.")}</p></div>
    </div>
    <div class="chat-prompts"><button type="button" class="btn btn-secondary" data-prompt="${copy("Help with groceries", "Ayuda con comida")}">${copy("Groceries", "Comida")}</button><button type="button" class="btn btn-secondary" data-prompt="${copy("Affordable childcare", "Guardería asequible")}">${copy("Childcare", "Guardería")}</button><button type="button" class="btn btn-secondary" data-prompt="${copy("Help with utility bills", "Ayuda con la luz")}">${copy("Utility bills", "Servicios públicos")}</button></div>
    <form id="chat-form" class="chat-composer">
      <div class="field"><label for="chat-place">${copy("City or ZIP", "Ciudad o código postal")}</label><input id="chat-place" type="text" maxlength="60" value="Denver" autocomplete="address-level2"></div>
      <div class="field"><label for="chat-message">${copy("Message your AI guide", "Mensaje para su guía")}</label><textarea id="chat-message" rows="2" maxlength="500" required placeholder="${copy("Childcare, groceries, help with bills…", "Guardería, comida, ayuda con facturas…")}"></textarea></div>
      ${aiAvailable ? html`<label class="chat-consent"><input type="checkbox" id="ai-consent"><span>${copy("Use AI: send this conversation (up to 6 messages) to OpenRouter and its model provider. Don’t include names, exact addresses, health details, or ID numbers. Leave unchecked for directory-only search.", "Usar IA: enviar esta conversación (hasta 6 mensajes) a OpenRouter y al proveedor del modelo. No incluya nombres, direcciones exactas, datos médicos ni identificaciones. Sin marcar, solo busca en el directorio.")}</span></label>` : html`<p class="fine">${copy("AI is not connected yet. You can still find resources here using directory search.", "La IA aún no está conectada. Puede buscar recursos en el directorio aquí.")}</p>`}
      <div class="chat-actions"><button type="submit" class="btn btn-primary" id="chat-send">${copy("Find next steps", "Buscar próximos pasos")}${icon("chevron")}</button><button type="button" class="btn btn-quiet" id="chat-clear">${copy("Clear conversation", "Borrar conversación")}</button></div>
      <p class="fine" role="status" id="chat-status"></p>
    </form>
    <p class="human-route">${icon("phone")}<a href="tel:211">${copy("Prefer a person? Call 211", "¿Prefiere una persona? Llame al 211")}</a></p>
    <p class="fine"><a href="/search">${copy("Browse resources", "Explorar recursos")}</a> · <a href="/urgent">${copy("Urgent help", "Ayuda urgente")}</a> · ${copy("Chat is not saved by this app. Clearing it does not delete provider records.", "Esta aplicación no guarda el chat. Borrarlo no elimina registros del proveedor.")}</p>
  </div>`;
  return layout(ctx, { title: copy("Your AI guide", "Su guía de IA"), nav: "ask", body, scripts: ["chat.js"], data: { lang: ctx.lang } });
}
