import express from "express";
import run from "./runner";
const app = express();

import {Worker} from "worker_threads"

app.use(express.json())
app.use(express.urlencoded({extended: true}))

app.post("/", async(req, res) => {
    if(!req.body.code) {
        return res.send("Please provide and inputs")
    }
    try {
        

        if(req.body.inputs == undefined){
            const worker = new Worker("./src/runner.ts", {workerData: {
                code: req.body.code,
                inputs: undefined
            }})
            console.log("Worker started " + worker.threadId)
            worker.on("message", (result) => {
                res.send(result)
                worker.terminate()
            })
            //res.send(await run(req.body.code as string,[""]));
        
        }else{
            const worker = new Worker("./src/runner.ts", {workerData: {
                code: req.body.code,
                inputs: req.body.inputs.split(",")
            }})

            console.log("Worker started " + worker.threadId)
            worker.on("message", (result) => {
                res.send(result)
                worker.terminate()
            })
            //res.send(await run(req.body.code as string, req.body.inputs.split(",")));
        }
    
    } catch (error) {
        res.send("Compilation Error")
    }

})

app.listen(8000, () => {
    console.log("Server is running on port 8000");
})