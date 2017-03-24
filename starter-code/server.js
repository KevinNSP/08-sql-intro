'use strict';

// TODO: Install and require the Node packages into your project, and ensure that it's now a new dependency in your package.json. DO NOT FORGET to run 'npm i'
const pg = require('pg'); // 3rd party package
const fs = require('fs'); // native Node
const express = require('express'); // 3rd party package

// REVIEW: Require in body-parser for post requests in our server
const bodyParser = require('body-parser'); // 3rd party package
const PORT = process.env.PORT || 3000;
const app = express();

// TODO: Complete the connection string for the url that will connect to your local postgres database
// Windows and Linux users; You should have retained the user/pw from the pre-work for this course.
// Your url may require that it's composed of additional information including user and password
const conString = 'postgres://kevin:test@localhost:5432/kilovolt';
// const conString = 'postgres://localhost:5432';

// REVIEW: Pass the conString to pg, which creates a new client object
const client = new pg.Client(conString);

// REVIEW: Use the client object to connect to our DB.
client.connect();


// REVIEW: Install the middleware plugins so that our app is aware and can use the body-parser module
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('./public'));


// REVIEW: Routes for requesting HTML resources

// NOTE: The user sends an AJAX request to the root directory to retreive the the index.html file. The server sends back a response containing index.html.  The operation used is 1, 2, 5.
app.get('/', function(request, response) {
  response.sendFile('index.html', {root: '.'});
});

// NOTE: The user sends an AJAX request to the root directory to retreive the the new.html file. The server sends back a response containing new.html.  The operation used is 1, 2, 5.
app.get('/new', function(request, response) {
  response.sendFile('new.html', {root: '.'});
});


// REVIEW: Routes for making API calls to use CRUD Operations on our database

// NOTE: The user sends an AJAX request for all articles to the server from Article.fetchAll(), then the server forms that request into a SQL query to the database and returns to the user a response containing the results of the request. This is a CRUD "Read" operation that goes through numbers 2,3,4,5 in the drawing.
app.get('/articles', function(request, response) {
  client.query('SELECT * FROM articles')
  .then(function(result) {
    response.send(result.rows);
  })
  .catch(function(err) {
    console.error(err)
  })
});

// NOTE: After creating a new article the user sends an AJAX request to the server from Article.Prototype.insertRecord().  The server forms that request into a SQL query to the database that sends the data to the server. This is a CRUD update that uses 2 and 3.
app.post('/articles', function(request, response) {
  client.query(
    `INSERT INTO
    articles(title, author, "authorUrl", category, "publishedOn", body)
    VALUES ($1, $2, $3, $4, $5, $6);
    `,
    [
      request.body.title,
      request.body.author,
      request.body.authorUrl,
      request.body.category,
      request.body.publishedOn,
      request.body.body
    ]
  )
  .then(function() {
    response.send('insert complete')
  })
  .catch(function(err) {
    console.error(err);
  });
});

// NOTE:
app.put('/articles/:id', function(request, response) {
  client.query(
    `UPDATE articles
    SET
      title=$1, author=$2, "authorUrl"=$3, category=$4, "publishedOn"=$5, body=$6
    WHERE article_id=$7;
    `,
    [
      request.body.title,
      request.body.author,
      request.body.authorUrl,
      request.body.category,
      request.body.publishedOn,
      request.body.body,
      request.params.id
    ]
  )
  .then(function() {
    response.send('update complete')
  })
  .catch(function(err) {
    console.error(err);
  });
});

// NOTE:
app.delete('/articles/:id', function(request, response) {
  client.query(
    `DELETE FROM articles WHERE article_id=$1;`,
    [request.params.id]
  )
  .then(function() {
    response.send('Delete complete')
  })
  .catch(function(err) {
    console.error(err);
  });
});

// NOTE:
app.delete('/articles', function(request, response) {
  client.query(
    'DELETE FROM articles;'
  )
  .then(function() {
    response.send('Delete complete')
  })
  .catch(function(err) {
    console.error(err);
  });
});

// NOTE:
loadDB();

app.listen(PORT, function() {
  console.log(`Server started on port ${PORT}!`);
});


//////// ** DATABASE LOADER ** ////////
////////////////////////////////////////
// NOTE:
function loadArticles() {
  client.query('SELECT COUNT(*) FROM articles')
  .then(result => {
    if(!parseInt(result.rows[0].count)) {
      fs.readFile('./public/data/hackerIpsum.json', (err, fd) => {
        JSON.parse(fd.toString()).forEach(ele => {
          client.query(`
            INSERT INTO
            articles(title, author, "authorUrl", category, "publishedOn", body)
            VALUES ($1, $2, $3, $4, $5, $6);
          `,
            [ele.title, ele.author, ele.authorUrl, ele.category, ele.publishedOn, ele.body]
          )
        })
      })
    }
  })
}

// NOTE:
function loadDB() {
  client.query(`
    CREATE TABLE IF NOT EXISTS articles (
      article_id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      author VARCHAR(255) NOT NULL,
      "authorUrl" VARCHAR (255),
      category VARCHAR(20),
      "publishedOn" DATE,
      body TEXT NOT NULL);`
    )
    .then(function() {
      loadArticles();
    })
    .catch(function(err) {
      console.error(err);
    }
  );
}
