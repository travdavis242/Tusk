export const LIFE_KEY='tusk-life-data';
export const EMPTY_LIFE={priorities:{},plans:[],ib:[],soccer:[],experiments:[],reflections:[],memories:[],settings:{reserveSchool:true,schoolStart:'08:00',schoolEnd:'15:05',studyLimit:120}};
export const id=()=>globalThis.crypto.randomUUID();
export function localDate(timezone='America/Nassau',now=new Date()){
 const options={timeZone:timezone||'America/Nassau',year:'numeric',month:'2-digit',day:'2-digit'};
 let formatter;
 try{formatter=new Intl.DateTimeFormat('en-CA',options);}
 catch(error){if(!(error instanceof RangeError))throw error;formatter=new Intl.DateTimeFormat('en-CA',{...options,timeZone:'America/Nassau'});}
 return formatter.format(now);
}
export function addDays(date,days){const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10);}
export function weekStart(date){const d=new Date(date+'T12:00:00Z');return addDays(date,-((d.getUTCDay()+6)%7));}
export const mins=time=>{const [h,m]=String(time||'00:00').split(':').map(Number);return h*60+m;};
export const duration=plan=>Math.max(0,mins(plan.end)-mins(plan.start));
export function schoolBlock(date,settings){const day=new Date(date+'T12:00:00Z').getUTCDay();return settings.reserveSchool&&day>0&&day<6?{id:'school-'+date,title:'School hours',date,start:settings.schoolStart,end:settings.schoolEnd,kind:'school',reserved:true}:null;}
export function overlaps(a,b){return a.date===b.date&&mins(a.start)<mins(b.end)&&mins(b.start)<mins(a.end);}
export function warnings(plans,settings){const result=[];for(const date of new Set(plans.map(p=>p.date))){const entries=plans.filter(p=>p.date===date);const school=schoolBlock(date,settings);const all=school?[...entries,school]:entries;for(let a=0;a<all.length;a++)for(let b=a+1;b<all.length;b++)if(overlaps(all[a],all[b]))result.push({date,text:`${all[a].title} overlaps ${all[b].title}.`});const study=entries.filter(p=>p.kind==='study').reduce((n,p)=>n+duration(p),0);if(study>Number(settings.studyLimit))result.push({date,text:`${study} minutes of study exceeds your ${settings.studyLimit}-minute daily limit.`});}return result;}
export function normalizeLife(value={}){return {...EMPTY_LIFE,...value,settings:{...EMPTY_LIFE.settings,...value.settings}};}
export function reflectionStats(plans,start){const end=addDays(start,7);const week=plans.filter(p=>p.date>=start&&p.date<end);return {planned:week.length,completed:week.filter(p=>p.done).length,plannedMinutes:week.reduce((n,p)=>n+duration(p),0),completedMinutes:week.filter(p=>p.done).reduce((n,p)=>n+duration(p),0)};}
export function passingAccuracy(logs){const attempted=logs.reduce((n,l)=>n+Number(l.attempted||0),0),completed=logs.reduce((n,l)=>n+Number(l.completed||0),0);return attempted?Math.round(completed/attempted*100):null;}
export function coachMemories(memories,coach){return memories.filter(m=>m.coach===coach&&m.enabled!==false).map(({kind,text})=>({kind,text}));}
