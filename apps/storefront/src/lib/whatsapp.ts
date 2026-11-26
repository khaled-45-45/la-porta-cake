/** WhatsApp numbers as wa.me expects them: digits only, international, no leading zero. */
const WA_NUMBER = /^[1-9]\d{7,14}$/;

/**
 * A wa.me link that opens a chat with the shop and a prepared message.
 * The number must be the verified store number (StoreSettings.whatsapp.number); anything
 * else is rejected rather than turned into a link. The message is percent-encoded
 * (spaces as %20, which WhatsApp shows as spaces), and line breaks and runs of spaces
 * are collapsed so the message stays on one line.
 */
export function whatsappOrderUrl(number: string, message: string): string {
  if (!WA_NUMBER.test(number)) {
    throw new Error('WhatsApp number must be digits only, in international format.');
  }
  const text = message.replace(/\s+/g, ' ').trim();
  return `https://wa.me/${number}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}
