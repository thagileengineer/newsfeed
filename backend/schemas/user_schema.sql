create table users (
	user_id SERIAL PRIMARY KEY,
	username varchar(50) UNIQUE NOT NULL,
	first_name varchar(50) NOT NULL,
	middle_name varchar(50),
	last_name varchar(50),
	email varchar(100) UNIQUE NOT NULL,
	created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
	password_hash varchar(255) not null
);


select * from users;
