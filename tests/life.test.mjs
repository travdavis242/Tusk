import test from 'node:test';
import assert from 'node:assert/strict';
import {warnings,EMPTY_LIFE,reflectionStats,passingAccuracy,coachMemories,weekStart,localDate} from '../lib/life/model.js';
test('planner detects school conflicts and overload but allows adjacent sessions',()=>{
 const plans=[{title:'Study',date:'2026-10-05',start:'14:00',end:'17:00',kind:'study'},{title:'Soccer',date:'2026-10-05',start:'17:00',end:'18:00',kind:'soccer'}];
 const issues=warnings(plans,EMPTY_LIFE.settings);assert.equal(issues.length,2);assert.ok(issues.some(x=>x.text.includes('School')));assert.ok(issues.some(x=>x.text.includes('exceeds')));
 assert.equal(warnings(plans,{...EMPTY_LIFE.settings,reserveSchool:false,studyLimit:240}).length,0);
});
test('reflection includes exact Monday to Sunday boundaries and marked completion',()=>{
 const stats=reflectionStats([{date:'2026-10-05',start:'16:00',end:'16:30',done:true},{date:'2026-10-11',start:'16:00',end:'17:00',done:false},{date:'2026-10-12',start:'16:00',end:'18:00',done:true}],'2026-10-05');
 assert.deepEqual(stats,{planned:2,completed:1,plannedMinutes:90,completedMinutes:30});assert.equal(weekStart('2026-10-11'),'2026-10-05');
});
test('soccer accuracy weights attempts and distinguishes missing data',()=>{assert.equal(passingAccuracy([]),null);assert.equal(passingAccuracy([{completed:1,attempted:2},{completed:8,attempted:8}]),90);});
test('coach memories stay coach-specific and can be disabled',()=>{assert.deepEqual(coachMemories([{coach:'sports',kind:'Goal',text:'Improve passing',enabled:true},{coach:'health',text:'Private'},{coach:'sports',text:'Paused',enabled:false}],'sports'),[{kind:'Goal',text:'Improve passing'}]);});
test('today uses Nassau calendar date around UTC midnight',()=>{assert.equal(localDate('America/Nassau',new Date('2026-10-03T01:00:00Z')),'2026-10-02');});
test('incomplete or missing timezone settings fall back to Nassau',()=>{
 const now=new Date('2026-10-06T01:00:00Z');
 for(const timezone of ['',null,undefined,'America/','invalid/timezone'])assert.equal(localDate(timezone,now),'2026-10-05');
});
test('valid timezones retain their own calendar day',()=>{
 const now=new Date('2026-10-05T23:30:00Z');
 assert.equal(localDate('America/Nassau',now),'2026-10-05');
 assert.equal(localDate('UTC',now),'2026-10-05');
 assert.equal(localDate('Asia/Tokyo',now),'2026-10-06');
});
test('timezone fallback does not hide an invalid date',()=>{
 const invalid=new Date('invalid');
 assert.throws(()=>localDate('America/Nassau',invalid),RangeError);
 assert.throws(()=>localDate('America/',invalid),RangeError);
});
