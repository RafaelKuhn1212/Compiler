import express from "express";
import run from "./runner";
const app = express();

app.use(express.json())
app.use(express.urlencoded({extended: true}))

app.post("/", async(req, res) => {
    if(!req.body.code) {
        return res.send("Please provide and inputs")
    }
    try {
        
        console.log(req.body);
        if(req.body.inputs == undefined){
            res.send(await run(req.body.code as string,[""]));
        }else{
            res.send(await run(req.body.code as string, req.body.inputs.split(",")));
        }
    
    } catch (error) {
        res.send("Compilation Error")
    }

})

app.listen(8000, () => {
    console.log("Server is running on port 8000");
})