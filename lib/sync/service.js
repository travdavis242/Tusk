export const SYNC_SECTORS={
 school:{label:'School',description:'Schoolwork emails → assignments and tests → calendar deadlines'},
 business:{label:'Business',description:'Business emails → action items and deadlines'},
 sports:{label:'Sports',description:'Training and match emails → sessions and preparation tasks'},
 health:{label:'Health',description:'Wellness emails → reports and follow-up tasks'}
};
export class SiteGmailProvider {
 async read({sector,allowHealth=false}){const response=await fetch('/api/google/scan',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({scope:sector,allowHealth})});const data=await response.json();if(!response.ok)return {status:'error',message:data.error||'Google scan failed.'};return {status:'success',messages:data.results?.[0]?.candidates||[]};}
}
export class TaskAnalyzer {
 // The server has already extracted rule-based suggestions. This interface can
 // later call a production AI provider after separate consent and configuration.
 async analyze({messages}){return {status:'success',candidates:messages};}
}
// Shared pipeline: the connected implementation replaces providers, never the sector UI.
// No inbox content or auth tokens are stored in browser configuration.
export async function syncSector(sector,{mail=new SiteGmailProvider(),analyzer=new TaskAnalyzer()}={}) {
 if(!Object.hasOwn(SYNC_SECTORS,sector))throw new Error('Unknown sync sector.');
 try{
  const source=await mail.read({sector,lookbackDays:14});
  if(source.status!=='success')return {sector,status:source.status,message:source.message};
  const result=await analyzer.analyze({sector,messages:source.messages});
  if(result.status!=='success')return {sector,status:result.status,message:result.message};
  return {sector,status:'review_required',message:'Review the extracted tasks before adding them.',candidates:result.candidates||[]};
 }catch(error){return {sector,status:'error',message:error.message||'Could not check this source. Try again.'};}
}
export async function syncScope(scope,providers){const sectors=scope==='all'?Object.keys(SYNC_SECTORS):[scope];return Promise.all(sectors.map(sector=>syncSector(sector,providers)));}
export function openSync(scope='all'){window.dispatchEvent(new CustomEvent('tusk-open-sync',{detail:{scope}}));}
