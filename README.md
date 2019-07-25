# WebScraper

![New Gif](media/webscraper.gif "gif of webscraper website")

[Link to the GitHub Repository](https://github.com/DarrylJLTolentino/WebScraper)

[Link to the Heroku website](https://floating-eyrie-76894.herokuapp.com/)

## Description
This is a website that features a web scraper as the primary functionality. The website that I scraped data from is https://www.greenmangaming.com/pc-games/. The webpage consists of the Green Man Gaming logo, a navbar, the list of PC Games, and notes that appear that are specific to the listed elements. In order to scrape, I had to create a route and then do an axios call to get information from the website as seen in the following code:

```js
app.get("/scrape", function(req, res) {
    axios.get("https://www.greenmangaming.com/pc-games/").then(function (response) {
    ...
  });
});
```
In order to parse the data, I had to use the cheerio package for parsing, manipulating and rendering. In order to get the elements I wanted, I used the base element $("p.prod-name") and got the information for the title of a game, image of a game, and link on greenmangaming.com based off of the parents and children of $("p.prod-name") as seen here:

```js
 var $ = cheerio.load(response.data);

    console.log($);

    $("p.prod-name").each(function (i, element) {
      var result = {};

      result.title = $(element)
      .children("a").text().split("\n")[1];
      result.image = $(element).parent().parent().parent().children("div.col-xs-4").children("div.media-object").children().children().attr("src");
      result.link = "https://www.greenmangaming.com/pc-games" + $(element)
      .children("a")
      .attr("href");

       db.GameObject.create(result)
        .then(function(dbGameObject) {
          console.log(dbGameObject);
        })
        .catch(function(err) {
          console.log(err);
        });
    });
    res.send("Scrape Complete!");
```
After this, I created a model for these games called GameObject in order for my mongoose database to take in the title, image and link that I'm passing in the above code using the following:

```js
var GameObjectSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    link: {
        type: String,
        required: true
    },
    note: {
        type: Schema.Types.ObjectId,
        ref: "Note"
    }
});

var GameObject = mongoose.model("GameObject", GameObjectSchema);
```
In order for there to be a relationship between notes and the GameObjects, there is a reference to notes within the GameObject model as seen above. The notes model does not need a direct reference as seen in the following code:

```js
var NoteSchema = new Schema({
    title: String,
    body: String
});

var Note = mongoose.model("Note", NoteSchema);
```
Now that the two models are finished, I exported both models via the index.js file within the models directory. The entire front-end is created using Handlebars. In order to use handlebars, it requires the views -> layouts -> main.handlebars file structure. Within the views directory is our index.handlebars, which is the whole front-end of the website as seen in the following code:

```handlebars
<img id="image"
    src="https://www.greenmangaming.com/blog/wp-content/uploads/2015/12/Green_Man_Gaming_logo_Desktop@x2.png"
    alt="green man gaming logo">

<ul class="nav justify-content-center">
    <li class="nav-item">
        <a class="nav-link" href="/">Homepage</a>
    </li>
    <li class="nav-item">
        <a class="nav-link" href="/scrape">Scrape!</a>
    </li>
    <li class = "nav-item">
        <a class = "nav-link" href="/gameobjects">API for Scraped Data</a>
    </li>
</ul>

<h1 id="title"> PC Games from Green Man Gaming</h1>

<div id="gameobject">

    <ul>
        {{#each gameobject}}
        <li>
            <h2 class="title">{{title}}</h2>
            <img src="{{image}}" />
            <p>Click the link for more information!</p>
            <a class="link" href="{{link}}" target="_blank">{{link}}</a>
            <br><br>
            <button type = "button" class="button btn btn-primary" data-id="{{id}}">Note</button>
        </li>
        {{/each}}
    </ul>

</div>

<div id="notes">

</div>
```
The background image and the navbar are not dynamically created. Just the list of game objects and the notes. If the user clicks on scrape, then the scrape will occur and then the DOM will state that the scrape is complete. The user can then go back to the root url and find that there is now information of the games. If the user clicks on API link then it will redirec the user to the json of all the gameobjects scraped from the website. Each gameobject is within an li tag to denote a list element followed by the title, image link, link to the specific route from the website scraping, and a button to create a note. The note is specific to gameobject element because of the reference within the GameObject model stated previously. After the note button is clicked, the event listener initiates the function to get the note as seen in the following code: 

```js
$(document).on("click", ".button", function() {
  // Empty the notes from the note section
  $("#notes").empty();
  // Save the id
  var thisId = $(this).attr("data-id");

  $.ajax({
    method: "GET",
    url: "/gameobjects/" + thisId
  })
    // With that done, add the note information to the page
    .then(function(data) {
      console.log(data);
      // The title
      $("#notes").append("<h2>" + data.title + "</h2>");
      // An input to enter a new title
      $("#notes").append("<input id='titleinput' name='title' >");
      // A textarea to add a new note body
      $("#notes").append("<textarea id='bodyinput' name='body'></textarea>");
      // A button to submit a new note, with the id saved to it
      $("#notes").append("<button class = 'btn btn-primary'  data-id='" + data._id + "' id='savenote'>Save Note</button>");

      if (data.note) {
        // Place the title of the note in the title input
        $("#titleinput").val(data.note.title);
        // Place the body of the note in the body textarea
        $("#bodyinput").val(data.note.body);
      }
    });
});
```
An ajax method is called to get the note specific to the list element and starts dynamically creating the note form onto the DOM. The user can type in a title for the note and a message. After clicking save note, another event listener initiates the save functionality which runs a post to the mongoose database and then empties the notes div as seen here:
```js
$(document).on("click", "#savenote", function() {
  // Grab the id from the submit button
  var thisId = $(this).attr("data-id");

  // Run a POST request to change the note, using what's entered in the inputs
  $.ajax({
    method: "POST",
    url: "/gameobjects/" + thisId,
    data: {
      // Value taken from title input
      title: $("#titleinput").val(),
      // Value taken from note textarea
      body: $("#bodyinput").val()
    }
  })
    // With that done
    .then(function(data) {
      // Log the response
      console.log(data);
      // Empty the notes section
      $("#notes").empty();
    });

  // Also, remove the values entered in the input and textarea for note entry
  $("#titleinput").val("");
  $("#bodyinput").val("");
});
```

| Technologies Used | References |
| ----------------- | ---------- |
| HTML | https://developer.mozilla.org/en-US/docs/Web/HTML |
| CSS | https://developer.mozilla.org/en-US/docs/Web/CSS |
| Bootstrap | https://getbootstrap.com/ |
| JavaScript | https://developer.mozilla.org/en-US/docs/Web/Javascript |
| jQuery | https://jquery.com/ |
| NodeJS | https://nodejs.org/en/ |
| Express | https://www.npmjs.com/package/express |
| Mongoose | https://www.npmjs.com/package/mongoose |
| Cheerio | https://www.npmjs.com/package/cheerio |
| Axios | https://www.npmjs.com/package/axios |
| Express Handlebars | https://www.npmjs.com/package/express-handlebars |

######

| Versioning | References |
| ---------- | ---------- |
| Github | https://github.com/ |

######

Author
- Darryl Tolentino

Acknowledgements
- Jake Dudum, Amber Burroughs, Sajeel Malik - For help with syntax and with the scraping

