const mongoose = require('mongoose');
const User = require('./backend/models/User');
require('dotenv').config({ path: './backend/.env' });

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/digital-diner';

async function getOtp() {
    try {
        await mongoose.connect(MONGO_URI);
        const user = await User.findOne({ mobile: '9876543210' });
        if (user) {
            console.log('OTP for 9876543210:', user.otp);
        } else {
            console.log('User not found');
        }
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

getOtp();
