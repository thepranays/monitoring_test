const express = require('express');
const PromClient = require('prom-client'); //promethus client (Metrix collection)
const { doWork } = require('./work');
const { register } = require('prom-client');

//RAM , MEMORY, CPU Utilization metrices 
const collectDefaultMetrics = PromClient.collectDefaultMetrics;
collectDefaultMetrics({ register: PromClient.register });


const app = express();
const PORT = process.env.PORT || 8000;
app.get("/", (req, res) => {
    return res.status(200).json({
        status: "UP",
        msg: `Runing`
    });
});
app.get("/slow", async (req, res) => {
    try {
        const delay = await doWork();
        return res.json({
            status: "Success",
            msg: `Task completed in ${delay}`
        })
    } catch (err) {
        // console.log(err);
        return res.status(500).json({ status: "Error", msg: `Internal server error` })
    }
});

app.get("/metrics", async (req, res) => {
    res.setHeader('Content-Type', PromClient.register.contentType);
    const metrices = await PromClient.register.metrics();
    res.send(metrices);
});

app.listen(PORT, () => console.log(`Server started..at ${PORT}`));