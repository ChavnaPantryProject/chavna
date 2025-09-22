use std::{cell::RefCell, collections::HashMap, fs::File, hash::{DefaultHasher, Hash, Hasher}, sync::Mutex};

use actix_web::{get, post, web, App, HttpResponse, HttpServer, Responder};
use serde::Deserialize;

static STATE: Mutex<RefCell<Option<State>>> = Mutex::new(RefCell::new(None));

#[derive(Debug)]
struct User {
    salt: String,
    password_hash: u64
}

#[derive(Default, Debug)]
struct State {
    users: HashMap<String, User>
}

#[derive(Deserialize)]
struct LoginRequest {
    username: String,
    password: String
}

#[post("/login")]
async fn login(req_body: web::Json<LoginRequest>) -> impl Responder {
    let state = STATE.lock().unwrap();
    let state = state.borrow();
    let state = state.as_ref();

    let user = match state.unwrap().users.get(&req_body.username) {
        Some(user) => user,
        None => return HttpResponse::Ok().body("Invalid login credentials")
    };

    let salted_password = req_body.password.to_owned() + &user.salt;
    let mut hasher = DefaultHasher::new();
    salted_password.hash(&mut hasher);
    let hash = hasher.finish();

    if user.password_hash == hash {
        return HttpResponse::Ok().body("login successful");
    }

    HttpResponse::Ok().body("Invalid login credentials")
}

#[get("/")]
async fn hello() -> impl Responder {
    HttpResponse::Ok().body("Hello world!")
}

#[post("/echo")]
async fn echo(req_body: String) -> impl Responder {
    HttpResponse::Ok().body(req_body)
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    #[derive(Deserialize)]
    struct JsonUser {
        username: String,
        salt: String,
        password_hash: u64,
        #[allow(unused)]
        actual_password: String
    }

    #[derive(Deserialize)]
    struct UsersFile {
        users: Vec<JsonUser>
    }

    let users_file = File::open("users.json")?;

    let users: UsersFile = serde_json::from_reader(users_file).unwrap();
    let users = users.users.iter().map(|user| {
        (
            user.username.to_owned(),
            User {
                salt: user.salt.to_owned(),
                password_hash: user.password_hash
            }
        )
    }).collect();

    let state = State {
        users
    };

    println!("{:?}", state);

    let lock = STATE.lock().unwrap();
    lock.replace(Some(state));
    drop(lock);

    HttpServer::new(|| {
        App::new()
            .service(hello)
            .service(echo)
            .service(login)
    })
    // Bind to localhost when built with debug mode
    .bind((
        #[cfg(not(debug_assertions))]
        "0.0.0.0",
        #[cfg(debug_assertions)]
        "127.0.0.1",
        8080))?
    .run()
    .await
}