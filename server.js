var express = require("express");
var mongoose = require("mongoose");
var cheerio = require("cheerio");
var axios = require("axios");

const port = 8080;

let app = express();

app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(express.static("public"));