function UpdateListener() {
    this.listeners = [];
    this.currentlyUpdating = false;
}

/**
 * Tell the update listeners whether or not we're being updated
 * @param  {Boolean} nowUpdating true means now updating; false means done
 */
UpdateListener.prototype.currentlyUpdating = function(nowUpdating) {
    this.currentlyUpdating = nowUpdating;
    if (!nowUpdating) {
        this.callListeners();
    }
}

UpdateListener.prototype.add = function(listener) {
    if (this.currentlyUpdating) {
        this.listeners.push(listener);
    } else {
        listener();
    }
}

UpdateListener.prototype.finishedUpdating = function() {
    var res;
    let p = new Promise((resolve, reject) => res = resolve);
    this.add(res);
    return p;
}

UpdateListener.prototype.callListeners = function() {
    for (var i=0; i < updateListeners.length; i++) {
        let listenerFunction = this.listeners.pop();
        log.message(`Calling back listener: calling ${listenerFunction.name}`);
        listenerFunction();
    }
}

module.exports = UpdateListener;
