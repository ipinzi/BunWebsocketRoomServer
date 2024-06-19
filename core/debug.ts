class Debugger{
    public state: boolean = false;
    public log(message: string){
        if(debug.state) console.log(message);
    }
}

export const debug = new Debugger();
debug.state = process.argv.includes('--debug');

export default debug;