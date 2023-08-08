
import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

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
    }), 4000).catch(() => {
        cp.kill();
        err = 'Timeout';
    });

    await fs.unlink(tempPath);
    return {
        result:result.split('\n')[0],
        warning,
        err
    }
} catch (error) {

    await fs.unlink(tempPath);
    return {
        result:"",
        warning:"",
        err:"Compilation Error"
    }    
}

}