(() => {
  'use strict';
  const es = document.documentElement.lang === 'es';
  const say = (en, sp) => es ? sp : en;
  const form = document.querySelector('#chat-form');
  const log = document.querySelector('#chat-log');
  const message = document.querySelector('#chat-message');
  const status = document.querySelector('#chat-status');
  const send = document.querySelector('#chat-send');
  const clear = document.querySelector('#chat-clear');
  let messages = [];
  let pending = false;
  function element(tag, text, className) {
    const el = document.createElement(tag);
    if (text) el.textContent = text;
    if (className) el.className = className;
    return el;
  }
  function link(text, href) {
    const el = element('a', text); el.href = href; return el;
  }
  function bubble(text, who) {
    const el = element('div', '', `chat-bubble ${who}`);
    el.append(element('p', text)); log.append(el); return el;
  }
  document.querySelectorAll('[data-prompt]').forEach(button => button.addEventListener('click', () => {
    message.value = button.dataset.prompt; message.focus();
  }));
  clear.addEventListener('click', () => {
    messages = []; log.replaceChildren(); message.value = ''; status.textContent = '';
    const consent = document.querySelector('#ai-consent'); if (consent) consent.checked = false;
    bubble(say('Conversation cleared. What would you like to find?', 'Conversación borrada. ¿Qué desea encontrar?'), 'assistant');
    message.focus();
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (pending || !message.value.trim()) return;
    const text = message.value.trim();
    const nextMessages = [...messages, text].slice(-6);
    pending = true; send.disabled = true; clear.disabled = true;
    log.setAttribute('aria-busy', 'true');
    status.textContent = say('Looking for resources…', 'Buscando recursos…');
    bubble(text, 'user');
    try {
      const response = await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(25000),
        body: JSON.stringify({ messages: nextMessages, place: document.querySelector('#chat-place').value, useAI: document.querySelector('#ai-consent')?.checked ?? false }),
      });
      if (!response.ok) throw new Error('unavailable');
      const answer = await response.json();
      messages = nextMessages;
      message.value = '';
      if (answer.mode === 'urgent') {
        const panel = bubble(say('This guide cannot provide emergency help. If there is immediate danger, call 911. Use urgent help for direct support options.', 'Esta guía no puede responder a emergencias. Si hay peligro inmediato, llame al 911. Consulte las opciones de ayuda urgente.'), 'assistant');
        panel.append(link(say('Urgent help', 'Ayuda urgente'), '/urgent'));
      } else if (answer.mode === 'place_needed') {
        bubble(say('I couldn’t recognize that location. Please enter a supported Colorado city, county, or ZIP—or leave it blank to search all areas.', 'No reconocí ese lugar. Escriba una ciudad, condado o código postal de Colorado, o deje el campo vacío para buscar en todas las áreas.'), 'assistant');
      } else {
        const intro = answer.resources.length
          ? say('Here are directory listings to explore. These are possible options, not confirmed eligibility or availability.', 'Estos recursos del directorio pueden ayudar. No confirman elegibilidad ni disponibilidad.')
          : say('No listings matched this request. Try a shorter phrase or another location. This does not mean help is unavailable.', 'No se encontraron coincidencias. Pruebe una frase más corta u otra ubicación. Esto no significa que no haya ayuda.');
        const panel = bubble(intro, 'assistant');
        panel.append(element('p', `${say('Searched for', 'Búsqueda')}: ${answer.query}`, 'fine'));
        if (answer.mode === 'fallback') panel.append(element('p', say('AI is unavailable or the pilot limit was reached. These results use ordinary search.', 'La IA no está disponible o se alcanzó el límite del piloto. Estos resultados usan búsqueda normal.'), 'fine'));
        for (const r of answer.resources) {
          const card = element('article', '', 'chat-resource');
          const heading = element('h2'); heading.append(link(r.name, r.href)); card.append(heading);
          card.append(element('p', r.summary));
          if (r.is_sample) card.append(element('p', say('Fictional sample—not a real service.', 'Ejemplo ficticio, no es un servicio real.'), 'fine'));
          if (r.operating_status !== 'active') card.append(element('p', say('Operating status needs attention. Check the listing before making plans.', 'Revise el estado del servicio antes de hacer planes.'), 'fine'));
          if (r.unconfirmed.length) card.append(element('p', say('Some requested details are unconfirmed. Review the listing.', 'Algunos detalles no están confirmados. Revise el recurso.'), 'fine'));
          const steps = element('ol');
          steps.append(element('li', r.intake || say('Contact the provider to ask how to start.', 'Pregunte al proveedor cómo comenzar.')));
          steps.append(element('li', say('Confirm requirements, hours, and availability before visiting.', 'Confirme requisitos, horario y disponibilidad antes de acudir.')));
          card.append(steps, link(say('View details & save', 'Ver detalles y guardar'), r.href));
          const sources = element('p', say('Sources: ', 'Fuentes: '), 'fine');
          for (const source of r.sources) {
            try {
              const url = new URL(source.url);
              if (!['https:', 'http:'].includes(url.protocol)) continue;
              const a = link(source.name, url.href); a.rel = 'noreferrer'; sources.append(a, document.createTextNode(' '));
            } catch { /* Invalid source links are never activated. */ }
          }
          card.append(sources); panel.append(card);
        }
        const params = new URLSearchParams({ q: answer.query, place: document.querySelector('#chat-place').value });
        panel.append(link(say('See all results and filters', 'Ver todos los resultados y filtros'), `/search?${params}`));
      }
      status.textContent = say('Results ready. You can ask another question.', 'Resultados listos. Puede hacer otra pregunta.');
    } catch {
      const panel = bubble(say('The guide couldn’t finish this request. Your message is still below so you can retry.', 'La guía no pudo completar la solicitud. Su mensaje sigue abajo para volver a intentar.'), 'assistant');
      panel.append(link(say('Use directory search', 'Usar búsqueda del directorio'), '/search'));
      status.textContent = say('Request unavailable. Please retry or use search.', 'Solicitud no disponible. Vuelva a intentar o use la búsqueda.');
    } finally {
      pending = false; send.disabled = false; clear.disabled = false; log.removeAttribute('aria-busy');
    }
  });
})();
