const escape=value=>String(value||'').replace(/\\/g,'\\\\').replace(/\r?\n|\r/g,'\\n').replace(/;/g,'\\;').replace(/,/g,'\\,');
export function schoolCalendarItems(school={}){
 return [...(school.assignments||[]).filter(a=>a.status!=='completed').map(a=>({key:'assignment-'+a.id,title:a.title,subject:a.subject,date:a.due_date,time:a.due_time,description:a.description,type:'Assignment'})),...(school.tests||[]).map(t=>({key:'test-'+t.id,title:t.title,subject:t.subject,date:t.date,time:t.time,description:t.description,type:'Test'}))].filter(item=>/^\d{4}-\d{2}-\d{2}$/.test(item.date||'')&&!Number.isNaN(Date.parse(item.date+'T12:00:00Z'))).sort((a,b)=>a.date.localeCompare(b.date));
}
function fold(line){let count=0,result='';for(const character of line){const size=new TextEncoder().encode(character).length;if(count+size>75){result+='\r\n ';count=1;}result+=character;count+=size;}return result;}
export function calendarFile(items,timezone='America/Nassau',now=new Date()){
 const stamp=now.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');
 const rows=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Tusk//School deadlines//EN','CALSCALE:GREGORIAN'];
 for(const item of items){if(!/^\d{4}-\d{2}-\d{2}$/.test(item.date||''))throw new Error('A deadline has no valid date.');const next=new Date(item.date+'T12:00:00Z');next.setUTCDate(next.getUTCDate()+1);const notes=[item.type,item.subject,item.time?'Original deadline time: '+item.time+' ('+timezone+')':'No deadline time recorded',item.description,'All-day deadline reminder exported from Tusk.'].filter(Boolean).join('\n');rows.push('BEGIN:VEVENT','UID:'+encodeURIComponent(item.key)+'@tusk-school','DTSTAMP:'+stamp,'DTSTART;VALUE=DATE:'+item.date.replaceAll('-',''),'DTEND;VALUE=DATE:'+next.toISOString().slice(0,10).replaceAll('-',''),'SUMMARY:'+escape((item.subject?item.subject+' — ':'')+item.title),'DESCRIPTION:'+escape(notes),'TRANSP:TRANSPARENT','END:VEVENT');}
 rows.push('END:VCALENDAR');return rows.map(fold).join('\r\n')+'\r\n';
}
