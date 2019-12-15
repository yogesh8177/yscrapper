const http = require('http');
const scrape = require('./worker').scrape;
const sortByComments = require('./worker').sortByComments;
const sortByAuthors = require('./worker').sortByAuthors;
const fs = require('fs');

const hostname = '127.0.0.1';
const port = 3000;
const url = process.env.SCRAPPING_URL || 'https://news.ycombinator.com/';

const server = http.createServer(async (req, res) => {

  if (req.url == '/') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Hello, Scrapper!\n');
  }
  else if (req.url == '/scrape') {
      scrape(url);
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({status: 'started'}));
  }
  else if (req.url == '/sort/authors/asc') {
    let storiesRaw = fs.readFileSync('output.json');
    let storiesJson = JSON.parse(storiesRaw);
    let sortedStories = sortByAuthors(storiesJson, 'asc');
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({data: sortedStories}));
  }
  else if (req.url == '/sort/authors/desc') {
    let storiesRaw = fs.readFileSync('output.json');
    let storiesJson = JSON.parse(storiesRaw);
    let sortedStories = sortByAuthors(storiesJson, 'desc');
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({data: sortedStories}));
  }
  else if (req.url == '/sort/comments/asc') {
    let storiesRaw = fs.readFileSync('output.json');
    let storiesJson = JSON.parse(storiesRaw);
    let sortedStories = sortByComments(storiesJson, 'asc');
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({data: sortedStories}));
  }
  else if (req.url == '/sort/comments/desc') {
    let storiesRaw = fs.readFileSync('output.json');
    let storiesJson = JSON.parse(storiesRaw);
    let sortedStories = sortByComments(storiesJson, 'desc');
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({data: sortedStories}));
  }
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});