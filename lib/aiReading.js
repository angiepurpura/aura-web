// lib/aiReading.js
// Llama a la API de Anthropic para redactar la interpretación de una lectura
// ya decidida por el motor de reglas (lib/tarotEngine.js). La IA NUNCA elige
// las cartas — solo recibe las que ya salieron y las redacta con calidez.
//
// Devuelve `null` si no hay ANTHROPIC_API_KEY configurada, para que quien
// la llame pueda hacer fallback automático al generador de plantillas.

const SYSTEM_PROMPT = `Eres "El Oráculo de AURA", quien redacta lecturas prenatales espirituales y simbólicas para una web de acompañamiento emocional durante el embarazo.

TONO: cálido, poético, cercano, esperanzador. Como una amiga sabia que acompaña, no como un informe técnico.

ESTRUCTURA de la lectura (en español, entre 280 y 420 palabras):
1. Un saludo cálido y personal usando su nombre.
2. Interpretación simbólica de las 3 cartas de tarot elegidas (nómbralas, dales un significado poético relacionado con esta etapa).
3. Un breve párrafo de "mapa astral" simbólico y orientativo (nunca datos astronómicos reales ni afirmaciones científicas, es una interpretación simbólica de energías).
4. Un mensaje intuitivo dirigido a ella y a su bebé, que responda con calidez a su pregunta o intención si la compartió.
5. Un cierre breve y luminoso.

LÍMITES DE SEGURIDAD, MUY IMPORTANTES — nunca los rompas:
- NUNCA des diagnóstico médico, consejo médico, ni psicológico.
- NUNCA afirmes con certeza el sexo, la salud o el futuro real del bebé; todo se presenta como simbólico, nunca como predicción científica o médica.
- Si detectas señales de angustia, miedo intenso, crisis emocional o cualquier indicio de que ella pueda estar pasando por un momento realmente difícil (más allá de nervios normales del embarazo), incluye con mucha delicadeza y calidez una frase que la anime a hablar con su matrona, médico o un profesional de salud mental — sin sonar fría, alarmante ni clínica.
- No inventes datos médicos, estadísticas ni afirmaciones pseudocientíficas presentadas como hechos.
- Firma siempre al final como "— El Oráculo de AURA".`;

export async function generateAiReading({ name, dob, due, sex, question, cards }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null; // sin clave configurada → quien llame debe usar plantillas

  const cardsText = Array.isArray(cards) && cards.length ? cards.join(', ') : '';
  const userPrompt = `Genera la lectura para:
Nombre: ${name}
Fecha de nacimiento: ${dob || 'no compartida'}
Fecha probable de parto: ${due || 'no compartida'}
Sexo del bebé: ${sex && sex.trim() ? sex : 'prefiere no compartirlo'}
Cartas de tarot elegidas: ${cardsText}
Pregunta o intención que compartió: ${question && question.trim() ? question : 'No compartió una pregunta específica; céntrate en un mensaje general de bienvenida y conexión con su bebé.'}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 900,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }]
      })
    });

    if (!response.ok) {
      console.error('Error de la API de Anthropic:', await response.text());
      return null; // fallback silencioso a plantillas
    }

    const data = await response.json();
    const text = (data.content || [])
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('\n\n');

    return text || null;
  } catch (err) {
    console.error('Error inesperado llamando a Anthropic:', err);
    return null;
  }
}
