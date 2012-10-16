-- psql undefined <
-- I suggest testing on a new temp db before, and changing the db name in sql.clj
-- to create a new DB: CREATE DATABASE name;

DROP TABLE IF EXISTS article_authors, article_categories, article_tags, articles, author_roles, authors, categories, comments, projects, reset_links, roles, tags, temp_authors;

CREATE TABLE articles (uid SERIAL PRIMARY KEY, title TEXT NOT NULL, body TEXT NOT NULL, birth TIMESTAMP (0) DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE categories (uid SERIAL PRIMARY KEY, label TEXT UNIQUE NOT NULL);
CREATE TABLE tags (uid SERIAL PRIMARY KEY, label TEXT UNIQUE NOT NULL);

CREATE TABLE authors (uid SERIAL PRIMARY KEY, username TEXT UNIQUE NOT NULL, email TEXT UNIQUE NOT NULL, password TEXT NOT NULL, salt TEXT NOT NULL, birth TIMESTAMP (0) DEFAULT CURRENT_TIMESTAMP);
CREATE UNIQUE INDEX username_lower_id ON authors (lower(username));
CREATE UNIQUE INDEX email_lower_id ON authors (lower(email));

CREATE TABLE temp_authors (uid SERIAL PRIMARY KEY, username TEXT UNIQUE NOT NULL, email TEXT UNIQUE NOT NULL, password TEXT NOT NULL, salt TEXT NOT NULL, birth TIMESTAMP (0) DEFAULT CURRENT_TIMESTAMP, activation TEXT NOT NULL);
CREATE UNIQUE INDEX username_temp_lower_id ON temp_authors (lower(username));
CREATE UNIQUE INDEX email_temp_lower_id ON temp_authors (lower(email));

CREATE TABLE roles (uid SERIAL PRIMARY KEY, label TEXT UNIQUE NOT NULL);

CREATE TABLE article_categories (artid INTEGER references articles(uid) ON DELETE CASCADE NOT NULL, catid INTEGER references categories(uid) ON DELETE CASCADE NOT NULL, PRIMARY KEY (artid, catid));
CREATE TABLE article_tags (artid INTEGER references articles(uid) ON DELETE CASCADE NOT NULL, tagid INTEGER references tags(uid) ON DELETE CASCADE NOT NULL, PRIMARY KEY (artid, tagid));
CREATE TABLE article_authors (artid INTEGER references articles(uid) ON DELETE CASCADE NOT NULL, authid INTEGER references authors(uid) ON DELETE CASCADE NOT NULL, PRIMARY KEY(artid, authid));

CREATE TABLE author_roles (authid INTEGER references authors(uid) ON DELETE CASCADE NOT NULL, roleid INTEGER references roles(uid) ON DELETE CASCADE NOT NULL);

CREATE TABLE projects (uid SERIAL PRIMARY KEY, title TEXT NOT NULL, description TEXT NOT NULL, link TEXT NOT NULL, screenshot TEXT NOT NULL, pin INTEGER UNIQUE NOT NULL);

CREATE TABLE comments (uid SERIAL PRIMARY KEY, content TEXT NOT NULL, artid INTEGER references articles(uid) ON DELETE CASCADE, authid INTEGER references authors(uid), birth TIMESTAMP (0) DEFAULT CURRENT_TIMESTAMP, edit TIMESTAMP (0) DEFAULT NULL);

CREATE TABLE reset_links (uid SERIAL PRIMARY KEY, userid INTEGER references authors(uid) ON DELETE CASCADE, birth TIMESTAMP (0) DEFAULT CURRENT_TIMESTAMP, resetlink TEXT NOT NULL);
CREATE TABLE newemail_links (uid SERIAL PRIMARY KEY, userid INTEGER references authors(uid) ON DELETE CASCADE,newemail TEXT NOT NULL, birth TIMESTAMP (0) DEFAULT CURRENT_TIMESTAMP, updatelink TEXT NOT NULL);


INSERT INTO categories (label) VALUES ('blog'), ('news');
INSERT INTO authors (username, password, salt, email) VALUES ('Landolphia', '$2a$10$BaeeLnmUjxsRfa.BSc/mderQTDzFz0LhSaWzsZW0wbgtE/ArKS3x2', 'tempnull', 'landolphia@undefined.re'), ('Wonko', '$2a$10$/8C.pT7tn7Y5uCEN1eWOEOHSLMh4WwG5Yp808mOMlkw4GT/AGTqdy', 'tempnull', 'wonko7@undefined.re');

INSERT INTO projects (title, description, link, screenshot, pin) VALUES ('Undefined''s Webiste', '<p>Our website''s source code is on github, check it out: <a href="https://github.com/defined/undefined/" data-ext="true">undefined</a>.</p> <p>We use the following projects; <a href="http://clojure.org">clojure</a>, <a href="https://github.com/clojure/clojurescript" data-ext="true">clojurescript</a>, <a href="http://webnoir.org" data-ext="true">noir</a>, <a href="https://github.com/ibdknox/fetch" data-ext="true">fetch</a>, <a href="https://github.com/cemerick/friend" data-ext="true">friend</a>, <a href="https://github.com/korma/Korma" data-ext="true">korma</a>, <a href="https://github.com/cgrand/enlive" data-ext="true">enlive</a>, <a href="https://github.com/ckirkendall/enfocus" data-ext="true">enfocus</a> & <a href="http://compass-style.org/" data-ext="true">compass</a>. All <a href="mailto:defined@undefined.re" data-ext="true">comments</a> are welcome.</p>', 'https://github.com/defined/undefined/', '', 3);
INSERT INTO projects (title, description, link, screenshot, pin) VALUES ('Budget Splitter', '<p>Budget Splitter is an application designed to help you share a budget on outings with friends.</p><p>Alice rented a car for the trip which cost her $75, Bob payed $50 for gas & Charlie $25 worth of pizzas. Bob also paid $15 for two cinema tickets and popcorn. Alice didn''t go and won''t be participating in that expense.</p><p>How do we equalise the expenses? Budget Splitter to the rescue!</p><p>Budget Splitter targets WebKit browsers: Iphone, Android, Chrome & Safari.</p>', '/projects/budget-splitter/index.html', '/img/budgetsplitter.png', 2);
-- INSERT INTO projects (title, description, link, screenshot, pin) VALUES ('Smriti', 'Smriti is a task manager.', '/projects/smriti/index.html', '/img/404.jpg', 1);

INSERT INTO roles (label) VALUES ('peon'), ('admin'), ('contributor');

INSERT INTO author_roles VALUES (1, 2), (2, 2);

-- Populates DB with test data which ressembles the current state of the site + data for unreleased features

INSERT INTO articles VALUES (2, 'Undefined is up!', '<p>Undefined now has a website. We''ll be showing our
<a href="projects">projects</a>, and keeping the technical blog & news
section up to date. We have feeds for your favourite news aggragator; 
<a data-ext="true" href="http://undefined.re/news-feed">News Feed</a> and 
<a data-ext="true" href="http://undefined.re/blog-feed">Blog Feed</a>.
</p>

<p>The website''s <a href="https://github.com/defined/undefined/" data-ext="true">source code</a>
is on github, check it out if you''re into clojure.</p>', '2012-10-07 18:03:56');
INSERT INTO articles VALUES (1, 'Vim sniper', '<p>Vim''s cursorline & cursorcolumn are widely used and known and loved settings.
I never got used to them, they always end up annoying me; I like being able to
spot the cursor that easily, but while reading code I find it distracting.</p>

<p>So this is what I ended up using:</p>

<div class="code">set updatetime=2000

function! MySetCursor()
	set cursorline
	set cursorcolumn
endfunction
function! MyUnSetCursor()
	set nocursorline
	set nocursorcolumn
endfunction

au! CursorHold * call MyUnSetCursor()
au! CursorMoved * call MySetCursor()
au! CursorMovedI * call MyUnSetCursor()</div>

<p>It shows the cursor line & column while moving around in a buffer, hides it
after an idle time of 2 seconds, and hides it in input mode (because if I''m
writing in a buffer, hopefully I already know where I am...).</p>
', '2012-10-07 18:02:03');
INSERT INTO articles VALUES (3, 'McGyver''s null modem', '<p>What do you do when you want to connect two female D9 connectors and
the shops are closed when you realise that what you don''t have a null modem?
You badly want to play with an embedded device...
</p>

<p>If you feel in a McGyver kind of mood, you can make yourself one with a few
wires. I used cigarette filters to hold the wires in place (my first idea was
cork but couldn''t find any).<br>
<center><img src="img/null-modem.png" /></center>
</p>

<p>More information on RS232 serial null modem cable wiring <a href="http://www.lammertbies.nl/comm/info/RS-232_null_modem.html">here</a>.
</p>', '2012-10-09 16:15:24');

INSERT INTO tags VALUES (1, 'vim');
INSERT INTO tags VALUES (2, 'annoucement');
INSERT INTO tags VALUES (3, 'undefined');
INSERT INTO tags VALUES (4, 'hacks');

INSERT INTO article_authors VALUES (2, 2);
INSERT INTO article_authors VALUES (2, 1);
INSERT INTO article_authors VALUES (1, 2);
INSERT INTO article_authors VALUES (3, 2);

INSERT INTO article_categories VALUES (2, 2);
INSERT INTO article_categories VALUES (1, 1);
INSERT INTO article_categories VALUES (3, 1);

INSERT INTO article_tags VALUES (2, 3);
INSERT INTO article_tags VALUES (1, 1);
INSERT INTO article_tags VALUES (3, 4);

INSERT INTO comments (content, artid, authid, birth) VALUES ('This does not mean my bath is red', 1, 1, '2012-10-07 18:03:56'),
 ('What do you mean?', 1, 2, '2012-10-07 18:17:23'),
 ('I mean it is not red, why is that so hard to understand?', 1, 1, '2012-10-07 20:34:10'),
 ('I apologize for my daughter, she used my account while I was taking a red bath. Please disregard the previous comments she made on my behalf', 1, 1, '2012-10-07 21:51:57'),
 ('You took a two day long bath? I guess the fact that it was red does not seem so weird anymore', 1, 2, '2012-10-08 09:42:15'),
 ('What an interesting post, I wish I could marry it', 2, 2, '2012-11-03 12:11:21'),
 ('The way things are going I will not be able to come home because of the cheesecake fairy', 3, 2, '2012-12-07 17:17:17'),
 ('I guess now you see why we need a better way to generate content randomly.', 3, 2, '2012-12-09 18:17:23');

-- template to insert a reset_link, use the sql.clj fn before trying that?
-- INSERT INTO reset_links (userid, resetlink) VALUES (1, 'hashyhashash');
-- same for temp_authors
-- INSERT INTO temp_authors (username, email, password, salt, activation) VALUES ('John', 'john@doe.re', 'hashedhashofhashyhashhash', 'uselessfornow', 'hashyhashofhashedhashwithhashontheside');

GRANT ALL PRIVILEGES ON article_authors, article_categories, article_tags, articles, author_roles, authors, categories, comments, projects, reset_links, roles, tags, temp_authors, tags_uid_seq, articles_uid_seq, comments_uid_seq, temp_authors_uid_seq, authors_uid_seq TO web;
