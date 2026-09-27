class Print {
    private customPrefix:string | null = null;
    private readonly prefix = '[Server]';

    constructor(prefixLabel?:string) {
        this.customPrefix = prefixLabel ?? null;
    }

    log(...args:any) {
        if(this.customPrefix) {
            console.log(this.prefix, `[${this.customPrefix}]`, ...args);
        }
        console.log(this.prefix, ...args);
    }


    error(...args:any) {
        if(this.customPrefix) {
            console.error(this.prefix, `[${this.customPrefix}]`, ...args);
        }
        console.error(this.prefix, ...args);
    }

    ln() {
        console.log('\n');
    }

    cls() {
        console.clear();
    }
}

export default Print;