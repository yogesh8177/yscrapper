const axios = require('axios');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

class Author {
    
    set authorName(name) {
        this._name = name;
    }

    get authorName() {
        return this._name;
    }

    set authorUrl(url) {
        this._url = url;
    }

    get authorUrl () {
        return this._url;
    }

    set karmaPoints (points) {
        this._karmaPoints = points;
    }

    get karmaPoints () {
        return this._karmaPoints;
    }

    async loadKarmaPoints() {
        console.log('loading karma');
        let response = await axios.get(this._url);
        let htmlString = response.data;

        let domTree = new JSDOM(htmlString);
        let parenTable = domTree.window.document.getElementById('hnmain');
        let rows = parenTable.rows;

        let cells = rows[2].cells;
        let totalCells = cells.length;

        let contentTableHtmlString = cells[0].innerHTML;
        let contentDomTree = new JSDOM(contentTableHtmlString);
        let contentTableCollection    = contentDomTree.window.document.getElementsByTagName('table');

        if (contentTableCollection.length > 0) {
            let contentTable = contentTableCollection[0];
            let contentRows = contentTable.rows;

            let contentCells = contentRows[2].cells;
            let contentHtmlString = contentCells[1].innerHTML;
            let karmaPoints       = parseInt(contentHtmlString.trim().replace('\n', ''));
            this._karmaPoints     = isNaN(karmaPoints) ? 0 : parseInt(karmaPoints);
        }

        console.log(`totalCells: ${totalCells} ${this._karmaPoints}`);

        // if (totalCells >= 1) {
           
        //     console.log('karma');
        //     console.log(htmlString);
        // }
    }

    
}

module.exports = Author;