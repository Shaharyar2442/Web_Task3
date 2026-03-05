const mongoose = require('mongoose');

// Define Mongoose schema for users collection
const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    password: { type: String, required: true }
}, { collection: 'users' });

// Create Mongoose model
const UserModel = mongoose.model('User', userSchema);

// User class as required by the assignment
class User {
    constructor(username, password) {
        this.username = username;
        this.password = password;
    }

    // Save user to MongoDB
    async register() {
        const newUser = new UserModel({
            username: this.username,
            password: this.password
        });
        await newUser.save();
        return 'User registered successfully';
    }

    // Check user credentials from MongoDB
    async login() {
        const user = await UserModel.findOne({
            username: this.username,
            password: this.password
        });
        return user;
    }
}

module.exports = User;
