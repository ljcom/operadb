// tick/tickGenerator.js
let currentTick = 0;

function startTickGenerator() {
    setInterval(() => {
        currentTick++;
        const hash = require('crypto')
            .createHash('sha256')
            .update(`tick-${currentTick}-${Date.now()}`)
            .digest('hex');
        console.log(`⏱️ Tick ${Date.now()} → ${hash.slice(0, 16)}...`);
    }, 1000); // 1 tick per second
}

module.exports = startTickGenerator;