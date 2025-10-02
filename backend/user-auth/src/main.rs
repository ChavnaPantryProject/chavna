use actix_web::{get, post, web, App, HttpResponse, HttpServer, Responder};
use rand::Rng;
use serde::Deserialize;
use sqlx::{postgres::PgPoolOptions, Pool, Postgres};

const USERS_TABLE: &str = "users";

// A struct that we will use to store global state.
// It uses a hash map to allow searching by username.
// With a proper database, this would be unnecessary.
#[derive(Debug)]
struct State {
    pool: Pool<Postgres>
}

fn hash_password(password: &str, salt: &[u8; 16]) -> Result<[u8; 60], Box<dyn std::error::Error>> {
    let hash = bcrypt::hash_with_salt(password, 8, *salt).map_err(|_| "Hash error.")?.format_for_version(bcrypt::Version::TwoB);
    let bytes = hash.as_bytes();

    Ok(bytes.try_into().map_err(|err| format!("{} - bytes: {}", err, &hash))?)
}

// Define the structure for a create account request.
// actix_web automatically converts back and forth between
// this struct and a matching JSON object
#[derive(Deserialize)]
struct CreateAccountRequest {
    email: String,
    password: String,
    first_name: String,
    last_name: String
}

#[post("/create-account")]
async fn create_account(req_body: web::Json<CreateAccountRequest>, state: web::Data<State>) -> Result<impl Responder, Box<dyn std::error::Error>> {
    // I think this is *technically* not a secure way to generate random numbers, but it's probably fine.
    let mut rng = rand::rng();
    let mut salt = [0u8; 16];

    for byte in &mut salt {
        *byte = rng.random_range(33..126); // limit to printable characters just in case (it probably doesn't actually matter)
    }

    let hash = hash_password(&req_body.password, &salt)?;
    sqlx::query(&format!(r#"
        INSERT INTO {} (email, password_salt, password_hash, first_name, last_name)
            VALUES ($1, $2, $3, $4, $5)
        "#, USERS_TABLE))
        .bind(&req_body.email)
        .bind(salt)
        .bind(hash)
        .bind(&req_body.first_name)
        .bind(&req_body.last_name)
        .execute(&state.pool).await?;

    Ok(HttpResponse::Ok().body(format!("Account created with email: {}", req_body.email)))
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
    let query: Result<([u8; 60], [u8; 16]), _> = sqlx::query_as(&format!(r#"SELECT password_hash, password_salt FROM {} where email = $1"#, USERS_TABLE))
        .bind(&req_body.email)
        .fetch_one(&state.pool).await;

    // Manually handle error so the client doesn't get too much information about what was wrong
    match query {
        Ok((password_hash, salt)) => {
            let request_password_hash = hash_password(&req_body.password, &salt)?;

            if request_password_hash == password_hash {
                Ok(HttpResponse::Ok().body("Successful login."))
            } else {
                Ok(HttpResponse::Ok().body("Invalid login credentials."))
            }
        },
        Err(_) => Ok(HttpResponse::Ok().body("Invalid login credentials."))
    }
}

#[get("/")]
async fn hello() -> impl Responder {
    HttpResponse::Ok().body("Hello world!")
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let pool = PgPoolOptions::new()
        .max_connections(20)
        .connect(&std::env::var("DATABASE_URL").unwrap()).await
        .unwrap();

    // Create state struct 
    let state = web::Data::new(State {
        pool
    });

    HttpServer::new(move || {
        App::new()
            .service(login) // Register login service
            .service(create_account)
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