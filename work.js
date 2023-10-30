function doWork() {
    const randDelay = Math.round((Math.random() * 3001), 0);
    const randNo = Math.round((Math.random() * 9), 0);
    const test = randNo == 8;
    console.log(test + " " + randNo)
    if (test) {

        throw new Error("random error!");
    }
    return new Promise((resolve, reject) => setTimeout(() => resolve(randDelay), randDelay));
}

module.exports = { doWork };