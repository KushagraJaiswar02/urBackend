import { spawn } from 'child_process';

const test = spawn('node', ['sdk-playground/test.mjs']);

test.stdout.on('data', (data) => {
    const lines = data.toString().split('\n');
    for (const line of lines) {
        if (line.includes('❌')) {
            console.log('FAILURE FOUND:', line);
        }
    }
});

test.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
});

test.on('close', (code) => {
    console.log(`child process exited with code ${code}`);
});
