const http = require('http');
const scrape = require('./index').scrape;
const sortByComments = require('./index').sortByComments;
const sortByAuthors = require('./index').sortByAuthors;
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
    let sortedStoties = sortByAuthors(storiesJson, 'asc');
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({status: 'top authors'}));
  }
  else if (req.url == '/sort/authors/desc') {
    let storiesRaw = fs.readFileSync('output.json');
    let storiesJson = JSON.parse(storiesRaw);
    let sortedStoties = sortByAuthors(storiesJson, 'desc');
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({status: 'top authors'}));
  }
  else if (req.url == '/sort/comments/asc') {
    let storiesRaw = fs.readFileSync('output.json');
    let storiesJson = JSON.parse(storiesRaw);
    let sortedStoties = sortByComments(storiesJson, 'asc');
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({data: sortedStoties}));
  }
  else if (req.url == '/sort/comments/desc') {
    let storiesRaw = fs.readFileSync('output.json');
    let storiesJson = JSON.parse(storiesRaw);
    let sortedStoties = sortByComments(storiesJson, 'desc');
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({data: sortedStoties}));
  }
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});