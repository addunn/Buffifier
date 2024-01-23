
export class RateCounter {

    value = 0;

    #samples = null;
    #last = null;
    
    #sum = 0;
    #count = 0;

    log = () => {

        const ct = document.timeline.currentTime;

        this.#sum += (ct - this.#last);

        if(this.#count === this.#samples) {
            this.value = (this.#samples * 1000) / this.#sum;
            this.#sum = 0;
            this.#count = 1;
        } else {
            this.#count++;
        }

        this.#last = ct;
        
    };


    constructor(samples = 30) {
        this.#samples = samples;
        this.#last = document.timeline.currentTime;
    }

}


