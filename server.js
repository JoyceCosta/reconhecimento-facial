const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt-nodejs");
const cors = require("cors");
const knex = require("knex");

const db = knex({
	client: "pg",
	connection: {
		host: "127.0.0.1",
		users: "postgres",
		password: "",
		database: "smart-brain",
	},
});

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.get("/", (req, res) => {
	res.send(database.users);
});

app.post("/signin", (req, res) => {
	db.select("email", "hash")
		.from("login")
		.where("email", "=", req.body.email)
		.then((data) => {
			const isValid = bcrypt.compareSync(req.body.password, data[0].hash);
			if (isValid) {
				return db
					.select("*")
					.from("users")
					.where("email", "=", req.body.email)
					.then((users) => {
						res.json(users[0]);
					})
					.catch((err) => res.status(400).json("unable to get user"));
			} else {
				res.status(400).json("wrong credentials");
			}
		})
		.catch((err) => res.status(400).json("wrong credentials"));
});

app.post("/register", (req, res) => {
	const { name, email, password } = req.body;
	const hash = bcrypt.hashSync(password);

	db.transaction((trx) => {
		trx.insert({
			// Use ES6 syntax for same value-key names. Example: { hash, email }
				hash,
        email
			})
			.into("login")
			.returning("email")
			.then( loginEmail => {
				return trx("users")
					.returning("*")
					.insert({
						email: loginEmail[0],
						name,
						joined: new Date(),
					})
					.then(users => {
						res.json(users[0]);
					});
			})
			.then(trx.commit)
			.catch(trx.rollback);
	}).catch(err => res.status(400).json(`Unable to register. ${err.detail}`));
});

app.get("/profile/:id", (req, res) => {
	const { id } = req.params;
	db.select("*")
		.from("users")
		.where({ id })
		.then((users) => {
			if (users.length) {
				res.json(users[0]);
			} else {
				res.status(400).json("Not found");
			}
		})
		.catch((err) => res.status(400).json("error getting user"));
});

app.put("/image", (req, res) => {
	const { id } = req.body;
	db("users")
		.where("id", "=", id)
		.increment("entries", 1)
		.returning("entries")
		.then((entries) => {
			res.json(entries[0]);
		})
		.catch((err) => res.status(400).json("unable to get entries"));
});

app.listen(3001 , () => {
	console.log("app is running on port 3001");
});

