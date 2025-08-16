class RequestQueue {
    private queue: Array<() => Promise<any>> = [];
    private processing = false;
    private maxConcurrent = 5;
    private activeRequests = 0;

    async add<T>(request: () => Promise<T>): Promise<T> {
        return new Promise((resolve, reject) => {
            this.queue.push(async () => {
                try {
                    this.activeRequests++;
                    const result = await request();
                    resolve(result);
                } catch (error) {
                    reject(error);
                } finally {
                    this.activeRequests--;
                    this.processNext();
                }
            });

            if (!this.processing) {
                this.processNext();
            }
        });
    }

    private async processNext() {
        if (this.queue.length === 0 || this.activeRequests >= this.maxConcurrent) {
            this.processing = false;
            return;
        }

        this.processing = true;
        const request = this.queue.shift();
        if (request) {
            request();
        }
    }

    getStats() {
        return {
            queueLength: this.queue.length,
            activeRequests: this.activeRequests,
            maxConcurrent: this.maxConcurrent
        };
    }
}

export const requestQueue = new RequestQueue();
