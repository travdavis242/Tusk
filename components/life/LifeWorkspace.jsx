'use client';
import {CalendarDays,Sun,GraduationCap,Goal,Lightbulb,NotebookPen,Brain,LayoutGrid,Sparkles} from 'lucide-react';
import {Today} from './Today';
import {Planner} from './Planner';
import {IBTracker,SoccerLog,Experiments} from './Trackers';
import {Reflection} from './Reflection';
import {Memory} from './Memory';
export const LIFE_VIEWS=['today','week','ib','soccer','experiments','reflection','memory'];
const items=[['today','Today',Sun],['week','Week',CalendarDays],['ib','IB tracker',GraduationCap],['soccer','Soccer',Goal],['experiments','Experiments',Lightbulb],['reflection','Reflect',NotebookPen],['memory','Memory',Brain],['home','Sectors',LayoutGrid],['assistant','Assistant',Sparkles]];
export function LifeNav({view,navigate}){return <nav className="life-nav" aria-label="Tusk navigation"><button className="life-wordmark" onClick={()=>navigate('today')}>Tusk<span>YOUR DAILY COMPANION</span></button><div>{items.map(([key,label,Icon])=><button key={key} className={view===key?'active':''} aria-current={view===key?'page':undefined} onClick={()=>navigate(key)}><Icon size={16}/>{label}</button>)}</div></nav>;}
export function LifeWorkspace({view,navigate}){return <main className="life-workspace">{view==='today'&&<Today navigate={navigate}/>} {view==='week'&&<Planner/>}{view==='ib'&&<IBTracker/>}{view==='soccer'&&<SoccerLog/>}{view==='experiments'&&<Experiments/>}{view==='reflection'&&<Reflection/>}{view==='memory'&&<Memory/>}</main>;}
