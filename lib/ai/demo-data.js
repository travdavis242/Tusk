const date=(offset)=>{const d=new Date();d.setDate(d.getDate()+offset);return d.toISOString().slice(0,10);};
export const DEMO_RECORDS={
 'tusk-data':{studentName:'Travis',timezone:'America/Nassau',assignments:[{id:'demo-school-1',title:'Sample: refine a Business research question',subject:'Business Management',due_date:date(2),status:'upcoming',priority:'high',description:'Fictional example for exploring the prototype.'}],tests:[],rotationDays:[],automationLogs:[]},
 'tusk-business-data':{tasks:[{id:'demo-business-1',title:'Sample: interview three potential customers',status:'Not Started',priority:'high',deadline:date(3)}],transactions:[],scorecards:[]},
 'tusk-sports-data':{sports:['Soccer','Running'],sessions:[{id:'demo-sport-1',sport:'Soccer',date:date(-1),duration:60,type:'Sample technical practice',intensity:'medium',notes:'Fictional training record'}],goals:[{id:'demo-goal-1',name:'Sample: improve passing accuracy',sport:'Soccer',target:'8/10 passes',current:'6/10 passes',status:'active'}],briefs:[]},
 'tusk-health-data':{reports:[{id:'demo-health-1',date_range_start:date(-14),date_range_end:date(-8),sleep_minutes:480,activity_minutes:45,metrics:{sample:true}},{id:'demo-health-2',date_range_start:date(-7),date_range_end:date(-1),sleep_minutes:420,activity_minutes:50,metrics:{sample:true}}]},
 'tusk-permissions':{}
};
DEMO_RECORDS['tusk-life-data']={
 priorities:{[date(0)]:[{text:'Refine the Business IA question',done:false},{text:'Complete a focused passing session',done:false},{text:'Record one lesson from this week',done:false}]},
 plans:[{id:'demo-plan-1',title:'Sample: Business study block',kind:'study',date:date(0),start:'16:00',end:'16:30',done:false},{id:'demo-plan-2',title:'Sample: soccer practice',kind:'soccer',date:date(0),start:'17:00',end:'18:00',done:false}],
 ib:[{id:'demo-ib-1',area:'IA',subject:'Business Management',title:'Sample: refine the research question',due:date(3),status:'In progress',notes:'Fictional milestone; replace with your school’s guidance.'}],
 soccer:[{id:'demo-soccer-1',date:date(-1),type:'Practice',minutes:60,attempted:20,completed:14,fitness:'',reflection:'Fictional sample session',nextFocus:'Measure successful passes out of 20'}],
 experiments:[{id:'demo-experiment-1',title:'Sample: student sports photography',customer:'School sports teams',assumption:'Teams want individual match photographs.',test:'Interview three team captains.',success:'Two captains request a trial.',status:'Planned',decision:'Undecided'}],
 reflections:[],memories:[],settings:{reserveSchool:true,schoolStart:'08:00',schoolEnd:'15:05',studyLimit:120}
};
