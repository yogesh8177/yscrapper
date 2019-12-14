let Author = require('./Author');

class Story {

    constructor() {
    }

    set title(title) {
        this._title = title;
    }
    
    get title() {
        return this._title;
    }

    set author (author) {
        this._author = author;
    }

    get author() {
        return this._author;
    }

    set commentCount(count) {
        this._commentCount = count;
    }

    get commentCount() {
        return this._commentCount;
    }
}

module.exports = Story;