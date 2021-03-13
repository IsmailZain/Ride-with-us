const express = require('express');
const path = require('path');
const ejsMate = require('ejs-mate');
const bcrypt = require('bcrypt');
const session = require('express-session');
const alert = require('alert')

// defining app
const app = express()

// models
const Driver = require("./models/driver")
const Rider = require("./models/rider")

// connecting to database
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/ride-with-us', {useNewUrlParser: true, useUnifiedTopology: true})
.then(() => {
    console.log("Database connected!!")
})
.catch((err) => {
    console.log("OH NO!! Error")
    console.log(err)
})

// max distance
const MAX_DIST =10



app.engine('ejs', ejsMate)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'))
app.use(express.static(path.join(__dirname, 'public')))
app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: 'notagoodsecret', resave: false,  saveUninitialized: true }))


// authentication

const authenticateDriver = (req,res,next) => {
    const {id} = req.params
    if (!req.session.driver_id) {
        alert("Log in first Please")
        return res.redirect('/driver/login')
    }
    else if(id !== req.session.driver_id)
    {
       
        alert("You dont have access to this")
        return res.redirect(`/driver/show/${req.session.driver_id}`)
    }
    next();
}
const authenticateRider = (req,res,next) => {
    const {id} = req.params
    if (!req.session.rider_id) {
        alert("Log in first Please")
        return res.redirect('/rider/login')
    }
    else if(id !== req.session.rider_id)
    {
        console.log(id)
        console.log(req.session.rider_id)
        alert("You dont have access to this")
        return res.redirect(`/rider/show/${req.session.rider_id}`)
    }
    next();
}


// api
app.get("/driver/changedb/:id", async (req,res) => {
    const {id} = req.params
    const driver = await Driver.findById(id)
    if(driver.isAvailable) res.send("true")
    else
    res.send("false")
})


app.get("/rider/changedb/:id", async (req,res) => {
    const {id} = req.params
    const rider = await Rider.findById(id)
    if(rider.state === "journeycompleted") res.send("false")
    else
    res.send("true")
})

// Handling routes

app.get("/driver/show/:id",authenticateDriver,async (req,res) => {
    const {id} = req.params

    const driver =await Driver.findById(id)
    const {isAvailable,ridingWith} = driver
    if(!isAvailable && ridingWith)
    {
        
        return res.redirect(`/driver/ride/${id}`)
    }

    //console.log(driver)
    res.render('driver.ejs',{driver})
})


app.get("/rider/show/:id",authenticateRider, async (req,res) => {
    const {id} = req.params
    const rider = await Rider.findById(id)
   // console.log(req.query)
    const {ride} = req.query
    if(ride)
    {
        rider.wantToRide = true
        rider.state  = "readytoride"
        rider.initial_coordinates = {x : ride['curr-xcoordinate'], y : ride['curr-ycoordinate']}
        rider.destination_coordinates = {x : ride['dest-xcoordinate'], y : ride['dest-ycoordinate']}
        rider.ridingWith = null
        //console.log(rider)
        await rider.save()
        
        const dist = (x1,y1,x2,y2) => {
            return Math.sqrt((x1-x2)**2 + (y1-y2)**2)
        }
       let cabs = await Driver.find( { $and :[{isAvailable : true},] })
        cabs.sort((a,b) => {
             return dist(a.coordinates.x,a.coordinates.y, rider.initial_coordinates.x,rider.initial_coordinates.y) - dist(b.coordinates.x,b.coordinates.y, rider.initial_coordinates.x,rider.initial_coordinates.y) 
        })
        cabs = cabs.filter((x) => {
           // console.log(dist(x.coordinates["x"],x.coordinates["y"],rider.initial_coordinates.x,rider.initial_coordinates.y))
            return (dist(x.coordinates["x"],x.coordinates["y"],rider.initial_coordinates.x,rider.initial_coordinates.y) < MAX_DIST) 
           
        })
        //console.log(cabs)
        
        const{ wantToRide }=  rider
       return res.render('rider.ejs', {wantToRide,cabs,id})
    }
    if(rider.state == "readytoride" && rider.ridingWith)
    {
        return res.redirect(`/rider/${id}/driver/${rider.ridingWith}`)
    }
    let cabs = []
    const{ wantToRide }=  rider
    res.render('rider.ejs', {wantToRide,cabs})
})

app.get("/rider/:id/driver/:cabId",authenticateRider, async (req,res) => {
    const {id,cabId} = req.params
    const rider = await Rider.findById(id)
    const driver = await Driver.findById(cabId)
    
    if(rider.state === "readytoride")
    {
        rider.ridingWith = driver
        driver.ridingWith = rider
        driver.isAvailable = false

        await driver.save()
        await rider.save()



        return res.render("riderRide", {driver,rider})

    }
    else if(rider.state === "journeycompleted")
    {
        rider.state = "notride"
       alert("Journey Completed ... Hurray")
        rider.history.push(driver)
        rider.wantToRide = false
        rider.ridingWith = null
        rider.save()

        res.redirect(`/rider/show/${id}`)
        
    }


    
    
})


app.get("/driver/ride/:id", async (req,res) => {
     //console.log(req.params)
    //console.log(req.query)
    const {id} = req.params
    const {ride} = req.query
    const driver = await Driver.findById(id)
    //console.log(driver)
    const {isAvailable,ridingWith} = driver
    //console.log(isAvailable)
   // console.log(ridingWith)
   if(ride)
   {
    driver.coordinates = {x : ride['curr-xcoordinate'], y : ride['curr-ycoordinate']}
  
   }
   
    if(!isAvailable && !ridingWith)
    {
        driver.isAvailable = true;
       // console.log(driver)
        await driver.save()
        return res.render("driverwait",{driver})
    }
    else if(!isAvailable && ridingWith)
    {
        await driver.save()
        const rider = await Rider.findById(ridingWith)
        const rname = rider.username
        return res.render("driverjourney.ejs", {rname,id,ridingWith})
    }
    else if(isAvailable && !ridingWith)
    {
        driver.save()
        return res.render("driverwait",{driver})
    }
   
    res.send("Here")
})

app.get("/journey/driver/:driverId/rider/:riderId", async(req,res) => {
    const {driverId,riderId} = req.params
    // check whether both are compatible or not

    const driver = await Driver.findById(driverId)
    const rider = await Rider.findById(riderId)

    driver.isAvailable = false
    driver.ridingWith = null
    driver.history.push(rider)

    rider.state = "journeycompleted"
    await rider.save()
    await driver.save()

    res.redirect(`/driver/show/${driverId}`)
    

})






// autentication
app.get('/driver/register', (req, res) => {
    res.render('dregister')
})

app.post('/driver/register', async (req, res) => {
    const {cabnumber, password, username,xcoordinate,ycoordinate } = req.body;
    const coordinates = {
        x:xcoordinate,
        y:ycoordinate
    }
    const isAvailable = false
    const cab_number = cabnumber

    

    const driver = new Driver({ username, password,coordinates,isAvailable,cab_number })
     await driver.save();
    req.session.driver_id = driver._id;
     return res.redirect(`/driver/show/${driver._id}`)
   
   
})


app.get('/rider/register', (req, res) => {
    res.render('rregister')
})

app.post('/rider/register', async (req, res) => {
    const { password, username } = req.body;
    const wantToRide = false;
    const initial_coordinates ={x:null,y:null}
     const destination_coordinates = {x:null,y:null}
    const rider = new Rider({ username, password, wantToRide,  initial_coordinates, destination_coordinates})
    await rider.save();
    req.session.rider_id = rider._id;
     res.redirect(`/rider/show/${rider._id}`)
  
  
})



app.get('/driver/login', (req, res) => {
    res.render('dlogin')
})
app.post('/driver/login', async (req, res) => {
    const { username, password } = req.body;
    const foundUser = await Driver.findAndValidate(username, password);
    if (foundUser) {
        req.session.driver_id = foundUser._id;
        res.redirect(`/driver/show/${foundUser._id}`)
    }
    else {
        alert("Username or password is incoreect")
        res.redirect('/driver/login')
    }
})
app.get('/rider/login', (req, res) => {
    res.render('rlogin')
})
app.post('/rider/login', async (req, res) => {
    const { username, password } = req.body;
    const foundUser = await Rider.findAndValidate(username, password);
    if (foundUser) {
        req.session.rider_id = foundUser._id;
        res.redirect(`/rider/show/${foundUser._id}`)
    }
    else {
        alert("Username or password is incoreect")
        res.redirect('/rider/login')
    }
})

app.get('/driver/logout', (req, res) => {
    req.session.driver_id = null;
    // req.session.destroy();
    res.redirect('/drive/login');
})
app.get('/rider/logout', (req, res) => {
    req.session.rider_id = null;
    // req.session.destroy();
    res.redirect('/rider/login');
})



app.get("/", (req,res) => {
    res.render("index")
})




app.listen(3000, () => {
    console.log(`Serving on port 3000`)
})


// driver logout
// styles
// flash
// index modify
