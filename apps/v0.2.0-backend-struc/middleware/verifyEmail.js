module.exports = function (req, res, next) {
    const { isVerified } = req.user;
    if (!isVerified) return res.status(401).json({ error: "Email not verified" });
    next();
};
