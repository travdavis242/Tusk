import {coachMemories, LIFE_KEY, normalizeLife} from '../life/model.js';
import {storage} from '../../app/storage.js';
import {filterContext} from './permissions.js';
import {mockProvider,summarizeRecords} from './mock-provider.js';
import {DEMO_RECORDS} from './demo-data.js';
export const SOURCE_KEYS={school:'tusk-data',business:'tusk-business-data',sports:'tusk-sports-data',health:'tusk-health-data'};
export async function loadPermissions(){const record=await storage.get('tusk-permissions');return record?JSON.parse(record.value):{};}
export async function savePermission(key,value){const current=await loadPermissions();await storage.set('tusk-permissions',JSON.stringify({...current,[key]:value}));window.dispatchEvent(new Event('tusk-permissions-changed'));}
export async function runCoach({config,question,history=[],sourceMode='recorded',provider=mockProvider}) {
 if(!question?.trim())throw new Error('Enter a question.');
 const permissions=await loadPermissions();const records={};
 for(const [sector,key] of Object.entries(SOURCE_KEYS)){
  const row=sourceMode==='sample'?DEMO_RECORDS[key]:(await storage.get(key));
  records[sector]=sourceMode==='sample'?row:row?JSON.parse(row.value):null;
 }
 const lifeRow=sourceMode==='sample'?null:await storage.get(LIFE_KEY);
 const life=normalizeLife(lifeRow?JSON.parse(lifeRow.value):{});
 if(sourceMode!=='sample') {
 records.school={...records.school,ib_milestones:life.ib,study_plans:life.plans.filter(p=>p.kind==='study')};
 records.sports={...records.sports,soccer_logs:life.soccer};
 records.business={...records.business,experiments:life.experiments};
 }
 const savedMemories=sourceMode==='sample'?[]:coachMemories(life.memories,config.id);
 const permitted=filterContext(config.id,records,permissions);
 const context=Object.fromEntries(Object.entries(permitted).filter(([source])=>config.dataSources.includes(source)).map(([source,data])=>[source,Object.fromEntries(Object.entries(data).filter(([key])=>!['briefs','scorecards','automationLogs','pendingReview','lastSyncResults'].includes(key)).map(([key,value])=>[key,Array.isArray(value)?value.slice(0,config.context.maxRecords):value]))]));
 const tools=Object.fromEntries(config.tools.filter(name=>name==='summarize_records').map(name=>[name,summarizeRecords]));
 return provider.generate({config,question:question.trim(),context,history:history.slice(-config.memory.maxTurns*2),tools,sourceMode,savedMemories});
}
