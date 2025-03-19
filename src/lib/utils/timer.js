export class Timer {
    constructor(name='Timer') {
        this.startTime = Date.now();
        this.endTime = null;
        this.checkpoints = [];
        this.name = name;
    }

    checkpoint(name='') {
        const now = Date.now();
        const currentId = this.checkpoints.length;
        if (this.name === '') name = `Checkpoint ${currentId}`;
        this.checkpoints.push({ id: currentId, name: name, start: now, end: null });
        if (currentId > 0) {
            this.checkpoints[currentId - 1].end = now;
            console.log(`Checkpoint ${currentId - 1} (${this.checkpoints[currentId - 1].name}) took ${(this.checkpoints[currentId - 1].end - this.checkpoints[currentId - 1].start)} ms`);
        }
    }

    report() {
        this.endTime = Date.now();
        console.log(`Timer ${this.name} took ${(this.endTime - this.startTime)} ms`);
        for (const checkpoint of this.checkpoints) {
            if (checkpoint.end !== null) {
                console.log(`Checkpoint ${checkpoint.id} (${checkpoint.name}) took ${(checkpoint.end - checkpoint.start)} ms`);
            }
        }
    }

}