use std::{cell::RefCell, collections::HashMap, fs::File, hash::{DefaultHasher, Hash, Hasher}, sync::Mutex};

use actix_web::{get, post, web, App, HttpResponse, HttpServer, Responder};
use serde::Deserialize;

// Rust is really strict about mutability, so mutable global variables
// need to be thread safe, hence the mutex.
// The RefCell makes it mutable without it being unsafe.
static STATE: Mutex<RefCell<Option<State>>> = Mutex::new(RefCell::new(None));

// Struct defining user data
#[derive(Debug)]
struct User {
    salt: String,
    password_hash: u64
}

// A struct that we will use to store global state.
// It uses a hash map to allow searching by username.
// With a proper database, this would be unnecessary.
#[derive(Default, Debug)]
struct State {
    users: HashMap<String, User>
}

// Define the structure for a login request.
// actix_web automatically converts back and forth between
// this struct and a matching JSON object
#[derive(Deserialize)]
struct LoginRequest {
    username: String,
    password: String
}

// 
#[post("/login")]
async fn login(req_body: web::Json<LoginRequest>) -> impl Responder {
    let state = STATE.lock().unwrap();
    let state = state.borrow();
    let state = state.as_ref();

    // Get a reference to the user struct if it exists within the HashMap.
    // If it doesn't, send invalid credentials response.
    let user = match state.unwrap().users.get(&req_body.username) {
        Some(user) => user,
        None => return HttpResponse::Ok().body("Invalid login credentials")
    };

    let salted_password = req_body.password.to_owned() + &user.salt;

    // A 64-bit hash is not good enough, this is just a proof of concept
    let mut hasher = DefaultHasher::new();
    salted_password.hash(&mut hasher);
    let hash = hasher.finish();

    // If the credentials match, send success response.
    if user.password_hash == hash {
        return HttpResponse::Ok().body("login successful");
    }

    HttpResponse::Ok().body("Invalid login credentials")
}

#[get("/")]
async fn hello() -> impl Responder {
    HttpResponse::Ok().body("Hello world!")
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // Structs to load our JSON file into
    #[derive(Deserialize)]
    struct JsonUser {
        username: String,
        salt: String,
        password_hash: u64,
        // Allow unused, because this needs to be here for the JSON file to deserialize correctly,
        // but this field is not actually used in code. It's just used for reference.
        #[allow(unused)]
        actual_password: String
    }

    #[derive(Deserialize)]
    struct UsersFile {
        users: Vec<JsonUser>
    }

    let users_file = File::open("users.json")?;

    // Use the serde_json library to deserialize JSON file
    let users: UsersFile = serde_json::from_reader(users_file).unwrap();
    // Convert the Vec<JsonUser> to a hash map
    let users = users.users.iter().map(|user| {
        // Tuple of type (String, User) to be mapped as a key, value pair into a hash map
        (
            user.username.to_owned(),
            User {
                salt: user.salt.to_owned(),
                password_hash: user.password_hash
            }
        )
    }).collect();

    // Create state struct 
    let state = State {
        users
    };

    // Load the state struct into global variable
    let lock = STATE.lock().unwrap();
    lock.replace(Some(state));
    drop(lock); // Explicit drop to unlcok the mutex before the server gets started.

    HttpServer::new(|| {
        App::new()
            .service(login) // Register login service
    })
    // Bind to localhost when built with debug mode
    .bind((
        #[cfg(not(debug_assertions))]
        "0.0.0.0", // This line only compiles in release mode
        #[cfg(debug_assertions)]
        "127.0.0.1", // This line only compiles in debug mode
        8080))?
    .run()
    .await
}