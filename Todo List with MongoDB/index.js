
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Middleware to parse JSON
app.use(express.json());
// MongoDB connection string (Docker)
const mongoURI = 'mongodb://admin:secret@localhost:27017/todoList?authSource=admin';

mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})  
.then(() => console.log('✅ MongoDB Connected'))
.catch(err => console.error('❌ MongoDB connection error:', err));

const itemsSchema = {
    name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
    name: "Welcome to your todolist!"
});


const defaultItems = [item1];

const listSchema = {
    name: String,
    items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {

    Item.find().then(foundItems => {
        // console.log(foundItems);

        if (foundItems.length === 0) {

            Item.insertMany(defaultItems)
                .then(results => {
                    console.log('Documents inserted successfully');
                })
                .catch(err => {
                    console.error(err);
                });
            res.redirect("/");
        }
        else {
            res.render("list", { listTitle: "Today", newListItems: foundItems });
        }

    })
        .catch(err => {
            console.error(err);
        });
});


app.get("/:customListName", function (req, res) {
    const customListName = _.capitalize(req.params.customListName);

    List.findOne({ name: customListName })
        .then(foundList => {
            if (!foundList) {
                // Create a new list
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });
                list.save();
                res.redirect("/" + customListName);
            }
            else {
                // show an existing list
                res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
            }
        })
        .catch(err => {
            console.error(err);
        });


});



app.post("/", function (req, res) {

    const itemName = req.body.newItem;
    const listName = req.body.list;
    const item = new Item({
        name: itemName
    });

    if (listName === "Today") {
        item.save();
        res.redirect("/");
    }
    else {
        List.findOne({ name: listName })
            .then(foundList => {
                foundList.items.push(item);
                foundList.save();
                res.redirect("/" + listName);
            })
            .catch(err => {
                console.error(err);
            });
    }



});

app.post("/delete", function (req, res) {

    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;


    if (listName === "Today") {
        Item.findByIdAndDelete(checkedItemId)
            .then(() => {
                console.log("succesfully deleted checked Item.");
            })
            .catch(err => {
                console.error(err);
            });
        res.redirect("/");
    }
    else {
        List.findOneAndUpdate({ name: listName }, {
            $pull: {
                items: {
                    _id: checkedItemId
                }
            }
        })
            .then(foundList => {
                if (foundList) {
                    res.redirect("/" + listName);
                } else {
                    console.log("Error updating list");
                }
            })
            .catch(err => {
                console.error(err);
            });
    }

});


app.listen(8000, function () {
    console.log("Server started on port 8000");
});