function errorHandler(err, req, res, next) {

    if (err.name === 'UnauthorizedError') {
        // jwt authentication error
        return res.status(400).json({ status: false, message: "User not Authorized" });
    }

    if (err.name === 'ValidationError')
        //Validation error 
        return res.status(401).json({ message: err })

    // default to 500 server error
    console.log("Error Handler = ", err);
    return res.status(500).json({ message: err.message });
}

module.exports = errorHandler;