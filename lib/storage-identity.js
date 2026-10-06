// Only dispatcher-provided authenticated headers are accepted. No client payload identities.
export async function resolveStorageIdentity(headers) {
 const id=headers.get("oai-authenticated-user-id");if(id)return id;
 const email=headers.get("oai-authenticated-user-email");if(!email)return null;
 const bytes=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(email.trim().toLowerCase()));
 return "verified-email:"+Array.from(new Uint8Array(bytes)).map(b=>b.toString(16).padStart(2,"0")).join("");
}
