/**
 * 前端原生 Web Crypto 标识派生
 * 严格按真实密钥进行 SHA-256 计算，不内置任何默认值
 * @param adminSecret 管理密钥
 */
export async function deriveIdentity(
  adminSecret: string,
): Promise<{ slug: string; userId: string }> {
  const secret = adminSecret ? adminSecret.trim() : "";
  if (!secret) {
    throw new Error("管理密钥不能为空");
  }

  const enc = new TextEncoder();
  const data = enc.encode(secret);
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

  const slug = hex.slice(0, 16);
  const userId = [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join("-");

  return { slug, userId };
}
