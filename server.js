var express = require("express");
var mongoose = require("mongoose");
var cheerio = require("cheerio");
var axios = require("axios");

const PORT = 8080;

var app = express();

app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(express.static("public"));

var exphbs = require("express-handlebars");

app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

var db = require("./models");

//connecting to MongoDB for Heroku
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";

mongoose.connect(MONGODB_URI, {useNewUrlParser: true});

app.get("/", function(req, res) {
  db.GameObject.find({})
    .then(function(dbGameObject) {
      // If we were able to successfully find Articles, send them back to the client
      var stuff = {
        gameobject: dbGameObject
      };
      res.render("index", stuff);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
})

app.get("/scrape", function(req, res) {
    axios.get("https://www.greenmangaming.com/pc-games/").then(function (response) {

    // Load the HTML into cheerio and save it to a variable
    // '$' becomes a shorthand for cheerio's selector commands, much like jQuery's '$'
    var $ = cheerio.load(response.data);

    console.log($);

    // Select each element in the HTML body from which you want information.
    // NOTE: Cheerio selectors function similarly to jQuery's selectors,
    // but be sure to visit the package's npm page to see how it works
    $("p.prod-name").each(function (i, element) {
      var result = {};

      // Save these results in an object that we'll push into the results array we defined earlier
      result.title = $(element)
      .children("a").text().split("\n")[1];
      result.image = $(element).parent().parent().parent().children("div.col-xs-4").children("div.media-object").children().children().attr("src");
      result.link = "https://www.greenmangaming.com/pc-games" + $(element)
      .children("a")
      .attr("href");

      // db.scrapedData.save(result, function (error, saved) {
      //   if (error) {
      //     console.log(error);
      //   }
      // });
      db.GameObject.create(result)
        .then(function(dbGameObject) {
          console.log(dbGameObject);
        })
        .catch(function(err) {
          console.log(err);
        });
    });
    res.send("Scrape Complete!");
  });
});

app.get("/gameobjects", function(req, res) {
  db.GameObject.find({})
  .then(function(dbGameObject) {
    res.json(dbGameObject)
  })
  .catch(function(err) {
    res.json(err);
  });
});

app.get("/gameobjects/:id", function(req, res) {
  db.GameObject.findOne({_id: req.params.id})
    .populate("note")
    .then(function(dbGameObject) {
      res.json(dbGameObject);
    }).catch(function(err){
      res.json(err);
    });
});

app.post("/gameobjects/:id", function(req, res) {
  db.Note.create(req.body)
    .then(function(dbNote) {
      return db.GameObject.findOneAndUpdate({_id: req.params.id}, {note: dbNote._id}, { new: true});
    })
    .then(function(dbGameObject) {
      res.json(dbGameObject);
    })
    .catch(function(err) {
      res.json(err);
    });
});

app.listen(PORT, function() {
    console.log("App running on port " + PORT + "!");
});