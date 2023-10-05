import chalk from 'chalk';

import { workerData,parentPort } from 'worker_threads';

import { spawn } from 'child_process';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

let tryA = 0

function randomString(length: number) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
const timeout = (prom:Promise<any>, time:number) =>
	Promise.race([prom, new Promise((_r, rej) => setTimeout(rej, time))]);
export default async function run(code:string, inputs: Array<string|number>) {
    const tempPath = path.resolve(__dirname+"/temp/", `${randomString(10)}.por`);
try {

    const consolePath = path.resolve('./dependencies/java/portugol/portugol-console.jar');
    await fs.writeFile(tempPath, code);

    const cp = spawn('java', [
        '-Dfile.encoding=latin1',
        '-server',
        '-Xms32m',
        '-Xmx256m',
        '-XX:MinHeapFreeRatio=5',
        '-XX:MaxHeapFreeRatio=10',
        '-XX:+UseG1GC',
        '-XX:+CMSClassUnloadingEnabled',
        '-Dvisualvm.display.name=Portugol-Studio',
        '-jar',
        consolePath,
        tempPath
    ]);

    let result = '';
    let err = '';
    let warning = '';

    await timeout(new Promise((resolve, reject) => {
        cp.stdin.write(inputs.join('\n')+ '\n\n');

        cp.stdout.on('data', chunk => {
            if(chunk.toString('latin1').includes("Pressione ENTER para continuar")) {
                cp.stdin.write('\n');
            }
            if(chunk.toString('latin1').includes("Programa finalizado")) {
                resolve("");
            }
            result += chunk.toString('latin1');
        });

        cp.stderr.on('data', chunk => {
            const str = chunk.toString('latin1');
            if (str.startsWith('AVISO: ')) {
                warning += str;
            } else {
                err += str;
            }
        });
        
        cp.on('exit', resolve);
        cp.on('error', reject);
    }), 4000).catch((err) => {

        cp.kill();
        err = 'Timeout';
    });
    await fs.unlink(tempPath);
    if(err){
        console.log(
            chalk.redBright(`
        Result: ${result.split('\n')[0]}
        Warning: ${warning}
        Error: ${err}
        Code: ${code}
        Entries: ${inputs}
        `
        ))
    }else{
        console.log(
            chalk.greenBright(
            `
    Result: ${result.split('\n')[0]}
    Warning: ${warning}
    Error: ${err}
    Code: ${code}
    Entries: ${inputs}
    `))
    }
    

    if(err.includes("programas.Programa")){
        if(existsSync(tempPath)){
            await fs.unlink(tempPath);
        }
        console.log(chalk.bgMagentaBright("Recompiling"))
        tryA++;
        if(tryA > 3){
            return {
                result:"",
                warning:"",
                err:"Compilation Error"
            }
        }
        return run(code, inputs);
    }

    return {
        result:result.split('\n')[0],
        warning,
        err
    }
} catch (error) {
    if(existsSync(tempPath)){
        await fs.unlink(tempPath);
    }
    console.log(error)
    return {
        result:"",
        warning:"",
        err:"Compilation Error"
    }    
}

}
async function main(){
const { code, inputs } = workerData as { code: string, inputs: Array<string|number> }

let result = await run(code, inputs || [])

parentPort?.postMessage(result)
}
main()