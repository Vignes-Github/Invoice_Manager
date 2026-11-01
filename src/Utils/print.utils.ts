
/**
 * Used to print message in the console
 * 
 * @param label: string - `Optional` - `if there is any custom label need to be added after the default label`
 */
class Print {
    private customPrefix:string | null = null;
    private readonly prefix = '[Server]';

    constructor(prefixLabel?:string) {
        this.customPrefix = prefixLabel ?? null;
    }

    log(...args:any) {
        if(this.customPrefix) {
            console.log(this.prefix, `[${this.customPrefix}]`, ...args);
            return
        }
        console.log(this.prefix, ...args);
    }


    error(...args:any) {
        if(this.customPrefix) {
            console.error(this.prefix, `[${this.customPrefix}]`, ...args);
            return
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