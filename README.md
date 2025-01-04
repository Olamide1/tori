
~~My fix for Chuks' local mongo [issue](https://stackoverflow.com/a/69093518/9259701).~~

~~Mongo command to run [local](https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-os-x/#run-mongodb-community-edition)~~

Run `sudo mongod -dbpath="/usr/local/var/mongodb"` to start mongo

Running the frontend:
`cd frontend` & `python -m http.server`
Open http://localhost:8000

Running the backend:
`cd backend` & `npm run dev`
Open http://localhost:8000


# TODOs
- If account doesn't exist; show proper and correct error message.
- Create company on sign up; do a proper linking of models.