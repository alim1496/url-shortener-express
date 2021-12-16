const express = require("express");
const shortid = require("shortid");
const mysql = require("mysql");
const app = express();

app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(express.urlencoded({ extended: false }));

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "url_shortener"
});

db.connect(err => {
    if(err) {
        console.log("Error connecting to DB");
        return;
    }
    console.log("Connceted to DB");
});

app.get("/", (req, res) => {
    res.render("home.ejs");
});

app.post("/shorturl", (req, res) => {
    const fullUrl = req.body.fullUrl;
    if (!fullUrl) {
        return res.sendStatus(404);
    }
    db.query('SELECT * FROM `url` WHERE `fullUrl` = ?', [fullUrl], (error, results) => {
        if (error) {
            console.log("we got error");
            return;
        }

        if (results.length === 0) {
            const short = shortid.generate();
            const url = { fullUrl: req.body.fullUrl, shortUrl: short, counts: 1 };
            db.query('INSERT INTO `url` SET ?', url, (err, res) => {
                if (err) {
                    console.log("Error creating table");
                    return;
                }
            });
            res.render("result.ejs", { shortUrl: short, times: 1 });
        } else {
            const _short = results[0].shortUrl;
            const _counts = results[0].counts;
            db.query('UPDATE `url` SET `counts` = ? WHERE `shortUrl` = ?', [_counts + 1, _short], (err, res) => {
                if (err) {
                    console.log("Error updating table");
                    return;
                }
            });
            res.render("result.ejs", { shortUrl: _short, times: _counts + 1 });
        }
    });
});

app.get("/:shortUrl", (req, res) => {
    db.query('SELECT * FROM `url` WHERE `shortUrl` = ?', [req.params.shortUrl], (error, results) => {
        if (error) {
            return res.sendStatus(404);
        }

        if (results.length === 0) {
            res.render("error.ejs");
        } else {
            res.redirect(results[0].fullUrl);
        }
    });
});

app.listen(3000);
