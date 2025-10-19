create table follows(
	follower_id integer references users(user_id) on delete cascade,
	following_id integer references users(user_id) on delete cascade,
	followed_at timestamp without time zone default now(),
	primary key (follower_id, following_id),
	constraint check_self_follow check (follower_id <> following_id)
);


create index idx_follower_id on follows (follower_id);