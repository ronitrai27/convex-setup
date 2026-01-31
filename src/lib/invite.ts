export function generateInviteCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const array = new Uint8Array(12);
  if (typeof window !== "undefined" && window.crypto) {
    window.crypto.getRandomValues(array);
  } else {
    // Fallback for non-browser environments if needed during SSR
    for (let i = 0; i < 12; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(array, (byte) => chars[byte % chars.length]).join("");
}

export function getInviteLink(inviteCode: string): string {
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
  return `${baseUrl}/invite/${inviteCode}`;
}

export function shareViaWhatsApp(link: string, projectName: string) {
  const text = encodeURIComponent(`Join my project "${projectName}" on WeKraft: ${link}`);
  window.open(`https://wa.me/?text=${text}`, "_blank");
}

export function shareViaGmail(link: string, projectName: string) {
  const subject = encodeURIComponent(`Invitation to join project: ${projectName}`);
  const body = encodeURIComponent(`Hi,\n\nI'd like to invite you to collaborate on my project "${projectName}" on WeKraft.\n\nYou can join using this link: ${link}\n\nBest regards!`);
  window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
}

export function shareViaDiscord(link: string) {
  // Discord doesn't have a direct "share to DM" URL like WhatsApp, 
  // so we usually just copy to clipboard or open Discord. 
  // However, we can open a link to Discord or just toast that they should paste it.
  // For now, let's just open Discord's web app if possible, but copying is usually better.
  // Alternatively, we can use a Discord-specific sharing URL if one exists (like discord://...)
  // Most "share to discord" implementations just use the clipboard.
  // Let's stick to a generic approach or search for a Discord share URL.
  // Discord's web-based sharing is limited.
  navigator.clipboard.writeText(link);
  window.open("https://discord.com/channels/@me", "_blank");
}
