const errorHandler = (err, req, res, next) => {
    console.error(err);
    const status = err.status || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({
        result: null,
        message,
        detail: err.detail || null,
    });
};
export default errorHandler;
