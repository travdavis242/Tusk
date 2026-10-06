// Production adapters implement status() and read(); no credential or fake success lives here.
export class DisconnectedIntegration {
 constructor(id,label){this.id=id;this.label=label;}
 status(){return {id:this.id,label:this.label,connected:false,mode:'disconnected'};}
 async read(){throw new Error(`${this.label} is not connected. No external data has been read.`);}
}
export const integrations=[new DisconnectedIntegration('gmail','Gmail'),new DisconnectedIntegration('calendar','Google Calendar'),new DisconnectedIntegration('google-health','Google Health'),new DisconnectedIntegration('production-ai','Production AI')];
