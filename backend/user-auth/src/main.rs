use std::{cell::RefCell, collections::HashMap, fs::File, hash::{DefaultHasher, Hash, Hasher}};

use actix_web::{get, post, web, App, HttpResponse, HttpServer, Responder};
use rand::Rng;
use serde::Deserialize;
use sqlx::{postgres::PgPoolOptions, Database, Pool, Postgres};

// Struct defining user data
#[derive(Debug)]
struct User {
    salt: String,
    password_hash: u64
}

// A struct that we will use to store global state.
// It uses a hash map to allow searching by username.
// With a proper database, this would be unnecessary.
#[derive(Debug)]
struct State {
    users: HashMap<String, User>,
    pool: Pool<Postgres>
}

fn hash_password(password: &str, salt: &[u8; 16]) -> Result<[u8; 64], Box<dyn std::error::Error>> {
    let hash = bcrypt::hash_with_salt(password, 8, *salt).map_err(|_| "Hash error.")?.format_for_version(bcrypt::Version::TwoB);
    let bytes = hash.as_bytes();

    Ok(bytes.try_into()?)
}

// Define the structure for a create account request.
// actix_web automatically converts back and forth between
// this struct and a matching JSON object
#[derive(Deserialize)]
struct CreateAccountRequest {
    email: String,
    password: String
}

#[post("/create-account")]
async fn create_account(req_body: web::Json<CreateAccountRequest>, state: web::Data<State>) -> Result<impl Responder, Box<dyn std::error::Error>> {
    // I think this is *technically* not a cryptographically secure way to generate random numbers, but it's probably fine.
    let mut rng = rand::rng();
    let mut salt = [0u8; 16];

    for byte in &mut salt {
        *byte = rng.random_range(33..126); // limit to printable characters just in case (it probably doesn't actually matter)
    }

    let hash = hash_password(&req_body.password, &salt)?;
    sqlx::query(r#"
        INSERT INTO public."Users" (email, salt, password_hash)
            VALUES ($1, $2, $3)
        "#)
        .bind((req_body.email, salt, hash))
        .execute(&state.pool).await?;

    Ok(HttpResponse::Ok().body("ok"))
}

// Define the structure for a login request.
// actix_web automatically converts back and forth between
// this struct and a matching JSON object
#[derive(Deserialize)]
struct LoginRequest {
    email: String,
    password: String
}

// 
#[post("/login")]
async fn login(req_body: web::Json<LoginRequest>, state: web::Data<State>) -> Result<impl Responder, Box<dyn std::error::Error>> {
    let query: Result<(String, String), _> = sqlx::query_as(r#"SELECT password_hash, salt FROM public."Users" where email = $1"#)
        .bind(&req_body.email)
        .fetch_one(&state.pool).await;

    match query {
        Ok((password_hash, salt)) => {
            let password_hash: [u8; 64] = password_hash.as_bytes().try_into().map_err(|_| "Bad password hash.")?;
            let salt: [u8; 16] = salt.as_bytes().try_into().map_err(|_| "Bad salt.")?;

            let request_password_hash = hash_password(&req_body.password, &salt)?;

            if request_password_hash == password_hash {
                Ok(HttpResponse::Ok().body("Successful login."))
            } else {
                Ok(HttpResponse::Ok().body("Invalid login credentials."))
            }
        },
        Err(_) => Ok(HttpResponse::Ok().body("Invalid login credentials."))
    }

    // // Get a reference to the user struct if it exists within the HashMap.
    // // If it doesn't, send invalid credentials response.
    // let user = match state.unwrap().users.get(&req_body.username) {
    //     Some(user) => user,
    //     None => return HttpResponse::Ok().body("Invalid login credentials")
    // };

    // let salted_password = req_body.password.to_owned() + &user.salt;

    // // A 64-bit hash is not good enough, this is just a proof of concept
    // let mut hasher = DefaultHasher::new();
    // salted_password.hash(&mut hasher);
    // let hash = hasher.finish();

    // // If the credentials match, send success response.
    // if user.password_hash == hash {
    //     return HttpResponse::Ok().body("login successful");
    // }
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

    let pool = PgPoolOptions::new()
        .max_connections(20)
        .connect("postgres://postgres:chavnatest@localhost/chavna").await
        .unwrap();

    // Create state struct 
    let state = web::Data::new(State {
        users,
        pool
    });

    HttpServer::new(move || {
        App::new()
            .service(login) // Register login service
            .app_data(state.clone())
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