DROP TABLE IF EXISTS article_categories, article_tags, article_authors, author_roles, articles, categories, tags, authors, projects, roles, comments;

CREATE TABLE articles (uid SERIAL PRIMARY KEY, title TEXT NOT NULL, body TEXT NOT NULL, birth TIMESTAMP (0) DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE categories (uid SERIAL PRIMARY KEY, label TEXT UNIQUE NOT NULL);
CREATE TABLE tags (uid SERIAL PRIMARY KEY, label TEXT UNIQUE NOT NULL);

CREATE TABLE authors (uid SERIAL PRIMARY KEY, username TEXT UNIQUE NOT NULL, email TEXT UNIQUE NOT NULL, password TEXT NOT NULL, salt TEXT NOT NULL, birth TIMESTAMP (0) DEFAULT CURRENT_TIMESTAMP);
CREATE UNIQUE INDEX username_lower_id ON authors (lower(username));
CREATE UNIQUE INDEX email_lower_id ON authors (lower(email));

CREATE TABLE temp_authors (uid SERIAL PRIMARY KEY, username TEXT UNIQUE NOT NULL, email TEXT UNIQUE NOT NULL, password TEXT NOT NULL, salt TEXT NOT NULL birth TIMESTAMP (0) DEFAULT CURRENT_TIMESTAMP);
CREATE UNIQUE INDEX username_lower_id ON temp_authors (lower(username));
CREATE UNIQUE INDEX email_lower_id ON temp_authors (lower(email));


CREATE TABLE roles (uid SERIAL PRIMARY KEY, label TEXT UNIQUE NOT NULL);

CREATE TABLE article_categories (artid INTEGER references articles(uid) ON DELETE CASCADE, catid INTEGER references categories(uid) ON DELETE CASCADE, PRIMARY KEY (artid, catid));
CREATE TABLE article_tags (artid INTEGER references articles(uid) ON DELETE CASCADE, tagid INTEGER references tags(uid) ON DELETE CASCADE, PRIMARY KEY (artid, tagid));
CREATE TABLE article_authors (artid INTEGER references articles(uid) ON DELETE CASCADE, authid INTEGER references authors(uid) ON DELETE CASCADE, PRIMARY KEY(artid, authid));

CREATE TABLE author_roles (authid INTEGER references authors(uid) ON DELETE CASCADE, roleid INTEGER references roles(uid) ON DELETE CASCADEqu);

CREATE TABLE projects (uid SERIAL PRIMARY KEY, title TEXT NOT NULL, description TEXT NOT NULL, link TEXT NOT NULL, screenshot TEXT NOT NULL, pin INTEGER UNIQUE NOT NULL);

CREATE TABLE comments (uid SERIAL PRIMARY KEY, content TEXT NOT NULL, artid INTEGER references articles(uid) ON DELETE CASCADE, authid INTEGER references authors(uid), birth TIMESTAMP (0) DEFAULT CURRENT_TIMESTAMP, edit TIMESTAMP (0) DEFAULT NULL);


INSERT INTO categories (label) VALUES ('blog'), ('news');
INSERT INTO authors (username, password, salt, email) VALUES ('Landolphia', '$2a$10$BaeeLnmUjxsRfa.BSc/mderQTDzFz0LhSaWzsZW0wbgtE/ArKS3x2', 'tempnull', 'landolphia@undefined.re'), ('Wonko', '$2a$10$/8C.pT7tn7Y5uCEN1eWOEOHSLMh4WwG5Yp808mOMlkw4GT/AGTqdy', 'tempnull', 'wonko7@undefined.re');

INSERT INTO projects (title, description, link, screenshot, pin) VALUES ('Undefined''s Webiste', '<p>Our website''s source code is on github, check it out: <a href="https://github.com/defined/undefined/" data-ext="true">undefined</a>.</p> <p>We use the following projects; <a href="http://clojure.org">clojure</a>, <a href="https://github.com/clojure/clojurescript" data-ext="true">clojurescript</a>, <a href="http://webnoir.org" data-ext="true">noir</a>, <a href="https://github.com/ibdknox/fetch" data-ext="true">fetch</a>, <a href="https://github.com/cemerick/friend" data-ext="true">friend</a>, <a href="https://github.com/korma/Korma" data-ext="true">korma</a>, <a href="https://github.com/cgrand/enlive" data-ext="true">enlive</a>, <a href="https://github.com/ckirkendall/enfocus" data-ext="true">enfocus</a> & <a href="http://compass-style.org/" data-ext="true">compass</a>. All <a href="mailto:defined@undefined.re" data-ext="true">comments</a> are welcome.</p>', 'https://github.com/defined/undefined/', '', 3);
INSERT INTO projects (title, description, link, screenshot, pin) VALUES ('Budget Splitter', '<p>Budget Splitter is an application designed to help you share a budget on outings with friends.</p><p>Alice rented a car for the trip which cost her $75, Bob payed $50 for gas & Charlie $25 worth of pizzas. Bob also paid $15 for two cinema tickets and popcorn. Alice didn''t go and won''t be participating in that expense.</p><p>How do we equalise the expenses? Budget Splitter to the rescue!</p><p>Budget Splitter targets WebKit browsers: Iphone, Android, Chrome & Safari.</p>', '/projects/budget-splitter/index.html', '/img/budgetsplitter.png', 2);
-- INSERT INTO projects (title, description, link, screenshot, pin) VALUES ('Smriti', 'Smriti is a task manager.', '/projects/smriti/index.html', '/img/404.jpg', 1);

INSERT INTO roles (label) VALUES ('peon'), ('admin'), ('contributor');

INSERT INTO author_roles VALUES (1, 2), (2, 2);

GRANT ALL PRIVILEGES ON articles, comments, tags, authors, categories, article_tags, article_categories, article_authors, projects, roles, author_roles, tags_uid_seq, articles_uid_seq, comments_uid_seq TO web;
