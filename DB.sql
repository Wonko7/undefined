DROP TABLE IF EXISTS article_categories, article_tags, article_authors, author_roles, articles, categories, tags, authors, projects, roles, comments;

CREATE TABLE articles (uid SERIAL PRIMARY KEY, title TEXT NOT NULL, body TEXT NOT NULL, birth TIMESTAMP (0) DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE categories (uid SERIAL PRIMARY KEY, label TEXT UNIQUE NOT NULL);
CREATE TABLE tags (uid SERIAL PRIMARY KEY, label TEXT UNIQUE NOT NULL);
CREATE TABLE authors (uid SERIAL PRIMARY KEY, username TEXT UNIQUE NOT NULL, password TEXT NOT NULL, salt TEXT NOT NULL);

CREATE TABLE roles (uid SERIAL PRIMARY KEY, label TEXT UNIQUE NOT NULL);

CREATE TABLE article_categories (artid INTEGER references articles(uid) ON DELETE CASCADE, catid INTEGER references categories(uid) ON DELETE CASCADE, PRIMARY KEY (artid, catid));
CREATE TABLE article_tags (artid INTEGER references articles(uid) ON DELETE CASCADE, tagid INTEGER references tags(uid) ON DELETE CASCADE, PRIMARY KEY (artid, tagid));
CREATE TABLE article_authors (artid INTEGER references articles(uid) ON DELETE CASCADE, authid INTEGER references authors(uid) ON DELETE CASCADE, PRIMARY KEY(artid, authid));

CREATE TABLE author_roles (authid INTEGER references authors(uid) ON DELETE CASCADE, roleid INTEGER references roles(uid) ON DELETE CASCADE);

CREATE TABLE projects (uid SERIAL PRIMARY KEY, title TEXT NOT NULL, description TEXT NOT NULL, link TEXT NOT NULL, screenshot TEXT NOT NULL, pin INTEGER UNIQUE NOT NULL);

CREATE TABLE comments (uid SERIAL PRIMARY KEY, content TEXT NOT NULL, artid INTEGER references articles(uid) ON DELETE CASCADE, authid INTEGER references authors(uid), birth TIMESTAMP (0) DEFAULT CURRENT_TIMESTAMP, edit TIMESTAMP (0) DEFAULT NULL);

/*
INSERT INTO comments (content, artid, authid, birth)
	VALUES	('I am a comment', 4, 1,  '2012/02/15 14:30'::timestamp),
		('Youtube feeds on quartz', 4, 1,  '2012/03/13 15:21'::timestamp),
	       	('Unfortunately this is tree', 5, 1,  '2012/08/31 17:01'::timestamp),
		('Treehouse and blog', 5, 2,  '2012/09/05 14:08'::timestamp),
		('Where is the cat?', 5, 1,  '2012/09/27 11:26'::timestamp),
	       	('How interesting', 5, 2,  '2012/09/28 10:51'::timestamp),
		('Trolling', 4, 1,  '2012/09/30 14:30'::timestamp),
		('Your mother sucks clocks in hell', 4, 1,  '2012/10/25 15:13'::timestamp),
	       	('Forbidden clue', 5, 1,  '2012/10/26 20:07'::timestamp);*/


-- INSERT INTO articles (title, body) VALUES ('First title', E'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi id arcu tellus, non sodales dolor. Cras lorem sapien, viverra in auctor in, hendrerit ut libero. Proin adipiscing ornare leo, eget imperdiet magna fermentum et. Maecenas auctor neque vitae urna facilisis at sodales urna lacinia. Morbi auctor lorem in augue lacinia vel rhoncus felis consectetur. Phasellus in fringilla ligula. Pellentesque ac dui sed libero faucibus tempor eget a orci. Maecenas dolor mauris, blandit non sollicitudin a, condimentum non libero. Quisque congue sodales massa sed rhoncus. Proin vitae sapien ligula, ut dignissim ligula. Maecenas elit mauris, suscipit ac aliquam sit amet, malesuada in lectus. Vivamus lacinia laoreet velit, nec tempor ligula consequat non. Nunc adipiscing pulvinar tellus eu varius. Aenean metus urna, facilisis a auctor ut, gravida eu ipsum.<div class="code"> Suspendisse consectetur pulvinar ultrices.\nas \nlol \na asdddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd \n dddddddddffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff</div> Fusce at enim scelerisque erat molestie facilisis a at nibh.'), ('Second title', 'Nunc ut ante est. Phasellus cursus, arcu a vestibulum tempus, dolor risus mattis lectus, sit amet cursus justo orci nec mi. Fusce diam justo, venenatis sit amet dictum tempor, vestibulum vel odio. Fusce nisl mauris, tristique nec pellentesque ut, porta quis nulla. Phasellus quis lectus leo, et dignissim nunc. Nam enim enim, congue eu rutrum at, dapibus quis urna. Morbi placerat blandit volutpat. Donec ante ligula, tempus in lacinia eu, commodo non ante. Donec sollicitudin aliquet ultricies.'), ('Third title', 'Nunc nunc neque, dignissim ac euismod at, vehicula sit amet felis. Phasellus convallis laoreet dui, at ullamcorper lectus consequat ac. Pellentesque ut semper dui. Praesent tempus, lorem a tincidunt fringilla, quam nulla varius ante, eu lacinia mauris arcu ac turpis. Etiam arcu lacus, iaculis at lacinia in, volutpat ut lorem. In hac habitasse platea dictumst. Ut sed facilisis urna.'), ('Fourth article', 'Pellentesque ut porta quam. Donec mollis lacus at magna sodales egestas. Fusce at felis libero, eu consequat nunc. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Nullam lacinia luctus nunc, et varius erat sodales eget. Donec sed mauris a arcu malesuada auctor ut vel arcu. Nullam aliquet auctor sodales.');

-- INSERT INTO tags (label) VALUES ('Sex'),('Drugs'),('Butterflies'),('Keyboards');
INSERT INTO categories (label) VALUES ('blog'), ('news');
INSERT INTO authors (username, password, salt) VALUES ('Landolphia', '$2a$10$BaeeLnmUjxsRfa.BSc/mderQTDzFz0LhSaWzsZW0wbgtE/ArKS3x2', 'tempnull'), ('Wonko', '$2a$10$/8C.pT7tn7Y5uCEN1eWOEOHSLMh4WwG5Yp808mOMlkw4GT/AGTqdy', 'tempnull');

-- INSERT INTO article_tags VALUES (1, 1), (1, 4), (2, 2), (2, 1), (2, 4), (3, 3);
-- INSERT INTO article_categories VALUES (1, 2), (2, 1), (2, 2), (3, 1), (4, 1), (4, 2);
-- INSERT INTO article_authors VALUES (1, 1), (2, 1), (2, 2), (3, 2), (4, 1);

INSERT INTO projects (title, description, link, screenshot, pin) VALUES ('Undefined''s Webiste', '<p>Our website''s source code is on github, check it out: <a href="https://github.com/defined/undefined/" data-ext="true">undefined</a>.</p> <p>We use the following projects; <a href="http://clojure.org">clojure</a>, <a href="https://github.com/clojure/clojurescript" data-ext="true">clojurescript</a>, <a href="http://webnoir.org" data-ext="true">noir</a>, <a href="https://github.com/ibdknox/fetch" data-ext="true">fetch</a>, <a href="https://github.com/cemerick/friend" data-ext="true">friend</a>, <a href="https://github.com/korma/Korma" data-ext="true">korma</a>, <a href="https://github.com/cgrand/enlive" data-ext="true">enlive</a>, <a href="https://github.com/ckirkendall/enfocus" data-ext="true">enfocus</a> & <a href="http://compass-style.org/" data-ext="true">compass</a>. All <a href="mailto:defined@undefined.re" data-ext="true">comments</a> are welcome.</p>', 'https://github.com/defined/undefined/', '', 3);
INSERT INTO projects (title, description, link, screenshot, pin) VALUES ('Budget Splitter', '<p>Budget Splitter is an application designed to help you share a budget on outings with friends.</p><p>Alice rented a car for the trip which cost her $75, Bob payed $50 for gas & Charlie $25 worth of pizzas. Bob also paid $15 for two cinema tickets and popcorn. Alice didn''t go and won''t be participating in that expense.</p><p>How do we equalise the expenses? Budget Splitter to the rescue!</p><p>Budget Splitter targets WebKit browsers: Iphone, Android, Chrome & Safari.</p>', '/projects/budget-splitter/index.html', '/img/budgetsplitter.png', 2);
-- INSERT INTO projects (title, description, link, screenshot, pin) VALUES ('Smriti', 'Smriti is a task manager.', '/projects/smriti/index.html', '/img/404.jpg', 1);

INSERT INTO roles (label) VALUES ('peon'), ('admin'), ('contributor');

INSERT INTO author_roles VALUES (1, 2), (2, 2);

GRANT ALL PRIVILEGES ON articles, tags, authors, categories, article_tags, article_categories, article_authors, projects, roles, author_roles, tags_uid_seq, articles_uid_seq, comments_uid_seq, comments TO web;
