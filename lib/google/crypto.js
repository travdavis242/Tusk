const enc=new TextEncoder();
export const b64=bytes=>btoa(String.fromCharCode(...bytes)).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');
export const unb64=value=>Uint8Array.from(atob(value.replaceAll('-','+').replaceAll('_','/')),c=>c.charCodeAt(0));
export const random=()=>b64(crypto.getRandomValues(new Uint8Array(32)));
export async function hash(value){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode(value)))).map(b=>b.toString(16).padStart(2,'0')).join('');}
export async function seal(secret,context,value){const key=await crypto.subtle.importKey('raw',unb64(secret),'AES-GCM',false,['encrypt']);const iv=crypto.getRandomValues(new Uint8Array(12));return b64(iv)+'.'+b64(new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:enc.encode(context)},key,enc.encode(JSON.stringify(value)))));}
export async function unseal(secret,context,value){const [iv,data]=value.split('.');const key=await crypto.subtle.importKey('raw',unb64(secret),'AES-GCM',false,['decrypt']);return JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:unb64(iv),additionalData:enc.encode(context)},key,unb64(data))));}
