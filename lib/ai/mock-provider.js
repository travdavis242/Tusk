function summary(sector,data) {
 if(sector==='school')return `${(data.assignments||[]).filter(x=>x.status!=='completed').length} open assignments, ${(data.tests||[]).length} recorded assessments and ${(data.ib_milestones||[]).length} IB milestones.`;
 if(sector==='business')return `${(data.tasks||[]).filter(x=>!['Completed','Archived'].includes(x.status)).length} active tasks, ${(data.transactions||[]).length} recorded transactions and ${(data.experiments||[]).length} business experiments.`;
 if(sector==='sports')return `${(data.sessions||[]).length} training sessions, ${(data.soccer_logs||[]).length} soccer logs and ${(data.goals||[]).length} goals recorded.`;
 return `${(data.reports||[]).length} wellness reports recorded.`;
}
export const mockProvider={
 id:'scripted-demo',
 async generate({config,question,context,history,tools,sourceMode,savedMemories=[]}) {
  const observations=tools.summarize_records(context);
  const memoryNote=savedMemories.length?"Saved details for this coach: " + savedMemories.map(m=>m.kind+": "+m.text).join("; ")+"\n\n":"";
  const opening=observations.length?observations.join('\n'):'No permitted records are available. I can demonstrate a coaching conversation without inventing your data.';
  const q=question.toLowerCase();let response='';
  if(config.id==='school') {
   const first=(context.school?.assignments||[]).filter(x=>x.status!=='completed').sort((a,b)=>(a.due_date||'9999').localeCompare(b.due_date||'9999'))[0];
   response=/research|question|essay|argument/.test(q)?'A broad topic is not yet a research question. Identify one decision, one context, and the evidence you could realistically obtain.\n\nYour next challenge: rewrite your question so its scope and evidence are clear.':`${first?`Start by reviewing “${first.title}”${first.due_date?` (recorded due date: ${first.due_date})`:''}.`:'Choose one real assignment to work on.'} Break it into a 25-minute task with a visible output.\n\nYour next challenge: name exactly what you will have finished when the timer ends.`;
  } else if(config.id==='business') {
   response=/finance|cost|money|revenue/.test(q)?'FACT: only logged transactions can support a financial review. UNKNOWN: costs or sales you have not recorded. RISK: confusing revenue with profit.\n\nYour next challenge: record one real cost and explain how it affects your margin.':'IDEA: a starting point, not market evidence. ASSUMPTION: someone has a problem urgent enough to pay for. EVIDENCE NEEDED: a specific customer describing that problem.\n\nYour next challenge: define your customer and test the riskiest assumption in three interviews.';
  } else if(config.id==='sports') {
   response=/sleep|recover|tired/.test(q)?`${context.health?'Shared wellness records are available. A change alongside training is a hypothesis to investigate, not proof of causation.':'Health data is not in this coach’s context. I cannot assess your sleep or recovery from training records alone.'} Compare one consistent metric before changing training load. Respect pain and recovery.\n\nYour next focus: identify one measurable performance variable to improve during your next session.`:'Pick one technical or tactical measure, such as successful passes out of ten. Record a baseline under consistent conditions and review it after the session. More training is not automatically better training.\n\nYour next focus: identify one measurable performance variable to improve during your next session.';
  } else if(config.id==='health') {
   const reports=[...(context.health?.reports||[])].sort((a,b)=>(a.date_range_end||'').localeCompare(b.date_range_end||''));
   const a=reports.at(-2)?.sleep_minutes,b=reports.at(-1)?.sleep_minutes;
   response=typeof a==='number'&&typeof b==='number'&&b<a?`The last two reports list sleep values of ${a} and ${b} minutes. Those are report values; their averaging periods may differ. This does not tell us why sleep changed.\n\nYour next question: what changed in your routine during the days your sleep dropped?`:'There is not enough comparable sleep data here to identify a drop. Start by noticing your routine, energy and recovery without judging yourself.\n\nYour next question: what changed in your routine on days you felt less rested?';
  } else response='Use the source summaries to review your week. Without dated records, I cannot establish a schedule conflict. IB Coach handles study planning; Business Boss challenges assumptions; Elite Coach focuses on performance; Wellness Coach explores routines.\n\nYour next step: choose the one area needing attention today.';
  const memory=history.filter(m=>m.role==='user').at(-1);
  return {text:`${memoryNote}${opening}\n\n${response}${memory?`\n\nEarlier in this conversation you asked: “${memory.content.slice(0,140)}”.`:''}`,provider:this.id,sourceMode, sources:Object.keys(context)};
 }
};
export const summarizeRecords=context=>Object.entries(context).map(([sector,data])=>`${sector.toUpperCase()}: ${summary(sector,data)}`);
