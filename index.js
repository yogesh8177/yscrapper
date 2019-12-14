const axios = require('axios');
const jsdom = require("jsdom");
let Author = require('./Models/Author');
let Story = require('./Models/Story');
const Promise = require("bluebird");
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
        console.log(stories);
        await Promise.map(
            stories,
            item => {
                return item.author.loadKarmaPoints()
            },
            {concurrency: 1}
        );
        //await stories[0].author.loadKarmaPoints();
        console.log(stories);
        console.log('done');
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
    console.log('total cells: ' + totalCells);
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
        console.log(title);
        titles.push(title);
    }
    else if (type == TYPE_AUTHOR) {
        let anchors  = domTree.window.document.getElementsByTagName('a');
        let totalAnchors = anchors.length;

        if (totalAnchors === 4) {
            console.log(`total anchors: ${anchors.length}`);
            authors.push({ name: anchors[0].text, url: `${domainHost}${anchors[0].href}` });
            comments.push(anchors[3].text);
        }
    }
}

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

scrape(url);