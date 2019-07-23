var mongoose = require("mongoose");

var Schema = mongoose.Schema;

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

module.exports = GameObject;