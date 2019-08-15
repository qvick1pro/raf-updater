export default class Updater {

  paused = true;
  pauseStartTime = 0;

  timeScale = 1;

  updatersMap = {};

  run() {
    if (this.pauseStartTime) {
      const diff = Date.now() - this.pauseStartTime;
      Object.values(this.updatersMap).forEach((updater) => {
        if (updater.prevTimestamp !== null) {
          updater.prevTimestamp += diff;
        }
      });
    }
    this.pauseStartTime = 0;
    this.paused = false;
  }

  pause() {
    if (!this.paused) {
      this.pauseStartTime = Date.now();
      this.paused = true;
    }
  }

  reset() {
    this.paused = true;
    this.pauseStartTime = 0;

    this.timeScale = 1;

    Object.keys(this.updatersMap).forEach(key => {
      delete this.updatersMap[key].updateFunction;
      delete this.updatersMap[key];
    });
    this.updatersMap = {};
  }

  register(name, fn, intervals = false) {
    let updateFunction = (timestamp) => {
      const updater = this.updatersMap[name];
      let retry = false;
      if (!this.paused) {
        if (updater.prevTimestamp === null) {
          updater.prevTimestamp = timestamp - 1;
        }

        if (updater.updateFunction !== updateFunction) {
          return;
        }

        let value = (timestamp - updater.prevTimestamp) * this.timeScale;

        if (!intervals) {
          if (updater.totalDuration === null) {
            updater.totalDuration = 0;
          }
          updater.totalDuration += (timestamp - updater.prevTimestamp) * this.timeScale;
          value = updater.totalDuration;
        }

        retry = fn(value);

        updater.prevTimestamp = timestamp;
      }

      if (retry || this.paused) {
        requestAnimationFrame(updateFunction);
      }
    };

    this.updatersMap[name] = {
      prevTimestamp: null,
      totalDuration: null,
      updateFunction,
    };

    requestAnimationFrame(updateFunction);
  }

  setTimeScale(value) {
    this.timeScale = value;
  }

}
