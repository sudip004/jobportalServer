const jwt = require('jsonwebtoken');

const generateToken = (user) => {
    const payload = {
        id: user._id,
        email: user.email,
    };
    const secret ="sudipbasak"
    const options = {
        expiresIn: '24h',
    };  
    return jwt.sign(payload, secret, options);
}
module.exports = { generateToken };