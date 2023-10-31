const express = require('express');
const PromClient = require('prom-client'); //promethus client (Metrix collection)
const responseTime = require('response-time'); //custom response time metrix
const LokiTransport = require('winston-loki'); //grafana-loki bridge
const {createLogger, transports} = require('winston');
const { doWork } = require('./work');


const app = express();
const PORT = process.env.PORT || 8000;

//Loki setup 
const options = {

    transports:new LokiTransport({
        labels:{
            appName:"express",
            
        },
        host:"http://127.0.0.1:3100"})
}
const logger = createLogger(options);


//RAM , MEMORY, CPU Utilization metrices 
const collectDefaultMetrics = PromClient.collectDefaultMetrics;
collectDefaultMetrics({ register: PromClient.register });

//Custom metrics (response time)

const reqResTime =  new PromClient.Histogram({
    name:"http_express_req_res_time",
    help:"This tells how much time is taken by req and res",
    labelNames:["method","route","status_code"],
    buckets:[1, 50, 100, 200, 400, 500, 800, 1000, 1500, 2000, 2500, 3000],
});

app.use(responseTime((req,res,time)=>{
    reqResTime.labels({method:req.method,route:req.url,status_code:res.statusCode})
    .observe(time);
}));
app.get("/", (req, res) => {
    logger.info("Request came at /"); //sends to grafana 
    return res.status(200).json({
        status: "UP",
        msg: `Runing`
    });
});
app.get("/slow", async (req, res) => {
    
    try {
        logger.info("Request came at /slow");

        const delay = await doWork();
        return res.json({
            status: "Success",
            msg: `Task completed in ${delay}`
        })
    } catch (err) {
        logger.error("Request errored at /slow");

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