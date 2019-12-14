const axios = require('axios');
const jsdom = require("jsdom");
let Author = require('./Models/Author');
let Story = require('./Models/Story');
const Promise = require("bluebird");
const fs = require('fs');
const { JSDOM } = jsdom;

const url = process.env.SCRAPPING_URL || 'https://news.ycombinator.com/';
const domainHost = 'https://news.ycombinator.com/';

const TYPE_TITLE  = 'title';
const TYPE_AUTHOR = 'author';

let stories  = [];
let titles   = [];
let authors  = [];
let comments = [];

async function scrape(url) {
    try{
        let htmlString = await fetchUrl(url);
        await parseHTMLString(htmlString);

        stories = mergeResults();
        writeToFile(stories);
        console.log(stories);
        await Promise.map(
            stories,
            item => {
                return item.author.loadKarmaPoints()
            },
            {concurrency: 1}
        );
        //await stories[0].author.loadKarmaPoints();
        writeToFile(stories);
        console.log(stories);
        console.log('done');
        return stories;
    }
    catch(err) {
        console.error(err);
    }
}

async function fetchUrl(url) {
    let response = await axios.get(url);
    let htmlString = response.data;
    return htmlString;
}

async function parseHTMLString(htmlString) {
    let domTree = new JSDOM(htmlString);
    let parenTable = domTree.window.document.getElementById('hnmain');
    let rows = parenTable.rows;

    await parseTableRows(rows);
}

async function parseTable (tableString) {
    let domTree = new JSDOM(tableString);
    let htmlCollection = domTree.window.document.getElementsByClassName('itemlist');
    let table = htmlCollection[0];

    let rows  = table.rows;

    await parseTableRows(rows, 0);
    // parse news page table and fetch title, author and comments
    console.log(titles);
    console.log(authors);
    console.log(comments);
}

async function parseTableRows (rows, rowToScrape = 2) {
    let totalRows = rows.length;

    if (rowToScrape === 2) {
        // for parsing parent table
        let cells = rows[rowToScrape].cells;
        //console.log(rows[rowToScrape]);
        await parseCells(cells);
    }
    else {
        // for parsing content table values
        for (let i = 0; i < totalRows; i++) {
            let cells = rows[i].cells;
            //console.log(rows[i]);
            await parseCells(cells);
        }
    }
    
}

async function parseCells (cells) {
    let totalCells = cells.length;
    // if we have 3 cells, it is a new story
    if (totalCells === 3) {
        let htmlString = cells[2].innerHTML;
        if (htmlString.startsWith('<table')) {
            await parseTable(htmlString);
        }
        else {
            parseStoryContent(htmlString, TYPE_TITLE);
        }
    }
    // if total cells are 2, it is the subtext for a story containing author meta data
    else if(totalCells === 2) {
        let htmlString = cells[1].innerHTML;
        if (htmlString.startsWith('<table')) {
            await parseTable(htmlString);
        }
        else {
            parseStoryContent(htmlString, TYPE_AUTHOR);
        }
    }
    else if (totalCells == 1) {
        let htmlString = cells[0].innerHTML;
        if (htmlString.startsWith('<table')) {
            await parseTable(htmlString);
        }
    }
}

function parseStoryContent (htmlString, type) {
    let domTree = new JSDOM(htmlString);

    if (type == TYPE_TITLE) {
        let title = domTree.window.document.getElementsByClassName('storylink')[0].text;
        titles.push(title);
    }
    else if (type == TYPE_AUTHOR) {
        let anchors  = domTree.window.document.getElementsByTagName('a');
        let totalAnchors = anchors.length;

        if (totalAnchors === 4) {
            authors.push({ name: anchors[0].text, url: `${domainHost}${anchors[0].href}` });
            comments.push(anchors[3].text);
        }
    }
}

// this function cleans the data and merges different arrays to story objects
function mergeResults () {
    let stories = [];
    titles.forEach((title, index) => {
        let story  = new Story();
        let author = new Author();

        author.authorName = authors[index].name;
        author.authorUrl = authors[index].url
        story.title = title;
        let commentCount = comments[index].replace('comments', '').trim();
        commentCount = parseInt(commentCount);
        story.commentCount = isNaN(commentCount) ? 0 : commentCount;
        
        story.author = author;
        
        stories.push(story);
    });

    return stories;
}

// Not doing deep level handling, just logging error for now.
function writeToFile(stories) {
    fs.writeFile('output.json', JSON.stringify(stories), err => {
        if (err)
            console.error(err);
    });
}

function sortByComments(data, order = 'desc') {
    let sortedStories = data.sort((a, b) => {
        let comparison = -1;
        if (order == 'desc') {
            if (a._commentCount < b._commentCount) {
                comparison = 1;
            }
            else {
                comparison = -1;
            }
        }
        else if (order == 'asc'){
            if (a._commentCount > b._commentCount) {
                comparison = 1;
            }
            else {
                comparison = -1;
            }
        }

        return comparison;
    });

    return sortedStories;
}

function sortByAuthors (data, order) {
    let sortedStories = data.sort((a, b) => {
        let comparison = -1;
        if (order == 'desc') {
            if (a.author._karmaPoints < b.author._karmaPoints) {
                comparison = 1;
            }
            else {
                comparison = -1;
            }
        }
        else if (order == 'asc'){
            if (a.author._karmaPoints > b.author._karmaPoints) {
                comparison = 1;
            }
            else {
                comparison = -1;
            }
        }

        return comparison;
    });

    return sortedStories;
}

//scrape(url);

module.exports = {
    scrape,
    sortByComments,
    sortByAuthors
};