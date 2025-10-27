create table comments(
	comment_id serial primary key,
	post_id integer references posts(post_id) on delete cascade not null,
	author_id integer references users(user_id) on delete cascade not null,
	content text not null,
	created_at timestamp without time zone default now()
)

