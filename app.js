//jshint esversion: 6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

mongoose.connect("mongodb+srv://tanishk:tanishk18@cluster0.md5f7.mongodb.net/todolistDB", {useNewUrlParser: true});

const itemsSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Don't enter empty values."]
  }
});

const ItemsModel = mongoose.model("item", itemsSchema);

const item1 = new ItemsModel({
  name: "Welcome to your to-do list!"
});

const item2 = new ItemsModel({
  name: "Hit the '+' button to add a new item."
});

const item3 = new ItemsModel({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Don't enter empty values"]
  },
  items: [itemsSchema]
});

const ListModel = mongoose.model("list", listSchema);

const app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.set("view engine", "ejs");

app.post("/", function(req, res){
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const userItem = new ItemsModel({
    name: itemName
  });

  if(listName === "Today"){
    userItem.save();
    res.redirect("/");
  }else{
    ListModel.findOne({name: listName}, function (err, result) {
      if(err){
        console.log(err);
      }else{
        result.items.push(userItem);
        result.save();
        res.redirect("/"+listName);
      }
    });
  }
});

app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today"){
    ItemsModel.deleteOne({_id: checkedItemId}, function (err) {
      if(err){
        console.log(err);
      }else{
        console.log("Successfully deleted checked item.");
      }
    });
    res.redirect("/");
  }else{
    ListModel.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function (err, result) {
      if(err){
        console.log(err);
      }else{
        console.log("Successfully deleted checked item.");
      }
    });
    res.redirect("/"+listName);
  }
});

app.get("/", function(req, res){
  ItemsModel.find({}, function (err, items) {
    if(err){
      console.log(err);
    }else if(items.length === 0){
      ItemsModel.insertMany(defaultItems, function (err){
        if(err){
          console.log(err);
        }else{
          console.log("Default Items successfully added to the collection.");
        }
      });
      res.redirect("/");
    }else{
      res.render("list", {
        listTitle: "Today",
        listItems: items
      });
    }
  });
});

app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  ListModel.findOne({name: customListName}, function (err, result) {
    if(err){
      console.log(err);
    }else if(result === null && result !== "about"){
      const list = new ListModel({
        name: customListName,
        items: defaultItems
      });
      list.save();
      console.log("Default Items successfully added to the collection.");
      res.redirect("/" + customListName);
    }else{
      res.render("list", {
        listTitle: result.name,
        listItems: result.items
      });
    }
  });
});

app.get("/about", function(req, res){
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port, function(){
  console.log("Server has started successfully.");
});
