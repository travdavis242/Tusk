'use client';
import {useEffect,useState} from 'react';
import {storage} from '../../app/storage.js';
import {LIFE_KEY,normalizeLife} from './model.js';
export function useStored(key){const [value,setValue]=useState(null);useEffect(()=>{let active=true;const read=()=>storage.get(key).then(row=>{if(active)setValue(row?JSON.parse(row.value):{});});read();window.addEventListener('tusk-storage-changed',read);return()=>{active=false;window.removeEventListener('tusk-storage-changed',read);};},[key]);return value;}
export function useLife(){const raw=useStored(LIFE_KEY);const value=normalizeLife(raw||{});const update=fn=>storage.update(LIFE_KEY,current=>fn(normalizeLife(current||{})));return [value,update,raw!==null];}
export function useWorkspace(){return {school:useStored('tusk-data')||{},sports:useStored('tusk-sports-data')||{},business:useStored('tusk-business-data')||{}};}
