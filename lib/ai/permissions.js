export const SECTORS=['school','business','sports','health'];
export const permissionKey=(source,target)=>source+'To'+target[0].toUpperCase()+target.slice(1);
export function canRead(source,target,permissions={}) {
 if(source===target)return true;
 // The old prototype also had a separate Sports request-for-Health switch.
 if(source==='health'&&target==='sports')return permissions.healthToSports===true&&permissions.sportsToHealth===true;
 return permissions[permissionKey(source,target)]===true;
}
export function filterContext(target,records,permissions={}) {
 return Object.fromEntries(SECTORS.filter(source=>canRead(source,target,permissions)&&records[source]).map(source=>[source,records[source]]));
}
