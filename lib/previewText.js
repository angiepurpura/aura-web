// lib/previewText.js
// Genera el "avance gratuito" de una lectura: el saludo + la primera
// carta interpretada. El resto queda bloqueado hasta que se confirme
// el pago (regla de negocio aprobada: "Bloqueada").
export function getPreviewText(fullText){
  if(!fullText) return '';
  const parts = fullText.split('\n\n🃏');
  if(parts.length < 2) return fullText; // si no tiene el formato esperado, no recortamos a ciegas
  const greeting = parts[0];
  const firstCard = '🃏' + parts[1].split('\n\n')[0];
  return `${greeting}\n\n${firstCard}\n\n✨ El resto de tu lectura (mapa astral, mensaje intuitivo y cierre) se desbloquea al confirmar tu pago de 20€.`;
}
