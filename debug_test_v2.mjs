import { spawn } from 'child_process';

const test = spawn('node', ['sdk-playground/test.mjs']);

let output = '';

test.stdout.on('data', (data) => {
    output += data.toString();
});

test.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
});

test.on('close', (code) => {
    const lines = output.split('\n');
    lines.forEach(line => {
        if (line.includes('❌')) {
            console.log('FAILURE:', line.trim());
        }
    });
    console.log(`Process exited with code ${code}`);
});
