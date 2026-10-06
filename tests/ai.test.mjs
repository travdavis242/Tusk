import test from 'node:test';
import assert from 'node:assert/strict';
import {AI_CONFIGS} from '../lib/ai/configs.js';
import {filterContext} from '../lib/ai/permissions.js';
import {mockProvider,summarizeRecords} from '../lib/ai/mock-provider.js';
import {resolveStorageIdentity} from '../lib/storage-identity.js';
import {DisconnectedIntegration} from '../lib/ai/integrations.js';
test('cross-sector access defaults off, including global health',()=>{
 const data={school:{assignments:[]},sports:{sessions:[]},health:{reports:[{sleep_minutes:420}]}};
 assert.deepEqual(Object.keys(filterContext('sports',data,{})),['sports']);
 assert.deepEqual(filterContext('global',data,{healthToSchool:true}),{});
 assert.deepEqual(Object.keys(filterContext('sports',data,{healthToSports:true,sportsToHealth:true})),['sports','health']);
 assert.deepEqual(Object.keys(filterContext('global',data,{schoolToGlobal:true})),['school']);
});
test('identity accepts verified email fallback, rejects anonymous and preserves stable ids',async()=>{
 assert.equal(await resolveStorageIdentity(new Headers()),null);
 assert.equal(await resolveStorageIdentity(new Headers({'oai-authenticated-user-id':'existing'})),'existing');
 const a=await resolveStorageIdentity(new Headers({'oai-authenticated-user-email':'Student@Example.com'}));
 assert.equal(a,await resolveStorageIdentity(new Headers({'oai-authenticated-user-email':'student@example.com'})));
 assert.notEqual(a,await resolveStorageIdentity(new Headers({'oai-authenticated-user-email':'other@example.com'})));
});
test('every coach returns distinct demo replies without external access',async()=>{
 const replies=[];for(const config of Object.values(AI_CONFIGS)){const reply=await mockProvider.generate({config,question:'What next?',context:{},history:[],tools:{summarize_records:summarizeRecords},sourceMode:'sample'});assert.equal(reply.provider,'scripted-demo');replies.push(reply.text);}
 assert.equal(new Set(replies).size,5);
});
test('wellness does not invent a sleep drop with no records',async()=>{
 const result=await mockProvider.generate({config:AI_CONFIGS.health,question:'sleep',context:{},history:[],tools:{summarize_records:summarizeRecords}});assert.match(result.text,/not enough comparable sleep data/);
});
test('real provider stubs reject reads rather than faking success',async()=>{const integration=new DisconnectedIntegration('gmail','Gmail');assert.equal(integration.status().connected,false);await assert.rejects(integration.read(),/not connected/);});
